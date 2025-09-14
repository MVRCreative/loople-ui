"use client"

import * as React from "react"
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

export default function OrganizationsForm({ defaultClubId }: OrganizationsFormProps) {
  // Mock clubs data
  const mockClubs: Club[] = [
    { id: 1, name: "Loople Swimming Club", subdomain: "loople", member_type: "admin" },
    { id: 2, name: "Aqua Fitness Center", subdomain: "aqua", member_type: "member" },
    { id: 3, name: "Elite Swim Team", subdomain: "elite", member_type: "coach" },
  ]
  
  const [clubs] = React.useState<Club[]>(mockClubs)
  const [defaultClub, setDefaultClub] = React.useState<number | null>(defaultClubId || 1)
  const [status, setStatus] = React.useState<"idle" | "loading" | "saving" | "saved" | "error">("idle")
  const [message, setMessage] = React.useState<string | null>(null)

  const handleSetDefault = async (clubId: number) => {
    setStatus("saving")
    setMessage(null)
    
    // Mock save - simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setDefaultClub(clubId)
    setStatus("saved")
    setMessage("Default organization updated.")
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
          {clubs.map((club) => (
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
                      {club.member_type}
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
          ))}
        </div>

        {clubs.length === 0 && (
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
  )
}