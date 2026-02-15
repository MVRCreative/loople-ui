"use client"

import { ConversationsList } from "@/components/ConversationsList"
import { NewMessageCompose } from "@/components/messages/new-message-compose"

export default function NewMessagePage() {
  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      {/* Conversations list — left column */}
      <ConversationsList />

      {/* New message compose — right column */}
      <div className="flex-1">
        <NewMessageCompose />
      </div>
    </div>
  )
}
