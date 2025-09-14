import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfilePosts } from "@/components/profile/profile-posts"
import { ProfilePageClient } from "./profile-page-client"

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  
  return <ProfilePageClient userId={id} />
}
