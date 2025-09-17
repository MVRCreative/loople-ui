"use client";

import { Newsfeed } from "@/components/newsfeed/newsfeed";
import { mockPosts } from "@/lib/data";
import { Toaster } from "@/components/ui/sonner";
import { User } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";

export default function Page() {
  const { user: authUser, isAuthenticated } = useAuth();

  // Convert auth user to frontend User type, or create guest user
  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8">
          <Newsfeed 
            initialPosts={[]} 
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
      <Toaster />
    </>
  );
}
