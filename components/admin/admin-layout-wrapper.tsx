"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { adminNavigation, adminSecondaryNavigation } from "./admin-navigation"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ClubSwitcher } from "@/components/club-switcher"

interface AdminLayoutWrapperProps {
  children: React.ReactNode
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <Sidebar 
          collapsible="offcanvas"
          className="[&>div]:border-r-0"
        >
          <SidebarHeader>
            <div className="flex h-16 items-center px-6">
              <Image
                alt="Loople"
                src="/loople logo3.svg"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
            </div>
            <div className="px-3 pb-3">
              <ClubSwitcher ownerOnly className="w-full" />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-3 py-4">
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton 
                          asChild
                          isActive={isActive}
                          className={cn(
                            "w-full justify-start",
                            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <a href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminSecondaryNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton 
                          asChild
                          isActive={isActive}
                          className={cn(
                            "w-full justify-start",
                            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <a href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.user_metadata?.first_name || user?.email || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Administrator
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content with Rounded Container */}
          <main className="flex-1 overflow-auto p-6 bg-sidebar">
            <div className="w-full">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
