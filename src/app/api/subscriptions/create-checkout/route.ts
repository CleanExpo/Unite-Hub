/**
 * Subscription Checkout Endpoint (Alias)
 *
 * This endpoint redirects to /api/billing/checkout for compatibility
 * with legacy integrations and documentation.
 *
 * The actual implementation is in /api/billing/checkout
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Forward the request to /api/billing/checkout
    const body = await req.json();
    const authHeader = req.headers.get("authorization");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3008"}/api/billing/checkout`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Checkout redirect error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create checkout session: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Forward the GET request to /api/billing/checkout
    const sessionId = req.nextUrl.searchParams.get("session_id");
    const authHeader = req.headers.get("authorization");

    const headers: HeadersInit = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const url = new URL(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3008"}/api/billing/checkout`
    );
    if (sessionId) {
      url.searchParams.set("session_id", sessionId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Get checkout session redirect error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get checkout session: ${message}` },
      { status: 500 }
    );
  }
}
