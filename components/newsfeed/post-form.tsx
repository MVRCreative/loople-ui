"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Calendar, MessageCircle } from "lucide-react";
import { User } from "@/lib/types";

interface PostFormProps {
  currentUser: User;
  onSubmit: (content: string, type: "text" | "event" | "poll") => void;
}

export function PostForm({ currentUser, onSubmit }: PostFormProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"text" | "event" | "poll">("text");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      if (postType === "poll") {
        // For poll posts, we'll pass the poll data through the content
        const pollData = {
          question: pollQuestion,
          options: pollOptions.filter(option => option.trim())
        };
        onSubmit(JSON.stringify({ text: content.trim(), poll: pollData }), postType);
      } else {
        onSubmit(content.trim(), postType);
      }
      setContent("");
      setPostType("text");
      setPollQuestion("");
      setPollOptions(["", ""]);
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
              placeholder="Share an update with your club..."
              className="w-full min-h-[60px] p-3 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
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

            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={postType === "event" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("event")}
                  className="h-8 px-3"
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
                  suppressHydrationWarning
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Poll
                </Button>
              </div>
              
              <Button
                type="submit"
                disabled={!content.trim() || (postType === "poll" && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2))}
                className="h-8 px-4"
                suppressHydrationWarning
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
