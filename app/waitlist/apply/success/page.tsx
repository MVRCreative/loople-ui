"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WaitlistApplySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <header className="fixed top-0 left-0 right-0 border-b px-4 py-3 bg-background">
        <Link href="/" className="flex items-center">
          <Image src="/app/loople-logo3.svg" alt="Loople" width={140} height={60} />
        </Link>
      </header>
      <Card className="max-w-md w-full mt-16">
        <CardHeader>
          <CardTitle>Application received</CardTitle>
          <CardDescription>
            Thank you! Your waitlist application has been submitted. You will be notified when a spot becomes available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button variant="outline">Go home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
