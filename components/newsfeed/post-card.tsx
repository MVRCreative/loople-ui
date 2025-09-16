"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@/lib/types";
import { EventCard } from "./event-card";
import { PostActions } from "./post-actions";

interface PostCardProps {
  post: Post;
  onReaction: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  isFirst?: boolean;
}

export function PostCard({
  post,
  onReaction,
  onComment,
  onShare,
  isFirst = false,
}: PostCardProps) {
  return (
    <div className={`p-8 mb-4 ${!isFirst ? "border-t border-border" : ""}`}>
      {/* Post Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            {post.user.avatar}
          </div>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-card-foreground">
                {post.user.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {post.user.role}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {post.timestamp}
            </span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-card-foreground text-sm leading-relaxed">
          {post.content.text}
        </p>

        {/* Event Card */}
        {post.content.type === "event" && post.content.event && (
          <EventCard event={post.content.event} />
        )}

        {/* Poll placeholder */}
        {post.content.type === "poll" && post.content.poll && (
          <div className="bg-muted/50 border border-border rounded-lg p-4 mt-3">
            <p className="font-medium text-card-foreground mb-2">
              {post.content.poll.question}
            </p>
            <p className="text-sm text-muted-foreground">
              Poll functionality coming soon...
            </p>
          </div>
        )}
      </div>

      {/* Post Actions */}
      <PostActions
        postId={post.id}
        reactions={post.reactions}
        comments={post.comments}
        isLiked={post.isLiked}
        onReaction={onReaction}
        onComment={onComment}
        onShare={onShare}
      />
    </div>
  );
}
