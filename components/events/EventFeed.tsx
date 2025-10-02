"use client";

import { useEffect, useState } from "react";
import { PostForm } from "@/components/newsfeed/post-form";
import { PostCard } from "@/components/newsfeed/post-card";
import { Post, User, ApiPost } from "@/lib/types";
import { EventPost } from "@/lib/events/types";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { postsService } from "@/lib/services/posts.service";
import { transformApiPostsToPosts } from "@/lib/utils/posts.utils";
import { toast } from "sonner";

interface EventFeedProps {
  eventId: string;
  clubId?: number;
  className?: string;
}

export function EventFeed({ eventId, clubId, className }: EventFeedProps) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Convert auth user to frontend User type, or create guest user
  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  // Load posts on mount
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await postsService.getPosts({ event_id: parseInt(eventId), sort_by: 'created_at', sort_order: 'desc', limit: 20 });
        if (response.success && response.data) {
          setPosts(transformApiPostsToPosts(response.data as unknown as ApiPost[]));
        } else {
          setPosts([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };
    if (eventId) loadPosts();
  }, [eventId]);

  const transformedPosts = posts;

  const handleCreatePost = async (content: string, type: "text" | "event" | "poll") => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create posts');
      return;
    }

    try {
      // Prepare payload; polls require poll_question/poll_options fields on the backend
      let contentText = content;
      let pollQuestion: string | undefined;
      let pollOptions: string[] | undefined;

      if (type === 'poll') {
        try {
          const parsed = JSON.parse(content) as { text?: string; poll?: { question?: string; options?: string[] } };
          contentText = parsed.text || '';
          pollQuestion = parsed.poll?.question;
          pollOptions = parsed.poll?.options;
        } catch {
          // If parsing fails, keep defaults; backend will validate and return error
        }
      }

      const createRes = await postsService.createPost({
        club_id: clubId || 0,
        content_type: type,
        content_text: contentText,
        event_id: parseInt(eventId),
        ...(type === 'poll' && pollQuestion && pollOptions && pollOptions.length >= 2
          ? { poll_question: pollQuestion, poll_options: pollOptions }
          : {})
      });
      if (createRes.success && createRes.data) {
        const newPost = transformApiPostsToPosts([createRes.data as unknown as ApiPost])[0];
        setPosts(prev => [newPost, ...prev]);
        toast.success("Post created successfully!");
      } else {
        throw new Error(createRes.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleReaction = async (postId: string) => {
    try {
      // Optimistic UI is handled by PostActions; here we persist the reaction
      await postsService.createReaction(parseInt(postId), {
        post_id: parseInt(postId),
        reaction_type: 'like'
      });
    } catch (error) {
      console.error('Error reacting to post:', error);
      toast.error('Failed to react to post');
    }
  };

  const handleComment = (postId: string) => {
    // TODO: Implement comment functionality for event posts
    console.log('Comment for post:', postId);
    toast.info("Comment functionality coming soon!");
  };

  const handleShare = (postId: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Check out this post",
        text: "Shared from Loople",
        url: `${window.location.origin}/event/${eventId}#post-${postId}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/event/${eventId}#post-${postId}`);
      toast.success("Link copied to clipboard!");
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    // TODO: Implement post update functionality
    console.log('Post updated:', updatedPost);
    toast.info("Post update functionality coming soon!");
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    toast.success("Post deleted successfully");
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading event posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-12 text-destructive">
          <p className="text-lg font-medium">Failed to load posts</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Post Form */}
      <PostForm 
        currentUser={currentUser} 
        onSubmit={handleCreatePost} 
        isAuthenticated={isAuthenticated} 
      />
      
      {/* Posts List */}
      {transformedPosts.length > 0 ? (
        <div className="space-y-0">
          {transformedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onReaction={handleReaction}
              onComment={handleComment}
              onShare={handleShare}
              onPostUpdate={handlePostUpdate}
              onPostDelete={handlePostDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm">Be the first to share an update about this event!</p>
        </div>
      )}
    </div>
  );
}