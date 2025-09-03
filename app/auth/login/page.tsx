import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { z } from "zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  async function login(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const parsed = credentialsSchema.safeParse({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (!parsed.success) {
      redirect(
        `/auth/login?error=${encodeURIComponent("Invalid email or password format")}`
      );
    }

    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/");
  }

  const errorMessage = (async () => {
    const params = await searchParams;
    const raw = params?.error;
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw[0] : raw;
  })();

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <div className="mb-6 text-center text-3xl font-semibold">Loople</div>
      <Card className="w-full max-w-sm border-0 shadow-none">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          {(await errorMessage) ? (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
              {await errorMessage}
            </div>
          ) : null}
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
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


