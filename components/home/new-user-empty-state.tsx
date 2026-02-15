"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClubInquiryService } from "@/lib/services/club-inquiry.service";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

export function NewUserEmptyState() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const email = user?.email ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await ClubInquiryService.submitClubInquiry({
        name: name.trim() || undefined,
        email: email.trim(),
        message: message.trim(),
      });
      if (result.success) {
        toast.success("Your inquiry has been submitted. We'll be in touch soon!");
        setOpen(false);
        setName("");
        setMessage("");
      } else {
        toast.error(result.error ?? "Failed to submit");
      }
    } catch {
      toast.error("Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="text-center py-12 text-muted-foreground">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">You&apos;re not part of any clubs yet</p>
        <p className="text-sm mb-6">
          Create a club to get started and connect with your community.
        </p>
        <Button onClick={() => setOpen(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          Create a Club
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Club</DialogTitle>
            <DialogDescription>
              Tell us about your interest in creating a club. We&apos;ll reach out to
              help you get started.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about the club you'd like to create..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
