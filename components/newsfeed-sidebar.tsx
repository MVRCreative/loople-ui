"use client"

import * as React from "react"
import { Home, Bell, User, Settings, LogOut, Moon, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeSwitch } from "@/components/ui/theme-switch"
import { ClubSwitcher } from "@/components/club-switcher"
import { useAuth } from "@/lib/auth-context"
import { UsersService } from "@/lib/services/users.service"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const baseNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Programs", href: "#", icon: Users },
  { name: "Events", href: "/events", icon: Bell },
  { name: "Messages", href: "/messages", icon: MessageSquare, badge: "3" },
  { name: "Notifications", href: "#", icon: Bell, badge: "5" },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function NewsfeedSidebar() {
  const { user, isAuthenticated, signOut } = useAuth()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)
  
  // Use real auth user data if available
  const displayEmail = user?.email || "Not signed in"
  
  // Load user profile to get username
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadUserProfile = async () => {
        try {
          setIsLoadingProfile(true)
          const profile = await UsersService.getUserProfile()
          setUserProfile(profile)
        } catch (error) {
          console.error('Error loading user profile:', error)
        } finally {
          setIsLoadingProfile(false)
        }
      }
      
      loadUserProfile()
    }
  }, [isAuthenticated, user])

  // Create navigation with dynamic profile link
  const navigation = React.useMemo(() => {
    const nav = [...baseNavigation]
    
    if (isAuthenticated && userProfile) {
      if (userProfile.username) {
        // Insert profile link before settings
        nav.splice(-1, 0, { 
          name: "Profile", 
          href: `/profile/${userProfile.username}`, 
          icon: User 
        })
      } else {
        // Add profile button without href for users without username
        nav.splice(-1, 0, { 
          name: "Profile", 
          href: null, 
          icon: User,
          needsUsername: true
        })
      }
    }
    
    return nav
  }, [isAuthenticated, userProfile])

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!userProfile?.username) {
      e.preventDefault()
      setShowUsernameDialog(true)
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="flex h-screen w-[275px] flex-col bg-background border-r border-border sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex h-12 sm:h-14 md:h-16 w-full items-center px-2 sm:px-3 md:px-4 border-b border-border">
        <Link href="/" className="flex items-center">
          <Image 
            src="/loople logo3.svg" 
            alt="Loople Logo" 
            width={32}
            height={32}
            className="h-6 w-auto sm:h-7 md:h-8"
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
                <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                <span className={`text-xs sm:text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{item.name}</span>
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
                    className={`group w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-10 md:h-12 px-1 sm:px-2 md:px-3 rounded-lg transition-all duration-350 ease-in-out hover:scale-[1.05] hover:bg-muted ${
                      isActive 
                        ? 'bg-muted' 
                        : ''
                    }`}
                    asChild
                  >
                    <Link href={item.href}>{content}</Link>
                  </Button>
                ) : item.needsUsername ? (
                  <Button
                    variant="ghost"
                    className="group w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-10 md:h-12 px-1 sm:px-2 md:px-3 rounded-lg transition-all duration-350 ease-in-out hover:scale-[1.05] hover:bg-muted"
                    onClick={handleProfileClick}
                  >
                    {content}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="group w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-10 md:h-12 px-1 sm:px-2 md:px-3 rounded-lg transition-all duration-350 ease-in-out hover:scale-[1.05] hover:bg-muted"
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
      <div className="flex flex-col gap-1 sm:gap-2 px-1 sm:px-2 md:px-3 py-2 sm:py-3 md:py-4 border-t border-border">
        <div className="group flex items-center gap-1 sm:gap-2 md:gap-3 px-1 sm:px-2 md:px-3 py-1 sm:py-2 rounded-lg transition-all duration-350 ease-in-out hover:scale-[1.05] hover:bg-muted">
          <Moon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span className="text-xs sm:text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">Dark Mode</span>
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
            className="group w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-9 md:h-10 px-1 sm:px-2 md:px-3 rounded-lg transition-all duration-350 ease-in-out hover:scale-[1.05] hover:bg-muted" 
            onClick={handleLogout}
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            <span className="text-xs sm:text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">Sign Out</span>
          </Button>
        ) : (
          <Button variant="ghost" className="group w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-9 md:h-10 px-1 sm:px-2 md:px-3 rounded-lg transition-all duration-350 ease-in-out hover:scale-[1.05] hover:bg-muted" asChild>
            <Link href="/auth/login">
              <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              <span className="text-xs sm:text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">Sign In</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Username Setup Dialog */}
      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Your Profile</DialogTitle>
            <DialogDescription>
              You need to set up a username to access your profile page. This will be your unique identifier on the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Go to Settings to set up your username and complete your profile.
            </p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowUsernameDialog(false)}
              >
                Cancel
              </Button>
              <Button asChild>
                <Link href="/settings" onClick={() => setShowUsernameDialog(false)}>
                  Go to Settings
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
