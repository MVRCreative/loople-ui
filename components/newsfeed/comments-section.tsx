"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Comment } from "./comment";
import { CommentForm } from "./comment-form";
import { Comment as CommentType, User, ApiComment } from "@/lib/types";
import { postsService } from "@/lib/services/posts.service";
import { transformApiCommentsToComments } from "@/lib/utils/posts.utils";
import { toast } from "sonner";

interface CommentsSectionProps {
  postId: string;
  currentUser: User;
  initialComments?: CommentType[];
}

export function CommentsSection({ postId, currentUser, initialComments = [] }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadComments = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await postsService.getComments(parseInt(postId), {
        page: pageNum,
        limit: 10
      });

      if (response.success && response.data) {
        const transformed = transformApiCommentsToComments(response.data as unknown as ApiComment[]);
        
        if (append) {
          setComments(prev => [...prev, ...transformed]);
        } else {
          setComments(transformed);
        }
        
        setHasMore(transformed.length === 10);
      } else {
        toast.error(response.error || 'Failed to load comments');
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const handleCreateComment = async (content: string, parentCommentId?: number) => {
    try {
      const response = await postsService.createComment(parseInt(postId), {
        post_id: parseInt(postId),
        content,
        parent_comment_id: parentCommentId
      });

      if (response.success && response.data) {
        const [inserted] = transformApiCommentsToComments([response.data as unknown as ApiComment]);
        setComments(prev => [inserted, ...prev]);
      } else {
        toast.error(response.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await postsService.deleteComment(parseInt(commentId));

      if (response.success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        toast.success("Comment deleted");
      } else {
        toast.error(response.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const loadMoreComments = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadComments(nextPage, true);
  };

  // Realtime subscription for comments on this post
  useEffect(() => {
    const postIdNumber = parseInt(postId);
    if (!postIdNumber) return;

    const channel = postsService.subscribeToComments(postIdNumber, (payload: unknown) => {
      const typedPayload = payload as Record<string, unknown>;
      const eventType = typedPayload.eventType as string;
      if (eventType === 'INSERT' && typedPayload.new) {
        const [inserted] = transformApiCommentsToComments([typedPayload.new as ApiComment]);
        setComments(prev => [inserted, ...prev]);
      } else if (eventType === 'DELETE' && typedPayload.old) {
        const deletedId = (typedPayload.old as Record<string, unknown>).id as number;
        setComments(prev => prev.filter(c => c.id !== String(deletedId)));
      } else if (eventType === 'UPDATE') {
        loadComments(page, false);
      }
    });

    return () => {
      postsService.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    if (initialComments.length === 0) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, initialComments.length]);

  return (
    <div className="border-t border-border pt-3 mt-1">
      {/* Reply input — always visible, like Twitter */}
      <CommentForm
        currentUser={currentUser}
        onSubmit={handleCreateComment}
        placeholder="Post your reply"
      />

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="mt-3 space-y-0">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleCreateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 py-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-foreground/[0.06] dark:bg-foreground/[0.08] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-3 w-20 bg-foreground/[0.06] dark:bg-foreground/[0.08] animate-pulse rounded" />
                  <div className="h-3 w-12 bg-foreground/[0.06] dark:bg-foreground/[0.08] animate-pulse rounded" />
                </div>
                <div className="h-3 w-full bg-foreground/[0.06] dark:bg-foreground/[0.08] animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show more */}
      {hasMore && !loading && comments.length > 0 && (
        <div className="py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMoreComments}
            className="text-primary hover:text-primary/80 hover:bg-transparent p-0 h-auto text-sm font-medium"
          >
            Show more replies
          </Button>
        </div>
      )}
    </div>
  );
}
