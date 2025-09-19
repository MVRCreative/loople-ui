"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Users, Globe, DollarSign, Archive, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ClubSwitcher } from "@/components/club-switcher"
import { NavUser } from "@/components/nav-user"

const navigation = [
  {
    name: "Post",
    href: "/post",
    type: "button",
  },
  {
    name: "COMMUNITY",
    type: "section",
    icon: Users,
    items: [
      { name: "Messages", href: "/messages" },
      { name: "Members", href: "/members" },
      { name: "Waitlist", href: "/waitlist" },
      { name: "Team", href: "/team" },
    ],
  },
  {
    name: "MANAGEMENT",
    type: "section",
    icon: Building,
    items: [
      { name: "Club Management", href: "/admin/club-management" },
    ],
  },
  {
    name: "ACTIVITIES",
    type: "section",
    icon: Globe,
    items: [
      { name: "Events", href: "/events" },
      { name: "Programs", href: "/programs" },
    ],
  },
  {
    name: "FINANCE",
    type: "section",
    icon: DollarSign,
    items: [
      { name: "Overview", href: "/finance/overview" },
      { name: "Payments", href: "/finance/payments" },
      { name: "Refunds", href: "/finance/refunds" },
      { name: "Payouts", href: "/finance/payouts" },
      { name: "Settings", href: "/finance/settings" },
    ],
  },
  {
    name: "ASSETS",
    type: "section",
    icon: Archive,
    items: [
      { name: "Documents", href: "/assets/documents" },
      { name: "Policies", href: "/assets/policies" },
      { name: "Audits", href: "/assets/audits" },
    ],
  },
  {
    name: "ORGANIZATION",
    type: "section",
    icon: Building,
    items: [{ name: "Settings", href: "/organization/settings" }],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <Image 
            src="/loople logo3.svg" 
            alt="Loople Logo" 
            width={32}
            height={32}
            className="h-8 w-auto"
          />
        </div>
        
        {/* Club Switcher */}
        <div className="px-6 pb-4 w-full">
          <ClubSwitcher />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            if (item.type === "button") {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href!}
                  className={cn(
                    "flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm transition-colors my-6 font-bold bg-blue-500 text-white",
                    isActive
                      ? "bg-gradient-to-r from-[#2B7AF7] to-[#253DA5] text-white"
                      : "text-white hover:bg-blue-600",
                  )}
                >
                  {item.name}
                </Link>
              )
            }

            if (item.type === "section") {
              return (
                <div key={item.name} className="space-y-1">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    {item.icon && React.createElement(item.icon, { className: "h-4 w-4 text-sidebar-foreground" })}
                    <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground">
                      {item.name}
                    </span>
                  </div>

                  {/* Section Items */}
                  <div className="space-y-0.5">
                    {item.items?.map((subItem) => {
                      const isActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          {subItem.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            }

            return null
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <NavUser 
          user={{
            name: "User",
            email: "user@example.com",
            avatar: "👤"
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
