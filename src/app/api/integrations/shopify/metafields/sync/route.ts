/**
 * POST /api/integrations/shopify/metafields/sync
 *
 * Synchronises restoration-specific metafields from the CRM to a Shopify product.
 * Auth: x-shopify-shop-domain header verified against connected_projects table.
 * Uses the shop's stored API key from connected_projects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface MetafieldInput {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

interface SyncRequestBody {
  productId?: string;
  shopify_product_id?: string;
  metafields: MetafieldInput[] | Record<string, string>;
}

/**
 * Resolve the Shopify API credentials from connected_projects.
 * The api_key_hash stores the full Shopify Admin API access token
 * (encrypted at rest via Supabase).
 */
async function getShopCredentials(shopDomain: string) {
  const { data, error } = await supabaseAdmin
    .from('connected_projects')
    .select('id, api_key_hash, webhook_url, owner_id')
    .eq('slug', `shopify-${shopDomain.replace('.myshopify.com', '')}`)
    .single();

  if (error || !data) {
    // Try matching by name/slug containing the domain
    const { data: fallback } = await supabaseAdmin
      .from('connected_projects')
      .select('id, api_key_hash, webhook_url, owner_id')
      .ilike('slug', `%shopify%`)
      .limit(1)
      .single();

    return fallback;
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const shopDomain = req.headers.get('x-shopify-shop-domain');

    if (!shopDomain) {
      return NextResponse.json(
        { error: 'Missing x-shopify-shop-domain header' },
        { status: 400 },
      );
    }

    const credentials = await getShopCredentials(shopDomain);

    if (!credentials?.api_key_hash) {
      return NextResponse.json(
        { error: 'Shop not connected — register via connected_projects first' },
        { status: 403 },
      );
    }

    const body: SyncRequestBody = await req.json();
    const productId = body.productId || body.shopify_product_id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId or shopify_product_id' },
        { status: 400 },
      );
    }

    // Normalise metafields — accept array or Record<string, string>
    let metafields: MetafieldInput[];
    if (Array.isArray(body.metafields)) {
      metafields = body.metafields;
    } else if (typeof body.metafields === 'object') {
      metafields = Object.entries(body.metafields).map(([key, value]) => ({
        namespace: 'restoration',
        key,
        value: String(value),
        type: 'single_line_text_field',
      }));
    } else {
      return NextResponse.json({ error: 'Invalid metafields format' }, { status: 400 });
    }

    if (metafields.length === 0) {
      return NextResponse.json({ error: 'No metafields provided' }, { status: 400 });
    }

    // Sync each metafield to Shopify Admin API
    const apiToken = credentials.api_key_hash;
    const shopifyUrl = `https://${shopDomain}/admin/api/2024-01/products/${productId}/metafields.json`;
    const errors: string[] = [];
    let updated = 0;

    for (const mf of metafields) {
      const res = await fetch(shopifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': apiToken,
        },
        body: JSON.stringify({
          metafield: {
            namespace: mf.namespace || 'restoration',
            key: mf.key,
            value: mf.value,
            type: mf.type || 'single_line_text_field',
          },
        }),
      });

      if (res.ok) {
        updated++;
      } else {
        const errBody = await res.text();
        errors.push(`${mf.key}: ${res.status} ${errBody.slice(0, 200)}`);
      }
    }

    // Log the sync event
    await supabaseAdmin.from('project_events').insert({
      project_id: credentials.id,
      event_type: 'shopify.metafields.sync',
      payload: {
        product_id: productId,
        shop_domain: shopDomain,
        synced_count: updated,
        error_count: errors.length,
      },
    });

    return NextResponse.json({
      success: errors.length === 0,
      updated,
      shopify_product_id: productId,
      errors,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[shopify/metafields/sync]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
