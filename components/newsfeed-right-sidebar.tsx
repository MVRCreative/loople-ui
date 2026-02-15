"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchCommand } from "@/components/search/search-command"
import { useEvents, usePrograms } from "@/lib/events/hooks"
import { useClub } from "@/lib/club-context"
import { EventCardSkeleton, ProgramCardSkeleton } from "@/components/newsfeed/sidebar-skeleton"

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
    return events
      .filter(e => {
        const endDate = new Date(e.end_date)
        return endDate >= now
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 4)
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
    <div className="w-full bg-background border-l border-border p-4 sticky top-0 h-screen flex flex-col">
      {/* Search */}
      <div className="mb-6">
        <SearchCommand />
      </div>

      {/* Split area: Upcoming Events + Your Programs each 50% height */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Upcoming Events */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col min-h-0 flex-1">
          <h3 className="font-semibold text-base mb-3 text-foreground flex-shrink-0">Upcoming Events</h3>

          {loading && (
            <div className="space-y-3">
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          )}

          {error && !loading && (
            <div className="text-sm text-destructive">Failed to load events</div>
          )}

          {!loading && !error && (
            <>
              <div className="space-y-2 overflow-y-auto flex-1">
                {upcoming.length > 0 ? upcoming.map((e) => (
                  <Link
                    key={e.id}
                    href={`/event/${e.id}`}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-accent transition-colors duration-150 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground group-hover:text-accent-foreground">{formatDay(e.start_date)}: {e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.program?.name || e.location.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(e.start_date)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                  </Link>
                )) : (
                  <div className="text-sm text-muted-foreground py-2">No upcoming events</div>
                )}
              </div>
              <div className="pt-3 flex-shrink-0">
                <Button
                  variant="ghost"
                  className="p-0 h-auto text-primary hover:text-primary/80 text-sm font-medium hover:bg-transparent"
                  onClick={() => router.push('/events')}
                >
                  View Calendar
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Your Programs */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col min-h-0 flex-1">
          <h3 className="font-semibold text-base mb-3 text-foreground flex-shrink-0">Your Programs</h3>
          <div className="space-y-2 overflow-y-auto flex-1">
            {programsLoading && (
              <div className="space-y-3">
                <ProgramCardSkeleton />
                <ProgramCardSkeleton />
              </div>
            )}
            {showProgramsEmptyNoClub && (
              <div className="text-sm text-muted-foreground py-2">
                Join a club to see your programs.
              </div>
            )}
            {showProgramsEmptyWithClub && (
              <div className="text-sm text-muted-foreground py-2">
                No programs yet. Programs will appear when your club adds events.
              </div>
            )}
            {showProgramsList && programs.map((program) => (
              <Link
                key={program.id}
                href={`/programs?programId=${encodeURIComponent(program.id)}`}
                className="block p-3 rounded-xl bg-muted/50 hover:bg-accent transition-colors duration-150 group"
              >
                <div className="mb-1">
                  <p className="font-medium text-sm text-foreground group-hover:text-accent-foreground">{program.name}</p>
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
              className="p-0 h-auto text-primary hover:text-primary/80 text-sm font-medium hover:bg-transparent"
              onClick={() => router.push('/programs')}
            >
              View All Programs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
