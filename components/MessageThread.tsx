"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { messagesService, type Message } from "@/lib/services/messages.service"
import { mentionsService } from "@/lib/services/mentions.service"
import { MentionInput } from "@/components/mentions/mention-input"
import { MentionText } from "@/components/mentions/mention-text"
import { useAuth } from "@/lib/auth-context"
import { useClub } from "@/lib/club-context"
import { useMessages } from "@/lib/messages-context"
import { getRelativeTime } from "@/lib/utils/posts.utils"

interface MessageThreadProps {
  id: string
}

export function MessageThread({ id }: MessageThreadProps) {
  const conversationId = parseInt(id)
  const { user } = useAuth()
  const { selectedClub } = useClub()
  const {
    conversations,
    refreshConversations,
    setConversationUnreadCount,
    updateConversationReadPointer,
  } = useMessages()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [showNewMessages, setShowNewMessages] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const [animatedMessageIds, setAnimatedMessageIds] = useState<number[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageChannelRef = useRef<RealtimeChannel | null>(null)
  const typingChannelRef = useRef<RealtimeChannel | null>(null)
  const typingIdleTimeoutRef = useRef<number | null>(null)
  const typingExpiryTimeoutRef = useRef<number | null>(null)
  const isTypingRef = useRef(false)
  const isAtBottomRef = useRef(true)
  const lastMarkedReadIdRef = useRef<number | null>(null)

  const conversation = useMemo(
    () => conversations.find((item) => item.id === conversationId) ?? null,
    [conversationId, conversations]
  )

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!scrollRef.current) return

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    })
    setShowNewMessages(false)
    setIsAtBottom(true)
    isAtBottomRef.current = true
  }, [])

  const appendAnimatedMessage = useCallback((messageId: number) => {
    setAnimatedMessageIds((previous) =>
      previous.includes(messageId) ? previous : [...previous, messageId]
    )

    window.setTimeout(() => {
      setAnimatedMessageIds((previous) => previous.filter((idValue) => idValue !== messageId))
    }, 1200)
  }, [])

  const mergeIncomingMessage = useCallback(
    (incomingMessage: Message, options?: { animate?: boolean }) => {
      setMessages((previous) => {
        const existingIndex = previous.findIndex(
          (message) =>
            message.id === incomingMessage.id ||
            (incomingMessage.client_id != null &&
              message.client_id != null &&
              message.client_id === incomingMessage.client_id)
        )

        if (existingIndex >= 0) {
          const nextMessages = [...previous]
          nextMessages[existingIndex] = {
            ...incomingMessage,
            delivery_state: "sent",
          }
          return nextMessages
        }

        return [...previous, { ...incomingMessage, delivery_state: "sent" }]
      })

      if (options?.animate && incomingMessage.sender_id !== user?.id) {
        appendAnimatedMessage(incomingMessage.id)
      }

    },
    [appendAnimatedMessage, user?.id]
  )

  const loadMessages = useCallback(async () => {
    if (isNaN(conversationId)) return

    setLoading(true)

    try {
      const page = await messagesService.getMessages(conversationId, null, 30)
      setMessages((previous) => {
        if (previous.length === 0) return page.messages

        const fetchedIds = new Set(page.messages.map((m) => m.id))
        const fetchedClientIds = new Set(
          page.messages
            .filter((m) => m.client_id != null)
            .map((m) => m.client_id!)
        )
        const maxFetchedId = page.messages.at(-1)?.id ?? 0

        const extra = previous.filter((msg) => {
          if (fetchedIds.has(msg.id)) return false
          if (msg.client_id != null && fetchedClientIds.has(msg.client_id))
            return false
          return msg.id < 0 || msg.id > maxFetchedId
        })

        if (extra.length === 0) return page.messages
        return [...page.messages, ...extra]
      })
      setHasMore(page.next_cursor !== null)
      lastMarkedReadIdRef.current = null

      window.requestAnimationFrame(() => {
        scrollToBottom("auto")
      })
    } catch (err) {
      console.error("Failed to load messages:", err)
      toast.error("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }, [conversationId, scrollToBottom])

  const gapFillMessages = useCallback(async () => {
    if (isNaN(conversationId)) return

    try {
      const page = await messagesService.getMessages(conversationId, null, 30)

      setMessages((previous) => {
        const result = [...previous]
        let changed = false

        for (const incoming of page.messages) {
          const existingIndex = result.findIndex(
            (m) =>
              m.id === incoming.id ||
              (incoming.client_id != null &&
                m.client_id != null &&
                m.client_id === incoming.client_id)
          )

          if (existingIndex >= 0) {
            const existing = result[existingIndex]
            if (existing && (existing.id < 0 || existing.delivery_state === "pending")) {
              result[existingIndex] = { ...incoming, delivery_state: "sent" }
              changed = true
            }
          } else {
            result.push({ ...incoming, delivery_state: "sent" })
            changed = true
          }
        }

        if (!changed) return previous

        result.sort((a, b) => {
          if (a.id < 0 && b.id >= 0) return 1
          if (a.id >= 0 && b.id < 0) return -1
          return a.id - b.id
        })

        return result
      })

      if (isAtBottomRef.current) {
        window.requestAnimationFrame(() => scrollToBottom("smooth"))
      }

      void refreshConversations()
    } catch (_error) {
      // Best-effort recovery; transient failures expected during focus/visibility changes
    }
  }, [conversationId, refreshConversations, scrollToBottom])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (isNaN(conversationId)) return

    let cancelled = false

    const setupRealtime = async () => {
      try {
        const [messageChannel, typingChannel] = await Promise.all([
          messagesService.subscribeToMessages(conversationId, {
            onCreated: (newMessage) => {
              if (cancelled) return

              mergeIncomingMessage(newMessage, { animate: true })

              if (newMessage.sender_id === user?.id || isAtBottomRef.current) {
                window.requestAnimationFrame(() => {
                  scrollToBottom(newMessage.sender_id === user?.id ? "auto" : "smooth")
                })
              } else {
                setShowNewMessages(true)
              }

              void refreshConversations()
            },
            onUpdated: (updatedMessage) => {
              if (cancelled) return
              mergeIncomingMessage(updatedMessage)
            },
            onDeleted: (deletedMessageId) => {
              if (cancelled) return
              setMessages((previous) =>
                previous.filter((message) => message.id !== deletedMessageId)
              )
            },
          }),
          user?.id
            ? messagesService.subscribeToTyping(conversationId, user.id, (event) => {
                if (cancelled) return

                setTypingUserId(event.is_typing ? event.user_id : null)

                if (typingExpiryTimeoutRef.current) {
                  window.clearTimeout(typingExpiryTimeoutRef.current)
                }

                if (event.is_typing) {
                  typingExpiryTimeoutRef.current = window.setTimeout(() => {
                    setTypingUserId(null)
                  }, 3000)
                }
              })
            : Promise.resolve(null),
        ])

        if (cancelled) {
          await Promise.all([
            messagesService.removeChannel(messageChannel),
            messagesService.removeChannel(typingChannel),
          ])
          return
        }

        messageChannelRef.current = messageChannel
        typingChannelRef.current = typingChannel
      } catch (error) {
        console.error("Failed to subscribe to message channels:", error)
      }
    }

    void setupRealtime()

    return () => {
      cancelled = true
      void messagesService.removeChannel(messageChannelRef.current)
      void messagesService.removeChannel(typingChannelRef.current)
      messageChannelRef.current = null
      typingChannelRef.current = null

      if (typingIdleTimeoutRef.current) {
        window.clearTimeout(typingIdleTimeoutRef.current)
      }

      if (typingExpiryTimeoutRef.current) {
        window.clearTimeout(typingExpiryTimeoutRef.current)
      }

      setTypingUserId(null)
    }
  }, [conversationId, mergeIncomingMessage, refreshConversations, scrollToBottom, user?.id])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void gapFillMessages()
      } else {
        setTypingUserId(null)
      }
    }

    const handleWindowFocus = () => {
      void gapFillMessages()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleWindowFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleWindowFocus)
    }
  }, [gapFillMessages])

  // Get display info
  const otherParticipant = useMemo(() => {
    if (!conversation || !user) return null
    const other = conversation.participants?.find((p) => p.user_id !== user.id)
    return other?.user ?? null
  }, [conversation, user])

  const displayName = otherParticipant
    ? `${otherParticipant.first_name} ${otherParticipant.last_name}`.trim()
    : conversation?.title ?? "Conversation"

  const markVisibleMessagesRead = useCallback(async () => {
    const latestMessage = messages[messages.length - 1]
    if (!latestMessage) return
    if (!isAtBottom) return
    if (document.visibilityState !== "visible") return
    if (lastMarkedReadIdRef.current === latestMessage.id) return

    try {
      const result = await messagesService.markConversationRead(conversationId, latestMessage.id)
      const nextReadMessageId = result?.last_read_message_id ?? latestMessage.id
      lastMarkedReadIdRef.current = nextReadMessageId
      updateConversationReadPointer(conversationId, nextReadMessageId)
      setConversationUnreadCount(conversationId, 0)
    } catch (error) {
      console.error("Failed to mark conversation as read:", error)
    }
  }, [
    conversationId,
    isAtBottom,
    messages,
    setConversationUnreadCount,
    updateConversationReadPointer,
  ])

  useEffect(() => {
    void markVisibleMessagesRead()
  }, [markVisibleMessagesRead])

  const handleLoadOlderMessages = async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return

    const firstMessageId = messages[0]?.id
    if (!firstMessageId) return

    setLoadingOlder(true)

    try {
      const previousScrollHeight = scrollRef.current?.scrollHeight ?? 0
      const page = await messagesService.getMessages(conversationId, firstMessageId, 30)
      if (page.messages.length > 0) {
        setMessages((previous) => [...page.messages, ...previous])
      }
      setHasMore(page.next_cursor !== null)

      window.requestAnimationFrame(() => {
        if (!scrollRef.current) return
        const nextScrollHeight = scrollRef.current.scrollHeight
        scrollRef.current.scrollTop += nextScrollHeight - previousScrollHeight
      })
    } catch (error) {
      console.error("Failed to load older messages:", error)
      toast.error("Failed to load older messages")
    } finally {
      setLoadingOlder(false)
    }
  }

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const distanceFromBottom =
      scrollRef.current.scrollHeight -
      scrollRef.current.scrollTop -
      scrollRef.current.clientHeight
    const nextIsAtBottom = distanceFromBottom < 96
    setIsAtBottom(nextIsAtBottom)
    isAtBottomRef.current = nextIsAtBottom

    if (nextIsAtBottom) {
      setShowNewMessages(false)
    }
  }, [])

  useEffect(() => {
    const trimmedDraft = draft.trim()
    const typingChannel = typingChannelRef.current
    if (!typingChannel) return

    if (!trimmedDraft) {
      if (typingIdleTimeoutRef.current) {
        window.clearTimeout(typingIdleTimeoutRef.current)
      }

      if (isTypingRef.current) {
        isTypingRef.current = false
        void messagesService.sendTypingEvent(typingChannel, false)
      }
      return
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true
      void messagesService.sendTypingEvent(typingChannel, true)
    }

    if (typingIdleTimeoutRef.current) {
      window.clearTimeout(typingIdleTimeoutRef.current)
    }

    typingIdleTimeoutRef.current = window.setTimeout(() => {
      if (!typingChannelRef.current || !isTypingRef.current) return
      isTypingRef.current = false
      void messagesService.sendTypingEvent(typingChannelRef.current, false)
    }, 2500)
  }, [draft])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || sending || isNaN(conversationId)) return

    setSending(true)
    setDraft("")

    if (typingIdleTimeoutRef.current) {
      window.clearTimeout(typingIdleTimeoutRef.current)
    }

    if (typingChannelRef.current && isTypingRef.current) {
      isTypingRef.current = false
      void messagesService.sendTypingEvent(typingChannelRef.current, false)
    }

    const clientId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    // Optimistic message
    const optimistic: Message = {
      id: -Date.now(),
      conversation_id: conversationId,
      sender_id: user?.id ?? "",
      body: trimmed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_id: clientId,
      sender: null,
      delivery_state: "pending",
    }
    setMessages((prev) => [...prev, optimistic])
    window.requestAnimationFrame(() => {
      scrollToBottom("auto")
    })

    try {
      const sent = await messagesService.sendMessage(conversationId, clientId, trimmed)
      if (sent) {
        mergeIncomingMessage(sent)
        window.requestAnimationFrame(() => {
          scrollToBottom("smooth")
        })
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
      toast.error("Failed to send message")
      setMessages((prev) =>
        prev.map((message) =>
          message.id === optimistic.id
            ? { ...message, delivery_state: "failed" }
            : message
        )
      )
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
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3"
        onScroll={handleScroll}
      >
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
          <>
            {hasMore && (
              <div className="flex justify-center pb-2">
                <Button variant="outline" size="sm" onClick={handleLoadOlderMessages} disabled={loadingOlder}>
                  {loadingOlder ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load older messages"}
                </Button>
              </div>
            )}

            {messages.map((message) => {
              const isMe = message.sender_id === user?.id
              const senderName = message.sender
                ? `${message.sender.first_name} ${message.sender.last_name}`.trim()
                : isMe
                  ? "You"
                  : "Unknown"
              const isAnimated = animatedMessageIds.includes(message.id)

              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} ${
                    isAnimated ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : ""
                  }`}
                >
                  <div className="flex items-end gap-2 max-w-[75%]">
                    {!isMe && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={message.sender?.avatar_url ?? undefined} />
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
                        <MentionText text={message.body} />
                      </div>
                      <p className="mt-1 px-1 text-[10px] text-muted-foreground">
                        {getRelativeTime(message.created_at)}
                        {message.delivery_state === "pending" && " • sending"}
                        {message.delivery_state === "failed" && " • failed"}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {showNewMessages && (
          <div className="sticky bottom-4 flex justify-center">
            <Button size="sm" className="rounded-full shadow-sm" onClick={() => scrollToBottom("smooth")}>
              New messages
            </Button>
          </div>
        )}
      </div>

      {/* Composer — full-width bar, input dominant (X-style) */}
      <div className="bg-background border-t border-border shrink-0 w-full">
        {typingUserId && otherParticipant?.id === typingUserId && (
          <p className="px-4 pt-2 text-xs text-muted-foreground">
            {displayName} is typing...
          </p>
        )}
        <form onSubmit={handleSend} className="flex w-full items-end gap-2 p-4">
          <MentionInput
            value={draft}
            onChange={setDraft}
            clubId={selectedClub?.id ? parseInt(selectedClub.id) : 0}
            placeholder="Message"
            as="textarea"
            rows={2}
            className="min-h-[52px] max-h-32 flex-1 min-w-0 resize-none rounded-2xl border border-input bg-muted/40 py-3.5 px-4 text-[15px] leading-snug placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <Button
            type="submit"
            disabled={!draft.trim() || sending}
            size="icon"
            className="h-[52px] w-12 shrink-0 rounded-2xl"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
