"use client"

import * as React from "react"
import {
  Command,
  Frame,
  LifeBuoy,
  Send,
  SquareTerminal,
  Palette,
  Play,
} from "lucide-react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Loople Admin",
    email: "admin@loople.com",
    avatar: "🏊‍♂️",
  },
  navMain: [
    {
      title: "Newsfeed",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Recent Posts",
          url: "/",
        },
        {
          title: "Events",
          url: "/",
        },
        {
          title: "Polls",
          url: "/",
        },
      ],
    },
    {
      title: "Admin Dashboard",
      url: "/admin",
      icon: Frame,
      items: [
        {
          title: "Overview",
          url: "/admin",
        },
        {
          title: "Members",
          url: "/admin",
        },
        {
          title: "Events",
          url: "/admin",
        },
        {
          title: "Analytics",
          url: "/admin",
        },
      ],
    },
    {
      title: "Club Management",
      url: "/admin",
      icon: Palette,
      items: [
        {
          title: "Members",
          url: "/admin",
        },
        {
          title: "Events",
          url: "/admin",
        },
        {
          title: "Settings",
          url: "/admin",
        },
      ],
    },
    {
      title: "Animations",
      url: "/animations",
      icon: Play,
      items: [
        {
          title: "Page Transitions",
          url: "/animations",
        },
        {
          title: "Component Animations",
          url: "/animations",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Newsfeed",
      url: "/",
      icon: SquareTerminal,
    },
    {
      name: "Admin Panel",
      url: "/admin",
      icon: Frame,
    },
    {
      name: "Animations",
      url: "/animations",
      icon: Play,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Loople</span>
                  <span className="truncate text-xs">Swimming Club</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
