import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import ProfileForm from "@/components/settings/profile-form"

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your profile information.</p>
          </div>
          <ProfileForm
            initialData={{
              email: profile?.email ?? user.email ?? "",
              full_name: profile?.full_name ?? "",
              avatar_url: profile?.avatar_url ?? "",
            }}
          />
        </div>
      </div>
    </>
  )
}


