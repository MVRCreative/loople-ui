"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { Image as ImageIcon, List, Smile, X } from "lucide-react";
import { User } from "@/lib/types";
import { toast } from "sonner";
import { MentionInput } from "@/components/mentions/mention-input";
import { useClub } from "@/lib/club-context";

interface PostFormProps {
  currentUser: User;
  onSubmit: (
    content: string,
    type: "text" | "event" | "poll",
    attachments?: Array<File | { url: string; name: string; size: number; type: string }>
  ) => void;
  isAuthenticated?: boolean;
  isLoading?: boolean;
}

export function PostForm({ currentUser, onSubmit, isAuthenticated = false, isLoading = false }: PostFormProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "event" | "poll">("text");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedItems, setUploadedItems] = useState<Array<{ url: string; name: string; size: number; type: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedClub } = useClub();
  const clubId = selectedClub?.id ? parseInt(selectedClub.id) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      if (postType === "poll") {
        const pollData = {
          question: pollQuestion,
          options: pollOptions.filter(option => option.trim())
        };
        onSubmit(
          JSON.stringify({ text: content.trim(), poll: pollData }),
          postType,
          [...attachments, ...uploadedItems]
        );
      } else {
        onSubmit(content.trim(), postType, [...attachments, ...uploadedItems]);
      }
      setContent("");
      setPostType("text");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setAttachments([]);
      setUploadedItems([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
      
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not supported.`);
        return false;
      }
      
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const hasContent = content.trim().length > 0;

  return (
    <div className="relative px-4 py-3">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader />
            <p className="text-sm font-medium text-muted-foreground">Creating post…</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-card shadow-sm"
      >
        {/* Top: avatar + composer — single visual block */}
        <div className="flex gap-3 p-4 pb-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={currentUser.avatar_url || ''} alt={currentUser.name} />
            <AvatarFallback className="bg-primary/10 text-lg">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <MentionInput
              value={content}
              onChange={setContent}
              clubId={clubId}
              placeholder={isAuthenticated ? "What's happening?" : "Sign in to share your thoughts…"}
              className="min-h-[72px] w-full max-h-[200px] resize-none overflow-y-auto border-0 bg-transparent p-0 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              as="textarea"
              rows={2}
              disabled={!isAuthenticated}
            />
          </div>
        </div>

        {postType === "poll" && isAuthenticated && (
          <div className="space-y-3 border-t border-border/60 px-4 py-3">
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Poll question…"
              className="w-full rounded-lg border border-input bg-background p-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="space-y-2">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="min-w-0 flex-1 rounded-lg border border-input bg-background p-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePollOption(index)}
                      className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPollOption} className="h-8 px-3">
                Add option
              </Button>
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="border-t border-border/60 px-4 py-3">
            <div className={`grid gap-2 ${attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {attachments.slice(0, 4).map((file, index) => (
                <div key={index} className="relative overflow-hidden rounded-xl border border-border/50">
                  {file.type.startsWith('image/') ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="max-h-80 h-auto w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-muted">
                      <span className="text-sm text-muted-foreground">{file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
                    aria-label="Remove attachment"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {attachments.length > 4 && (
              <p className="mt-2 text-xs text-muted-foreground">+{attachments.length - 4} more files</p>
            )}
          </div>
        )}

        {/* Toolbar + Post — always inside the same card, below the text area */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <div className="flex shrink-0 gap-0.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isAuthenticated}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              aria-label="Add image or file"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setPostType(postType === "poll" ? "text" : "poll")}
              disabled={!isAuthenticated}
              className={`rounded-full p-2 transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                postType === "poll"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
              }`}
              aria-label="Poll"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={!isAuthenticated}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary disabled:pointer-events-none disabled:opacity-40"
              aria-label="Emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <Button
            type="submit"
            disabled={
              !isAuthenticated ||
              !hasContent ||
              (postType === "poll" && (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2))
            }
            className="h-9 shrink-0 rounded-full px-6 font-semibold"
          >
            {isAuthenticated ? "Post" : "Sign in"}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf"
        />
      </form>
    </div>
  );
}
