import { supabase } from '@/lib/supabase'
import { Post, Comment, ApiPost, ApiComment } from '@/lib/types'
import { transformApiCommentToComment, transformApiPostToPost } from '@/lib/utils/posts.utils'

export interface CreatePostRequest {
  club_id: number
  content_type: 'text' | 'event' | 'poll'
  content_text: string
  event_id?: number
  program_id?: number
  poll_question?: string
  poll_options?: string[]
}

export interface CreateCommentRequest {
  post_id: number
  content: string
  parent_comment_id?: number
}

export interface CreateReactionRequest {
  post_id?: number
  comment_id?: number
  reaction_type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
}

export interface PollVoteRequest {
  post_id: number
  option_index: number
}

export interface PostsQueryParams {
  club_id?: number
  user_id?: string
  content_type?: string
  event_id?: number
  program_id?: number
  page?: number
  limit?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  date_from?: string
  date_to?: string
  has_media?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class PostsService {
  private async getCurrentUserProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, username, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching current user profile for post fallback:', error)
      return null
    }

    return profile
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...options.headers,
        },
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Request failed')
      }

      return result
    } catch (error) {
      console.error('API request error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Find the member_id for the current auth user within a given club.
   * Required for writing to the posts table (author_member_id FK).
   */
  private async getMemberIdForCurrentUser(clubId: number): Promise<number | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    return data?.id ?? null
  }

  private async canAccessProgramPosts(clubId: number, programId: number): Promise<boolean> {
    const { data: program, error } = await supabase
      .from('programs')
      .select('id, club_id, visibility')
      .eq('id', programId)
      .eq('club_id', clubId)
      .maybeSingle()

    if (error) {
      console.error('Error checking program access:', error)
      return false
    }
    if (!program) return false

    const visibility = (program.visibility as string | null) ?? 'public'
    if (visibility === 'public') return true

    const memberId = await this.getMemberIdForCurrentUser(clubId)
    if (!memberId) return false

    const { data: membership, error: membershipError } = await supabase
      .from('program_memberships')
      .select('id, status')
      .eq('program_id', programId)
      .eq('member_id', memberId)
      .eq('status', 'active')
      .maybeSingle()

    if (membershipError) {
      console.error('Error checking program membership for post access:', membershipError)
      return false
    }

    return !!membership
  }

  // Posts
  async getPosts(params: PostsQueryParams = {}): Promise<ApiResponse<Post[]>> {
    return this.getPostsDirect(params)
  }

  private async getPostsViaEdge(params: PostsQueryParams): Promise<ApiResponse<Post[]>> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const queryString = searchParams.toString()
    const endpoint = `posts${queryString ? `?${queryString}` : ''}`
    
    return this.makeRequest<Post[]>(endpoint)
  }

  private async getPostsDirect(params: PostsQueryParams): Promise<ApiResponse<Post[]>> {
    try {
      const currentUserProfile = await this.getCurrentUserProfile()

      let query = supabase
        .from('posts')
        .select(`
          *,
          author:members!posts_author_member_id_fkey (
            id, first_name, last_name, email, user_id
          ),
          comments:post_comments (id),
          reactions:post_reactions (kind)
        `)

      if (params.club_id) query = query.eq('club_id', params.club_id)
      if (params.event_id) query = query.eq('event_id', params.event_id)
      if (params.program_id) {
        const clubIdForAccess = params.club_id
        if (!clubIdForAccess) {
          return {
            success: false,
            error: 'club_id is required when filtering posts by program_id',
          }
        }
        const hasProgramAccess = await this.canAccessProgramPosts(clubIdForAccess, params.program_id)
        if (!hasProgramAccess) {
          return { success: true, data: [] }
        }
        query = query.eq('program_id', params.program_id)
      }

      const sortBy = params.sort_by || 'created_at'
      const ascending = params.sort_order === 'asc'
      query = query.order(sortBy, { ascending })
      query = query.limit(params.limit ?? 20)

      const { data, error } = await query
      if (error) throw error

      // Look up profile data for each linked user_id from the users table.
      const userIds = [...new Set(
        (data ?? [])
          .map((row) => (row.author as { user_id?: string } | null)?.user_id)
          .filter((id): id is string => Boolean(id))
      )]

      let usersMap: Record<string, {
        id: string
        email?: string | null
        first_name?: string | null
        last_name?: string | null
        avatar_url?: string | null
        username?: string | null
      }> = {}
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, avatar_url, username')
          .in('id', userIds)

        if (usersData) {
          usersMap = Object.fromEntries(
            usersData.map((u) => [u.id, u])
          )
        }
      }

      // Transform DB rows → ApiPost shape so transformApiPostsToPosts works correctly
      const apiPosts: ApiPost[] = (data ?? []).map((row) => {
        const author = row.author as { id: number; first_name: string; last_name: string; email: string; user_id: string } | null
        const commentCount = Array.isArray(row.comments) ? row.comments.length : 0
        const likeCount = Array.isArray(row.reactions) ? row.reactions.length : 0
        const linkedUser = author?.user_id ? usersMap[author.user_id] : undefined
        const isCurrentUserAuthor =
          !!currentUserProfile &&
          !author?.user_id &&
          (
            (
              !!author?.first_name &&
              !!author?.last_name &&
              author.first_name.toLowerCase() === String(currentUserProfile.first_name ?? '').toLowerCase() &&
              author.last_name.toLowerCase() === String(currentUserProfile.last_name ?? '').toLowerCase()
            ) ||
            (
              !!author?.email &&
              author.email.toLowerCase() === String(currentUserProfile.email ?? '').toLowerCase()
            )
          )

        const resolvedUser = linkedUser ?? (isCurrentUserAuthor ? currentUserProfile : undefined)

        return {
          id: row.id,
          club_id: row.club_id,
          program_id: row.program_id ?? undefined,
          user_id: author?.user_id ?? '',
          content_type: row.kind === 'post' ? 'text' : row.kind === 'event_update' ? 'event' : 'text',
          content_text: row.body ?? '',
          is_active: true,
          created_at: row.created_at,
          updated_at: row.updated_at,
          event_id: row.event_id ?? undefined,
          reaction_count: likeCount,
          comment_count: commentCount,
          // Provide `users` object so transformApiPostToPost can build proper User display
          users: author ? {
            id: resolvedUser?.id ?? author.user_id ?? '',
            email: resolvedUser?.email ?? author.email ?? '',
            first_name: resolvedUser?.first_name ?? author.first_name ?? '',
            last_name: resolvedUser?.last_name ?? author.last_name ?? '',
            avatar_url: resolvedUser?.avatar_url ?? undefined,
            username: resolvedUser?.username ?? undefined,
          } : undefined,
          // Include poll data from the `rich` JSONB column
          ...(row.rich && typeof row.rich === 'object' && 'poll' in (row.rich as Record<string, unknown>)
            ? {
                poll_question: ((row.rich as Record<string, unknown>).poll as Record<string, unknown>)?.question as string,
                poll_options: JSON.stringify(((row.rich as Record<string, unknown>).poll as Record<string, unknown>)?.options ?? []),
              }
            : {}),
        } as unknown as ApiPost
      })

      // Return as Post[] type to satisfy the interface, but the data is actually ApiPost[]
      // The caller (newsfeed.tsx) will cast it through transformApiPostsToPosts
      return { success: true, data: apiPosts as unknown as Post[] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load posts',
      }
    }
  }

  /**
   * Single post by id (same shape as club feed) + like count (kind=like) + user_has_liked.
   */
  async getPostById(postId: number): Promise<ApiResponse<Post>> {
    try {
      const currentUserProfile = await this.getCurrentUserProfile()
      const { data: row, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:members!posts_author_member_id_fkey (
            id, first_name, last_name, email, user_id
          ),
          comments:post_comments (id),
          reactions:post_reactions (kind, member_id)
        `)
        .eq('id', postId)
        .maybeSingle()

      if (error) throw error
      if (!row) {
        return { success: false, error: 'Post not found' }
      }

      const { data: { user } } = await supabase.auth.getUser()
      const myMemberIds = new Set<number>()
      if (user?.id && row.club_id != null) {
        const { data: memberRows } = await supabase
          .from('members')
          .select('id')
          .eq('club_id', row.club_id)
          .eq('user_id', user.id)
        for (const m of memberRows ?? []) {
          if (typeof m.id === 'number') myMemberIds.add(m.id)
        }
      }

      const reactions = (row.reactions as { kind?: string; member_id?: number }[]) ?? []
      const likeReactions = reactions.filter((r) => r.kind === 'like')
      const userHasLiked = likeReactions.some(
        (r) => r.member_id != null && myMemberIds.has(r.member_id),
      )

      const author = row.author as {
        id: number
        first_name: string
        last_name: string
        email: string
        user_id: string
      } | null
      const commentCount = Array.isArray(row.comments) ? row.comments.length : 0

      let usersMap: Record<string, {
        id: string
        email?: string | null
        first_name?: string | null
        last_name?: string | null
        avatar_url?: string | null
        username?: string | null
      }> = {}
      if (author?.user_id) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, avatar_url, username')
          .eq('id', author.user_id)
          .maybeSingle()
        if (usersData) {
          usersMap = { [usersData.id]: usersData }
        }
      }

      const linkedUser = author?.user_id ? usersMap[author.user_id] : undefined
      const isCurrentUserAuthor =
        !!currentUserProfile &&
        !author?.user_id &&
        (
          (
            !!author?.first_name &&
            !!author?.last_name &&
            author.first_name.toLowerCase() === String(currentUserProfile.first_name ?? '').toLowerCase() &&
            author.last_name.toLowerCase() === String(currentUserProfile.last_name ?? '').toLowerCase()
          ) ||
          (
            !!author?.email &&
            author.email.toLowerCase() === String(currentUserProfile.email ?? '').toLowerCase()
          )
        )
      const resolvedUser = linkedUser ?? (isCurrentUserAuthor ? currentUserProfile : undefined)

      const apiPost = {
        id: row.id,
        club_id: row.club_id,
        program_id: row.program_id ?? undefined,
        user_id: author?.user_id ?? '',
        content_type: row.kind === 'post' ? 'text' : row.kind === 'event_update' ? 'event' : 'text',
        content_text: row.body ?? '',
        is_active: true,
        created_at: row.created_at,
        updated_at: row.updated_at,
        event_id: row.event_id ?? undefined,
        reaction_count: likeReactions.length,
        comment_count: commentCount,
        users: author
          ? {
              id: resolvedUser?.id ?? author.user_id ?? '',
              email: resolvedUser?.email ?? author.email ?? '',
              first_name: resolvedUser?.first_name ?? author.first_name ?? '',
              last_name: resolvedUser?.last_name ?? author.last_name ?? '',
              avatar_url: resolvedUser?.avatar_url ?? undefined,
              username: resolvedUser?.username ?? undefined,
            }
          : undefined,
        ...(row.rich && typeof row.rich === 'object' && 'poll' in (row.rich as Record<string, unknown>)
          ? {
              poll_question: ((row.rich as Record<string, unknown>).poll as Record<string, unknown>)
                ?.question as string,
              poll_options: JSON.stringify(
                ((row.rich as Record<string, unknown>).poll as Record<string, unknown>)?.options ?? [],
              ),
            }
          : {}),
      } as ApiPost

      const mediaResp = await this.getMediaAttachments(postId)
      if (mediaResp.success && mediaResp.data?.length) {
        ;(apiPost as { media_attachments?: typeof mediaResp.data }).media_attachments = mediaResp.data
      }

      const post = transformApiPostToPost(apiPost)
      return {
        success: true,
        data: { ...post, isLiked: userHasLiked },
      }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to load post',
      }
    }
  }

  /**
   * Comments for a post (Supabase direct; same join pattern as mobile).
   */
  async getCommentsDirect(postId: number): Promise<ApiResponse<Comment[]>> {
    try {
      const { data: rows, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      const list = rows ?? []
      const memberIds = [
        ...new Set(
          list
            .map((r) => (r as { author_member_id?: number }).author_member_id)
            .filter((id): id is number => typeof id === 'number'),
        ),
      ]

      const membersMap: Record<number, {
        id: number
        first_name: string
        last_name: string
        email: string
        user_id: string | null
      }> = {}
      if (memberIds.length > 0) {
        const { data: mems } = await supabase
          .from('members')
          .select('id, first_name, last_name, email, user_id')
          .in('id', memberIds)
        for (const m of mems ?? []) {
          membersMap[m.id as number] = m as (typeof membersMap)[number]
        }
      }

      const userIds = [
        ...new Set(
          Object.values(membersMap)
            .map((m) => m.user_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ]
      let usersMap: Record<string, {
        id: string
        email?: string | null
        first_name?: string | null
        last_name?: string | null
        avatar_url?: string | null
        username?: string | null
      }> = {}
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, avatar_url, username')
          .in('id', userIds)
        if (usersData) {
          usersMap = Object.fromEntries(usersData.map((u) => [u.id, u]))
        }
      }

      const apiComments: ApiComment[] = list.map((raw) => {
        const r = raw as Record<string, unknown>
        const mid = r.author_member_id as number | undefined
        const mem = mid != null ? membersMap[mid] : null
        const u = mem?.user_id ? usersMap[mem.user_id] : null
        const text =
          String(r.body ?? r.content ?? r.text ?? '')
        return {
          id: r.id as number,
          post_id: r.post_id as number,
          user_id: mem?.user_id ?? '',
          parent_comment_id: (r.parent_comment_id as number | undefined) ?? undefined,
          content: text,
          is_active: true,
          created_at: String(r.created_at ?? ''),
          updated_at: String(r.updated_at ?? r.created_at ?? ''),
          users: mem
            ? {
                id: u?.id ?? mem.user_id ?? '',
                email: u?.email ?? mem.email ?? '',
                first_name: u?.first_name ?? mem.first_name ?? '',
                last_name: u?.last_name ?? mem.last_name ?? '',
                avatar_url: u?.avatar_url ?? undefined,
                username: u?.username ?? undefined,
              }
            : undefined,
        }
      })

      const comments = apiComments.map(transformApiCommentToComment)
      return { success: true, data: comments }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to load comments',
      }
    }
  }

  private async createCommentDirect(
    postId: number,
    content: string,
    parentCommentId?: number,
  ): Promise<ApiResponse<Comment>> {
    try {
      const { data: postRow, error: pe } = await supabase
        .from('posts')
        .select('club_id')
        .eq('id', postId)
        .maybeSingle()
      if (pe || !postRow?.club_id) {
        return { success: false, error: 'Post not found' }
      }
      const memberId = await this.getMemberIdForCurrentUser(postRow.club_id as number)
      if (!memberId) {
        return { success: false, error: 'You must be a member of this club to comment.' }
      }

      const insertPayload: Record<string, unknown> = {
        post_id: postId,
        author_member_id: memberId,
        body: content,
      }
      if (parentCommentId != null) insertPayload.parent_comment_id = parentCommentId

      let ins = await supabase.from('post_comments').insert(insertPayload).select('*').single()
      if (ins.error && String(ins.error.message).toLowerCase().includes('body')) {
        const alt = { ...insertPayload }
        delete alt.body
        alt.content = content
        ins = await supabase.from('post_comments').insert(alt).select('*').single()
      }
      if (ins.error) throw ins.error
      const r = ins.data as Record<string, unknown>
      const apiComment: ApiComment = {
        id: r.id as number,
        post_id: r.post_id as number,
        user_id: '',
        parent_comment_id: (r.parent_comment_id as number | undefined) ?? undefined,
        content: String(r.body ?? r.content ?? r.text ?? ''),
        is_active: true,
        created_at: String(r.created_at ?? ''),
        updated_at: String(r.updated_at ?? r.created_at ?? ''),
      }
      const memId = r.author_member_id as number | undefined
      if (memId) {
        const { data: mem } = await supabase
          .from('members')
          .select('id, first_name, last_name, email, user_id')
          .eq('id', memId)
          .maybeSingle()
        if (mem?.user_id) {
          const { data: u } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, avatar_url, username')
            .eq('id', mem.user_id)
            .maybeSingle()
          apiComment.user_id = mem.user_id
          apiComment.users = {
            id: u?.id ?? mem.user_id,
            email: u?.email ?? mem.email ?? '',
            first_name: u?.first_name ?? mem.first_name ?? '',
            last_name: u?.last_name ?? mem.last_name ?? '',
            avatar_url: u?.avatar_url ?? undefined,
            username: u?.username ?? undefined,
          }
        }
      }
      return { success: true, data: transformApiCommentToComment(apiComment) }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to create comment',
      }
    }
  }

  async createPost(postData: CreatePostRequest): Promise<ApiResponse<Post>> {
    // Try edge function first
    const edgeResult = await this.makeRequest<Post>('posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
    if (edgeResult.success) return edgeResult

    // Fall back to direct insert
    console.warn('Posts edge function unavailable, using direct insert')
    return this.createPostDirect(postData)
  }

  private async createPostDirect(postData: CreatePostRequest): Promise<ApiResponse<Post>> {
    try {
      const memberId = await this.getMemberIdForCurrentUser(postData.club_id)
      if (!memberId) {
        return { success: false, error: 'You must be a member of this club to post.' }
      }
      if (postData.program_id) {
        const canAccessProgram = await this.canAccessProgramPosts(postData.club_id, postData.program_id)
        if (!canAccessProgram) {
          return {
            success: false,
            error: 'You do not have access to post in this program.',
          }
        }
      }

      // Map content_type to post kind
      const kind = postData.content_type === 'text' ? 'post'
        : postData.content_type === 'event' ? 'event_update'
        : postData.content_type === 'poll' ? 'post'
        : 'post'

      const richContent: Record<string, unknown> = {}
      if (postData.poll_question && postData.poll_options) {
        richContent.poll = {
          question: postData.poll_question,
          options: postData.poll_options,
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          club_id: postData.club_id,
          author_member_id: memberId,
          kind,
          body: postData.content_text,
          rich: Object.keys(richContent).length > 0 ? richContent : null,
          event_id: postData.event_id ?? null,
          program_id: postData.program_id ?? null,
        })
        .select()
        .single()

      if (error) throw error

      // Fetch author info (member + user) so the frontend can display name/avatar
      const { data: memberData } = await supabase
        .from('members')
        .select('id, first_name, last_name, email, user_id')
        .eq('id', memberId)
        .single()

      let userData: { avatar_url?: string; username?: string } = {}
      if (memberData?.user_id) {
        const { data: userRow } = await supabase
          .from('users')
          .select('avatar_url, username')
          .eq('id', memberData.user_id)
          .single()
        if (userRow) userData = userRow
      }

      // Return ApiPost-shaped data so transformApiPostToPost can build proper User
      const apiPost = {
        id: data.id,
        club_id: data.club_id,
        program_id: data.program_id ?? undefined,
        user_id: memberData?.user_id ?? '',
        content_type: postData.content_type,
        content_text: data.body ?? '',
        is_active: true,
        created_at: data.created_at,
        updated_at: data.updated_at,
        event_id: data.event_id ?? undefined,
        reaction_count: 0,
        comment_count: 0,
        users: memberData ? {
          id: memberData.user_id ?? '',
          email: memberData.email ?? '',
          first_name: memberData.first_name ?? '',
          last_name: memberData.last_name ?? '',
          avatar_url: userData.avatar_url,
          username: userData.username,
        } : undefined,
      } as unknown as Post

      return { success: true, data: apiPost }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post',
      }
    }
  }

  async updatePost(postId: number, postData: CreatePostRequest): Promise<ApiResponse<Post>> {
    return this.makeRequest<Post>(`posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    })
  }

  async deletePost(postId: number): Promise<ApiResponse<{ success: boolean }>> {
    // Try edge function first
    const edgeResult = await this.makeRequest<{ success: boolean }>(`posts/${postId}`, {
      method: 'DELETE',
    })
    if (edgeResult.success) return edgeResult

    // Fall back to direct delete
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      return { success: true, data: { success: true } }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete post',
      }
    }
  }

  // Comments
  async getComments(postId: number, params: { page?: number; limit?: number } = {}): Promise<ApiResponse<Comment[]>> {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const queryString = searchParams.toString()
    const endpoint = `posts/${postId}/comments${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<Comment[]>(endpoint)
  }

  async createComment(postId: number, commentData: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    const edge = await this.makeRequest<Comment>(`posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    })
    if (edge.success) return edge
    return this.createCommentDirect(postId, commentData.content, commentData.parent_comment_id)
  }

  async deleteComment(commentId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`posts/comments/${commentId}`, {
      method: 'DELETE',
    })
  }

  // Reactions
  async getReactions(postId: number): Promise<ApiResponse<{
    total: number
    by_type: Record<string, number>
    user_reaction: string | null
  }>> {
    return this.makeRequest(`posts/${postId}/reactions`)
  }

  async createReaction(postId: number, reactionData: CreateReactionRequest): Promise<ApiResponse<unknown>> {
    return this.makeRequest(`posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(reactionData),
    })
  }

  async updateReaction(postId: number, reactionData: CreateReactionRequest): Promise<ApiResponse<unknown>> {
    return this.makeRequest(`posts/${postId}/reactions`, {
      method: 'PUT',
      body: JSON.stringify(reactionData),
    })
  }

  async deleteReaction(postId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`posts/${postId}/reactions`, {
      method: 'DELETE',
    })
  }

  // Polls
  async getPollResults(postId: number): Promise<ApiResponse<{
    question: string
    options: Array<{ option: string; index: number; votes: number }>
    total_votes: number
    user_vote: number | null
  }>> {
    return this.makeRequest(`polls?post_id=${postId}`)
  }

  async voteOnPoll(voteData: PollVoteRequest): Promise<ApiResponse<{
    success: boolean
    option_index: number
    new_vote_count: number
    total_votes: number
  }>> {
    return this.makeRequest('polls', {
      method: 'POST',
      body: JSON.stringify(voteData),
    })
  }

  // Real-time subscriptions
  subscribeToPosts(clubId: number, callback: (payload: unknown) => void) {
    return supabase
      .channel(`posts:${clubId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `club_id=eq.${clubId}`,
        },
        callback
      )
      .subscribe()
  }

  subscribeToComments(postId: number, callback: (payload: unknown) => void) {
    return supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        callback
      )
      .subscribe()
  }

  subscribeToReactions(postId: number, callback: (payload: unknown) => void) {
    return supabase
      .channel(`reactions:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `post_id=eq.${postId}`,
        },
        callback
      )
      .subscribe()
  }

  // Cleanup helper for realtime channels
  removeChannel(channel: unknown) {
    // supabase.removeChannel expects a RealtimeChannel instance; keep type loose to avoid import coupling
    // @ts-expect-error - channel type is intentionally loose to avoid import coupling
    return supabase.removeChannel(channel as { unsubscribe: () => void })
  }

  // Media Attachments
  async uploadMedia(postId: number, file: File): Promise<ApiResponse<{
    id: number
    file_name: string
    file_path: string
    file_size: number
    mime_type: string
    file_type: string
  }>> {
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${postId}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get public URL (not used in this function but available for future use)
      // const { data: { publicUrl } } = supabase.storage
      //   .from('post-media')
      //   .getPublicUrl(fileName)

      // Create media attachment record
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          file_type: file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'document'
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create media attachment')
      }

      return result
    } catch (error) {
      console.error('Media upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Create media attachment record from an external URL (e.g., UploadThing)
  async createMediaFromUrl(postId: number, params: {
    file_url: string
    file_name: string
    file_size: number
    mime_type: string
  }): Promise<ApiResponse<{
    id: number
    file_name: string
    file_path: string
    file_size: number
    mime_type: string
    file_type: string
  }>> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          post_id: postId,
          file_name: params.file_name,
          file_path: params.file_url, // store external URL directly
          file_size: params.file_size,
          mime_type: params.mime_type,
          file_type: params.mime_type.startsWith('image/') ? 'image' :
                     params.mime_type.startsWith('video/') ? 'video' : 'document'
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create media attachment from URL')
      }
      return result
    } catch (error) {
      console.error('Create media from URL error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getMediaAttachments(postId: number): Promise<ApiResponse<{
    id: number
    file_name: string
    file_path: string
    file_size: number
    mime_type: string
    file_type: string
    created_at: string
  }[]>> {
    return this.makeRequest(`media?post_id=${postId}`)
  }

  async deleteMediaAttachment(attachmentId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`media/${attachmentId}`, {
      method: 'DELETE',
    })
  }
}

export const postsService = new PostsService()
