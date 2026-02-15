"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  inAppNotificationsService,
  type InAppNotification,
} from "@/lib/services/in-app-notifications.service"
import { useAuth } from "@/lib/auth-context"
import { getRelativeTime } from "@/lib/utils/posts.utils"

export function NotificationBell() {
  const { user, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const channelRef = useRef<ReturnType<typeof inAppNotificationsService.subscribeToNotifications> | null>(null)

  const loadNotifications = useCallback(async () => {
    const [notifs, count] = await Promise.all([
      inAppNotificationsService.getNotifications(20),
      inAppNotificationsService.getUnreadCount(),
    ])
    setNotifications(notifs)
    setUnreadCount(count)
  }, [])

  // Load on mount and when auth changes
  useEffect(() => {
    if (!isAuthenticated) return
    loadNotifications()
  }, [isAuthenticated, loadNotifications])

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return

    channelRef.current = inAppNotificationsService.subscribeToNotifications(
      user.id,
      (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev].slice(0, 30))
        setUnreadCount((prev) => prev + 1)
      }
    )

    return () => {
      if (channelRef.current) {
        inAppNotificationsService.removeChannel(channelRef.current)
      }
    }
  }, [user?.id])

  const handleMarkAllRead = async () => {
    await inAppNotificationsService.markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (notification: InAppNotification) => {
    if (!notification.read_at) {
      await inAppNotificationsService.markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setOpen(false)
  }

  if (!isAuthenticated) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notif) => {
              const content = (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer ${
                    !notif.read_at ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleNotificationClick(notif)
                    }
                  }}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={notif.actor?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs">
                      {notif.actor?.first_name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {notif.actor && (
                        <span className="font-medium">
                          {notif.actor.first_name} {notif.actor.last_name}{" "}
                        </span>
                      )}
                      {notif.subject}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRelativeTime(notif.created_at)}
                    </p>
                  </div>
                  {!notif.read_at && (
                    <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </div>
              )

              if (notif.link) {
                return (
                  <Link key={notif.id} href={notif.link} className="block">
                    {content}
                  </Link>
                )
              }
              return content
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
