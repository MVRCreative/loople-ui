"use client";

import { Newsfeed } from "@/components/newsfeed/newsfeed";
import { Toaster } from "@/components/ui/sonner";
import { User } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";

export default function Page() {
  const { user: authUser, isAuthenticated } = useAuth();
  // #region agent log
  if (typeof fetch !== "undefined") fetch("http://127.0.0.1:7242/ingest/fa342421-bbc3-4297-9f03-9cfbd6477dbe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location:"app/page.tsx:render",message:"Root page render",data:{isAuthenticated:!!isAuthenticated,hasUser:!!authUser},timestamp:Date.now(),hypothesisId:"B"})}).catch(()=>{});
  // #endregion

  // Convert auth user to frontend User type, or create guest user
  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="pt-6">
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
