"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Mail, Loader2, Plus } from "lucide-react"
import { messagesService, type Conversation } from "@/lib/services/messages.service"
import { useClub } from "@/lib/club-context"
import { useAuth } from "@/lib/auth-context"
import { getRelativeTime } from "@/lib/utils/posts.utils"

interface ConversationsListProps {
  selectedId?: string
}

export function ConversationsList({ selectedId }: ConversationsListProps) {
  const { selectedClub } = useClub()
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const channelRef = useRef<ReturnType<typeof messagesService.subscribeToConversations> | null>(null)

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !selectedClub?.id) {
      setConversations([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await messagesService.getConversations(parseInt(selectedClub.id))
      setConversations(data)
    } catch (err) {
      console.error("Failed to load conversations:", err)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, selectedClub?.id])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Mark selected conversation as read
  useEffect(() => {
    if (selectedId) {
      const convId = parseInt(selectedId)
      if (!isNaN(convId)) {
        messagesService.markConversationRead(convId)
        // Update local unread count
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
        )
      }
    }
  }, [selectedId])

  // Real-time: reload conversations on any change
  useEffect(() => {
    channelRef.current = messagesService.subscribeToConversations(() => {
      loadConversations()
    })

    return () => {
      if (channelRef.current) {
        messagesService.removeChannel(channelRef.current)
      }
    }
  }, [loadConversations])

  /** Get the display name for a conversation (other participant's name or group title). */
  const getDisplayName = (conv: Conversation): string => {
    if (conv.title) return conv.title
    const otherParticipants = conv.participants?.filter(
      (p) => p.user_id !== user?.id
    )
    if (otherParticipants && otherParticipants.length > 0) {
      return otherParticipants
        .map((p) => {
          const u = p.user
          return u ? `${u.first_name} ${u.last_name}`.trim() : "Unknown"
        })
        .join(", ")
    }
    return "Conversation"
  }

  const getHandle = (conv: Conversation): string | null => {
    const otherParticipants = conv.participants?.filter(
      (p) => p.user_id !== user?.id
    )
    if (otherParticipants?.length === 1 && otherParticipants[0].user?.username) {
      return `@${otherParticipants[0].user.username}`
    }
    return null
  }

  const getInitial = (conv: Conversation): string => {
    const name = getDisplayName(conv)
    return name.charAt(0).toUpperCase()
  }

  const getAvatarUrl = (conv: Conversation): string | undefined => {
    if (conv.is_group) return undefined
    const other = conv.participants?.find((p) => p.user_id !== user?.id)
    return other?.user?.avatar_url ?? undefined
  }

  const filtered = search.trim()
    ? conversations.filter((c) =>
        getDisplayName(c).toLowerCase().includes(search.toLowerCase())
      )
    : conversations

  return (
    <div className="w-[350px] border-l border-r border-border bg-background text-foreground h-screen sticky top-0 flex flex-col">
      <div className="p-3 sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search Direct Messages"
            className="h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button size="icon" variant="ghost" aria-label="New message" className="shrink-0" asChild>
            <Link href="/messages/new">
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {search.trim() ? "No conversations found" : "No messages yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search.trim()
                ? "Try a different search"
                : "Start a new conversation using the + button above"}
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((c) => {
              const isActive = selectedId === c.id.toString()
              const displayName = getDisplayName(c)
              const handle = getHandle(c)
              const unread = (c.unread_count ?? 0) > 0
              const lastMsg = c.last_message

              return (
                <li key={c.id}>
                  <Link
                    href={`/messages/${c.id}`}
                    className={`block px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isActive ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm shrink-0 overflow-hidden">
                        {getAvatarUrl(c) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={getAvatarUrl(c)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          getInitial(c)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`truncate ${
                              unread
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground"
                            }`}
                          >
                            {displayName}
                          </p>
                          {handle && (
                            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                              {handle}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {lastMsg ? getRelativeTime(lastMsg.created_at) : getRelativeTime(c.updated_at)}
                          </span>
                        </div>
                        <p
                          className={`text-xs truncate ${
                            unread ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {lastMsg?.body ?? "No messages yet"}
                        </p>
                      </div>
                      {unread && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
