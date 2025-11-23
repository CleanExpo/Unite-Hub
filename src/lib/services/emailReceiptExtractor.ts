/**
 * Email Receipt Extractor
 * Phase 41: Founder Financial Command Center
 *
 * Extracts invoice/receipt data from founder's email inbox
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export interface ExtractedReceipt {
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  invoiceNumber?: string;
  dueDate?: string;
  description?: string;
  confidence: number;
}

export interface EmailMessage {
  id: string;
  subject: string;
  sender: string;
  receivedAt: string;
  body: string;
  attachments: string[];
}

// Common vendor patterns
const VENDOR_PATTERNS: Record<string, string> = {
  "xero.com": "Xero",
  "aws.amazon.com": "Amazon Web Services",
  "stripe.com": "Stripe",
  "github.com": "GitHub",
  "google.com": "Google",
  "microsoft.com": "Microsoft",
  "adobe.com": "Adobe",
  "canva.com": "Canva",
  "slack.com": "Slack",
  "zoom.us": "Zoom",
  "dropbox.com": "Dropbox",
  "notion.so": "Notion",
  "figma.com": "Figma",
  "vercel.com": "Vercel",
  "netlify.com": "Netlify",
  "digitalocean.com": "DigitalOcean",
  "cloudflare.com": "Cloudflare",
};

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  "Amazon Web Services": "Cloud Infrastructure",
  "Stripe": "Payment Processing",
  "GitHub": "Development Tools",
  "Google": "Cloud Services",
  "Microsoft": "Software Licenses",
  "Adobe": "Design Software",
  "Canva": "Design Tools",
  "Slack": "Communication",
  "Zoom": "Communication",
  "Dropbox": "Storage",
  "Notion": "Productivity",
  "Figma": "Design Tools",
  "Vercel": "Hosting",
  "Netlify": "Hosting",
  "DigitalOcean": "Cloud Infrastructure",
  "Cloudflare": "CDN & Security",
  "Xero": "Accounting Software",
};

/**
 * Fetch founder's inbox for receipts
 */
export async function fetchFounderInbox(): Promise<EmailMessage[]> {
  // In production, this would use Gmail API
  // Placeholder structure
  const accessToken = process.env.GMAIL_FOUNDER_ACCESS_TOKEN;

  if (!accessToken) {
    console.log("Gmail founder access token not configured");
    return [];
  }

  // Would fetch emails with receipt/invoice keywords
  // For now, return empty array (structure ready)
  return [];
}

/**
 * Extract invoice data from email body and attachments
 */
