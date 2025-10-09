"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, HelpCircle, XCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { EventRSVPStatus } from "@/lib/events/types";
import { useState } from "react";
import { toast } from "sonner";

interface RSVPButtonGroupProps {
  currentStatus?: EventRSVPStatus;
  onRSVPUpdate?: (status: EventRSVPStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function RSVPButtonGroup({ 
  currentStatus = "not_responded",
  onRSVPUpdate,
  disabled = false,
  className 
}: RSVPButtonGroupProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<EventRSVPStatus | null>(null);
  
  const displayStatus = optimisticStatus || currentStatus;

  const handleRSVP = async (status: EventRSVPStatus) => {
    if (disabled || isUpdating) return;
    
    // Optimistic update
    setIsUpdating(true);
    setOptimisticStatus(status);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call parent callback
      onRSVPUpdate?.(status);
      
      toast.success(`RSVP updated to ${getStatusText(status)}`);
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticStatus(null);
      toast.error("Failed to update RSVP. Please try again.");
    } finally {
      setIsUpdating(false);
      setOptimisticStatus(null);
    }
  };

  const getStatusText = (status: EventRSVPStatus) => {
    switch (status) {
      case "going":
        return "Going";
      case "maybe":
        return "Maybe";
      case "not_going":
        return "Not Going";
      case "not_responded":
        return "Not Responded";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: EventRSVPStatus) => {
    switch (status) {
      case "going":
        return <CheckCircle className="h-4 w-4" />;
      case "maybe":
        return <HelpCircle className="h-4 w-4" />;
      case "not_going":
        return <XCircle className="h-4 w-4" />;
      case "not_responded":
        return null;
      default:
        return null;
    }
  };

  const getButtonVariant = (status: EventRSVPStatus, isActive: boolean) => {
    if (isActive) {
      switch (status) {
        case "going":
          return "default";
        case "maybe":
          return "secondary";
        case "not_going":
          return "destructive";
        default:
          return "outline";
      }
    }
    return "outline";
  };

  const rsvpOptions: { status: EventRSVPStatus; label: string }[] = [
    { status: "going", label: "Going" },
    { status: "maybe", label: "Maybe" },
    { status: "not_going", label: "Not Going" },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Status Display */}
      {displayStatus !== "not_responded" && (
        <div className="flex items-center gap-2">
          <Badge 
            variant={getButtonVariant(displayStatus, true) === "default" ? "default" : "secondary"}
            className="text-sm"
          >
            {getStatusIcon(displayStatus)}
            <span className="ml-1">Currently: {getStatusText(displayStatus)}</span>
          </Badge>
        </div>
      )}
      
      {/* RSVP Buttons */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-card-foreground">
          Will you attend this event?
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {rsvpOptions.map((option) => {
            const isActive = displayStatus === option.status;
            const isDisabled = disabled || isUpdating;
            
            return (
              <Button
                key={option.status}
                variant={getButtonVariant(option.status, isActive)}
                size="sm"
                onClick={() => handleRSVP(option.status)}
                disabled={isDisabled}
                className="flex-1 min-w-0"
                aria-pressed={isActive}
                aria-label={`RSVP as ${option.label}`}
              >
                {isUpdating && isActive ? (
                  <Loader size="sm" className="mr-1" />
                ) : (
                  getStatusIcon(option.status)
                )}
                <span className="ml-1">{option.label}</span>
              </Button>
            );
          })}
        </div>
        
        {/* Loading State */}
        {isUpdating && (
          <p className="text-xs text-muted-foreground">
            Updating your RSVP...
          </p>
        )}
      </div>
      
      {/* Clear RSVP Button */}
      {displayStatus !== "not_responded" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRSVP("not_responded")}
          disabled={disabled || isUpdating}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear RSVP
        </Button>
      )}
    </div>
  );
}