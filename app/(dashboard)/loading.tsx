import { PostCardSkeletonList } from "@/components/newsfeed/post-card-skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          <div className="h-5 w-16 bg-accent animate-pulse rounded" />
        </div>
      </div>
      <PostCardSkeletonList count={6} />
    </div>
  );
}
