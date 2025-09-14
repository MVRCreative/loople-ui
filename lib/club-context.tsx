"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ClubsService, Club } from './services/clubs.service';
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

  // Load user's clubs when authenticated
  const loadUserClubs = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);
      
      const userClubs = await ClubsService.getUserClubs();
      // Ensure we always have an array
      setClubs(Array.isArray(userClubs) ? userClubs : []);
      
      // Auto-select first club if none selected
      const safeClubs = Array.isArray(userClubs) ? userClubs : [];
      if (safeClubs.length > 0 && !selectedClub) {
        setSelectedClub(safeClubs[0]);
      }
    } catch (err) {
      console.error('Error loading user clubs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  // Load clubs when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserClubs();
    } else {
      // Clear clubs when user logs out
      setClubs([]);
      setSelectedClub(null);
    }
  }, [isAuthenticated, user, loadUserClubs]);

  // Select a club
  const selectClub = (club: Club) => {
    setSelectedClub(club);
    // Store selected club in localStorage for persistence
    localStorage.setItem('selectedClubId', club.id);
  };

  // Auto-select newly created club
  const _selectNewClub = (newClub: Club) => {
    setClubs(prev => [...prev, newClub]);
    selectClub(newClub);
  };

  // Refresh clubs data
  const refreshClubs = async () => {
    await loadUserClubs();
  };

  // Restore selected club from localStorage on mount
  useEffect(() => {
    if (clubs.length > 0 && !selectedClub) {
      const savedClubId = localStorage.getItem('selectedClubId');
      if (savedClubId) {
        const savedClub = clubs.find(club => club.id === savedClubId);
        if (savedClub) {
          setSelectedClub(savedClub);
        } else {
          // If saved club not found, select first club
          setSelectedClub(clubs[0]);
        }
      } else {
        // No saved club, select first club
        setSelectedClub(clubs[0]);
      }
    }
  }, [clubs, selectedClub]);

  // Check user's role/permissions for selected club
  const isOwner = selectedClub ? selectedClub.owner_id === user?.id : false;
  const isAdmin = false; // TODO: Implement admin role check based on user's role in the club
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
