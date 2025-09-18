"use client"

import NextImage from "next/image"
import { Clock, MapPin, Users, Calendar } from "lucide-react"
import { EventDetail } from "@/lib/events/types"
import { 
  formatEventDateTime, 
  formatEventLocation,
  isEventAtCapacity,
  hasWaitlist,
  getAvailableSpots
} from "@/lib/events/selectors"

interface EventHeaderProps {
  event: EventDetail
}

export function EventHeader({ 
  event
}: EventHeaderProps) {

  const isAtCapacity = isEventAtCapacity(event);
  const hasWaitlistEnabled = hasWaitlist(event);
  const availableSpots = getAvailableSpots(event);

  // Mock background image - in real app this would come from event data
  const backgroundImage = 'https://images.unsplash.com/photo-1444628838545-ac4016a5418a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';

  return (
    <div className="w-full">
      {/* Cover Image with Title Overlay */}
      <div className="relative h-32 w-full lg:h-48">
        <NextImage 
          alt="" 
          src={backgroundImage} 
          width={1200}
          height={192}
          className="h-full w-full object-cover" 
        />
        
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Event Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
            {event.title}
          </h1>
        </div>
      </div>
      
      {/* Event Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Event Details */}
        <div className="mt-6 space-y-4">
          {/* Date, Time, Location */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground mb-1">Date & Time</h3>
                <p className="text-sm text-muted-foreground">
                  {formatEventDateTime(event.start_date, event.end_date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground mb-1">Location</h3>
                <p className="text-sm text-muted-foreground">
                  {formatEventLocation(event.location)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Capacity and Program */}
          <div className="grid gap-4 md:grid-cols-2">
            {event.capacity && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground mb-1">Capacity</h3>
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
            
            {event.program && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground mb-1">Program</h3>
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
            <div className="pt-4 border-t border-border">
              <h3 className="font-medium text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
