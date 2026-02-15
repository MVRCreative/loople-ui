"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Comment as CommentType, User } from "@/lib/types";
import { CommentForm } from "./comment-form";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MentionText } from "@/components/mentions/mention-text";

interface CommentProps {
  comment: CommentType;
  currentUser: User;
  onReply: (content: string, parentCommentId: number) => void;
  onDelete: (commentId: string) => void;
  isReply?: boolean;
}

export function Comment({ comment, currentUser, onReply, onDelete, isReply = false }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleReply = async (content: string, parentCommentId?: number) => {
    try {
      await onReply(content, parentCommentId || parseInt(comment.id));
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error replying to comment:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setIsDeleting(true);
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const canDelete = !!comment.user && (currentUser.id === comment.user.id || currentUser.isAdmin);
  const username = comment.user?.username || comment.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user';

  return (
    <div className={`${isReply ? 'ml-10 border-l-2 border-border pl-3' : 'border-b border-border'}`}>
      <div className="flex gap-3 py-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.user?.avatar_url || ''} alt={comment.user?.name || 'User'} />
          <AvatarFallback className="bg-primary/10 text-xs">
            {comment.user?.avatar ?? '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          {/* Name row — Twitter style: Name @handle · time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-sm text-foreground truncate">
                {comment.user?.name ?? 'Unknown'}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                @{username}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {comment.timestamp}
              </span>
            </div>
            
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                    disabled={isDeleting}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Comment content */}
          <p className="text-sm text-foreground mt-0.5 leading-relaxed">
            <MentionText text={comment.content} />
          </p>
          
          {/* Reply action — subtle text link */}
          {!isReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="mt-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>
      
      {showReplyForm && (
        <div className="ml-11 pb-3">
          <CommentForm
            currentUser={currentUser}
            onSubmit={handleReply}
            onCancel={() => setShowReplyForm(false)}
            parentCommentId={parseInt(comment.id)}
            placeholder={`Reply to ${comment.user?.name ?? 'user'}...`}
          />
        </div>
      )}
    </div>
  );
}
