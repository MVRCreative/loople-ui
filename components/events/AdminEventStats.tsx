"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, HelpCircle, XCircle, Download, Share2, BarChart3 } from "lucide-react";
import { EventDetail, EventRSVP } from "@/lib/events/types";
import { getRSVPCounts } from "@/lib/events/selectors";

interface AdminEventStatsProps {
  event: EventDetail;
  rsvps: EventRSVP[];
  className?: string;
}

export function AdminEventStats({ 
  event, 
  rsvps, 
  className 
}: AdminEventStatsProps) {
  const rsvpCounts = getRSVPCounts(rsvps);
  const totalResponses = rsvpCounts.total;
  const responseRate = event.capacity?.max ? (totalResponses / event.capacity.max) * 100 : 0;

  const handleExportRSVPs = () => {
    // TODO: Implement CSV export functionality
    console.log("Export RSVPs to CSV");
  };

  const handleShareStats = () => {
    // TODO: Implement share functionality
    console.log("Share event statistics");
  };

  const handleViewAnalytics = () => {
    // TODO: Implement analytics view
    console.log("View detailed analytics");
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* RSVP Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            RSVP Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rsvpCounts.going}
              </div>
              <div className="text-sm text-muted-foreground">Going</div>
              <Badge variant="default" className="mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                {totalResponses > 0 ? Math.round((rsvpCounts.going / totalResponses) * 100) : 0}%
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {rsvpCounts.maybe}
              </div>
              <div className="text-sm text-muted-foreground">Maybe</div>
              <Badge variant="secondary" className="mt-1">
                <HelpCircle className="h-3 w-3 mr-1" />
                {totalResponses > 0 ? Math.round((rsvpCounts.maybe / totalResponses) * 100) : 0}%
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {rsvpCounts.not_going}
              </div>
              <div className="text-sm text-muted-foreground">Not Going</div>
              <Badge variant="destructive" className="mt-1">
                <XCircle className="h-3 w-3 mr-1" />
                {totalResponses > 0 ? Math.round((rsvpCounts.not_going / totalResponses) * 100) : 0}%
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalResponses}
              </div>
              <div className="text-sm text-muted-foreground">Total Responses</div>
              <Badge variant="outline" className="mt-1">
                {event.capacity?.max ? `${Math.round(responseRate)}% of capacity` : "No limit"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Information */}
      {event.capacity && (
        <Card>
          <CardHeader>
            <CardTitle>Capacity Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Capacity Utilization</span>
                <span className="text-sm text-muted-foreground">
                  {event.capacity.current} / {event.capacity.max}
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((event.capacity.current / event.capacity.max) * 100, 100)}%` 
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {event.capacity.max - event.capacity.current} spots remaining
                </span>
                {event.capacity.waitlist && (
                  <Badge variant="outline" className="text-orange-600">
                    Waitlist Enabled
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RSVP List */}
      {rsvps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>RSVP List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rsvps.map((rsvp) => (
                <div 
                  key={rsvp.id} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {rsvp.user.avatar}
                    </div>
                    <div>
                      <div className="font-medium">{rsvp.user.name}</div>
                      <div className="text-sm text-muted-foreground">{rsvp.user.role}</div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={
                      rsvp.status === "going" ? "default" :
                      rsvp.status === "maybe" ? "secondary" :
                      rsvp.status === "not_going" ? "destructive" : "outline"
                    }
                  >
                    {rsvp.status === "going" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {rsvp.status === "maybe" && <HelpCircle className="h-3 w-3 mr-1" />}
                    {rsvp.status === "not_going" && <XCircle className="h-3 w-3 mr-1" />}
                    {rsvp.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleExportRSVPs}
              className="flex-1 min-w-0"
            >
              <Download className="h-4 w-4 mr-1" />
              Export RSVPs
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShareStats}
              className="flex-1 min-w-0"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share Stats
            </Button>
            
            <Button
              variant="outline"
              onClick={handleViewAnalytics}
              className="flex-1 min-w-0"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
