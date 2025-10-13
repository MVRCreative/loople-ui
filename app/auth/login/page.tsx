"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { signInSchema } from "@/lib/auth-types";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ form?: string }>({});
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = signInSchema.parse({ email, password });
      
      const result = await signIn(validatedData.email, validatedData.password);
      
      if (result.success) {
        toast.success("Successfully signed in!");
        router.push("/");
      } else {
        const raw = result.error || "Sign in failed";
        // Prefer a detailed inline message while still surfacing a toast
        setErrors({ form: raw });
        toast.error(raw);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ form: error.message });
        toast.error(error.message);
      } else {
        const generic = "An error occurred during sign in";
        setErrors({ form: generic });
        toast.error(generic);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || authLoading;

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <Image 
          src="/loople logo3.svg" 
          alt="Loople Logo" 
          width={48}
          height={48}
          className="h-12 w-auto mx-auto"
        />
      </div>
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form ? (
              <div
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {errors.form}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                required 
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="text-right text-sm">
              <Link className="underline" href="/auth/forgot">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account? {" "}
            <Link className="underline" href="/auth/signup">Create account</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


