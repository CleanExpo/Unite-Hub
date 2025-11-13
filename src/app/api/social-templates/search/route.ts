import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const query = searchParams.get("query");

    if (!clientId || !query) {
      return NextResponse.json(
        { error: "Missing clientId or query" },
        { status: 400 }
      );
    }

    const templates = await fetchQuery(api.socialTemplates.searchTemplates, {
      clientId: clientId as any,
      query,
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error searching templates:", error);
    return NextResponse.json(
      { error: "Failed to search templates" },
      { status: 500 }
    );
  }
}
