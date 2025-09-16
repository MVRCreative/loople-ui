"use client";

import { Newsfeed } from "@/components/newsfeed/newsfeed";
import { mockPosts } from "@/lib/data";
import { Toaster } from "@/components/ui/sonner";

import { User } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";

export default function Page() {
  const { user: authUser, isAuthenticated } = useAuth();

  // Convert auth user to frontend User type, or create a guest user fallback
  const currentUser: User = authUser
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  // Use real feed when you wire it up; mock while unauthenticated
  const initialPosts = isAuthenticated ? [] : mockPosts;

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="p-4 space-y-6">
          <Newsfeed
            initialPosts={initialPosts}
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
      <Toaster />
    </>
  );
}
