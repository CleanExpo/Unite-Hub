/**
 * Email Unsubscribe API
 *
 * P0-004: CAN-SPAM Compliance
 * Handles email unsubscribe requests
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

// Unsubscribe token configuration
const TOKEN_SECRET = process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "default-secret";
const TOKEN_EXPIRY_HOURS = 720; // 30 days

/**
 * Generate a secure unsubscribe token
 */
export function generateUnsubscribeToken(contactId: string, email: string): string {
  const payload = {
    contactId,
    email,
    exp: Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  };

  const data = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("hex");

  return Buffer.from(`${data}|${signature}`).toString("base64url");
}

/**
 * Verify and decode an unsubscribe token
 */
export function verifyUnsubscribeToken(token: string): { contactId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [data, signature] = decoded.split("|");

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(data)
      .digest("hex");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(data);

    // Check expiry
    if (payload.exp < Date.now()) {
      return null;
    }

    return {
      contactId: payload.contactId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

/**
 * POST /api/email/unsubscribe
 * Process unsubscribe request
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, reason } = body;

    // Method 1: Token-based unsubscribe (from email link)
    if (token) {
      const verified = verifyUnsubscribeToken(token);

      if (!verified) {
        return NextResponse.json(
          { error: "Invalid or expired unsubscribe link" },
          { status: 400 }
        );
      }

      const supabase = getSupabaseAdmin();

      // Update contact preferences
      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          email_opt_out: true,
          email_opt_out_date: new Date().toISOString(),
          email_opt_out_reason: reason || "Unsubscribed via email link",
        })
        .eq("id", verified.contactId);

      if (updateError) {
        console.error("Failed to update contact preferences:", updateError);
        return NextResponse.json(
          { error: "Failed to process unsubscribe request" },
          { status: 500 }
        );
      }

      // Log the unsubscribe
      await supabase.from("auditLogs").insert({
        action: "email_unsubscribe",
        resource: "contact",
        resource_id: verified.contactId,
        agent: "unsubscribe-api",
        status: "success",
        details: {
          email: verified.email,
          reason: reason || "Email link",
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "You have been successfully unsubscribed",
      });
    }

    // Method 2: Direct email unsubscribe (for manual requests)
    if (email) {
      const supabase = getSupabaseAdmin();

      // Find contact by email
      const { data: contact, error: findError } = await supabase
        .from("contacts")
        .select("id, email")
        .eq("email", email.toLowerCase())
        .single();

      if (findError || !contact) {
        // Don't reveal if email exists or not (security)
        return NextResponse.json({
          success: true,
          message: "If this email exists in our system, it has been unsubscribed",
        });
      }

      // Update contact preferences
      const { error: updateError } = await supabase
        .from("contacts")
        .update({
          email_opt_out: true,
          email_opt_out_date: new Date().toISOString(),
          email_opt_out_reason: reason || "Manual unsubscribe request",
        })
        .eq("id", contact.id);

      if (updateError) {
        console.error("Failed to update contact preferences:", updateError);
        return NextResponse.json(
          { error: "Failed to process unsubscribe request" },
          { status: 500 }
        );
      }

      // Log the unsubscribe
      await supabase.from("auditLogs").insert({
        action: "email_unsubscribe",
        resource: "contact",
        resource_id: contact.id,
        agent: "unsubscribe-api",
        status: "success",
        details: {
          email: contact.email,
          reason: reason || "Manual request",
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "If this email exists in our system, it has been unsubscribed",
      });
    }

    return NextResponse.json(
      { error: "Token or email required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to process unsubscribe request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/unsubscribe?token={token}
 * Verify unsubscribe token and return contact info
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    const verified = verifyUnsubscribeToken(token);

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe link" },
        { status: 400 }
      );
    }

    // Mask email for display
    const maskedEmail = verified.email.replace(
      /(.{2})(.*)(@.*)$/,
      (_, start, middle, end) => start + "*".repeat(Math.min(middle.length, 5)) + end
    );

    return NextResponse.json({
      success: true,
      email: maskedEmail,
      contactId: verified.contactId,
    });
  } catch (error) {
    console.error("Unsubscribe verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify unsubscribe link" },
      { status: 500 }
    );
  }
}
