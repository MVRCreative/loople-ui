"use client";

import { ConversationsList } from "@/components/ConversationsList";
// MessageThread is intentionally not imported here; the index page shows an empty state.

export default function MessagesPage() {
  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      {/* Conversations list - middle column */}
      <ConversationsList />
      
      {/* Message thread - right column */}
      <div className="flex-1 flex items-center justify-center bg-background text-foreground border-l border-r border-border">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Select a conversation</h3>
            <p className="text-sm text-muted-foreground">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      </div>
    </div>
  );
}


