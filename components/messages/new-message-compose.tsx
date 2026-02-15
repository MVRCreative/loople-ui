"use client"

/**
 * NewMessageCompose — Inline "New Message" view that replaces the right panel.
 *
 * Twitter-style: full-height panel with a "To:" search field at top, results list
 * below, and once a recipient is selected, transitions into the conversation thread.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messagesService } from "@/lib/services/messages.service"
import { useClub } from "@/lib/club-context"

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
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus search input on mount
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
    if (selectedUser) return // don't search while a user is selected
    const timer = setTimeout(() => doSearch(query), 250)
    return () => clearTimeout(timer)
  }, [query, doSearch, selectedUser])

  const handleSelectUser = async (user: SearchResult) => {
    if (!selectedClub?.id) return
    setSelectedUser(user)
    setCreating(true)

    try {
      const conversation = await messagesService.getOrCreateDirectConversation(
        parseInt(selectedClub.id),
        user.user_id
      )
      if (conversation) {
        router.replace(`/messages/${conversation.id}`)
      }
    } catch {
      // If creation fails, reset
      setSelectedUser(null)
      setCreating(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedUser(null)
    setQuery("")
    setResults([])
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="w-full bg-background h-screen sticky top-0 border-l border-r border-border flex flex-col">
      {/* Header */}
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

      {/* To: field */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <span className="text-sm text-muted-foreground shrink-0">To:</span>

        {selectedUser ? (
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={selectedUser.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-[10px]">
                {selectedUser.first_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {selectedUser.first_name} {selectedUser.last_name}
            </span>
            {!creating && (
              <button
                onClick={handleClearSelection}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Remove recipient"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people"
              className="border-0 shadow-none px-0 h-8 text-sm focus-visible:ring-0 bg-transparent"
            />
          </div>
        )}

        {creating && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        )}
      </div>

      {/* Search results */}
      <div className="flex-1 overflow-y-auto">
        {searching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!searching && !selectedUser && query.trim() && results.length === 0 && (
          <div className="text-center py-12 px-4">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No people found for &ldquo;{query}&rdquo;
            </p>
          </div>
        )}

        {!searching && !selectedUser && !query.trim() && (
          <div className="text-center py-16 px-4">
            <p className="text-sm text-muted-foreground">
              Search for someone to message
            </p>
          </div>
        )}

        {!selectedUser &&
          results.map((user) => (
            <button
              key={user.user_id}
              onClick={() => handleSelectUser(user)}
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

        {creating && selectedUser && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Opening conversation...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
