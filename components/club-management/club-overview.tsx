"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useClub } from "@/lib/club-context";
import { MembersService, EventsService, RegistrationsService, PaymentsService } from "@/lib/services";

interface ClubStats {
  memberCount: number;
  upcomingEvents: number;
  monthlyRevenue: number;
  activePrograms: number;
}

export function ClubOverview() {
  const { selectedClub } = useClub();
  const [stats, setStats] = useState<ClubStats>({
    memberCount: 0,
    upcomingEvents: 0,
    monthlyRevenue: 0,
    activePrograms: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClubStats = async () => {
    if (!selectedClub) return;

    try {
      setLoading(true);
      setError(null);

      // Load data from API services
      const [members, events, , payments] = await Promise.all([
        MembersService.getClubMembers(selectedClub.id),
        EventsService.getEvents({ club_id: selectedClub.id }),
        RegistrationsService.getRegistrations({ club_id: selectedClub.id }),
        PaymentsService.getPayments({ club_id: selectedClub.id })
      ]);

      // Calculate stats
      const activeMembers = members.filter((m) => {
        const status = (m as unknown as { membership_status?: string; status?: string }).membership_status || (m as unknown as { status?: string }).status;
        return status === 'active';
      }).length;
      const upcomingEventsCount = events.filter(e => e.status === 'upcoming').length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyPayments = payments.filter(p => {
        const paymentDate = new Date(p.created_at);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               p.status === 'completed';
      });

      const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const activePrograms = events.filter(e => e.event_type === 'practice' && e.status === 'upcoming').length;

      setStats({
        memberCount: activeMembers,
        upcomingEvents: upcomingEventsCount,
        monthlyRevenue,
        activePrograms,
      });
    } catch (err) {
      console.error('Error loading club stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load club statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubStats();
  }, [selectedClub]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadClubStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs lg:text-sm font-medium">Total Members</CardTitle>
          <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl lg:text-2xl font-bold">{stats.memberCount}</div>
          <p className="text-xs text-muted-foreground">
            Active members
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs lg:text-sm font-medium">Upcoming Events</CardTitle>
          <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl lg:text-2xl font-bold">{stats.upcomingEvents}</div>
          <p className="text-xs text-muted-foreground">
            Scheduled events
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs lg:text-sm font-medium">Monthly Revenue</CardTitle>
          <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl lg:text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs lg:text-sm font-medium">Active Programs</CardTitle>
          <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl lg:text-2xl font-bold">{stats.activePrograms}</div>
          <p className="text-xs text-muted-foreground">
            Practice sessions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
