import { Newsfeed } from "@/components/newsfeed/newsfeed";
import { mockPosts } from "@/lib/data"; // TODO(step1): replace mock with live Supabase query
import { Toaster } from "@/components/ui/sonner";

export default async function Page() {
  const currentUser = mockPosts[0].user;

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4 space-y-6">
          <Newsfeed initialPosts={mockPosts} currentUser={currentUser} />
        </div>
      </div>
      <Toaster />
    </>
  );
}
