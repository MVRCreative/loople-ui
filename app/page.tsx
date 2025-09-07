"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

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

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-white" />
            </div>
            <span className="text-3xl font-bold text-foreground">LOOPLE</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Welcome to Loople
          </h1>
          <p className="text-muted-foreground">
            Your comprehensive swimming club management platform
          </p>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Join your swimming community and start managing your club activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Features:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Event management and scheduling</li>
                <li>• Member directory and communication</li>
                <li>• Real-time messaging system</li>
                <li>• Financial tracking and payments</li>
                <li>• Document and policy management</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/auth/signup">
                  Create Account
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Already have an account? <Link href="/auth/login" className="underline">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
}