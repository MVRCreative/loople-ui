import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { z } from "zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  async function signup(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const parsed = signupSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!parsed.success) {
      redirect(
        `/auth/signup?error=${encodeURIComponent("Invalid email or password format")}`
      );
    }

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
    }

    // If email confirmations are enabled, you may want to display a message instead.
    redirect("/");
  }

  const errorMessage = (() => {
    const raw = searchParams?.error;
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw[0] : raw;
  })();

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="mb-6 text-center text-3xl font-semibold">Loople</div>
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Sign up with your email and a password.</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
              {errorMessage}
            </div>
          ) : null}
          <form action={signup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full">Create account</Button>
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


