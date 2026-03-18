"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send, Plus, Image, Smile, Users, Pencil, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { messagesService, type Message } from "@/lib/services/messages.service"
import { mentionsService } from "@/lib/services/mentions.service"
import { MentionInput } from "@/components/mentions/mention-input"
import { MentionText } from "@/components/mentions/mention-text"
import { useAuth } from "@/lib/auth-context"
import { useClub } from "@/lib/club-context"
import { useMessages } from "@/lib/messages-context"
import { getRelativeTime } from "@/lib/utils/posts.utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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
  const formRef = useRef<HTMLFormElement>(null)
  const [editingGroupTitle, setEditingGroupTitle] = useState(false)
  const [groupTitleDraft, setGroupTitleDraft] = useState("")
  const [addPeopleOpen, setAddPeopleOpen] = useState(false)
  const [addPeopleQuery, setAddPeopleQuery] = useState("")
  const [addPeopleResults, setAddPeopleResults] = useState<{ user_id: string; first_name: string; last_name: string; username: string | null; avatar_url: string | null }[]>([])
  const [addPeopleSelected, setAddPeopleSelected] = useState<{ user_id: string; first_name: string; last_name: string }[]>([])
  const [addPeopleSearching, setAddPeopleSearching] = useState(false)
  const [addPeopleSubmitting, setAddPeopleSubmitting] = useState(false)
  const addPeopleInputRef = useRef<HTMLInputElement>(null)

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
    : conversation?.title ?? "Group chat"

  const isGroup = conversation?.is_group ?? false

  const handleSaveGroupTitle = useCallback(async () => {
    if (!isGroup || !conversation) return
    const trimmed = groupTitleDraft.trim()
    setEditingGroupTitle(false)
    if (trimmed === (conversation.title ?? "")) return
    try {
      await messagesService.updateConversationTitle(conversationId, trimmed || "Group chat")
      await refreshConversations()
    } catch (err) {
      console.error("Failed to update group title:", err)
      toast.error("Failed to update group name")
    }
  }, [isGroup, conversation, conversationId, groupTitleDraft, refreshConversations])

  const participantIds = useMemo(
    () => new Set(conversation?.participants?.map((p) => p.user_id) ?? []),
    [conversation?.participants]
  )

  const markVisibleMessagesRead = useCallback(async () => {
    // Use the latest message that exists in the DB (positive id); optimistic messages have negative ids
    const latestRealMessage = [...messages].reverse().find((m) => m.id > 0)
    if (!latestRealMessage) return
    if (!isAtBottom) return
    if (document.visibilityState !== "visible") return
    if (lastMarkedReadIdRef.current === latestRealMessage.id) return

    try {
      const result = await messagesService.markConversationRead(conversationId, latestRealMessage.id)
      const nextReadMessageId = result?.last_read_message_id ?? latestRealMessage.id
      lastMarkedReadIdRef.current = nextReadMessageId
      updateConversationReadPointer(conversationId, nextReadMessageId)
      setConversationUnreadCount(conversationId, 0)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error("Failed to mark conversation as read:", message)
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

  useEffect(() => {
    if (editingGroupTitle && conversation) {
      setGroupTitleDraft(conversation.title?.trim() || "Group chat")
    }
  }, [editingGroupTitle, conversation?.title])

  useEffect(() => {
    if (!addPeopleOpen) return
    setAddPeopleSelected([])
    setAddPeopleQuery("")
    setAddPeopleResults([])
    setTimeout(() => addPeopleInputRef.current?.focus(), 100)
  }, [addPeopleOpen])

  useEffect(() => {
    if (!addPeopleOpen || !selectedClub?.id) {
      setAddPeopleResults([])
      return
    }
    if (!addPeopleQuery.trim()) {
      setAddPeopleResults([])
      setAddPeopleSearching(false)
      return
    }
    const timer = setTimeout(async () => {
      setAddPeopleSearching(true)
      try {
        const data = await messagesService.searchMembers(
          parseInt(selectedClub.id),
          addPeopleQuery
        )
        setAddPeopleResults(
          data.filter((u) => !participantIds.has(u.user_id))
        )
      } catch {
        setAddPeopleResults([])
      } finally {
        setAddPeopleSearching(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [addPeopleOpen, addPeopleQuery, selectedClub?.id, participantIds])

  const addPersonToGroup = (u: { user_id: string; first_name: string; last_name: string }) => {
    setAddPeopleSelected((prev) =>
      prev.some((p) => p.user_id === u.user_id) ? prev : [...prev, u]
    )
  }

  const removePersonFromAddList = (userId: string) => {
    setAddPeopleSelected((prev) => prev.filter((p) => p.user_id !== userId))
  }

  const handleAddPeopleSubmit = useCallback(async () => {
    if (addPeopleSelected.length === 0) return
    setAddPeopleSubmitting(true)
    try {
      const added = await messagesService.addParticipantsToConversation(
        conversationId,
        addPeopleSelected.map((p) => p.user_id)
      )
      await refreshConversations()
      setAddPeopleOpen(false)
      if (added > 0) {
        toast.success(added === 1 ? "1 person added" : `${added} people added`)
      }
    } catch (err) {
      console.error("Failed to add participants:", err)
      toast.error("Failed to add people")
    } finally {
      setAddPeopleSubmitting(false)
    }
  }, [conversationId, addPeopleSelected, refreshConversations])

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
    if (!typingChannel || !user?.id) return

    const channelState = (typingChannel as { state?: string }).state
    if (channelState !== 'joined') return

    if (!trimmedDraft) {
      if (typingIdleTimeoutRef.current) {
        window.clearTimeout(typingIdleTimeoutRef.current)
      }

      if (isTypingRef.current) {
        isTypingRef.current = false
        void messagesService.sendTypingEvent(typingChannel, user.id, conversationId, false)
      }
      return
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true
      void messagesService.sendTypingEvent(typingChannel, user.id, conversationId, true)
    }

    if (typingIdleTimeoutRef.current) {
      window.clearTimeout(typingIdleTimeoutRef.current)
    }

    typingIdleTimeoutRef.current = window.setTimeout(() => {
      if (!typingChannelRef.current || !isTypingRef.current || !user?.id) return
      isTypingRef.current = false
      void messagesService.sendTypingEvent(typingChannelRef.current, user.id, conversationId, false)
    }, 2500)
  }, [draft, user?.id, conversationId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || sending || isNaN(conversationId)) return

    setSending(true)
    setDraft("")

    if (typingIdleTimeoutRef.current) {
      window.clearTimeout(typingIdleTimeoutRef.current)
    }

    if (typingChannelRef.current && isTypingRef.current && user?.id) {
      isTypingRef.current = false
      void messagesService.sendTypingEvent(typingChannelRef.current, user.id, conversationId, false)
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
        {isGroup ? (
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          otherParticipant && (
            <Avatar className="h-9 w-9">
              <AvatarImage src={otherParticipant.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-sm">
                {otherParticipant.first_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )
        )}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {isGroup && editingGroupTitle ? (
            <Input
              value={groupTitleDraft}
              onChange={(e) => setGroupTitleDraft(e.target.value)}
              onBlur={handleSaveGroupTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  void handleSaveGroupTitle()
                }
                if (e.key === "Escape") {
                  setEditingGroupTitle(false)
                  setGroupTitleDraft(conversation?.title ?? "Group chat")
                }
              }}
              className="h-8 text-sm font-semibold"
              autoFocus
              aria-label="Group name"
            />
          ) : (
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{displayName}</p>
                {!isGroup && otherParticipant?.username && (
                  <p className="text-xs text-muted-foreground truncate">@{otherParticipant.username}</p>
                )}
              </div>
              {isGroup && (
                <button
                  type="button"
                  onClick={() => setEditingGroupTitle(true)}
                  className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Edit group name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {isGroup && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setAddPeopleOpen(true)}
            aria-label="Add people to group"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Add people dialog */}
      <Dialog open={addPeopleOpen} onOpenChange={setAddPeopleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add people</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              ref={addPeopleInputRef}
              value={addPeopleQuery}
              onChange={(e) => setAddPeopleQuery(e.target.value)}
              placeholder="Search club members"
              className="w-full"
            />
            {addPeopleSelected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {addPeopleSelected.map((p) => (
                  <span
                    key={p.user_id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm"
                  >
                    {p.first_name} {p.last_name}
                    <button
                      type="button"
                      onClick={() => removePersonFromAddList(p.user_id)}
                      className="rounded-full p-0.5 hover:bg-primary/20"
                      aria-label={`Remove ${p.first_name}`}
                    >
                      <Plus className="h-3 w-3 rotate-45" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {addPeopleSearching && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!addPeopleSearching && addPeopleQuery.trim() && (
              <ul className="max-h-48 overflow-y-auto space-y-1">
                {addPeopleResults.map((u) => (
                  <li key={u.user_id}>
                    <button
                      type="button"
                      onClick={() => addPersonToGroup(u)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {u.first_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {u.first_name} {u.last_name}
                      {addPeopleSelected.some((s) => s.user_id === u.user_id) && (
                        <span className="text-xs text-muted-foreground">Added</span>
                      )}
                    </button>
                  </li>
                ))}
                {addPeopleResults.length === 0 && (
                  <li className="py-4 text-center text-sm text-muted-foreground">
                    No members found
                  </li>
                )}
              </ul>
            )}
            <Button
              onClick={() => void handleAddPeopleSubmit()}
              disabled={addPeopleSelected.length === 0 || addPeopleSubmitting}
              className="w-full"
            >
              {addPeopleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Composer — structure matches Twitter dm-composer exactly */}
      <div className="bg-background border-t border-border shrink-0 w-full">
        {typingUserId && (
            <p className="px-4 pt-2 text-xs text-muted-foreground">
            {otherParticipant?.id === typingUserId ? `${displayName} is typing...` : "Someone is typing..."}
          </p>
        )}
        <div className="flex w-full items-end gap-2 p-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Add attachment"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="GIF"
          >
            <Image className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Insert emoji"
          >
            <Smile className="h-5 w-5" />
          </Button>
          <form ref={formRef} onSubmit={handleSend} className="relative min-w-0 flex-1 self-end">
            <div className="flex w-full flex-col items-center justify-center h-fit overflow-hidden rounded-[25px] border border-input bg-muted/40 py-2">
              <div className="flex w-full justify-end px-2">
                <div className="min-w-0 flex-1">
                  <MentionInput
                    value={draft}
                    onChange={setDraft}
                    clubId={selectedClub?.id ? parseInt(selectedClub.id) : 0}
                    placeholder="Message"
                    as="textarea"
                    rows={1}
                    autoResize
                    onSubmitWithEnter={() => formRef.current?.requestSubmit()}
                    className="w-full h-full resize-none border-0 bg-transparent px-2 py-2 text-[12px] leading-5 placeholder:text-muted-foreground focus:outline-none focus:ring-0 align-middle"
                  />
                </div>
                <div className="h-[35px] w-[35px] shrink-0 self-end">
                  <Button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    size="icon"
                    className="h-[35px] w-[35px] rounded-full"
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
