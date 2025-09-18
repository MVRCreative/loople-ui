"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Save, X } from "lucide-react";
import { CreateEventData, EventsService, Event as ApiEvent } from "@/lib/services/events.service";
import { useClub } from "@/lib/club-context";

interface EventFormProps {
  mode: "create" | "edit";
  event?: ApiEvent; // Required for edit mode
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ mode, event, onSuccess, onCancel }: EventFormProps) {
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

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Convert to local timezone and format as YYYY-MM-DDTHH:MM
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // Initialize form data for edit mode
  useEffect(() => {
    if (mode === "edit" && event) {
      setFormData({
        club_id: event.club_id,
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        start_date: formatDateForInput(event.start_date),
        end_date: formatDateForInput(event.end_date),
        location: event.location || "",
        max_capacity: event.max_capacity,
        registration_deadline: event.registration_deadline ? formatDateForInput(event.registration_deadline) : undefined,
        price_member: event.price_member || 0,
        price_non_member: event.price_non_member,
      });
    }
  }, [mode, event]);

  const handleInput = (field: keyof CreateEventData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
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
        return `${label} is required`;
      }
    }

    // Validate date range
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    if (startDate >= endDate) {
      return "End date must be after start date";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      
      if (mode === "create") {
        if (!selectedClub) {
          setError("No club selected");
          return;
        }
        await EventsService.createEvent({ ...formData, club_id: selectedClub.id });
      } else if (mode === "edit" && event) {
        await EventsService.updateEvent(event.id.toString(), formData);
      }
      
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : `Failed to ${mode} event`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isCreateMode = mode === "create";
  const title = isCreateMode ? "Create Event" : "Edit Event";
  const description = isCreateMode ? "Add a new event for this club" : "Update event details";
  const submitButtonText = loading 
    ? (isCreateMode ? "Creating..." : "Saving...") 
    : (isCreateMode ? "Create Event" : "Save Changes");

  return (
    <Card className="shadow-none border-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
              <Label htmlFor="title">Title {isCreateMode && "*"}</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => handleInput("title", e.target.value)} 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => handleInput("description", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Event Type {isCreateMode && "*"}</Label>
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
              <Label htmlFor="location">Location {isCreateMode && "*"}</Label>
              <Input 
                id="location" 
                value={formData.location} 
                onChange={(e) => handleInput("location", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start {isCreateMode && "*"}</Label>
              <Input 
                id="start_date" 
                type="datetime-local" 
                value={formData.start_date} 
                onChange={(e) => handleInput("start_date", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End {isCreateMode && "*"}</Label>
              <Input 
                id="end_date" 
                type="datetime-local" 
                value={formData.end_date} 
                onChange={(e) => handleInput("end_date", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_capacity">Max Capacity</Label>
              <Input 
                id="max_capacity" 
                type="number" 
                min={0} 
                value={formData.max_capacity ?? ''} 
                onChange={(e) => handleInput("max_capacity", e.target.value === '' ? undefined : Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input 
                id="registration_deadline" 
                type="datetime-local" 
                value={formData.registration_deadline || ''} 
                onChange={(e) => handleInput("registration_deadline", e.target.value || undefined)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_member">Price (Member)</Label>
              <Input 
                id="price_member" 
                type="number" 
                min={0} 
                step="0.01" 
                value={formData.price_member ?? 0} 
                onChange={(e) => handleInput("price_member", Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_non_member">Price (Non-Member)</Label>
              <Input 
                id="price_non_member" 
                type="number" 
                min={0} 
                step="0.01" 
                value={formData.price_non_member ?? ''} 
                onChange={(e) => handleInput("price_non_member", e.target.value === '' ? undefined : Number(e.target.value))} 
              />
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
              {submitButtonText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
