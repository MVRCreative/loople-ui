"use client";

import { useParams } from "next/navigation";
import { ConversationsList } from "@/components/ConversationsList";
import { MessageThread } from "@/components/MessageThread";

export default function MessageThreadPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      {/* Conversations list - middle column */}
      <ConversationsList selectedId={id} />
      
      {/* Message thread - right column */}
      <div className="flex-1">
        <MessageThread id={id} />
      </div>
    </div>
  );
}


