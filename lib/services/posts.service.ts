import { supabase } from '@/lib/supabase'
import { Post, Comment, User } from '@/lib/types'

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
  page?: number
  limit?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
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

  // Posts
  async getPosts(params: PostsQueryParams = {}): Promise<ApiResponse<Post[]>> {
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

  async createPost(postData: CreatePostRequest): Promise<ApiResponse<Post>> {
    return this.makeRequest<Post>('posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  async deletePost(postId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`posts/${postId}`, {
      method: 'DELETE',
    })
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

  async createReaction(postId: number, reactionData: CreateReactionRequest): Promise<ApiResponse<any>> {
    return this.makeRequest(`posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(reactionData),
    })
  }

  async updateReaction(postId: number, reactionData: CreateReactionRequest): Promise<ApiResponse<any>> {
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
  subscribeToPosts(clubId: number, callback: (payload: any) => void) {
    return supabase
      .channel('posts')
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

  subscribeToComments(postId: number, callback: (payload: any) => void) {
    return supabase
      .channel('comments')
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

  subscribeToReactions(postId: number, callback: (payload: any) => void) {
    return supabase
      .channel('reactions')
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
}

export const postsService = new PostsService()
