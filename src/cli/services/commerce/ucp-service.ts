/**
 * UCP (Universal Commerce Protocol) Service
 *
 * Enables direct offers in AI search results with "Buy Now" functionality.
 * Implements structured commerce data for AI-native shopping experiences.
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';

export interface DirectOffer {
  id: string;
  productId: string;
  sku: string;
  title: string;
  basePrice: number;
  offerPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  currency: string;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock';
  inventory: number;
  validFrom: string;
  validUntil: string;
  buyNowUrl: string;
  termsUrl?: string;
  shippingInfo?: ShippingInfo;
  enabled: boolean;
}

export interface ShippingInfo {
  freeShipping: boolean;
  estimatedDays: number;
  regions: string[];
  restrictions?: string[];
}

export interface UCPStructuredData {
  '@context': 'https://schema.org';
  '@type': 'Offer';
  sku: string;
  name: string;
  description: string;
  price: number;
  priceCurrency: string;
  availability: string;
  url: string;
  seller: {
    '@type': 'Organization';
    name: string;
  };
  priceValidUntil?: string;
  shippingDetails?: {
    '@type': 'OfferShippingDetails';
    shippingRate: {
      '@type': 'MonetaryAmount';
      value: number;
      currency: string;
    };
    deliveryTime: {
      '@type': 'ShippingDeliveryTime';
      businessDays: {
        '@type': 'OpeningHoursSpecification';
        minValue: number;
        maxValue: number;
      };
    };
  };
}

export interface EnableOfferOptions {
  productId: string;
  discount?: string; // "10%" or "50.00"
  currency?: string;
  validUntilDays?: number;
  freeShipping?: boolean;
  estimatedDeliveryDays?: number;
  regions?: string[];
}

export interface EnableOfferResult {
  offer: DirectOffer;
  structuredData: UCPStructuredData;
  embedUrl: string;
  enabled: boolean;
}

export class UCPService {
  private supabase;
  private workspaceId: string;

  constructor() {
    const config = ConfigManager.getInstance();
    this.workspaceId = config.getWorkspaceId();

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async enableOffer(options: EnableOfferOptions): Promise<EnableOfferResult> {
    console.log(`[UCP] Enabling direct offer for product ${options.productId}`);

    // Step 1: Fetch product details
    const product = await this.getProduct(options.productId);
    if (!product) {
      throw new Error(`Product not found: ${options.productId}`);
    }

    // Step 2: Calculate offer price
    const { offerPrice, discount, discountType } = this.calculateDiscount(
      product.price,
      options.discount
    );

    // Step 3: Create direct offer
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (options.validUntilDays || 30));

    const offer: DirectOffer = {
      id: `offer-${Date.now()}`,
      productId: product.id,
      sku: product.sku,
      title: product.title,
      basePrice: product.price,
      offerPrice,
      discount,
      discountType,
      currency: options.currency || product.currency,
      availability: this.getAvailability(product.inventory),
      inventory: product.inventory,
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString(),
      buyNowUrl: this.generateBuyNowUrl(product.sku),
      shippingInfo: {
        freeShipping: options.freeShipping || false,
        estimatedDays: options.estimatedDeliveryDays || 5,
        regions: options.regions || ['AU', 'NZ'],
      },
      enabled: true,
    };

    // Step 4: Generate UCP structured data
    const structuredData = this.generateStructuredData(offer, product);

    // Step 5: Store offer in database
    await this.storeOffer(offer);

    // Step 6: Generate embed URL for AI platforms
    const embedUrl = this.generateEmbedUrl(offer.id);

    console.log(`[UCP] Direct offer enabled: ${offer.sku} - ${offer.discount}${discountType === 'percentage' ? '%' : offer.currency} off`);

    return {
      offer,
      structuredData,
      embedUrl,
      enabled: true,
    };
  }

  async disableOffer(offerId: string): Promise<void> {
    await this.supabase
      .from('ucp_offers')
      .update({ enabled: false, disabled_at: new Date().toISOString() })
      .eq('id', offerId)
      .eq('workspace_id', this.workspaceId);

    console.log(`[UCP] Offer disabled: ${offerId}`);
  }

  async getActiveOffers(limit: number = 50): Promise<DirectOffer[]> {
    const { data } = await this.supabase
      .from('ucp_offers')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('enabled', true)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((row) => this.mapToDirectOffer(row));
  }

  async getOfferByProductId(productId: string): Promise<DirectOffer | null> {
    const { data } = await this.supabase
      .from('ucp_offers')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('product_id', productId)
      .eq('enabled', true)
      .gte('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return null;

    return this.mapToDirectOffer(data[0]);
  }

  private async getProduct(productId: string): Promise<any> {
    const { data } = await this.supabase
      .from('shopify_products')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .or(`shopify_product_id.eq.${productId},sku.eq.${productId}`)
      .limit(1);

    if (!data || data.length === 0) {
      return null;
    }

    return {
      id: data[0].shopify_product_id,
      sku: data[0].sku,
      title: data[0].title,
      description: data[0].description,
      price: data[0].price,
      currency: data[0].currency,
      inventory: data[0].inventory,
      images: data[0].images || [],
      metadata: data[0].metadata || {},
    };
  }

  private calculateDiscount(
    basePrice: number,
    discount?: string
  ): { offerPrice: number; discount: number; discountType: 'percentage' | 'fixed' } {
    if (!discount) {
      return { offerPrice: basePrice, discount: 0, discountType: 'percentage' };
    }

    // Parse discount: "10%" or "50.00"
    if (discount.endsWith('%')) {
      const percentage = parseFloat(discount.replace('%', ''));
      const discountAmount = (basePrice * percentage) / 100;
      return {
        offerPrice: basePrice - discountAmount,
        discount: percentage,
        discountType: 'percentage',
      };
    } else {
      const fixedAmount = parseFloat(discount);
      return {
        offerPrice: basePrice - fixedAmount,
        discount: fixedAmount,
        discountType: 'fixed',
      };
    }
  }

  private getAvailability(inventory: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (inventory === 0) return 'out_of_stock';
    if (inventory < 10) return 'low_stock';
    return 'in_stock';
  }

  private generateBuyNowUrl(sku: string): string {
    // In production, this would generate a real checkout URL
    return `https://shop.example.com/buy/${sku}?utm_source=ai_search&utm_medium=ucp`;
  }

  private generateEmbedUrl(offerId: string): string {
    // URL for AI platforms to embed the offer
    return `https://api.example.com/ucp/offers/${offerId}/embed`;
  }

  private generateStructuredData(offer: DirectOffer, product: any): UCPStructuredData {
    const availability =
      offer.availability === 'in_stock'
        ? 'https://schema.org/InStock'
        : offer.availability === 'low_stock'
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/OutOfStock';

    const structuredData: UCPStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Offer',
      sku: offer.sku,
      name: offer.title,
      description: product.description || '',
      price: offer.offerPrice,
      priceCurrency: offer.currency,
      availability,
      url: offer.buyNowUrl,
      seller: {
        '@type': 'Organization',
        name: product.metadata?.vendor || 'Online Store',
      },
      priceValidUntil: offer.validUntil,
    };

    // Add shipping details if available
    if (offer.shippingInfo) {
      structuredData.shippingDetails = {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: offer.shippingInfo.freeShipping ? 0 : 9.95,
          currency: offer.currency,
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'OpeningHoursSpecification',
            minValue: offer.shippingInfo.estimatedDays,
            maxValue: offer.shippingInfo.estimatedDays + 2,
          },
        },
      };
    }

    return structuredData;
  }

  private async storeOffer(offer: DirectOffer): Promise<void> {
    const record = {
      id: offer.id,
      workspace_id: this.workspaceId,
      product_id: offer.productId,
      sku: offer.sku,
      title: offer.title,
      base_price: offer.basePrice,
      offer_price: offer.offerPrice,
      discount: offer.discount,
      discount_type: offer.discountType,
      currency: offer.currency,
      availability: offer.availability,
      inventory: offer.inventory,
      valid_from: offer.validFrom,
      valid_until: offer.validUntil,
      buy_now_url: offer.buyNowUrl,
      shipping_info: offer.shippingInfo,
      enabled: offer.enabled,
      created_at: new Date().toISOString(),
    };

    await this.supabase.from('ucp_offers').insert(record);
  }

  private mapToDirectOffer(row: any): DirectOffer {
    return {
      id: row.id,
      productId: row.product_id,
      sku: row.sku,
      title: row.title,
      basePrice: row.base_price,
      offerPrice: row.offer_price,
      discount: row.discount,
      discountType: row.discount_type,
      currency: row.currency,
      availability: row.availability,
      inventory: row.inventory,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      buyNowUrl: row.buy_now_url,
      shippingInfo: row.shipping_info,
      enabled: row.enabled,
    };
  }

  async getOfferAnalytics(offerId: string): Promise<any> {
    // Get offer performance metrics
    const { data } = await this.supabase
      .from('ucp_offer_analytics')
      .select('*')
      .eq('offer_id', offerId)
      .eq('workspace_id', this.workspaceId)
      .order('created_at', { ascending: false })
      .limit(1);

    return data?.[0] || null;
  }
}
