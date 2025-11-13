"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async (plan: string) => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email: session.user?.email,
        }),
      });

      const { sessionId } = await res.json();

      // Redirect to Stripe Checkout
      const stripe = (window as any).Stripe?.(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );

      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) console.error(error);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Unite-Hub
          </div>
        </div>
      </div>

      {/* Pricing Content */}
      <div className="max-w-7xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-white">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-400">Scale as you grow. Only pay for what you use.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard
            name="Unite-Hub Starter"
            price="$249"
            description="Perfect for small agencies"
            features={[
              "1 Client Account",
              "Up to 5,000 contacts",
              "Email processing",
              "Basic reporting",
            ]}
            onSelect={() => handleCheckout("starter")}
            isLoading={isLoading}
          />
          <PricingCard
            name="Unite-Hub Professional"
            price="$549"
            description="Most popular"
            features={[
              "5 Client Accounts",
              "Up to 50,000 contacts",
              "Email + content generation",
              "Advanced analytics",
              "Priority support",
            ]}
            onSelect={() => handleCheckout("professional")}
            isLoading={isLoading}
            popular={true}
          />
          <PricingCard
            name="Enterprise"
            price="Custom"
            description="For agencies doing 7+ brands"
            features={[
              "Unlimited accounts",
              "Unlimited contacts",
              "All features included",
              "Dedicated manager",
              "Custom integrations",
            ]}
            onSelect={() => {
              window.location.href = "mailto:sales@unite-hub.io";
            }}
            isLoading={isLoading}
          />
        </div>

        {/* FAQ */}
        <div className="space-y-8 py-12">
          <h2 className="text-3xl font-bold text-white text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FAQItem
              q="Can I change my plan?"
              a="Yes! Upgrade or downgrade anytime. Changes take effect immediately."
            />
            <FAQItem
              q="Do you offer annual billing?"
              a="Yes! Get 15% off with annual billing. Contact sales for details."
            />
            <FAQItem
              q="What payment methods do you accept?"
              a="We accept all major credit cards and PayPal through Stripe."
            />
            <FAQItem
              q="Is there a trial period?"
              a="Yes! Get 14 days free. No credit card required to start."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  onSelect,
  isLoading,
  popular = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  onSelect: () => void;
  isLoading: boolean;
  popular?: boolean;
}) {
  return (
    <Card
      className={`${
        popular
          ? "border-blue-600 bg-slate-800 ring-2 ring-blue-600/20 transform scale-105"
          : "bg-slate-800 border-slate-700"
      } transition hover:border-blue-600/50`}
    >
      <CardHeader>
        {popular && <Badge className="w-fit mb-2 bg-blue-600">Most Popular</Badge>}
        <CardTitle className="text-white">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <span className="text-4xl font-bold text-white">{price}</span>
          {price !== "Custom" && <span className="text-slate-400">/month</span>}
        </div>

        <div className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-slate-300">{feature}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onSelect}
          disabled={isLoading}
          className={`w-full ${
            popular ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 hover:bg-slate-600"
          }`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded p-4">
      <p className="font-semibold text-white mb-2">{q}</p>
      <p className="text-slate-400">{a}</p>
    </div>
  );
}
