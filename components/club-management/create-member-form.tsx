"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Save, X } from "lucide-react";
import { CreateMemberData, MembersService } from "@/lib/services/members.service";
import { useClub } from "@/lib/club-context";

interface CreateMemberFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateMemberForm({ onSuccess, onCancel }: CreateMemberFormProps) {
  const { selectedClub } = useClub();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateMemberData>({
    club_id: selectedClub?.id || "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    member_type: "adult",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    membership_start_date: new Date().toISOString().slice(0, 10),
  });

  const handleInput = (field: keyof CreateMemberData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    setError(null);

    // Basic validation
    const required: Array<[keyof CreateMemberData, string]> = [
      ["first_name", "First name"],
      ["last_name", "Last name"],
      ["email", "Email"],
      ["member_type", "Member type"],
      ["membership_start_date", "Membership start date"],
    ];
    for (const [key, label] of required) {
      const v = formData[key];
      if (!v || String(v).trim() === "") {
        setError(`${label} is required`);
        return;
      }
    }

    try {
      setLoading(true);
      await MembersService.createMember({ ...formData, club_id: selectedClub.id });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create member";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <CardTitle>Create Member</CardTitle>
        <CardDescription>Add a new member to this club</CardDescription>
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
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" value={formData.first_name} onChange={(e) => handleInput("first_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" value={formData.last_name} onChange={(e) => handleInput("last_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleInput("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ""} onChange={(e) => handleInput("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input id="date_of_birth" type="date" value={formData.date_of_birth || ""} onChange={(e) => handleInput("date_of_birth", e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Member Type *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="membership_start_date">Member Since *</Label>
              <Input id="membership_start_date" type="date" value={formData.membership_start_date} onChange={(e) => handleInput("membership_start_date", e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Emergency Contact</Label>
              <Input id="emergency_contact_name" value={formData.emergency_contact_name || ""} onChange={(e) => handleInput("emergency_contact_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Emergency Phone</Label>
              <Input id="emergency_contact_phone" value={formData.emergency_contact_phone || ""} onChange={(e) => handleInput("emergency_contact_phone", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Create Member"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


