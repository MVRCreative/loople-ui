import { Skeleton } from "@/components/ui/skeleton";

/**
 * EventCardSkeleton - Matches the right-sidebar event card layout
 */
export function EventCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * ProgramCardSkeleton - Matches the right-sidebar program card layout
 */
export function ProgramCardSkeleton() {
  return (
    <div className="p-3 rounded-xl bg-muted/50 space-y-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

/**
 * SidebarSectionSkeleton - Full section skeleton with title + cards
 */
export function SidebarSectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
