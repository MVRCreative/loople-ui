"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { Image as ImageIcon, List, Smile, X } from "lucide-react";
import { User } from "@/lib/types";
import { toast } from "sonner";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea on content change (capped at ~200px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [content]);

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
    <div className="bg-card px-4 pt-3 pb-2 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <Loader />
            <p className="text-sm text-muted-foreground font-medium">Creating post...</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={currentUser.avatar_url || ''} alt={currentUser.name} />
            <AvatarFallback className="bg-primary/10 text-lg">
              {currentUser.avatar}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAuthenticated ? "What's happening?" : "Sign in to share your thoughts..."}
              className="w-full min-h-[60px] max-h-[200px] p-0 text-[15px] leading-relaxed resize-none focus:outline-none text-foreground placeholder:text-muted-foreground bg-transparent overflow-y-auto"
              rows={1}
              disabled={!isAuthenticated}
            />
            
            {/* Poll form fields */}
            {postType === "poll" && isAuthenticated && (
              <div className="space-y-3 mt-3 p-3 rounded-xl border border-border bg-muted/30">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll question..."
                  className="w-full p-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 p-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePollOption(index)}
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
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
                  >
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {/* Image Preview Grid */}
            {attachments.length > 0 && (
              <div className="mt-3">
                <div className={`grid gap-2 ${attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {attachments.slice(0, 4).map((file, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden border border-border/50">
                      {file.type.startsWith('image/') ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-auto max-h-80 object-cover"
                          />
                        </>
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">{file.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-background rounded-full backdrop-blur-sm transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {attachments.length > 4 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    +{attachments.length - 4} more files
                  </div>
                )}
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isAuthenticated}
                  className="p-2 rounded-full transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Add image"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setPostType(postType === "poll" ? "text" : "poll")}
                  disabled={!isAuthenticated}
                  className={`p-2 rounded-full transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                    postType === "poll"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  }`}
                  aria-label="Create poll"
                >
                  <List className="h-5 w-5" />
                </button>
                
                <button
                  type="button"
                  disabled={!isAuthenticated}
                  className="p-2 rounded-full transition-colors text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Add emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              
              <Button
                type="submit"
                disabled={!isAuthenticated || !hasContent || (postType === "poll" && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2))}
                className="h-9 px-5 rounded-full font-semibold"
              >
                {isAuthenticated ? "Post" : "Sign In"}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Hidden file input */}
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
