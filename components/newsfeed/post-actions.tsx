"use client";

import { useState, useRef, useCallback } from "react";
import { Heart, MessageCircle, Share } from "lucide-react";

interface PostActionsProps {
  postId: string;
  reactions: number;
  comments: number;
  isLiked: boolean;
  onReaction: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  isOptimistic?: boolean;
}

export function PostActions({
  postId,
  reactions,
  comments,
  isLiked,
  onReaction,
  onComment,
  onShare,
  isOptimistic = false,
}: PostActionsProps) {
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const heartRef = useRef<HTMLButtonElement>(null);

  const handleReaction = useCallback(() => {
    if (isOptimistic) return;
    const willLike = !localIsLiked;
    setLocalIsLiked(willLike);
    setLocalReactions(prev => willLike ? prev + 1 : prev - 1);

    if (willLike) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }

    onReaction(postId);
  }, [isOptimistic, localIsLiked, onReaction, postId]);

  const handleComment = useCallback(() => {
    if (isOptimistic) return;
    onComment(postId);
  }, [isOptimistic, onComment, postId]);

  const handleShare = useCallback(() => {
    if (isOptimistic) return;
    onShare(postId);
  }, [isOptimistic, onShare, postId]);

  return (
    <div className="flex items-center gap-1 pt-2 -ml-2">
      {/* Like */}
      <button
        ref={heartRef}
        onClick={handleReaction}
        disabled={isOptimistic}
        className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          localIsLiked
            ? "text-red-500"
            : "text-muted-foreground hover:text-red-500"
        } hover:bg-red-500/10`}
      >
        <Heart
          className={`h-[18px] w-[18px] transition-all duration-200 ${
            localIsLiked ? "fill-current" : ""
          } ${isAnimating ? "animate-like-pop" : ""}`}
        />
        {localReactions > 0 && (
          <span className="text-[13px] tabular-nums">{localReactions}</span>
        )}
      </button>

      {/* Comment */}
      <button
        onClick={handleComment}
        disabled={isOptimistic}
        className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageCircle className="h-[18px] w-[18px]" />
        {comments > 0 && (
          <span className="text-[13px] tabular-nums">{comments}</span>
        )}
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        disabled={isOptimistic}
        className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-green-500 hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Share className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
