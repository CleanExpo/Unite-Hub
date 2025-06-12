/**
 * Stripe API Client
 * A wrapper around the unified API client for Stripe-specific operations
 */

// Note: This would normally import from a unified API client
// For now, we'll create a minimal implementation
class ApiClient {
  constructor(private config: any) {}
  
  async post<T>(endpoint: string, data?: any): Promise<T> {
    // Minimal implementation - would normally make HTTP request
    throw new Error('ApiClient not implemented');
  }
  
  async get<T>(endpoint: string, options?: any): Promise<T> {
    // Minimal implementation - would normally make HTTP request
    throw new Error('ApiClient not implemented');
  }
  
  async delete<T>(endpoint: string, options?: any): Promise<T> {
    // Minimal implementation - would normally make HTTP request
    throw new Error('ApiClient not implemented');
  }
}

class ApiKeyAuthStrategy {
  constructor(private apiKey: string, private header: string, private prefix: string) {}
}

class RetryStrategy {
  constructor(private config: any) {}
}
import { z } from 'zod';

// Base Stripe API configuration
interface StripeApiConfig {
  apiKey: string;
  apiVersion?: string;
  maxRetries?: number;
  timeout?: number;
  baseUrl?: string;
}

/**
 * Stripe API Client
 * Provides methods for interacting with the Stripe API
 */
export class StripeApiClient {
  private client: ApiClient;
  private apiVersion: string;
  
  constructor(config: StripeApiConfig) {
    // Set up auth strategy with Stripe API key
    const authStrategy = new ApiKeyAuthStrategy(
      config.apiKey,
      'Authorization',
      'Bearer'
    );
    
    // Store API version
    this.apiVersion = config.apiVersion || '2023-10-16';
    
    // Create retry strategy
    const retryStrategy = new RetryStrategy({
      maxRetries: config.maxRetries || 3,
      initialDelay: 100,
      maxDelay: 5000,
      backoffFactor: 2,
      jitter: true,
      retryableStatuses: [429, 500, 503, 504],
      nonRetryableStatuses: [400, 401, 403, 404],
    });
    
    // Create API client
    this.client = new ApiClient({
      baseUrl: config.baseUrl || 'https://api.stripe.com/v1',
      defaultHeaders: {
        'Stripe-Version': this.apiVersion,
      },
      timeout: config.timeout || 30000,
      authStrategy,
      retryStrategy,
    });
  }
  
  /**
   * Get the API client for direct access if needed
   */
  public getClient(): ApiClient {
    return this.client;
  }
  
  /**
   * Create a payment intent
   */
  public async createPaymentIntent(params: {
    amount: number;
    currency: string;
    description?: string;
    customer?: string;
    paymentMethodTypes?: string[];
    metadata?: Record<string, string>;
    receiptEmail?: string;
    statementDescriptor?: string;
    captureMethod?: 'automatic' | 'manual';
  }) {
    return this.client.post<StripePaymentIntent>('payment_intents', params);
  }
  
  /**
   * Retrieve a payment intent
   */
  public async retrievePaymentIntent(id: string) {
    return this.client.get<StripePaymentIntent>(`payment_intents/${id}`);
  }
  
  /**
   * Confirm a payment intent
   */
  public async confirmPaymentIntent(id: string, params?: {
    paymentMethod?: string;
    returnUrl?: string;
    receiptEmail?: string;
    setupFutureUsage?: 'on_session' | 'off_session';
  }) {
    return this.client.post<StripePaymentIntent>(`payment_intents/${id}/confirm`, params);
  }
  
  /**
   * Create a customer
   */
  public async createCustomer(params: {
    email?: string;
    name?: string;
    phone?: string;
    description?: string;
    metadata?: Record<string, string>;
    address?: StripeAddressParam;
    shipping?: StripeShippingParam;
    paymentMethod?: string;
    invoiceSettings?: StripeCustomerCreateInvoiceSettings;
  }) {
    return this.client.post<StripeCustomer>('customers', params);
  }
  
