"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useAuth } from "./auth-context"
import { useClub } from "./club-context"
import { messagesService } from "./services/messages.service"
import type { Conversation } from "./types/messages"
import { supabase } from "./supabase"

interface MessagesContextValue {
  conversations: Conversation[]
  loading: boolean
  unreadConversationCount: number
  unreadMessageCount: number
  refreshConversations: () => Promise<void>
  setConversationUnreadCount: (conversationId: number, unreadCount: number) => void
  updateConversationReadPointer: (
    conversationId: number,
    lastReadMessageId: number | null
  ) => void
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined)

interface MessagesProviderProps {
  children: ReactNode
}

export function MessagesProvider({ children }: MessagesProviderProps) {
  const { user, isAuthenticated } = useAuth()
  const { selectedClub } = useClub()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const refreshingRef = useRef(false)
  const staleRef = useRef(false)

  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated || !selectedClub?.id) {
      setConversations([])
      setLoading(false)
      return
    }

    if (refreshingRef.current) {
      staleRef.current = true
      return
    }

    refreshingRef.current = true
    setLoading(true)

    try {
      const nextConversations = await messagesService.getConversations(Number.parseInt(selectedClub.id, 10))
      setConversations(nextConversations)
    } catch (error: unknown) {
      const err = error as Record<string, unknown> | undefined
      console.error("Failed to refresh conversations:", err?.message ?? err?.code ?? error)
      setConversations([])
    } finally {
      setLoading(false)
      refreshingRef.current = false
      if (staleRef.current) {
        staleRef.current = false
        void refreshConversations()
      }
    }
  }, [isAuthenticated, selectedClub?.id])

  useEffect(() => {
    void refreshConversations()
  }, [refreshConversations])

  useEffect(() => {
    if (!isAuthenticated || !selectedClub?.id) return

    const interval = setInterval(() => {
      void refreshConversations()
    }, 60_000)

    const handleFocus = () => void refreshConversations()
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [isAuthenticated, refreshConversations, selectedClub?.id])

  useEffect(() => {
    if (!user?.id || !isAuthenticated) return

    let channel: RealtimeChannel | null = null
    let cancelled = false

    const setup = async () => {
      try {
        channel = await messagesService.subscribeToConversationList(
          user.id,
          () => {
            if (cancelled) return
            void refreshConversations()
          }
        )
      } catch (error) {
        console.error("[conversations] failed to subscribe to conversation updates:", error)
      }
    }

    void setup()

    return () => {
      cancelled = true
      void messagesService.removeChannel(channel)
      channel = null
    }
  }, [user?.id, isAuthenticated, refreshConversations])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED" && session?.access_token) {
        try {
          await supabase.realtime.setAuth(session.access_token)
        } catch (error) {
          console.error("[messages] failed to refresh realtime auth:", error)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const unreadConversationCount = useMemo(
    () => conversations.filter((conversation) => conversation.unread_count > 0).length,
    [conversations]
  )

  const unreadMessageCount = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + Math.max(conversation.unread_count, 0),
        0
      ),
    [conversations]
  )

  const setConversationUnreadCount = useCallback((conversationId: number, unreadCount: number) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, unread_count: Math.max(unreadCount, 0) }
          : conversation
      )
    )
  }, [])

  const updateConversationReadPointer = useCallback(
    (conversationId: number, lastReadMessageId: number | null) => {
      setConversations((previous) =>
        previous.map((conversation) => {
          if (conversation.id !== conversationId) return conversation

          return {
            ...conversation,
            unread_count: 0,
            participants: conversation.participants.map((participant) =>
              participant.user_id === user?.id
                ? {
                    ...participant,
                    last_read_message_id: lastReadMessageId,
                    last_read_at: new Date().toISOString(),
                  }
                : participant
            ),
          }
        })
      )
    },
    [user?.id]
  )

  const value = useMemo<MessagesContextValue>(
    () => ({
      conversations,
      loading,
      unreadConversationCount,
      unreadMessageCount,
      refreshConversations,
      setConversationUnreadCount,
      updateConversationReadPointer,
    }),
    [
      conversations,
      loading,
      refreshConversations,
      setConversationUnreadCount,
      unreadConversationCount,
      unreadMessageCount,
      updateConversationReadPointer,
    ]
  )

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
}

export function useMessages() {
  const context = useContext(MessagesContext)

  if (!context) {
    throw new Error("useMessages must be used within a MessagesProvider")
  }

  return context
}
