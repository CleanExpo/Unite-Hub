/**
 * Cron: Daily Document Expiry Checker
 * GET /api/cron/document-expiry
 *
 * Runs daily at 21:00 UTC (07:00 AEST).
 * Schedule in vercel.json: "0 21 * * *"
 *
 * Queries founder_documents for documents expiring within 30 days and
 * inserts alert_events for any that have not already been alerted today.
 * Also fires 'document_expired' alerts for already-expired documents.
 *
 * Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Extend the metric type union used by the alert_events table.
// The DB column accepts any text value; this cast keeps TS happy.
type DocumentAlertMetric = 'document_expiry' | 'document_expired';

interface ExpiringDoc {
  id: string;
  owner_id: string;
  business_id: string;
  file_name: string;
  category: string | null;
  expiry_date: string;
}

/** Returns true when an alert for this document was already fired today. */
async function alreadyFiredTodayForDoc(
  docId: string,
  businessId: string,
  metric: DocumentAlertMetric,
  today: string
): Promise<boolean> {
  try {
    const { count, error } = await supabaseAdmin
      .from('alert_events')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('metric', metric as string)
      .like('label', `%${docId}%`)
      .gte('fired_at', today);

    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = req.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  try {
    // ── Resolve founder user ID ───────────────────────────────────────────────
    let founderId: string | null = process.env.FOUNDER_USER_ID ?? null;

    if (!founderId) {
      const email = process.env.FOUNDER_EMAIL;
      if (email) {
        const { data } = await supabaseAdmin.auth.admin.listUsers();
        const user = data?.users?.find((u) => u.email === email);
        founderId = user?.id ?? null;
      }
    }

    if (!founderId) {
      console.warn('[documentExpiry] No founder user configured — set FOUNDER_USER_ID or FOUNDER_EMAIL');
      return NextResponse.json({ skipped: true, reason: 'No founder user configured' });
    }

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // ── Query expiring documents (today → +30 days) ───────────────────────────
    const { data: expiring, error: expiringError } = await supabaseAdmin
      .from('founder_documents')
      .select('id, owner_id, business_id, file_name, category, expiry_date')
      .eq('owner_id', founderId)
      .gte('expiry_date', today)
      .lte('expiry_date', thirtyDaysFromNow)
      .order('expiry_date', { ascending: true });

    if (expiringError) {
      console.error('[documentExpiry] Failed to query expiring documents:', expiringError.message);
    }

    // ── Query already-expired documents (expiry_date < today) ─────────────────
    const { data: expired, error: expiredError } = await supabaseAdmin
      .from('founder_documents')
      .select('id, owner_id, business_id, file_name, category, expiry_date')
      .eq('owner_id', founderId)
      .lt('expiry_date', today)
      .order('expiry_date', { ascending: false });

    if (expiredError) {
      console.error('[documentExpiry] Failed to query expired documents:', expiredError.message);
    }

    let alertsFired = 0;

    // ── Fire alerts for expiring documents ────────────────────────────────────
    const expiringDocs = (expiring as ExpiringDoc[] | null) ?? [];

    for (const doc of expiringDocs) {
      try {
        const alreadyFired = await alreadyFiredTodayForDoc(
          doc.id,
          doc.business_id,
          'document_expiry',
          today
        );
        if (alreadyFired) continue;

        const expiryMs = new Date(doc.expiry_date).getTime();
        const daysUntilExpiry = Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24));

        const { error: insertError } = await supabaseAdmin.from('alert_events').insert({
          rule_id: null,
          owner_id: founderId,
          business_id: doc.business_id,
          metric: 'document_expiry' as unknown as never,
          actual_value: daysUntilExpiry,
          threshold_value: 30,
          label: `Document expiring: ${doc.file_name} [${doc.id}]`,
        });

        if (insertError) {
          console.error('[documentExpiry] Failed to insert expiry alert for doc', doc.id, insertError.message);
        } else {
          alertsFired++;
        }
      } catch (err) {
        console.error('[documentExpiry] Error processing expiring doc', doc.id, err);
      }
    }

    // ── Fire alerts for already-expired documents ─────────────────────────────
    const expiredDocs = (expired as ExpiringDoc[] | null) ?? [];

    for (const doc of expiredDocs) {
      try {
        const alreadyFired = await alreadyFiredTodayForDoc(
          doc.id,
          doc.business_id,
          'document_expired',
          today
        );
        if (alreadyFired) continue;

        const { error: insertError } = await supabaseAdmin.from('alert_events').insert({
          rule_id: null,
          owner_id: founderId,
          business_id: doc.business_id,
          metric: 'document_expired' as unknown as never,
          actual_value: 0,
          threshold_value: 0,
          label: `Document expired: ${doc.file_name} [${doc.id}]`,
        });

        if (insertError) {
          console.error('[documentExpiry] Failed to insert expired alert for doc', doc.id, insertError.message);
        } else {
          alertsFired++;
        }
      } catch (err) {
        console.error('[documentExpiry] Error processing expired doc', doc.id, err);
      }
    }

    return NextResponse.json({
      checked: expiringDocs.length,
      expiredChecked: expiredDocs.length,
      alertsFired,
      expiringDocs: expiringDocs.map((d) => d.file_name),
    });
  } catch (err) {
    // Always return 200 — non-200 causes Vercel to mark the cron as failed
    console.error('[documentExpiry]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 }
    );
  }
}
