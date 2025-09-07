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
  const isAuthRoute = pathname.startsWith("/auth");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAnimationsRoute = pathname.startsWith("/animations");

  // Redirect to login if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthRoute) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, isAuthRoute, router]);

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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-32 mb-4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Show newsfeed/messages/settings with custom layout
  if (isNewsfeedRoute || isMessagesRoute || isSettingsRoute) {
    const newsfeedGrid = `max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px]
         [grid-template-columns:600px]
         lg:[grid-template-columns:600px_350px]
         xl:[grid-template-columns:275px_600px_350px]`;
    const messagesGrid = `max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px]
         [grid-template-columns:600px]
         lg:[grid-template-columns:350px_600px]
         xl:[grid-template-columns:275px_350px_600px]`;
    const gridClasses = isMessagesRoute ? messagesGrid : newsfeedGrid;

    // Extract thread id from /messages/[id]
    const threadId = isMessagesRoute ? pathname.split("/")[2] : undefined;

    return (
      <div className="min-h-screen w-full bg-background">
        <div className={`grid gap-x-0 mx-auto justify-center ${gridClasses}`}>
          {/* Left nav (hidden < 1280px) */}
          <aside className="hidden xl:block">
            {isMessagesRoute ? <MessagesSidebar /> : <NewsfeedSidebar />}
          </aside>

          {/* Main column */}
          <main>
            {children}
          </main>

          {/* Right rail (hidden < 1024px) */}
          <aside className="hidden lg:block">
            {isMessagesRoute ? (
              threadId ? (
                <MessageThread id={threadId} />
              ) : (
                <div className="w-[600px] bg-background h-screen sticky top-0 border-l border-r border-border flex items-center justify-center">
                  <p className="text-muted-foreground">Select a conversation</p>
                </div>
              )
            ) : (
              <NewsfeedRightSidebar />
            )}
          </aside>
        </div>
      </div>
    );
  }

  // For admin and animations routes, just return children as they handle their own sidebar
  if (isAdminRoute || isAnimationsRoute) {
    return <>{children}</>;
  }

  // Default sidebar for other protected routes
  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}
