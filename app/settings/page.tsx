import ProfileForm from "@/components/settings/profile-form"
import OrganizationsForm from "@/components/settings/organizations-form"

export default function Page() {
  // Mock user data for UI demonstration
  const mockUserData = {
    email: "admin@loople.com",
    full_name: "Loople Admin",
    avatar_url: "🏊‍♂️"
  }

  // Split full_name into first_name and last_name
  const fullName = mockUserData.full_name ?? ""
  const nameParts = fullName.trim().split(" ")
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and organization settings.</p>
      </div>
      <div className="space-y-6">
        <ProfileForm
          initialData={{
            email: mockUserData.email,
            first_name: firstName,
            last_name: lastName,
            avatar_url: mockUserData.avatar_url,
          }}
        />
        <OrganizationsForm 
          initialClubs={[]}
          defaultClubId={undefined}
        />
        <div className="bg-card border border-border rounded-lg p-6 shadow-xs">
          <h2 className="text-base font-semibold text-foreground">Additional Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            More settings will be available here in the future.
          </p>
        </div>
      </div>
    </div>
  )
}


