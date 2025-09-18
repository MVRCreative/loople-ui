"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventHeader } from "@/components/events/EventHeader";
import { AttendeesTable } from "@/components/events/AttendeesTable";
import { RSVPButtonGroup } from "@/components/events/RSVPButtonGroup";
import { EventFeed } from "@/components/events/EventFeed";
import { useEvent, useRSVP } from "@/lib/events/hooks";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";
import { ArrowLeft, Share2, Calendar } from "lucide-react";
import { toast } from "sonner";

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

  // Load event and RSVPs on mount
  useEffect(() => {
    loadEvent();
    loadRSVPs();
  }, [loadEvent, loadRSVPs]);

  // Find user's RSVP status
  const userRSVP = getUserRSVP();
  const userRSVPStatus = userRSVP?.status || "not_responded";

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
    updateRSVP(status as any);
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
              eventId={event.id}
              userId={currentUser.id}
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
    </div>
  );
}