"use client";

import { useEffect } from "react";
import { EventCard } from "@/components/events/EventCard";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { RSVPButtonGroup } from "@/components/events/RSVPButtonGroup";
import { EventMeta } from "@/components/events/EventMeta";
import { AdminEventForm } from "@/components/events/AdminEventForm";
import { AdminEventStats } from "@/components/events/AdminEventStats";
import { useEvents, useEvent } from "@/lib/events/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TestEventsPage() {
  const { events, loading, loadEvents } = useEvents();
  const { event: firstEvent, rsvps } = useEvent(events[0]?.id || "");

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = async (data: unknown) => {
    console.log("Create event:", data);
  };

  const handleUpdateEvent = async (data: unknown) => {
    console.log("Update event:", data);
  };

  const handleRSVPUpdate = (status: string) => {
    console.log("RSVP update:", status);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading test data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Events Feature Test Page</h1>
        <p className="text-muted-foreground mt-2">
          Testing all events components and functionality
        </p>
      </div>

      {/* Event Cards Test */}
      <Card>
        <CardHeader>
          <CardTitle>Event Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 3).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRSVP={(eventId) => console.log("RSVP for:", eventId)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Header Test */}
      {firstEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Event Detail Header</CardTitle>
          </CardHeader>
          <CardContent>
            <EventDetailHeader event={firstEvent} />
          </CardContent>
        </Card>
      )}

      {/* Event Meta Test */}
      <Card>
        <CardHeader>
          <CardTitle>Event Meta Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="p-4 border border-border rounded-lg">
                <h3 className="font-medium mb-2">{event.title}</h3>
                <EventMeta 
                  event={event} 
                  showCapacity={true} 
                  showProgram={true}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RSVP Button Group Test */}
      {firstEvent && (
        <Card>
          <CardHeader>
            <CardTitle>RSVP Button Group</CardTitle>
          </CardHeader>
          <CardContent>
            <RSVPButtonGroup
              currentStatus="not_responded"
              onRSVPUpdate={handleRSVPUpdate}
            />
          </CardContent>
        </Card>
      )}

      {/* Admin Event Form Test */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Event Form (Create)</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminEventForm
            onSubmit={handleCreateEvent}
            onCancel={() => console.log("Cancel create")}
          />
        </CardContent>
      </Card>

      {/* Admin Event Form Test (Edit) */}
      {firstEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Event Form (Edit)</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminEventForm
              event={firstEvent}
              onSubmit={handleUpdateEvent}
              onCancel={() => console.log("Cancel edit")}
            />
          </CardContent>
        </Card>
      )}

      {/* Admin Event Stats Test */}
      {firstEvent && rsvps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Event Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminEventStats
              event={firstEvent}
              rsvps={rsvps}
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {events.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {events.reduce((sum, event) => sum + event.rsvp_count.going, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Going</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {events.reduce((sum, event) => sum + event.rsvp_count.maybe, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Maybe</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {events.filter(e => e.status === "published").length}
              </div>
              <div className="text-sm text-muted-foreground">Published</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Test */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Test the following navigation links:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/events">Events List</a>
              </Button>
              {firstEvent && (
                <Button asChild variant="outline">
                  <a href={`/event/${firstEvent.id}`}>Event Details</a>
                </Button>
              )}
              <Button asChild variant="outline">
                <a href="/admin/events">Admin Events</a>
              </Button>
              {firstEvent && (
                <Button asChild variant="outline">
                  <a href={`/admin/events/edit-${firstEvent.id}`}>Edit Event</a>
                </Button>
              )}
              {firstEvent && (
                <Button asChild variant="outline">
                  <a href={`/admin/event/${firstEvent.id}-details`}>Event Stats</a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}