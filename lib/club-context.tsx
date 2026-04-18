"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ClubsService, Club } from "./services/clubs.service";
import { getUserClubRole } from "./services/permissions.service";
import { useAuth } from "./auth-context";
import { env } from "./env";
import { buildTenantUrl, isLocalDomain } from "./utils/subdomain";

/* ---------------------------------------------------------------------------
 * Club context is split in two:
 *
 *   ClubListProvider  - owns the list of clubs the signed-in user belongs to.
 *                       Mounted near the root of the app.
 *
 *   CurrentClubProvider - owns the "active" club for the current screen.
 *                         In the subdomain world the active club is URL-derived
 *                         (populated by the tenant layout at
 *                         /app/s/[subdomain]/layout.tsx). On the root host it
 *                         falls back to a localStorage-based selection so the
 *                         root dashboard keeps working during migration.
 *
 * The legacy `ClubProvider` composes both so `app/layout.tsx` and
 * `useClub()` keep their existing shape. `useCurrentClub()` /
 * `useClubList()` are the new, canonical hooks; `useClub()` is kept as an
 * alias for incremental migration.
 * -------------------------------------------------------------------------- */

// --- Types -----------------------------------------------------------------

type ClubRole = "owner" | "admin" | "member" | null;

interface ClubListContextType {
  clubs: Club[];
  loading: boolean;
  error: string | null;
  refreshClubs: () => Promise<void>;
}

interface CurrentClubContextType {
  selectedClub: Club | null;
  selectClub: (club: Club) => void;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  clubRole: ClubRole;
}

// Backwards-compatible combined shape matching the original useClub() API.
interface ClubContextType
  extends ClubListContextType,
    CurrentClubContextType {}

const ClubListContext = createContext<ClubListContextType | undefined>(
  undefined
);
const CurrentClubContext = createContext<CurrentClubContextType | undefined>(
  undefined
);

// --- ClubListProvider ------------------------------------------------------

export function ClubListProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserClubs = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      setLoading(true);
      setError(null);
      const userClubs = await ClubsService.getUserClubs();
      setClubs(Array.isArray(userClubs) ? userClubs : []);
    } catch (err) {
      console.error("Error loading user clubs:", err);
      setError(err instanceof Error ? err.message : "Failed to load clubs");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserClubs();
    } else {
      setClubs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const value = useMemo<ClubListContextType>(
    () => ({
      clubs,
      loading,
      error,
      refreshClubs: loadUserClubs,
    }),
    [clubs, loading, error, loadUserClubs]
  );

  return (
    <ClubListContext.Provider value={value}>
      {children}
    </ClubListContext.Provider>
  );
}

export function useClubList() {
  const ctx = useContext(ClubListContext);
  if (!ctx) {
    throw new Error("useClubList must be used within a ClubListProvider");
  }
  return ctx;
}

// --- CurrentClubProvider ---------------------------------------------------

interface CurrentClubProviderProps {
  /**
   * When the tenant layout knows which club the URL maps to (e.g.
   * `/s/eastside-fc/...`), it passes the full club here. This makes the
   * active club URL-derived on tenant subdomains.
   */
  initialClub?: Club | null;
  children: ReactNode;
}

export function CurrentClubProvider({
  initialClub = null,
  children,
}: CurrentClubProviderProps) {
  const { user } = useAuth();
  const { clubs } = useClubList();

  // Local state for legacy root-host behavior (localStorage driven). When
  // initialClub is set (tenant route), it always wins.
  const [localSelected, setLocalSelected] = useState<Club | null>(null);
  const [clubRole, setClubRole] = useState<ClubRole>(null);

  const selectedClub = initialClub ?? localSelected;

  // Bootstrap the legacy root-host selection from localStorage, falling
  // back to the first club. Collapsed into a single effect so the
  // priority (saved > first) is explicit and we only issue one setState.
  useEffect(() => {
    if (initialClub || localSelected || clubs.length === 0) return;
    let next: Club | undefined;
    if (typeof window !== "undefined") {
      const savedId = window.localStorage.getItem("selectedClubId");
      if (savedId) next = clubs.find((c) => c.id === savedId);
    }
    if (!next) next = clubs[0];
    // Client-only bootstrap: selection can't be derived during render
    // because localStorage isn't available on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSelected(next);
  }, [clubs, localSelected, initialClub]);

  // Keep localStorage pinned to whichever club is active (URL or manual).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!selectedClub) return;
    window.localStorage.setItem("selectedClubId", selectedClub.id);
  }, [selectedClub]);

  // Role lookup for the active club. We synchronously clear on change so
  // consumers never see stale role info for a different club while the
  // new fetch is in flight.
  useEffect(() => {
    if (!user?.id || !selectedClub?.id) {
      // Must clear role when auth/club identity changes; deferring would
      // leak the previous club's role to the new screen.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClubRole(null);
      return;
    }
    let cancelled = false;
    getUserClubRole(user.id, selectedClub.id).then((role) => {
      if (!cancelled) setClubRole(role);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, selectedClub?.id]);

  const selectClub = useCallback(
    (club: Club) => {
      // When subdomain routing is on, switching clubs means navigating to
      // the club's subdomain. This keeps the URL as the single source of
      // truth for "which tenant am I in?".
      if (
        env.ENABLE_SUBDOMAIN_ROUTING &&
        club.subdomain &&
        typeof window !== "undefined" &&
        !isLocalDomain(env.ROOT_DOMAIN)
      ) {
        const target = buildTenantUrl(
          club.subdomain,
          env.ROOT_DOMAIN,
          window.location.pathname + window.location.search
        );
        window.location.assign(target);
        return;
      }

      // Legacy / local dev: update client-side state and persist.
      setLocalSelected(club);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("selectedClubId", club.id);
      }
    },
    []
  );

  const isOwner = selectedClub ? selectedClub.owner_id === user?.id : false;
  const isAdmin = clubRole === "admin" || clubRole === "owner";
  const isMember = selectedClub
    ? clubs.some((c) => c.id === selectedClub.id)
    : false;

  const value = useMemo<CurrentClubContextType>(
    () => ({
      selectedClub,
      selectClub,
      isOwner,
      isAdmin,
      isMember,
      clubRole,
    }),
    [selectedClub, selectClub, isOwner, isAdmin, isMember, clubRole]
  );

  return (
    <CurrentClubContext.Provider value={value}>
      {children}
    </CurrentClubContext.Provider>
  );
}

export function useCurrentClub() {
  const ctx = useContext(CurrentClubContext);
  if (!ctx) {
    throw new Error(
      "useCurrentClub must be used within a CurrentClubProvider"
    );
  }
  return ctx;
}

// --- Combined ClubProvider (backwards compat) ------------------------------

export function ClubProvider({ children }: { children: ReactNode }) {
  return (
    <ClubListProvider>
      <CurrentClubProvider>{children}</CurrentClubProvider>
    </ClubListProvider>
  );
}

/**
 * Legacy merged hook. Prefer `useClubList()` and `useCurrentClub()` in new
 * code; this exists so existing components keep working during the
 * multi-tenant migration.
 */
export function useClub(): ClubContextType {
  const list = useClubList();
  const current = useCurrentClub();
  return useMemo(
    () => ({
      ...list,
      ...current,
    }),
    [list, current]
  );
}

export function useRequireClub() {
  const { selectedClub } = useCurrentClub();
  const { loading } = useClubList();
  const { isAuthenticated: authIsAuthenticated, loading: authLoading } =
    useAuth();

  return {
    selectedClub,
    loading: loading || authLoading,
    isAuthenticated: authIsAuthenticated,
    isReady: !loading && !authLoading,
  };
}
