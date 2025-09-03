import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const handleAddToCalendar = () => {
    // TODO: Implement calendar integration
    console.log("Add to calendar:", event);
  };

  const handleRSVP = () => {
    // TODO: Implement RSVP functionality
    console.log("RSVP for event:", event);
  };

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mt-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-card-foreground text-base mb-1">
            {event.title}
          </h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{event.date} {event.time}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToCalendar}
            className="h-8 px-3 text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Add to Calendar
          </Button>
          <Button
            size="sm"
            onClick={handleRSVP}
            className="h-8 px-3 text-xs"
          >
            RSVP
          </Button>
        </div>
      </div>
    </div>
  );
}
