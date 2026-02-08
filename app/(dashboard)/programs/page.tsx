"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEvents, usePrograms } from "@/lib/events/hooks";
import { useClub } from "@/lib/club-context";
import { groupEventsByProgram } from "@/lib/events/selectors";
import { EventCard } from "@/components/events/EventCard";
import { EventDetail, EventListItem } from "@/lib/events/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";

const transformToEventListItem = (event: EventDetail): EventListItem => ({
  id: event.id,
  title: event.title,
  start_date: event.start_date,
  end_date: event.end_date,
  location: event.location,
  visibility: event.visibility,
  status: event.status,
  is_upcoming: event.is_upcoming,
  is_past: event.is_past,
  rsvp_count: event.rsvp_count,
  program_name: event.program?.name,
  image_url: event.image_url,
});

export default function ProgramsPage() {
  const searchParams = useSearchParams();
  const programIdFilter = searchParams.get("programId");

  const { events, loading, error, loadEvents } = useEvents();
  const { programs, loading: clubLoading } = usePrograms(events);
  const { clubs, selectedClub } = useClub();

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const eventsByProgram = useMemo(() => groupEventsByProgram(events), [events]);

  const filteredPrograms = useMemo(() => {
    if (!programIdFilter) return programs;
    return programs.filter((p) => p.id === programIdFilter);
  }, [programs, programIdFilter]);

  const programNotFound = Boolean(programIdFilter && programs.length > 0 && filteredPrograms.length === 0);

  const hasClub = clubs.length > 0 && !clubLoading;
  const showEmptyNoClub = !clubLoading && clubs.length === 0;
  const showEmptyWithClub = hasClub && !loading && programs.length === 0;

  const handleRSVP = (eventId: string) => {
    window.location.href = `/event/${eventId}`;
  };

  if (loading || clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading programs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (showEmptyNoClub) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Programs</h1>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Join a club to see programs</h3>
            <p className="text-muted-foreground mb-6">
              Programs are available through clubs. Create or join a club to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/admin/club-management?action=create">Create New Club</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/club-management">Go to Club Management</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showEmptyWithClub) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Programs</h1>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No programs yet</h3>
            <p className="text-muted-foreground">
              Programs will appear when your club adds events. Check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (programNotFound) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Programs</h1>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <p className="text-muted-foreground mb-6">Program not found.</p>
            <Button asChild>
              <Link href="/programs">View all programs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Programs</h1>
          <p className="text-muted-foreground">
            {selectedClub ? `Programs in ${selectedClub.name}` : "Manage your programs and activities."}
          </p>
        </div>
        {programIdFilter && (
          <Button variant="outline" asChild>
            <Link href="/programs">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Show all programs
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {filteredPrograms.map((program) => {
          const programEvents = eventsByProgram[program.id] || [];
          const upcomingEvents = programEvents.filter((e) => e.is_upcoming).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
          const pastEvents = programEvents.filter((e) => e.is_past).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

          return (
            <Card key={program.id}>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-foreground">{program.name}</h2>
                  {program.description && (
                    <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
                  )}
                </div>

                {programEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events in this program yet.</p>
                ) : (
                  <div className="space-y-6">
                    {upcomingEvents.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Upcoming events</h3>
                        <div className="space-y-3">
                          {upcomingEvents.map((event) => (
                            <EventCard
                              key={event.id}
                              event={transformToEventListItem(event)}
                              onRSVP={handleRSVP}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {pastEvents.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Past events</h3>
                        <div className="space-y-3">
                          {pastEvents.slice(0, 5).map((event) => (
                            <EventCard
                              key={event.id}
                              event={transformToEventListItem(event)}
                              showRSVP={false}
                            />
                          ))}
                          {pastEvents.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{pastEvents.length - 5} more past events
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
