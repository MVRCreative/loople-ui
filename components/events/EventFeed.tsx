"use client";

import { useEffect, useState } from "react";
import { PostForm } from "@/components/newsfeed/post-form";
import { PostCard } from "@/components/newsfeed/post-card";
import { Post, User } from "@/lib/types";
import { EventPost } from "@/lib/events/types";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { getPostsByEventId } from "@/lib/mocks/events";
import { toast } from "sonner";

interface EventFeedProps {
  eventId: string;
  className?: string;
}

export function EventFeed({ eventId, className }: EventFeedProps) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<EventPost[]>([]);
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
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        setPosts(getPostsByEventId(eventId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [eventId]);

  // Transform event posts to match PostCard expectations
  const [transformedPosts, setTransformedPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (posts && posts.length > 0) {
      const transformed = posts.map((eventPost): Post => ({
        id: eventPost.post.id,
        user: {
          id: eventPost.post.user.id,
          name: eventPost.post.user.name,
          role: eventPost.post.user.role,
          avatar: eventPost.post.user.avatar,
          isAdmin: false, // TODO: Determine from user data
        },
        content: {
          type: eventPost.post.content_type as "text" | "event" | "poll",
          text: eventPost.post.content,
        },
        timestamp: new Date(eventPost.post.created_at).toLocaleString(),
        reactions: 0, // TODO: Get from post data
        comments: 0, // TODO: Get from post data
        isLiked: false, // TODO: Get from user's reaction data
      }));
      
      setTransformedPosts(transformed);
    } else {
      setTransformedPosts([]);
    }
  }, [posts]);

  const handleCreatePost = async (content: string, type: "text" | "event" | "poll") => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create posts');
      return;
    }

    try {
      // TODO: Implement real API call to create event post
      // For now, create a mock post
      const mockPost: EventPost = {
        id: `event-post-${Date.now()}`,
        event_id: eventId,
        post_id: `post-${Date.now()}`,
        created_at: new Date().toISOString(),
        post: {
          id: `post-${Date.now()}`,
          content,
          content_type: type,
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
          user: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
            role: currentUser.role,
          },
        },
      };

      setPosts(prev => [...prev, mockPost]);
      toast.success("Post created successfully!");
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleReaction = async (postId: string) => {
    // TODO: Implement reaction functionality for event posts
    console.log('Reaction for post:', postId);
    toast.info("Reaction functionality coming soon!");
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
    setPosts(prev => prev.filter(post => post.post_id !== postId));
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