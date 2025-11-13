import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      company,
      phone,
      job_title,
      workspace_id,
      status = "prospect",
      tags = [],
    } = body;

    // Validate required fields
    if (!name || !email || !workspace_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, workspace_id" },
        { status: 400 }
      );
    }

    // Create client (contact)
    const client = await db.contacts.create({
      workspace_id,
      name,
      email,
      company,
      phone,
      job_title,
      status,
      tags,
      ai_score: 0.5,
      last_interaction: new Date(),
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
