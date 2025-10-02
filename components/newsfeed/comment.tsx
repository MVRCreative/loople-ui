"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Comment as CommentType, User } from "@/lib/types";
import { CommentForm } from "./comment-form";
import { MoreHorizontal, Reply, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

  return (
    <div className={`${isReply ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className="flex gap-3 mb-3">
        <Avatar className="h-8 w-8">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
            {comment.user?.avatar ?? '👤'}
          </div>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-card-foreground">
                {comment.user?.name ?? 'Unknown User'}
              </span>
              <Badge variant="secondary" className="text-xs">
                {comment.user?.role ?? 'Member'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {comment.timestamp}
              </span>
              
              {canDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted"
                      disabled={isDeleting}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          <p className="text-sm text-card-foreground mt-1 leading-relaxed">
            {comment.content}
          </p>
          
          {!isReply && (
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {showReplyForm && (
        <div className="mb-4">
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
