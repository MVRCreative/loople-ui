"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save, X } from "lucide-react";
import { CreateEventData, EventsService } from "@/lib/services/events.service";
import { useClub } from "@/lib/club-context";

interface CreateEventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateEventForm({ onSuccess, onCancel }: CreateEventFormProps) {
  const { selectedClub } = useClub();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEventData>({
    club_id: selectedClub?.id || "",
    title: "",
    description: "",
    event_type: "meeting",
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date().toISOString().slice(0, 16),
    location: "",
    max_capacity: undefined,
    registration_deadline: undefined,
    price_member: 0,
    price_non_member: undefined,
  });

  const handleInput = (field: keyof CreateEventData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    setError(null);

    const required: Array<[keyof CreateEventData, string]> = [
      ["title", "Title"],
      ["event_type", "Event type"],
      ["start_date", "Start date"],
      ["end_date", "End date"],
      ["location", "Location"],
    ];
    for (const [key, label] of required) {
      const v = formData[key] as unknown;
      if (v == null || String(v).trim() === "") {
        setError(`${label} is required`);
        return;
      }
    }

    try {
      setLoading(true);
      await EventsService.createEvent({ ...formData, club_id: selectedClub.id });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create event";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <CardTitle>Create Event</CardTitle>
        <CardDescription>Add a new event for this club</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => handleInput("title", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => handleInput("description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Event Type *</Label>
              <select
                value={formData.event_type}
                onChange={(e) => handleInput("event_type", e.target.value as CreateEventData["event_type"])}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="meeting">Meeting</option>
                <option value="competition">Competition</option>
                <option value="practice">Practice</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" value={formData.location} onChange={(e) => handleInput("location", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start *</Label>
              <Input id="start_date" type="datetime-local" value={formData.start_date} onChange={(e) => handleInput("start_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End *</Label>
              <Input id="end_date" type="datetime-local" value={formData.end_date} onChange={(e) => handleInput("end_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_capacity">Max Capacity</Label>
              <Input id="max_capacity" type="number" min={0} value={formData.max_capacity ?? ''} onChange={(e) => handleInput("max_capacity", e.target.value === '' ? undefined : Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input id="registration_deadline" type="datetime-local" value={formData.registration_deadline || ''} onChange={(e) => handleInput("registration_deadline", e.target.value || undefined)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_member">Price (Member)</Label>
              <Input id="price_member" type="number" min={0} step="0.01" value={formData.price_member ?? 0} onChange={(e) => handleInput("price_member", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_non_member">Price (Non-Member)</Label>
              <Input id="price_non_member" type="number" min={0} step="0.01" value={formData.price_non_member ?? ''} onChange={(e) => handleInput("price_non_member", e.target.value === '' ? undefined : Number(e.target.value))} />
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
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


