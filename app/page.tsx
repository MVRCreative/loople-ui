import { Newsfeed } from "@/components/newsfeed/newsfeed";
import { mockPosts } from "@/lib/data";
import { Toaster } from "@/components/ui/sonner";

export default function Page() {
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
