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
  // const _displayName = user?.user_metadata?.first_name && user?.user_metadata?.last_name 
  //   ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
  //   : user?.email || "Guest"

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="flex h-screen w-[240px] sm:w-[280px] flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex h-12 sm:h-14 md:h-16 w-full items-center px-2 sm:px-3 md:px-4 border-b border-gray-200 dark:border-gray-700">
        <Link href="/" className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Command className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4" />
          </div>
          <span className="font-bold text-sm sm:text-base md:text-lg text-gray-900 dark:text-white">Loople</span>
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
                <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${isActive ? 'text-blue-600' : 'text-gray-600 dark:text-gray-300'}`} />
                <span className={`text-xs sm:text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>{item.name}</span>
                {item.badge && (
                  <div className="ml-auto flex h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-semibold">
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
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    asChild
                  >
                    <Link href={item.href}>{content}</Link>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-10 md:h-12 px-1 sm:px-2 md:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
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
      <div className="flex flex-col gap-1 sm:gap-2 px-1 sm:px-2 md:px-3 py-2 sm:py-3 md:py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-3 py-1 sm:py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
          <Moon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-300" />
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">Dark Mode</span>
          <div className="ml-auto">
            <ThemeSwitch />
          </div>
        </div>
        <div className="px-1 sm:px-2 md:px-3 py-1 text-[9px] sm:text-[10px] md:text-[11px] text-gray-500 dark:text-gray-400">
          {isAuthenticated ? `Signed in as ${displayEmail}` : "Not signed in"}
        </div>
        {isAuthenticated ? (
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-9 md:h-10 px-1 sm:px-2 md:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200" 
            onClick={handleLogout}
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-300" />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">Sign Out</span>
          </Button>
        ) : (
          <Button variant="ghost" className="w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-9 md:h-10 px-1 sm:px-2 md:px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200" asChild>
            <Link href="/auth/login">
              <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-600 dark:text-gray-300" />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-200">Sign In</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
