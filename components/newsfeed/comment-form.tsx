"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { User } from "@/lib/types";

interface CommentFormProps {
  currentUser: User;
  onSubmit: (content: string, parentCommentId?: number) => void;
  onCancel?: () => void;
  parentCommentId?: number;
  placeholder?: string;
}

export function CommentForm({ 
  currentUser, 
  onSubmit, 
  onCancel, 
  parentCommentId,
  placeholder = "Write a comment..."
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(content.trim(), parentCommentId);
        setContent("");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser.avatar_url || ''} alt={currentUser.name} />
          <AvatarFallback className="bg-primary/10 text-sm">
            {currentUser.avatar}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[60px] p-3 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            rows={2}
            disabled={isSubmitting}
            suppressHydrationWarning
          />
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              {parentCommentId ? "Replying to comment" : "Commenting on post"}
            </div>
            
            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="h-8 px-3"
                  suppressHydrationWarning
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="h-8 px-4"
                suppressHydrationWarning
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader size="sm" />
                    Posting...
                  </div>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
