/**
 * Stripe.js type definitions
 */

interface Window {
  Stripe?: (apiKey: string, options?: any) => any;
}

declare namespace Stripe {
  interface StripeInstance {
    elements: (options?: StripeElementsOptions) => StripeElements;
    confirmCardPayment: (
      clientSecret: string,
      data?: any,
      options?: any
    ) => Promise<{ paymentIntent?: any; error?: any }>;
  }
  
  interface StripeElements {
    create: (type: string, options?: any) => StripeElement;
    getElement: (type: string) => StripeElement | null;
    update: (options: any) => void;
  }
  
  interface StripeElement {
    mount: (domElement: string | HTMLElement) => void;
    unmount: () => void;
    on: (event: string, handler: (event: any) => void) => void;
    update: (options: any) => void;
  }
  
  interface StripeElementsOptions {
    appearance?: any;
    clientSecret?: string;
    fonts?: any[];
    locale?: string;
  }
  
  interface StripeError {
    type: string;
    charge: string;
    message: string;
    code?: string;
    decline_code?: string;
    param?: string;
  }
  
  interface PaymentIntent {
    id: string;
    object: 'payment_intent';
    amount: number;
    canceled_at: number | null;
    cancellation_reason: string | null;
    capture_method: 'automatic' | 'manual';
    client_secret: string;
    confirmation_method: 'automatic' | 'manual';
    created: number;
    currency: string;
    description: string | null;
    last_payment_error: StripeError | null;
    livemode: boolean;
    next_action: any;
    payment_method: string | null;
    payment_method_types: string[];
    receipt_email: string | null;
    setup_future_usage: 'on_session' | 'off_session' | null;
    shipping: any;
    source: string;
    status: 
      | 'requires_payment_method'
      | 'requires_confirmation'
      | 'requires_action'
      | 'processing'
      | 'requires_capture'
      | 'canceled'
      | 'succeeded';
  }
}
