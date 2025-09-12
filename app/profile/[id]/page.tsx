import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfilePosts } from "@/components/profile/profile-posts"
import { User } from "@/lib/types"

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  
  // Mock current user - in real app this would come from auth context
  const currentUser: User = {
    id: "current-user",
    name: "Current User",
    role: "Member",
    avatar: "U",
    isAdmin: false,
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <ProfileHeader userId={id} />
      
      {/* Main column - Profile Posts */}
      <main className="min-h-screen border-l border-r border-border">
        <ProfilePosts userId={id} currentUser={currentUser} />
      </main>
    </div>
  )
}
