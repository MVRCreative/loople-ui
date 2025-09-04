export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ ok: true, rows: count ?? 0 }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}



