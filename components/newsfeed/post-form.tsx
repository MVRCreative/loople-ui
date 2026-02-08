"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "@/components/ui/loader";
import { Image as ImageIcon, FileImage, List, Smile, Bold, Italic, X } from "lucide-react";
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
  const [, setUploadButtonCmp] = useState<React.ComponentType<{
    endpoint: string;
    onClientUploadComplete?: (res: Array<{ url: string; name: string; size: number; type: string }>) => void;
    onUploadError?: (error: Error) => void;
  }> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea on content change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Dynamically import UploadThing's UploadButton to avoid hard dependency
  useEffect(() => {
    (async () => {
      try {
        // Use eval to avoid TypeScript static analysis of the import
        const mod: { UploadButton?: React.ComponentType<{
          endpoint: string;
          onClientUploadComplete?: (res: Array<{ url: string; name: string; size: number; type: string }>) => void;
          onUploadError?: (error: Error) => void;
        }> } = await eval('import("@uploadthing/react")').catch(() => null);
        if (mod?.UploadButton) {
          setUploadButtonCmp(mod.UploadButton);
        }
      } catch {
        // UploadThing not installed; silently ignore
      }
    })();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      if (postType === "poll") {
        // For poll posts, we'll pass the poll data through the content
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

  const _removeUploadedItem = (index: number) => {
    setUploadedItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-card p-4 relative border-border">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader />
            <p className="text-sm text-muted-foreground">Creating post...</p>
          </div>
        </div>
      )}
      
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
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
              placeholder={isAuthenticated ? "What's happening?" : "Sign in to share your thoughts..."}
              className="w-full min-h-[100px] p-0 text-xl resize-none focus:outline-none text-foreground placeholder:text-muted-foreground bg-transparent overflow-hidden"
              rows={1}
              disabled={!isAuthenticated}
              suppressHydrationWarning
            />
            
            {/* Poll form fields */}
            {postType === "poll" && isAuthenticated && (
              <div className="space-y-3 mt-3">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Poll question..."
                  className="w-full p-2 border border-input rounded-md bg-background text-sm"
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
                        suppressHydrationWarning
                      />
                      {pollOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePollOption(index)}
                          className="h-8 px-2"
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
                    suppressHydrationWarning
                  >
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {/* Twitter-style Image Preview */}
            {attachments.length > 0 && (
              <div className="mt-2 relative">
                <div className={`grid gap-2 ${attachments.length === 1 ? 'grid-cols-1' : attachments.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {attachments.slice(0, 4).map((file, index) => (
                    <div key={index} className="relative rounded-2xl overflow-hidden border border-border/50">
                      {file.type.startsWith('image/') ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-auto max-h-96 object-cover"
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

            <div className="flex items-center justify-between mt-2 pt-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isAuthenticated}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Add image"
                  suppressHydrationWarning
                >
                  <ImageIcon className="h-5 w-5 text-primary" />
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isAuthenticated}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Add GIF"
                  suppressHydrationWarning
                >
                  <FileImage className="h-5 w-5 text-primary" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setPostType("poll")}
                  disabled={!isAuthenticated}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Create poll"
                  suppressHydrationWarning
                >
                  <List className="h-5 w-5 text-primary" />
                </button>
                
                <button
                  type="button"
                  disabled={!isAuthenticated}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Add emoji"
                  suppressHydrationWarning
                >
                  <Smile className="h-5 w-5 text-primary" />
                </button>
                
                <button
                  type="button"
                  disabled={!isAuthenticated}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Bold text"
                  suppressHydrationWarning
                >
                  <Bold className="h-5 w-5 text-primary" />
                </button>
                
                <button
                  type="button"
                  disabled={!isAuthenticated}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  aria-label="Italic text"
                  suppressHydrationWarning
                >
                  <Italic className="h-5 w-5 text-primary" />
                </button>
              </div>
              
              <Button
                type="submit"
                disabled={!isAuthenticated || !content.trim() || (postType === "poll" && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2))}
                className="h-9 px-4 rounded-full font-bold"
                suppressHydrationWarning
              >
                {isAuthenticated ? "Post" : "Sign In Required"}
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
