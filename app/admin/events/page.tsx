"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventMeta } from "@/components/events/EventMeta";
import { useEvents } from "@/lib/events/hooks";
import { formatEventDateTime, formatEventLocation, getEventStatusText } from "@/lib/events/selectors";
import { Search, Plus, Eye, Edit, BarChart3, Filter, Calendar, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";

export default function AdminEventsPage() {
  const router = useRouter();
  const { events, loading, error, loadEvents } = useEvents();
  const { user: authUser, isAuthenticated } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Convert auth user to frontend User type
  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  // Check if user is admin
  const isAdmin = currentUser.isAdmin;

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Filter events based on search and status
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
    
    // Apply status filter
    if (selectedStatus !== "all" && event.status !== selectedStatus) {
      return false;
    }
    
    return true;
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleCreateEvent = () => {
    router.push("/admin/events/create");
  };

  const handleViewEvent = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const handleEditEvent = (eventId: string) => {
    router.push(`/admin/events/edit-${eventId}`);
  };

  const handleEventDetails = (eventId: string) => {
    router.push(`/admin/event/${eventId}-details`);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default";
      case "draft":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "default";
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Event Management</h1>
            <p className="text-muted-foreground">
              Manage and monitor all club events
            </p>
          </div>
          
          <Button onClick={handleCreateEvent}>
            <Plus className="h-4 w-4 mr-1" />
            New Event
          </Button>
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
              value={selectedStatus}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("all");
              }}
              className="px-3"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>RSVPs</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{event.title}</div>
                          <EventMeta 
                            event={event} 
                            showCapacity={false} 
                            showProgram={true}
                            className="text-xs"
                          />
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {formatEventDateTime(event.start_date, event.end_date)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatEventLocation(event.location)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={getStatusVariant(event.status)}>
                          {getEventStatusText(event.status)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.rsvp_count.going} going
                          </div>
                          {event.rsvp_count.maybe > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {event.rsvp_count.maybe} maybe
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewEvent(event.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEvent(event.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEventDetails(event.id)}
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedStatus !== "all" 
                  ? "Try adjusting your search or filters."
                  : "Create your first event to get started."
                }
              </p>
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-1" />
                Create Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {events.filter(e => e.status === "published").length}
              </div>
              <div className="text-sm text-muted-foreground">Published</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {events.filter(e => e.status === "draft").length}
              </div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {events.reduce((sum, event) => sum + event.rsvp_count.going, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total RSVPs</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {events.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}