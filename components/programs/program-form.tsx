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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoverUpload } from "@/components/ui/cover-upload";
import { ProgramsService } from "@/lib/services/programs.service";
import type {
  Program,
  CreateProgramData,
  ProgramVisibility,
  ProgramScheduleEntry,
} from "@/lib/programs/types";
import { Loader2, Plus, Trash2 } from "lucide-react";

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

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const EMPTY_SCHEDULE_ENTRY: ProgramScheduleEntry = {
  day_of_week: "Monday",
  start_time: "09:00",
  end_time: "10:00",
  location: "",
  notes: "",
};

export function ProgramForm({ clubId, program, mode }: ProgramFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state — Overview
  const [name, setName] = useState(program?.name ?? "");
  const [description, setDescription] = useState(program?.description ?? "");
  const [programType, setProgramType] = useState(
    program?.program_type ?? "general"
  );
  const [visibility, setVisibility] = useState<ProgramVisibility>(
    program?.visibility ?? "public"
  );
  const [imageUrl, setImageUrl] = useState(program?.image_url ?? "");

  // Form state — Schedule
  const [schedule, setSchedule] = useState<ProgramScheduleEntry[]>(
    program?.schedule ?? []
  );

  // Form state — Settings
  const [isActive, setIsActive] = useState(program?.is_active ?? true);
  const [hasFees, setHasFees] = useState(program?.has_fees ?? false);
  const [registrationFee, setRegistrationFee] = useState(
    program?.registration_fee?.toString() ?? ""
  );
  const [seasonStart, setSeasonStart] = useState(
    program?.season_start ? program.season_start.slice(0, 10) : ""
  );
  const [seasonEnd, setSeasonEnd] = useState(
    program?.season_end ? program.season_end.slice(0, 10) : ""
  );

  // Schedule helpers
  const addScheduleEntry = () => {
    setSchedule((prev) => [...prev, { ...EMPTY_SCHEDULE_ENTRY }]);
  };

  const updateScheduleEntry = (
    index: number,
    field: keyof ProgramScheduleEntry,
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const removeScheduleEntry = (index: number) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

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
        has_fees: hasFees,
        registration_fee:
          hasFees && registrationFee
            ? parseFloat(registrationFee)
            : undefined,
        image_url: imageUrl.trim() || undefined,
        season_start: seasonStart || undefined,
        season_end: seasonEnd || undefined,
        schedule: schedule.length > 0 ? schedule : undefined,
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              <CoverUpload
                currentCoverUrl={imageUrl || undefined}
                onCoverChange={setImageUrl}
              />
            </CardContent>
          </Card>

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
                  placeholder="Describe what this program is about, who it's for, what members can expect..."
                  rows={5}
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
                    onValueChange={(v) =>
                      setVisibility(v as ProgramVisibility)
                    }
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="members_only">
                        Members Only
                      </SelectItem>
                      <SelectItem value="private">
                        Private (Invite Only)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Schedule Tab ─── */}
        <TabsContent value="schedule" className="space-y-6 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Weekly Schedule</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addScheduleEntry}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Time Slot
              </Button>
            </CardHeader>
            <CardContent>
              {schedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No schedule entries yet</p>
                  <p className="text-sm">
                    Add time slots to define when this program meets
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedule.map((entry, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end border rounded-lg p-4"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Day
                        </Label>
                        <Select
                          value={entry.day_of_week}
                          onValueChange={(v) =>
                            updateScheduleEntry(index, "day_of_week", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Start
                        </Label>
                        <Input
                          type="time"
                          value={entry.start_time}
                          onChange={(e) =>
                            updateScheduleEntry(
                              index,
                              "start_time",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          End
                        </Label>
                        <Input
                          type="time"
                          value={entry.end_time}
                          onChange={(e) =>
                            updateScheduleEntry(
                              index,
                              "end_time",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Location
                        </Label>
                        <Input
                          value={entry.location ?? ""}
                          onChange={(e) =>
                            updateScheduleEntry(
                              index,
                              "location",
                              e.target.value
                            )
                          }
                          placeholder="e.g. Pool A"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeScheduleEntry(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Settings Tab ─── */}
        <TabsContent value="settings" className="space-y-6 pt-4">
          {/* Season */}
          <Card>
            <CardHeader>
              <CardTitle>Season</CardTitle>
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
                  <Label htmlFor="has_fees">Charge a registration fee</Label>
                  <p className="text-sm text-muted-foreground">
                    Members will need to pay to join this program
                  </p>
                </div>
                <Switch
                  id="has_fees"
                  checked={hasFees}
                  onCheckedChange={setHasFees}
                />
              </div>

              {hasFees && (
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="registration_fee">
                    Registration Fee ($)
                  </Label>
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
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions — always visible */}
      <div className="flex items-center gap-3 pt-2 border-t">
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
