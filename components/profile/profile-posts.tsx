"use client"

import { useState } from "react"
import { PostCard } from "@/components/newsfeed/post-card"
import { Post, User } from "@/lib/types"

interface ProfilePostsProps {
  userId: string
  currentUser: User
}

// Mock data for user posts - in real app this would come from API
const mockPosts: Post[] = [
  {
    id: "1",
    user: {
      id: "rc",
      name: "Ricardo Cooper",
      avatar: "RC",
      role: "Developer",
      isAdmin: false
    },
    content: {
      type: "text",
      text: "Just shipped a new feature for our React components library! The new animated list component is looking great. Can&apos;t wait to see how the team uses it in their projects. #React #TypeScript #Frontend"
    },
    timestamp: "2h",
    reactions: 16, // 12 + 3 + 1
    comments: 5,
    isLiked: false
  },
  {
    id: "2", 
    user: {
      id: "rc",
      name: "Ricardo Cooper",
      avatar: "RC",
      role: "Developer",
      isAdmin: false
    },
    content: {
      type: "text",
      text: "Working on some performance optimizations today. Managed to reduce bundle size by 15% by implementing code splitting and lazy loading. Every byte counts! 🚀"
    },
    timestamp: "5h",
    reactions: 10, // 8 + 2 + 0
    comments: 2,
    isLiked: true
  },
  {
    id: "3",
    user: {
      id: "rc",
      name: "Ricardo Cooper", 
      avatar: "RC",
      role: "Developer",
      isAdmin: false
    },
    content: {
      type: "text",
      text: "Team standup was productive today. We're making great progress on the new dashboard redesign. The design system is really coming together nicely."
    },
    timestamp: "1d",
    reactions: 7, // 6 + 1 + 0
    comments: 3,
    isLiked: false
  },
  {
    id: "4",
    user: {
      id: "rc",
      name: "Ricardo Cooper",
      avatar: "RC", 
      role: "Developer",
      isAdmin: false
    },
    content: {
      type: "text",
      text: "Just finished reading &apos;Clean Code&apos; by Robert Martin. Some really great insights on writing maintainable code. Highly recommend it to any developer looking to improve their craft."
    },
    timestamp: "2d",
    reactions: 19, // 15 + 4 + 0
    comments: 7,
    isLiked: false
  },
  {
    id: "5",
    user: {
      id: "rc",
      name: "Ricardo Cooper",
      avatar: "RC",
      role: "Developer",
      isAdmin: false
    },
    content: {
      type: "text", 
      text: "Coffee break! ☕ Taking a quick break to recharge before diving into the afternoon's tasks. Sometimes stepping away helps you see things from a fresh perspective."
    },
    timestamp: "3d",
    reactions: 7, // 4 + 2 + 1
    comments: 1,
    isLiked: false
  }
]

export function ProfilePosts({ userId: _userId, currentUser }: ProfilePostsProps) {
  const [posts] = useState<Post[]>(mockPosts)

  const handleReaction = (postId: string) => {
    console.log("Reaction clicked for post:", postId)
    // In real app, this would update the post's reaction state
  }

  const handleComment = (postId: string) => {
    console.log("Comment clicked for post:", postId)
    // In real app, this would open comment modal or navigate to post
  }

  const handleShare = (postId: string) => {
    console.log("Share clicked for post:", postId)
    // In real app, this would open share modal
  }

  return (
    <div className="w-full">
      {/* Posts Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <h2 className="text-xl font-bold text-foreground">Posts</h2>
          <p className="text-sm text-muted-foreground">
            {posts.length} posts by Ricardo Cooper
          </p>
        </div>
      </div>

      {/* Posts List */}
      <div className="divide-y divide-border">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="p-4">
              <PostCard
                post={post}
                currentUser={currentUser}
                onReaction={handleReaction}
                onComment={handleComment}
                onShare={handleShare}
              />
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">No posts yet</p>
              <p className="text-sm">This user hasn&apos;t shared any posts yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
