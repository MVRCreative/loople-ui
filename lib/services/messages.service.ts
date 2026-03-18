import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import type {
  Conversation,
  ConversationUpdateEvent,
  DirectConversationResult,
  Message,
  MessageCursorPage,
  MessageSearchResult,
  MessageUserSummary,
  ReadReceiptResult,
  TypingEventPayload,
} from '../types/messages'

type JsonRecord = Record<string, unknown>

interface BroadcastPayload {
  payload?: JsonRecord
  new?: JsonRecord
  old?: JsonRecord
  new_record?: JsonRecord
  old_record?: JsonRecord
  record?: JsonRecord
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' ? (value as JsonRecord) : null
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number.parseInt(value, 10)
  return 0
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toBoolean(value: unknown): boolean {
  return value === true
}

function toUserSummary(value: unknown): MessageUserSummary | null {
  const record = asRecord(value)
  if (!record) return null

  return {
    id: toStringOrNull(record.id) ?? '',
    first_name: toStringOrNull(record.first_name) ?? '',
    last_name: toStringOrNull(record.last_name) ?? '',
    username: toStringOrNull(record.username),
    avatar_url: toStringOrNull(record.avatar_url),
  }
}

function toMessage(value: unknown): Message {
  const record = asRecord(value) ?? {}

  return {
    id: toNumber(record.id),
    conversation_id: toNumber(record.conversation_id),
    sender_id: toStringOrNull(record.sender_id) ?? '',
    body: toStringOrNull(record.body) ?? '',
    created_at: toStringOrNull(record.created_at) ?? new Date(0).toISOString(),
    updated_at: toStringOrNull(record.updated_at) ?? new Date(0).toISOString(),
    client_id: toStringOrNull(record.client_id),
    sender: toUserSummary(record.sender),
    delivery_state: 'sent',
  }
}

function toConversation(value: unknown): Conversation {
  const record = asRecord(value) ?? {}
  const participantsValue = Array.isArray(record.participants) ? record.participants : []

  return {
    id: toNumber(record.id),
    club_id: toNumber(record.club_id),
    title: toStringOrNull(record.title),
    is_group: toBoolean(record.is_group),
    created_by: toStringOrNull(record.created_by) ?? '',
    created_at: toStringOrNull(record.created_at) ?? new Date(0).toISOString(),
    updated_at: toStringOrNull(record.updated_at) ?? new Date(0).toISOString(),
    direct_key: toStringOrNull(record.direct_key),
    unread_count: toNumber(record.unread_count),
    participants: participantsValue.map((participant) => {
      const participantRecord = asRecord(participant) ?? {}
      return {
        id: toNumber(participantRecord.id),
        conversation_id: toNumber(participantRecord.conversation_id),
        user_id: toStringOrNull(participantRecord.user_id) ?? '',
        joined_at: toStringOrNull(participantRecord.joined_at) ?? new Date(0).toISOString(),
        last_read_at: toStringOrNull(participantRecord.last_read_at),
        last_read_message_id:
          participantRecord.last_read_message_id == null
            ? null
            : toNumber(participantRecord.last_read_message_id),
        user: toUserSummary(participantRecord.user),
      }
    }),
    last_message: record.last_message ? toMessage(record.last_message) : null,
  }
}

function extractRealtimePayload(payload: unknown): JsonRecord | null {
  const payloadRecord = asRecord(payload)
  if (!payloadRecord) return null

  const nestedPayload = asRecord(payloadRecord.payload)
  return nestedPayload ?? payloadRecord
}

function extractRowId(payload: unknown): number | null {
  const payloadRecord = extractRealtimePayload(payload)
  if (!payloadRecord) {
    console.warn('[messages] extractRowId: could not unwrap payload', payload)
    return null
  }

  const newRecord =
    asRecord(payloadRecord.new_record) ??
    asRecord(payloadRecord.new) ??
    asRecord(payloadRecord.record)
  if (newRecord?.id != null) return toNumber(newRecord.id)

  const oldRecord =
    asRecord(payloadRecord.old_record) ?? asRecord(payloadRecord.old)
  if (oldRecord?.id != null) return toNumber(oldRecord.id)

  if (payloadRecord.id != null) return toNumber(payloadRecord.id)

  console.warn('[messages] extractRowId: no message id found in payload', payloadRecord)
  return null
}

async function ensureRealtimeAuth(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error('Realtime authentication requires an active session.')
  }

  await supabase.realtime.setAuth(accessToken)
}

async function waitForSubscription(channel: RealtimeChannel): Promise<RealtimeChannel> {
  return new Promise((resolve, reject) => {
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.info('[messages] channel subscribed:', channel.topic)
        resolve(channel)
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        const isConnectionClose = err === undefined
        if (isConnectionClose) {
          console.warn('[messages] realtime connection closed for channel:', channel.topic, '(will reconnect)')
        } else {
          console.error('[messages] channel subscription failed:', channel.topic, status, err)
        }
        reject(err ?? new Error(`Realtime ${isConnectionClose ? 'connection closed' : 'subscription failed'} (${status}).`))
      }
    })
  })
}

