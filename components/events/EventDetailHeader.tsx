"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Users, Eye, EyeOff, Lock, Share2 } from "lucide-react";
import { EventDetail } from "@/lib/events/types";
import { 
  formatEventDateTime, 
  formatEventLocation, 
  getEventStatusText, 
  getEventVisibilityText,
  isEventAtCapacity,
  hasWaitlist,
  getAvailableSpots
} from "@/lib/events/selectors";

interface EventDetailHeaderProps {
  event: EventDetail;
  onShare?: () => void;
  className?: string;
}

export function EventDetailHeader({ 
  event, 
  onShare,
  className 
}: EventDetailHeaderProps) {
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getVisibilityIcon = () => {
    switch (event.visibility) {
      case "public":
        return <Eye className="h-4 w-4" />;
      case "members_only":
        return <EyeOff className="h-4 w-4" />;
      case "private":
        return <Lock className="h-4 w-4" />;
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

  const isAtCapacity = isEventAtCapacity(event);
  const hasWaitlistEnabled = hasWaitlist(event);
  const availableSpots = getAvailableSpots(event);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-card-foreground mb-3">
              {event.title}
            </h1>
            
            {/* Status and Visibility Badges */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={getStatusVariant(event.status)} className="text-sm">
                {getEventStatusText(event.status)}
              </Badge>
              <Badge variant={getVisibilityVariant(event.visibility)} className="text-sm">
                {getVisibilityIcon()}
                <span className="ml-1">{getEventVisibilityText(event.visibility)}</span>
              </Badge>
              {event.program && (
                <Badge variant="outline" className="text-sm">
                  {event.program.name}
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="ml-4"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-card-foreground mb-1">Date & Time</h3>
              <p className="text-sm text-muted-foreground">
                {formatEventDateTime(event.start_date, event.end_date)}
              </p>
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-card-foreground mb-1">Location</h3>
              <p className="text-sm text-muted-foreground">
                {formatEventLocation(event.location)}
              </p>
            </div>
          </div>
          
          {/* Capacity */}
          {event.capacity && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-card-foreground mb-1">Capacity</h3>
                <p className="text-sm text-muted-foreground">
                  {event.capacity.current} of {event.capacity.max} spots filled
                  {availableSpots !== null && (
                    <span className={isAtCapacity ? "text-destructive" : "text-green-600"}>
                      {" "}({availableSpots} available)
                    </span>
                  )}
                  {hasWaitlistEnabled && isAtCapacity && (
                    <span className="text-orange-600"> - Waitlist available</span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          {/* Program */}
          {event.program && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-card-foreground mb-1">Program</h3>
                <p className="text-sm text-muted-foreground">
                  {event.program.name}
                  {event.program.description && (
                    <span className="block mt-1">{event.program.description}</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Description */}
        {event.description && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="font-medium text-card-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
