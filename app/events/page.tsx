"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/events/EventCard";
import { CreateEventForm } from "@/components/club-management/create-event-form";
import { EditEventForm } from "@/components/club-management/edit-event-form";
import { useEvents } from "@/lib/events/hooks";
import { useClub } from "@/lib/club-context";
import { Search, Filter, Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { Event, EventsService } from "@/lib/services/events.service";
import { EventDetail, EventListItem } from "@/lib/events/types";

// Helper function to transform EventDetail to EventListItem
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

export default function EventsPage() {
  const { events, loading, error, loadEvents } = useEvents();
  const { selectedClub, isOwner } = useClub();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("all");
  
  // CRUD state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Filter events based on search and visibility (without tab filter for counts)
  const baseFilteredEvents = events.filter(event => {
    // Apply search filter
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      const searchableText = [
        event.title,
        event.location.name,
        event.location.address || "",
        event.location.city || "",
        event.program?.name || "",
      ].join(" ").toLowerCase();
      
      if (!searchableText.includes(searchTerm)) return false;
    }
    
    // Apply visibility filter
    if (selectedVisibility !== "all" && event.visibility !== selectedVisibility) {
      return false;
    }
    
    return true;
  });

  // Filter events based on current tab selection
  const filteredEvents = baseFilteredEvents.filter(event => {
    // Apply tab filter
    if (selectedTab === "upcoming" && !event.is_upcoming) {
      return false;
    }
    if (selectedTab === "past" && !event.is_past) {
      return false;
    }
    
    return true;
  });

  // Sort events by date (upcoming first, then by start date)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    // Past events come last
    if (a.is_past && !b.is_past) return 1;
    if (!a.is_past && b.is_past) return -1;
    
    // Within same category, sort by start date
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });

  // Get upcoming and past events for tabs from base filtered data (before tab filtering)
  const upcomingEvents = baseFilteredEvents.filter(event => event.is_upcoming);
  const pastEvents = baseFilteredEvents.filter(event => event.is_past);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleVisibilityChange = (visibility: string) => {
    setSelectedVisibility(visibility);
  };

  const handleRSVP = (eventId: string) => {
    // Navigate to event details page
    window.location.href = `/event/${eventId}`;
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedVisibility("all");
  };

  // CRUD handlers
  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadEvents(); // Refresh events list
  };

  const handleEditSuccess = () => {
    setEditingEvent(null);
    loadEvents(); // Refresh events list
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingEventId(eventId);
      await EventsService.deleteEvent(eventId);
      loadEvents(); // Refresh events list
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete event. Please try again.");
    } finally {
      setDeletingEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Failed to load events</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button onClick={loadEvents} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground">
              Discover and join upcoming events in your club
            </p>
          </div>
          {isOwner && selectedClub && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={selectedVisibility}
              onValueChange={handleVisibilityChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="members_only">Members Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="px-3"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <Card className="border-2 border-dashed border-primary/20 transition-all duration-300 ease-in-out">
          <CreateEventForm 
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </Card>
      )}

      {/* Edit Event Form */}
      {editingEvent && (
        <Card className="border-2 border-dashed border-primary/20 transition-all duration-300 ease-in-out">
          <EditEventForm 
            event={editingEvent}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingEvent(null)}
          />
        </Card>
      )}

      {/* Events Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Past ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingEvents.length > 0 ? (
            <div className="space-y-0">
              {sortedEvents.filter(event => event.is_upcoming).map((event) => (
                  <EventCard
                    key={event.id}
                    event={transformToEventListItem(event)}
                    onRSVP={handleRSVP}
                    onEdit={(eventId) => {
                      const eventToEdit = events.find(e => e.id === eventId);
                      if (eventToEdit) {
                        // Convert EventDetail to Event for editing
                        const apiEvent: Event = {
                          id: parseInt(eventToEdit.id),
                          club_id: parseInt(eventToEdit.club_id),
                          title: eventToEdit.title,
                          description: eventToEdit.description,
                          event_type: 'meeting', // Default, will be updated from form
                          start_date: eventToEdit.start_date,
                          end_date: eventToEdit.end_date,
                          location: eventToEdit.location.name,
                          max_capacity: eventToEdit.capacity?.max,
                          registration_deadline: undefined,
                          price_member: 0,
                          price_non_member: undefined,
                          is_active: true,
                          status: 'upcoming',
                          created_at: eventToEdit.created_at,
                          updated_at: eventToEdit.updated_at,
                          is_upcoming: eventToEdit.is_upcoming,
                          is_past: eventToEdit.is_past,
                          capacity: eventToEdit.capacity || { max: undefined, current: 0, waitlist: false },
                          rsvp_count: {
                            ...eventToEdit.rsvp_count,
                            not_responded: 0
                          },
                          program: eventToEdit.program,
                          clubs: undefined,
                          image_url: eventToEdit.image_url
                        };
                        setEditingEvent(apiEvent);
                      }
                    }}
                    onDelete={handleDeleteEvent}
                    showOwnerActions={isOwner}
                  />
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                <p className="text-muted-foreground">
                  Check back later for new events or create one if you&apos;re an admin.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastEvents.length > 0 ? (
            <div className="space-y-0">
              {sortedEvents.filter(event => event.is_past).map((event) => (
                  <EventCard
                    key={event.id}
                    event={transformToEventListItem(event)}
                    showRSVP={false}
                    onEdit={(eventId) => {
                      const eventToEdit = events.find(e => e.id === eventId);
                      if (eventToEdit) {
                        // Convert EventDetail to Event for editing
                        const apiEvent: Event = {
                          id: parseInt(eventToEdit.id),
                          club_id: parseInt(eventToEdit.club_id),
                          title: eventToEdit.title,
                          description: eventToEdit.description,
                          event_type: 'meeting', // Default, will be updated from form
                          start_date: eventToEdit.start_date,
                          end_date: eventToEdit.end_date,
                          location: eventToEdit.location.name,
                          max_capacity: eventToEdit.capacity?.max,
                          registration_deadline: undefined,
                          price_member: 0,
                          price_non_member: undefined,
                          is_active: true,
                          status: 'upcoming',
                          created_at: eventToEdit.created_at,
                          updated_at: eventToEdit.updated_at,
                          is_upcoming: eventToEdit.is_upcoming,
                          is_past: eventToEdit.is_past,
                          capacity: eventToEdit.capacity || { max: undefined, current: 0, waitlist: false },
                          rsvp_count: {
                            ...eventToEdit.rsvp_count,
                            not_responded: 0
                          },
                          program: eventToEdit.program,
                          clubs: undefined,
                          image_url: eventToEdit.image_url
                        };
                        setEditingEvent(apiEvent);
                      }
                    }}
                    onDelete={handleDeleteEvent}
                    showOwnerActions={isOwner}
                  />
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No past events</h3>
                <p className="text-muted-foreground">
                  Past events will appear here once they&apos;re completed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}