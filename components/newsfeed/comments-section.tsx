"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Comment } from "./comment";
import { CommentForm } from "./comment-form";
import { Comment as CommentType, User, ApiComment } from "@/lib/types";
import { postsService } from "@/lib/services/posts.service";
import { transformApiCommentsToComments } from "@/lib/utils/posts.utils";
import { toast } from "sonner";
import { MessageCircle, Loader2 } from "lucide-react";

interface CommentsSectionProps {
  postId: string;
  currentUser: User;
  initialComments?: CommentType[];
}

export function CommentsSection({ postId, currentUser, initialComments = [] }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
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
        setComments(prev => [...prev, inserted]);
        toast.success("Comment posted!");
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
        // Reload the current page to reflect updates
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
    <div className="border-t border-border pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-card-foreground flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Comments ({comments.length})
        </h3>
        
        {!showCommentForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCommentForm(true)}
            className="h-8 px-3"
          >
            Add Comment
          </Button>
        )}
      </div>

      {showCommentForm && (
        <div className="mb-4">
          <CommentForm
            currentUser={currentUser}
            onSubmit={handleCreateComment}
            onCancel={() => setShowCommentForm(false)}
            placeholder="Write a comment..."
          />
        </div>
      )}

      <div className="space-y-4">
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

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading comments...</span>
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex items-center justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMoreComments}
            className="h-8 px-4"
          >
            Load More Comments
          </Button>
        </div>
      )}

      {comments.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet</p>
          <p className="text-xs">Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}
