"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { signUpSchema } from "@/lib/auth-types";
import { toast } from "sonner";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    clubName: "",
    clubSubdomain: "",
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthDate?: string;
    clubName?: string;
    clubSubdomain?: string;
    form?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp, loading: authLoading } = useAuth();

  // (Removed localStorage persistence per request)

  // Keep form values on failed submit by persisting to sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("signupForm");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    // Clear inline error for the field being edited
    setErrors(prev => ({ ...prev, [name]: undefined, form: undefined }));
    try {
      sessionStorage.setItem("signupForm", JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
        setIsLoading(false);
        return;
      }

      // Validate form data
      let validatedData;
      try {
        validatedData = signUpSchema.parse({
          email: formData.email,
          password: formData.password,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone || undefined,
            birth_date: formData.birthDate || undefined,
            club_name: formData.clubName || undefined,
            club_subdomain: formData.clubSubdomain || undefined,
          },
        });
      } catch (zerr: unknown) {
        const issues = (zerr as { issues?: Array<{ message: string; path?: Array<string | number> }> })?.issues;
        if (issues && issues.length) {
          const fieldErrors: typeof errors = {};
          for (const issue of issues) {
            const path = issue.path || [];
            const joined = path.join(".");
            // Map zod paths to our field names
            switch (joined) {
              case "email":
                fieldErrors.email = issue.message;
                break;
              case "password":
                fieldErrors.password = issue.message;
                break;
              case "data.first_name":
                fieldErrors.firstName = issue.message;
                break;
              case "data.last_name":
                fieldErrors.lastName = issue.message;
                break;
              case "data.phone":
                fieldErrors.phone = issue.message;
                break;
              case "data.birth_date":
                fieldErrors.birthDate = issue.message;
                break;
              case "data.club_name":
                fieldErrors.clubName = issue.message;
                break;
              case "data.club_subdomain":
                fieldErrors.clubSubdomain = issue.message;
                break;
              default:
                fieldErrors.form = issue.message;
                break;
            }
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ form: (zerr as { message?: string })?.message || "Please check your inputs and try again." });
        }
        setIsLoading(false);
        return;
      }
      
      const result = await signUp(validatedData);
      
      if (result.success) {
        try {
          sessionStorage.removeItem("signupForm");
        } catch {
          // ignore storage errors
        }
        toast.success("Account created successfully! Please check your email to verify your account.");
        router.push("/auth/login");
      } else {
        // Normalize server error from either result.error or the top-level result
        const rawErr: unknown = (result as Record<string, unknown>)?.error ?? (result as Record<string, unknown>);
        const code = (rawErr as Record<string, unknown>)?.code;
        const rawMessage = typeof rawErr === "string" ? rawErr : ((rawErr as Record<string, unknown>)?.message || (rawErr as Record<string, unknown>)?.details || (rawErr as Record<string, unknown>)?.error || (rawErr as Record<string, unknown>)?.hint);
        let message = (typeof rawMessage === "string" && rawMessage.length)
          ? rawMessage
          : "Sign up failed";
        const nextErrors: typeof errors = {};
        // Handle duplicate email constraint
        if (code === "23505" || /duplicate key|already exists/i.test(String(rawMessage))) {
          nextErrors.email = "An account with this email already exists";
          if (!rawMessage) {
            message = "This email is already in use. Try signing in or use another email.";
          }
        }
        setErrors({ ...nextErrors, form: message });
      }
    } catch (error) {
      // Normalize thrown error shapes
      let code: unknown;
      let rawMessage: unknown;
      if (error instanceof Error) {
        rawMessage = error.message;
        try {
          const parsed = JSON.parse(error.message);
          if (parsed && typeof parsed === "object") {
            const p: Record<string, unknown> = parsed as Record<string, unknown>;
            code = (p?.error as Record<string, unknown>)?.code ?? p?.code;
            rawMessage = (p?.error as Record<string, unknown>)?.message || (p?.error as Record<string, unknown>)?.details || p?.message || rawMessage;
          }
        } catch {
          // ignore JSON parse failure
        }
      } else if (typeof error === "object" && error !== null) {
        const er: Record<string, unknown> = error as Record<string, unknown>;
        code = (er?.error as Record<string, unknown>)?.code ?? er?.code;
        rawMessage = (er?.error as Record<string, unknown>)?.message || (er?.error as Record<string, unknown>)?.details || er?.message || er?.details;
      } else if (typeof error === "string") {
        rawMessage = error;
      }

      let message = (typeof rawMessage === "string" && rawMessage.length) ? rawMessage : "An error occurred during sign up";
      const nextErrors: typeof errors = {};
      if (code === "23505" || /duplicate key|already exists/i.test(String(rawMessage))) {
        nextErrors.email = "An account with this email already exists";
        message = "This email is already in use. Try signing in or use another email.";
      }
      setErrors({ ...nextErrors, form: message });
    } finally {
      setIsLoading(false);
    }
  };

  const loading = isLoading || authLoading;

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <Image 
          src="/loople-logo3.svg" 
          alt="Loople Logo" 
          width={48}
          height={48}
          className="h-12 w-auto mx-auto"
        />
      </div>
      <Card className="w-full max-w-md border-0 shadow-none relative">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up to start managing your swim club.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-[2px]">
              <Loader className="text-neutral-600" />
            </div>
          ) : null}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {errors.form ? (
              <div
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {errors.form}
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  name="firstName" 
                  type="text" 
                  required 
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={loading}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  className={errors.firstName ? "border-red-500 focus-visible:ring-red-500" : undefined}
                />
                {errors.firstName ? (
                  <p id="firstName-error" className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  name="lastName" 
                  type="text" 
                  required 
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={loading}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  className={errors.lastName ? "border-red-500 focus-visible:ring-red-500" : undefined}
                />
                {errors.lastName ? (
                  <p id="lastName-error" className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                required 
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {errors.email ? (
                <p id="email-error" className="mt-1 text-xs text-red-600">{errors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={errors.password ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {errors.password ? (
                <p id="password-error" className="mt-1 text-xs text-red-600">{errors.password}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                required 
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {errors.confirmPassword ? (
                <p id="confirmPassword-error" className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                value={formData.phone}
                onChange={handleInputChange}
                disabled={loading}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {errors.phone ? (
                <p id="phone-error" className="mt-1 text-xs text-red-600">{errors.phone}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date (Optional)</Label>
              <Input 
                id="birthDate" 
                name="birthDate" 
                type="date" 
                value={formData.birthDate}
                onChange={handleInputChange}
                disabled={loading}
                aria-invalid={!!errors.birthDate}
                aria-describedby={errors.birthDate ? "birthDate-error" : undefined}
                className={errors.birthDate ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {errors.birthDate ? (
                <p id="birthDate-error" className="mt-1 text-xs text-red-600">{errors.birthDate}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clubName">Club Name (Optional)</Label>
              <Input 
                id="clubName" 
                name="clubName" 
                type="text" 
                value={formData.clubName}
                onChange={handleInputChange}
                disabled={loading}
                aria-invalid={!!errors.clubName}
                aria-describedby={errors.clubName ? "clubName-error" : undefined}
                className={errors.clubName ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {errors.clubName ? (
                <p id="clubName-error" className="mt-1 text-xs text-red-600">{errors.clubName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clubSubdomain">Club Subdomain (Optional)</Label>
              <Input 
                id="clubSubdomain" 
                name="clubSubdomain" 
                type="text" 
                placeholder="my-swim-club"
                value={formData.clubSubdomain}
                onChange={handleInputChange}
                disabled={loading}
                aria-invalid={!!errors.clubSubdomain}
                aria-describedby={errors.clubSubdomain ? "clubSubdomain-error" : undefined}
                className={errors.clubSubdomain ? "border-red-500 focus-visible:ring-red-500" : undefined}
              />
              {errors.clubSubdomain ? (
                <p id="clubSubdomain-error" className="mt-1 text-xs text-red-600">{errors.clubSubdomain}</p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              Create Account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account? {" "}
            <Link className="underline" href="/auth/login">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}