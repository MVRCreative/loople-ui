"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Eye, EyeOff, Lock } from "lucide-react";
import { EventListItem } from "@/lib/events/types";
import { formatEventDateTime, formatEventLocation, getEventVisibilityText } from "@/lib/events/selectors";

interface EventCardProps {
  event: EventListItem;
  showRSVP?: boolean;
  onRSVP?: (eventId: string) => void;
  className?: string;
}

export function EventCard({ 
  event, 
  showRSVP = true, 
  onRSVP,
  className 
}: EventCardProps) {
  const handleRSVPClick = () => {
    onRSVP?.(event.id);
  };

  const handleAddToCalendar = () => {
    // TODO: Implement calendar integration
    console.log("Add to calendar:", event.id);
  };

  const getVisibilityIcon = () => {
    switch (event.visibility) {
      case "public":
        return <Eye className="h-3 w-3" />;
      case "members_only":
        return <EyeOff className="h-3 w-3" />;
      case "private":
        return <Lock className="h-3 w-3" />;
      default:
        return null;
    }
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

  const getVisibilityVariant = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "default";
      case "members_only":
        return "secondary";
      case "private":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className={`bg-card border-t border-l border-border p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${className}`}>
      {/* Event Header and Content */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-card-foreground">
                {event.title}
              </span>
              <Badge variant={getStatusVariant(event.status)} className="text-xs">
                {event.status}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatEventDateTime(event.start_date, event.end_date)}
            </span>
          </div>
          
          {/* Event Image */}
          {event.image_url && (
            <div className="mb-3">
              <img 
                src={event.image_url} 
                alt={event.title}
                className="w-full h-48 object-cover rounded-md"
              />
            </div>
          )}
          
          {/* Event Details */}
          <div className="space-y-2 mb-3">
            {/* Date and Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">
                {formatEventDateTime(event.start_date, event.end_date)}
              </span>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">
                {formatEventLocation(event.location)}
              </span>
            </div>
            
            {/* Visibility and Program */}
            <div className="flex items-center gap-2">
              <Badge variant={getVisibilityVariant(event.visibility)} className="text-xs">
                {getVisibilityIcon()}
                <span className="ml-1">{getEventVisibilityText(event.visibility)}</span>
              </Badge>
              {event.program_name && (
                <Badge variant="outline" className="text-xs">
                  {event.program_name}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Event Actions */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-6">
              <button
                onClick={handleAddToCalendar}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                <span>Add to Calendar</span>
              </button>
              
              {showRSVP && (
                <button
                  onClick={handleRSVPClick}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>RSVP</span>
                </button>
              )}
            </div>
            
            <button
              onClick={() => window.location.href = `/event/${event.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1 transition-colors"
            >
              <span>View Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
