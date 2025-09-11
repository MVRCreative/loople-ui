"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Save, X } from "lucide-react";
import { Member, MembersService } from "@/lib/services/members.service";

interface EditMemberFormProps {
  member: Member;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditMemberForm({ member, onSuccess, onCancel }: EditMemberFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Member>({ ...member });

  const handleInput = (field: keyof Member, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await MembersService.updateMember(formData.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        member_type: formData.member_type,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        membership_start_date: formData.membership_start_date,
        membership_status: (formData as unknown as { membership_status?: Member['status']; status?: Member['status'] }).membership_status ?? (formData as unknown as { status?: Member['status'] }).status,
      });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update member";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <CardTitle>Edit Member</CardTitle>
        <CardDescription>Update member details</CardDescription>
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
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ""} onChange={(e) => handleInput("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Membership Status</Label>
              <select
                value={(formData as unknown as { membership_status?: Member['status']; status?: Member['status'] }).membership_status ?? (formData as unknown as { status?: Member['status'] }).status}
                onChange={(e) => setFormData(prev => ({ ...(prev as unknown as Member & { membership_status?: Member['status'] }), membership_status: e.target.value as Member['status'] }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Member Type</Label>
              <select
                value={formData.member_type}
                onChange={(e) => handleInput("member_type", e.target.value as Member['member_type'])}
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
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


