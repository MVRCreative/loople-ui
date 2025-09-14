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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading, isAuthRoute, isRootRoute, router]);

  // Set default sidebar state based on screen size and page
  useEffect(() => {
    const checkScreenSize = () => {
      const isSmallScreen = window.innerWidth < 768; // md breakpoint
      const isFeedPage = pathname === "/";
      
      if (isSmallScreen) {
        setIsRightSidebarCollapsed(true); // Always collapsed on small screens
      } else if (isFeedPage) {
        setIsRightSidebarCollapsed(false); // Expanded on feed page for larger screens
      } else {
        setIsRightSidebarCollapsed(true); // Collapsed on other pages for larger screens
      }
    };

    // Check on mount and pathname change
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
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
        <div className="max-w-[1200px] mx-auto">
          <main>
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Responsive layout with always-visible left sidebar and flexible right sidebar
  const getGridLayout = () => {
    if (isRightSidebarCollapsed) {
      // Collapsed right sidebar - main content grows to fill space
      return `w-full
        [grid-template-columns:240px_1fr]
        sm:[grid-template-columns:280px_1fr]
        md:[grid-template-columns:280px_1fr_60px]
        lg:[grid-template-columns:280px_1fr_60px]`;
    } else {
      // Expanded right sidebar - flexible width based on screen size
      return `w-full
        [grid-template-columns:240px_1fr]
        sm:[grid-template-columns:280px_1fr]
        md:[grid-template-columns:280px_1fr_280px]
        lg:[grid-template-columns:280px_1fr_320px]
        xl:[grid-template-columns:280px_1fr_360px]`;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className={`grid gap-x-0 w-full transition-all duration-500 ease-in-out ${getGridLayout()}`}>
        <aside className="block sticky top-0 h-screen overflow-y-auto">
          <NewsfeedSidebar />
        </aside>
        <main className={`relative transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-95' : 'opacity-100'} bg-white dark:bg-gray-800 min-h-screen`}>
          {/* Mobile right sidebar toggle button */}
          <div className="md:hidden fixed top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSidebarToggle(!isRightSidebarCollapsed)}
              className="bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {isRightSidebarCollapsed ? 'Show' : 'Hide'}
            </Button>
          </div>
          
          <div className="w-full px-2 sm:px-4 lg:px-6 flex justify-center">
            <div className="w-full max-w-[680px]">
              {children}
            </div>
          </div>
        </main>
        {/* Desktop right sidebar */}
        <aside className="hidden md:block sticky top-0 h-screen overflow-y-auto">
          {isRightSidebarCollapsed ? (
            <div className="w-[60px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 sticky top-0 h-screen flex flex-col items-center py-4 transition-all duration-300">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSidebarToggle(false)}
                className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 rounded-full w-8 h-8"
                title="Expand sidebar"
                disabled={isTransitioning}
              >
                <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
              </Button>
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer" title="Upcoming Events">
                  <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-colors duration-200" />
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer" title="Your Programs">
                  <Users className="h-5 w-5 text-gray-600 dark:text-gray-300 transition-colors duration-200" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative transition-all duration-300 w-full">
              <NewsfeedRightSidebar />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSidebarToggle(true)}
                className="absolute top-4 right-4 z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 rounded-full w-8 h-8"
                title="Collapse sidebar"
                disabled={isTransitioning}
              >
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              </Button>
            </div>
          )}
        </aside>

        {/* Mobile right sidebar overlay */}
        {!isRightSidebarCollapsed && (
          <div className="md:hidden fixed inset-0 z-40">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => handleSidebarToggle(true)}
            />
            {/* Sidebar */}
            <div className="absolute right-0 top-0 h-full w-[min(320px,80vw)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="relative h-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSidebarToggle(true)}
                  className="absolute top-4 right-4 z-10 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 rounded-full w-8 h-8"
                  title="Close sidebar"
                >
                  <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                </Button>
                <div className="pt-16">
                  <NewsfeedRightSidebar />
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
