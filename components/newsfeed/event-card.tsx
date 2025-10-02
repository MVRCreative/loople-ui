import { MapPin, Clock } from "lucide-react";
import { Event } from "@/lib/types";
import Link from "next/link";
import { Button } from "../ui/button";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mt-3">
      <div className="flex items-center justify-between">
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
        <Link href={`/event/${event.id}`}>
          <Button variant="outline" size="sm">View event</Button>
        </Link>
      </div>
    </div>
  );
}
