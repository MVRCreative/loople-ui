"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { ClubsService, Club } from './services/clubs.service';
import { getUserClubRole } from './services/permissions.service';
import { useAuth } from './auth-context';

interface ClubContextType {
  clubs: Club[];
  selectedClub: Club | null;
  loading: boolean;
  error: string | null;
  selectClub: (club: Club) => void;
  refreshClubs: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

interface ClubProviderProps {
  children: ReactNode;
}

export function ClubProvider({ children }: ClubProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubRole, setClubRole] = useState<'owner' | 'admin' | 'member' | null>(null);

  // Load user's clubs when authenticated
  const loadUserClubs = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);
      
      const userClubs = await ClubsService.getUserClubs();
      // Ensure we always have an array
      const clubsArr = Array.isArray(userClubs) ? userClubs : [];
      // #region agent log
      if (typeof fetch !== "undefined") fetch("http://127.0.0.1:7242/ingest/fa342421-bbc3-4297-9f03-9cfbd6477dbe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"club-context.tsx:loadClubs",message:"Clubs loaded",data:{count:clubsArr.length,rawIsArray:Array.isArray(userClubs)},timestamp:Date.now(),hypothesisId:"C"})}).catch(()=>{});
      // #endregion
      setClubs(clubsArr);
    } catch (err) {
      console.error('Error loading user clubs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Load clubs when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserClubs();
    } else {
      // Clear clubs when user logs out
      setClubs([]);
      setSelectedClub(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Select a club
  const selectClub = (club: Club) => {
    setSelectedClub(club);
    // Store selected club in localStorage for persistence
    localStorage.setItem('selectedClubId', club.id);
  };

  // Auto-select newly created club
  // const _selectNewClub = (newClub: Club) => {
  //   setClubs(prev => [...prev, newClub]);
  //   selectClub(newClub);
  // };

  // Refresh clubs data
  const refreshClubs = async () => {
    await loadUserClubs();
  };

  // Auto-select first club when clubs are loaded
  useEffect(() => {
    if (clubs.length > 0 && !selectedClub) {
      setSelectedClub(clubs[0]);
    }
  }, [clubs, selectedClub]);

  // Restore selected club from localStorage on mount
  useEffect(() => {
    if (clubs.length > 0 && !selectedClub) {
      const savedClubId = localStorage.getItem('selectedClubId');
      if (savedClubId) {
        const savedClub = clubs.find(club => club.id === savedClubId);
        if (savedClub) {
          setSelectedClub(savedClub);
        }
      }
    }
  }, [clubs, selectedClub]);

  // Fetch user's role for selected club
  useEffect(() => {
    if (!user?.id || !selectedClub?.id) {
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

  // Check user's role/permissions for selected club
  const isOwner = selectedClub ? selectedClub.owner_id === user?.id : false;
  const isAdmin = clubRole === 'admin' || clubRole === 'owner';
  const isMember = selectedClub ? clubs.some(club => club.id === selectedClub.id) : false;

  const value: ClubContextType = {
    clubs,
    selectedClub,
    loading,
    error,
    selectClub,
    refreshClubs,
    isOwner,
    isAdmin,
    isMember,
  };

  return (
    <ClubContext.Provider value={value}>
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
}

// Custom hook for protected club routes
export function useRequireClub() {
  const { selectedClub, loading } = useClub();
  const { isAuthenticated: authIsAuthenticated, loading: authLoading } = useAuth();
  
  return {
    selectedClub,
    loading: loading || authLoading,
    isAuthenticated: authIsAuthenticated,
    isReady: !loading && !authLoading,
  };
}
