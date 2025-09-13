"use client"

import { Search, Calendar, Users, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const upcomingEvents = [
  {
    day: "Wednesday",
    event: "Team Practice",
    program: "Competitive Swim Team",
    time: "2:00 AM"
  },
  {
    day: "Thursday", 
    event: "Technique Workshop",
    program: "Adult Fitness Swimming",
    time: "3:00 PM"
  },
  {
    day: "Saturday",
    event: "Scrimmage Game", 
    program: "Water Polo Introduction",
    time: "6:00 AM"
  }
]

const userPrograms = [
  {
    name: "Competitive Swim Team",
    coach: "Sarah Johnson",
    next: "Team Practice - Tomorrow"
  },
  {
    name: "Adult Fitness Swimming", 
    coach: "Michael Torres",
    next: "Team Practice - Tomorrow"
  },
  {
    name: "Water Polo Introduction",
    coach: "Alex Rivera", 
    next: "Team Practice - Tomorrow"
  }
]

export function NewsfeedRightSidebar() {
  return (
    <div className="w-[350px] border-l border-border bg-background p-6 sticky top-0 h-screen overflow-y-auto">
      {/* Search */}
      <div className="mb-6">
        <div className="relative" suppressHydrationWarning>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10"
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mb-8 rounded-lg border border-border bg-background p-4">
        <h3 className="font-semibold text-lg mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-3 p-3">
              <div className="flex-shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{event.day}: {event.event}</p>
                <p className="text-xs text-muted-foreground">{event.program}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="link" className="p-0 h-auto mt-3">
          View Calendar
        </Button>
      </div>

      <Separator className="my-6" />

      {/* Your Programs */}
      <div className="rounded-lg border border-border bg-background p-4">
        <h3 className="font-semibold text-lg mb-4">Your Programs</h3>
        <div className="space-y-3">
          {userPrograms.map((program, index) => (
            <div key={index} className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-sm">{program.name}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Coach: {program.coach}</p>
              <p className="text-xs text-muted-foreground">Next: {program.next}</p>
            </div>
          ))}
        </div>
        <Button variant="link" className="p-0 h-auto mt-3">
          View All Programs
        </Button>
      </div>
    </div>
  )
}
