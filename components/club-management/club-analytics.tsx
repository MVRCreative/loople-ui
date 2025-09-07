"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";

export function ClubAnalytics() {
  const analyticsData = {
    totalRevenue: 12500,
    revenueChange: 12.5,
    totalMembers: 45,
    membersChange: 8.2,
    upcomingEvents: 3,
    eventsChange: -2,
    activeRegistrations: 15,
    registrationsChange: 25.0,
  };

  const recentActivity = [
    {
      type: "member",
      action: "New member joined",
      details: "Emma Wilson",
      time: "2 hours ago",
      change: "+1"
    },
    {
      type: "event",
      action: "Event registration",
      details: "Summer Championship - 15 registrations",
      time: "4 hours ago",
      change: "+15"
    },
    {
      type: "payment",
      action: "Payment received",
      details: "$250 from John Davis",
      time: "6 hours ago",
      change: "+$250"
    },
    {
      type: "member",
      action: "Member updated",
      details: "Michael Brown profile updated",
      time: "1 day ago",
      change: "updated"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "member":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "event":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 lg:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold">${analyticsData.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getChangeIcon(analyticsData.revenueChange)}
              <span className="ml-1">{analyticsData.revenueChange > 0 ? '+' : ''}{analyticsData.revenueChange}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Active Members</CardTitle>
            <Users className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold">{analyticsData.totalMembers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getChangeIcon(analyticsData.membersChange)}
              <span className="ml-1">{analyticsData.membersChange > 0 ? '+' : ''}{analyticsData.membersChange}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold">{analyticsData.upcomingEvents}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getChangeIcon(analyticsData.eventsChange)}
              <span className="ml-1">{analyticsData.eventsChange > 0 ? '+' : ''}{analyticsData.eventsChange} from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium">Active Registrations</CardTitle>
            <Activity className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold">{analyticsData.activeRegistrations}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getChangeIcon(analyticsData.registrationsChange)}
              <span className="ml-1">{analyticsData.registrationsChange > 0 ? '+' : ''}{analyticsData.registrationsChange}% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest club activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {activity.change}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
