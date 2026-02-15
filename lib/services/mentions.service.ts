import { supabase } from '../supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MentionableUser {
  user_id: string
  first_name: string
  last_name: string
  username: string | null
  avatar_url: string | null
}

export interface Mention {
  id: number
  mentioner_user_id: string
  mentioned_user_id: string
  post_id: number | null
  comment_id: number | null
  message_id: number | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Parse @mentions from text. Returns an array of usernames found.
 * Matches @username patterns (alphanumeric + underscore).
 */
export function parseMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_]+)/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(1)))]
}

/**
 * Render text with @mentions wrapped in styled spans (returns React-compatible segments).
 */
export function segmentMentions(text: string): Array<{ type: 'text' | 'mention'; value: string }> {
  const segments: Array<{ type: 'text' | 'mention'; value: string }> = []
  const regex = /@([a-zA-Z0-9_]+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'mention', value: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class MentionsService {
  /**
   * Search for mentionable users in a club. Used for autocomplete.
   */
  async searchMentionableUsers(clubId: number, query: string): Promise<MentionableUser[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const searchTerm = `%${query}%`

    // First find members of this club matching the query
    const { data: members, error: membersErr } = await supabase
      .from('members')
      .select('user_id, first_name, last_name')
      .eq('club_id', clubId)
      .neq('user_id', user.id)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      .limit(8)

    if (membersErr || !members) return []

    // Also search by username in users table
    const { data: usersByUsername } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, avatar_url')
      .ilike('username', searchTerm)
      .neq('id', user.id)
      .limit(8)

    // Combine: get user profiles for member matches
    const memberUserIds = members.map((m) => m.user_id).filter(Boolean) as string[]
    const allUserIds = [
      ...new Set([
        ...memberUserIds,
        ...(usersByUsername ?? []).map((u) => u.id),
      ]),
    ]

    if (allUserIds.length === 0) return []

    const { data: profiles } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, avatar_url')
      .in('id', allUserIds)

    return (profiles ?? []).map((u) => ({
      user_id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      username: u.username,
      avatar_url: u.avatar_url,
    }))
  }

  /**
   * Create mention records and trigger notifications.
   * Call this after creating a post/comment/message.
   */
  async processMentions(params: {
    text: string
    clubId: number
    postId?: number
    commentId?: number
    messageId?: number
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const usernames = parseMentions(params.text)
    if (usernames.length === 0) return

    // Resolve usernames → user IDs
    const { data: mentionedUsers } = await supabase
      .from('users')
      .select('id, username')
      .in('username', usernames)

    if (!mentionedUsers || mentionedUsers.length === 0) return

    // Create mention records
    const mentionRows = mentionedUsers.map((u) => ({
      mentioner_user_id: user.id,
      mentioned_user_id: u.id,
      post_id: params.postId ?? null,
      comment_id: params.commentId ?? null,
      message_id: params.messageId ?? null,
    }))

    await supabase.from('mentions').insert(mentionRows)

    // Create in-app notifications for each mentioned user
    const { inAppNotificationsService } = await import('./in-app-notifications.service')

    for (const mentioned of mentionedUsers) {
      if (mentioned.id === user.id) continue // don't notify yourself

      const notifType = 'mention' as const
      let link: string | undefined
      let subject: string

      if (params.postId) {
        link = `/post/${params.postId}`
        subject = 'mentioned you in a post'
      } else if (params.commentId) {
        link = `/post/${params.postId}#comment-${params.commentId}`
        subject = 'mentioned you in a comment'
      } else {
        subject = 'mentioned you in a message'
      }

      await inAppNotificationsService.createNotification({
        recipientUserId: mentioned.id,
        type: notifType,
        subject,
        actorUserId: user.id,
        link,
      })
    }
  }
}

export const mentionsService = new MentionsService()
