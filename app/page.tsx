"use client";

import { Newsfeed } from "@/components/newsfeed/newsfeed";
import { mockPosts } from "@/lib/data";
import { Toaster } from "@/components/ui/sonner";

export default function Page() {
  const currentUser = mockPosts[0];

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4">
          <Newsfeed initialPosts={mockPosts} currentUser={currentUser} />
        </div>
      </div>
      <Toaster />
    </>
  );
}
