/**
 * Web Push Service
 *
 * Setup (one-time):
 *   node -e "const wP=require('web-push'); const k=wP.generateVAPIDKeys(); console.log(JSON.stringify(k))"
 * Add to .env.local:
 *   VAPID_PUBLIC_KEY=<publicKey>
 *   VAPID_PRIVATE_KEY=<privateKey>
 *   VAPID_SUBJECT=mailto:hello@unite-group.in
 */

import * as webPush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase';

function configureVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:hello@unite-group.in';
  if (!pub || !priv) return false;
  webPush.setVapidDetails(subject, pub, priv);
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

export async function sendPushToOwner(
  ownerId: string,
  payload: { title: string; body: string; url?: string }
): Promise<{ sent: number; failed: number; notConfigured?: boolean }> {
  if (!configureVapid()) {
    return { sent: 0, failed: 0, notConfigured: true };
  }

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('owner_id', ownerId);

  if (error || !subs?.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          JSON.stringify(payload),
          { TTL: 86400 }
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          staleIds.push(sub.id); // subscription gone, clean up
        }
        failed++;
      }
    })
  );

  if (staleIds.length) {
    await supabaseAdmin.from('push_subscriptions').delete().in('id', staleIds);
  }

  return { sent, failed };
}
