"use client";

import { useAuth } from "@/lib/auth-context";

export default function AuthBadge() {
  const { isAuthenticated, loading } = useAuth();

  const label = loading 
    ? "AUTH: …" 
    : isAuthenticated 
      ? "AUTH: LIVE" 
      : "AUTH: NO SESSION";

  return (
    <span className="text-[11px] px-2 py-1 rounded border opacity-80">
      {label}
    </span>
  );
}



