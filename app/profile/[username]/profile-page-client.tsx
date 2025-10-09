"use client";

import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfilePosts } from "@/components/profile/profile-posts"
import { useAuth } from "@/lib/auth-context"
import { UsersService, User } from "@/lib/services/users.service"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface ProfilePageClientProps {
  username: string
}

export function ProfilePageClient({ username }: ProfilePageClientProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, loading, router])

  // Load profile user data
  useEffect(() => {
    if (isAuthenticated && username) {
      const loadProfileUser = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const userData = await UsersService.getUserByUsername(username)
          
          if (!userData) {
            setError("User not found")
            return
          }
          
          // Check if current user is in the same club as the profile user
          // For now, we'll skip this check since club_id might not be in user metadata
          // TODO: Implement proper club membership validation
          // if (user && userData.club_id !== user.user_metadata?.club_id) {
          //   setError("You can only view profiles of users in your organization")
          //   return
          // }
          
          setProfileUser(userData)
        } catch (error) {
          console.error('Error loading profile user:', error)
          setError("Failed to load user profile")
        } finally {
          setIsLoading(false)
        }
      }
      
      loadProfileUser()
    }
  }, [isAuthenticated, username, user])
  
  // Convert auth user to the expected User type
  const currentUser = user ? {
    id: user.id,
    name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email,
    role: "Member", // TODO: Get actual role from user data
    avatar: user.user_metadata?.first_name?.[0] || user.email?.[0] || "U",
    isAdmin: false, // TODO: Get actual admin status
  } : null
  
  // Show loading while checking auth or loading data
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Loading profile...</h2>
        </div>
      </div>
    )
  }

  // Show error if user not found or access denied
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">{error}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error === "User not found" ? "This user doesn't exist or has been removed." : 
             error === "You can only view profiles of users in your organization" ? "You can only view profiles of users in your organization." :
             "Please try again later."}
          </p>
        </div>
      </div>
    )
  }
  
  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user || !currentUser || !profileUser) {
    return null
  }
  
  // Check if viewing own profile
  const isOwnProfile = user.id === profileUser.id
  
  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <ProfileHeader user={profileUser} isOwnProfile={isOwnProfile} />
      
      {/* Main column - Profile Posts */}
      <main className="min-h-screen">
        <ProfilePosts userId={profileUser.id} currentUser={currentUser} />
      </main>
    </div>
  )
}
