"use client";

import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { hasGlobalAdminRole } from "@/lib/auth/admin-access";

/**
 * Access for club-scoped admin pages. Club owners/admins (from DB / permissions.service
 * via ClubProvider) are included; JWT-only `convertAuthUserToUser().isAdmin` is not enough.
 */
export function useAdminClubPageAccess() {
  const { user } = useAuth();
  const {
    isAdmin: isClubAdminOrOwner,
    loading: clubLoading,
    selectedClub,
  } = useClub();

  const globalAdmin = Boolean(user && hasGlobalAdminRole(user));
  const canManageSelectedClub = globalAdmin || isClubAdminOrOwner;

  return {
    globalAdmin,
    isClubAdminOrOwner,
    canManageSelectedClub,
    selectedClub,
    clubLoading,
  };
}
