import { NextResponse } from "next/server";

// TODO: Re-enable NextAuth once environment variables are properly configured
// import { handlers } from "@/lib/auth";
// export const { GET, POST } = handlers;

// Temporary stub for build - authentication is disabled in development
export async function GET() {
  return NextResponse.json({ error: "Authentication not configured" }, { status: 503 });
}

export async function POST() {
  return NextResponse.json({ error: "Authentication not configured" }, { status: 503 });
}
