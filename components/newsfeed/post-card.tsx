import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Post } from "@/lib/types";
import { EventCard } from "./event-card";
import { PostActions } from "./post-actions";
import { PollVoting } from "./poll-voting";

interface PostCardProps {
  post: Post;
  onReaction: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

export function PostCard({ post, onReaction, onComment, onShare }: PostCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4">
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
        
        {/* Poll Card */}
        {post.content.type === "poll" && post.content.poll && (
          <PollVoting
            postId={post.id}
            pollQuestion={post.content.poll.question}
            pollOptions={post.content.poll.options}
            pollVotes={post.content.poll.votes}
          />
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
