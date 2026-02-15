import { supabase } from '../supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Conversation {
  id: number
  club_id: number
  title: string | null
  is_group: boolean
  created_by: string
  created_at: string
  updated_at: string
  /** Joined participants (user profiles) */
  participants: ConversationParticipant[]
  /** Latest message preview */
  last_message?: Message | null
  /** Unread count for the current user */
  unread_count?: number
}

export interface ConversationParticipant {
  id: number
  conversation_id: number
  user_id: string
  joined_at: string
  last_read_at: string | null
  /** Joined user profile */
  user?: {
    id: string
    first_name: string
    last_name: string
    username: string | null
    avatar_url: string | null
  }
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: string
  body: string
  created_at: string
  updated_at: string
  /** Joined sender profile */
  sender?: {
    id: string
    first_name: string
    last_name: string
    username: string | null
    avatar_url: string | null
  }
}

export interface CreateConversationRequest {
  club_id: number
  participant_user_ids: string[]
  title?: string
  initial_message?: string
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class MessagesService {
  /**
   * List all conversations for the current user, ordered by most recent activity.
   * Includes participant profiles and the latest message.
   */
  async getConversations(clubId?: number): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants (
          id,
          conversation_id,
          user_id,
          joined_at,
          last_read_at,
          user:users!conversation_participants_user_id_fkey (
            id, first_name, last_name, username, avatar_url
          )
        )
      `)
      .order('updated_at', { ascending: false })

    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch conversations:', error)
      return []
    }

    // Fetch the latest message for each conversation
    const conversations: Conversation[] = []
    for (const row of data ?? []) {
      const { data: lastMsgData } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            id, first_name, last_name, username, avatar_url
          )
        `)
        .eq('conversation_id', row.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Count unread messages (messages created after last_read_at)
      const myParticipation = (row.participants as ConversationParticipant[])
        ?.find((p) => p.user_id === user.id)
      let unreadCount = 0
      if (myParticipation) {
        let countQuery = supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', row.id)
          .neq('sender_id', user.id)
        if (myParticipation.last_read_at) {
          countQuery = countQuery.gt('created_at', myParticipation.last_read_at)
        }
        const { count } = await countQuery
        unreadCount = count ?? 0
      }

      conversations.push({
        ...row,
        participants: row.participants as ConversationParticipant[],
        last_message: lastMsgData as Message | null,
        unread_count: unreadCount,
      })
    }

    return conversations
  }

  /**
   * Get or create a 1:1 conversation between the current user and another user.
   */
  async getOrCreateDirectConversation(
    clubId: number,
    otherUserId: string
  ): Promise<Conversation | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Look for existing 1:1 conversation between these two users in this club
    const { data: myConversationIds } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (myConversationIds && myConversationIds.length > 0) {
      const ids = myConversationIds.map((c) => c.conversation_id)

      const { data: theirConversationIds } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', ids)

      if (theirConversationIds && theirConversationIds.length > 0) {
        const sharedIds = theirConversationIds.map((c) => c.conversation_id)

        // Find a non-group conversation in this club
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .in('id', sharedIds)
          .eq('club_id', clubId)
          .eq('is_group', false)
          .limit(1)
          .maybeSingle()

        if (existing) {
          const conversations = await this.getConversations(clubId)
          return conversations.find((c) => c.id === existing.id) ?? null
        }
      }
    }

    // No existing conversation — create one
    return this.createConversation({
      club_id: clubId,
      participant_user_ids: [otherUserId],
    })
  }

  /**
   * Create a new conversation with one or more participants.
   */
  async createConversation(req: CreateConversationRequest): Promise<Conversation | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const isGroup = req.participant_user_ids.length > 1
    const { data: convo, error: convoErr } = await supabase
      .from('conversations')
      .insert({
        club_id: req.club_id,
        title: req.title ?? null,
        is_group: isGroup,
        created_by: user.id,
      })
      .select()
      .single()

    if (convoErr || !convo) {
      console.error('Failed to create conversation:', convoErr)
      return null
    }

    // Add all participants (including the creator)
    const allUserIds = [...new Set([user.id, ...req.participant_user_ids])]
    const participantRows = allUserIds.map((uid) => ({
      conversation_id: convo.id,
      user_id: uid,
    }))

    const { error: partErr } = await supabase
      .from('conversation_participants')
      .insert(participantRows)

    if (partErr) {
      console.error('Failed to add participants:', partErr)
    }

    // Send initial message if provided
    if (req.initial_message?.trim()) {
      await this.sendMessage(convo.id, req.initial_message.trim())
    }

    // Return the full conversation object
    const conversations = await this.getConversations(req.club_id)
    return conversations.find((c) => c.id === convo.id) ?? null
  }

  /**
   * Get all messages for a conversation, ordered oldest-first.
   */
  async getMessages(conversationId: number, limit = 50, offset = 0): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id, first_name, last_name, username, avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch messages:', error)
      return []
    }

    return (data ?? []) as Message[]
  }

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId: number, body: string): Promise<Message | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body,
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id, first_name, last_name, username, avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Failed to send message:', error)
      return null
    }

    return data as Message
  }

  /**
   * Mark all messages in a conversation as read for the current user.
   */
  async markConversationRead(conversationId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
  }

  /**
   * Delete a message.
   */
  async deleteMessage(messageId: number): Promise<boolean> {
    const { error } = await supabase.from('messages').delete().eq('id', messageId)
    return !error
  }

  /**
   * Search club members for "new conversation" user picker.
   */
  async searchMembers(clubId: number, query: string): Promise<Array<{
    user_id: string
    first_name: string
    last_name: string
    username: string | null
    avatar_url: string | null
  }>> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const searchTerm = `%${query}%`

    const { data, error } = await supabase
      .from('members')
      .select('user_id, first_name, last_name')
      .eq('club_id', clubId)
      .neq('user_id', user.id)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(10)

    if (error || !data) return []

    // Fetch user profiles (username, avatar) for matched members
    const userIds = data.map((m) => m.user_id).filter(Boolean) as string[]
    if (userIds.length === 0) return []

    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, avatar_url')
      .in('id', userIds)

    const usersMap = new Map(
      (users ?? []).map((u) => [u.id, u])
    )

    return data
      .filter((m) => m.user_id && usersMap.has(m.user_id))
      .map((m) => {
        const u = usersMap.get(m.user_id!)!
        return {
          user_id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          username: u.username,
          avatar_url: u.avatar_url,
        }
      })
  }

  // ---------------------------------------------------------------------------
  // Real-time subscriptions
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to new messages in a conversation.
   */
  subscribeToMessages(conversationId: number, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch full message with sender profile
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey (
                id, first_name, last_name, username, avatar_url
              )
            `)
            .eq('id', (payload.new as { id: number }).id)
            .single()

          if (data) callback(data as Message)
        }
      )
      .subscribe()
  }

  /**
   * Subscribe to conversation list updates (new conversations, updated timestamps).
   */
  subscribeToConversations(callback: (payload: unknown) => void) {
    return supabase
      .channel('conversations:list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        callback
      )
      .subscribe()
  }

  /**
   * Remove a realtime channel.
   */
  removeChannel(channel: ReturnType<typeof supabase.channel>) {
    return supabase.removeChannel(channel)
  }
}

export const messagesService = new MessagesService()
