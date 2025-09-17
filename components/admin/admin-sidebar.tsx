"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuContent, 
  NavigationMenuTrigger, 
  NavigationMenuLink 
} from "@/components/ui/navigation-menu"
import { ClubSwitcher } from "@/components/club-switcher"
import { adminNavigation, adminSecondaryNavigation } from "./admin-navigation"
import { useAuth } from "@/lib/auth-context"

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-2">
      <div className="relative flex h-16 shrink-0 items-center">
        <img
          alt="Loople"
          src="/loople logo3.svg"
          className="h-8 w-auto"
        />
      </div>
      
      <nav className="relative flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-colors',
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className={cn(
                          isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground',
                          'size-6 shrink-0',
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          
          <li>
            <div className="text-xs/6 font-semibold text-muted-foreground">System</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {adminSecondaryNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-colors',
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className={cn(
                          isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground',
                          'size-6 shrink-0',
                        )}
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          
          <li className="mt-auto">
            <div className="px-6 py-4">
              <ClubSwitcher />
            </div>
          </li>
          
          <li className="-mx-6 mt-auto">
            <Link
              href="/profile"
              className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <div className="size-8 rounded-full bg-muted outline -outline-offset-1 outline-border flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <span className="sr-only">Your profile</span>
              <span aria-hidden="true">
                {user?.user_metadata?.first_name || user?.email || 'User'}
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
