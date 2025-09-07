import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Mock logout - just redirect to login page
  return NextResponse.redirect(new URL("/auth/login", request.url));
}

export async function POST(request: Request) {
  return GET(request);
}


