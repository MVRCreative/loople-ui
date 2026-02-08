"use client"

import * as React from "react"
import { Home, Bell, User, Settings, LogOut, Users, MessageSquare, MoreVertical, Building2, Plus, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { UsersService } from "@/lib/services/users.service"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useClub } from "@/lib/club-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type NavigationItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  needsUsername?: boolean
}

const baseNavigation: NavigationItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Programs", href: "/programs", icon: Users },
  { name: "Events", href: "/events", icon: Bell },
  { name: "Messages", href: "/messages", icon: MessageSquare, badge: "3" },
  { name: "Notifications", href: "#", icon: Bell, badge: "5" },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function NewsfeedSidebar() {
  const { user, isAuthenticated, signOut } = useAuth()
  const { clubs, selectedClub, selectClub } = useClub()
  const pathname = usePathname()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<{ username?: string | null; avatar_url?: string | null } | null>(null)
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)
  
  // Use real auth user data if available
  const displayName = user?.user_metadata?.first_name && user?.user_metadata?.last_name 
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    : user?.email || "Guest"
  
  // Load user profile to get username and avatar
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadUserProfile = async () => {
        try {
          const profile = await UsersService.getUserProfile()
          setUserProfile(profile)
        } catch (error) {
          console.error('Error loading user profile:', error)
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
          href: "#", 
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

  const handleClubSwitch = (club: typeof selectedClub) => {
    if (club) {
      selectClub(club)
    }
  }

  const handleClubManagement = () => {
    router.push("/admin/club-management")
  }

  const handleCreateClub = () => {
    router.push("/admin/club-management?action=create")
  }

  return (
    <div className="flex h-screen w-[275px] flex-col bg-background border-r border-border sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex h-12 sm:h-14 md:h-16 w-full items-center px-1 sm:px-2 md:px-3">
        <Link href="/" className="flex items-center">
          {/* Light mode logo */}
          <Image 
            src="/app/loople-logo3.svg" 
            alt="Loople Logo" 
            width={32}
            height={32}
            className="h-6 w-auto sm:h-7 md:h-8 dark:hidden"
          />
          {/* Dark mode logo */}
          <Image 
            src="/app/loople-logo-white.svg" 
            alt="Loople Logo" 
            width={32}
            height={32}
            className="hidden h-6 w-auto sm:h-7 md:h-8 dark:block"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-1 sm:px-2 md:px-3 py-2 sm:py-3 md:py-4">
        <div className="space-y-0.5 sm:space-y-1">
          {navigation.map((item) => {
            const isActive = item.href && item.href !== "#" && pathname === item.href
            const content = (
              <>
                <div className="relative">
                  <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                  {item.badge && (
                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-500 border border-background" />
                  )}
                </div>
                <span className={`text-xl font-normal group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{item.name}</span>
              </>
            )

            return (
              <div key={item.name} className="relative">
                {item.href && item.href !== "#" ? (
                  <Button
                    variant="ghost"
                    className={`group w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-10 md:h-12 px-3 rounded-full transition-colors hover:bg-muted/60 border-0 ${
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
                    onClick={(e) => {
                      e.preventDefault()
                      handleProfileClick(e)
                    }}
                  >
                    {content}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="group w-full justify-start gap-1 sm:gap-2 md:gap-3 h-8 sm:h-10 md:h-12 px-3 rounded-full transition-colors hover:bg-muted/60 border-0"
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

      {/* User section with integrated club switcher */}
      <div className="px-1 sm:px-2 md:px-3 py-3 sm:py-4 md:py-5 mb-2">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-auto px-3 py-2 rounded-full hover:bg-muted/60 transition-colors border-0"
              >
                <div className="flex items-center gap-2 w-full">
                  {/* Avatar - spans height of username + club */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={userProfile?.avatar_url || ''} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-lg">
                      {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Username and Club stacked */}
                  <div className="flex-1 flex flex-col items-start justify-center min-w-0">
                    <span className="text-sm font-medium text-left truncate w-full">
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground text-left truncate w-full">
                      {selectedClub?.name || "No Club"}
                    </span>
                  </div>
                  
                  {/* 3-dot menu */}
                  <MoreVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border border-border/50">
              {/* Club list */}
              {Array.isArray(clubs) && clubs.length > 0 && clubs.map((club) => (
                <DropdownMenuItem
                  key={club.id}
                  onClick={() => handleClubSwitch(club)}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="flex-1">{club.name}</span>
                  {club.id === selectedClub?.id && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </DropdownMenuItem>
              ))}
              
              {Array.isArray(clubs) && clubs.length > 0 && <DropdownMenuSeparator />}
              
              {/* Club Management */}
              <DropdownMenuItem onClick={handleClubManagement}>
                <Settings className="h-4 w-4 mr-2" />
                Club Management
              </DropdownMenuItem>
              
              {/* Create New Club */}
              <DropdownMenuItem onClick={handleCreateClub}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Club
              </DropdownMenuItem>

              {(user?.app_metadata as { isAdmin?: boolean } | undefined)?.isAdmin === true && (
                <DropdownMenuItem onClick={() => router.push("/admin/form-submissions")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Form Submissions
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {/* Log out */}
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2 hover:bg-muted transition-colors" asChild>
            <Link href="/auth/login">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-foreground">Sign In</span>
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
