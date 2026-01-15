/**
 * Shopify Product Sync Service
 *
 * Handles product synchronization between Shopify and local database:
 * - Import products from Shopify
 * - Export products to Shopify
 * - Update product inventory
 * - Bulk operations support
 */

import { ShopifyClient } from './shopify-client.js';
import { createClient } from '@supabase/supabase-js';

export interface Product {
  id: string;
  shopifyId?: string;
  title: string;
  description?: string;
  handle?: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  status?: 'active' | 'draft' | 'archived';
  variants: ProductVariant[];
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  shopifyId?: string;
  productId: string;
  title?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity?: number;
  weight?: number;
  weightUnit?: string;
  barcode?: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface ProductImage {
  id: string;
  shopifyId?: string;
  productId: string;
  src: string;
  altText?: string;
  position?: number;
}

export interface SyncResult {
  success: boolean;
  productsImported?: number;
  productsExported?: number;
  productsUpdated?: number;
  errors?: string[];
}

export class ProductSyncService {
  private shopifyClient: ShopifyClient;
  private supabase: any;
  private workspaceId: string;

  constructor(config: { shop: string; tenantId: string; workspaceId: string }) {
    this.shopifyClient = new ShopifyClient({
      shop: config.shop,
      tenantId: config.tenantId,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    this.workspaceId = config.workspaceId;
  }

  /**
   * Import all products from Shopify to local database
   */
  async importProducts(options: {
    limit?: number;
    status?: 'active' | 'draft' | 'archived';
  } = {}): Promise<SyncResult> {
    const { limit = 250, status } = options;

    try {
      await this.shopifyClient.initialize();

      let hasNextPage = true;
      let cursor: string | null = null;
      let totalImported = 0;
      const errors: string[] = [];

      while (hasNextPage && (!limit || totalImported < limit)) {
        const query = `
          query($first: Int!, $after: String, $query: String) {
            products(first: $first, after: $after, query: $query) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  title
                  description
                  handle
                  productType
                  vendor
                  tags
                  status
                  createdAt
                  updatedAt
                  variants(first: 100) {
                    edges {
                      node {
                        id
                        title
                        sku
                        price
                        compareAtPrice
                        inventoryQuantity
                        weight
                        weightUnit
                        barcode
                      }
                    }
                  }
                  images(first: 10) {
                    edges {
                      node {
                        id
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const variables: any = {
          first: Math.min(50, limit ? limit - totalImported : 50),
          after: cursor,
        };

        if (status) {
          variables.query = `status:${status}`;
        }

        const result = await this.shopifyClient.graphql(query, variables, { cost: 50 });

        if (!result.data?.products) {
          break;
        }

        const { edges, pageInfo } = result.data.products;

        // Process products
        for (const edge of edges) {
          try {
            await this.saveProduct(edge.node);
            totalImported++;
          } catch (error) {
            errors.push(`Failed to import product ${edge.node.id}: ${error}`);
          }
        }

        hasNextPage = pageInfo.hasNextPage;
        cursor = pageInfo.endCursor;
      }

      return {
        success: true,
        productsImported: totalImported,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Export products from local database to Shopify
   */
  async exportProducts(productIds: string[]): Promise<SyncResult> {
    try {
      await this.shopifyClient.initialize();

      let totalExported = 0;
      const errors: string[] = [];

      for (const productId of productIds) {
        try {
          // Fetch product from database
          const { data: product, error } = await this.supabase
            .from('shopify_products')
            .select('*, variants:shopify_product_variants(*), images:shopify_product_images(*)')
            .eq('id', productId)
            .eq('workspace_id', this.workspaceId)
            .single();

          if (error || !product) {
            errors.push(`Product ${productId} not found in database`);
            continue;
          }

          // Create or update in Shopify
          if (product.shopify_id) {
            await this.updateShopifyProduct(product);
          } else {
            await this.createShopifyProduct(product);
          }

          totalExported++;
        } catch (error) {
          errors.push(`Failed to export product ${productId}: ${error}`);
        }
      }

      return {
        success: true,
        productsExported: totalExported,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Get product by Shopify ID
   */
  async getProduct(shopifyId: string): Promise<Product | null> {
    await this.shopifyClient.initialize();

    const query = `
      query($id: ID!) {
        product(id: $id) {
          id
          title
          description
          handle
          productType
          vendor
          tags
          status
          createdAt
          updatedAt
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                price
                compareAtPrice
                inventoryQuantity
                weight
                weightUnit
                barcode
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
        }
      }
    `;

    const result = await this.shopifyClient.graphql(query, { id: shopifyId }, { cost: 10 });

    if (!result.data?.product) {
      return null;
    }

    return this.transformShopifyProduct(result.data.product);
  }

  /**
   * Update product inventory in Shopify
   */
  async updateInventory(updates: Array<{ sku: string; quantity: number }>): Promise<SyncResult> {
    try {
      await this.shopifyClient.initialize();

      let totalUpdated = 0;
      const errors: string[] = [];

      for (const update of updates) {
        try {
          // Find variant by SKU
          const query = `
            query($query: String!) {
              productVariants(first: 1, query: $query) {
                edges {
                  node {
                    id
                    inventoryItem {
                      id
                    }
                  }
                }
              }
            }
          `;

          const result = await this.shopifyClient.graphql(
            query,
            { query: `sku:${update.sku}` },
            { cost: 5 }
          );

          if (!result.data?.productVariants?.edges?.[0]) {
            errors.push(`Variant with SKU ${update.sku} not found`);
            continue;
          }

          const variant = result.data.productVariants.edges[0].node;
          const inventoryItemId = variant.inventoryItem.id;

          // Update inventory
          const mutation = `
            mutation($input: InventoryAdjustQuantityInput!) {
              inventoryAdjustQuantity(input: $input) {
                inventoryLevel {
                  available
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const mutationResult = await this.shopifyClient.graphql(
            mutation,
            {
              input: {
                inventoryLevelId: inventoryItemId,
                availableDelta: update.quantity,
              },
            },
            { cost: 10 }
          );

          if (mutationResult.data?.inventoryAdjustQuantity?.userErrors?.length > 0) {
            errors.push(
              `Failed to update ${update.sku}: ${mutationResult.data.inventoryAdjustQuantity.userErrors[0].message}`
            );
          } else {
            totalUpdated++;
          }
        } catch (error) {
          errors.push(`Failed to update inventory for ${update.sku}: ${error}`);
        }
      }

      return {
        success: true,
        productsUpdated: totalUpdated,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Save product to database
   */
  private async saveProduct(shopifyProduct: any): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const product = this.transformShopifyProduct(shopifyProduct);

    // Upsert product
    const { error: productError } = await this.supabase.from('shopify_products').upsert(
      {
        workspace_id: this.workspaceId,
        shopify_id: product.shopifyId,
        title: product.title,
        description: product.description,
        handle: product.handle,
        product_type: product.productType,
        vendor: product.vendor,
        tags: product.tags,
        status: product.status,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      },
      { onConflict: 'workspace_id,shopify_id' }
    );

    if (productError) {
      throw productError;
    }

    // Get internal product ID
    const { data: savedProduct } = await this.supabase
      .from('shopify_products')
      .select('id')
      .eq('shopify_id', product.shopifyId)
      .eq('workspace_id', this.workspaceId)
      .single();

    if (!savedProduct) {
      throw new Error('Failed to retrieve saved product');
    }

    // Upsert variants
    for (const variant of product.variants) {
      await this.supabase.from('shopify_product_variants').upsert(
        {
          workspace_id: this.workspaceId,
          product_id: savedProduct.id,
          shopify_id: variant.shopifyId,
          title: variant.title,
          sku: variant.sku,
          price: variant.price,
          compare_at_price: variant.compareAtPrice,
          inventory_quantity: variant.inventoryQuantity,
          weight: variant.weight,
          weight_unit: variant.weightUnit,
          barcode: variant.barcode,
        },
        { onConflict: 'workspace_id,shopify_id' }
      );
    }

    // Upsert images
    if (product.images) {
      for (const image of product.images) {
        await this.supabase.from('shopify_product_images').upsert(
          {
            workspace_id: this.workspaceId,
            product_id: savedProduct.id,
            shopify_id: image.shopifyId,
            src: image.src,
            alt_text: image.altText,
            position: image.position,
          },
          { onConflict: 'workspace_id,shopify_id' }
        );
      }
    }
  }

  /**
   * Create product in Shopify
   */
  private async createShopifyProduct(product: any): Promise<void> {
    const mutation = `
      mutation($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input = {
      title: product.title,
      descriptionHtml: product.description,
      productType: product.product_type,
      vendor: product.vendor,
      tags: product.tags,
      status: product.status?.toUpperCase() || 'DRAFT',
    };

    const result = await this.shopifyClient.graphql(mutation, { input }, { cost: 10 });

    if (result.data?.productCreate?.userErrors?.length > 0) {
      throw new Error(result.data.productCreate.userErrors[0].message);
    }

    // Update database with Shopify ID
    const shopifyId = result.data?.productCreate?.product?.id;
    if (shopifyId && this.supabase) {
      await this.supabase
        .from('shopify_products')
        .update({ shopify_id: shopifyId })
        .eq('id', product.id)
        .eq('workspace_id', this.workspaceId);
    }
  }

  /**
   * Update product in Shopify
   */
  private async updateShopifyProduct(product: any): Promise<void> {
    const mutation = `
      mutation($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const input = {
      id: product.shopify_id,
      title: product.title,
      descriptionHtml: product.description,
      productType: product.product_type,
      vendor: product.vendor,
      tags: product.tags,
      status: product.status?.toUpperCase(),
    };

    const result = await this.shopifyClient.graphql(mutation, { input }, { cost: 10 });

    if (result.data?.productUpdate?.userErrors?.length > 0) {
      throw new Error(result.data.productUpdate.userErrors[0].message);
    }
  }

  /**
   * Transform Shopify product to internal format
   */
  private transformShopifyProduct(shopifyProduct: any): Product {
    return {
      id: shopifyProduct.id,
      shopifyId: shopifyProduct.id,
      title: shopifyProduct.title,
      description: shopifyProduct.description,
      handle: shopifyProduct.handle,
      productType: shopifyProduct.productType,
      vendor: shopifyProduct.vendor,
      tags: shopifyProduct.tags,
      status: shopifyProduct.status?.toLowerCase(),
      createdAt: shopifyProduct.createdAt,
      updatedAt: shopifyProduct.updatedAt,
      variants: shopifyProduct.variants.edges.map((edge: any) => ({
        id: edge.node.id,
        shopifyId: edge.node.id,
        productId: shopifyProduct.id,
        title: edge.node.title,
        sku: edge.node.sku,
        price: parseFloat(edge.node.price),
        compareAtPrice: edge.node.compareAtPrice ? parseFloat(edge.node.compareAtPrice) : undefined,
        inventoryQuantity: edge.node.inventoryQuantity,
        weight: edge.node.weight,
        weightUnit: edge.node.weightUnit,
        barcode: edge.node.barcode,
      })),
      images: shopifyProduct.images?.edges.map((edge: any, index: number) => ({
        id: edge.node.id,
        shopifyId: edge.node.id,
        productId: shopifyProduct.id,
        src: edge.node.url,
        altText: edge.node.altText,
        position: index + 1,
      })),
    };
  }
}
