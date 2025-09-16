"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NewsfeedSidebar } from "@/components/newsfeed-sidebar";
import { NewsfeedRightSidebar } from "@/components/newsfeed-right-sidebar";
import { useAuth } from "@/lib/auth-context";

interface ConditionalSidebarProps {
  children: React.ReactNode;
}

export function ConditionalSidebar({ children }: ConditionalSidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const isAuthRoute = pathname.startsWith("/auth");
  const isRootRoute = pathname === "/";
  const isClubManagementPage = pathname.startsWith("/club-management");

  // Redirect to login if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthRoute && !isRootRoute) {
      router.push("/auth/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading, isAuthRoute, isRootRoute, router]);

  // Show auth pages without sidebar
  if (isAuthRoute) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-[1200px] mx-auto">
          <main>{children}</main>
        </div>
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

  // Club management layout (no right sidebar)
  if (isClubManagementPage) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="grid gap-x-0 mx-auto justify-center max-w-[600px] lg:max-w-[966px] xl:max-w-[1257px] [grid-template-columns:600px] lg:[grid-template-columns:906px] xl:[grid-template-columns:275px_922px]">
          <aside className="hidden xl:block">
            <NewsfeedSidebar />
          </aside>
          <main className="relative">{children}</main>
        </div>
      </div>
    );
  }

  // Default layout with left + right sidebars
  return (
    <div className="min-h-screen w-full bg-background">
      <div className={`grid gap-x-0 mx-auto justify-center ${getGridLayout()}`}>
        <aside className="hidden xl:block">
          <NewsfeedSidebar />
        </aside>
        <main className="relative">{children}</main>
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

  );
}
