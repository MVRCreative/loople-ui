"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockConversations, mockMessages } from "@/lib/mock-messages"; // DEPRECATED: This component uses mock data and should be replaced with real Supabase messaging

interface MessageThreadProps {
  id: string;
}

export function MessageThread({ id }: MessageThreadProps) {
  const convo = useMemo(() => mockConversations.find((c) => c.id === id), [id]);
  const initialMessages = useMemo(
    () => mockMessages.filter((m) => m.conversationId === id),
    [id]
  );
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  if (!convo) {
    return (
      <div className="w-full bg-background h-screen sticky top-0 border-l border-r border-border flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-background h-screen sticky top-0 border-l border-r border-border flex flex-col">

      <div id="thread-scroll-container" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Placeholder profile summary */}
        <div className="pb-4 mb-2 border-b border-border/60">
          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-base">{convo.name.charAt(0)}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold leading-tight truncate text-foreground">{convo.name}</p>
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
                m.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
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
            const trimmed = draft.trim();
            if (!trimmed) return;
            const newMessage = {
              id: `local-${Date.now()}`,
              conversationId: id,
              sender: "me" as const,
              text: trimmed,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, newMessage]);
            setDraft("");
            // Scroll to bottom after send
            queueMicrotask(() => {
              const container = document.querySelector("#thread-scroll-container");
              if (container) container.scrollTop = container.scrollHeight;
            });
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Start a new message"
            className="h-10"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}


