"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/newsfeed/post-card";
import { CommentsSection } from "@/components/newsfeed/comments-section";
import type { Post, User } from "@/lib/types";
import { postsService } from "@/lib/services/posts.service";
import { readCachedPostForDetail } from "@/lib/utils/post-detail-cache";

interface PostDetailClientProps {
  postId: string;
  currentUser: User;
  isAuthenticated: boolean;
}

export function PostDetailClient({
  postId,
  currentUser,
  isAuthenticated,
}: PostDetailClientProps) {
  const numericId = Number.parseInt(postId, 10);
  const validId = Number.isFinite(numericId) && numericId > 0;

  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [staleRefreshFailed, setStaleRefreshFailed] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [commentsKey, setCommentsKey] = useState(0);

  const runRefetch = useCallback(async () => {
    if (!validId) return;
    setRefetching(true);
    setStaleRefreshFailed(false);
    try {
      const [postRes] = await Promise.all([
        postsService.getPostById(numericId),
        // Comments remount via commentsKey after post success
      ]);
      if (postRes.success && postRes.data) {
        setPost(postRes.data);
        setStaleRefreshFailed(false);
        setNotFound(false);
        setCommentsKey((k) => k + 1);
      } else {
        const cached = readCachedPostForDetail(postId);
        if (cached) {
          setPost(cached);
          setStaleRefreshFailed(true);
        } else {
          setPost(null);
          setNotFound(true);
        }
      }
    } finally {
      setRefetching(false);
    }
  }, [numericId, postId, validId]);

  useEffect(() => {
    if (!validId) {
      setNotFound(true);
      return;
    }

    const cached = readCachedPostForDetail(postId);
    if (cached) {
      setPost(cached);
      setNotFound(false);
    }

    let cancelled = false;
    (async () => {
      const res = await postsService.getPostById(numericId);
      if (cancelled) return;
      if (res.success && res.data) {
        setPost(res.data);
        setStaleRefreshFailed(false);
        setNotFound(false);
      } else {
        const c = cached ?? readCachedPostForDetail(postId);
        if (c) {
          setPost(c);
          setStaleRefreshFailed(true);
          setNotFound(false);
        } else {
          setPost(null);
          setNotFound(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [numericId, postId, validId]);

  if (!validId) {
    return (
      <div className="px-4 py-12 text-center text-muted-foreground">
        <p className="text-foreground font-medium">Invalid post</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  if (notFound && !post) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-lg font-semibold text-foreground">Post not found</p>
        <p className="text-sm text-muted-foreground mt-1">
          This post may have been removed or you don&apos;t have access.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-4 py-10 space-y-4">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button variant="ghost" size="sm" asChild className="shrink-0 -ml-1">
          <Link href="/" aria-label="Back to feed">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Feed
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={refetching}
          onClick={() => void runRefetch()}
          aria-label="Refresh post and comments"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${refetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {staleRefreshFailed && (
        <div
          role="status"
          className="mx-4 mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-sm"
        >
          <p className="font-medium text-foreground">Saved copy</p>
          <div className="mt-1 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Couldn&apos;t refresh from the server. Showing what you had open.</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 w-full sm:w-auto"
              disabled={refetching}
              onClick={() => void runRefetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      <div className="border-b border-border">
        <PostCard
          post={post}
          currentUser={currentUser}
          onReaction={async (id) => {
            const prev = post;
            const wasLiked = Boolean(post.isLiked);
            setPost((p) => {
              if (!p || p.id !== id) return p;
              const n = typeof p.reactions === "number" ? p.reactions : 0;
              return {
                ...p,
                isLiked: !wasLiked,
                reactions: wasLiked ? Math.max(0, n - 1) : n + 1,
              };
            });
            try {
              if (wasLiked) {
                const r = await postsService.deleteReaction(numericId);
                if (!r.success) throw new Error(r.error);
              } else {
                const r = await postsService.createReaction(numericId, {
                  reaction_type: "like",
                });
                if (!r.success) throw new Error(r.error);
              }
            } catch {
              setPost(prev);
            }
          }}
          onComment={() => {
            document
              .getElementById("post-detail-comments")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onShare={(id) => {
            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/status/${id}`;
            if (navigator.share) {
              void navigator.share({ title: "Post", url });
            } else {
              void navigator.clipboard.writeText(url);
            }
          }}
          onPostUpdate={(p) => setPost(p)}
          onPostDelete={() => {
            setPost(null);
            setNotFound(true);
            setStaleRefreshFailed(false);
          }}
          detailMode
        />
      </div>

      {isAuthenticated && (
        <div
          id="post-detail-comments"
          key={commentsKey}
          className="px-4 py-4 border-b border-border scroll-mt-20"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">Comments</h2>
          <CommentsSection
            postId={postId}
            currentUser={currentUser}
            useDirectComments
          />
        </div>
      )}

      {!isAuthenticated && (
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">
          <Link href="/auth/login" className="text-primary font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to view and post comments.
        </p>
      )}
    </div>
  );
}
