"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  FileText
} from "lucide-react";
import { MembersTable } from "@/components/club-management/members-table";
import { EventsTable } from "@/components/club-management/events-table";
import { RegistrationsTable } from "@/components/club-management/registrations-table";
import { PaymentsTable } from "@/components/club-management/payments-table";
import { ClubAnalytics } from "@/components/club-management/club-analytics";
import { ClubSettings } from "@/components/club-management/club-settings";
import { mockClubData, mockMembers, mockEvents, mockRegistrations, mockPayments } from "@/lib/club-mock-data";

export default function ClubManagementPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
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

  const displayName = user?.user_metadata?.first_name && user?.user_metadata?.last_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : user?.email || "User";

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
            {mockClubData.name}
          </Badge>
          <Badge variant="secondary" className="text-xs lg:text-sm">
            {mockClubData.memberCount} Members
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Total Members</CardTitle>
            <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{mockClubData.memberCount}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{mockClubData.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">
              Next: Summer Championship
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">${mockClubData.monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Active Programs</CardTitle>
            <BarChart3 className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{mockClubData.activePrograms}</div>
            <p className="text-xs text-muted-foreground">
              3 competitive, 2 recreational
            </p>
          </CardContent>
        </Card>
      </div>

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
          <ClubSettings clubData={mockClubData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
