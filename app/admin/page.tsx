"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-list"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Users, Calendar, BarChart3, Settings, Activity, TrendingUp } from "lucide-react"

export default function AdminPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center gap-4">
            <ThemeSwitch />
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 flex-col gap-4 p-7 pt-8">
        <div className="text-left space-y-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Manage your swimming club operations and monitor performance
            </p>
          </div>
        </div>

        <AnimatedList className="space-y-6" staggerDelay={0.1}>
          {/* Stats Overview */}
          <AnimatedListItem>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    3 upcoming this week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% from last week
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$12,450</div>
                  <p className="text-xs text-muted-foreground">
                    +8.2% from last month
                  </p>
                </CardContent>
              </Card>
            </div>
          </AnimatedListItem>

          {/* Quick Actions */}
          <AnimatedListItem>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common administrative tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Reports
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Club Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimatedListItem>

          {/* Recent Activity */}
          <AnimatedListItem>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and member activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New member registration</p>
                      <p className="text-xs text-muted-foreground">Sarah Johnson joined the club</p>
                    </div>
                    <Badge variant="secondary">2 min ago</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Event created</p>
                      <p className="text-xs text-muted-foreground">Summer Swim Meet scheduled for July 15</p>
                    </div>
                    <Badge variant="secondary">1 hour ago</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment received</p>
                      <p className="text-xs text-muted-foreground">Monthly membership fee from 23 members</p>
                    </div>
                    <Badge variant="secondary">3 hours ago</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedListItem>

          {/* Upcoming Events */}
          <AnimatedListItem>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  Events scheduled for the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Swimming Lessons - Beginners</p>
                      <p className="text-sm text-muted-foreground">Every Tuesday & Thursday</p>
                    </div>
                    <Badge>Ongoing</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Competition Team Practice</p>
                      <p className="text-sm text-muted-foreground">Every Monday, Wednesday, Friday</p>
                    </div>
                    <Badge variant="secondary">Ongoing</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Summer Swim Meet</p>
                      <p className="text-sm text-muted-foreground">July 15, 2024</p>
                    </div>
                    <Badge variant="outline">Upcoming</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedListItem>
        </AnimatedList>
      </main>
    </SidebarInset>
  )
}
