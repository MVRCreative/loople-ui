"use client";

import { useParams } from "next/navigation";
import { ConversationsList } from "@/components/ConversationsList";
import { MessageThread } from "@/components/MessageThread";

export default function MessageThreadPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* On mobile (<lg), only show the thread with a back button; at >=lg, list + thread are shown via ConditionalSidebar's right rail */}
      <div className="lg:hidden">
        <MessageThread id={id} showBackOnMobile />
      </div>
      <div className="hidden lg:block">
        <ConversationsList selectedId={id} />
      </div>
    </div>
  );
}


