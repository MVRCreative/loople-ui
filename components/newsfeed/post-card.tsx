import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Post, User, ApiPost } from "@/lib/types";
import { CreatePostRequest } from "@/lib/services/posts.service";
import { EventCard } from "./event-card";
import { PostActions } from "./post-actions";
import { PollVoting } from "./poll-voting";
import { CommentsSection } from "./comments-section";
import { PostEditForm } from "./post-edit-form";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { postsService } from "@/lib/services/posts.service";
import { toast } from "sonner";
import { useClub } from "@/lib/club-context";
import { useState } from "react";

interface PostCardProps {
  post: Post;
  currentUser: User;
  onReaction: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onPostUpdate?: (post: Post) => void;
  onPostDelete?: (postId: string) => void;
  isFirst?: boolean;
}

export function PostCard({ post, currentUser, onReaction, onComment, onShare, onPostUpdate, onPostDelete, isFirst = false }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { selectedClub } = useClub();

  const handleCommentClick = () => {
    setShowComments(!showComments);
    onComment(post.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      try {
        const response = await postsService.deletePost(parseInt(post.id));
        if (response.success) {
          toast.success("Post deleted successfully");
          onPostDelete?.(post.id);
        } else {
          toast.error(response.error || 'Failed to delete post');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error('Failed to delete post');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handlePostUpdate = async (postId: string, content: string, type: "text" | "event" | "poll") => {
    try {
      const postData: CreatePostRequest = {
        club_id: parseInt(selectedClub?.id || '0'),
        content_type: type,
        content_text: content,
      };

      // Handle poll data
      if (type === "poll") {
        try {
          const parsedContent = JSON.parse(content);
          postData.content_text = parsedContent.text;
          postData.poll_question = parsedContent.poll.question;
          postData.poll_options = parsedContent.poll.options;
        } catch {
          console.warn('Failed to parse poll data, treating as text');
        }
      }

      const response = await postsService.updatePost(parseInt(postId), postData);

      if (response.success && response.data) {
        // Transform the updated post data
        const { transformApiPostToPost } = await import('@/lib/utils/posts.utils');
        const updatedPost = transformApiPostToPost(response.data as unknown as ApiPost);
        onPostUpdate?.(updatedPost);
        setIsEditing(false);
        toast.success("Post updated successfully!");
      } else {
        toast.error(response.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  const canEdit = currentUser.id === post.user.id || currentUser.isAdmin;
  const canDelete = currentUser.id === post.user.id || currentUser.isAdmin;

  if (isEditing) {
    return (
      <PostEditForm
        post={post}
        currentUser={currentUser}
        onSubmit={handlePostUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-5 shadow-sm">
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
        
        {/* Poll Card - TODO: Implement poll display */}
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
        isLiked={post.reactions.likes > 0}
        onReaction={onReaction}
        onComment={onComment}
        onShare={onShare}
      />
      
      {/* Comments Section */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          comments={post.comments}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
