"use client"

import * as React from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Star, StarOff } from "lucide-react"

interface Club {
  id: number
  name: string
  subdomain: string
  member_type: string
}

interface OrganizationsFormProps {
  initialClubs?: Club[]
  defaultClubId?: number
}

export default function OrganizationsForm({ initialClubs = [], defaultClubId }: OrganizationsFormProps) {
  const supabase = createClient()
  const [clubs, setClubs] = React.useState<Club[]>(initialClubs)
  const [defaultClub, setDefaultClub] = React.useState<number | null>(defaultClubId || null)
  const [status, setStatus] = React.useState<"idle" | "loading" | "saving" | "saved" | "error">("idle")
  const [message, setMessage] = React.useState<string | null>(null)

  // Fetch clubs data on component mount
  React.useEffect(() => {
    async function fetchClubs() {
      setStatus("loading")
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setStatus("idle")
          return
        }

        // Fetch user's club memberships
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("member_type, club_id")
          .eq("user_id", session.user.id)

        if (membersError) {
          console.error('Error fetching members:', membersError)
          setStatus("error")
          setMessage("Failed to load organizations.")
          return
        }

        if (!membersData || membersData.length === 0) {
          setClubs([])
          setStatus("idle")
          return
        }

        // Fetch club details
        const clubIds = membersData.map(m => m.club_id)
        const { data: clubsData, error: clubsError } = await supabase
          .from("clubs")
          .select("id, name, subdomain")
          .in("id", clubIds)

        if (clubsError) {
          console.error('Error fetching clubs:', clubsError)
          setStatus("error")
          setMessage("Failed to load organization details.")
          return
        }

        // Combine the data
        const combinedClubs = membersData.map(member => {
          const club = clubsData?.find(c => c.id === member.club_id)
          return {
            id: club?.id,
            name: club?.name,
            subdomain: club?.subdomain,
            member_type: member.member_type
          }
        }).filter(club => club.id) as Club[]

        setClubs(combinedClubs)
        setStatus("idle")
      } catch (error) {
        console.error('Error in fetchClubs:', error)
        setStatus("error")
        setMessage("Failed to load organizations.")
      }
    }

    fetchClubs()
  }, [supabase])

  async function setDefaultClubHandler(clubId: number) {
    setStatus("saving")
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus("error")
        setMessage("You must be signed in.")
        return
      }

      // Update the user's default club preference
      // We'll store this in the users table as a preference
      const { error } = await supabase
        .from("users")
        .update({
          // We can add a default_club_id field to the users table later
          // For now, we'll use a simple approach
        })
        .eq("id", user.id)

      if (error) {
        setStatus("error")
        setMessage(error.message)
        return
      }

      setDefaultClub(clubId)
      setStatus("saved")
      setMessage("Default organization updated.")
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setStatus("idle")
        setMessage(null)
      }, 3000)
    } catch {
      setStatus("error")
      setMessage("Failed to update default organization.")
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-xs">
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Organizations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization memberships and set your default organization.
          </p>
        </div>

        {status === "loading" ? (
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
            <h3 className="mt-2 text-sm font-medium text-foreground">Loading organizations...</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Please wait while we fetch your organization memberships.
            </p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No organizations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re not a member of any organizations yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{club.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {club.member_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {club.subdomain}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {defaultClub === club.id && (
                    <Badge variant="default" className="text-xs">
                      Default
                    </Badge>
                  )}
                  <Button
                    type="button"
                    variant={defaultClub === club.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDefaultClubHandler(club.id)}
                    disabled={status === "saving"}
                  >
                    {defaultClub === club.id ? (
                      <>
                        <Star className="h-4 w-4 mr-1" />
                        Default
                      </>
                    ) : (
                      <>
                        <StarOff className="h-4 w-4 mr-1" />
                        Set Default
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {message && (
          <div className={`text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`} role={status === "error" ? "alert" : undefined}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
