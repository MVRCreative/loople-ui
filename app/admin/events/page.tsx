"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/lib/events/hooks";
import { formatEventDateTime, formatEventLocation, getEventStatusText } from "@/lib/events/selectors";
import { Search, Plus, Eye, BarChart3, Filter, Calendar, Users, Edit } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";

export default function AdminEventsPage() {
  const router = useRouter();
  const { events, loading, error, loadEvents } = useEvents();
  const { user: authUser } = useAuth();
  const { selectedClub, loading: clubLoading } = useClub();
  
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
    router.push(`/admin/events/${eventId}/edit`);
  };

  const handleEventDetails = (eventId: string) => {
    router.push(`/admin/events/${eventId}`);
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

  if (!selectedClub) {
    return (
      <div className="flex-1 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Event Management</h1>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select or create a club to manage events</h3>
            <p className="text-muted-foreground mb-6">
              Choose a club from the switcher or create your first club to create and manage events.
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
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

      {/* Events Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Events ({filteredEvents.length})
          </h2>
        </div>
        
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Event Image/Banner */}
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/40 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                      onClick={() => handleViewEvent(event.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <Badge variant={getStatusVariant(event.status)} className="mb-2">
                      {getEventStatusText(event.status)}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  {/* Event Title */}
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  
                  {/* Date & Time */}
                  <div className="text-sm text-muted-foreground mb-2">
                    {formatEventDateTime(event.start_date, event.end_date)}
                  </div>
                  
                  {/* Location */}
                  <div className="text-sm text-muted-foreground mb-4">
                    {formatEventLocation(event.location)}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditEvent(event.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEventDetails(event.id)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      </div>

    </div>
  );
}