import { Skeleton } from "@/components/ui/skeleton";

/**
 * PostCardSkeleton - Content-shaped loading placeholder matching PostCard layout
 *
 * Purpose: Shows a shimmer placeholder that matches the real PostCard dimensions
 * so the feed feels instant even while data loads. Use 3-5 stacked for a feed.
 *
 * Usage:
 * ```tsx
 * {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
 * ```
 */

export function PostCardSkeleton() {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />

        <div className="flex-1 space-y-2.5">
          {/* Name row */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-10" />
          </div>

          {/* Badge */}
          <Skeleton className="h-5 w-16 rounded-full" />

          {/* Content lines */}
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Action bar */}
          <div className="flex gap-6 pt-1">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PostCardSkeletonList - Pre-built list of skeleton cards for feed loading
 */
export function PostCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
