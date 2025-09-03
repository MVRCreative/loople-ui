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
    name: "Design System",
    email: "design@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Overview",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Design Tokens",
          url: "/#tokens",
        },
        {
          title: "Components",
          url: "/#components",
        },
        {
          title: "Forms",
          url: "/#forms",
        },
        {
          title: "Tables",
          url: "/#tables",
        },
      ],
    },
    {
      title: "Components",
      url: "/#components",
      icon: Frame,
      items: [
        {
          title: "Buttons",
          url: "/#components",
        },
        {
          title: "Forms",
          url: "/#forms",
        },
        {
          title: "Tables",
          url: "/#tables",
        },
        {
          title: "Navigation",
          url: "/#components",
        },
      ],
    },
    {
      title: "Design System",
      url: "/#tokens",
      icon: Palette,
      items: [
        {
          title: "Color Tokens",
          url: "/#tokens",
        },
        {
          title: "Typography",
          url: "/#tokens",
        },
        {
          title: "Spacing",
          url: "/#tokens",
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
      name: "Design Tokens",
      url: "/#tokens",
      icon: Palette,
    },
    {
      name: "Component Library",
      url: "/#components",
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
                  <span className="truncate font-medium">Mover Labs</span>
                  <span className="truncate text-xs">Design system</span>
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
