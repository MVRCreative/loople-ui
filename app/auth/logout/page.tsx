"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const result = await signOut();
        if (result.success) {
          toast.success("Successfully signed out");
        } else {
          toast.error(result.error || "Sign out failed");
        }
      } catch (error) {
        toast.error("An error occurred during sign out");
      } finally {
        router.push("/auth/login");
      }
    };

    handleLogout();
  }, [signOut, router]);

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Signing out...</h1>
        <p className="text-muted-foreground">Please wait while we sign you out.</p>
      </div>
    </div>
  );
}
