"use client";

import * as React from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { createClient } from "@/lib/client";
import { useTenantSafe } from "@/components/tenant-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type Club = {
  id: string;
  name: string;
  subdomain: string;
  member_type: string;
};

interface ClubSwitcherProps {
  className?: string;
}

export function ClubSwitcher({ className }: ClubSwitcherProps) {
  const [clubs, setClubs] = React.useState<Club[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Get current tenant - will be null if TenantProvider is not available
  const currentTenant = useTenantSafe();

  React.useEffect(() => {
    async function fetchUserClubs() {
      try {
        const supabase = createClient();
        
        // Wait for session to be established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          return;
        }
        
        if (!session) {
          return;
        }

        // Fetch user's club memberships by user_id
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('member_type, club_id')
          .eq('user_id', session.user.id);

        if (membersError) {
          console.error('Error fetching members:', membersError);
          return;
        }

        if (!membersData || membersData.length === 0) {
          setClubs([]);
          return;
        }

        // Fetch club details for each membership
        const clubIds = membersData.map(member => member.club_id);
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('id, name, subdomain')
          .in('id', clubIds);

        if (clubsError) {
          console.error('Error fetching clubs:', clubsError);
          console.error('Club IDs:', clubIds);
          return;
        }

        // Combine member and club data
        const data = membersData.map(member => {
          const club = clubsData?.find(c => c.id === member.club_id);
          return {
            member_type: member.member_type,
            club: club
          };
        }).filter(item => item.club); // Only include items where club was found

        const userClubs: Club[] = data.map(item => ({
          id: item.club!.id.toString(),
          name: item.club!.name,
          subdomain: item.club!.subdomain,
          member_type: item.member_type,
        }));

        setClubs(userClubs);
      } catch (error) {
        console.error('Error fetching user clubs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserClubs();
  }, []);

  const handleClubSwitch = (club: Club) => {
    // Redirect to the club's subdomain
    const currentHost = window.location.host;
    const isLocalhost = currentHost.includes('localhost');
    
    if (isLocalhost) {
      // For localhost development
      window.location.href = `http://${club.subdomain}.localhost:3000`;
    } else {
      // For production
      window.location.href = `https://${club.subdomain}.loople.app`;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">No clubs</span>
      </div>
    );
  }

  const currentClub = clubs.find(club => currentTenant && club.subdomain === currentTenant.slug) || clubs[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`h-auto p-2 justify-start gap-2 ${className}`}
        >
          <Building2 className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{currentClub.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {currentClub.member_type}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {clubs.map((club) => (
          <DropdownMenuItem
            key={club.id}
            onClick={() => handleClubSwitch(club)}
            className="flex items-center gap-2 p-2"
          >
            <Building2 className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{club.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {club.member_type}
              </span>
            </div>
            {club.id === currentClub.id && (
              <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
