"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { AdminEventStats } from "@/components/events/AdminEventStats";
import { EventMeta } from "@/components/events/EventMeta";
import { useEvent } from "@/lib/events/hooks";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";
import { ArrowLeft, Edit, Eye, Share2, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { RSVPService, EventRegistration } from "@/lib/services/rsvp.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminEventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const eventId = typeof params?.eventId === "string" ? params.eventId : "";
  const { event, rsvps, posts, loading, error, loadEvent } = useEvent(eventId);
  
  // Convert auth user to frontend User type
  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  // Check if user is admin
  const isAdmin = currentUser.isAdmin;

  // Load event on mount
  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/admin/events/edit-${eventId}`);
  };

  const handleView = () => {
    router.push(`/event/${eventId}`);
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

  const handleExportRSVPs = () => {
    // TODO: Implement CSV export functionality
    toast.info("CSV export functionality coming soon!");
  };

  const handleModeratePosts = () => {
    // TODO: Implement post moderation functionality
    toast.info("Post moderation functionality coming soon!");
  };

  // RSVP Management
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [updatingRsvpId, setUpdatingRsvpId] = useState<number | null>(null);
  const [rsvpSearch, setRsvpSearch] = useState<string>("");

  useEffect(() => {
    if (!eventId) return;
    const fetchRegistrations = async () => {
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
    fetchRegistrations();
  }, [eventId]);

  const filteredRegistrations = useMemo(() => {
    const term = rsvpSearch.trim().toLowerCase();
    if (!term) return registrations;
    return registrations.filter((r) =>
      `${r.members.first_name} ${r.members.last_name}`.toLowerCase().includes(term) ||
      (r.members.email?.toLowerCase() || '').includes(term)
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
      // Reload registrations to reflect changes
      const regs = await RSVPService.getEventRSVPs(eventId);
      setRegistrations(regs);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update RSVP");
    } finally {
      setUpdatingRsvpId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
          <EventMeta 
            event={event} 
            showCapacity={true} 
            showProgram={true}
            className="mt-2"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Event Details */}
      <EventDetailHeader event={event} onShare={handleShare} />

      {/* Admin Stats */}
      <AdminEventStats 
        event={event} 
        rsvps={rsvps}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              onClick={handleExportRSVPs}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Export RSVPs
            </Button>
            
            <Button
              variant="outline"
              onClick={handleModeratePosts}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Moderate Posts
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(`/event/${event.id}`, '_blank')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Event
            </Button>
            
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manage RSVPs */}
      <Card>
        <CardHeader>
          <CardTitle>Manage RSVPs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by name or role"
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

      {/* Event Posts Summary */}
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Event Discussion ({posts.length} posts)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {posts.slice(0, 5).map((eventPost) => (
                <div key={eventPost.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {eventPost.post.user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{eventPost.post.user.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {eventPost.post.content}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(eventPost.post.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {posts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{posts.length - 5} more posts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}