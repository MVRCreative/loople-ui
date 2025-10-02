import { ApiPost, ApiComment, Post, Comment, User, Event } from '@/lib/types'

// Helper function to get relative time
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Helper function to create user object from API data
export function createUserFromApi(apiUser: Record<string, unknown>): User {
  // Support multiple shapes: auth.users (raw_user_meta_data or user_metadata), custom profiles, or edge function aliases
  const rawMeta = (apiUser.raw_user_meta_data as Record<string, unknown>)
    || (apiUser.user_metadata as Record<string, unknown>)
    || {}

  const firstName = (apiUser.first_name as string)
    || (rawMeta.first_name as string)
    || (rawMeta.firstName as string)
    || ''

  const lastName = (apiUser.last_name as string)
    || (rawMeta.last_name as string)
    || (rawMeta.lastName as string)
    || ''

  const fullNameFromMeta = (rawMeta.full_name as string)
    || (apiUser.full_name as string)
    || ''

  const email = (apiUser.email as string)
    || (rawMeta.email as string)
    || (apiUser.user_email as string)
    || ''

  const displayName = (firstName || lastName)
    ? `${firstName} ${lastName}`.trim()
    : (fullNameFromMeta || email || 'Unknown User')

  const avatarInitialSource = firstName || fullNameFromMeta || email || 'U'
  const avatarInitial = avatarInitialSource.charAt(0).toUpperCase()
  
  return {
    id: (apiUser.id as string) || (apiUser.user_id as string) || '',
    name: displayName,
    role: 'Member', // Default role, could be enhanced with actual role data
    avatar: avatarInitial,
    isAdmin: false, // Default, could be enhanced with actual admin status
  }
}

// Helper function to create event object from API data
export function createEventFromApi(apiEvent: Record<string, unknown>): Event {
  return {
    id: (apiEvent.id as number).toString(),
    title: apiEvent.title as string,
    location: (apiEvent.location as string) || 'TBD',
    date: new Date(apiEvent.start_date as string).toLocaleDateString(),
    time: new Date(apiEvent.start_date as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: apiEvent.description as string,
  }
}

// Transform API post to frontend post format
export function transformApiPostToPost(apiPost: ApiPost): Post {
  // Prefer joined users object; fallback to top-level apiPost when functions include user fields inline
  const user = createUserFromApi((apiPost as unknown as Record<string, unknown>).users as Record<string, unknown> || (apiPost as unknown as Record<string, unknown>))
  
  // Create content object based on post type
  const content = {
    type: apiPost.content_type,
    text: apiPost.content_text,
  } as unknown

  // Add event data when event join is available (regardless of content_type)
  if (apiPost.events) {
    (content as Record<string, unknown>).event = createEventFromApi(apiPost.events)
  }

  // Add poll data when poll fields are present
  if (apiPost.poll_question && apiPost.poll_options) {
    let pollOptions: string[] = []
    try {
      pollOptions = JSON.parse(apiPost.poll_options)
    } catch {
      // keep empty if parsing fails
    }
    let pollVotesRaw: Record<string, number> = {}
    try {
      pollVotesRaw = JSON.parse(apiPost.poll_votes || '{}') as Record<string, number>
    } catch {
      // keep empty if parsing fails
    }
    
    // Clean up poll votes - remove user vote tracking keys and keep only vote counts
    const pollVotes: Record<string, number> = {}
    for (const key in pollVotesRaw) {
      // Only include numeric keys (vote counts), skip user vote tracking keys
      if (!key.startsWith('user_') && !isNaN(Number(key))) {
        pollVotes[key] = pollVotesRaw[key]
      }
    }
    
    (content as Record<string, unknown>).poll = {
      question: apiPost.poll_question,
      options: pollOptions,
      votes: pollVotes,
      userVote: apiPost.user_vote !== undefined ? apiPost.user_vote : null,
    }
  }

  return {
    id: apiPost.id.toString(),
    user,
    content: content as { type: "text" | "event" | "poll"; text: string; event?: Event; poll?: { question: string; options: string[]; votes: Record<string, number>; userVote: number | null } },
    timestamp: getRelativeTime(apiPost.created_at),
    reactions: apiPost.reaction_count || 0,
    comments: apiPost.comment_count || 0,
    isLiked: false, // This would need to be determined based on user's reactions
    media_attachments: apiPost.media_attachments || [], // Include media attachments
  }
}

// Transform API comment to frontend comment format
export function transformApiCommentToComment(apiComment: ApiComment): Comment {
  const user = createUserFromApi(apiComment.users || {})
  
  return {
    id: apiComment.id.toString(),
    postId: apiComment.post_id.toString(),
    user,
    content: apiComment.content,
    timestamp: getRelativeTime(apiComment.created_at),
    reactions: 0, // Comments don't have reactions in current implementation
  }
}

// Transform multiple API posts to frontend posts
export function transformApiPostsToPosts(apiPosts: ApiPost[]): Post[] {
  return apiPosts.map(transformApiPostToPost)
}

// Transform multiple API comments to frontend comments
export function transformApiCommentsToComments(apiComments: ApiComment[]): Comment[] {
  return apiComments.map(transformApiCommentToComment)
}
