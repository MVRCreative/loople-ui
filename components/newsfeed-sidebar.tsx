"use client"

import * as React from "react"
import { Home, Bell, User, Settings, LogOut, Moon, Users, MessageSquare } from "lucide-react"
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

  const displayEmail = user?.email || "Not signed in"

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="flex h-screen w-[240px] sm:w-[280px] flex-col bg-background border-r border-border sticky top-0 overflow-y-auto">
      {/* Logo (Andrew) */}
      <div className="flex h-16 w-full items-center px-4">
        <Link href="/" className="flex items-center">
          <img
            src="/loople logo3.svg"
            alt="Loople Logo"
            className="h-8 w-auto"
          />
        </Link>
      </div>

      {/* Club Switcher */}
      <div className="px-2 sm:px-3 md:px-4 pb-2 w-full">
        <ClubSwitcher />
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-1 sm:px-2 md:px-3 py-2 sm:py-3 md:py-4">
        <div className="space-y-0.5 sm:space-y-1">
          {navigation.map((item) => {
            const isActive = item.href && item.href !== "#" && pathname === item.href
            const content = (
              <>
                <item.icon
                  className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className={`text-xs sm:text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                  {item.name}
                </span>
                {item.badge && (
                  <div className="ml-auto flex h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] md:text-[11px] text-white font-semibold">
                    {item.badge}
                  </div>
                )}
              </>
            )

            return (
              <div key={item.name} className="relative">
                {item.href && item.href !== "#" ? (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-10 md:h-12 px-1 sm:px-2 md:px-3 rounded-lg transition-all duration-200 ${
                      isActive ? "bg-accent hover:bg-accent/80" : "hover:bg-accent"
                    }`}
                    asChild
                  >
                    <Link href={item.href}>{content}</Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-10 md:h-12 px-1 sm:px-2 md:px-3 rounded-lg hover:bg-accent transition-all duration-200"
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

      {/* Theme toggle and auth */}
      <div className="flex flex-col gap-1 sm:gap-2 px-1 sm:px-2 md:px-3 py-2 sm:py-3 md:py-4 border-t border-border">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-3 py-1 sm:py-2 rounded-lg hover:bg-accent transition-colors duration-200">
          <Moon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground" />
          <span className="text-xs sm:text-sm text-foreground">Dark Mode</span>
          <div className="ml-auto">
            <ThemeSwitch />
          </div>
        </div>

        <div className="px-1 sm:px-2 md:px-3 py-1 text-[9px] sm:text-[10px] md:text-[11px] text-muted-foreground">
          {isAuthenticated ? `Signed in as ${displayEmail}` : "Not signed in"}
        </div>

        {isAuthenticated ? (
          <Button
            variant="ghost"
            className="w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-9 md:h-10 px-1 sm:px-2 md:px-3 rounded-lg hover:bg-accent transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground" />
            <span className="text-xs sm:text-sm text-foreground">Sign Out</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-9 md:h-10 px-1 sm:px-2 md:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            asChild
          >
            <Link href="/auth/login">
              <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-foreground">Sign In</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

