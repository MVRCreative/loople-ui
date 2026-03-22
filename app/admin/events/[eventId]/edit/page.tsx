"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminEventForm } from "@/components/events/AdminEventForm";
import { useEvent } from "@/lib/events/hooks";
import { useClub } from "@/lib/club-context";
import { CreateEventData, UpdateEventData } from "@/lib/events/types";
import { useAdminClubPageAccess } from "@/lib/hooks/use-admin-club-page-access";
import { ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";
import { EventsService } from "@/lib/services/events.service";
import type { CreateEventData as ApiCreateEventData } from "@/lib/services/events.service";

export default function AdminEditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = typeof params?.eventId === "string" ? params.eventId : "";
  const { event, loading, error, loadEvent } = useEvent(eventId);
  const { loading: clubLoading, selectedClub } = useClub();
  const { globalAdmin, canManageSelectedClub } = useAdminClubPageAccess();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (data: CreateEventData | UpdateEventData) => {
    setIsSubmitting(true);
    try {
      const updates: Partial<ApiCreateEventData> = {
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        end_date: data.end_date,
        location: data.location?.name,
        max_capacity: data.capacity?.max,
        program_id: data.program ? Number(data.program) : undefined,
      };
      await EventsService.updateEvent(eventId, updates);
      toast.success("Event updated successfully!");
      router.push(`/admin/events/${eventId}`);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading club...</p>
        </div>
      </div>
    );
  }

  if (!globalAdmin && !selectedClub) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium text-foreground">Select a club</p>
          <p className="text-sm text-muted-foreground mt-2">
            Use the club switcher above, then open this event again.
          </p>
          <Button onClick={() => router.push("/admin/events")} className="mt-4">
            Back to events
          </Button>
        </div>
      </div>
    );
  }

  if (!canManageSelectedClub) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium text-destructive">Access denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            You don&apos;t have permission to manage this club.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading event...</p>
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
            The event you&apos;re trying to edit doesn&apos;t exist or has been removed.
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
          <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
          <p className="text-muted-foreground">
            Update event details and settings
          </p>
        </div>
      </div>

      {/* Event Form */}
      <AdminEventForm
        event={event}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading || isSubmitting}
      />

      {/* Preview Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Preview how this event will appear to members
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(`/event/${event.id}`, '_blank')}
            >
              View Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


