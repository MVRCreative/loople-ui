"use client";

import { useEffect, useState } from "react";
import { isAuthenticated, getCurrentUser } from "@/lib/mock-auth";

export default function AuthBadge() {
  const [state, setState] = useState<"unknown" | "live" | "none">("unknown");

  useEffect(() => {
    // Mock auth state check
    const checkAuth = () => {
      const user = getCurrentUser();
      setState(user ? "live" : "none");
    };

    checkAuth();
  }, []);

  const label =
    state === "unknown" ? "AUTH: …" : state === "live" ? "AUTH: LIVE" : "AUTH: NO SESSION";

  return (
    <span className="text-[11px] px-2 py-1 rounded border opacity-80">
      {label}
    </span>
  );
}



