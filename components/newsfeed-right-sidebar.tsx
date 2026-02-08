"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useEvents, usePrograms } from "@/lib/events/hooks"
import { useClub } from "@/lib/club-context"

export function NewsfeedRightSidebar() {
  const router = useRouter()
  const { events, loading, error, loadEvents } = useEvents()
  const { programs, loading: clubLoading } = usePrograms(events)
  const { clubs } = useClub()

  const programsLoading = loading || clubLoading

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const upcoming = useMemo(() => {
    const now = new Date()
    console.log('Filtering events, total count:', events.length, 'events:', events)
    const filtered = events
      .filter(e => {
        // Use end date to determine past vs upcoming/ongoing
        const endDate = new Date(e.end_date)
        const isUpcoming = endDate >= now
        console.log('Event:', e.title, 'end_date:', e.end_date, 'endDate:', endDate, 'now:', now, 'isUpcoming:', isUpcoming)
        return isUpcoming
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 4)
    console.log('Filtered upcoming events:', filtered)
    return filtered
  }, [events])

  const formatDay = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { weekday: 'long' })
    } catch {
      return ''
    }
  }

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const formatNextEvent = (startDate: string, title: string) => {
    try {
      const d = new Date(startDate)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const isToday = d.toDateString() === today.toDateString()
      const isTomorrow = d.toDateString() === tomorrow.toDateString()
      if (isToday) return `${title} - Today`
      if (isTomorrow) return `${title} - Tomorrow`
      return `${title} - ${d.toLocaleDateString(undefined, { weekday: 'short' })}`
    } catch {
      return title
    }
  }

  const hasClub = clubs.length > 0 && !clubLoading
  const showProgramsEmptyNoClub = !clubLoading && clubs.length === 0
  const showProgramsEmptyWithClub = hasClub && !programsLoading && programs.length === 0
  const showProgramsList = hasClub && programs.length > 0

  return (
    <div className="w-full bg-background border-l border-border p-4 sticky top-0 h-screen flex flex-col" suppressHydrationWarning>
      {/* Search */}
      <div className="mb-6">
        <div className="relative" suppressHydrationWarning>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 bg-muted border-border rounded-full h-10 text-sm"
            suppressHydrationWarning
          />
        </div>
      </div>

      {/* Split area: Upcoming Events + Your Programs each 50% height */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Upcoming Events (real data) */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col min-h-0 flex-1">
          <h3 className="font-semibold text-lg mb-3 text-foreground flex-shrink-0">Upcoming Events</h3>
          {loading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
          {error && !loading && (
            <div className="text-sm text-destructive">Failed to load events</div>
          )}
          {!loading && !error && (
            <>
              <div className="space-y-3 overflow-y-auto flex-1">
                {upcoming.length > 0 ? upcoming.map((e) => (
                  <Link key={e.id} href={`/event/${e.id}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted hover:bg-accent transition-colors duration-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{formatDay(e.start_date)}: {e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.program?.name || e.location.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(e.start_date)}
                      </p>
                    </div>
                  </Link>
                )) : (
                  <div className="text-sm text-muted-foreground">No upcoming events</div>
                )}
              </div>
              <div className="pt-3 flex-shrink-0">
                <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80 text-sm font-medium" onClick={() => router.push('/events')} suppressHydrationWarning>
                  View Calendar
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Your Programs */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col min-h-0 flex-1">
          <h3 className="font-semibold text-lg mb-3 text-foreground flex-shrink-0">Your Programs</h3>
          <div className="space-y-3 overflow-y-auto flex-1">
            {programsLoading && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
            {showProgramsEmptyNoClub && (
              <div className="text-sm text-muted-foreground">
                Join a club to see your programs.
              </div>
            )}
            {showProgramsEmptyWithClub && (
              <div className="text-sm text-muted-foreground">
                No programs yet. Programs will appear when your club adds events.
              </div>
            )}
            {showProgramsList && programs.map((program) => (
              <Link
                key={program.id}
                href={`/programs?programId=${encodeURIComponent(program.id)}`}
                className="block p-3 rounded-lg bg-muted hover:bg-accent transition-colors duration-200"
              >
                <div className="mb-1">
                  <p className="font-medium text-sm text-foreground">{program.name}</p>
                </div>
                {program.nextEvent ? (
                  <p className="text-xs text-muted-foreground">
                    Next: {formatNextEvent(program.nextEvent.start_date, program.nextEvent.title)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No upcoming events</p>
                )}
              </Link>
            ))}
          </div>
          <div className="pt-3 flex-shrink-0">
            <Button
              variant="ghost"
              className="p-0 h-auto text-primary hover:text-primary/80 text-sm font-medium"
              onClick={() => router.push('/programs')}
              suppressHydrationWarning
            >
              View All Programs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
