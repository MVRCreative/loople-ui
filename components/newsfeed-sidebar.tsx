"use client"

import * as React from "react"
import { Command, Home, Bell, User, Settings, LogOut, Moon, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { ClubSwitcher } from "@/components/club-switcher"
import { useAuth } from "@/lib/auth-context"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Programs", href: "#", icon: Users },
  { name: "Events", href: "#", icon: Bell },
  { name: "Messages", href: "/messages", icon: MessageSquare, badge: "3" },
  { name: "Notifications", href: "#", icon: Bell, badge: "5" },
  { name: "Profile", href: "/profile/ricardo-cooper", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function NewsfeedSidebar() {
  const { user, isAuthenticated, signOut } = useAuth()
  const pathname = usePathname()
  
  // Use real auth user data if available
  const displayEmail = user?.email || "Not signed in"
  const displayName = user?.user_metadata?.first_name && user?.user_metadata?.last_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : user?.email || "Guest"

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="flex h-screen w-[275px] flex-col bg-background border-r border-sidebar-border sticky top-0">
      {/* Logo */}
      <div className="flex h-16 w-full items-center px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Command className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg">Loople</span>
        </Link>
      </div>

      {/* Club Switcher */}
      <div className="px-4 pb-2">
        <ClubSwitcher />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href && item.href !== "#" && pathname === item.href
            const content = (
              <>
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {item.badge}
                  </div>
                )}
              </>
            )

            return (
              <div key={item.name} className="relative">
                {item.href && item.href !== "#" ? (
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-10"
                    asChild
                  >
                    <Link href={item.href}>{content}</Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10"
                    onClick={(e) => e.preventDefault()}
                  >
                    {content}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      <Separator />

      {/* Theme toggle and logout */}
      <div className="flex flex-col gap-2 px-3 py-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <Moon className="h-5 w-5" />
          <span>Dark Mode</span>
          <div className="ml-auto">
            <ThemeSwitch />
          </div>
        </div>
        <div className="px-3 py-1 text-[11px] text-muted-foreground">
          {isAuthenticated ? `Signed in as ${displayEmail}` : "Not signed in"}
        </div>
        {isAuthenticated ? (
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 h-10" 
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        ) : (
          <Button variant="outline" className="w-full justify-start gap-3 h-10" asChild>
            <Link href="/auth/login">
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
