"use client";

import { useState, useEffect } from "react";
import { PostForm } from "./post-form";
import { PostCard } from "./post-card";
import { SearchFilter } from "./search-filter";
import { Post, User, ApiPost } from "@/lib/types";
import { postsService, CreatePostRequest } from "@/lib/services/posts.service";
import { transformApiPostsToPosts } from "@/lib/utils/posts.utils";
import { toast } from "sonner";
import { useClub } from "@/lib/club-context";

interface NewsfeedProps {
  initialPosts: Post[];
  currentUser: User;
  isAuthenticated?: boolean;
}

export function Newsfeed({ initialPosts, currentUser, isAuthenticated = false }: NewsfeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  // const [searchFilters] = useState<Record<string, unknown>>({});
  const { selectedClub } = useClub();

  const loadPosts = async (filters: Record<string, unknown> = {}) => {
    if (!selectedClub?.id) return;
    
    setLoading(true);
    try {
      const response = await postsService.getPosts({
        club_id: parseInt(selectedClub.id),
        limit: 20,
        sort_by: 'created_at',
        sort_order: 'desc',
        ...filters
      });

      if (response.success && response.data) {
        const transformedPosts = transformApiPostsToPosts(response.data as unknown as ApiPost[]);
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

  // Load posts from API on component mount
  useEffect(() => {
    if (selectedClub?.id) {
      loadPosts();
    }
  }, [selectedClub?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!selectedClub?.id) return;

    const subscription = postsService.subscribeToPosts(parseInt(selectedClub.id), (payload) => {
      console.log('Real-time post update:', payload);
      const payloadData = payload as Record<string, unknown>;
      
      if (payloadData.eventType === 'INSERT') {
        // New post added
        loadPosts(); // Reload all posts to get the latest data
      } else if (payloadData.eventType === 'UPDATE') {
        // Post updated (e.g., reaction count changed)
        loadPosts(); // Reload to get updated counts
      } else if (payloadData.eventType === 'DELETE') {
        // Post deleted
        const oldData = payloadData.old as Record<string, unknown>;
        setPosts(prev => prev.filter(post => post.id !== (oldData.id as number).toString()));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedClub?.id]);

  const handleCreatePost = async (content: string, type: "text" | "event" | "poll", attachments?: File[]) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create posts');
      return;
    }

    if (!selectedClub?.id) {
      toast.error('No club selected');
      return;
    }

    try {
      const postData: CreatePostRequest = {
        club_id: parseInt(selectedClub.id),
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
          // If parsing fails, treat as regular text
          console.warn('Failed to parse poll data, treating as text');
        }
      }

      const response = await postsService.createPost(postData);

      if (response.success && response.data) {
        // Upload media attachments if any
        if (attachments && attachments.length > 0) {
          const postId = parseInt(response.data.id);
          for (const file of attachments) {
            try {
              await postsService.uploadMedia(postId, file);
            } catch (error) {
              console.error('Error uploading media:', error);
              toast.error(`Failed to upload ${file.name}`);
            }
          }
        }

        // Add the new post to the beginning of the list
        const newPost = transformApiPostsToPosts([response.data as unknown as ApiPost])[0];
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

  const handleComment = () => {
    // Comment functionality is handled by PostCard component
    // This function is called when comment button is clicked
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

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleSearch = (filters: Record<string, unknown>) => {
    // setSearchFilters(filters);
    loadPosts(filters);
  };

  const handleClearSearch = () => {
    // setSearchFilters({});
    loadPosts();
  };

  return (
    <div className="w-full py-2 sm:py-4 md:py-6 overflow-x-hidden">
      <PostForm currentUser={currentUser} onSubmit={handleCreatePost} isAuthenticated={isAuthenticated} />
      
      <SearchFilter 
        onSearch={handleSearch}
        onClear={handleClearSearch}
      />
      
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading posts...</p>
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {posts.map((post) => (
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
      )}
      
      {!loading && posts.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm">Be the first to share an update!</p>
        </div>
      )}
    </div>
  );
}
