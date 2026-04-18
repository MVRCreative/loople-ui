import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function TenantNotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Club not found
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The subdomain you&apos;re trying to reach isn&apos;t configured yet.
        Double-check the URL or head back to the Loople home page.
      </p>
      <Button asChild className="mt-8">
        <Link href="https://www.loople.app">Go to Loople</Link>
      </Button>
    </div>
  );
}
