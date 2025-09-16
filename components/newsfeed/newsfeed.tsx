"use client";

import { useState } from "react";
import { PostForm } from "./post-form";
import { PostCard } from "./post-card";
import type { Post, User } from "@/lib/types";
import { toast } from "sonner";

interface NewsfeedProps {
  initialPosts: Post[];
  currentUser: User;
  isAuthenticated?: boolean; // kept for compatibility; unused here by design
}

export function Newsfeed({
  initialPosts,
  currentUser,
  isAuthenticated: _isAuthenticated,
}: NewsfeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handleCreatePost = (content: string, type: "text" | "event" | "poll") => {
    const newPost: Post = {
      id: Date.now().toString(),
      user: currentUser,
      content: { type, text: content },
      timestamp: "Just now",
      reactions: 0,
      comments: 0,
      isLiked: false,
    };

    setPosts((prev) => [newPost, ...prev]);
    toast.success("Post created successfully!");
  };

  const handleReaction = (_postId: string) => {
    // TODO: Implement server-side reaction handling
  };

  const handleComment = (_postId: string) => {
    // TODO: Implement comment functionality
    toast.info("Comment functionality coming soon!");
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    const url = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      navigator.share({ title: "Check out this post", text: "Shared from Loople", url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="w-full py-2 sm:py-4 md:py-6 overflow-x-hidden">
      <PostForm currentUser={currentUser} onSubmit={handleCreatePost} />

      <div className="mt-6">
        {posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={post}
            onReaction={handleReaction}
            onComment={handleComment}
            onShare={handleShare}
            isFirst={index === 0}
          />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm">Be the first to share an update!</p>
        </div>
      )}
    </div>
  );
}

