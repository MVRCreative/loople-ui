"use client";

import { usePathname } from "next/navigation";
// import { AppSidebar } from "@/components/app-sidebar";
import { NewsfeedSidebar } from "@/components/newsfeed-sidebar";
import { NewsfeedRightSidebar } from "@/components/newsfeed-right-sidebar";
// import { MessagesSidebar } from "@/components/MessagesSidebar";
// import { MessageThread } from "@/components/MessageThread";
// import { SidebarProvider } from "@/components/ui/sidebar";

interface ConditionalSidebarProps {
  children: React.ReactNode;
}

export function ConditionalSidebar({ children }: ConditionalSidebarProps) {
  const pathname = usePathname();
  // const _isNewsfeedRoute = pathname === "/";
  const isMessagesRoute = pathname.startsWith("/messages");
  // const _isSettingsRoute = pathname.startsWith("/settings");
  // const _isProfileRoute = pathname.startsWith("/profile");
  const isAuthRoute = pathname.startsWith("/auth");
  const isAdminRoute = pathname.startsWith("/admin");
  const isWaitlistApplyRoute = pathname.startsWith("/waitlist/apply");

  // Auth redirects: rely on middleware for /settings, /messages, etc. Client-side redirect here
  // caused false "logouts" when opening Settings (brief !isAuthenticated while session is fine).

  const isClubManagementPage = pathname.startsWith("/admin/club-management");
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

  // Waitlist apply is a public page - minimal layout, no sidebar
  if (isWaitlistApplyRoute) {
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

  // Admin routes use their own layout - just pass through children
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Dynamic grid layout
  const getGridLayout = () => {
    // Messages pages: nav (xl only) + content area that equals center+right sidebar widths (600+350=950)
    if (isMessagesRoute) {
      return `max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px]
        [grid-template-columns:600px]
        lg:[grid-template-columns:950px]
        xl:[grid-template-columns:275px_950px]`;
    }
    
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

  // For messages pages, use 3-column layout: nav + conversations + message thread
  if (isMessagesRoute) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className={`grid gap-x-0 mx-auto justify-center ${getGridLayout()}`}>
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

  // For club management pages, use a simpler layout without right sidebar
  if (isClubManagementPage) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="grid gap-x-0 mx-auto justify-center max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px] [grid-template-columns:600px] lg:[grid-template-columns:906px] xl:[grid-template-columns:275px_922px]">
          <aside className="hidden xl:block">
            <NewsfeedSidebar />
          </aside>
          <main className="relative px-4">
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
