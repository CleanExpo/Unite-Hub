/**
 * POST /api/integrations/shopify/inventory/webhook
 *
 * Receives Shopify webhook events for inventory_levels/update and products/update.
 * Verifies HMAC signature, then upserts data into shopify_inventory table.
 * Returns 200 OK immediately — Shopify retries on non-200.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createHmac, timingSafeEqual } from 'crypto';

// ─── HMAC Verification ─────────────────────────────────────────────────────

function verifyShopifyHmac(rawBody: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[shopify/webhook] SHOPIFY_WEBHOOK_SECRET not set — skipping HMAC verification');
    return true; // Allow in dev without secret
  }

  const computed = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  try {
    return timingSafeEqual(
      Buffer.from(computed, 'base64'),
      Buffer.from(hmacHeader, 'base64'),
    );
  } catch {
    return false;
  }
}

// ─── Inventory Level Update Handler ─────────────────────────────────────────

async function handleInventoryUpdate(
  payload: Record<string, unknown>,
  shopDomain: string,
) {
  const inventoryItemId = payload.inventory_item_id as number | undefined;
  const locationId = payload.location_id as number | undefined;
  const available = payload.available as number | undefined;

  if (!inventoryItemId) return;

  const { error } = await supabaseAdmin
    .from('shopify_inventory')
    .upsert(
      {
        shop_domain: shopDomain,
        inventory_item_id: inventoryItemId,
        location_id: locationId ?? 0,
        available: available ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'shop_domain,inventory_item_id,location_id' },
    );

  if (error) {
    console.error('[shopify/webhook] inventory upsert error:', error.message);
  }
}

// ─── Product Update Handler ─────────────────────────────────────────────────

interface ShopifyVariant {
  id: number;
  price: string;
  sku: string;
  inventory_item_id: number;
}

async function handleProductUpdate(
  payload: Record<string, unknown>,
  shopDomain: string,
) {
  const productId = payload.id as number | undefined;
  const title = payload.title as string | undefined;
  const variants = (payload.variants ?? []) as ShopifyVariant[];

  if (!productId || variants.length === 0) return;

  // Extract restoration metafields if present
  const metafields: Record<string, string> = {};
  const rawMetafields = (payload.metafields ?? []) as Array<{
    namespace?: string;
    key?: string;
    value?: string;
  }>;
  for (const mf of rawMetafields) {
    if (mf.namespace === 'restoration' && mf.key && mf.value) {
      metafields[mf.key] = mf.value;
    }
  }

  // Upsert each variant as an inventory record
  for (const variant of variants) {
    if (!variant.inventory_item_id) continue;

    const { error } = await supabaseAdmin
      .from('shopify_inventory')
      .upsert(
        {
          shop_domain: shopDomain,
          inventory_item_id: variant.inventory_item_id,
          location_id: 0, // Updated by inventory_levels/update webhook
          product_id: productId,
          product_title: title ?? null,
          sku: variant.sku ?? null,
          variant_price: variant.price ? parseFloat(variant.price) : null,
          metafields: Object.keys(metafields).length > 0 ? metafields : undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'shop_domain,inventory_item_id,location_id' },
      );

    if (error) {
      console.error('[shopify/webhook] product upsert error:', error.message);
    }
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256') ?? '';
    const topic = req.headers.get('x-shopify-topic') ?? '';
    const shopDomain = req.headers.get('x-shopify-shop-domain') ?? '';

    // Verify HMAC signature
    if (!verifyShopifyHmac(rawBody, hmacHeader)) {
      console.warn('[shopify/webhook] HMAC verification failed for', shopDomain);
      return new NextResponse(null, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    // Route by topic
    switch (topic) {
      case 'inventory_levels/update':
        await handleInventoryUpdate(payload, shopDomain);
        break;

      case 'products/update':
        await handleProductUpdate(payload, shopDomain);
        break;

      default:
        // Log unhandled topics for future implementation
        console.info('[shopify/webhook] unhandled topic:', topic, 'from', shopDomain);
        break;
    }

    // Always return 200 — Shopify retries on non-2xx
    return new NextResponse(null, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook processing error';
    console.error('[shopify/webhook]', message);
    // Still return 200 to prevent Shopify retries on our errors
    return new NextResponse(null, { status: 200 });
  }
}
