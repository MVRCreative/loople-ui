"use client";

import ProfileForm from "@/components/settings/profile-form"
import OrganizationsForm from "@/components/settings/organizations-form"
import UserInfoLogger from "@/components/user-info-logger"
import { UsersService, ClubsService } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Page() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [clubsData, setClubsData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, loading, router])

  // Load user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadUserData = async () => {
        try {
          setIsLoading(true)
          const userRecord = await UsersService.getUserById(user.id)
          const clubs = await ClubsService.getUserClubs()
          
          setUserData(userRecord)
          setClubsData(clubs || [])
        } catch (error) {
          console.error('Error loading user data:', error)
        } finally {
          setIsLoading(false)
        }
      }
      
      loadUserData()
    }
  }, [isAuthenticated, user])

  // Show loading while checking auth or loading data
  if (loading || isLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null
  }

  // Transform user data to match expected format
  const processedUserData = userData
    ? {
      email: userData.email,
      full_name: `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim(),
      avatar_url: "",
    }
    : null

  // Transform clubs data to match expected format
  type ClubsServiceClub = {
    id: string;
    name: string;
    subdomain: string;
  };
  const clubs = clubsData
    .map((club: ClubsServiceClub) => ({
      id: Number(club.id),
      name: club.name,
      subdomain: club.subdomain,
      member_type: "member",
    }))
    .filter((club) => Boolean(club.id) && Boolean(club.name))
  
  // Split full_name into first_name and last_name
  const fullName = processedUserData?.full_name ?? ""
  const nameParts = fullName.trim().split(" ")
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

  // Client-side console logs
  console.log("=== CLIENT: USER INFORMATION ===")
  console.log("UUID:", user.id)
  console.log("Email:", processedUserData?.email ?? user.email ?? "Not available")
  console.log("First Name:", firstName)
  console.log("Last Name:", lastName)
  console.log("Full Name:", fullName)
  console.log("Avatar URL:", processedUserData?.avatar_url ?? "Not available")
  console.log("=================================")

  // Client-side console logs for clubs
  console.log("=== CLIENT: CLUBS INFORMATION ===")
  console.log("Number of clubs:", clubs.length)
  clubs.forEach((club, index) => {
    console.log(`Club ${index + 1}:`, {
      id: club.id,
      name: club.name,
      subdomain: club.subdomain,
      member_type: club.member_type
    })
  })
  console.log("=================================")

  return (
    <>
      <UserInfoLogger 
        userInfo={{
          uuid: user.id,
          email: processedUserData?.email ?? user.email ?? "Not available",
          firstName,
          lastName,
          fullName,
          avatarUrl: processedUserData?.avatar_url ?? "Not available"
        }}
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your profile and organization settings.</p>
          </div>
          
          <div className="space-y-6">
            {/* Profile Section */}
            <ProfileForm
              initialData={{
                email: processedUserData?.email ?? user.email ?? "",
                first_name: firstName,
                last_name: lastName,
                avatar_url: processedUserData?.avatar_url ?? "",
              }}
            />
            
            {/* Organizations Section */}
            <OrganizationsForm 
              defaultClubId={clubs.length > 0 ? clubs[0].id.toString() : undefined}
            />
            
            {/* Additional Settings Section */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-xs">
              <h2 className="text-base font-semibold text-foreground">Additional Settings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                More settings will be available here in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


