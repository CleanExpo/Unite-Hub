import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getCustomerInvoices, getUpcomingInvoice } from "@/lib/stripe/client";

/**
 * GET /api/subscription/invoices?orgId={orgId}
 * Get billing history and upcoming invoice for an organization
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const limit = parseInt(searchParams.get("limit") || "12");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Get subscription from Convex
    const subscription = await convex.query(api.subscriptions.getByOrganization, {
      orgId: orgId as Id<"organizations">,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get customer invoices from Stripe
    const invoices = await getCustomerInvoices(
      subscription.stripeCustomerId,
      limit
    );

    // Get upcoming invoice
    const upcomingInvoice = await getUpcomingInvoice(
      subscription.stripeCustomerId,
      subscription.stripeSubscriptionId
    );

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
        planTier: subscription.planTier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error: any) {
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
