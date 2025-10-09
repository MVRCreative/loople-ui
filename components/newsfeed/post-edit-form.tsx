"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { Post, User } from "@/lib/types";
import { Calendar, MessageCircle, X } from "lucide-react";

interface PostEditFormProps {
  post: Post;
  currentUser: User;
  onSubmit: (postId: string, content: string, type: "text" | "event" | "poll") => void;
  onCancel: () => void;
}

export function PostEditForm({ post, currentUser, onSubmit, onCancel }: PostEditFormProps) {
  const [content, setContent] = useState(post.content.text);
  const [postType, setPostType] = useState<"text" | "event" | "poll">(post.content.type);
  const [pollQuestion, setPollQuestion] = useState(post.content.poll?.question || "");
  const [pollOptions, setPollOptions] = useState<string[]>(
    post.content.poll?.options || ["", ""]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        if (postType === "poll") {
          const pollData = {
            question: pollQuestion,
            options: pollOptions.filter(option => option.trim())
          };
          await onSubmit(post.id, JSON.stringify({ text: content.trim(), poll: pollData }), postType);
        } else {
          await onSubmit(post.id, content.trim(), postType);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, ""]);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-card-foreground">Edit Post</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar_url || ''} alt={currentUser.name} />
            <AvatarFallback className="bg-primary/10 text-lg">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update with your club..."
              className="w-full min-h-[60px] p-3 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
              disabled={isSubmitting}
              suppressHydrationWarning
            />
            
            {/* Poll form fields */}
            {postType === "poll" && (
              <div className="space-y-3 mt-3">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll question..."
                  className="w-full p-2 border border-input rounded-md bg-background text-sm"
                  disabled={isSubmitting}
                  suppressHydrationWarning
                />
                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 p-2 border border-input rounded-md bg-background text-sm"
                        disabled={isSubmitting}
                        suppressHydrationWarning
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePollOption(index)}
                          className="h-8 px-2"
                          disabled={isSubmitting}
                          suppressHydrationWarning
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPollOption}
                    className="h-8 px-3"
                    disabled={isSubmitting}
                    suppressHydrationWarning
                  >
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={postType === "event" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("event")}
                  className="h-8 px-3"
                  disabled={isSubmitting}
                  suppressHydrationWarning
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Event
                </Button>
                <Button
                  type="button"
                  variant={postType === "poll" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("poll")}
                  className="h-8 px-3"
                  disabled={isSubmitting}
                  suppressHydrationWarning
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Poll
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="h-8 px-4"
                  suppressHydrationWarning
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!content.trim() || (postType === "poll" && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) || isSubmitting}
                  className="h-8 px-4"
                  suppressHydrationWarning
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader size="sm" />
                      Updating...
                    </div>
                  ) : (
                    'Update Post'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
