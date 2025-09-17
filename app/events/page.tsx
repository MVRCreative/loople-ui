"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/events/EventCard";
import { useEvents } from "@/lib/events/hooks";
import { getUpcomingEventListItems, getPastEventListItems } from "@/lib/mocks/events";
import { Search, Filter, Calendar } from "lucide-react";

export default function EventsPage() {
  const { events, loading, error, loadEvents } = useEvents();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("all");

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Filter events based on current filters and search
  const filteredEvents = events.filter(event => {
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
    
    // Apply tab filter
    if (selectedTab === "upcoming" && !event.is_upcoming) return false;
    if (selectedTab === "past" && !event.is_past) return false;
    
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

  // Get upcoming and past events for tabs
  const upcomingEvents = getUpcomingEventListItems();
  const pastEvents = getPastEventListItems();

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
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground">
            Discover and join upcoming events in your club
          </p>
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
          {sortedEvents.filter(event => event.is_upcoming).length > 0 ? (
            <div className="space-y-0">
              {sortedEvents
                .filter(event => event.is_upcoming)
                .map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRSVP={handleRSVP}
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
          {sortedEvents.filter(event => event.is_past).length > 0 ? (
            <div className="space-y-0">
              {sortedEvents
                .filter(event => event.is_past)
                .map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    showRSVP={false}
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
  );
}