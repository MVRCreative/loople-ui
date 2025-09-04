import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import ProfileForm from "@/components/settings/profile-form"
import OrganizationsForm from "@/components/settings/organizations-form"

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

  // Note: We'll let the OrganizationsForm component fetch its own data client-side
  // This avoids server-side RLS issues
  const clubs: { id: number; name: string; subdomain: string; member_type: string }[] = []

  // Split full_name into first_name and last_name
  const fullName = userData?.full_name ?? ""
  const nameParts = fullName.trim().split(" ")
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

  return (
    <>
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
              defaultClubId={undefined} // We'll implement default club storage later
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


