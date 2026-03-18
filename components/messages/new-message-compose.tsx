"use client"

/**
 * NewMessageCompose — Inline "New Message" view that replaces the right panel.
 *
 * Multi-select recipients: search, add people (stays on screen), then "Message"
 * creates 1:1 or group and navigates to the thread.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { messagesService } from "@/lib/services/messages.service"
import { useClub } from "@/lib/club-context"
import { useMessages } from "@/lib/messages-context"

interface SearchResult {
  user_id: string
  first_name: string
  last_name: string
  username: string | null
  avatar_url: string | null
}

export function NewMessageCompose() {
  const router = useRouter()
  const { selectedClub } = useClub()
  const { refreshConversations } = useMessages()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(
    async (term: string) => {
      if (!term.trim() || !selectedClub?.id) {
        setResults([])
        return
      }
      setSearching(true)
      try {
        const data = await messagesService.searchMembers(
          parseInt(selectedClub.id),
          term
        )
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    },
    [selectedClub?.id]
  )

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 250)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const addRecipient = (user: SearchResult) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.user_id === user.user_id) ? prev : [...prev, user]
    )
    setQuery("")
    setResults([])
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const removeRecipient = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.user_id !== userId))
  }

  const startConversation = async () => {
    if (!selectedClub?.id || selectedUsers.length === 0) return
    setCreating(true)
    try {
      const clubId = parseInt(selectedClub.id)
      let conversation
      if (selectedUsers.length === 1) {
        conversation = await messagesService.getOrCreateDirectConversation(
          clubId,
          selectedUsers[0].user_id
        )
      } else {
        conversation = await messagesService.createGroupConversation(
          clubId,
          null,
          selectedUsers.map((u) => u.user_id)
        )
      }
      if (conversation) {
        await refreshConversations()
        router.replace(`/messages/${conversation.id}`)
      } else {
        toast.error("Could not create conversation")
      }
    } catch (error: unknown) {
      const err = error as Record<string, unknown> | undefined
      const msg = typeof err?.message === "string" ? err.message : "Failed to start conversation"
      console.error("Failed to start conversation:", err?.message ?? err?.code ?? error)
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const selectedIds = new Set(selectedUsers.map((u) => u.user_id))
  const resultsToShow = results.filter((u) => !selectedIds.has(u.user_id))

  return (
    <div className="w-full bg-background h-screen sticky top-0 border-l border-r border-border flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push("/messages")}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold text-base text-foreground">New message</h2>
      </div>

      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2 min-h-[52px]">
        <span className="text-sm text-muted-foreground shrink-0 w-full sm:w-auto">To:</span>
        {selectedUsers.map((u) => (
          <div
            key={u.user_id}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1"
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={u.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-[10px]">
                {u.first_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
              {u.first_name} {u.last_name}
            </span>
            {!creating && (
              <button
                type="button"
                onClick={() => removeRecipient(u.user_id)}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-colors"
                aria-label={`Remove ${u.first_name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <div className="flex-1 min-w-[120px]">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="border-0 shadow-none px-0 h-8 text-sm focus-visible:ring-0 bg-transparent"
          />
        </div>
        {creating && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <Button
            onClick={startConversation}
            disabled={creating}
            className="w-full"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : selectedUsers.length === 1 ? (
              "Message"
            ) : (
              "Start group conversation"
            )}
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {searching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!searching && query.trim() && resultsToShow.length === 0 && (
          <div className="text-center py-12 px-4">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No people found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {!searching && !query.trim() && (
          <div className="text-center py-16 px-4">
            <p className="text-sm text-muted-foreground">
              Search for someone to add to the conversation
            </p>
          </div>
        )}

        {!searching &&
          resultsToShow.map((user) => (
            <button
              key={user.user_id}
              type="button"
              onClick={() => addRecipient(user)}
              disabled={creating}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-sm">
                  {user.first_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.first_name} {user.last_name}
                </p>
                {user.username && (
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                )}
              </div>
            </button>
          ))}
      </div>
    </div>
  )
}
