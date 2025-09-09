"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Building2, Settings, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useClub } from "@/lib/club-context";
import { useAuth } from "@/lib/auth-context";
import { Club } from "@/lib/services/clubs.service";

interface ClubSwitcherProps {
  className?: string;
}

export function ClubSwitcher({ className }: ClubSwitcherProps) {
  const router = useRouter();
  const { clubs, selectedClub, loading, selectClub, isOwner, isAdmin } = useClub();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  // Ensure client-side rendering to avoid hydration mismatch
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Show consistent loading state during SSR and initial client render
  if (!isClient || !isAuthenticated || loading) {
    return (
      <div className={`h-auto p-2 ${className}`}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-muted-foreground">
              Loading clubs...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleClubSwitch = (club: Club) => {
    selectClub(club);
    setIsOpen(false);
  };

  const handleClubManagement = () => {
    setIsOpen(false);
    router.push("/club-management");
  };

  const handleCreateClub = () => {
    setIsOpen(false);
    router.push("/club-management?action=create");
  };

  // Show club management links when no clubs or clubs is not an array
  if (!Array.isArray(clubs) || clubs.length === 0) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`h-auto p-2 justify-start gap-2 ${className}`}
          >
            <Building2 className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">No Clubs</span>
              <span className="text-xs text-muted-foreground">
                Create or join a club
              </span>
            </div>
            <ChevronDown className="h-3 w-3 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuItem
            onClick={handleClubManagement}
            className="flex items-center gap-2 p-2"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Club Management</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={handleCreateClub}
            className="flex items-center gap-2 p-2"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Create New Club</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const getUserRole = (club: Club | null | undefined) => {
    if (!club || !club.owner_id) return "member";
    
    if (club.owner_id === selectedClub?.owner_id && isOwner) {
      return "owner";
    }
    if (isAdmin) {
      return "admin";
    }
    return "member";
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`h-auto p-2 justify-start gap-2 ${className}`}
        >
          <Building2 className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{selectedClub?.name}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {getUserRole(selectedClub)}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {/* Club List */}
        {Array.isArray(clubs) && clubs.map((club) => (
          <DropdownMenuItem
            key={club.id}
            onClick={() => handleClubSwitch(club)}
            className="flex items-center gap-2 p-2"
          >
            <Building2 className="h-4 w-4" />
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-medium">{club.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {getUserRole(club)}
              </span>
            </div>
            {club.id === selectedClub?.id && (
              <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Club Management Button */}
        <DropdownMenuItem
          onClick={handleClubManagement}
          className="flex items-center gap-2 p-2"
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">Club Management</span>
        </DropdownMenuItem>
        
        {/* Create New Club Button */}
        <DropdownMenuItem
          onClick={handleCreateClub}
          className="flex items-center gap-2 p-2"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Create New Club</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}