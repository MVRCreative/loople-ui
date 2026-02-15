"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, User, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { searchService, type PostSearchResult, type MemberSearchResult } from "@/lib/services/search.service"
import { useClub } from "@/lib/club-context"
import { getRelativeTime } from "@/lib/utils/posts.utils"

export function SearchCommand() {
  const router = useRouter()
  const { selectedClub } = useClub()

  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<PostSearchResult[]>([])
  const [members, setMembers] = useState<MemberSearchResult[]>([])

  const doSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setPosts([])
        setMembers([])
        return
      }
      setLoading(true)
      try {
        const clubId = selectedClub?.id ? parseInt(selectedClub.id) : undefined
        const results = await searchService.search(term, clubId)
        setPosts(results.posts)
        setMembers(results.members)
      } catch {
        setPosts([])
        setMembers([])
      } finally {
        setLoading(false)
      }
    },
    [selectedClub?.id]
  )

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, doSearch])

  const hasResults = posts.length > 0 || members.length > 0
  const showDropdown = isOpen && query.trim().length > 0

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search posts and members..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay to allow click events on results
            setTimeout(() => setIsOpen(false), 200)
          }}
          className="pl-10 bg-muted border-0 rounded-full h-10 text-sm focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full rounded-xl border border-border bg-popover shadow-lg z-50 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && !hasResults && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && hasResults && (
            <div className="max-h-80 overflow-y-auto">
              {/* Members */}
              {members.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Members
                  </div>
                  {members.map((member) => (
                    <button
                      key={member.user_id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        router.push(`/profile/${member.username ?? member.user_id}`)
                        setQuery("")
                        setIsOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-xs">
                          {member.first_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        {member.username && (
                          <p className="text-xs text-muted-foreground">@{member.username}</p>
                        )}
                      </div>
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Posts */}
              {posts.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t border-border">
                    Posts
                  </div>
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        router.push(`/post/${post.id}`)
                        setQuery("")
                        setIsOpen(false)
                      }}
                      className="flex w-full items-start gap-3 px-3 py-2 hover:bg-muted/60 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-foreground line-clamp-2">
                          {post.body?.slice(0, 120)}
                          {(post.body?.length ?? 0) > 120 ? "..." : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {post.author
                            ? `${post.author.first_name} ${post.author.last_name}`
                            : "Unknown"}{" "}
                          · {getRelativeTime(post.created_at)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
