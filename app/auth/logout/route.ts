import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/auth/login", request.url));
}

<<<<<<< Current (Your changes)
export async function POST() {
  return GET();
=======
export async function POST(request: Request) {
  return GET(request);
>>>>>>> Incoming (Background Agent changes)
}


