"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { AdminEventStats } from "@/components/events/AdminEventStats";
import { EventMeta } from "@/components/events/EventMeta";
import { useEvent } from "@/lib/events/hooks";
import { useAuth } from "@/lib/auth-context";
import { convertAuthUserToUser, createGuestUser } from "@/lib/utils/auth.utils";
import { User } from "@/lib/types";
import { ArrowLeft, Edit, Eye, Share2, Calendar, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function AdminEventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();
  
  const eventId = typeof params?.eventId === "string" ? params.eventId : "";
  const { event, rsvps, posts, loading, error, loadEvent } = useEvent(eventId);
  
  // Convert auth user to frontend User type
  const currentUser: User = authUser 
    ? convertAuthUserToUser(authUser)
    : createGuestUser();

  // Check if user is admin
  const isAdmin = currentUser.isAdmin;

  // Load event on mount
  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/admin/events/edit-${eventId}`);
  };

  const handleView = () => {
    router.push(`/event/${eventId}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || "Event",
          text: `Check out this event: ${event?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard!");
    }
  };

  const handleExportRSVPs = () => {
    // TODO: Implement CSV export functionality
    toast.info("CSV export functionality coming soon!");
  };

  const handleModeratePosts = () => {
    // TODO: Implement post moderation functionality
    toast.info("Post moderation functionality coming soon!");
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-2">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Failed to load event</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Event not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            The event you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
          <EventMeta 
            event={event} 
            showCapacity={true} 
            showProgram={true}
            className="mt-2"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Event Details */}
      <EventDetailHeader event={event} onShare={handleShare} />

      {/* Admin Stats */}
      <AdminEventStats 
        event={event} 
        rsvps={rsvps}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              onClick={handleExportRSVPs}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Export RSVPs
            </Button>
            
            <Button
              variant="outline"
              onClick={handleModeratePosts}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Moderate Posts
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(`/event/${event.id}`, '_blank')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview Event
            </Button>
            
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Posts Summary */}
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Event Discussion ({posts.length} posts)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {posts.slice(0, 5).map((eventPost) => (
                <div key={eventPost.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {eventPost.post.user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{eventPost.post.user.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {eventPost.post.content}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(eventPost.post.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {posts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{posts.length - 5} more posts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}