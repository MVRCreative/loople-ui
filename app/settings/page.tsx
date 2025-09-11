import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import ProfileForm from "@/components/settings/profile-form"
import OrganizationsForm from "@/components/settings/organizations-form"
import UserInfoLogger from "@/components/user-info-logger"

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("email, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  // Load clubs that the user is a member of
  const { data: clubsData } = await supabase
    .from("members")
    .select(`
      club_id,
      role,
      clubs (
        id,
        name,
        slug
      )
    `)
    .eq("user_id", user.id)

  // Transform clubs data to match expected format
  const clubs = clubsData?.map((member: any) => ({
    id: member.clubs?.id,
    name: member.clubs?.name,
    subdomain: member.clubs?.slug,
    member_type: member.role
  })).filter((club: any) => club.id && club.name) || []

  // Split full_name into first_name and last_name
  const fullName = userData?.full_name ?? ""
  const nameParts = fullName.trim().split(" ")
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

  // Server-side console logs (appear in terminal where you run npm run dev)
  console.log("=== SERVER: USER INFORMATION ===")
  console.log("UUID:", user.id)
  console.log("Email:", userData?.email ?? user.email ?? "Not available")
  console.log("First Name:", firstName)
  console.log("Last Name:", lastName)
  console.log("Full Name:", fullName)
  console.log("Avatar URL:", userData?.avatar_url ?? "Not available")
  console.log("=================================")

  // Server-side console logs for clubs
  console.log("=== SERVER: CLUBS INFORMATION ===")
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
          
          <div className="space-y-6">
            {/* Profile Section */}
            <ProfileForm
              initialData={{
                email: userData?.email ?? user.email ?? "",
                first_name: firstName,
                last_name: lastName,
                avatar_url: userData?.avatar_url ?? "",
              }}
            />
            
            {/* Organizations Section */}
            <OrganizationsForm 
              initialClubs={clubs}
              defaultClubId={clubs.length > 0 ? clubs[0].id : undefined}
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


