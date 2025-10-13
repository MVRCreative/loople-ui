"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { requestPasswordReset, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setSent(true);
        toast.success("Password reset email sent. Check your inbox.");
      } else {
        setError(res.error || "Failed to send reset email");
        toast.error(res.error || "Failed to send reset email");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>Enter your email to receive a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If an account exists for <span className="font-medium">{email}</span>, you will receive an email with a link to reset your password.
              </p>
              <div className="text-sm">
                <Link className="underline" href="/auth/login">Back to sign in</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {error && (
                <div className="text-sm text-destructive" role="alert">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <div className="text-center text-sm">
                Remembered? <Link className="underline" href="/auth/login">Sign in</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


