"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Calendar as CalendarIcon,
  MapPin,
  Upload,
  DollarSign,
  Users,
  Clock,
  Image as ImageIcon,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useEvents } from "@/lib/events/hooks";

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { events, loadEvents } = useEvents();
  
  // Form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [price, setPrice] = useState("");
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limit, setLimit] = useState("");
  const [ageRestriction, setAgeRestriction] = useState("");
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  // Check if we're in edit mode
  const editEventId = searchParams.get('edit');
  const isEditMode = !!editEventId;
  const currentEvent = isEditMode ? events.find(event => event.id === editEventId) : null;

  const saveOptions = [
    { name: 'Save and schedule', action: 'save_and_schedule' },
    { name: 'Save and publish', action: 'save_and_publish' },
    { name: 'Export PDF', action: 'export_pdf' },
  ];

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  // Load events and pre-fill form if in edit mode
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (isEditMode && currentEvent) {
      setTitle(currentEvent.title || "");
      setSummary(currentEvent.description || "");
      setDetails(currentEvent.details || "");
      setLocation(currentEvent.location?.name || "");
      
      // Parse dates
      if (currentEvent.start_date) {
        setStartDate(new Date(currentEvent.start_date));
      }
      if (currentEvent.end_date) {
        setEndDate(new Date(currentEvent.end_date));
      }
      
      // Parse times (assuming time is stored as HH:MM format)
      if (currentEvent.start_date) {
        const startDateTime = new Date(currentEvent.start_date);
        setStartTime(startDateTime.toTimeString().slice(0, 5)); // HH:MM format
      }
      if (currentEvent.end_date) {
        const endDateTime = new Date(currentEvent.end_date);
        setEndTime(endDateTime.toTimeString().slice(0, 5)); // HH:MM format
      }
      
      // Set payment settings
      if (currentEvent.price && currentEvent.price > 0) {
        setPaymentEnabled(true);
        setPrice(currentEvent.price.toString());
      }
      
      // Set capacity settings
      if (currentEvent.capacity && currentEvent.capacity > 0) {
        setLimitEnabled(true);
        setLimit(currentEvent.capacity.toString());
      }
      
      // Set age restriction
      setAgeRestriction(currentEvent.age_restriction || "none");
    }
  }, [isEditMode, currentEvent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSaveMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = (action: string) => {
    // TODO: Implement save logic based on action
    console.log(`Save action: ${action}`, {
      title,
      summary,
      startDate,
      endDate,
      startTime,
      endTime,
      image,
      details,
      location,
      paymentEnabled,
      price,
      limitEnabled,
      limit,
      ageRestriction,
    });
    
    // Close menu after action
    setShowSaveMenu(false);
    
    // Navigate back to admin events page after save
    router.push('/admin/events');
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/events">Events</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{isEditMode ? "Edit Event" : "Create Event"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? "Edit Event" : "Create Event"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode 
              ? "Update event details and settings" 
              : "Create a new event for your club"
            }
          </p>
        </div>
        
        {/* Save Button with Dropdown */}
        <div ref={dropdownRef} className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => handleSave("save")}
            className="relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50 focus:z-10"
          >
            Save changes
          </button>
          <div className="relative -ml-px block">
            <button
              type="button"
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              className="relative inline-flex items-center rounded-r-md bg-white px-2 py-2 text-gray-400 ring-1 ring-gray-300 hover:bg-gray-50 focus:z-10"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-5 w-5" />
            </button>
            
            {/* Dropdown Menu */}
            {showSaveMenu && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  {saveOptions.map((option) => (
                    <button
                      key={option.action}
                      onClick={() => handleSave(option.action)}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Brief description of the event"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="details">Details</Label>
                <Textarea
                  id="details"
                  placeholder="Full event description and details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Enter event location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Event Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <Label htmlFor="image" className="cursor-pointer">
                      <span className="text-sm font-medium text-primary hover:text-primary/80">
                        Upload an image
                      </span>
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
                {image && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {image.name}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Charge for this event</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable payment collection
                  </p>
                </div>
                <Switch
                  checked={paymentEnabled}
                  onCheckedChange={setPaymentEnabled}
                />
              </div>
              
              {paymentEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-10"
                      type="number"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capacity Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Set attendance limit</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit the number of attendees
                  </p>
                </div>
                <Switch
                  checked={limitEnabled}
                  onCheckedChange={setLimitEnabled}
                />
              </div>
              
              {limitEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="limit">Attendee limit *</Label>
                  <Input
                    id="limit"
                    placeholder="100"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    type="number"
                    min="1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Age Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle>Age Restrictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="ageRestriction">Age requirement</Label>
                <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No age restriction</SelectItem>
                    <SelectItem value="18+">18 and older</SelectItem>
                    <SelectItem value="21+">21 and older</SelectItem>
                    <SelectItem value="13+">13 and older (with adult)</SelectItem>
                    <SelectItem value="16+">16 and older</SelectItem>
                    <SelectItem value="all-ages">All ages welcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
