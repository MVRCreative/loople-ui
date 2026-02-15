import { supabase } from '../supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'mention'
  | 'comment'
  | 'reaction'
  | 'message'
  | 'follow'
  | 'system'

export interface InAppNotification {
  id: number
  user_id: string
  member_id: number | null
  type: NotificationType
  channel: 'in_app' | 'email' | 'push'
  subject: string | null
  body: string | null
  actor_user_id: string | null
  link: string | null
  read_at: string | null
  sent_at: string | null
  metadata: Record<string, unknown>
  created_at: string
  /** Joined actor profile */
  actor?: {
    id: string
    first_name: string
    last_name: string
    username: string | null
    avatar_url: string | null
  } | null
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class InAppNotificationsService {
  /**
   * Get notifications for the current user, most recent first.
   */
  async getNotifications(limit = 30, offset = 0): Promise<InAppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:users!notifications_actor_user_id_fkey (
          id, first_name, last_name, username, avatar_url
        )
      `)
      .eq('channel', 'in_app')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch notifications:', error)
      return []
    }

    return (data ?? []) as InAppNotification[]
  }

  /**
   * Count unread notifications for the current user.
   */
  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('channel', 'in_app')
      .is('read_at', null)

    if (error) {
      console.error('Failed to count unread:', error)
      return 0
    }

    return count ?? 0
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: number): Promise<void> {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
  }

  /**
   * Mark all notifications as read for the current user.
   */
  async markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('channel', 'in_app')
      .is('read_at', null)
  }

  /**
   * Create an in-app notification (e.g. when someone mentions or comments).
   */
  async createNotification(params: {
    recipientUserId: string
    type: NotificationType
    subject: string
    body?: string
    link?: string
    actorUserId?: string
    memberId?: number
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('notifications')
      .insert({
        user_id: params.recipientUserId,
        type: params.type,
        channel: 'in_app',
        subject: params.subject,
        body: params.body ?? null,
        link: params.link ?? null,
        actor_user_id: params.actorUserId ?? user?.id ?? null,
        member_id: params.memberId ?? null,
        metadata: params.metadata ?? {},
        sent_at: new Date().toISOString(),
      })
  }

  // ---------------------------------------------------------------------------
  // Real-time
  // ---------------------------------------------------------------------------

  subscribeToNotifications(userId: string, callback: (notification: InAppNotification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newRow = payload.new as { id: number }
          // Fetch with actor join
          const { data } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:users!notifications_actor_user_id_fkey (
                id, first_name, last_name, username, avatar_url
              )
            `)
            .eq('id', newRow.id)
            .single()

          if (data) callback(data as InAppNotification)
        }
      )
      .subscribe()
  }

  removeChannel(channel: ReturnType<typeof supabase.channel>) {
    return supabase.removeChannel(channel)
  }
}

export const inAppNotificationsService = new InAppNotificationsService()
