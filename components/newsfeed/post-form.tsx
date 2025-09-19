"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Calendar, MessageCircle, Paperclip, X } from "lucide-react";
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
  const [UploadButtonCmp, setUploadButtonCmp] = useState<React.ComponentType<{
    endpoint: string;
    onClientUploadComplete?: (res: Array<{ url: string; name: string; size: number; type: string }>) => void;
    onUploadError?: (error: Error) => void;
  }> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const removeUploadedItem = (index: number) => {
    setUploadedItems(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-card p-4 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Creating post...</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
              {currentUser.avatar}
            </div>
          </Avatar>
          
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAuthenticated ? "What's on your mind?" : "Sign in to share your thoughts..."}
              className="w-full min-h-[60px] p-3 border border-border rounded-lg bg-muted text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground"
              rows={3}
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

            {/* UploadThing Uploader (images/videos/documents) */}
            {isAuthenticated && UploadButtonCmp && (
              <div className="mt-3">
                <UploadButtonCmp
                  endpoint="postMediaUploader"
                  onClientUploadComplete={(res: Array<{ url: string; name?: string; size?: number; type?: string }> | undefined) => {
                    if (!res) return;
                    const mapped = res.map((f) => ({
                      url: f.url,
                      name: f.name || f.url.split('/').pop() || 'upload',
                      size: f.size || 0,
                      type: f.type || 'application/octet-stream',
                    }));
                    setUploadedItems(prev => [...prev, ...mapped]);
                    toast.success('Upload complete');
                  }}
                  onUploadError={(error: Error) => {
                    console.error(error);
                    toast.error(error.message || 'Upload failed');
                  }}
                />
              </div>
            )}

            {/* Attachments (local files) */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="text-sm font-medium text-card-foreground">Attachments:</div>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border border-border rounded bg-muted/50">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-card-foreground flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Uploaded (external) items */}
            {uploadedItems.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="text-sm font-medium text-card-foreground">Uploaded:</div>
                {uploadedItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border border-border rounded bg-muted/50">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-card-foreground flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(item.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadedItem(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-3"
                  disabled={!isAuthenticated}
                  suppressHydrationWarning
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  Attach
                </Button>
                
                <Button
                  type="button"
                  variant={postType === "event" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("event")}
                  className="h-8 px-3"
                  disabled={!isAuthenticated}
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
                  disabled={!isAuthenticated}
                  suppressHydrationWarning
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Poll
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={!isAuthenticated || !content.trim() || (postType === "poll" && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2))}
                className="h-8 px-4"
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