class MessagesService {
  async getConversations(clubId: number): Promise<Conversation[]> {
    const { data, error } = await supabase.rpc('list_conversations', {
      p_club_id: clubId,
      p_cursor: null,
      p_page_size: 50,
    })

    if (error) {
      throw error
    }

    return ((data ?? []) as unknown[]).map((row: unknown) => toConversation(row))
  }

  async getOrCreateDirectConversation(
    clubId: number,
    otherUserId: string
  ): Promise<Conversation | null> {
    const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
      p_club_id: clubId,
      p_other_user_id: otherUserId,
    })

    if (error) {
      throw error
    }

    const result = Array.isArray(data) ? (data[0] as DirectConversationResult | undefined) : undefined
    const conversationId = result?.conversation_id
    if (!conversationId) {
      return null
    }

    const conversations = await this.getConversations(clubId)
    return conversations.find((conversation) => conversation.id === conversationId) ?? null
  }

  async createGroupConversation(
    clubId: number,
    title: string | null,
    userIds: string[]
  ): Promise<Conversation | null> {
    const { data, error } = await supabase.rpc('create_group_conversation', {
      p_club_id: clubId,
      p_title: title ?? null,
      p_user_ids: userIds,
    })

    if (error) {
      throw error
    }

    const result = Array.isArray(data) ? (data[0] as { conversation_id: number } | undefined) : undefined
    const conversationId = result?.conversation_id
    if (conversationId == null) {
      return null
    }

    const conversations = await this.getConversations(clubId)
    return conversations.find((c) => c.id === conversationId) ?? null
  }

  async addParticipantsToConversation(
    conversationId: number,
    userIds: string[]
  ): Promise<number> {
    const { data, error } = await supabase.rpc('add_participants_to_conversation', {
      p_conversation_id: conversationId,
      p_user_ids: userIds,
    })

    if (error) {
      throw error
    }

    const result = Array.isArray(data) ? (data[0] as { added_count: number } | undefined) : undefined
    return result?.added_count ?? 0
  }

  async updateConversationTitle(
    conversationId: number,
    title: string
  ): Promise<void> {
    const { error } = await supabase.rpc('update_conversation_title', {
      p_conversation_id: conversationId,
      p_title: title,
    })

    if (error) {
      throw error
    }
  }

  async getMessages(
    conversationId: number,
    cursor: number | null = null,
    limit = 30
  ): Promise<MessageCursorPage> {
    const { data, error } = await supabase.rpc('list_messages', {
      p_conversation_id: conversationId,
      p_cursor: cursor,
      p_page_size: limit,
    })

    if (error) {
      throw error
    }

    const messages = ((data ?? []) as unknown[]).map((row: unknown) => toMessage(row))
    return {
      messages,
      next_cursor: messages.length === limit ? messages[0]?.id ?? null : null,
    }
  }

  async fetchMessageById(messageId: number): Promise<Message | null> {
    const { data, error } = await supabase.rpc('get_message_by_id', {
      p_message_id: messageId,
    })

    if (error || !data) {
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    return row ? toMessage(row) : null
  }

  async sendMessage(conversationId: number, clientId: string, body: string): Promise<Message | null> {
    const { data, error } = await supabase.rpc('send_message', {
      p_conversation_id: conversationId,
      p_client_id: clientId,
      p_body: body,
    })

    if (error) {
      throw error
    }

    const result = Array.isArray(data) ? data[0] : null
    return result ? toMessage(result) : null
  }

  async markConversationRead(
    conversationId: number,
    lastReadMessageId: number
  ): Promise<ReadReceiptResult | null> {
    const { data, error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
      p_last_read_message_id: lastReadMessageId,
    })

    if (error) {
      const message =
        (error as { message?: string })?.message ?? JSON.stringify(error)
      throw new Error(`mark_conversation_read: ${message}`)
    }

    const result = Array.isArray(data) ? (data[0] as ReadReceiptResult | undefined) : undefined
    return result ?? null
  }

  async searchMembers(clubId: number, query: string): Promise<MessageSearchResult[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    const userIds = data
      .map((member) => member.user_id)
      .filter((memberId): memberId is string => typeof memberId === 'string')

    if (userIds.length === 0) return []

    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, avatar_url')
      .in('id', userIds)

    const usersMap = new Map((users ?? []).map((member) => [member.id, member]))

    return data
      .filter((member) => typeof member.user_id === 'string' && usersMap.has(member.user_id))
      .map((member) => {
        const profile = usersMap.get(member.user_id as string)
        return {
          user_id: profile?.id ?? '',
          first_name: profile?.first_name ?? '',
          last_name: profile?.last_name ?? '',
          username: profile?.username ?? null,
          avatar_url: profile?.avatar_url ?? null,
        }
      })
  }

  async subscribeToMessages(
    conversationId: number,
    callbacks: {
      onCreated?: (message: Message) => void
      onUpdated?: (message: Message) => void
      onDeleted?: (messageId: number) => void
    }
  ): Promise<RealtimeChannel> {
    await ensureRealtimeAuth()

    const channel = supabase.channel(`conversation:${conversationId}:messages`, {
      config: {
        private: true,
      },
    })

    channel
      .on('broadcast', { event: 'message_created' }, async (payload) => {
        const messageId = extractRowId(payload as BroadcastPayload)
        if (!messageId) {
          console.warn('[messages] message_created: failed to extract message id', payload)
          return
        }

        const message = await this.fetchMessageById(messageId)
        if (message) {
          callbacks.onCreated?.(message)
        } else {
          console.warn('[messages] message_created: fetchMessageById returned null for id', messageId)
        }
      })
      .on('broadcast', { event: 'message_updated' }, async (payload) => {
        const messageId = extractRowId(payload as BroadcastPayload)
        if (!messageId) {
          console.warn('[messages] message_updated: failed to extract message id', payload)
          return
        }

        const message = await this.fetchMessageById(messageId)
        if (message) {
          callbacks.onUpdated?.(message)
        } else {
          console.warn('[messages] message_updated: fetchMessageById returned null for id', messageId)
        }
      })
      .on('broadcast', { event: 'message_deleted' }, (payload) => {
        const messageId = extractRowId(payload as BroadcastPayload)
        if (messageId) {
          callbacks.onDeleted?.(messageId)
        } else {
          console.warn('[messages] message_deleted: failed to extract message id', payload)
        }
      })

    return waitForSubscription(channel)
  }

  async subscribeToConversationList(
    userId: string,
    callback: (event: ConversationUpdateEvent) => void
  ): Promise<RealtimeChannel> {
    await ensureRealtimeAuth()

    const channel = supabase.channel(`user:${userId}:conversations`, {
      config: {
        private: true,
      },
    })

    channel.on('broadcast', { event: 'conversation_updated' }, (payload) => {
      const eventPayload = extractRealtimePayload(payload as BroadcastPayload)
      if (!eventPayload) {
        console.warn('[conversations] conversation_updated: could not extract payload', payload)
        return
      }

      const record =
        asRecord(eventPayload.new_record) ??
        asRecord(eventPayload.new) ??
        asRecord(eventPayload.record)

      const conversationId = record?.id != null
        ? toNumber(record.id)
        : toNumber(eventPayload.conversation_id)

      const clubId = record?.club_id != null
        ? toNumber(record.club_id)
        : toNumber(eventPayload.club_id)

      if (!conversationId) {
        console.warn('[conversations] conversation_updated: no conversation id in payload', eventPayload)
        return
      }

      console.info('[conversations] conversation_updated:', conversationId)
      callback({ conversation_id: conversationId, club_id: clubId })
    })

    return waitForSubscription(channel)
  }

  async subscribeToTyping(
    conversationId: number,
    currentUserId: string,
    callback: (event: TypingEventPayload) => void
  ): Promise<RealtimeChannel> {
    await ensureRealtimeAuth()

    const channel = supabase.channel(`conversation:${conversationId}:presence`, {
      config: {
        private: true,
        broadcast: { self: false, ack: true },
      },
    })

    const handleTypingEvent = (payload: unknown, isTyping: boolean) => {
      const payloadRecord = asRecord(payload)
      // Realtime can send { payload: { user_id, ... } } or { event, payload: { user_id, ... } }
      const inner = asRecord(payloadRecord?.payload)
      const data = inner ?? payloadRecord
      if (!data) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[typing] no payload data:', payload)
        }
        return
      }

      const userId =
        toStringOrNull(data.user_id) ??
        toStringOrNull((payloadRecord?.payload as JsonRecord)?.user_id)
      if (!userId || userId === currentUserId) return

      if (process.env.NODE_ENV === 'development') {
        console.info('[typing] received:', isTyping ? 'typing_started' : 'typing_stopped', 'user_id:', userId)
      }

      callback({
        conversation_id: conversationId,
        user_id: userId,
        is_typing: isTyping,
        sent_at: toStringOrNull(data.sent_at) ?? new Date().toISOString(),
      })
    }

    channel
      .on('broadcast', { event: 'typing_started' }, (payload) => {
        handleTypingEvent(payload, true)
      })
      .on('broadcast', { event: 'typing_stopped' }, (payload) => {
        handleTypingEvent(payload, false)
      })

    return waitForSubscription(channel)
  }

  async sendTypingEvent(
    channel: RealtimeChannel,
    userId: string,
    conversationId: number,
    isTyping: boolean
  ): Promise<void> {
    const event = isTyping ? 'typing_started' : 'typing_stopped'
    const payload = {
      conversation_id: conversationId,
      user_id: userId,
      is_typing: isTyping,
      sent_at: new Date().toISOString(),
    }

    console.info('[typing] sending:', event, 'conversation:', conversationId)

    const result = await channel.send({
      type: 'broadcast',
      event,
      payload,
    })

    if (result !== 'ok') {
      console.warn('[typing] send result:', result, event, conversationId)
    }
  }

  removeChannel(channel: RealtimeChannel | null) {
    if (!channel) return Promise.resolve('ok')
    return supabase.removeChannel(channel)
  }
}

export const messagesService = new MessagesService()

export type {
  Conversation,
  ConversationUpdateEvent,
  Message,
  MessageCursorPage,
  MessageSearchResult,
  TypingEventPayload,
}
