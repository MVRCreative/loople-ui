"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { useClub } from "@/lib/club-context";
import { MembersService, Member } from "@/lib/services/members.service";
import { EventsService } from "@/lib/services/events.service";
import Link from "next/link";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";

const tabs = [
  { name: "Overview", href: "/admin", current: true },
  { name: "Club Management", href: "/admin/club-management", current: false },
  { name: "User Management", href: "/admin/users", current: false },
  { name: "Reports", href: "/admin/reports", current: false },
];

function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function statusVariant(status: Member["status"]): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "pending":
      return "secondary";
    case "inactive":
    case "suspended":
    case "canceled":
      return "destructive";
    default:
      return "outline";
  }
}

export default function AdminPage() {
  const { selectedClub, clubs, loading: clubLoading } = useClub();
  const [members, setMembers] = useState<Member[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);

  const loadOverviewData = useCallback(async () => {
    if (!selectedClub?.id) return;
    setDataLoading(true);
    try {
      const [fetchedMembers, fetchedEvents] = await Promise.allSettled([
        MembersService.getClubMembers(selectedClub.id),
        EventsService.getEvents({ club_id: selectedClub.id, is_active: true }),
      ]);

      if (fetchedMembers.status === "fulfilled") {
        setMembers(fetchedMembers.value);
      } else {
        console.error("Failed to load members:", fetchedMembers.reason);
        setMembers([]);
      }

      if (fetchedEvents.status === "fulfilled") {
        setEventCount(fetchedEvents.value.length);
      } else {
        console.error("Failed to load events:", fetchedEvents.reason);
        setEventCount(0);
      }
    } catch (err) {
      console.error("Error loading overview data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [selectedClub?.id]);

  useEffect(() => {
    if (selectedClub?.id && !clubLoading) {
      loadOverviewData();
    }
  }, [selectedClub?.id, clubLoading, loadOverviewData]);

  if (clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <Loader className="mx-auto" />
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="space-y-6 -m-6 p-6">
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <Card>
          <CardContent className="text-center py-16 px-6">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Select or create a club to see your overview
            </h3>
            <p className="text-muted-foreground mb-6">
              Choose a club from the switcher or create your first club to view
              stats and manage your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/admin/club-management?action=create">
                  Create New Club
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/club-management">Go to Club Management</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.status === "active");

  const stats = [
    {
      name: "Total Clubs",
      value: Array.isArray(clubs) ? clubs.length : 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      name: "Active Members",
      value: activeMembers.length,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      name: "Upcoming Events",
      value: eventCount,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      name: "Total Members",
      value: members.length,
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const displayMembers = members.slice(0, 10);

  return (
    <div className="space-y-6 -m-6 p-6">
      {/* Page Heading */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-foreground">
            {selectedClub.name} — Overview
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A summary of your club&apos;s members, events, and activity.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button asChild>
            <Link href="/admin/users">Manage Members</Link>
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dataLoading ? "—" : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Section */}
      <div>
        <div className="hidden sm:block">
          <div className="border-b border-border">
            <nav aria-label="Tabs" className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  aria-current={tab.current ? "page" : undefined}
                  className={classNames(
                    tab.current
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                    "border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap"
                  )}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="mt-8 flow-root">
        {dataLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Loader className="mx-auto mb-4" />
            <p>Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">
              No members yet
            </p>
            <p className="text-sm mt-1">
              Add members from the User Management page.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/admin/users">Go to User Management</Link>
            </Button>
          </div>
        ) : (
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="relative min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-foreground sm:pl-0"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-foreground"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-foreground"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-foreground"
                    >
                      Role
                    </th>
                    <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-0">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {displayMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="py-5 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-0">
                        <div className="flex items-center">
                          <div className="size-11 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {member.email ? (
                              <Image
                                alt={`${member.first_name} ${member.last_name}`}
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.first_name)}+${encodeURIComponent(member.last_name)}&background=random&size=44`}
                                width={44}
                                height={44}
                                className="size-11 rounded-full"
                              />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-foreground">
                              {member.first_name} {member.last_name}
                            </div>
                            <div className="mt-1 text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-5 text-sm whitespace-nowrap text-muted-foreground">
                        {member.email}
                      </td>
                      <td className="px-3 py-5 text-sm whitespace-nowrap">
                        <Badge variant={statusVariant(member.status)}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-5 text-sm whitespace-nowrap text-muted-foreground capitalize">
                        {member.role || member.member_type || "Member"}
                      </td>
                      <td className="py-5 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="text-primary hover:text-primary/80"
                        >
                          View
                          <span className="sr-only">
                            , {member.first_name} {member.last_name}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length > 10 && (
                <div className="mt-4 text-center">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/users">
                      View all {members.length} members
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
