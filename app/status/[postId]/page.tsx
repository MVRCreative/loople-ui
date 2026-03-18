"use client";

import { useParams } from "next/navigation";
import { PostDetailClient } from "@/components/newsfeed/post-detail-client";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import type { User } from "@/lib/types";

export default function PostStatusPage() {
  const params = useParams();
  const postId =
    typeof params?.postId === "string"
      ? params.postId
      : Array.isArray(params?.postId)
        ? params.postId[0] ?? ""
        : "";

  const { user: authUser, isAuthenticated } = useAuth();
  const currentUser: User = authUser
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  return (
    <div className="flex-1 min-h-screen">
      <PostDetailClient
        postId={postId}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
