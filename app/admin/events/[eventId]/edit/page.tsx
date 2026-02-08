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
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";
import { ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AdminEditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const eventId = typeof params?.eventId === "string" ? params.eventId : "";
  const { event, loading, error, loadEvent } = useEvent(eventId);
  const { loading: clubLoading } = useClub();
  
  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdmin = currentUser.isAdmin;

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (_data: CreateEventData | UpdateEventData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Event updated successfully!");
      router.push(`/admin/events/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
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
        loading={isSubmitting}
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


