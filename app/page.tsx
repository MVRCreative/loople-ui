import { Newsfeed } from "@/components/newsfeed/newsfeed";
import { Toaster } from "@/components/ui/sonner";
import { User } from "@/lib/types";

export default function Page() {
  // Create a default user for the newsfeed
  const currentUser: User = {
    id: "default",
    name: "Current User",
    role: "Member",
    avatar: "U",
    isAdmin: false,
  };

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4 space-y-6">
          <Newsfeed initialPosts={[]} currentUser={currentUser} />
        </div>
      </div>
      <Toaster />
    </>
  );
}
