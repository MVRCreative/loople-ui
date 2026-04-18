"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WaitlistPage() {
  return (
    <div className="flex-1 p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Waitlist</CardTitle>
          <CardDescription>
            To join a club waitlist, open the club&apos;s site and visit
            /waitlist/apply (e.g. your-club.loople.app/waitlist/apply).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/waitlist">
            <Button variant="outline">Admin: Manage waitlist</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
