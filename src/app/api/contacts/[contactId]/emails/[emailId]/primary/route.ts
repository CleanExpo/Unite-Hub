import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/contacts/[contactId]/emails/[emailId]/primary - Set email as primary
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string; emailId: string }> }
) {
  try {
    const { contactId, emailId } = await params;

    const updatedEmail = await db.clientEmails.setPrimary(emailId, contactId);

    return NextResponse.json({ email: updatedEmail });
  } catch (error) {
    console.error("Error setting primary email:", error);
    return NextResponse.json(
      { error: "Failed to set primary email" },
      { status: 500 }
    );
  }
}
