"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  Calendar as CalendarIcon,
  MapPin,
  Upload,
  DollarSign,
  Users,
  Clock,
  Image as ImageIcon,
  ChevronDown,
  Eye,
  Save,
  MessageSquare,
  HelpCircle,
  Plus,
  X,
  SquarePen,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useEvents } from "@/lib/events/hooks";
import { EventHeader } from "@/components/events/EventHeader";
import { EventCard } from "@/components/events/EventCard";
import { EventDetail, EventVisibility, EventStatus, EventListItem } from "@/lib/events/types";
import { getUpcomingEventListItems } from "@/lib/mocks/events";
import { formatEventDateTime, formatEventLocation } from "@/lib/events/selectors";

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
  const [visibility, setVisibility] = useState<EventVisibility>("public");
  const [status, setStatus] = useState<EventStatus>("draft");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(true);
  const [showNewsfeed, setShowNewsfeed] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [faqItems, setFaqItems] = useState<Array<{id: string, question: string, answer: string}>>([]);
  const [sectionOrder, setSectionOrder] = useState([
    'upcoming-events',
    'newsfeed', 
    'faq'
  ]);

  // Check if we're in edit mode
  const editEventId = searchParams.get('edit');
  const isEditMode = !!editEventId;
  const currentEvent = isEditMode ? events.find(event => event.id === editEventId) : null;

  // Create preview event data from form state
  const previewEvent: EventDetail = useMemo(() => {
    const now = new Date();
    const startDateTime = startDate && startTime 
      ? new Date(`${startDate.toISOString().split('T')[0]}T${startTime}:00`)
      : new Date();
    const endDateTime = endDate && endTime 
      ? new Date(`${endDate.toISOString().split('T')[0]}T${endTime}:00`)
      : new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    return {
      id: editEventId || "preview-event",
      title: title || "Event Title",
      description: summary || details || undefined,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      location: {
        name: location || "Location",
        address: undefined,
        city: undefined,
        state: undefined,
        zip: undefined,
      },
      capacity: limitEnabled ? {
        max: parseInt(limit) || 100,
        current: 0,
        waitlist: false,
      } : undefined,
      visibility,
      status,
      program: undefined,
      club_id: "club-1",
      created_by: "user-1",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      is_upcoming: startDateTime > now,
      is_past: endDateTime < now,
      rsvp_count: {
        going: 0,
        maybe: 0,
        not_going: 0,
        total: 0,
      },
    };
  }, [title, summary, details, startDate, startTime, endDate, endTime, location, limitEnabled, limit, visibility, status, editEventId]);

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

  // FAQ management functions
  const addFAQItem = () => {
    const newItem = {
      id: Date.now().toString(),
      question: "",
      answer: ""
    };
    setFaqItems([...faqItems, newItem]);
  };

  const updateFAQItem = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqItems(faqItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeFAQItem = (id: string) => {
    setFaqItems(faqItems.filter(item => item.id !== id));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    e.dataTransfer.setData('text/plain', sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    const draggedSectionId = e.dataTransfer.getData('text/plain');
    
    if (draggedSectionId === targetSectionId) return;
    
    const newOrder = [...sectionOrder];
    const draggedIndex = newOrder.indexOf(draggedSectionId);
    const targetIndex = newOrder.indexOf(targetSectionId);
    
    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSectionId);
    
    setSectionOrder(newOrder);
  };

  // Render sections in order
  const renderPreviewSections = () => {
    return sectionOrder.map((sectionId) => {
      switch (sectionId) {
        case 'upcoming-events':
          if (!showUpcomingEvents) return null;
          const upcomingEvents = getUpcomingEventListItems().slice(0, 2); // Show first 2 upcoming events
          return (
            <div
              key="upcoming-events"
              draggable
              onDragStart={(e) => handleDragStart(e, 'upcoming-events')}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'upcoming-events')}
              className="mt-6 cursor-move group hover:bg-muted/20 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
                <h2 className="text-xl font-semibold text-foreground">Upcoming Events</h2>
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Drag to reorder</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Event Image Header */}
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/40 relative">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-2">
                          {event.status}
                        </div>
                      </div>
                    </div>
                    
                    {/* Event Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>
                      <div className="text-sm text-muted-foreground mb-2">
                        {formatEventDateTime(event.start_date, event.end_date)}
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        {formatEventLocation(event.location)}
                      </div>
                      <div className="flex gap-2">
                        <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-primary bg-background text-primary shadow-xs hover:bg-primary hover:text-primary-foreground dark:bg-input/30 dark:border-primary dark:hover:bg-primary/90 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 flex-1">
                          <SquarePen className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-primary bg-background text-primary shadow-xs hover:bg-primary hover:text-primary-foreground dark:bg-input/30 dark:border-primary dark:hover:bg-primary/90 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        
        case 'newsfeed':
          if (!showNewsfeed) return null;
          return (
            <div
              key="newsfeed"
              draggable
              onDragStart={(e) => handleDragStart(e, 'newsfeed')}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'newsfeed')}
              className="mt-6 cursor-move group hover:bg-muted/20 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
                <h2 className="text-xl font-semibold text-foreground">Event Discussion</h2>
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Drag to reorder</div>
              </div>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Event-specific newsfeed and chat will appear here</p>
              </div>
            </div>
          );
        
        case 'faq':
          if (!showFAQ || faqItems.length === 0) return null;
          return (
            <div
              key="faq"
              draggable
              onDragStart={(e) => handleDragStart(e, 'faq')}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'faq')}
              className="mt-6 cursor-move group hover:bg-muted/20 rounded-lg p-2 -m-2 transition-colors"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
                <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Drag to reorder</div>
              </div>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <div key={item.id} className="bg-muted/50 border border-border rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">{item.question || "Question"}</h3>
                    <p className="text-sm text-muted-foreground">{item.answer || "Answer"}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        
        default:
          return null;
      }
    }).filter(Boolean);
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
      setLocation(currentEvent.location?.name || "");
      
      // Parse dates
      if (currentEvent.start_date) {
        setStartDate(new Date(currentEvent.start_date));
      }
      if (currentEvent.end_date) {
        setEndDate(new Date(currentEvent.end_date));
      }
      
      // Parse times
      if (currentEvent.start_date) {
        const startDateTime = new Date(currentEvent.start_date);
        setStartTime(startDateTime.toTimeString().slice(0, 5));
      }
      if (currentEvent.end_date) {
        const endDateTime = new Date(currentEvent.end_date);
        setEndTime(endDateTime.toTimeString().slice(0, 5));
      }
      
      // Set capacity settings
      if (currentEvent.capacity && currentEvent.capacity.max) {
        setLimitEnabled(true);
        setLimit(currentEvent.capacity.max.toString());
      }
      
      setVisibility(currentEvent.visibility);
      setStatus(currentEvent.status);
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
    <div className="h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border bg-background">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditMode ? "Edit Event" : "Create Event"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode 
              ? "Update event details and see live preview" 
              : "Create a new event and see how it looks"
            }
          </p>
        </div>
        
        {/* Mobile Preview Toggle */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {showMobilePreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>
        
        {/* Save Button with Dropdown */}
        <div ref={dropdownRef} className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => handleSave("save")}
            className="relative inline-flex items-center rounded-l-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:z-10"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Event
          </button>
          <div className="relative -ml-px block">
            <button
              type="button"
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              className="relative inline-flex items-center rounded-r-md bg-primary px-2 py-2 text-primary-foreground hover:bg-primary/90 focus:z-10"
            >
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {/* Dropdown Menu */}
            {showSaveMenu && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-background shadow-lg ring-1 ring-border">
                <div className="py-1">
                  {saveOptions.map((option) => (
                    <button
                      key={option.action}
                      onClick={() => handleSave(option.action)}
                      className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
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

      {/* Mobile Preview */}
      {showMobilePreview && (
        <div className="lg:hidden bg-muted/30 p-4 border-b border-border">
          <div className="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
            <EventHeader event={previewEvent} />
            
            {/* Additional preview content */}
            <div className="p-4">
              <div className="space-y-4">
                {details && (
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Event Details</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {details}
                    </p>
                  </div>
                )}
                
                {paymentEnabled && (
                  <div className="pt-4 border-t border-border">
                    <h3 className="font-medium text-foreground mb-2">Pricing</h3>
                    <p className="text-lg font-semibold text-foreground">
                      ${price || "0.00"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Draggable Sections - Mobile */}
            {sectionOrder.map((sectionId) => {
              switch (sectionId) {
                case 'upcoming-events':
                  if (!showUpcomingEvents) return null;
                  const upcomingEventsMobile = getUpcomingEventListItems().slice(0, 2);
                  return (
                    <div
                      key="upcoming-events-mobile"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'upcoming-events')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'upcoming-events')}
                      className="mt-4 cursor-move group hover:bg-muted/20 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
                        <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Drag</div>
                      </div>
                      <div className="space-y-4">
                        {upcomingEventsMobile.map((event) => (
                          <div key={`${event.id}-mobile`} className="rounded-lg border border-border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Event Image Header */}
                            <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/40 relative">
                              <div className="absolute inset-0 bg-black/20"></div>
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-6 w-6 p-0 bg-white/20 hover:bg-white/30 text-white">
                                  <Eye className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="absolute bottom-2 left-2 right-2">
                                <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-1">
                                  {event.status}
                                </div>
                              </div>
                            </div>
                            
                            {/* Event Content */}
                            <div className="p-3">
                              <h3 className="font-semibold text-base mb-1 line-clamp-2">{event.title}</h3>
                              <div className="text-xs text-muted-foreground mb-1">
                                {formatEventDateTime(event.start_date, event.end_date)}
                              </div>
                              <div className="text-xs text-muted-foreground mb-3">
                                {formatEventLocation(event.location)}
                              </div>
                              <div className="flex gap-2">
                                <button className="inline-flex items-center justify-center whitespace-nowrap text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-primary bg-background text-primary shadow-xs hover:bg-primary hover:text-primary-foreground dark:bg-input/30 dark:border-primary dark:hover:bg-primary/90 h-6 rounded-md gap-1 px-2 has-[>svg]:px-1.5 flex-1">
                                  <SquarePen className="h-3 w-3 mr-1" />
                                  Edit
                                </button>
                                <button className="inline-flex items-center justify-center whitespace-nowrap text-xs font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-primary bg-background text-primary shadow-xs hover:bg-primary hover:text-primary-foreground dark:bg-input/30 dark:border-primary dark:hover:bg-primary/90 h-6 rounded-md gap-1 px-2 has-[>svg]:px-1.5">
                                  <BarChart3 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                
                case 'newsfeed':
                  if (!showNewsfeed) return null;
                  return (
                    <div
                      key="newsfeed-mobile"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'newsfeed')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'newsfeed')}
                      className="mt-4 cursor-move group hover:bg-muted/20 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
                        <h2 className="text-lg font-semibold text-foreground">Event Discussion</h2>
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Drag</div>
                      </div>
                      <div className="bg-muted/50 border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Event-specific newsfeed and chat will appear here</p>
                      </div>
                    </div>
                  );
                
                case 'faq':
                  if (!showFAQ || faqItems.length === 0) return null;
                  return (
                    <div
                      key="faq-mobile"
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'faq')}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'faq')}
                      className="mt-4 cursor-move group hover:bg-muted/20 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full group-hover:bg-primary transition-colors"></div>
                        <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Drag</div>
                      </div>
                      <div className="space-y-3">
                        {faqItems.map((item) => (
                          <div key={item.id} className="bg-muted/50 border border-border rounded-lg p-3">
                            <h3 className="font-medium text-foreground text-sm mb-1">{item.question || "Question"}</h3>
                            <p className="text-xs text-muted-foreground">{item.answer || "Answer"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                
                default:
                  return null;
              }
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {/* Main Content: Preview + Settings */}
      <div className={`flex ${showMobilePreview ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-120px)]'}`}>
        {/* Live Preview */}
        <div className="flex-1 overflow-auto bg-muted/30 hidden lg:block">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
            </div>
            
            <div className="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
              <EventHeader event={previewEvent} />
              
              {/* Additional preview content */}
              <div className="p-6">
                <div className="space-y-4">
                  {details && (
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Event Details</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {details}
                      </p>
                    </div>
                  )}
                  
                  {paymentEnabled && (
                    <div className="pt-4 border-t border-border">
                      <h3 className="font-medium text-foreground mb-2">Pricing</h3>
                      <p className="text-lg font-semibold text-foreground">
                        ${price || "0.00"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Draggable Sections */}
            {renderPreviewSections()}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="w-full lg:w-96 border-l border-border bg-background overflow-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
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
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5" />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                
                <div className="grid grid-cols-2 gap-4">
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
                <CardTitle className="flex items-center gap-2 text-lg">
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

            {/* Event Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="h-5 w-5" />
                  Event Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Charge for this event</Label>
                    <p className="text-xs text-muted-foreground">
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Set attendance limit</Label>
                    <p className="text-xs text-muted-foreground">
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

            {/* Event Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Event Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Upcoming Events</Label>
                    <p className="text-xs text-muted-foreground">
                      Display related upcoming events
                    </p>
                  </div>
                  <Switch
                    checked={showUpcomingEvents}
                    onCheckedChange={setShowUpcomingEvents}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Event Discussion</Label>
                    <p className="text-xs text-muted-foreground">
                      Add newsfeed/chat for this event
                    </p>
                  </div>
                  <Switch
                    checked={showNewsfeed}
                    onCheckedChange={setShowNewsfeed}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Add FAQ Section</Label>
                    <p className="text-xs text-muted-foreground">
                      Include frequently asked questions
                    </p>
                  </div>
                  <Switch
                    checked={showFAQ}
                    onCheckedChange={setShowFAQ}
                  />
                </div>
              </CardContent>
            </Card>

            {/* FAQ Management */}
            {showFAQ && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HelpCircle className="h-5 w-5" />
                    FAQ Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faqItems.map((item, index) => (
                    <div key={item.id} className="space-y-3 p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">FAQ #{index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFAQItem(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`faq-question-${item.id}`}>Question</Label>
                        <Input
                          id={`faq-question-${item.id}`}
                          placeholder="Enter question"
                          value={item.question}
                          onChange={(e) => updateFAQItem(item.id, 'question', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`faq-answer-${item.id}`}>Answer</Label>
                        <Textarea
                          id={`faq-answer-${item.id}`}
                          placeholder="Enter answer"
                          value={item.answer}
                          onChange={(e) => updateFAQItem(item.id, 'answer', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={addFAQItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ Item
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Visibility & Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select value={visibility} onValueChange={(value: EventVisibility) => setVisibility(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="members_only">Members Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value: EventStatus) => setStatus(value)}>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
