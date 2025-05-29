"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard, Check, AlertCircle } from "lucide-react";
import { StripeApiClient } from '@/lib/api/stripe/client';

// Stripe Elements types
interface StripeElements {
  getElement: (type: string) => any;
  update: (options: any) => void;
  create: (type: string, options: any) => any;
}

interface StripeElementsOptions {
  appearance?: any;
  clientSecret?: string;
  fonts?: any[];
  locale?: string;
}

interface StripeElementsHookResult {
  elements: StripeElements | null;
  error: Error | null;
}

// Props interface
interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  onPaymentSuccess?: (paymentIntent: any) => void;
  onPaymentError?: (error: any) => void;
  description?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  buttonText?: string;
  receiptEmail?: string;
}

/**
 * Stripe Payment Form Component
 * 
 * This component renders a complete Stripe payment form with card element
 * and handles the entire payment flow including creating and confirming payment intents.
 */
export default function StripePaymentForm({
  amount,
  currency = 'aud',
  onPaymentSuccess,
  onPaymentError,
  description = 'Payment for services',
  customerId,
  metadata = {},
  buttonText = 'Pay Now',
  receiptEmail
}: StripePaymentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripe, setStripe] = useState<any | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  
  // Set up Stripe when component mounts
  useEffect(() => {
    // Load Stripe.js asynchronously
    const loadStripe = async () => {
      if (!window.Stripe) {
        // Load Stripe.js script
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = () => {
          const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
          setStripe(stripe);
        };
        document.body.appendChild(script);
      } else {
        // Stripe.js already loaded
        const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        setStripe(stripe);
      }
    };
    
    loadStripe();
  }, []);
  
  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!stripe) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Create a payment intent using our API
        const response = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency,
            description,
            customer_id: customerId,
            metadata,
            receipt_email: receiptEmail,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        // Initialize Elements once client secret is available
        const elementsOptions: StripeElementsOptions = {
          clientSecret: data.clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0f172a',
              colorBackground: '#ffffff',
              colorText: '#1e293b',
              colorDanger: '#ef4444',
              fontFamily: 'Inter, system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '8px',
            },
          },
        };
        
        const elements = stripe.elements(elementsOptions);
        setElements(elements);
        
        // Create and mount the card element
        const cardElement = elements.create('card', {
          style: {
            base: {
              iconColor: '#0f172a',
              color: '#1e293b',
              fontWeight: '500',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '16px',
              fontSmoothing: 'antialiased',
              '::placeholder': {
                color: '#94a3b8',
              },
            },
            invalid: {
              iconColor: '#ef4444',
              color: '#ef4444',
            },
          },
        });
        
        cardElement.mount('#card-element');
        
        // Listen for card input changes
        cardElement.on('change', (event: any) => {
          setCardComplete(event.complete);
          if (event.error) {
            setError(event.error.message);
          } else {
            setError(null);
          }
        });
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to set up payment. Please try again.');
        if (onPaymentError) {
          onPaymentError(err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (stripe && amount > 0) {
      createPaymentIntent();
    }
  }, [stripe, amount, currency, description, customerId, metadata, receiptEmail]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const cardElement = elements.getElement('card');
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: receiptEmail,
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (paymentIntent.status === 'succeeded') {
        setIsSuccess(true);
        
        // Show success toast
        toast({
          title: "Payment successful",
          description: "Your payment has been processed successfully.",
          variant: "default",
        });
        
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentIntent);
        }
      }
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
      
      // Show error toast
      toast({
        title: "Payment failed",
        description: err.message || "Your payment couldn't be processed. Please try again.",
        variant: "destructive",
      });
      
      if (onPaymentError) {
        onPaymentError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format amount for display
  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    
    return formatter.format(amount / 100);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Payment Details</CardTitle>
        <CardDescription>
          {isSuccess 
            ? "Your payment has been processed successfully." 
            : `Complete your payment of ${formatAmount(amount, currency)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-center text-slate-700">
              Thank you for your payment. A receipt has been sent to your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Card Element */}
              <div className="space-y-2">
                <Label htmlFor="card-element">Card Details</Label>
                <div 
                  id="card-element" 
                  className="w-full p-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all min-h-[40px]"
                ></div>
                {error && (
                  <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              
              {/* Amount Display */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">Total</span>
                  <span className="text-lg font-semibold">{formatAmount(amount, currency)}</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter>
        {!isSuccess && (
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !cardComplete || !stripe || !elements}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {buttonText}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
