"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Send, X } from "lucide-react";
import { ClubsService, InviteToClubData } from "@/lib/services/clubs.service";
import { useClub } from "@/lib/club-context";

interface InviteMemberFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function InviteMemberForm({ onSuccess, onCancel }: InviteMemberFormProps) {
  const { selectedClub } = useClub();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InviteToClubData>({
    club_id: selectedClub?.id || "",
    email: "",
    first_name: "",
    last_name: "",
    member_type: "adult",
  });

  const handleInput = (field: keyof InviteToClubData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    setError(null);

    try {
      setLoading(true);
      await ClubsService.inviteToClub({ ...formData, club_id: selectedClub.id });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send invite";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <CardTitle>Invite Member</CardTitle>
        <CardDescription>Send an invitation to join this club</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={formData.first_name} onChange={(e) => handleInput("first_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={formData.last_name} onChange={(e) => handleInput("last_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleInput("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Member Type</Label>
              <select
                value={formData.member_type}
                onChange={(e) => handleInput("member_type", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="adult">Adult</option>
                <option value="child">Child</option>
                <option value="family">Family</option>
              </select>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


