"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { User } from "@/lib/types";
import { MentionInput } from "@/components/mentions/mention-input";
import { useClub } from "@/lib/club-context";

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
  placeholder = "Post your reply"
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { selectedClub } = useClub();
  const clubId = selectedClub?.id ? parseInt(selectedClub.id) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(content.trim(), parentCommentId);
        setContent("");
        setIsFocused(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3 items-start">
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarImage src={currentUser.avatar_url || ''} alt={currentUser.name} />
          <AvatarFallback className="bg-primary/10 text-xs">
            {currentUser.avatar}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <MentionInput
            value={content}
            onChange={(val) => { setContent(val); if (!isFocused) setIsFocused(true); }}
            clubId={clubId}
            as="input"
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-2 border-b border-border focus:border-primary transition-colors"
            disabled={isSubmitting}
          />
          
          {/* Action row — only show when focused or has content */}
          {(isFocused || content.trim()) && (
            <div className="flex items-center justify-end gap-2 pt-2 pb-1">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onCancel();
                    setIsFocused(false);
                    setContent("");
                  }}
                  disabled={isSubmitting}
                  className="h-8 px-3 text-muted-foreground"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                size="sm"
                className="h-8 px-4 rounded-full font-semibold"
              >
                {isSubmitting ? (
                  <Loader size="sm" />
                ) : (
                  'Reply'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
