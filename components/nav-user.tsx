"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { UsersService } from "@/lib/services/users.service"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { user: authUser, signOut } = useAuth()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<{ username?: string | null; avatar_url?: string | null } | null>(null)
  const [showUsernameDialog, setShowUsernameDialog] = useState(false)
  
  // Use real auth user data if available, fallback to prop user
  const displayName = authUser?.user_metadata?.first_name && authUser?.user_metadata?.last_name 
    ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
    : authUser?.email || user.name
  const displayEmail = authUser?.email || user.email
  const displayAvatar = userProfile?.avatar_url || user.avatar

  // Load user profile to get username and avatar
  useEffect(() => {
    if (authUser) {
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
  }, [authUser])

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!userProfile?.username) {
      e.preventDefault()
      setShowUsernameDialog(true)
    }
  }

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) {
      router.push('/auth/login')
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="rounded-lg">
                  {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {userProfile?.username ? (
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${userProfile.username}`}>
                    <User />
                    Profile
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User />
                  Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <BadgeCheck />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Signed in as {displayEmail || "—"}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

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
    </SidebarMenu>
  )
}
