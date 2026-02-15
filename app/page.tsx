"use client";

import { Newsfeed } from "@/components/newsfeed/newsfeed";
import { Toaster } from "@/components/ui/sonner";
import { User } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";

export default function Page() {
  const { user: authUser, isAuthenticated } = useAuth();

  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  return (
    <>
      <div className="flex flex-1 flex-col">
        {/* Sticky feed header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
          <h1 className="px-4 py-3 text-lg font-semibold text-foreground">Home</h1>
        </div>

        <Newsfeed 
          initialPosts={[]} 
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
        />
      </div>
      <Toaster />
    </>
  );
}