export async function extractInvoiceData(
  emailBody: string,
  attachments: string[]
): Promise<ExtractedReceipt | null> {
  // Extract amount
  const amountMatch = emailBody.match(
    /\$\s*([\d,]+\.?\d*)|Total[:\s]+\$?([\d,]+\.?\d*)|Amount[:\s]+\$?([\d,]+\.?\d*)/i
  );
  const amount = amountMatch
    ? parseFloat((amountMatch[1] || amountMatch[2] || amountMatch[3]).replace(/,/g, ""))
    : 0;

  // Extract invoice number
  const invoiceMatch = emailBody.match(
    /Invoice\s*#?\s*:?\s*([A-Z0-9-]+)|INV[:\s-]*([A-Z0-9-]+)/i
  );
  const invoiceNumber = invoiceMatch ? (invoiceMatch[1] || invoiceMatch[2]) : undefined;

  // Extract due date
  const dueMatch = emailBody.match(
    /Due\s*[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|Due Date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  );
  const dueDate = dueMatch ? (dueMatch[1] || dueMatch[2]) : undefined;

  // Detect currency
  const currency = emailBody.includes("AUD") || emailBody.includes("A$")
    ? "AUD"
    : emailBody.includes("USD") || emailBody.includes("US$")
    ? "USD"
    : "AUD";

  if (amount === 0) {
    return null;
  }

  return {
    vendor: "Unknown",
    amount,
    currency,
    category: "Uncategorized",
    invoiceNumber,
    dueDate,
    confidence: 0.6,
  };
}

/**
 * Detect vendor and category from email
 */
export function detectVendorAndCategory(
  sender: string,
  subject: string,
  body: string
): { vendor: string; category: string } {
  // Check sender domain
  const senderDomain = sender.split("@")[1]?.toLowerCase() || "";

  for (const [domain, vendor] of Object.entries(VENDOR_PATTERNS)) {
    if (senderDomain.includes(domain)) {
      return {
        vendor,
        category: CATEGORY_MAP[vendor] || "General",
      };
    }
  }

  // Check subject line for vendor names
  const subjectLower = subject.toLowerCase();
  for (const [, vendor] of Object.entries(VENDOR_PATTERNS)) {
    if (subjectLower.includes(vendor.toLowerCase())) {
      return {
        vendor,
        category: CATEGORY_MAP[vendor] || "General",
      };
    }
  }

  return {
    vendor: "Unknown",
    category: "Uncategorized",
  };
}

/**
 * Push extracted receipt to unified ledger
 */
export async function pushToUnifiedLedger(
  email: EmailMessage,
  receipt: ExtractedReceipt
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const supabase = await getSupabaseServer();

  // First, save to email_receipts table
  const { data: savedReceipt, error: receiptError } = await supabase
    .from("founder_email_receipts")
    .insert({
      email_id: email.id,
      subject: email.subject,
      sender: email.sender,
      received_at: email.receivedAt,
      vendor: receipt.vendor,
      amount: receipt.amount,
      currency: receipt.currency,
      category: receipt.category,
      invoice_number: receipt.invoiceNumber,
      due_date: receipt.dueDate,
      extracted_data: receipt,
      attachment_urls: email.attachments,
      is_processed: true,
    })
    .select()
    .single();

  if (receiptError) {
    return { success: false, error: receiptError.message };
  }

  // Get default expense account
  const { data: account } = await supabase
    .from("founder_financial_accounts")
    .select("id")
    .eq("account_type", "expense")
    .limit(1)
    .single();

  if (!account) {
    return { success: false, error: "No expense account found" };
  }

  // Create transaction
  const { data: transaction, error: txnError } = await supabase
    .from("founder_financial_transactions")
    .insert({
      account_id: account.id,
      date: email.receivedAt.split("T")[0],
      description: `${receipt.vendor} - ${email.subject}`,
      amount: receipt.amount,
      transaction_type: "debit",
      source: "email_receipt",
      category: receipt.category,
      vendor: receipt.vendor,
      invoice_number: receipt.invoiceNumber,
    })
    .select()
    .single();

  if (txnError) {
    return { success: false, error: txnError.message };
  }

  // Link receipt to transaction
  await supabase
    .from("founder_email_receipts")
    .update({ transaction_id: transaction.id })
    .eq("id", savedReceipt.id);

  return { success: true, transactionId: transaction.id };
}

/**
 * Process all unprocessed emails in inbox
 */
export async function processInbox(): Promise<{
  processed: number;
  errors: string[];
}> {
  const emails = await fetchFounderInbox();
  let processed = 0;
  const errors: string[] = [];

  for (const email of emails) {
    try {
      // Extract receipt data
      const receipt = await extractInvoiceData(email.body, email.attachments);

      if (!receipt) {
        continue;
      }

      // Detect vendor and category
      const { vendor, category } = detectVendorAndCategory(
        email.sender,
        email.subject,
        email.body
      );

      receipt.vendor = vendor;
      receipt.category = category;

      // Push to ledger
      const result = await pushToUnifiedLedger(email, receipt);

      if (result.success) {
        processed++;
      } else {
        errors.push(`Email ${email.id}: ${result.error}`);
      }
    } catch (err) {
      errors.push(`Email ${email.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { processed, errors };
}

export default {
  fetchFounderInbox,
  extractInvoiceData,
  detectVendorAndCategory,
  pushToUnifiedLedger,
  processInbox,
};
