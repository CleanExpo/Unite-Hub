import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("x-webhook-signature");

    // Validate webhook signature if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      // Add your signature validation logic here
      // Example: const isValid = validateSignature(body, signature, webhookSecret);
    }

    const body = await request.json();
    const { event, data } = body;

    switch (event) {
      case "task.completed":
        logger.info("Task completed", { data });
        break;
      case "task.failed":
        logger.warn("Task failed", { data });
        break;
      case "agent.status":
        logger.info("Agent status update", { data });
        break;
      default:
        logger.warn("Unknown webhook event", { event, data });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook error", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
