"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useClub, useRequireClub } from "@/lib/club-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Plus,
  Settings,
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
import { mockClubData, mockMembers, mockEvents, mockRegistrations, mockPayments } from "@/lib/club-mock-data";

export default function ClubManagementPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { selectedClub, clubs, loading: clubLoading, isOwner, isAdmin, error: clubError, refreshClubs } = useClub();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

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
              <h1 className="text-3xl font-bold mb-2">Welcome to Club Management</h1>
              <p className="text-muted-foreground mb-8">
                You don't have any clubs yet. Create your first club to get started with managing members, events, and more.
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
                  <h2 className="text-xl font-semibold mb-2">Create Your First Club</h2>
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
            <h2 className="text-xl font-semibold mb-2">No Club Selected</h2>
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
            <h2 className="text-xl font-semibold mb-2">Error Loading Club</h2>
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

  const displayName = user?.user_metadata?.first_name && user?.user_metadata?.last_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : user?.email || "User";

  // Check if user has permission to manage this club
  const canManage = isOwner || isAdmin;

  return (
    <div className="p-4 lg:p-6 space-y-6 w-full max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Club Management</h1>
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
              <h2 className="text-xl lg:text-2xl font-bold">Members</h2>
              <p className="text-muted-foreground text-sm lg:text-base">Manage club members and their information</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs lg:text-sm">
                <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                Invite Member
              </Button>
              <Button size="sm" className="text-xs lg:text-sm">
                <Plus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                Add Member
              </Button>
            </div>
          </div>
          <MembersTable members={mockMembers} />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Events</h2>
              <p className="text-muted-foreground text-sm lg:text-base">Manage club events and competitions</p>
            </div>
            <Button size="sm" className="text-xs lg:text-sm">
              <CalendarPlus className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Create Event
            </Button>
          </div>
          <EventsTable events={mockEvents} />
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">Registrations</h2>
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
              <h2 className="text-xl lg:text-2xl font-bold">Payments</h2>
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
            <h2 className="text-xl lg:text-2xl font-bold">Club Settings</h2>
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
                  You don't have permission to modify club settings. Only club owners and admins can access this section.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Club Dialog */}
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
    </div>
  );
}
