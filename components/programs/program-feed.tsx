"use client";

import { useCallback, useEffect, useState } from "react";
import { PostForm } from "@/components/newsfeed/post-form";
import { PostCard } from "@/components/newsfeed/post-card";
import { Loader } from "@/components/ui/loader";
import { Post, User, ApiPost } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import {
  convertAuthUserToUser,
  createGuestUser,
} from "@/lib/utils/auth.utils";
import { postsService } from "@/lib/services/posts.service";
import { transformApiPostsToPosts } from "@/lib/utils/posts.utils";
import { toast } from "sonner";

interface ProgramFeedProps {
  programId: string;
  clubId: number;
  canPost: boolean;
  className?: string;
}

export function ProgramFeed({
  programId,
  clubId,
  canPost,
  className,
}: ProgramFeedProps) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser: User = authUser
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  const loadPosts = useCallback(async () => {
    if (!programId || !clubId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await postsService.getPosts({
        club_id: clubId,
        program_id: parseInt(programId, 10),
        sort_by: "created_at",
        sort_order: "desc",
        limit: 20,
      });
      if (response.success && response.data) {
        setPosts(transformApiPostsToPosts(response.data as unknown as ApiPost[]));
      } else {
        setPosts([]);
        if (response.error) setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [clubId, programId]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleCreatePost = async (
    content: string,
    type: "text" | "event" | "poll"
  ) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to create posts");
      return;
    }
    if (!canPost) {
      toast.error("Join this program to post updates.");
      return;
    }

    try {
      let contentText = content;
      let pollQuestion: string | undefined;
      let pollOptions: string[] | undefined;

      if (type === "poll") {
        try {
          const parsed = JSON.parse(content) as {
            text?: string;
            poll?: { question?: string; options?: string[] };
          };
          contentText = parsed.text || "";
          pollQuestion = parsed.poll?.question;
          pollOptions = parsed.poll?.options;
        } catch {
          // Keep defaults and let backend validation handle malformed payloads.
        }
      }

      const createRes = await postsService.createPost({
        club_id: clubId,
        program_id: parseInt(programId, 10),
        content_type: type,
        content_text: contentText,
        ...(type === "poll" && pollQuestion && pollOptions && pollOptions.length >= 2
          ? { poll_question: pollQuestion, poll_options: pollOptions }
          : {}),
      });

      if (createRes.success && createRes.data) {
        const newPost = transformApiPostsToPosts([
          createRes.data as unknown as ApiPost,
        ])[0];
        setPosts((prev) => [newPost, ...prev]);
        toast.success("Post created successfully");
      } else {
        throw new Error(createRes.error || "Failed to create post");
      }
    } catch (err) {
      console.error("Error creating program post:", err);
      toast.error("Failed to create post");
    }
  };

  const handleReaction = async (postId: string) => {
    try {
      await postsService.createReaction(parseInt(postId, 10), {
        post_id: parseInt(postId, 10),
        reaction_type: "like",
      });
    } catch (err) {
      console.error("Error reacting to post:", err);
      toast.error("Failed to react to post");
    }
  };

  const handleComment = (postId: string) => {
    void postId;
    toast.info("Open the post to comment.");
  };

  const handleShare = (postId: string) => {
    if (navigator.share) {
      void navigator.share({
        title: "Program post",
        text: "Shared from Loople",
        url: `${window.location.origin}/programs/${programId}#post-${postId}`,
      });
    } else {
      void navigator.clipboard.writeText(
        `${window.location.origin}/programs/${programId}#post-${postId}`
      );
      toast.success("Link copied to clipboard");
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    toast.success("Post deleted");
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className ?? ""}`}>
        <div className="text-center py-12 text-muted-foreground">
          <Loader className="mx-auto mb-4" />
          <p className="text-lg">Loading program posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className ?? ""}`}>
        <div className="text-center py-12 text-destructive">
          <p className="text-lg font-medium">Failed to load posts</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <PostForm
        currentUser={currentUser}
        onSubmit={handleCreatePost}
        isAuthenticated={isAuthenticated && canPost}
      />

      {posts.length > 0 ? (
        <div className="space-y-0">
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
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm">
            {canPost
              ? "Be the first to post in this program."
              : "Join this program to participate in discussion."}
          </p>
        </div>
      )}
    </div>
  );
}
