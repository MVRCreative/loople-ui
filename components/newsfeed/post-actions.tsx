"use client";

import { useState } from "react";
import { ThumbsUp, MessageCircle } from "lucide-react";

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
}: PostActionsProps) {
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);

  const handleReaction = () => {
    setLocalIsLiked(!localIsLiked);
    setLocalReactions(prev => localIsLiked ? prev - 1 : prev + 1);
    onReaction(postId);
  };

  return (
    <div className="flex items-center gap-6 pt-3">
      <button
        onClick={handleReaction}
        className={`flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1 transition-colors ${
          localIsLiked ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <ThumbsUp className={`h-4 w-4 ${localIsLiked ? "fill-current" : ""}`} />
        <span>{localReactions}</span>
      </button>
      
      <button
        onClick={() => onComment(postId)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>{comments}</span>
      </button>
    </div>
  );
}
