/**
 * Google Merchant Center Feed Service
 *
 * Manages product feed synchronization between local database/Shopify and GMC:
 * - Transform Shopify products to GMC format
 * - Validate product data against GMC requirements
 * - Optimize product data for Shopping ads
 * - Sync products to GMC (insert, update, delete)
 * - Monitor product status and issues
 */

import { GMCClient, GMCProduct } from './gmc-client.js';
import { createClient } from '@supabase/supabase-js';

export interface FeedConfig {
  merchantId: string;
  clientId: string;
  workspaceId: string;
  targetCountry: string; // AU, NZ, US, GB
  contentLanguage: string; // en, en-AU, en-NZ
  currency: string; // AUD, NZD, USD, GBP
  baseUrl: string; // Website base URL for product links
}

export interface ProductTransformOptions {
  includeShipping?: boolean;
  customLabels?: {
    label0?: string;
    label1?: string;
    label2?: string;
    label3?: string;
    label4?: string;
  };
  googleProductCategory?: string;
  brand?: string;
}

export interface FeedValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

export interface FeedSyncResult {
  success: boolean;
  productsProcessed: number;
  productsInserted?: number;
  productsUpdated?: number;
  productsDeleted?: number;
  productsSkipped?: number;
  errors?: Array<{
    productId: string;
    error: string;
  }>;
}

export class FeedService {
  private gmcClient: GMCClient;
  private supabase: any;
  private config: FeedConfig;

