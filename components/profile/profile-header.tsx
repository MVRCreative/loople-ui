"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NextImage from "next/image"
import { User } from "@/lib/services/users.service"
import { formatUserDisplayName, getUserAvatarInitials } from "@/lib/utils/profile.utils"

interface ProfileHeaderProps {
  user: User
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  // Format user data for display
  const fullName = formatUserDisplayName(user)
  const displayName = user.username ? `@${user.username}` : user.email.split('@')[0]
  const location = user.city && user.region ? `${user.city}, ${user.region}` : user.city || user.region || ''
  const joinDate = user.created_at ? `Joined ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : ''
  
  // Generate avatar colors based on user initials
  const avatarInitials = getUserAvatarInitials(user)
  const avatarColors = [
    'from-blue-500 to-purple-600',
    'from-purple-500 to-pink-600', 
    'from-pink-500 to-red-600',
    'from-green-500 to-blue-600',
    'from-yellow-500 to-orange-600',
    'from-indigo-500 to-purple-600',
    'from-teal-500 to-green-600',
    'from-orange-500 to-red-600'
  ]
  const colorIndex = avatarInitials.charCodeAt(0) % avatarColors.length
  const avatarGradient = avatarColors[colorIndex]
  
  // Mock stats - these would come from separate API calls in a real app
  const stats = {
    following: 0, // TODO: Implement following system
    followers: 0, // TODO: Implement followers system
    posts: 0, // TODO: Get actual post count
  }
  return (
    <div className="w-full">
      {/* Cover Image */}
      <div className="h-32 w-full lg:h-48 relative overflow-hidden">
        {user.cover_url ? (
          <NextImage 
            alt="" 
            src={user.cover_url} 
            width={1200}
            height={192}
            className="h-full w-full object-cover" 
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        )}
      </div>
      
      {/* Profile Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
          {/* Avatar */}
          <div className="flex">
            <Avatar className="size-24 rounded-full ring-4 ring-background sm:size-32 shadow-lg">
              <AvatarImage src={user.avatar_url || ''} alt={fullName} />
              <AvatarFallback className={`text-lg font-semibold bg-gradient-to-br ${avatarGradient} text-white shadow-inner`}>
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Profile Info and Actions */}
          <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="mt-6 min-w-0 flex-1 sm:hidden md:block">
              <h1 className="truncate text-2xl font-bold text-foreground">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  <path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Name */}
        <div className="mt-6 hidden min-w-0 flex-1 sm:block md:hidden">
          <h1 className="truncate text-2xl font-bold text-foreground">{fullName}</h1>
          <p className="text-sm text-muted-foreground">{displayName}</p>
        </div>
        
        {/* Bio and Stats */}
        <div className="mt-6 space-y-4">
          {/* Bio */}
          <div className="space-y-3">
            {user.bio ? (
              <p className="text-foreground leading-relaxed">{user.bio}</p>
            ) : (
              <div className="text-muted-foreground italic">
                <p>No bio available yet.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {location && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {location}
                </span>
              )}
              {user.email && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {user.email}
                </span>
              )}
              {joinDate && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {joinDate}
                </span>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex space-x-8 text-sm">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-foreground">{stats.following.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Following</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-foreground">{stats.followers.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-foreground">{stats.posts}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Posts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
