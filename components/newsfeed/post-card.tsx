import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Post, User, ApiPost, MediaAttachment } from "@/lib/types";
import { CreatePostRequest } from "@/lib/services/posts.service";
import { EventCard } from "./event-card";
import { PostActions } from "./post-actions";
import { PollVoting } from "./poll-voting";
import { CommentsSection } from "./comments-section";
import { PostEditForm } from "./post-edit-form";
import { postsService } from "@/lib/services/posts.service";
import { toast } from "sonner";
import { useClub } from "@/lib/club-context";
import { useEffect, useState } from "react";
import NextImage from "next/image";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const { selectedClub } = useClub();

  const reactionsCount =
    typeof post.reactions === "number"
      ? post.reactions
      : (post as { reactions?: { likes?: number } })?.reactions?.likes ?? 0;

  const isLiked = Boolean((post as { isLiked?: boolean })?.isLiked ?? false);
  const commentsCount =
    Array.isArray(post.comments) ? post.comments.length : Number(post.comments ?? 0);

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

  const canEdit = post.user?.id && (currentUser.id === post.user.id || currentUser.isAdmin);
  const canDelete = post.user?.id && (currentUser.id === post.user.id || currentUser.isAdmin);

  // Set hero image from joined media attachments
  useEffect(() => {
    const mediaAttachments = post.media_attachments;
    
    if (mediaAttachments && Array.isArray(mediaAttachments)) {
      const firstImage = mediaAttachments.find((a: MediaAttachment) => a.file_type === 'image');
      
      if (firstImage) {
        const path: string = firstImage.file_path;
        
        if (/^https?:\/\//i.test(path)) {
          setHeroImageUrl(path);
        } else {
          // Convert storage path to public URL
          const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(path);
          setHeroImageUrl(publicUrl);
        }
      }
    }
  }, [post]);

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
    <div className="bg-card border-t border-border p-4 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      {/* Post Header and Content */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
            {post.user.avatar}
          </div>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-card-foreground">
                {post.user.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {post.user.role}
              </Badge>
              {Boolean(post.content.event) && (
                <Badge variant="outline" className="text-xs">Event</Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {post.timestamp}
            </span>
          </div>
          
          {/* Post Content */}
          <p className="text-card-foreground text-sm leading-relaxed">
            {post.content.text}
          </p>
        
          {/* Event Card */}
          {post.content.event && (
            <>
              <EventCard event={post.content.event} />
            </>
          )}
          
          {/* Poll Voting */}
          {post.content.poll && (
            <PollVoting
              postId={post.id}
              pollQuestion={post.content.poll.question}
              pollOptions={post.content.poll.options}
              pollVotes={post.content.poll.votes}
              userVote={post.content.poll.userVote ?? null}
            />
          )}
          
          {/* Media (moved below content, near bottom) */}
          {heroImageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border/60 bg-muted/20">
              <NextImage
                src={heroImageUrl}
                alt={post.content.text.slice(0, 64) || 'Post image'}
                width={1200}
                height={675}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Post Actions */}
          <PostActions
            postId={post.id}
            reactions={reactionsCount}
            comments={commentsCount}
            isLiked={isLiked}
            onReaction={onReaction}
            onComment={handleCommentClick}
            onShare={onShare}
          />
        </div>
      </div>
      
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
