"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Star, StarOff } from "lucide-react"
import { useClub } from "@/lib/club-context"
import { useAuth } from "@/lib/auth-context"

interface OrganizationsFormProps {
  initialClubs?: any[]
  defaultClubId?: string
}

export default function OrganizationsForm({ defaultClubId }: OrganizationsFormProps) {
  const { clubs, selectedClub, selectClub, loading: clubsLoading } = useClub()
  const { isAuthenticated } = useAuth()
  
  const [defaultClub, setDefaultClub] = React.useState<string | null>(defaultClubId || selectedClub?.id || null)
  const [status, setStatus] = React.useState<"idle" | "loading" | "saving" | "saved" | "error">("idle")
  const [message, setMessage] = React.useState<string | null>(null)

  const handleSetDefault = async (clubId: string) => {
    setStatus("saving")
    setMessage(null)
    
    try {
      // Find the club and select it
      const club = clubs.find(c => c.id === clubId)
      if (club) {
        selectClub(club)
        setDefaultClub(clubId)
        setStatus("saved")
        setMessage("Default organization updated.")
      } else {
        setStatus("error")
        setMessage("Club not found.")
      }
    } catch (error) {
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

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            status === "error" 
              ? "bg-red-50 text-red-800 border border-red-200" 
              : "bg-green-50 text-green-800 border border-green-200"
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {clubsLoading ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">Loading organizations...</div>
            </div>
          ) : clubs.length > 0 ? (
            clubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-foreground">{club.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {club.owner_id === selectedClub?.owner_id ? "owner" : "member"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{club.subdomain}.loople.app</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {defaultClub === club.id ? (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>Default</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(club.id)}
                      disabled={status === "saving"}
                    >
                      <StarOff className="h-4 w-4 mr-1" />
                      Set as Default
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No organizations</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;re not a member of any organizations yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}