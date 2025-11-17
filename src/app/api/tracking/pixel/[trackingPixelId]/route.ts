import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { publicRateLimit } from "@/lib/rate-limit";

// 1x1 transparent pixel
const PIXEL = Buffer.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x0a,
  0x00, 0x01, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingPixelId: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await publicRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const { trackingPixelId } = await params;
    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.ip || req.headers.get("x-forwarded-for") || "";

    // Find sent email by tracking pixel
    const { data: sentEmails } = await supabase
      .from("sent_emails")
      .select("*")
      .eq("tracking_pixel_id", trackingPixelId);

    if (sentEmails && sentEmails.length > 0) {
      const sentEmail = sentEmails[0];

      // Record the open
      await db.sentEmails.recordOpen(sentEmail.id, {
        ip_address: ip,
        user_agent: userAgent,
      });

      // Auto-update contact engagement
      if (sentEmail.contact_id) {
        // SECURITY FIX: Must include workspace_id for RLS policies
        await db.interactions.create({
          workspace_id: sentEmail.workspace_id,
          contact_id: sentEmail.contact_id,
          interaction_type: "email_opened",
          details: { email_id: sentEmail.id },
          interaction_date: new Date(),
        });
      }
    }

    // Return pixel
    return new NextResponse(PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Tracking error:", error);
    // Return pixel anyway to not break email
    return new NextResponse(PIXEL, {
      headers: { "Content-Type": "image/gif" },
    });
  }
}
