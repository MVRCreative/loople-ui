"use client";

import { usePathname } from "next/navigation";
// import { AppSidebar } from "@/components/app-sidebar";
import { NewsfeedSidebar } from "@/components/newsfeed-sidebar";
import { NewsfeedRightSidebar } from "@/components/newsfeed-right-sidebar";
// import { MessagesSidebar } from "@/components/MessagesSidebar";
// import { MessageThread } from "@/components/MessageThread";
// import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Users } from "lucide-react";

interface ConditionalSidebarProps {
  children: React.ReactNode;
}

export function ConditionalSidebar({ children }: ConditionalSidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // const _isNewsfeedRoute = pathname === "/";
  // const _isMessagesRoute = pathname.startsWith("/messages");
  // const _isSettingsRoute = pathname.startsWith("/settings");
  // const _isProfileRoute = pathname.startsWith("/profile");
  const isAuthRoute = pathname.startsWith("/auth");
  const isRootRoute = pathname === "/";
  // const _isFeedPage = pathname === "/";
  // const _isClubManagementPage = pathname.startsWith("/club-management");

  // Redirect to login if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthRoute && !isRootRoute) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, isAuthRoute, isRootRoute, router]);

  // Set default sidebar state based on page
  useEffect(() => {
    const isFeedPage = pathname === "/";
    if (isFeedPage) {
      setIsRightSidebarCollapsed(false); // Expanded on feed page
    } else {
      setIsRightSidebarCollapsed(true); // Collapsed on other pages
    }
  }, [pathname]);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsTransitioning(true);
    setIsRightSidebarCollapsed(collapsed);
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 500);
  };

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

  // Dynamic grid layout based on sidebar state
  const getGridLayout = () => {
    if (isRightSidebarCollapsed) {
      // Collapsed right sidebar - main content grows to fill space
      return `max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px]
        [grid-template-columns:600px]
        lg:[grid-template-columns:906px_60px]
        xl:[grid-template-columns:275px_922px_60px]`;
    } else {
      // Expanded right sidebar - normal layout
      return `max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px]
        [grid-template-columns:600px]
        lg:[grid-template-columns:600px_350px]
        xl:[grid-template-columns:275px_600px_350px]`;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className={`grid gap-x-0 mx-auto justify-center transition-all duration-500 ease-in-out ${getGridLayout()}`}>
        <aside className="hidden xl:block">
          <NewsfeedSidebar />
        </aside>
        <main className={`relative transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-95' : 'opacity-100'}`}>
          {children}
        </main>
        <aside className="hidden lg:block">
          {isRightSidebarCollapsed ? (
            <div className="w-[60px] border-l border-border bg-background sticky top-0 h-screen flex flex-col items-center py-6 transition-all duration-300">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSidebarToggle(false)}
                className="mb-4 hover:bg-accent transition-all duration-200"
                title="Expand sidebar"
                disabled={isTransitioning}
              >
                <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
              </Button>
              <div className="flex flex-col gap-4">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-all duration-200 hover:scale-105" title="Upcoming Events">
                  <Calendar className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-all duration-200 hover:scale-105" title="Your Programs">
                  <Users className="h-4 w-4 text-muted-foreground transition-colors duration-200" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative transition-all duration-300">
              <NewsfeedRightSidebar />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSidebarToggle(true)}
                className="absolute top-4 right-4 z-10 hover:bg-accent transition-all duration-200"
                title="Collapse sidebar"
                disabled={isTransitioning}
              >
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
