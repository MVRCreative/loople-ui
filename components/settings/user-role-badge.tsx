"use client";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { Shield, Crown, Building2 } from "lucide-react";

export function UserRoleBadge() {
  const { user } = useAuth();
  const { isOwner, isAdmin, selectedClub } = useClub();

  const isGlobalAdmin =
    (user?.app_metadata as { isAdmin?: boolean } | undefined)?.isAdmin === true;

  const roles: { label: string; icon: React.ReactNode }[] = [];

  if (isGlobalAdmin) {
    roles.push({
      label: "Global Admin",
      icon: <Shield className="h-3 w-3" />,
    });
  }

  if (isOwner && selectedClub) {
    roles.push({
      label: `Owner • ${selectedClub.name}`,
      icon: <Crown className="h-3 w-3" />,
    });
  } else if (isAdmin && selectedClub && !isOwner) {
    roles.push({
      label: `Admin • ${selectedClub.name}`,
      icon: <Building2 className="h-3 w-3" />,
    });
  }

  if (roles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Your role</p>
      <div className="flex flex-wrap gap-2">
        {roles.map(({ label, icon }) => (
          <Badge
            key={label}
            variant="secondary"
            className="gap-1.5 py-1 px-2.5 text-xs"
          >
            {icon}
            {label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
