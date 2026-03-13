export interface MessageUserSummary {
  id: string
  first_name: string
  last_name: string
  username: string | null
  avatar_url: string | null
}

export interface ConversationParticipant {
  id: number
  conversation_id: number
  user_id: string
  joined_at: string
  last_read_at: string | null
  last_read_message_id: number | null
  user?: MessageUserSummary | null
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: string
  body: string
  created_at: string
  updated_at: string
  client_id: string | null
  sender?: MessageUserSummary | null
  delivery_state?: "pending" | "failed" | "sent"
}

export interface Conversation {
  id: number
  club_id: number
  title: string | null
  is_group: boolean
  created_by: string
  created_at: string
  updated_at: string
  direct_key: string | null
  participants: ConversationParticipant[]
  last_message: Message | null
  unread_count: number
}

export interface ConversationCursorPage {
  conversations: Conversation[]
  next_cursor: string | null
}

export interface MessageCursorPage {
  messages: Message[]
  next_cursor: number | null
}

export interface DirectConversationResult {
  conversation_id: number
}

export interface ReadReceiptResult {
  last_read_message_id: number | null
}

export interface MessageSearchResult {
  user_id: string
  first_name: string
  last_name: string
  username: string | null
  avatar_url: string | null
}

export interface ConversationUpdateEvent {
  conversation_id: number
  club_id: number
}

export interface TypingEventPayload {
  conversation_id: number
  user_id: string
  is_typing: boolean
  sent_at: string
}
