"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileHeaderProps {
  userId: string
}

// Mock data - in real app this would come from API/database
const profile = {
  name: 'Ricardo Cooper',
  email: 'ricardo.cooper@example.com',
  avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80',
  backgroundImage: 'https://images.unsplash.com/photo-1444628838545-ac4016a5418a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
  bio: 'Senior Front-End Developer at Loople. Building amazing user experiences with React and TypeScript.',
  location: 'San Francisco, CA',
  website: 'ricardocooper.dev',
  joinDate: 'Joined March 2023',
  following: 1_234,
  followers: 5_678,
  posts: 89,
  fields: [
    ['Phone', '(555) 123-4567'],
    ['Email', 'ricardocooper@example.com'],
    ['Title', 'Senior Front-End Developer'],
    ['Team', 'Product Development'],
    ['Location', 'San Francisco'],
    ['Sits', 'Oasis, 4th floor'],
    ['Salary', '$145,000'],
    ['Birthday', 'June 8, 1990'],
  ],
}

export function ProfileHeader({ userId }: ProfileHeaderProps) {
  return (
    <div className="w-full">
      {/* Cover Image */}
      <div className="h-32 w-full lg:h-48">
        <img 
          alt="" 
          src={profile.backgroundImage} 
          className="h-full w-full object-cover" 
        />
      </div>
      
      {/* Profile Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
          {/* Avatar */}
          <div className="flex">
            <Avatar className="size-24 rounded-full ring-4 ring-background sm:size-32">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="text-lg font-semibold">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Profile Info and Actions */}
          <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="mt-6 min-w-0 flex-1 sm:hidden md:block">
              <h1 className="truncate text-2xl font-bold text-foreground">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">@{profile.email.split('@')[0]}</p>
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
          <h1 className="truncate text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.email.split('@')[0]}</p>
        </div>
        
        {/* Bio and Stats */}
        <div className="mt-6 space-y-4">
          {/* Bio */}
          <div>
            <p className="text-foreground">{profile.bio}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{profile.location}</span>
              <a 
                href={`https://${profile.website}`} 
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {profile.website}
              </a>
              <span>{profile.joinDate}</span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex space-x-6 text-sm">
            <div className="flex space-x-1">
              <span className="font-semibold text-foreground">{profile.following.toLocaleString()}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
            <div className="flex space-x-1">
              <span className="font-semibold text-foreground">{profile.followers.toLocaleString()}</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div className="flex space-x-1">
              <span className="font-semibold text-foreground">{profile.posts}</span>
              <span className="text-muted-foreground">Posts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
