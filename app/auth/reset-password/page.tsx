"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    // For password recovery links, Supabase sends type=recovery and token_hash in `token`
    async function verify() {
      if (!token || type !== 'recovery') {
        setVerified(true); // allow recovery session if already present
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });
      if (error) {
        setError(error.message || 'Invalid or expired reset link');
        toast.error(error.message || 'Invalid or expired reset link');
      } else {
        setVerified(true);
      }
    }
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (password !== confirm) {
      const msg = 'Passwords do not match';
      setError(msg);
      toast.error(msg);
      return;
    }
    const res = await updatePassword(password);
    if (res.success) {
      toast.success('Password updated. You can now sign in.');
      router.push('/auth/login');
    } else {
      setError(res.error || 'Failed to update password');
      toast.error(res.error || 'Failed to update password');
    }
  };

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter a new password to finish resetting your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!verified ? (
            <p className="text-sm text-muted-foreground">Validating your reset link...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && (
                <div className="text-sm text-destructive" role="alert">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading || !verified}>
                {loading ? 'Updating...' : 'Update password'}
              </Button>
              <div className="text-center text-sm">
                <Link className="underline" href="/auth/login">Back to sign in</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


