"use client";

import { Badge } from "@/components/ui/badge";
import { EventDetail, EventListItem } from "@/lib/events/types";
import { getEventStatusText, getEventVisibilityText } from "@/lib/events/selectors";
import { Eye, EyeOff, Lock, Users, Clock } from "lucide-react";

interface EventMetaProps {
  event: EventDetail | EventListItem;
  showCapacity?: boolean;
  showProgram?: boolean;
  className?: string;
}

export function EventMeta({ 
  event, 
  showCapacity = false, 
  showProgram = false,
  className 
}: EventMetaProps) {
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

  const getCapacityVariant = () => {
    if (!("capacity" in event) || !event.capacity) return "outline";
    
    const { current, max } = event.capacity;
    const percentage = max ? (current / max) * 100 : 0;
    
    if (percentage >= 100) return "destructive";
    if (percentage >= 80) return "secondary";
    return "default";
  };

  const getTimeVariant = () => {
    if (event.is_past) return "outline";
    if (event.is_upcoming) return "default";
    return "secondary";
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Status Badge */}
      <Badge variant={getStatusVariant(event.status)} className="text-xs">
        {getEventStatusText(event.status)}
      </Badge>
      
      {/* Visibility Badge */}
      <Badge variant={getVisibilityVariant(event.visibility)} className="text-xs">
        {getVisibilityIcon()}
        <span className="ml-1">{getEventVisibilityText(event.visibility)}</span>
      </Badge>
      
      {/* Time Status Badge */}
      <Badge variant={getTimeVariant()} className="text-xs">
        <Clock className="h-3 w-3 mr-1" />
        {event.is_past ? "Past" : event.is_upcoming ? "Upcoming" : "Now"}
      </Badge>
      
      {/* Capacity Badge */}
      {showCapacity && "capacity" in event && event.capacity && (
        <Badge variant={getCapacityVariant()} className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          {event.capacity.current}/{event.capacity.max}
          {event.capacity.waitlist && " (Waitlist)"}
        </Badge>
      )}
      
      {/* Program Badge */}
      {showProgram && "program" in event && event.program && (
        <Badge variant="outline" className="text-xs">
          {event.program.name}
        </Badge>
      )}
      
      {/* RSVP Count Badge */}
      {event.rsvp_count.total > 0 && (
        <Badge variant="outline" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          {event.rsvp_count.going} going
          {event.rsvp_count.maybe > 0 && `, ${event.rsvp_count.maybe} maybe`}
        </Badge>
      )}
    </div>
  );
}
