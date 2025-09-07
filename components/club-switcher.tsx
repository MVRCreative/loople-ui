"use client";

import * as React from "react";
import { ChevronDown, Building2 } from "lucide-react";
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

// Mock clubs data
const mockClubs: Club[] = [
  {
    id: "1",
    name: "Loople Swimming Club",
    subdomain: "loople",
    member_type: "admin",
  },
  {
    id: "2", 
    name: "Aqua Fitness Center",
    subdomain: "aqua",
    member_type: "member",
  },
  {
    id: "3",
    name: "Elite Swim Team",
    subdomain: "elite",
    member_type: "coach",
  },
];

export function ClubSwitcher({ className }: ClubSwitcherProps) {
  const [clubs] = React.useState<Club[]>(mockClubs);
  const [currentClubId, setCurrentClubId] = React.useState<string>("1");
  const [isOpen, setIsOpen] = React.useState(false);

  const currentClub = clubs.find(club => club.id === currentClubId) || clubs[0];

  const handleClubSwitch = (club: Club) => {
    setCurrentClubId(club.id);
    setIsOpen(false);
    // In a real app, you might want to update the URL or trigger a page refresh
    console.log(`Switched to club: ${club.name}`);
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