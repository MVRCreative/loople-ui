"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockConversations, mockMessages } from "@/lib/mock-messages"; // TODO(step1): replace mock with live Supabase query

interface MessageThreadProps {
  id: string;
  showBackOnMobile?: boolean;
}

export function MessageThread({ id, showBackOnMobile }: MessageThreadProps) {
  const convo = useMemo(() => mockConversations.find((c) => c.id === id), [id]);
  const messages = useMemo(
    () => mockMessages.filter((m) => m.conversationId === id),
    [id]
  );

  if (!convo) {
    return (
      <div className="w-[600px] bg-background h-screen sticky top-0 border-l border-r border-border flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className="w-[600px] bg-background h-screen sticky top-0 border-l border-r border-border flex flex-col">

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Placeholder profile summary */}
        <div className="pb-4 mb-2 border-b border-border/60">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-base">{convo.name.charAt(0)}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold leading-tight truncate">{convo.name}</p>
                <span className="text-xs text-muted-foreground truncate">{convo.handle}</span>
              </div>
              <p className="text-sm text-muted-foreground">cofounder @ turfsports • prev @vercel @figma @diagram</p>
              <p className="text-xs text-muted-foreground">Joined July 2016 • 14.2K Followers</p>
            </div>
          </div>
        </div>

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                m.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-background p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="flex items-center gap-2"
        >
          <Input placeholder="Start a new message" className="h-10" />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}


