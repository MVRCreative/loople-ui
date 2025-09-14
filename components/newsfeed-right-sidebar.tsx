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
    <div className="w-[360px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 sticky top-0 h-screen overflow-y-auto">
      {/* Search */}
      <div className="mb-6">
        <div className="relative" suppressHydrationWarning>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-10 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-full h-10 text-sm"
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
              <div className="flex-shrink-0">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{event.day}: {event.event}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{event.program}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="p-0 h-auto mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
          View Calendar
        </Button>
      </div>

      <Separator className="my-6" />

      {/* Your Programs */}
      <div>
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Your Programs</h3>
        <div className="space-y-3">
          {userPrograms.map((program, index) => (
            <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="font-medium text-sm text-gray-900 dark:text-white">{program.name}</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">Coach: {program.coach}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Next: {program.next}</p>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="p-0 h-auto mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
          View All Programs
        </Button>
      </div>
    </div>
  )
}
