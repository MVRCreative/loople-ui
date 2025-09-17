"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";

interface PostActionsProps {
  postId: string;
  reactions: number;
  comments: number;
  isLiked: boolean;
  onReaction: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

export function PostActions({
  postId,
  reactions,
  comments,
  isLiked,
  onReaction,
  onComment,
  onShare,
}: PostActionsProps) {
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);

  const handleReaction = () => {
    setLocalIsLiked(!localIsLiked);
    setLocalReactions(prev => localIsLiked ? prev - 1 : prev + 1);
    onReaction(postId);
  };

  return (
    <div className="flex items-center justify-between pt-3">
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReaction}
          className={`h-8 px-3 gap-2 ${
            localIsLiked ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <ThumbsUp className={`h-4 w-4 ${localIsLiked ? "fill-current" : ""}`} />
          <span className="text-sm">{localReactions}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onComment(postId)}
          className="h-8 px-3 gap-2 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">{comments}</span>
        </Button>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onShare(postId)}
        className="h-8 px-3 gap-2 text-muted-foreground hover:text-foreground"
      >
        <Share2 className="h-4 w-4" />
        <span className="text-sm">Share</span>
      </Button>
    </div>
  );
}
