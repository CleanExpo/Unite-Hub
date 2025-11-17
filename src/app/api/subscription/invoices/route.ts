import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { UUIDSchema } from "@/lib/validation/schemas";
import { getCustomerInvoices, getUpcomingInvoice } from "@/lib/stripe/client";

/**
 * GET /api/subscription/invoices?orgId={orgId}
 * Get billing history and upcoming invoice for an organization
 */
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting (100 req/15min - API tier)
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(req);

    // Verify user has access to organization
    if (orgId !== user.orgId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user role for additional checks
    const supabase = await getSupabaseServer();
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("id, role")
      .eq("user_id", user.userId)
      .eq("org_id", orgId)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only allow owners and admins to view invoices
    if (userOrg.role !== "owner" && userOrg.role !== "admin") {
      return NextResponse.json(
        { error: "Only organization owners and admins can view invoices" },
        { status: 403 }
      );
    }

    // Get subscription from Supabase
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, plan, status, current_period_end")
      .eq("org_id", orgId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    if (!subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer ID found" },
        { status: 404 }
      );
    }

    // Get customer invoices from Stripe
    const invoices = await getCustomerInvoices(
      subscription.stripe_customer_id,
      limit
    );

    // Get upcoming invoice
    const upcomingInvoice = subscription.stripe_subscription_id
      ? await getUpcomingInvoice(
          subscription.stripe_customer_id,
          subscription.stripe_subscription_id
        )
      : null;

    // Format invoice data
    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      created: invoice.created * 1000,
      dueDate: invoice.due_date ? invoice.due_date * 1000 : null,
      periodStart: invoice.period_start ? invoice.period_start * 1000 : null,
      periodEnd: invoice.period_end ? invoice.period_end * 1000 : null,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      paid: invoice.paid,
      attempted: invoice.attempted,
      description: invoice.description,
    }));

    // Format upcoming invoice
    let formattedUpcomingInvoice = null;
    if (upcomingInvoice) {
      formattedUpcomingInvoice = {
        amount: upcomingInvoice.amount_due,
        currency: upcomingInvoice.currency,
        periodStart: upcomingInvoice.period_start * 1000,
        periodEnd: upcomingInvoice.period_end * 1000,
        subtotal: upcomingInvoice.subtotal,
        tax: upcomingInvoice.tax,
        total: upcomingInvoice.total,
        nextPaymentAttempt: upcomingInvoice.next_payment_attempt
          ? upcomingInvoice.next_payment_attempt * 1000
          : null,
        lines: upcomingInvoice.lines.data.map((line) => ({
          description: line.description,
          amount: line.amount,
          quantity: line.quantity,
          period: {
            start: line.period.start * 1000,
            end: line.period.end * 1000,
          },
        })),
      };
    }

    return NextResponse.json({
      invoices: formattedInvoices,
      upcomingInvoice: formattedUpcomingInvoice,
      subscription: {
        planTier: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      },
    });
  } catch (error: any) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoices",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
