"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventHeader } from "@/components/events/EventHeader";
import { AttendeesTable } from "@/components/events/AttendeesTable";
import { RSVPButtonGroup } from "@/components/events/RSVPButtonGroup";
import { EventFeed } from "@/components/events/EventFeed";
import { useEvent, useRSVP } from "@/lib/events/hooks";
import { EventRSVPStatus } from "@/lib/events/types";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";
import { ArrowLeft, Share2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useClub } from "@/lib/club-context";
import { RSVPService, EventRegistration } from "@/lib/services/rsvp.service";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();
  
  const eventId = typeof params?.eventId === "string" ? params.eventId : "";
  
  // Convert auth user to frontend User type
  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();
  
  const { event, rsvps, posts, loading, error, loadEvent } = useEvent(eventId);
  const { getUserRSVP, updateRSVP, loadRSVPs } = useRSVP(eventId, currentUser.id);
  const { selectedClub, isOwner } = useClub();

  // Load event and RSVPs on mount
  useEffect(() => {
    loadEvent();
    loadRSVPs();
  }, [loadEvent, loadRSVPs]);

  // Find user's RSVP status
  const userRSVP = getUserRSVP();
  const userRSVPStatus = userRSVP?.status || "not_responded";

  // Determine owner management access
  const canManage = !!(isOwner && selectedClub && event && String(selectedClub.id) === event.club_id);

  // Owner RSVP management state
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [updatingRsvpId, setUpdatingRsvpId] = useState<number | null>(null);
  const [rsvpSearch, setRsvpSearch] = useState<string>("");

  useEffect(() => {
    if (!eventId || !canManage) return;
    const fetchRegs = async () => {
      try {
        setLoadingRegistrations(true);
        const regs = await RSVPService.getEventRSVPs(eventId);
        setRegistrations(regs);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load RSVPs");
      } finally {
        setLoadingRegistrations(false);
      }
    };
    fetchRegs();
  }, [eventId, canManage]);

  const filteredRegistrations = useMemo(() => {
    if (!rsvpSearch.trim()) return registrations;
    const term = rsvpSearch.trim().toLowerCase();
    return registrations.filter((reg) =>
      `${reg.members.first_name} ${reg.members.last_name}`.toLowerCase().includes(term) ||
      (reg.members.email?.toLowerCase() || '').includes(term)
    );
  }, [registrations, rsvpSearch]);

  const updateMemberRsvp = async (
    registrationId: number,
    memberId: number,
    status: 'registered' | 'confirmed' | 'canceled' | 'waitlisted' | 'attended'
  ) => {
    if (!eventId) return;
    try {
      setUpdatingRsvpId(registrationId);
      await RSVPService.updateMemberRSVP(eventId, memberId, status);
      toast.success("RSVP updated");
      const regs = await RSVPService.getEventRSVPs(eventId);
      setRegistrations(regs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update RSVP");
    } finally {
      setUpdatingRsvpId(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || "Event",
          text: `Check out this event: ${event?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard!");
    }
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location.name)}`;
    
    window.open(calendarUrl, '_blank');
  };

  const handleRSVPUpdate = (status: string) => {
    updateRSVP(status as EventRSVPStatus);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Failed to load event</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Event not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            The event you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Event Header */}
      <EventHeader 
        event={event} 
      />

      {/* RSVP Section */}
      {isAuthenticated && event.status === "published" && (
        <Card>
          <CardContent className="py-6">
            <RSVPButtonGroup
              currentStatus={userRSVPStatus}
              onRSVPUpdate={handleRSVPUpdate}
            />
          </CardContent>
        </Card>
      )}

      {/* Event Feed */}
      <Card>
        <CardContent className="py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Event Discussion</h2>
              <Badge variant="outline">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </Badge>
            </div>
            
            <EventFeed 
              eventId={event.id}
              clubId={parseInt(event.club_id)}
              className="mt-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendees Table */}
      {rsvps.length > 0 && (
        <Card>
          <CardContent className="py-6">
            <AttendeesTable rsvps={rsvps} />
          </CardContent>
        </Card>
      )}

      {/* Owner-only: Manage RSVPs */}
      {canManage && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Manage RSVPs</h2>
                <Input
                  placeholder="Search by name or email"
                  value={rsvpSearch}
                  onChange={(e) => setRsvpSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs lg:text-sm">Member</TableHead>
                      <TableHead className="text-xs lg:text-sm">Status</TableHead>
                      <TableHead className="text-xs lg:text-sm">Responded</TableHead>
                      <TableHead className="text-xs lg:text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {(reg.members.first_name?.[0] || '👤')}
                            </div>
                            <div>
                              <div className="font-medium">{reg.members.first_name} {reg.members.last_name}</div>
                              <div className="text-xs text-muted-foreground">{reg.members.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[220px]">
                          <Select
                            value={reg.status}
                            onValueChange={(value) => updateMemberRsvp(
                              reg.id,
                              reg.members.id,
                              value as 'registered' | 'confirmed' | 'canceled' | 'waitlisted' | 'attended'
                            )}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registered">Registered (Maybe)</SelectItem>
                              <SelectItem value="confirmed">Confirmed (Going)</SelectItem>
                              <SelectItem value="canceled">Canceled (Not going)</SelectItem>
                              <SelectItem value="waitlisted">Waitlisted</SelectItem>
                              <SelectItem value="attended">Attended</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(reg.registration_date).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" disabled>
                            —
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRegistrations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          {loadingRegistrations ? 'Loading RSVPs…' : 'No RSVPs found.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}