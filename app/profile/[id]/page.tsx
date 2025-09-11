import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfilePosts } from "@/components/profile/profile-posts"

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <ProfileHeader userId={params.id} />
      
      {/* Main column - Profile Posts */}
      <main className="min-h-screen border-l border-r border-border">
        <ProfilePosts userId={params.id} />
      </main>
    </div>
  )
}
