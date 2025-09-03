"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Calendar, MessageCircle } from "lucide-react";
import { User } from "@/lib/types";

interface PostFormProps {
  currentUser: User;
  onSubmit: (content: string, type: "text" | "event" | "poll") => void;
}

export function PostForm({ currentUser, onSubmit }: PostFormProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "event" | "poll">("text");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), postType);
      setContent("");
      setPostType("text");
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
              {currentUser.avatar}
            </div>
          </Avatar>
          
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update with your club..."
              className="w-full min-h-[60px] p-3 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
              suppressHydrationWarning
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={postType === "event" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("event")}
                  className="h-8 px-3"
                  suppressHydrationWarning
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Event
                </Button>
                <Button
                  type="button"
                  variant={postType === "poll" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("poll")}
                  className="h-8 px-3"
                  suppressHydrationWarning
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Poll
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={!content.trim()}
                className="h-8 px-4"
                suppressHydrationWarning
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
