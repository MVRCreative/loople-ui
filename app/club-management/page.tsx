"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useClub } from "@/lib/club-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  UserPlus,
  CalendarPlus,
  CreditCard,
  FileText,
  AlertCircle,
  Building2
} from "lucide-react";
import { MembersTable } from "@/components/club-management/members-table";
import { EventsTable } from "@/components/club-management/events-table";
import { RegistrationsTable } from "@/components/club-management/registrations-table";
import { PaymentsTable } from "@/components/club-management/payments-table";
import { ClubAnalytics } from "@/components/club-management/club-analytics";
import { ClubSettings } from "@/components/club-management/club-settings";
import { ClubOverview } from "@/components/club-management/club-overview";
import { CreateClubForm } from "@/components/club-management/create-club-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockClubData, mockRegistrations, mockPayments, Event as UiEvent } from "@/lib/club-mock-data";
import { MembersService, Member } from "@/lib/services/members.service";
import { CreateMemberForm } from "@/components/club-management/create-member-form";
import { InviteMemberForm } from "@/components/club-management/invite-member-form";
import { EditMemberForm } from "@/components/club-management/edit-member-form";
import { EventsService, Event as ApiEvent } from "@/lib/services/events.service";
import { CreateEventForm } from "@/components/club-management/create-event-form";
import { EditEventForm } from "@/components/club-management/edit-event-form";

