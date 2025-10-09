"use client"

import { useState, useEffect } from "react"
import { PostCard } from "@/components/newsfeed/post-card"
import { Post, User, ApiPost } from "@/lib/types"
import { postsService } from "@/lib/services/posts.service"
import { transformApiPostsToPosts } from "@/lib/utils/posts.utils"

interface ProfilePostsProps {
  userId: string
  currentUser: User
}

export function ProfilePosts({ userId, currentUser }: ProfilePostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await postsService.getPosts({
          user_id: userId,
          limit: 50 // Limit posts for profile page
        })
        
        if (response.success && response.data) {
          const transformedPosts = transformApiPostsToPosts(response.data as unknown as ApiPost[])
          setPosts(transformedPosts)
        } else {
          setError("Failed to load posts")
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        setError("Failed to load posts")
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchPosts()
    }
  }, [userId])

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
      {/* Posts List */}
      <div>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="text-muted-foreground">
              <p className="text-lg font-medium mb-2">Loading posts...</p>
              <p className="text-sm">Please wait while we fetch the posts.</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-destructive">
              <p className="text-lg font-medium mb-2">Error loading posts</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onReaction={handleReaction}
              onComment={handleComment}
              onShare={handleShare}
            />
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
