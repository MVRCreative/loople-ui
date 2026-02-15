"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Loader2 } from "lucide-react"
import { messagesService, type Conversation } from "@/lib/services/messages.service"
import { useClub } from "@/lib/club-context"

interface NewConversationDialogProps {
  onConversationCreated: (conversation: Conversation) => void
}

export function NewConversationDialog({ onConversationCreated }: NewConversationDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{
    user_id: string
    first_name: string
    last_name: string
    username: string | null
    avatar_url: string | null
  }>>([])
  const [searching, setSearching] = useState(false)
  const [creating, setCreating] = useState(false)
  const { selectedClub } = useClub()

  const doSearch = useCallback(async (term: string) => {
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
  }, [selectedClub?.id])

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const handleSelect = async (userId: string) => {
    if (!selectedClub?.id) return
    setCreating(true)
    try {
      const conversation = await messagesService.getOrCreateDirectConversation(
        parseInt(selectedClub.id),
        userId
      )
      if (conversation) {
        onConversationCreated(conversation)
        setOpen(false)
        setQuery("")
        setResults([])
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="New message" className="shrink-0">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && query.trim() && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members found
              </p>
            )}

            {results.map((user) => (
              <button
                key={user.user_id}
                onClick={() => handleSelect(user.user_id)}
                disabled={creating}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted/60 transition-colors disabled:opacity-50"
              >
                <Avatar className="h-9 w-9">
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
      </DialogContent>
    </Dialog>
  )
}
