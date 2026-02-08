"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3,
  ChevronDownIcon
} from "lucide-react";
import { useClub } from "@/lib/club-context";
import Link from "next/link";

const tabs = [
  { name: 'Overview', href: '#', current: true },
  { name: 'Club Management', href: '/admin/club-management', current: false },
  { name: 'User Management', href: '#', current: false },
  { name: 'Reports', href: '#', current: false },
]

const people = [
  {
    name: 'Lindsay Walton',
    title: 'Front-end Developer',
    department: 'Optimization',
    email: 'lindsay.walton@example.com',
    role: 'Member',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Courtney Henry',
    title: 'Designer',
    department: 'Intranet',
    email: 'courtney.henry@example.com',
    role: 'Admin',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Tom Cook',
    title: 'Director of Product',
    department: 'Directives',
    email: 'tom.cook@example.com',
    role: 'Member',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Whitney Francis',
    title: 'Copywriter',
    department: 'Program',
    email: 'whitney.francis@example.com',
    role: 'Admin',
    image: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Leonard Krasner',
    title: 'Senior Designer',
    department: 'Mobility',
    email: 'leonard.krasner@example.com',
    role: 'Owner',
    image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Floyd Miles',
    title: 'Principal Designer',
    department: 'Security',
    email: 'floyd.miles@example.com',
    role: 'Member',
    image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
]

function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AdminPage() {
  const { selectedClub, clubs, loading: clubLoading } = useClub();

  if (clubLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Loading...</p>
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
            <h3 className="text-lg font-medium mb-2">Select or create a club to see your overview</h3>
            <p className="text-muted-foreground mb-6">
              Choose a club from the switcher or create your first club to view stats and manage your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/admin/club-management?action=create">Create New Club</Link>
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
      value: "1,234",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      name: "Upcoming Events",
      value: "12",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      name: "Monthly Revenue",
      value: "$12,345",
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6 -m-6 p-6">
      {/* Page Heading */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-foreground">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A list of all the users in your account including their name, title, email and role.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Add user
          </button>
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
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Section */}
      <div>
        <div className="grid grid-cols-1 sm:hidden">
          <select
            defaultValue={tabs.find((tab) => tab.current)?.name}
            aria-label="Select a tab"
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-background py-2 pr-8 pl-3 text-base text-foreground outline-1 -outline-offset-1 outline-border focus:outline-2 focus:-outline-offset-2 focus:outline-primary"
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-muted-foreground"
          />
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-border">
            <nav aria-label="Tabs" className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <a
                  key={tab.name}
                  href={tab.href}
                  aria-current={tab.current ? 'page' : undefined}
                  className={classNames(
                    tab.current
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                    'border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap',
                  )}
                >
                  {tab.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="relative min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-foreground sm:pl-0">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                    Title
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                    Role
                  </th>
                  <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-0">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {people.map((person) => (
                  <tr key={person.email}>
                    <td className="py-5 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-0">
                      <div className="flex items-center">
                        <div className="size-11 shrink-0">
                          <Image alt="" src={person.image} width={44} height={44} className="size-11 rounded-full" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-foreground">{person.name}</div>
                          <div className="mt-1 text-muted-foreground">{person.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-muted-foreground">
                      <div className="text-foreground">{person.title}</div>
                      <div className="mt-1 text-muted-foreground">{person.department}</div>
                    </td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-muted-foreground">
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                        Active
                      </span>
                    </td>
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-muted-foreground">{person.role}</td>
                    <td className="py-5 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                      <a href="#" className="text-primary hover:text-primary/80">
                        Edit<span className="sr-only">, {person.name}</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}