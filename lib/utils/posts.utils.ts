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
export function createUserFromApi(apiUser: any): User {
  const firstName = apiUser.first_name || apiUser.raw_user_meta_data?.first_name || ''
  const lastName = apiUser.last_name || apiUser.raw_user_meta_data?.last_name || ''
  const name = firstName && lastName ? `${firstName} ${lastName}` : apiUser.email
  
  return {
    id: apiUser.id,
    name: name,
    role: 'Member', // Default role, could be enhanced with actual role data
    avatar: firstName ? firstName.charAt(0).toUpperCase() : apiUser.email.charAt(0).toUpperCase(),
    isAdmin: false, // Default, could be enhanced with actual admin status
  }
}

// Helper function to create event object from API data
export function createEventFromApi(apiEvent: any): Event {
  return {
    id: apiEvent.id.toString(),
    title: apiEvent.title,
    location: apiEvent.location || 'TBD',
    date: new Date(apiEvent.start_date).toLocaleDateString(),
    time: new Date(apiEvent.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: apiEvent.description,
  }
}

// Transform API post to frontend post format
export function transformApiPostToPost(apiPost: ApiPost): Post {
  const user = createUserFromApi(apiPost.users)
  
  // Create content object based on post type
  let content: any = {
    type: apiPost.content_type,
    text: apiPost.content_text,
  }

  // Add event data if it's an event post
  if (apiPost.content_type === 'event' && apiPost.events) {
    content.event = createEventFromApi(apiPost.events)
  }

  // Add poll data if it's a poll post
  if (apiPost.content_type === 'poll' && apiPost.poll_question && apiPost.poll_options) {
    const pollOptions = JSON.parse(apiPost.poll_options)
    const pollVotesRaw = JSON.parse(apiPost.poll_votes || '{}')
    
    // Clean up poll votes - remove user vote tracking keys and keep only vote counts
    const pollVotes: Record<string, number> = {}
    Object.keys(pollVotesRaw).forEach(key => {
      // Only include numeric keys (vote counts), skip user vote tracking keys
      if (!key.startsWith('user_') && !isNaN(Number(key))) {
        pollVotes[key] = pollVotesRaw[key]
      }
    })
    
    content.poll = {
      question: apiPost.poll_question,
      options: pollOptions,
      votes: pollVotes,
      userVote: apiPost.user_vote !== undefined ? apiPost.user_vote : null,
    }
  }

  return {
    id: apiPost.id.toString(),
    user,
    content,
    timestamp: getRelativeTime(apiPost.created_at),
    reactions: apiPost.reaction_count || 0,
    comments: apiPost.comment_count || 0,
    isLiked: false, // This would need to be determined based on user's reactions
  }
}

// Transform API comment to frontend comment format
export function transformApiCommentToComment(apiComment: ApiComment): Comment {
  const user = createUserFromApi(apiComment.users)
  
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
