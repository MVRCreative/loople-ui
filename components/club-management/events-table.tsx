"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Event } from "@/lib/services/events.service";

interface EventsTableProps {
  events: Event[];
  onEditEvent?: (event: Event) => void;
  onDeleteEvent?: (event: Event) => Promise<void> | void;
  onViewRegistrations?: (event: Event) => void;
  onCreateEvent?: () => void;
  readOnly?: boolean;
}

export function EventsTable({ events, onEditEvent, onDeleteEvent, onViewRegistrations, onCreateEvent, readOnly }: EventsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case "competition":
        return <Badge variant="default" className="bg-red-500">Competition</Badge>;
      case "practice":
        return <Badge variant="secondary">Practice</Badge>;
      case "meeting":
        return <Badge variant="outline">Meeting</Badge>;
      case "social":
        return <Badge variant="outline">Social</Badge>;
      default:
        return <Badge variant="outline">{eventType}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="default" className="bg-blue-500">Upcoming</Badge>;
      case "ongoing":
        return <Badge variant="default" className="bg-green-500">Ongoing</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 lg:h-4 lg:w-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 lg:pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="text-xs lg:text-sm"
            onClick={() => {
              // Simple CSV export
              const headers = [
                'Title','Type','Start Date','End Date','Location','Capacity','Price Member','Price Non-Member','Status','Registered'
              ];
              const rows = filteredEvents.map(e => [
                e.title,
                e.event_type,
                e.start_date,
                e.end_date,
                e.location,
                e.max_capacity ?? '',
                e.price_member ?? 0,
                e.price_non_member ?? '',
                e.status,
                e.rsvp_count.going
              ]);
              const csv = [headers, ...rows].map(r => r.map(v => `${String(v).replace(/"/g, '""')}`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'events.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export
          </Button>
          {!readOnly && (
            <Button size="sm" className="text-xs lg:text-sm" onClick={onCreateEvent}>
              Create Event
            </Button>
          )}
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs lg:text-sm min-w-[200px]">Event</TableHead>
              <TableHead className="text-xs lg:text-sm min-w-[100px]">Type</TableHead>
              <TableHead className="text-xs lg:text-sm min-w-[140px]">Date & Time</TableHead>
              <TableHead className="text-xs lg:text-sm min-w-[150px]">Location</TableHead>
              <TableHead className="text-xs lg:text-sm min-w-[100px]">Capacity</TableHead>
              <TableHead className="text-xs lg:text-sm min-w-[120px]">Price</TableHead>
              <TableHead className="text-xs lg:text-sm min-w-[100px]">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="min-w-0">
                    <div className="font-medium text-sm lg:text-base truncate">{event.title}</div>
                    <div className="text-xs lg:text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs lg:text-sm">
                    {getEventTypeBadge(event.event_type)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-xs lg:text-sm">
                    <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="truncate">{formatDate(event.start_date)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-xs lg:text-sm">
                    <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="truncate">{event.location || 'No location'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-xs lg:text-sm">
                    <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="truncate">
                      {event.rsvp_count.going}
                      {event.max_capacity && ` / ${event.max_capacity}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-xs lg:text-sm">
                    <DollarSign className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="truncate">
                      {event.price_member === 0 ? 'Free' : `$${event.price_member}`}
                      {event.price_non_member && event.price_non_member !== event.price_member && (
                        <span className="text-muted-foreground ml-1">
                          / ${event.price_non_member}
                        </span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs lg:text-sm">
                    {getStatusBadge(event.status)}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewRegistrations && onViewRegistrations(event)}>
                        <Users className="h-4 w-4 mr-2" />
                        View Registrations
                      </DropdownMenuItem>
                      {!readOnly && (
                        <>
                          <DropdownMenuItem onClick={() => onEditEvent && onEditEvent(event)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => onDeleteEvent && onDeleteEvent(event)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No events found matching your search.</p>
        </div>
      )}
    </div>
  );
}
