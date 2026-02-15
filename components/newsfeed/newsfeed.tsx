"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PostForm } from "./post-form";
import { PostCard } from "./post-card";
import { PostCardSkeletonList } from "./post-card-skeleton";
import { NewUserEmptyState } from "@/components/home/new-user-empty-state";
import { Post, User, ApiPost } from "@/lib/types";
import { postsService, CreatePostRequest } from "@/lib/services/posts.service";
import { transformApiPostsToPosts } from "@/lib/utils/posts.utils";
import { mentionsService } from "@/lib/services/mentions.service";
import { useClub } from "@/lib/club-context";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

interface NewsfeedProps {
  initialPosts: Post[];
  currentUser: User;
  isAuthenticated?: boolean;
}

export function Newsfeed({ initialPosts, currentUser, isAuthenticated = false }: NewsfeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const { selectedClub, clubs, loading: clubLoading } = useClub();
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
        if (isHandlingOptimisticPost.current) {
          return;
        }
        loadPosts();
      } else if (payloadData.eventType === 'UPDATE') {
        loadPosts();
      } else if (payloadData.eventType === 'DELETE') {
        const oldData = payloadData.old as Record<string, unknown>;
        setPosts(prev => prev.filter(post => post.id !== (oldData.id as number).toString()));
      }
    });

    return () => {
      postsService.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub?.id]);

  const handleCreatePost = async (content: string, type: "text" | "event" | "poll", attachments?: Array<File | { url: string; name: string; size: number; type: string }>) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create posts');
      return;
    }

    if (!selectedClub?.id) {
      toast.error('No club selected');
      return;
    }

    const tempPostId = `temp-${Date.now()}`;
    const blobUrls: string[] = [];

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
            id: -(index + 1),
            file_name: file.name,
            file_path: blobUrl,
            file_size: file.size,
            mime_type: file.type,
            file_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
            created_at: new Date().toISOString(),
          });
        } else if (file && typeof (file as { url: string }).url === 'string') {
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
        pollVotes = pollOptions.reduce((acc, _, idx) => {
          acc[idx.toString()] = 0;
          return acc;
        }, {} as Record<string, number>);
      } catch {
        console.warn('Failed to parse poll data, treating as text');
      }
    }

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

    setPosts(prev => [optimisticPost, ...prev]);
    setIsCreatingPost(true);
    isHandlingOptimisticPost.current = true;

    try {
      const postData: CreatePostRequest = {
        club_id: parseInt(selectedClub.id),
        content_type: type,
        content_text: contentText,
      };

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

        const postWithMedia = {
          ...response.data,
          media_attachments: mediaAttachments
        };

        const newPost = transformApiPostsToPosts([postWithMedia as unknown as ApiPost])[0];
        setPosts(prev => prev.map(p => p.id === tempPostId ? newPost : p));
        
        blobUrls.forEach(url => URL.revokeObjectURL(url));
        
        setTimeout(() => {
          isHandlingOptimisticPost.current = false;
        }, 1000);

        // Process @mentions in the post text
        if (selectedClub?.id) {
          mentionsService.processMentions({
            text: contentText,
            clubId: parseInt(selectedClub.id),
            postId: parseInt(response.data.id),
          }).catch((err) => console.error('Failed to process mentions:', err));
        }
        
        toast.success("Post created successfully!");
      } else {
        setPosts(prev => prev.filter(p => p.id !== tempPostId));
        blobUrls.forEach(url => URL.revokeObjectURL(url));
        isHandlingOptimisticPost.current = false;
        toast.error(response.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setPosts(prev => prev.filter(p => p.id !== tempPostId));
      blobUrls.forEach(url => URL.revokeObjectURL(url));
      isHandlingOptimisticPost.current = false;
      toast.error('Failed to create post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleReaction = async (postId: string) => {
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
      setPosts(previousPosts);
      toast.error('Failed to update reaction');
    }
  };

  const handleComment = () => {
    // Comment functionality is handled by PostCard component
  };

  const handleShare = (postId: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Check out this post",
        text: "Shared from Loople",
        url: `${window.location.origin}/post/${postId}`,
      });
    } else {
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
  const hasNoClubs = (clubs?.length ?? 0) === 0;
  const isBrandNewUser =
    isAuthenticated &&
    !clubLoading &&
    hasNoClubs;

  // Show empty state when user has no clubs
  if (isBrandNewUser) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <NewUserEmptyState />
      </div>
    );
  }

  // Show empty state when no club selected
  if (!clubLoading && !selectedClub?.id) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-foreground">Select a club</p>
          <p className="text-sm text-muted-foreground mt-1">Use the club switcher in the sidebar to select a club and view its newsfeed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PostForm currentUser={currentUser} onSubmit={handleCreatePost} isAuthenticated={isAuthenticated} isLoading={isCreatingPost} />

      {/* Separator between composer and feed */}
      <div className="h-2 bg-muted/50 border-y border-border" />

      {isLoadingUI ? (
        <PostCardSkeletonList count={5} />
      ) : (
        <div>
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${Math.min(index * 50, 250)}ms`, animationFillMode: 'both' }}
            >
              <PostCard
                post={post}
                currentUser={currentUser}
                onReaction={handleReaction}
                onComment={handleComment}
                onShare={handleShare}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
              />
            </div>
          ))}
        </div>
      )}

      {!isLoadingUI && posts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share an update!</p>
        </div>
      )}
    </div>
  );
}
