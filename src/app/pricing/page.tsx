"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Sparkles, Zap, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@supabase/supabase-js";

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const { currentOrganization } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleCheckout = async (plan: string) => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    if (!currentOrganization) {
      alert("No organization selected. Please complete setup first.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email: user.email,
          name: user.user_metadata?.name || user.email,
          orgId: currentOrganization.org_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Checkout error:", data);
        alert(`Error: ${data.error || "Failed to create checkout session"}`);
        setIsLoading(false);
        return;
      }

      const { sessionId } = data;

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
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
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
            icon={Sparkles}
            gradient="from-blue-500 to-cyan-500"
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
            icon={Zap}
            gradient="from-purple-500 to-pink-500"
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
            icon={Building2}
            gradient="from-orange-500 to-red-500"
          />
        </div>

        {/* FAQ */}
        <div className="space-y-8 py-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent text-center">
            Frequently Asked Questions
          </h2>
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
  icon: Icon,
  gradient,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  onSelect: () => void;
  isLoading: boolean;
  popular?: boolean;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <Card
      className={`${
        popular
          ? "border-blue-500/50 bg-slate-800/50 backdrop-blur-sm ring-2 ring-blue-500/20 transform scale-105 shadow-xl shadow-blue-500/20"
          : "bg-slate-800/50 backdrop-blur-sm border-slate-700/50"
      } transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 group`}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          {popular && (
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg shadow-blue-500/50">
              Most Popular
            </Badge>
          )}
        </div>
        <CardTitle className="text-white text-2xl font-bold">{name}</CardTitle>
        <CardDescription className="text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <span className={`text-5xl font-bold ${price !== "Custom" ? "bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent" : "text-white"}`}>
            {price}
          </span>
          {price !== "Custom" && <span className="text-slate-400 text-lg">/month</span>}
        </div>

        <div className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">{feature}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onSelect}
          disabled={isLoading}
          className={`w-full ${
            popular
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50"
              : "bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/50"
          } transition-all`}
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
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all group">
      <p className="font-semibold text-white mb-2 text-lg">{q}</p>
      <p className="text-slate-400 leading-relaxed">{a}</p>
    </div>
  );
}
