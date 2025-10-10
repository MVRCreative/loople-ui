"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostForm } from "./post-form";
import { PostCard } from "./post-card";
import { Loader } from "@/components/ui/loader";
import { Post, User, ApiPost } from "@/lib/types";
import { postsService, CreatePostRequest } from "@/lib/services/posts.service";
import { transformApiPostsToPosts } from "@/lib/utils/posts.utils";
import { useClub } from "@/lib/club-context";
import { toast } from "sonner";

interface NewsfeedProps {
  initialPosts: Post[];
  currentUser: User;
  isAuthenticated?: boolean;
}

export function Newsfeed({ initialPosts, currentUser, isAuthenticated = false }: NewsfeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  // const [searchFilters] = useState<Record<string, unknown>>({});
  const { selectedClub, loading: clubLoading } = useClub();
  const isHandlingOptimisticPost = useRef(false);

  const loadPosts = useCallback(async (filters: Record<string, unknown> = {}) => {
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
  }, [selectedClub?.id]);

  // Load posts from API when club becomes available
  useEffect(() => {
    if (selectedClub?.id) {
      loadPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!selectedClub?.id) return;

    const channel = postsService.subscribeToPosts(parseInt(selectedClub.id), (payload) => {
        const payloadData = payload as Record<string, unknown>;

      if (payloadData.eventType === 'INSERT') {
        // Skip reload if we're currently handling an optimistic post
        // The optimistic update already added it to the feed
        if (isHandlingOptimisticPost.current) {
          return;
        }
        // New post added (from another user or different session)
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
      postsService.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub?.id]);

  // attachments can be native File[] or external uploads with url/name/size/type
  const handleCreatePost = async (content: string, type: "text" | "event" | "poll", attachments?: Array<File | { url: string; name: string; size: number; type: string }>) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create posts');
      return;
    }

    if (!selectedClub?.id) {
      toast.error('No club selected');
      return;
    }

    // Generate temporary post ID
    const tempPostId = `temp-${Date.now()}`;
    const blobUrls: string[] = [];

    // Create optimistic media attachments from File objects
    const optimisticMedia: Array<{
      id: number
      file_name: string
      file_path: string
      file_size: number
      mime_type: string
      file_type: string
      created_at: string
    }> = [];

    if (attachments && attachments.length > 0) {
      attachments.forEach((file, index) => {
        if (file instanceof File) {
          const blobUrl = URL.createObjectURL(file);
          blobUrls.push(blobUrl);
          optimisticMedia.push({
            id: -(index + 1), // Negative ID for temp media
            file_name: file.name,
            file_path: blobUrl, // Use blob URL for immediate display
            file_size: file.size,
            mime_type: file.type,
            file_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
            created_at: new Date().toISOString(),
          });
        } else if (file && typeof (file as { url: string }).url === 'string') {
          // External uploads already have URLs
          const fileData = file as { url: string; name: string; size: number; type: string };
          optimisticMedia.push({
            id: -(index + 1),
            file_name: fileData.name,
            file_path: fileData.url,
            file_size: fileData.size,
            mime_type: fileData.type,
            file_type: fileData.type.startsWith('image/') ? 'image' : fileData.type.startsWith('video/') ? 'video' : 'file',
            created_at: new Date().toISOString(),
          });
        }
      });
    }

    // Parse poll data if needed
    let pollQuestion = '';
    let pollOptions: string[] = [];
    let pollVotes: Record<string, number> = {};
    let contentText = content;

    if (type === "poll") {
      try {
        const parsedContent = JSON.parse(content);
        contentText = parsedContent.text;
        pollQuestion = parsedContent.poll.question;
        pollOptions = parsedContent.poll.options;
        // Initialize empty votes
        pollVotes = pollOptions.reduce((acc, _, idx) => {
          acc[idx.toString()] = 0;
          return acc;
        }, {} as Record<string, number>);
      } catch {
        console.warn('Failed to parse poll data, treating as text');
      }
    }

    // Create optimistic post
    const optimisticPost: Post = {
      id: tempPostId,
      user: currentUser,
      content: {
        type,
        text: contentText,
        ...(type === "poll" && pollQuestion && {
          poll: {
            question: pollQuestion,
            options: pollOptions,
            votes: pollVotes,
            userVote: null,
          }
        }),
      },
      timestamp: 'Just now',
      reactions: 0,
      comments: 0,
      isLiked: false,
      media_attachments: optimisticMedia.length > 0 ? optimisticMedia : undefined,
      isOptimistic: true,
    };

    // Immediately add optimistic post to the feed
    setPosts(prev => [optimisticPost, ...prev]);
    setIsCreatingPost(true);
    isHandlingOptimisticPost.current = true;

    try {
      const postData: CreatePostRequest = {
        club_id: parseInt(selectedClub.id),
        content_type: type,
        content_text: contentText,
      };

      // Handle poll data
      if (type === "poll" && pollQuestion) {
        postData.poll_question = pollQuestion;
        postData.poll_options = pollOptions;
      }

      const response = await postsService.createPost(postData);

      if (response.success && response.data) {
        const postId = parseInt(response.data.id);
        const mediaAttachments: Array<{
          id: number
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          file_type: string
        }> = [];

        // Upload media attachments if any
        if (attachments && attachments.length > 0) {
          for (const file of attachments) {
            try {
              if (file instanceof File) {
                const uploadResult = await postsService.uploadMedia(postId, file);
                if (uploadResult.success && uploadResult.data) {
                  mediaAttachments.push(uploadResult.data);
                }
              } else if (file && typeof (file as { url: string; name: string; size: number; type: string }).url === 'string') {
                const fileData = file as { url: string; name: string; size: number; type: string };
                const createResult = await postsService.createMediaFromUrl(postId, {
                  file_url: fileData.url,
                  file_name: fileData.name,
                  file_size: fileData.size,
                  mime_type: fileData.type,
                });
                if (createResult.success && createResult.data) {
                  mediaAttachments.push(createResult.data);
                }
              }
            } catch (error) {
              console.error('Error uploading media:', error);
              toast.error(`Failed to upload ${file.name}`);
            }
          }
        }

        // Create the post data with media attachments
        const postWithMedia = {
          ...response.data,
          media_attachments: mediaAttachments
        };

        // Transform and replace optimistic post with real post
        const newPost = transformApiPostsToPosts([postWithMedia as unknown as ApiPost])[0];
        setPosts(prev => prev.map(p => p.id === tempPostId ? newPost : p));
        
        // Clean up blob URLs
        blobUrls.forEach(url => URL.revokeObjectURL(url));
        
        // Allow real-time updates after a short delay to ensure our update is complete
        setTimeout(() => {
          isHandlingOptimisticPost.current = false;
        }, 1000);
        
        toast.success("Post created successfully!");
      } else {
        // Remove optimistic post on failure
        setPosts(prev => prev.filter(p => p.id !== tempPostId));
        blobUrls.forEach(url => URL.revokeObjectURL(url));
        isHandlingOptimisticPost.current = false;
        toast.error(response.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      // Remove optimistic post on error
      setPosts(prev => prev.filter(p => p.id !== tempPostId));
      blobUrls.forEach(url => URL.revokeObjectURL(url));
      isHandlingOptimisticPost.current = false;
      toast.error('Failed to create post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleReaction = async (postId: string) => {
    // Optimistically toggle like and reaction count
    const previousPosts = posts;
    const target = posts.find(p => p.id === postId);
    const wasLiked = Boolean(target?.isLiked);

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const nextReactions = typeof p.reactions === 'number'
        ? (wasLiked ? Math.max(0, p.reactions - 1) : p.reactions + 1)
        : p.reactions;
      return { ...p, isLiked: !wasLiked, reactions: nextReactions as number };
    }));

    try {
      const postIdNum = parseInt(postId);
      if (wasLiked) {
        const resp = await postsService.deleteReaction(postIdNum);
        if (!resp.success) throw new Error(resp.error || 'Failed to remove reaction');
      } else {
        const resp = await postsService.createReaction(postIdNum, { reaction_type: 'like' });
        if (!resp.success) throw new Error(resp.error || 'Failed to add reaction');
      }
    } catch (error) {
      console.error('Reaction update failed:', error);
      // Revert on error
      setPosts(previousPosts);
      toast.error('Failed to update reaction');
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

  const isLoadingUI = clubLoading || loading;

  return (
    <div className="w-full">
      <PostForm currentUser={currentUser} onSubmit={handleCreatePost} isAuthenticated={isAuthenticated} isLoading={isCreatingPost} />

      {isLoadingUI ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader className="mx-auto mb-4" />
          <p className="text-lg">Loading posts...</p>
        </div>
      ) : !selectedClub?.id ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium">No club selected</p>
          <p className="text-sm">Select a club to view its newsfeed.</p>
        </div>
      ) : (
        <div>
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

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
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
