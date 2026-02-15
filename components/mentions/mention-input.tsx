"use client"

/**
 * MentionInput — A text input with @mention autocomplete.
 *
 * Usage:
 *   <MentionInput
 *     value={text}
 *     onChange={setText}
 *     clubId={42}
 *     placeholder="What's happening?"
 *   />
 *
 * Accessibility: keyboard-navigable dropdown, aria-live for results.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { mentionsService, type MentionableUser } from "@/lib/services/mentions.service"

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  clubId: number
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Render as textarea (default) or input */
  as?: "textarea" | "input"
  rows?: number
}

export function MentionInput({
  value,
  onChange,
  clubId,
  placeholder,
  className = "",
  disabled = false,
  as = "textarea",
  rows = 1,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<MentionableUser[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  // Detect @mention trigger
  const detectMention = useCallback(
    (text: string, cursorPos: number) => {
      // Look backwards from cursor for an @ character
      const beforeCursor = text.slice(0, cursorPos)
      const atIndex = beforeCursor.lastIndexOf("@")

      if (atIndex === -1) {
        setMentionQuery(null)
        setShowSuggestions(false)
        return
      }

      // Ensure the @ is at the start of a word
      if (atIndex > 0 && !/\s/.test(beforeCursor[atIndex - 1])) {
        setMentionQuery(null)
        setShowSuggestions(false)
        return
      }

      const query = beforeCursor.slice(atIndex + 1)

      // If there's a space after the query text, the mention is complete
      if (query.includes(" ")) {
        setMentionQuery(null)
        setShowSuggestions(false)
        return
      }

      setMentionQuery(query)
      setMentionStart(atIndex)
    },
    []
  )

  // Search for users when mention query changes
  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      const results = await mentionsService.searchMentionableUsers(clubId, mentionQuery)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      setSelectedIndex(0)
    }, 200)

    return () => clearTimeout(timer)
  }, [mentionQuery, clubId])

  const insertMention = (user: MentionableUser) => {
    const handle = user.username ?? `${user.first_name}${user.last_name}`.replace(/\s/g, "")
    const before = value.slice(0, mentionStart)
    const after = value.slice(
      mentionStart + 1 + (mentionQuery?.length ?? 0)
    )
    const newValue = `${before}@${handle} ${after}`
    onChange(newValue)
    setShowSuggestions(false)
    setMentionQuery(null)

    // Re-focus the input
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const cursorPos = mentionStart + handle.length + 2 // @handle + space
        inputRef.current.setSelectionRange(cursorPos, cursorPos)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && suggestions[selectedIndex]) {
      e.preventDefault()
      insertMention(suggestions[selectedIndex])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    const cursorPos = e.target.selectionStart ?? newValue.length
    detectMention(newValue, cursorPos)
  }

  const handleClick = () => {
    if (inputRef.current) {
      const cursorPos = inputRef.current.selectionStart ?? value.length
      detectMention(value, cursorPos)
    }
  }

  const sharedProps = {
    ref: inputRef as React.Ref<HTMLTextAreaElement & HTMLInputElement>,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onClick: handleClick,
    placeholder,
    disabled,
    className,
    rows: as === "textarea" ? rows : undefined,
  }

  return (
    <div className="relative">
      {as === "textarea" ? (
        <textarea {...sharedProps} />
      ) : (
        <input type="text" {...sharedProps} />
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          className="absolute left-0 bottom-full mb-1 w-64 rounded-lg border border-border bg-popover shadow-lg z-50 overflow-hidden"
          role="listbox"
          aria-label="Mention suggestions"
        >
          {suggestions.map((user, idx) => (
            <button
              key={user.user_id}
              role="option"
              aria-selected={idx === selectedIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                insertMention(user)
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${
                idx === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
              }`}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-xs">
                  {user.first_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.first_name} {user.last_name}
                </p>
                {user.username && (
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
