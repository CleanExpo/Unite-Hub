/**
 * Shopify Order Sync Service
 *
 * Handles order synchronization from Shopify to local database:
 * - Import orders from Shopify
 * - Sync order status updates
 * - Track fulfillment status
 * - Process refunds
 */

import { ShopifyClient } from './shopify-client.js';
import { createClient } from '@supabase/supabase-js';

export interface Order {
  id: string;
  shopifyId: string;
  orderNumber: number;
  email: string;
  phone?: string;
  financialStatus: 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided';
  fulfillmentStatus: 'fulfilled' | 'partial' | 'unfulfilled' | null;
  cancelledAt?: string;
  cancelReason?: string;
  currency: string;
  subtotalPrice: number;
  totalPrice: number;
  totalTax: number;
  totalDiscounts: number;
  totalShipping: number;
  lineItems: OrderLineItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface OrderLineItem {
  id: string;
  shopifyId: string;
  orderId: string;
  productId?: string;
  variantId?: string;
  title: string;
  quantity: number;
  price: number;
  sku?: string;
  vendor?: string;
  fulfillmentStatus?: string;
}

export interface Address {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  phone?: string;
}

export interface Customer {
  shopifyId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  ordersCount?: number;
  totalSpent?: number;
}

export interface SyncResult {
  success: boolean;
  ordersImported?: number;
  ordersUpdated?: number;
  errors?: string[];
}

export class OrderSyncService {
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
   * Import all orders from Shopify
   */
  async importOrders(options: {
    limit?: number;
    status?: string;
    createdAfter?: Date;
  } = {}): Promise<SyncResult> {
    const { limit = 250, status, createdAfter } = options;

    try {
      await this.shopifyClient.initialize();

      let hasNextPage = true;
      let cursor: string | null = null;
      let totalImported = 0;
      const errors: string[] = [];

      while (hasNextPage && (!limit || totalImported < limit)) {
        const query = `
          query($first: Int!, $after: String, $query: String) {
            orders(first: $first, after: $after, query: $query) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  name
                  email
                  phone
                  financialStatus
                  fulfillmentStatus
                  cancelledAt
                  cancelReason
                  currencyCode
                  currentSubtotalPriceSet {
                    shopMoney {
                      amount
                    }
                  }
                  currentTotalPriceSet {
                    shopMoney {
                      amount
                    }
                  }
                  currentTotalTaxSet {
                    shopMoney {
                      amount
                    }
                  }
                  currentTotalDiscountsSet {
                    shopMoney {
                      amount
                    }
                  }
                  totalShippingPriceSet {
                    shopMoney {
                      amount
                    }
                  }
                  createdAt
                  updatedAt
                  processedAt
                  lineItems(first: 100) {
                    edges {
                      node {
                        id
                        title
                        quantity
                        originalUnitPriceSet {
                          shopMoney {
                            amount
                          }
                        }
                        sku
                        vendor
                        product {
                          id
                        }
                        variant {
                          id
                        }
                      }
                    }
                  }
                  shippingAddress {
                    firstName
                    lastName
                    address1
                    address2
                    city
                    province
                    provinceCode
                    country
                    countryCode
                    zip
                    phone
                  }
                  billingAddress {
                    firstName
                    lastName
                    address1
                    address2
                    city
                    province
                    provinceCode
                    country
                    countryCode
                    zip
                    phone
                  }
                  customer {
                    id
                    email
                    firstName
                    lastName
                    phone
                    numberOfOrders
                    amountSpent {
                      amount
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

        // Build query string
        const queryParts: string[] = [];
        if (status) {
          queryParts.push(`financial_status:${status}`);
        }
        if (createdAfter) {
          queryParts.push(`created_at:>='${createdAfter.toISOString()}'`);
        }
        if (queryParts.length > 0) {
          variables.query = queryParts.join(' AND ');
        }

        const result = await this.shopifyClient.graphql(query, variables, { cost: 100 });

        if (!result.data?.orders) {
          break;
        }

        const { edges, pageInfo } = result.data.orders;

        // Process orders
        for (const edge of edges) {
          try {
            await this.saveOrder(edge.node);
            totalImported++;
          } catch (error) {
            errors.push(`Failed to import order ${edge.node.id}: ${error}`);
          }
        }

        hasNextPage = pageInfo.hasNextPage;
        cursor = pageInfo.endCursor;
      }

      return {
        success: true,
        ordersImported: totalImported,
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
   * Get order by Shopify ID
   */
  async getOrder(shopifyId: string): Promise<Order | null> {
    await this.shopifyClient.initialize();

    const query = `
      query($id: ID!) {
        order(id: $id) {
          id
          name
          email
          phone
          financialStatus
          fulfillmentStatus
          cancelledAt
          cancelReason
          currencyCode
          currentSubtotalPriceSet {
            shopMoney {
              amount
            }
          }
          currentTotalPriceSet {
            shopMoney {
              amount
            }
          }
          currentTotalTaxSet {
            shopMoney {
              amount
            }
          }
          currentTotalDiscountsSet {
            shopMoney {
              amount
            }
          }
          totalShippingPriceSet {
            shopMoney {
              amount
            }
          }
          createdAt
          updatedAt
          processedAt
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                  }
                }
                sku
                vendor
                product {
                  id
                }
                variant {
                  id
                }
              }
            }
          }
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            provinceCode
            country
            countryCode
            zip
            phone
          }
          billingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            provinceCode
            country
            countryCode
            zip
            phone
          }
          customer {
            id
            email
            firstName
            lastName
            phone
            numberOfOrders
            amountSpent {
              amount
            }
          }
        }
      }
    `;

    const result = await this.shopifyClient.graphql(query, { id: shopifyId }, { cost: 50 });

    if (!result.data?.order) {
      return null;
    }

    return this.transformShopifyOrder(result.data.order);
  }

  /**
   * Sync order status updates
   */
  async syncOrderStatus(shopifyId: string): Promise<SyncResult> {
    try {
      const order = await this.getOrder(shopifyId);

      if (!order) {
        return {
          success: false,
          errors: [`Order ${shopifyId} not found`],
        };
      }

      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Update order in database
      const { error } = await this.supabase
        .from('shopify_orders')
        .update({
          financial_status: order.financialStatus,
          fulfillment_status: order.fulfillmentStatus,
          cancelled_at: order.cancelledAt,
          cancel_reason: order.cancelReason,
          updated_at: order.updatedAt,
        })
        .eq('shopify_id', shopifyId)
        .eq('workspace_id', this.workspaceId);

      if (error) {
        throw error;
      }

      return {
        success: true,
        ordersUpdated: 1,
      };
    } catch (error) {
      return {
        success: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Get orders by date range
   */
  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.supabase
      .from('shopify_orders')
      .select('*, line_items:shopify_order_line_items(*)')
      .eq('workspace_id', this.workspaceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Save order to database
   */
  private async saveOrder(shopifyOrder: any): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const order = this.transformShopifyOrder(shopifyOrder);

    // Upsert order
    const { error: orderError } = await this.supabase.from('shopify_orders').upsert(
      {
        workspace_id: this.workspaceId,
        shopify_id: order.shopifyId,
        order_number: order.orderNumber,
        email: order.email,
        phone: order.phone,
        financial_status: order.financialStatus,
        fulfillment_status: order.fulfillmentStatus,
        cancelled_at: order.cancelledAt,
        cancel_reason: order.cancelReason,
        currency: order.currency,
        subtotal_price: order.subtotalPrice,
        total_price: order.totalPrice,
        total_tax: order.totalTax,
        total_discounts: order.totalDiscounts,
        total_shipping: order.totalShipping,
        shipping_address: order.shippingAddress,
        billing_address: order.billingAddress,
        customer: order.customer,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        processed_at: order.processedAt,
      },
      { onConflict: 'workspace_id,shopify_id' }
    );

    if (orderError) {
      throw orderError;
    }

    // Get internal order ID
    const { data: savedOrder } = await this.supabase
      .from('shopify_orders')
      .select('id')
      .eq('shopify_id', order.shopifyId)
      .eq('workspace_id', this.workspaceId)
      .single();

    if (!savedOrder) {
      throw new Error('Failed to retrieve saved order');
    }

    // Upsert line items
    for (const lineItem of order.lineItems) {
      await this.supabase.from('shopify_order_line_items').upsert(
        {
          workspace_id: this.workspaceId,
          order_id: savedOrder.id,
          shopify_id: lineItem.shopifyId,
          product_id: lineItem.productId,
          variant_id: lineItem.variantId,
          title: lineItem.title,
          quantity: lineItem.quantity,
          price: lineItem.price,
          sku: lineItem.sku,
          vendor: lineItem.vendor,
          fulfillment_status: lineItem.fulfillmentStatus,
        },
        { onConflict: 'workspace_id,shopify_id' }
      );
    }
  }

  /**
   * Transform Shopify order to internal format
   */
  private transformShopifyOrder(shopifyOrder: any): Order {
    const orderNumber = parseInt(shopifyOrder.name.replace('#', ''), 10);

    return {
      id: shopifyOrder.id,
      shopifyId: shopifyOrder.id,
      orderNumber,
      email: shopifyOrder.email,
      phone: shopifyOrder.phone,
      financialStatus: shopifyOrder.financialStatus?.toLowerCase(),
      fulfillmentStatus: shopifyOrder.fulfillmentStatus?.toLowerCase(),
      cancelledAt: shopifyOrder.cancelledAt,
      cancelReason: shopifyOrder.cancelReason,
      currency: shopifyOrder.currencyCode,
      subtotalPrice: parseFloat(shopifyOrder.currentSubtotalPriceSet?.shopMoney?.amount || '0'),
      totalPrice: parseFloat(shopifyOrder.currentTotalPriceSet?.shopMoney?.amount || '0'),
      totalTax: parseFloat(shopifyOrder.currentTotalTaxSet?.shopMoney?.amount || '0'),
      totalDiscounts: parseFloat(shopifyOrder.currentTotalDiscountsSet?.shopMoney?.amount || '0'),
      totalShipping: parseFloat(shopifyOrder.totalShippingPriceSet?.shopMoney?.amount || '0'),
      createdAt: shopifyOrder.createdAt,
      updatedAt: shopifyOrder.updatedAt,
      processedAt: shopifyOrder.processedAt,
      lineItems: shopifyOrder.lineItems.edges.map((edge: any) => ({
        id: edge.node.id,
        shopifyId: edge.node.id,
        orderId: shopifyOrder.id,
        productId: edge.node.product?.id,
        variantId: edge.node.variant?.id,
        title: edge.node.title,
        quantity: edge.node.quantity,
        price: parseFloat(edge.node.originalUnitPriceSet?.shopMoney?.amount || '0'),
        sku: edge.node.sku,
        vendor: edge.node.vendor,
      })),
      shippingAddress: shopifyOrder.shippingAddress,
      billingAddress: shopifyOrder.billingAddress,
      customer: shopifyOrder.customer
        ? {
            shopifyId: shopifyOrder.customer.id,
            email: shopifyOrder.customer.email,
            firstName: shopifyOrder.customer.firstName,
            lastName: shopifyOrder.customer.lastName,
            phone: shopifyOrder.customer.phone,
            ordersCount: shopifyOrder.customer.numberOfOrders,
            totalSpent: parseFloat(shopifyOrder.customer.amountSpent?.amount || '0'),
          }
        : undefined,
    };
  }
}
