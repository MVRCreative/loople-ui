"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { NewsfeedSidebar } from "@/components/newsfeed-sidebar";
import { NewsfeedRightSidebar } from "@/components/newsfeed-right-sidebar";
import { MessagesSidebar } from "@/components/MessagesSidebar";
import { MessageThread } from "@/components/MessageThread";
import { SidebarProvider } from "@/components/ui/sidebar";

interface ConditionalSidebarProps {
  children: React.ReactNode;
}

export function ConditionalSidebar({ children }: ConditionalSidebarProps) {
  const pathname = usePathname();
  const isNewsfeedRoute = pathname === "/";
  const isMessagesRoute = pathname.startsWith("/messages");
  const isSettingsRoute = pathname.startsWith("/settings");
  const isAuthRoute = pathname.startsWith("/auth");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAnimationsRoute = pathname.startsWith("/animations");

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

  if (isAuthRoute) {
    return (
      <div className="min-h-screen w-full bg-background">
        <main>
          {children}
        </main>
      </div>
    );
  }

  // For admin and animations routes, just return children as they handle their own sidebar
  if (isAdminRoute || isAnimationsRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}