  /**
   * Retrieve a customer
   */
  public async retrieveCustomer(id: string) {
    return this.client.get<StripeCustomer>(`customers/${id}`);
  }
  
  /**
   * Update a customer
   */
  public async updateCustomer(id: string, params: {
    email?: string;
    name?: string;
    phone?: string;
    description?: string;
    metadata?: Record<string, string>;
    address?: StripeAddressParam;
    shipping?: StripeShippingParam;
    invoiceSettings?: StripeCustomerUpdateInvoiceSettings;
  }) {
    return this.client.post<StripeCustomer>(`customers/${id}`, params);
  }
  
  /**
   * Delete a customer
   */
  public async deleteCustomer(id: string) {
    return this.client.delete<StripeDeletedCustomer>(`customers/${id}`);
  }
  
  /**
   * Create a payment method
   */
  public async createPaymentMethod(params: {
    type: string;
    card?: StripePaymentMethodCreateCard;
    billingDetails?: StripePaymentMethodCreateBillingDetails;
    metadata?: Record<string, string>;
  }) {
    return this.client.post<StripePaymentMethod>('payment_methods', params);
  }
  
  /**
   * Retrieve a payment method
   */
  public async retrievePaymentMethod(id: string) {
    return this.client.get<StripePaymentMethod>(`payment_methods/${id}`);
  }
  
