import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MentionText } from "@/components/mentions/mention-text";
import { cachePostForDetail, postStatusPath } from "@/lib/utils/post-detail-cache";

interface PostCardProps {
  post: Post;
  currentUser: User;
  onReaction: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onPostUpdate?: (post: Post) => void;
  onPostDelete?: (postId: string) => void;
  isFirst?: boolean;
  /** Full-page post view: no inline comment thread (comments live below). */
  detailMode?: boolean;
}

export function PostCard({
  post,
  currentUser,
  onReaction,
  onComment,
  onShare,
  onPostUpdate,
  onPostDelete,
  detailMode = false,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const { selectedClub } = useClub();
  const router = useRouter();

  const openStatusPage = useCallback(() => {
    if (post.isOptimistic || detailMode) return;
    cachePostForDetail(post);
    router.push(postStatusPath(post.id));
  }, [post, router, detailMode]);

  const handlePostBodyClick = (e: React.MouseEvent<HTMLElement>) => {
    if (detailMode || post.isOptimistic) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (
      t.closest(
        "a[href], button, input, textarea, select, [role='button'], [data-poll-root]",
      )
    ) {
      return;
    }
    openStatusPage();
  };

  const handlePostBodyKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (detailMode || post.isOptimistic) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target;
    if (t instanceof Element && t.closest("[data-poll-root], button, input, a[href]")) {
      return;
    }
    e.preventDefault();
    openStatusPage();
  };

  const reactionsCount =
    typeof post.reactions === "number"
      ? post.reactions
      : (post as { reactions?: { likes?: number } })?.reactions?.likes ?? 0;

  const isLiked = Boolean((post as { isLiked?: boolean })?.isLiked ?? false);
  const commentsCount =
    Array.isArray(post.comments) ? post.comments.length : Number(post.comments ?? 0);
  
  const username = post.user.username?.trim() || null;

  const handleCommentClick = () => {
    if (!detailMode) {
      setShowComments(!showComments);
    }
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

  const canEdit = post.user?.id && (currentUser.id === post.user.id || currentUser.isAdmin) && !post.isOptimistic;
  const canDelete = post.user?.id && (currentUser.id === post.user.id || currentUser.isAdmin) && !post.isOptimistic;

  // Set hero image from joined media attachments
  useEffect(() => {
    const mediaAttachments = post.media_attachments;
    
    if (mediaAttachments && Array.isArray(mediaAttachments)) {
      const firstImage = mediaAttachments.find((a: MediaAttachment) => a.file_type === 'image');
      
      if (firstImage) {
        const path: string = firstImage.file_path;
        
        // Handle blob URLs (optimistic posts)
        if (path.startsWith('blob:')) {
          setHeroImageUrl(path);
        } else if (/^https?:\/\//i.test(path)) {
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
    <div className={`bg-card border-b border-border px-4 py-3 transition-colors hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.03] ${post.isOptimistic ? 'opacity-70' : ''}`}>
      {/* Post Header */}
      <div className="flex items-start gap-3">
        {username ? (
          <Link href={`/profile/${username}`} className="shrink-0">
            <Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
              <AvatarImage src={post.user.avatar_url || ''} alt={post.user.name} />
              <AvatarFallback className="bg-primary/10 text-lg">
                {post.user.avatar}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-10 w-10 transition-opacity hover:opacity-80">
            <AvatarImage src={post.user.avatar_url || ''} alt={post.user.name} />
            <AvatarFallback className="bg-primary/10 text-lg">
              {post.user.avatar}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Header: single truncated line + reserved column for ⋮ (no overlap) */}
          <div className="flex items-start gap-2 min-w-0">
            <p className="min-w-0 flex-1 truncate text-[15px] leading-snug text-card-foreground">
              {username ? (
                <Link
                  href={`/profile/${username}`}
                  className="font-semibold hover:underline"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  {post.user.name}
                </Link>
              ) : (
                <span className="font-semibold">{post.user.name}</span>
              )}
              {username && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  @{username}
                </span>
              )}
              <span className="text-muted-foreground font-normal"> · </span>
              {!post.isOptimistic && !detailMode ? (
                <Link
                  href={postStatusPath(post.id)}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    cachePostForDetail(post);
                  }}
                  className="text-muted-foreground font-normal hover:text-primary hover:underline"
                >
                  {post.timestamp}
                </Link>
              ) : (
                <span className="text-muted-foreground font-normal">{post.timestamp}</span>
              )}
            </p>
            {(canEdit || canDelete) && (
              <div className="shrink-0 relative z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                      aria-label="Post options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit post
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete post'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Clickable body: opens /status/{id} (excludes poll / links / buttons) */}
          <div
            role={!detailMode && !post.isOptimistic ? "link" : undefined}
            tabIndex={!detailMode && !post.isOptimistic ? 0 : undefined}
            aria-label={
              !detailMode && !post.isOptimistic
                ? `Open post by ${post.user.name}`
                : undefined
            }
            className={
              !detailMode && !post.isOptimistic
                ? "cursor-pointer rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                : undefined
            }
            onClick={handlePostBodyClick}
            onKeyDown={handlePostBodyKeyDown}
          >
            {/* Role badge (below name row, subtle) */}
            <div className="flex items-center gap-2 mt-0.5 mb-2">
              <Badge variant="secondary" className="text-xs">
                {post.user.role}
              </Badge>
              {Boolean(post.content.event) && (
                <Badge variant="outline" className="text-xs">
                  Event
                </Badge>
              )}
            </div>

            {/* Post Content */}
            <p className="text-card-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
              <MentionText text={post.content.text} />
            </p>

            {/* Event Card */}
            {post.content.event && <EventCard event={post.content.event} />}

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

            {/* Media */}
            {heroImageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-border/60 bg-muted/20 pointer-events-none">
                {heroImageUrl.startsWith("blob:") ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImageUrl}
                      alt={post.content.text.slice(0, 64) || "Post image"}
                      className="w-full h-auto object-cover"
                    />
                  </>
                ) : (
                  <NextImage
                    src={heroImageUrl}
                    alt={post.content.text.slice(0, 64) || "Post image"}
                    width={1200}
                    height={675}
                    className="w-full h-auto object-cover"
                  />
                )}
              </div>
            )}
          </div>

          {/* Post Actions */}
          <PostActions
            key={`${post.id}-${reactionsCount}-${isLiked}`}
            postId={post.id}
            reactions={reactionsCount}
            comments={commentsCount}
            isLiked={isLiked}
            onReaction={onReaction}
            onComment={handleCommentClick}
            onShare={onShare}
            isOptimistic={post.isOptimistic}
          />
        </div>
      </div>
      
      {/* Comments Section — animated expand (feed only) */}
      {!detailMode && (
        <div
          className={`grid transition-all duration-300 ease-out ${
            showComments ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            {showComments && (
              <div className="ml-13">
                <CommentsSection
                  postId={post.id}
                  currentUser={currentUser}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
