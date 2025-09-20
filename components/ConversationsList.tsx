"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import { mockConversations } from "@/lib/mock-messages"; // DEPRECATED: This component uses mock data and should be replaced with real Supabase messaging
import { useEffect, useMemo, useState } from "react";

interface ConversationsListProps {
  selectedId?: string;
}

export function ConversationsList({ selectedId }: ConversationsListProps) {
  // Local state for read/unread styling and ordering
  const [conversations, setConversations] = useState(() => mockConversations);

  // Mark selected conversation as read when viewing its thread
  useEffect(() => {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, unread: false } : c))
    );
  }, [selectedId]);

  const ordered = useMemo(() => conversations, [conversations]);

  return (
    <div className="w-[350px] border-l border-r border-border bg-background text-foreground h-screen sticky top-0">
      <div className="p-3 sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <Input placeholder="Search Direct Messages" className="h-9" />
          <Button size="icon" variant="ghost" aria-label="New message" className="shrink-0">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-3.25rem)]">
        <ul>
          {/* Message requests placeholder */}
          <li>
            <Link
              href="#"
              className="block px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:bg-muted/50"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Message requests</p>
                  <p className="text-xs text-muted-foreground">7 pending requests</p>
                </div>
              </div>
            </Link>
          </li>
          {ordered.map((c) => {
            const isActive = c.id === selectedId;
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className={`block px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isActive ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm">{c.name.charAt(0)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate ${c.unread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>{c.name}</p>
                        <span className="text-xs text-muted-foreground">{c.lastTimestamp}</span>
                      </div>
                      <p className={`text-xs truncate ${c.unread ? "text-foreground" : "text-muted-foreground"}`}>{c.lastMessage}</p>
                    </div>
                    {c.unread && <span className="h-2 w-2 rounded-full bg-primary mt-2" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}


