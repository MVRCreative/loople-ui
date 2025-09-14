"use client";

import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfilePosts } from "@/components/profile/profile-posts"
import { useAuth } from "@/lib/auth-context"

interface ProfilePageClientProps {
  userId: string
}

export function ProfilePageClient({ userId }: ProfilePageClientProps) {
  const { user } = useAuth()
  
  // Convert auth user to the expected User type
  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email,
    role: "Member", // TODO: Get actual role from user data
    avatar: user.user_metadata?.first_name?.[0] || user.email?.[0] || "U",
    isAdmin: false, // TODO: Get actual admin status
  } : null
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Please log in to view profiles</h2>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <ProfileHeader userId={userId} />
      
      {/* Main column - Profile Posts */}
      <main className="min-h-screen border-l border-r border-border">
        <ProfilePosts userId={userId} currentUser={currentUser} />
      </main>
    </div>
  )
}
