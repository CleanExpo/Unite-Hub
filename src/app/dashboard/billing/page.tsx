"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export default function BillingPage() {
  const { user } = useAuth();
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceLoading) return;
    if (workspaceId) {
      fetchSubscription();
    }
  }, [workspaceId, workspaceLoading]);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabaseBrowser
        .from("subscriptions")
        .select("*")
        .eq("workspace_id", workspaceId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" - not an error
        console.error("Error fetching subscription:", error);
        throw new Error("Failed to fetch subscription details");
      }

      setSubscription(data || null);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err instanceof Error ? err.message : "Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    setChangingPlan(true);
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setChangingPlan(false);
        return;
      }

      // Call Stripe checkout API
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          planName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setChangingPlan(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        return;
      }

      // Call Stripe customer portal API
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();

      // Redirect to Stripe customer portal
      window.location.href = url;
    } catch (error) {
      console.error("Error creating portal session:", error);
      alert("Failed to open billing portal. Please try again.");
    }
  };

  const plans = [
    {
      name: "Starter",
      price: "A$495",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER,
      description: "Perfect for small teams getting started",
      features: [
        "20,000 AI tokens/month",
        "500 contacts",
        "1 team seat",
        "5 email campaigns",
        "Email support",
      ],
      gradient: "from-blue-500 to-cyan-500",
      popular: false,
    },
    {
      name: "Pro",
      price: "A$895",
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL,
      description: "For growing teams that need more power",
      features: [
        "250,000 AI tokens/month",
        "5,000 contacts",
        "3 team seats",
        "Unlimited campaigns",
        "Priority support",
        "API access",
      ],
      gradient: "from-purple-500 to-pink-500",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      priceId: null,
      description: "For large organizations with specific needs",
      features: [
        "Unlimited contacts",
        "Unlimited campaigns",
        "Enterprise AI features",
        "24/7 phone support",
        "Unlimited workspaces",
        "Custom workflows",
        "Dedicated account manager",
        "SLA guarantee",
      ],
      gradient: "from-orange-500 to-red-500",
      popular: false,
    },
  ];

  const currentPlan = subscription?.plan_name || "Free";

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Billing & Subscription" }]} />
        <ErrorState
          title="Failed to Load Billing Information"
          message={error}
          onRetry={fetchSubscription}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Billing & Subscription" }]} />

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Billing & Subscription" }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Billing & Subscription
          </h1>
          <p className="text-slate-400">Manage your subscription and billing details</p>
        </div>
        {subscription && (
          <Button
            onClick={handleManageSubscription}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Manage Billing
          </Button>
        )}
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Current Subscription</CardTitle>
                <CardDescription className="text-slate-400">
                  Your active plan and billing information
                </CardDescription>
              </div>
              <Badge
                className={
                  subscription.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                }
              >
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Plan
                </div>
                <div className="text-white font-bold text-xl">{subscription.plan_name}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  Billing Period
                </div>
                <div className="text-white text-sm">
                  {new Date(subscription.current_period_start).toLocaleDateString()} -{" "}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Renewal
                </div>
                <div className="text-white text-sm">
                  {subscription.cancel_at_period_end
                    ? "Cancels at period end"
                    : "Auto-renews"}
                </div>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-semibold">
                    Subscription Canceling
                  </p>
                  <p className="text-yellow-400/80 text-sm mt-1">
                    Your subscription will end on{" "}
                    {new Date(subscription.current_period_end).toLocaleDateString()}.
                    You can reactivate anytime before then.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all ${
                plan.popular ? "ring-2 ring-purple-500/50" : ""
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold rounded-t-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <div
                    className={`h-10 w-10 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}
                  >
                    {plan.name === "Starter" ? (
                      <Zap className="w-5 h-5 text-white" />
                    ) : plan.name === "Professional" ? (
                      <Sparkles className="w-5 h-5 text-white" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-white" />
                    )}
                  </div>
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className={`text-4xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-slate-400 text-sm"> AUD/month</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() =>
                    plan.name === "Enterprise"
                      ? (window.location.href = "mailto:contact@unite-group.in?subject=Enterprise Plan Inquiry")
                      : handleUpgrade(plan.name)
                  }
                  disabled={
                    changingPlan ||
                    (currentPlan === plan.name && subscription?.status === "active")
                  }
                  className={`w-full ${
                    currentPlan === plan.name && subscription?.status === "active"
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : `bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white font-semibold shadow-lg`
                  }`}
                >
                  {changingPlan
                    ? "Processing..."
                    : currentPlan === plan.name && subscription?.status === "active"
                    ? "Current Plan"
                    : plan.name === "Enterprise"
                    ? "Contact Sales"
                    : "Upgrade Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