  /**
   * Attach a payment method to a customer
   */
  public async attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string) {
    return this.client.post<StripePaymentMethod>(
      `payment_methods/${paymentMethodId}/attach`,
      { customer: customerId }
    );
  }
  
  /**
   * Detach a payment method from a customer
   */
  public async detachPaymentMethod(paymentMethodId: string) {
    return this.client.post<StripePaymentMethod>(
      `payment_methods/${paymentMethodId}/detach`,
      {}
    );
  }
  
  /**
   * List payment methods for a customer
   */
  public async listPaymentMethods(customerId: string, type?: string, limit?: number) {
    return this.client.get<StripeApiList<StripePaymentMethod>>(
      'payment_methods',
      {
        params: {
          customer: customerId,
          type: type || 'card',
          limit: limit || 10,
        },
      }
    );
  }
  
  /**
   * Create a subscription
   */
  public async createSubscription(params: {
    customer: string;
    items: Array<{ price: string; quantity?: number }>;
    paymentBehavior?: 'default_incomplete' | 'error_if_incomplete' | 'pending_if_incomplete';
    paymentSettings?: StripeSubscriptionCreatePaymentSettings;
    trialPeriodDays?: number;
    trialEnd?: number | 'now';
    metadata?: Record<string, string>;
    cancelAtPeriodEnd?: boolean;
    description?: string;
    defaultPaymentMethod?: string;
  }) {
    return this.client.post<StripeSubscription>('subscriptions', params);
  }
  
  /**
   * Retrieve a subscription
   */
  public async retrieveSubscription(id: string) {
    return this.client.get<StripeSubscription>(`subscriptions/${id}`);
  }
  
  /**
   * Update a subscription
   */
  public async updateSubscription(id: string, params: {
    items?: Array<{ 
      id?: string; 
      price?: string; 
      quantity?: number; 
      deleted?: boolean 
    }>;
    cancelAtPeriodEnd?: boolean;
    defaultPaymentMethod?: string;
    paymentBehavior?: 'default_incomplete' | 'error_if_incomplete' | 'pending_if_incomplete';
    proration_behavior?: 'create_prorations' | 'none';
    metadata?: Record<string, string>;
    description?: string;
  }) {
    return this.client.post<StripeSubscription>(`subscriptions/${id}`, params);
  }
  
  /**
   * Cancel a subscription
   */
  public async cancelSubscription(id: string, atPeriodEnd: boolean = false) {
    return this.client.delete<StripeSubscription>(`subscriptions/${id}`, {
      params: { at_period_end: atPeriodEnd },
    });
  }
  
  /**
   * Create an invoice
   */
  public async createInvoice(params: {
    customer: string;
    description?: string;
    metadata?: Record<string, string>;
    autoAdvance?: boolean;
    collectionMethod?: 'charge_automatically' | 'send_invoice';
    daysUntilDue?: number;
    defaultPaymentMethod?: string;
    footer?: string;
  }) {
    return this.client.post<StripeInvoice>('invoices', params);
  }
  
  /**
   * Retrieve an invoice
   */
  public async retrieveInvoice(id: string) {
    return this.client.get<StripeInvoice>(`invoices/${id}`);
  }
  
  /**
   * Pay an invoice
   */
  public async payInvoice(id: string, params?: {
    paymentMethod?: string;
    paidOutOfBand?: boolean;
  }) {
    return this.client.post<StripeInvoice>(`invoices/${id}/pay`, params);
  }
  
  /**
   * Send an invoice by email
   */
  public async sendInvoice(id: string) {
    return this.client.post<StripeInvoice>(`invoices/${id}/send`, {});
  }
  
  /**
   * Create a product
   */
  public async createProduct(params: {
    name: string;
    description?: string;
    active?: boolean;
    metadata?: Record<string, string>;
    images?: string[];
    statementDescriptor?: string;
    unitLabel?: string;
  }) {
    return this.client.post<StripeProduct>('products', params);
  }
  
  /**
   * Retrieve a product
   */
  public async retrieveProduct(id: string) {
    return this.client.get<StripeProduct>(`products/${id}`);
  }
  
  /**
   * Create a price
   */
  public async createPrice(params: {
    product: string;
    currency: string;
    unitAmount: number;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount?: number;
      usageType?: 'metered' | 'licensed';
    };
    metadata?: Record<string, string>;
    lookupKey?: string;
    nickname?: string;
    taxBehavior?: 'exclusive' | 'inclusive' | 'unspecified';
  }) {
    return this.client.post<StripePrice>('prices', params);
  }
  
  /**
   * Retrieve a price
   */
  public async retrievePrice(id: string) {
    return this.client.get<StripePrice>(`prices/${id}`);
  }
  
  /**
   * Create a coupon
   */
  public async createCoupon(params: {
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration: 'forever' | 'once' | 'repeating';
    durationInMonths?: number;
    maxRedemptions?: number;
    metadata?: Record<string, string>;
    name?: string;
    redeemBy?: number;
  }) {
    return this.client.post<StripeCoupon>('coupons', params);
  }
  
  /**
   * Create a promotion code
   */
  public async createPromotionCode(params: {
    coupon: string;
    code?: string;
    active?: boolean;
    expiresAt?: number;
    maxRedemptions?: number;
    metadata?: Record<string, string>;
    restrictionsFirstTimeTransaction?: boolean;
    restrictionsMinimumAmount?: number;
    restrictionsCurrency?: string;
  }) {
    return this.client.post<StripePromotionCode>('promotion_codes', params);
  }
  
  /**
   * Retrieve a balance transaction
   */
  public async retrieveBalanceTransaction(id: string) {
    return this.client.get<StripeBalanceTransaction>(`balance_transactions/${id}`);
  }
  
  /**
   * List balance transactions
   */
  public async listBalanceTransactions(params?: {
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
    created?: number | { gt?: number; gte?: number; lt?: number; lte?: number };
    type?: string;
    payout?: string;
    source?: string;
  }) {
    // Create a new query params object with only simple types
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    
    // Handle each parameter individually
    if (params) {
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.startingAfter !== undefined) queryParams.startingAfter = params.startingAfter;
      if (params.endingBefore !== undefined) queryParams.endingBefore = params.endingBefore;
      if (params.type !== undefined) queryParams.type = params.type;
      if (params.payout !== undefined) queryParams.payout = params.payout;
      if (params.source !== undefined) queryParams.source = params.source;
      
      // Handle the created parameter which can be complex
      if (params.created !== undefined) {
        if (typeof params.created === 'number') {
          // Simple case: created is a timestamp
          queryParams.created = params.created;
        } else {
          // Complex case: created is a range object
          if (params.created.gt !== undefined) queryParams['created[gt]'] = params.created.gt;
          if (params.created.gte !== undefined) queryParams['created[gte]'] = params.created.gte;
          if (params.created.lt !== undefined) queryParams['created[lt]'] = params.created.lt;
          if (params.created.lte !== undefined) queryParams['created[lte]'] = params.created.lte;
        }
      }
    }
    
    return this.client.get<StripeApiList<StripeBalanceTransaction>>('balance_transactions', {
      params: queryParams,
    });
  }
}

