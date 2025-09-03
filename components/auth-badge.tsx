"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

export default function AuthBadge() {
  const [state, setState] = useState<"unknown" | "live" | "none">("unknown");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setState(user ? "live" : "none");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session?.user ? "live" : "none");
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const label =
    state === "unknown" ? "AUTH: …" : state === "live" ? "AUTH: LIVE" : "AUTH: NO SESSION";

  return (
    <span className="text-[11px] px-2 py-1 rounded border opacity-80">
      {label}
    </span>
  );
}



