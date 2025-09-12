"use client";

import { useState, useEffect } from "react";
import { PostForm } from "./post-form";
import { PostCard } from "./post-card";
import { Post, User, ApiPost } from "@/lib/types";
import { postsService } from "@/lib/services/posts.service";
import { transformApiPostsToPosts } from "@/lib/utils/posts.utils";
import { toast } from "sonner";
import { useClub } from "@/lib/club-context";

interface NewsfeedProps {
  initialPosts: Post[];
  currentUser: User;
}

export function Newsfeed({ initialPosts, currentUser }: NewsfeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const { currentClub } = useClub();

  // Load posts from API on component mount
  useEffect(() => {
    if (currentClub?.id) {
      loadPosts();
    }
  }, [currentClub?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentClub?.id) return;

    const subscription = postsService.subscribeToPosts(currentClub.id, (payload) => {
      console.log('Real-time post update:', payload);
      
      if (payload.eventType === 'INSERT') {
        // New post added
        loadPosts(); // Reload all posts to get the latest data
      } else if (payload.eventType === 'UPDATE') {
        // Post updated (e.g., reaction count changed)
        loadPosts(); // Reload to get updated counts
      } else if (payload.eventType === 'DELETE') {
        // Post deleted
        setPosts(prev => prev.filter(post => post.id !== payload.old.id.toString()));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentClub?.id]);

  const loadPosts = async () => {
    if (!currentClub?.id) return;
    
    setLoading(true);
    try {
      const response = await postsService.getPosts({
        club_id: currentClub.id,
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (response.success && response.data) {
        const transformedPosts = transformApiPostsToPosts(response.data);
        setPosts(transformedPosts);
      } else {
        toast.error(response.error || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (content: string, type: "text" | "event" | "poll") => {
    if (!currentClub?.id) {
      toast.error('No club selected');
      return;
    }

    try {
      let postData: any = {
        club_id: currentClub.id,
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
        } catch (e) {
          // If parsing fails, treat as regular text
          console.warn('Failed to parse poll data, treating as text');
        }
      }

      const response = await postsService.createPost(postData);

      if (response.success && response.data) {
        // Add the new post to the beginning of the list
        const newPost = transformApiPostsToPosts([response.data])[0];
        setPosts(prev => [newPost, ...prev]);
        toast.success("Post created successfully!");
      } else {
        toast.error(response.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleReaction = async (postId: string) => {
    try {
      const response = await postsService.createReaction(parseInt(postId), {
        post_id: parseInt(postId),
        reaction_type: 'like'
      });

      if (response.success) {
        // Update the post's reaction count locally
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, reactions: post.reactions + 1, isLiked: true }
            : post
        ));
        toast.success("Reaction added!");
      } else {
        toast.error(response.error || 'Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const handleComment = (postId: string) => {
    // TODO: Implement comment functionality
    toast.info("Comment functionality coming soon!");
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: "Check out this post",
        text: "Shared from Loople",
        url: `${window.location.origin}/post/${postId}`,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="w-full">
      <PostForm currentUser={currentUser} onSubmit={handleCreatePost} />
      
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">Loading posts...</p>
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReaction={handleReaction}
              onComment={handleComment}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
      
      {!loading && posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No posts yet</p>
          <p className="text-sm">Be the first to share an update!</p>
        </div>
      )}
    </div>
  );
}
