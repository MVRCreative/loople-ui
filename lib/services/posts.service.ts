import { supabase } from '@/lib/supabase'
import { Post, Comment } from '@/lib/types'

export interface CreatePostRequest {
  club_id: number
  content_type: 'text' | 'event' | 'poll'
  content_text: string
  event_id?: number
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

  // Posts
  async getPosts(params: PostsQueryParams = {}): Promise<ApiResponse<Post[]>> {
    // Try edge function first
    const edgeResult = await this.getPostsViaEdge(params)
    if (edgeResult.success) return edgeResult

    // Fall back to direct Supabase query
    console.warn('Posts edge function unavailable, using direct query')
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

      const sortBy = params.sort_by || 'created_at'
      const ascending = params.sort_order === 'asc'
      query = query.order(sortBy, { ascending })
      query = query.limit(params.limit ?? 20)

      const { data, error } = await query
      if (error) throw error

      // Transform DB rows → frontend Post shape
      const posts: Post[] = (data ?? []).map((row) => {
        const author = row.author as { id: number; first_name: string; last_name: string; email: string; user_id: string } | null
        const commentCount = Array.isArray(row.comments) ? row.comments.length : 0
        const likeCount = Array.isArray(row.reactions) ? row.reactions.length : 0

        return {
          id: row.id,
          club_id: row.club_id,
          content_type: row.kind === 'post' ? 'text' : row.kind,
          content_text: row.body ?? '',
          user_id: author?.user_id ?? '',
          author_name: author ? `${author.first_name} ${author.last_name}` : 'Unknown',
          author_avatar: null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          comments_count: commentCount,
          reactions_count: likeCount,
          event_id: row.event_id,
          program_id: row.program_id,
        } as unknown as Post
      })

      return { success: true, data: posts }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load posts',
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
        })
        .select()
        .single()

      if (error) throw error

      // Return a shape that the frontend expects
      const post = {
        id: data.id,
        club_id: data.club_id,
        content_type: postData.content_type,
        content_text: data.body,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as unknown as Post

      return { success: true, data: post }
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
    return this.makeRequest<Comment>(`posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    })
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