export default function ClubManagementPage() {
  const { user: _user, isAuthenticated, loading: authLoading } = useAuth();
  const { selectedClub, clubs, loading: clubLoading, isOwner, isAdmin, error: clubError, refreshClubs } = useClub();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ApiEvent | null>(null);

  const mapApiEventToUiEvent = (e: ApiEvent): UiEvent => ({
    id: String(e.id),
    clubId: String(e.club_id),
    title: e.title,
    description: e.description || "",
    eventType: e.event_type as UiEvent["eventType"],
    startDate: e.start_date,
    endDate: e.end_date,
    location: e.location || "",
    maxCapacity: e.max_capacity,
    registrationDeadline: e.registration_deadline,
    priceMember: e.price_member,
    priceNonMember: e.price_non_member,
    status: e.status as UiEvent["status"],
    registeredCount: e.registered_count ?? 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Load members for selected club
  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedClub) return;
      try {
        setMembersLoading(true);
        setMembersError(null);
        const data = await MembersService.getClubMembers(selectedClub.id);
        setMembers(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load members';
        setMembersError(message);
      } finally {
        setMembersLoading(false);
      }
    };
    loadMembers();
  }, [selectedClub]);

  // Load events for selected club
  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedClub) return;
      try {
        setEventsLoading(true);
        setEventsError(null);
        const apiEvents = await EventsService.getEvents({ club_id: selectedClub.id });
        const mapped = (apiEvents || []).map(mapApiEventToUiEvent);
        setEvents(mapped);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load events';
        setEventsError(message);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    loadEvents();
  }, [selectedClub]);

  const refreshEvents = async () => {
    if (!selectedClub) return;
    try {
      setEventsLoading(true);
      const apiEvents = await EventsService.getEvents({ club_id: selectedClub.id });
      setEvents((apiEvents || []).map(mapApiEventToUiEvent));
    } finally {
      setEventsLoading(false);
    }
  };

  if (authLoading || clubLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (!selectedClub) {
    // Check if user has no clubs at all
    const hasNoClubs = !Array.isArray(clubs) || clubs.length === 0;
    
    if (hasNoClubs) {
      return (
        <div className="p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2 text-brand-primary">Welcome to Club Management</h1>
              <p className="text-muted-foreground mb-8">
                You don&apos;t have any clubs yet. Create your first club to get started with managing members, events, and more.
              </p>
            </div>
            
            {showCreateForm ? (
              <CreateClubForm 
                onSuccess={() => {
                  setShowCreateForm(false);
                  refreshClubs();
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2 text-brand-primary">Create Your First Club</h2>
                  <p className="text-muted-foreground text-center mb-6">
                    Start by creating a club to manage your swimming community.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowCreateForm(true)} size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Club
                    </Button>
                    <Button variant="outline" onClick={() => router.push("/")}>
                      Go to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    }
    
    // User has clubs but none selected
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-brand-primary">No Club Selected</h2>
            <p className="text-muted-foreground text-center mb-4">
              Please select a club from the club switcher to manage.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/")}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Club
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (clubError) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-brand-primary">Error Loading Club</h2>
            <p className="text-muted-foreground text-center mb-4">
              {clubError}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // const displayName = user?.user_metadata?.first_name && user?.user_metadata?.last_name 
  //   ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
  //   : user?.email || "User";

  // Check if user has permission to manage this club
  const canManage = isOwner || isAdmin;

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-brand-primary">Club Management</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            Manage your swimming club members, events, and finances
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs lg:text-sm">
            {selectedClub.name}
          </Badge>
          <Badge variant="secondary" className="text-xs lg:text-sm">
            {mockClubData.memberCount} Members
          </Badge>
          {!canManage && (
            <Badge variant="destructive" className="text-xs lg:text-sm">
              Read Only
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowCreateForm(true)}
            className="text-xs lg:text-sm"
          >
            <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
            Create New Club
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <ClubOverview />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger value="overview" className="text-xs lg:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="members" className="text-xs lg:text-sm">Members</TabsTrigger>
          <TabsTrigger value="events" className="text-xs lg:text-sm">Events</TabsTrigger>
          <TabsTrigger value="registrations" className="text-xs lg:text-sm">Registrations</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs lg:text-sm">Payments</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs lg:text-sm">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <ClubAnalytics />
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest club activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New member joined</p>
                      <p className="text-xs text-muted-foreground">Emma Wilson joined 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Event registration</p>
                      <p className="text-xs text-muted-foreground">Summer Championship - 15 registrations</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment received</p>
                      <p className="text-xs text-muted-foreground">$250 from John Davis</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-brand-primary">Members</h2>
              <p className="text-muted-foreground text-sm lg:text-base">Manage club members and their information</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs lg:text-sm" onClick={() => setShowInviteMember(true)}>
                <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                Invite Member
              </Button>
              <Button size="sm" className="text-xs lg:text-sm" onClick={() => setShowCreateMember(true)}>
                <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                Add Member
              </Button>
            </div>
          </div>
          {membersError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{membersError}</p>
            </div>
          )}
          <MembersTable 
            members={members} 
            onInviteClick={() => setShowInviteMember(true)}
            onEditMember={(m) => setEditingMember(m)}
            onDeleteMember={async (m) => {
              try {
                await MembersService.deleteMember(m.id);
                setMembers(prev => prev.filter(x => x.id !== m.id));
              } catch (err) {
                // no-op; could surface toast
              }
            }}
            hideActions
          />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-brand-primary">Events</h2>
              <p className="text-muted-foreground text-sm lg:text-base">Manage club events and competitions</p>
            </div>
            <Button size="sm" className="text-xs lg:text-sm" onClick={() => setShowCreateEvent(true)}>
              <CalendarPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Create Event
            </Button>
          </div>
          {eventsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{eventsError}</p>
            </div>
          )}
          {eventsLoading ? (
            <div className="text-sm text-muted-foreground">Loading events...</div>
          ) : (
            <EventsTable 
              events={events} 
              onEditEvent={(uiEvent) => {
                // Find matching api event by id in latest list
                // Map back: we only need id to fetch fresh single if desired; use existing fields
                const apiLike: ApiEvent = {
                  id: uiEvent.id,
                  club_id: uiEvent.clubId,
                  title: uiEvent.title,
                  description: uiEvent.description,
                  event_type: uiEvent.eventType as ApiEvent["event_type"],
                  start_date: uiEvent.startDate,
                  end_date: uiEvent.endDate,
                  location: uiEvent.location,
                  max_capacity: uiEvent.maxCapacity,
                  registration_deadline: uiEvent.registrationDeadline,
                  price_member: uiEvent.priceMember,
                  price_non_member: uiEvent.priceNonMember,
                  status: uiEvent.status as ApiEvent["status"],
                  registered_count: uiEvent.registeredCount,
                  created_at: "",
                  updated_at: "",
                };
                setEditingEvent(apiLike);
              }}
              onDeleteEvent={async (uiEvent) => {
                try {
                  await EventsService.deleteEvent(uiEvent.id);
                  await refreshEvents();
                } catch {}
              }}
              onViewRegistrations={() => setActiveTab("registrations")}
              onCreateEvent={() => setShowCreateEvent(true)}
              readOnly={!canManage}
            />
          )}
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-brand-primary">Registrations</h2>
              <p className="text-muted-foreground text-sm lg:text-base">Track event registrations and attendance</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs lg:text-sm">
              <FileText className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Export Report
            </Button>
          </div>
          <RegistrationsTable registrations={mockRegistrations} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-brand-primary">Payments</h2>
              <p className="text-muted-foreground text-sm lg:text-base">Track payments and financial transactions</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs lg:text-sm">
                <FileText className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" className="text-xs lg:text-sm">
                <CreditCard className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                Process Refund
              </Button>
            </div>
          </div>
          <PaymentsTable payments={mockPayments} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-brand-primary">Club Settings</h2>
            <p className="text-muted-foreground text-sm lg:text-base">Configure club information and preferences</p>
          </div>
          {canManage ? (
            <ClubSettings clubData={{
              ...mockClubData,
              name: selectedClub.name,
              subdomain: selectedClub.subdomain,
              description: selectedClub.description || '',
              contactEmail: selectedClub.contact_email || '',
              contactPhone: selectedClub.contact_phone || '',
              address: selectedClub.address || '',
              city: selectedClub.city || '',
              state: selectedClub.state || '',
              zipCode: selectedClub.zip_code || '',
            }} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                <p className="text-muted-foreground text-center">
                  You don&apos;t have permission to modify club settings. Only club owners and admins can access this section.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Club Dialog */
      }
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
          </DialogHeader>
          <CreateClubForm 
            onSuccess={() => {
              setShowCreateForm(false);
              refreshClubs();
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
          </DialogHeader>
          <CreateEventForm onSuccess={async () => { setShowCreateEvent(false); await refreshEvents(); }} onCancel={() => setShowCreateEvent(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) setEditingEvent(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingEvent && (
            <EditEventForm 
              event={editingEvent} 
              onSuccess={async () => { setEditingEvent(null); await refreshEvents(); }} 
              onCancel={() => setEditingEvent(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteMember} onOpenChange={setShowInviteMember}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <InviteMemberForm onSuccess={async () => {
            setShowInviteMember(false);
          }} onCancel={() => setShowInviteMember(false)} />
        </DialogContent>
      </Dialog>

      {/* Create Member Dialog */}
      <Dialog open={showCreateMember} onOpenChange={setShowCreateMember}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <CreateMemberForm onSuccess={async () => {
            setShowCreateMember(false);
            if (selectedClub) {
              const refreshed = await MembersService.getClubMembers(selectedClub.id);
              setMembers(Array.isArray(refreshed) ? refreshed : []);
            }
          }} onCancel={() => setShowCreateMember(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => { if (!open) setEditingMember(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {editingMember && (
            <EditMemberForm member={editingMember} onSuccess={async () => {
              setEditingMember(null);
              if (selectedClub) {
                const refreshed = await MembersService.getClubMembers(selectedClub.id);
                setMembers(Array.isArray(refreshed) ? refreshed : []);
              }
            }} onCancel={() => setEditingMember(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
