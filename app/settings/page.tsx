"use client";

import ProfileForm from "@/components/settings/profile-form"
import OrganizationsForm from "@/components/settings/organizations-form"
import UserInfoLogger from "@/components/user-info-logger"
import { UserRoleBadge } from "@/components/settings/user-role-badge"
import { UsersService, ClubsService } from "@/lib/services"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { UserPreferences } from "@/lib/services/users.service"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { Moon } from "lucide-react"

export default function Page() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [userData, setUserData] = useState<{
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    username?: string | null;
    bio?: string | null;
    cover_url?: string | null;
    country?: string | null;
    street_address?: string | null;
    city?: string | null;
    region?: string | null;
    postal_code?: string | null;
  } | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [clubsData, setClubsData] = useState<{
    id: string;
    name: string;
    subdomain: string;
  }[]>([])
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
          const userProfile = await UsersService.getUserProfile()
          const clubs = await ClubsService.getUserClubs()
          
          setUserData({
            email: userProfile.email,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            phone: userProfile.phone,
            avatar_url: userProfile.avatar_url,
            username: userProfile.username ?? null,
            bio: userProfile.bio ?? null,
            cover_url: userProfile.cover_url ?? null,
            country: userProfile.country ?? null,
            street_address: userProfile.street_address ?? null,
            city: userProfile.city ?? null,
            region: userProfile.region ?? null,
            postal_code: userProfile.postal_code ?? null,
          })
          setUserPreferences(userProfile.preferences)
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

  // Names derived directly from loaded profile
  const firstName = userData?.first_name ?? ""
  const lastName = userData?.last_name ?? ""
  const fullName = `${firstName} ${lastName}`.trim()

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
  
  // (removed derived split from full_name)

  // Remove noisy console logs

  return (
    <>
      <UserInfoLogger 
        userInfo={{
          uuid: user.id,
          email: userData?.email ?? user.email ?? "Not available",
          firstName,
          lastName,
          fullName,
          avatarUrl: userData?.avatar_url ?? "Not available"
        }}
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your profile and organization settings.</p>
          </div>

          <UserRoleBadge />
          
          <div className="space-y-6">
            {/* Profile Section */}
            <ProfileForm
              initialData={{
                email: userData?.email ?? user.email ?? "",
                first_name: firstName,
                last_name: lastName,
                avatar_url: userData?.avatar_url ?? "",
                cover_url: userData?.cover_url ?? "",
                phone: userData?.phone ?? "",
                username: userData?.username ?? "",
                about: userData?.bio ?? "",
                country: userData?.country ?? "",
                street_address: userData?.street_address ?? "",
                city: userData?.city ?? "",
                region: userData?.region ?? "",
                postal_code: userData?.postal_code ?? "",
                notify_comments: userPreferences?.notify_comments ?? true,
                notify_candidates: userPreferences?.notify_candidates ?? false,
                notify_offers: userPreferences?.notify_offers ?? false,
                push_notifications: userPreferences?.push_notifications ?? "everything",
              }}
            />
            
            {/* Organizations Section */}
            <OrganizationsForm 
              defaultClubId={clubs.length > 0 ? clubs[0].id.toString() : undefined}
            />
            
            {/* Additional Settings Section */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-xs">
              <h2 className="text-base font-semibold text-foreground">Additional Settings</h2>
              <p className="mt-1 text-sm text-muted-foreground mb-4">
                Customize your experience with additional preferences.
              </p>
              
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
                  </div>
                </div>
                <ThemeSwitch />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