// Minimal Stripe types for TypeScript support
// These are simplified compared to the full Stripe types

export interface StripePaymentIntent {
  id: string;
  object: 'payment_intent';
  amount: number;
  amount_received: number;
  currency: string;
  customer: string | null;
  description: string | null;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  payment_method: string | null;
  created: number;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripeCustomer {
  id: string;
  object: 'customer';
  email: string | null;
  name: string | null;
  phone: string | null;
  description: string | null;
  created: number;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripeDeletedCustomer {
  id: string;
  object: 'customer';
  deleted: boolean;
}

export interface StripePaymentMethod {
  id: string;
  object: 'payment_method';
  type: string;
  created: number;
  customer: string | null;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  customer: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  created: number;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripeInvoice {
  id: string;
  object: 'invoice';
  customer: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  total: number;
  created: number;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripeProduct {
  id: string;
  object: 'product';
  name: string;
  active: boolean;
  created: number;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripePrice {
  id: string;
  object: 'price';
  product: string;
  active: boolean;
  currency: string;
  unit_amount: number;
  created: number;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripeCoupon {
  id: string;
  object: 'coupon';
  duration: 'forever' | 'once' | 'repeating';
  percent_off: number | null;
  amount_off: number | null;
  created: number;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripePromotionCode {
  id: string;
  object: 'promotion_code';
  code: string;
  coupon: StripeCoupon;
  active: boolean;
  created: number;
  metadata: Record<string, string>;
  [key: string]: any;
}

export interface StripeBalanceTransaction {
  id: string;
  object: 'balance_transaction';
  amount: number;
  currency: string;
  description: string | null;
  fee: number;
  net: number;
  status: 'available' | 'pending';
  type: string;
  created: number;
  [key: string]: any;
}

export interface StripeApiList<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  url: string;
  [key: string]: any;
}

export interface StripeAddressParam {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postal_code?: string;
  state?: string;
}

export interface StripeShippingParam {
  address: StripeAddressParam;
  name: string;
  phone?: string;
}

export interface StripeCustomerCreateInvoiceSettings {
  default_payment_method?: string;
  footer?: string;
}

export interface StripeCustomerUpdateInvoiceSettings {
  default_payment_method?: string;
  footer?: string;
}

export interface StripePaymentMethodCreateCard {
  number: string;
  exp_month: number;
  exp_year: number;
  cvc?: string;
}

export interface StripePaymentMethodCreateBillingDetails {
  address?: StripeAddressParam;
  email?: string;
  name?: string;
  phone?: string;
}

export interface StripeSubscriptionCreatePaymentSettings {
  payment_method_types?: string[];
  save_default_payment_method?: 'on_subscription' | 'off';
}

// Export types for backward compatibility
export type PaymentIntent = StripePaymentIntent;
export type Customer = StripeCustomer;
export type DeletedCustomer = StripeDeletedCustomer;
export type PaymentMethod = StripePaymentMethod;
export type Subscription = StripeSubscription;
export type Invoice = StripeInvoice;
export type Product = StripeProduct;
export type Price = StripePrice;
export type Coupon = StripeCoupon;
export type PromotionCode = StripePromotionCode;
export type BalanceTransaction = StripeBalanceTransaction;
export type ApiList<T> = StripeApiList<T>;
export type AddressParam = StripeAddressParam;
export type ShippingParam = StripeShippingParam;
