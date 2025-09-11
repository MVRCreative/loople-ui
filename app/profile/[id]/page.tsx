import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfilePosts } from "@/components/profile/profile-posts"

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <ProfileHeader userId={id} />
      
      {/* Main column - Profile Posts */}
      <main className="min-h-screen border-l border-r border-border">
        <ProfilePosts userId={id} />
      </main>
    </div>
  )
}