  constructor(config: FeedConfig) {
    this.config = config;
    this.gmcClient = new GMCClient({
      merchantId: config.merchantId,
      clientId: config.clientId,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Sync products from local database to GMC
   */
  async syncProductsToGMC(options: {
    productIds?: string[];
    status?: 'active' | 'draft' | 'archived';
    limit?: number;
  } = {}): Promise<FeedSyncResult> {
    try {
      await this.gmcClient.initialize();

      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Fetch products from database
      let query = this.supabase
        .from('shopify_products')
        .select('*, variants:shopify_product_variants(*), images:shopify_product_images(*)')
        .eq('workspace_id', this.config.workspaceId);

      if (options.productIds) {
        query = query.in('id', options.productIds);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: products, error } = await query;

      if (error) {
        throw error;
      }

      if (!products || products.length === 0) {
        return {
          success: true,
          productsProcessed: 0,
          productsInserted: 0,
        };
      }

      // Transform and sync products
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const errors: Array<{ productId: string; error: string }> = [];

      for (const product of products) {
        try {
          // Skip products without variants
          if (!product.variants || product.variants.length === 0) {
            skipped++;
            continue;
          }

          // Transform each variant to a GMC product
          for (const variant of product.variants) {
            const gmcProduct = this.transformToGMCProduct(product, variant);

            // Validate product
            const validation = this.validateProduct(gmcProduct);
            if (!validation.valid) {
              errors.push({
                productId: variant.sku || variant.id,
                error: validation.errors.map((e) => e.message).join(', '),
              });
              continue;
            }

            // Check if product exists in GMC
            const productId = this.buildProductId(gmcProduct);
            let exists = false;

            try {
              await this.gmcClient.getProduct(productId);
              exists = true;
            } catch (error) {
              // Product doesn't exist
            }

            // Insert or update
            if (exists) {
              await this.gmcClient.updateProduct(productId, gmcProduct);
              updated++;
            } else {
              await this.gmcClient.insertProduct(gmcProduct);
              inserted++;
            }

            // Store sync record
            await this.storeSyncRecord(product.id, variant.id, productId, 'synced');
          }
        } catch (error) {
          errors.push({
            productId: product.shopify_id || product.id,
            error: (error as Error).message,
          });
        }
      }

      return {
        success: true,
        productsProcessed: products.length,
        productsInserted: inserted,
        productsUpdated: updated,
        productsSkipped: skipped,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        productsProcessed: 0,
        errors: [{ productId: 'ALL', error: (error as Error).message }],
      };
    }
  }

  /**
   * Transform Shopify product/variant to GMC product format
   */
  private transformToGMCProduct(
    product: any,
    variant: any,
    options: ProductTransformOptions = {}
  ): GMCProduct {
    const offerId = variant.sku || `${product.shopify_id}-${variant.id}`;
    const title = variant.title && variant.title !== 'Default Title'
      ? `${product.title} - ${variant.title}`
      : product.title;

    const gmcProduct: GMCProduct = {
      offerId,
      title: this.truncateString(title, 150),
      description: this.truncateString(product.description || product.title, 5000),
      link: `${this.config.baseUrl}/products/${product.handle}`,
      imageLink: product.images?.[0]?.src || '',
      contentLanguage: this.config.contentLanguage,
      targetCountry: this.config.targetCountry,
      channel: 'online',
      availability: variant.inventory_quantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      price: {
        value: variant.price.toString(),
        currency: this.config.currency,
      },
    };

    // Sale price
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      gmcProduct.salePrice = {
        value: variant.price.toString(),
        currency: this.config.currency,
      };
      gmcProduct.price = {
        value: variant.compare_at_price.toString(),
        currency: this.config.currency,
      };
    }

    // Brand
    if (product.vendor || options.brand) {
      gmcProduct.brand = product.vendor || options.brand;
    }

    // GTIN (barcode)
    if (variant.barcode) {
      gmcProduct.gtin = variant.barcode;
    }

    // MPN (SKU as manufacturer part number)
    if (variant.sku) {
      gmcProduct.mpn = variant.sku;
    }

    // Google Product Category
    if (options.googleProductCategory) {
      gmcProduct.googleProductCategory = options.googleProductCategory;
    }

    // Product Type (from Shopify product_type)
    if (product.product_type) {
      gmcProduct.productType = product.product_type;
    }

    // Shipping weight
    if (variant.weight && variant.weight_unit) {
      gmcProduct.shippingWeight = {
        value: variant.weight.toString(),
        unit: variant.weight_unit.toLowerCase() as 'kg' | 'lb',
      };
    }

    // Shipping (if configured)
    if (options.includeShipping) {
      gmcProduct.shipping = [
        {
          country: this.config.targetCountry,
          price: { value: '0', currency: this.config.currency },
          service: 'Standard',
        },
      ];
    }

    // Custom labels
    if (options.customLabels) {
      if (options.customLabels.label0) gmcProduct.customLabel0 = options.customLabels.label0;
      if (options.customLabels.label1) gmcProduct.customLabel1 = options.customLabels.label1;
      if (options.customLabels.label2) gmcProduct.customLabel2 = options.customLabels.label2;
      if (options.customLabels.label3) gmcProduct.customLabel3 = options.customLabels.label3;
      if (options.customLabels.label4) gmcProduct.customLabel4 = options.customLabels.label4;
    }

    // Additional images
    if (product.images && product.images.length > 1) {
      gmcProduct.additionalImageLinks = product.images
        .slice(1, 11) // Max 10 additional images
        .map((img: any) => img.src);
    }

    return gmcProduct;
  }

  /**
   * Validate GMC product data
   */
  validateProduct(product: GMCProduct): FeedValidationResult {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    // Required fields
    if (!product.offerId || product.offerId.length === 0) {
      errors.push({ field: 'offerId', message: 'Offer ID is required', severity: 'error' });
    }

    if (!product.title || product.title.length < 1 || product.title.length > 150) {
      errors.push({
        field: 'title',
        message: 'Title must be 1-150 characters',
        severity: 'error',
      });
    }

    if (!product.description || product.description.length < 1 || product.description.length > 5000) {
      errors.push({
        field: 'description',
        message: 'Description must be 1-5000 characters',
        severity: 'error',
      });
    }

    if (!product.link || !this.isValidUrl(product.link)) {
      errors.push({ field: 'link', message: 'Valid product link is required', severity: 'error' });
    }

    if (!product.imageLink || !this.isValidUrl(product.imageLink)) {
      errors.push({
        field: 'imageLink',
        message: 'Valid image link is required',
        severity: 'error',
      });
    }

    if (!product.price || !product.price.value || !product.price.currency) {
      errors.push({ field: 'price', message: 'Valid price is required', severity: 'error' });
    }

    // Recommended fields
    if (!product.brand) {
      warnings.push({ field: 'brand', message: 'Brand is recommended for better performance' });
    }

    if (!product.gtin && !product.mpn) {
      warnings.push({
        field: 'gtin/mpn',
        message: 'GTIN or MPN is recommended for product identification',
      });
    }

    if (!product.googleProductCategory) {
      warnings.push({
        field: 'googleProductCategory',
        message: 'Google Product Category is recommended for better ad targeting',
      });
    }

    // Image validation
    if (product.imageLink && !product.imageLink.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      warnings.push({
        field: 'imageLink',
        message: 'Image should be JPG, PNG, GIF, or WebP format',
      });
    }

    // Price validation
    if (product.salePrice && parseFloat(product.salePrice.value) >= parseFloat(product.price.value)) {
      errors.push({
        field: 'salePrice',
        message: 'Sale price must be less than regular price',
        severity: 'error',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get product status from GMC
   */
  async getProductStatus(productId: string): Promise<any> {
    await this.gmcClient.initialize();
    return this.gmcClient.getProductStatus(productId);
  }

  /**
   * Delete product from GMC
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.gmcClient.initialize();
    await this.gmcClient.deleteProduct(productId);
  }

  /**
   * Build GMC product ID from product data
   */
  private buildProductId(product: GMCProduct): string {
    return `online:${product.contentLanguage}:${product.targetCountry}:${product.offerId}`;
  }

  /**
   * Store sync record in database
   */
  private async storeSyncRecord(
    productId: string,
    variantId: string,
    gmcProductId: string,
    status: string
  ): Promise<void> {
    if (!this.supabase) return;

    await this.supabase.from('gmc_product_sync').upsert(
      {
        workspace_id: this.config.workspaceId,
        product_id: productId,
        variant_id: variantId,
        gmc_product_id: gmcProductId,
        merchant_id: this.config.merchantId,
        status,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,variant_id,merchant_id' }
    );
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    totalSynced: number;
    lastSyncAt: string | null;
    pendingSync: number;
  }> {
    if (!this.supabase) {
      return { totalSynced: 0, lastSyncAt: null, pendingSync: 0 };
    }

    const { data: synced } = await this.supabase
      .from('gmc_product_sync')
      .select('id, synced_at')
      .eq('workspace_id', this.config.workspaceId)
      .eq('merchant_id', this.config.merchantId);

    const { data: products } = await this.supabase
      .from('shopify_products')
      .select('id')
      .eq('workspace_id', this.config.workspaceId)
      .eq('status', 'active');

    const totalSynced = synced?.length || 0;
    const lastSyncAt = synced?.[0]?.synced_at || null;
    const pendingSync = (products?.length || 0) - totalSynced;

    return { totalSynced, lastSyncAt, pendingSync };
  }

  /**
   * Utility: Truncate string to max length
   */
  private truncateString(str: string, maxLength: number): string {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str;
  }

  /**
   * Utility: Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
