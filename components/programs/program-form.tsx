"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramsService } from "@/lib/services/programs.service";
import type {
  Program,
  CreateProgramData,
  ProgramVisibility,
} from "@/lib/programs/types";
import { Loader2 } from "lucide-react";

interface ProgramFormProps {
  clubId: string;
  program?: Program;
  mode: "create" | "edit";
}

const PROGRAM_TYPES = [
  { value: "athletic", label: "Athletic" },
  { value: "aquatic", label: "Aquatic" },
  { value: "social", label: "Social" },
  { value: "education", label: "Education" },
  { value: "fitness", label: "Fitness" },
  { value: "youth", label: "Youth" },
  { value: "general", label: "General" },
];

export function ProgramForm({ clubId, program, mode }: ProgramFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [programType, setProgramType] = useState(
    program?.program_type ?? "general"
  );
  const [visibility, setVisibility] = useState<ProgramVisibility>(
    program?.visibility ?? "public"
  );
  const [isActive, setIsActive] = useState(program?.is_active ?? true);
  const [requiresApproval, setRequiresApproval] = useState(
    program?.requires_approval ?? false
  );
  const [hasFees, setHasFees] = useState(program?.has_fees ?? false);
  const [registrationFee, setRegistrationFee] = useState(
    program?.registration_fee?.toString() ?? ""
  );
  const [monthlyFee, setMonthlyFee] = useState(
    program?.monthly_fee?.toString() ?? ""
  );
  const [maxMembers, setMaxMembers] = useState(
    program?.max_members?.toString() ?? ""
  );
  const [imageUrl, setImageUrl] = useState(program?.image_url ?? "");
  const [seasonStart, setSeasonStart] = useState(
    program?.season_start ? program.season_start.slice(0, 10) : ""
  );
  const [seasonEnd, setSeasonEnd] = useState(
    program?.season_end ? program.season_end.slice(0, 10) : ""
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Program name is required.");
      return;
    }

    setSaving(true);

    try {
      const data: CreateProgramData = {
        club_id: clubId,
        name: name.trim(),
        description: description.trim() || undefined,
        program_type: programType,
        visibility,
        is_active: isActive,
        requires_approval: requiresApproval,
        has_fees: hasFees,
        registration_fee: hasFees && registrationFee
          ? parseFloat(registrationFee)
          : undefined,
        monthly_fee: hasFees && monthlyFee
          ? parseFloat(monthlyFee)
          : undefined,
        max_members: maxMembers ? parseInt(maxMembers, 10) : undefined,
        image_url: imageUrl.trim() || undefined,
        season_start: seasonStart || undefined,
        season_end: seasonEnd || undefined,
      };

      if (mode === "create") {
        await ProgramsService.createProgram(data);
      } else if (program) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { club_id: _clubId, ...updates } = data;
        await ProgramsService.updateProgram(program.id, updates);
      }

      router.push("/admin/programs");
      router.refresh();
    } catch (err) {
      console.error("Error saving program:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save program."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Program Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Competitive Swimming"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this program is about..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program_type">Program Type</Label>
              <Select value={programType} onValueChange={setProgramType}>
                <SelectTrigger id="program_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as ProgramVisibility)}
              >
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="members_only">Members Only</SelectItem>
                  <SelectItem value="private">Private (Invite Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Cover Image URL</Label>
            <Input
              id="image_url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Season & Capacity */}
      <Card>
        <CardHeader>
          <CardTitle>Season & Capacity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="season_start">Season Start</Label>
              <Input
                id="season_start"
                type="date"
                value={seasonStart}
                onChange={(e) => setSeasonStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season_end">Season End</Label>
              <Input
                id="season_end"
                type="date"
                value={seasonEnd}
                onChange={(e) => setSeasonEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_members">Max Members</Label>
            <Input
              id="max_members"
              type="number"
              min="0"
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              placeholder="Leave blank for unlimited"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="has_fees">Charge fees</Label>
              <p className="text-sm text-muted-foreground">
                Enable to set registration and/or monthly fees
              </p>
            </div>
            <Switch
              id="has_fees"
              checked={hasFees}
              onCheckedChange={setHasFees}
            />
          </div>

          {hasFees && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registration_fee">Registration Fee ($)</Label>
                <Input
                  id="registration_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={registrationFee}
                  onChange={(e) => setRegistrationFee(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_fee">Monthly Fee ($)</Label>
                <Input
                  id="monthly_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Inactive programs are hidden from members
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requires_approval">Requires Approval</Label>
              <p className="text-sm text-muted-foreground">
                Members must be approved before joining
              </p>
            </div>
            <Switch
              id="requires_approval"
              checked={requiresApproval}
              onCheckedChange={setRequiresApproval}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Program" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/programs")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
