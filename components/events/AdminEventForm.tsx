"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Eye, EyeOff, Lock, Save, X } from "lucide-react";
import { CreateEventData, UpdateEventData, EventDetail, EventVisibility, EventStatus } from "@/lib/events/types";
import { toast } from "sonner";

interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location_name: string;
  location_address: string;
  location_city: string;
  location_state: string;
  location_zip: string;
  capacity_max: number | "";
  capacity_waitlist: boolean;
  visibility: EventVisibility;
  status: EventStatus;
  program_id: string;
}

interface AdminEventFormProps {
  event?: EventDetail;
  onSubmit: (data: CreateEventData | UpdateEventData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export function AdminEventForm({ 
  event, 
  onSubmit, 
  onCancel, 
  loading = false,
  className 
}: AdminEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
  
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || "",
    description: event?.description || "",
    start_date: event ? event.start_date.split('T')[0] + 'T' + event.start_date.split('T')[1].substring(0, 5) : "",
    end_date: event ? event.end_date.split('T')[0] + 'T' + event.end_date.split('T')[1].substring(0, 5) : "",
    location_name: event?.location.name || "",
    location_address: event?.location.address || "",
    location_city: event?.location.city || "",
    location_state: event?.location.state || "",
    location_zip: event?.location.zip || "",
    capacity_max: event?.capacity?.max || "",
    capacity_waitlist: event?.capacity?.waitlist || false,
    visibility: event?.visibility || "public",
    status: event?.status || "draft",
    program_id: event?.program?.id || "",
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};
    
    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = "Event title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }
    
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    }
    
    if (!formData.end_date) {
      newErrors.end_date = "End date is required";
    }
    
    if (!formData.location_name.trim()) {
      newErrors.location_name = "Location name is required";
    }
    
    // Date validation
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        newErrors.end_date = "End date must be after start date";
      }
    }
    
    // Capacity validation
    if (formData.capacity_max && formData.capacity_max < 1) {
      newErrors.capacity_max = "Capacity must be at least 1";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = {
        title: formData.title,
        description: formData.description || undefined,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        location: {
          name: formData.location_name,
          address: formData.location_address || undefined,
          city: formData.location_city || undefined,
          state: formData.location_state || undefined,
          zip: formData.location_zip || undefined,
        },
        capacity: formData.capacity_max ? {
          max: formData.capacity_max,
          current: 0,
          waitlist: formData.capacity_waitlist,
        } : undefined,
        visibility: formData.visibility,
        program: formData.program_id || undefined,
        ...(event && { status: formData.status }),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Eye className="h-4 w-4" />;
      case "members_only":
        return <EyeOff className="h-4 w-4" />;
      case "private":
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default";
      case "draft":
        return "secondary";
      case "cancelled":
        return "destructive";
      case "completed":
        return "outline";
      default:
        return "default";
    }
  };

  const getVisibilityVariant = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "default";
      case "members_only":
        return "secondary";
      case "private":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {event ? "Edit Event" : "Create New Event"}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter event title"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="program_id">Program (Optional)</Label>
                <Select 
                  value={formData.program_id} 
                  onValueChange={(value) => handleInputChange("program_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="program-1">Competitive Swimming</SelectItem>
                    <SelectItem value="program-2">Water Polo</SelectItem>
                    <SelectItem value="program-3">Swimming Lessons</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter event description"
                rows={3}
              />
            </div>
          </div>
          
          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Date & Time</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date & Time *</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                  className={errors.start_date ? "border-destructive" : ""}
                />
                {errors.start_date && (
                  <p className="text-sm text-destructive">{errors.start_date}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time *</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                  className={errors.end_date ? "border-destructive" : ""}
                />
                {errors.end_date && (
                  <p className="text-sm text-destructive">{errors.end_date}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="location_name">Location Name *</Label>
              <Input
                id="location_name"
                value={formData.location_name}
                onChange={(e) => handleInputChange("location_name", e.target.value)}
                placeholder="e.g., Community Pool"
                className={errors.location_name ? "border-destructive" : ""}
              />
              {errors.location_name && (
                <p className="text-sm text-destructive">{errors.location_name}</p>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location_address">Address</Label>
                <Input
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => handleInputChange("location_address", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location_city">City</Label>
                <Input
                  id="location_city"
                  value={formData.location_city}
                  onChange={(e) => handleInputChange("location_city", e.target.value)}
                  placeholder="City"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location_state">State</Label>
                <Input
                  id="location_state"
                  value={formData.location_state}
                  onChange={(e) => handleInputChange("location_state", e.target.value)}
                  placeholder="State"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location_zip">ZIP Code</Label>
                <Input
                  id="location_zip"
                  value={formData.location_zip}
                  onChange={(e) => handleInputChange("location_zip", e.target.value)}
                  placeholder="ZIP code"
                />
              </div>
            </div>
          </div>
          
          {/* Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Capacity
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity_max">Maximum Capacity</Label>
                <Input
                  id="capacity_max"
                  type="number"
                  min="1"
                  value={formData.capacity_max}
                  onChange={(e) => handleInputChange("capacity_max", e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="Leave empty for unlimited"
                  className={errors.capacity_max ? "border-destructive" : ""}
                />
                {errors.capacity_max && (
                  <p className="text-sm text-destructive">{errors.capacity_max}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity_waitlist">Waitlist</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="capacity_waitlist"
                    checked={formData.capacity_waitlist}
                    onCheckedChange={(checked) => handleInputChange("capacity_waitlist", checked)}
                  />
                  <Label htmlFor="capacity_waitlist">Enable waitlist when full</Label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Visibility and Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select 
                  value={formData.visibility} 
                  onValueChange={(value) => handleInputChange("visibility", value as EventVisibility)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="members_only">
                      <div className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4" />
                        Members Only
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {event && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange("status", value as EventStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preview</h3>
            <div className="p-4 border border-border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getStatusVariant(formData.status)}>
                  {formData.status}
                </Badge>
                <Badge variant="outline">
                  {getVisibilityIcon(formData.visibility)}
                  <span className="ml-1">{formData.visibility.replace('_', ' ')}</span>
                </Badge>
              </div>
              <h4 className="font-semibold">{formData.title || "Event Title"}</h4>
              <p className="text-sm text-muted-foreground">
                {formData.location_name || "Location"} • {formData.start_date ? new Date(formData.start_date).toLocaleString() : "Date"}
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {event ? "Update Event" : "Create Event"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}