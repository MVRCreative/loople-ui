"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { NewsfeedSidebar } from "@/components/newsfeed-sidebar";
import { NewsfeedRightSidebar } from "@/components/newsfeed-right-sidebar";
import { MessagesSidebar } from "@/components/MessagesSidebar";
import { MessageThread } from "@/components/MessageThread";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ConditionalSidebarProps {
  children: React.ReactNode;
}

export function ConditionalSidebar({ children }: ConditionalSidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const isNewsfeedRoute = pathname === "/";
  const isMessagesRoute = pathname.startsWith("/messages");
  const isSettingsRoute = pathname.startsWith("/settings");
  const isProfileRoute = pathname.startsWith("/profile");
  const isAuthRoute = pathname.startsWith("/auth");
  const isRootRoute = pathname === "/";
  const isFeedPage = pathname === "/";
  const isClubManagementPage = pathname.startsWith("/club-management");

  // Redirect to login if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthRoute && !isRootRoute) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, isAuthRoute, isRootRoute, router]);

  // Show auth pages without sidebar (these pages manage their own loading/errors)
  if (isAuthRoute) {
    return (
      <div className="min-h-screen w-full bg-background">
        <main>
          {children}
        </main>
      </div>
    );
  }

  // Dynamic grid layout
  const getGridLayout = () => {
    // Club management pages get full width - no right sidebar
    if (isClubManagementPage) {
      return `max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px]
        [grid-template-columns:600px]
        lg:[grid-template-columns:906px]
        xl:[grid-template-columns:275px_922px]`;
    }
    
    // Normal layout with right sidebar
    return `max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px]
      [grid-template-columns:600px]
      lg:[grid-template-columns:600px_350px]
      xl:[grid-template-columns:275px_600px_350px]`;
  };

  // For club management pages, use a simpler layout without right sidebar
  if (isClubManagementPage) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="grid gap-x-0 mx-auto justify-center max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px] [grid-template-columns:600px] lg:[grid-template-columns:906px] xl:[grid-template-columns:275px_922px]">
          <aside className="hidden xl:block">
            <NewsfeedSidebar />
          </aside>
          <main className="relative">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className={`grid gap-x-0 mx-auto justify-center ${getGridLayout()}`}>
        <aside className="hidden xl:block">
          <NewsfeedSidebar />
        </aside>
        <main className="relative">
          {children}
        </main>
        {/* Only show right sidebar on non-club-management pages */}
        {!isClubManagementPage && (
          <aside className="hidden lg:block">
            <NewsfeedRightSidebar />
          </aside>
        )}
      </div>
    </div>
  );
}
