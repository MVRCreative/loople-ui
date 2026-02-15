"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { messagesService, type Message, type Conversation } from "@/lib/services/messages.service"
import { mentionsService } from "@/lib/services/mentions.service"
import { MentionInput } from "@/components/mentions/mention-input"
import { MentionText } from "@/components/mentions/mention-text"
import { useAuth } from "@/lib/auth-context"
import { useClub } from "@/lib/club-context"
import { getRelativeTime } from "@/lib/utils/posts.utils"

interface MessageThreadProps {
  id: string
}

export function MessageThread({ id }: MessageThreadProps) {
  const conversationId = parseInt(id)
  const { user } = useAuth()
  const { selectedClub } = useClub()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof messagesService.subscribeToMessages> | null>(null)

  // Load conversation metadata
  useEffect(() => {
    if (isNaN(conversationId) || !selectedClub?.id) return

    const load = async () => {
      const conversations = await messagesService.getConversations(parseInt(selectedClub.id))
      const found = conversations.find((c) => c.id === conversationId) ?? null
      setConversation(found)
    }
    load()
  }, [conversationId, selectedClub?.id])

  // Load messages
  const loadMessages = useCallback(async () => {
    if (isNaN(conversationId)) return
    setLoading(true)
    try {
      const data = await messagesService.getMessages(conversationId)
      setMessages(data)
      // Mark as read
      await messagesService.markConversationRead(conversationId)
    } catch (err) {
      console.error("Failed to load messages:", err)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Real-time: new messages
  useEffect(() => {
    if (isNaN(conversationId)) return

    channelRef.current = messagesService.subscribeToMessages(conversationId, (newMsg) => {
      setMessages((prev) => {
        // Deduplicate — the optimistic message we added on send has the same body
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
      // Mark as read since we're viewing the thread
      messagesService.markConversationRead(conversationId)
    })

    return () => {
      if (channelRef.current) {
        messagesService.removeChannel(channelRef.current)
      }
    }
  }, [conversationId])

  // Get display info
  const otherParticipant = useMemo(() => {
    if (!conversation || !user) return null
    const other = conversation.participants?.find((p) => p.user_id !== user.id)
    return other?.user ?? null
  }, [conversation, user])

  const displayName = otherParticipant
    ? `${otherParticipant.first_name} ${otherParticipant.last_name}`.trim()
    : conversation?.title ?? "Conversation"

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || sending || isNaN(conversationId)) return

    setSending(true)
    setDraft("")

    // Optimistic message
    const optimistic: Message = {
      id: -Date.now(),
      conversation_id: conversationId,
      sender_id: user?.id ?? "",
      body: trimmed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const sent = await messagesService.sendMessage(conversationId, trimmed)
      if (sent) {
        // Replace optimistic with real message
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? sent : m))
        )
        // Process @mentions
        if (selectedClub?.id) {
          await mentionsService.processMentions({
            text: trimmed,
            clubId: parseInt(selectedClub.id),
            messageId: sent.id,
          })
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err)
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setDraft(trimmed)
    } finally {
      setSending(false)
    }
  }

  if (isNaN(conversationId)) {
    return (
      <div className="w-full bg-background h-screen sticky top-0 border-l border-r border-border flex items-center justify-center">
        <p className="text-muted-foreground">Invalid conversation.</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-background h-screen sticky top-0 border-l border-r border-border flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
        {otherParticipant && (
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherParticipant.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-sm">
              {otherParticipant.first_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
          {otherParticipant?.username && (
            <p className="text-xs text-muted-foreground">@{otherParticipant.username}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id
            const senderName = m.sender
              ? `${m.sender.first_name} ${m.sender.last_name}`.trim()
              : isMe
              ? "You"
              : "Unknown"

            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="flex items-end gap-2 max-w-[75%]">
                  {!isMe && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={m.sender?.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-muted text-xs">
                        {senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <MentionText text={m.body} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 px-1">
                      {getRelativeTime(m.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="bg-background p-3 border-t border-border shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <MentionInput
            value={draft}
            onChange={setDraft}
            clubId={selectedClub?.id ? parseInt(selectedClub.id) : 0}
            placeholder="Start a new message"
            as="input"
            className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button type="submit" disabled={!draft.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </Button>
        </form>
      </div>
    </div>
  )
}
