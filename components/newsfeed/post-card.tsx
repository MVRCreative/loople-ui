import { useState } from "react";
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

interface PostCardProps {
  post: Post;
  currentUser: User;
  onReaction: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onPostUpdate?: (updatedPost: Post) => void;
  onPostDelete?: (postId: string) => void;
}

export function PostCard({ post, currentUser, onReaction, onComment, onShare, onPostUpdate, onPostDelete }: PostCardProps) {
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 md:mb-4 shadow-sm overflow-x-hidden">
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
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {post.timestamp}
              </span>
              
              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted"
                      disabled={isDeleting}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit Post
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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
            userVote={post.content.poll.userVote}
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
        onComment={handleCommentClick}
        onShare={onShare}
      />

      {/* Comments Section */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
