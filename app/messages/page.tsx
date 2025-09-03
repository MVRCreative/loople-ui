"use client";

import { ConversationsList } from "@/components/ConversationsList";

export default function MessagesPage() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Middle column content only; right rail empty state is handled by ConditionalSidebar */}
      <ConversationsList />
    </div>
  );
}


