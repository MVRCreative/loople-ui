"use client";

import { useState, useRef } from "react";
import { PostForm } from "./post-form";
import { PostCard } from "./post-card";
import { Post, User } from "@/lib/types";
import { toast } from "sonner";

interface NewsfeedProps {
  initialPosts: Post[];
  currentUser: User;
}

export function Newsfeed({ initialPosts, currentUser }: NewsfeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const postIdCounter = useRef(0);

  const handleCreatePost = (content: string, type: "text" | "event" | "poll") => {
    const newPost: Post = {
      id: `client-post-${Date.now()}-${++postIdCounter.current}`,
      user: currentUser,
      content: {
        type,
        text: content,
      },
      timestamp: "Just now",
      reactions: 0,
      comments: 0,
      isLiked: false,
    };

    setPosts(prev => [newPost, ...prev]);
    toast.success("Post created successfully!");
  };

  const handleReaction = (postId: string) => {
    // TODO: Implement server-side reaction handling
    console.log("Reaction toggled for post:", postId);
  };

  const handleComment = (postId: string) => {
    // TODO: Implement comment functionality
    toast.info("Comment functionality coming soon!");
    console.log("Comment on post:", postId);
  };

  const handleShare = (postId: string) => {
    // TODO: Implement share functionality
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: "Check out this post",
          text: "Shared from Loople",
          url: `${window.location.origin}/post/${postId}`,
        }).catch(console.error);
      } else if (navigator.clipboard) {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`)
          .then(() => toast.success("Link copied to clipboard!"))
          .catch(() => toast.error("Failed to copy link"));
      } else {
        toast.error("Sharing not supported in this browser");
      }
    }
  };

  return (
    <div className="w-full">
      <PostForm currentUser={currentUser} onSubmit={handleCreatePost} />
      
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
      
      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No posts yet</p>
          <p className="text-sm">Be the first to share an update!</p>
        </div>
      )}
    </div>
  );
}
