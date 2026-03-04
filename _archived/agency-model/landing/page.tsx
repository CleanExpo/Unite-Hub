"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Star, TrendingUp, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Unite-Hub
          </div>
          <div className="space-x-4">
            <Button variant="ghost" className="text-slate-300">
              Features
            </Button>
            <Button variant="ghost" className="text-slate-300">
              Pricing
            </Button>
            <Button variant="ghost" className="text-yellow-400 border-yellow-400/30" asChild>
              <a href="/demo">🧪 Try Demo</a>
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" asChild>
              <a href="/signup">Get Started</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="space-y-8 text-center">
          <Badge className="mx-auto bg-blue-600/20 text-blue-300 border-blue-600/30 px-4 py-2">
            🚀 The AI Marketing CRM for Modern Agencies
          </Badge>

          <h1 className="text-6xl font-bold text-white max-w-4xl mx-auto">
            Get 90 Days of <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Real Marketing Momentum</span> — Not Hype
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Start with a 14-day guided trial. Stay for a 90-day activation program that guarantees real insights, real action, and real measurable progress. AI-powered email processing, content generation, and campaign management for agencies who value honest results.
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2" asChild>
              <a href="/signup">Start 14-Day Guided Trial <ArrowRight className="w-4 h-4" /></a>
            </Button>
            <Button size="lg" variant="outline" className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10" asChild>
              <a href="/demo">🧪 Try Demo</a>
            </Button>
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300">
              Watch Demo
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex justify-center gap-8 text-sm text-slate-400">
            <div>✅ No credit card required</div>
            <div>✅ 14-day guided trial</div>
            <div>✅ 90-day activation program</div>
          </div>

          {/* Expectation Alignment */}
          <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6 max-w-3xl mx-auto text-left">
            <h3 className="text-lg font-semibold text-white mb-3">What to Expect</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-400 font-medium mb-1">Days 1-14: Guided Trial</div>
                <p className="text-slate-400">Platform setup, Gmail connection, first email processing, AI content test</p>
              </div>
              <div>
                <div className="text-cyan-400 font-medium mb-1">Days 15-90: Activation</div>
                <p className="text-slate-400">Real lead scoring, campaign launches, measurable engagement metrics, honest progress reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Email Automation"
            description="Automatically process incoming emails, extract data, and link to contacts with AI"
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="AI Content Generation"
            description="Generate personalized followups, proposals, and case studies in seconds"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Multi-Tenant Enterprise"
            description="Manage unlimited client accounts with complete data isolation"
          />
        </div>

        {/* Pricing Section */}
        <div className="mt-32 space-y-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-400">Scale as you grow. Only pay for what you use.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              name="Starter"
              price="A$495"
              description="Perfect for small teams"
              features={[
                "20,000 AI tokens/month",
                "500 contacts",
                "1 team seat",
                "Email support",
              ]}
            />
            <PricingCard
              name="Pro"
              price="A$895"
              description="Most popular"
              features={[
                "250,000 AI tokens/month",
                "5,000 contacts",
                "3 team seats",
                "Unlimited campaigns",
                "Priority support",
              ]}
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
            />
          </div>
        </div>

        {/* Marketing Honesty Statement */}
        <div className="mt-24 bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Our Marketing Honesty Promise</h3>
          <p className="text-slate-400 mb-6 max-w-3xl mx-auto">
            We don't promise overnight SEO success or viral content. Real marketing results take time—typically 90+ days for meaningful traction.
            Our platform gives you the tools and data to make informed decisions, but your results depend on consistent effort, quality content, and realistic expectations.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <div>📊 Real metrics, not vanity numbers</div>
            <div>🎯 Honest progress tracking</div>
            <div>⏱️ 90-day realistic timelines</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-600/30 rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready for Real Marketing Progress?</h3>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Start your 14-day guided trial, then commit to 90 days of real marketing activation. All prices GST-inclusive.
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2">
            Start 14-Day Guided Trial <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-blue-600/50 transition">
      <CardContent className="pt-8">
        <div className="space-y-4">
          <div className="text-4xl text-blue-400">{icon}</div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-slate-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  popular = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <Card className={`${popular ? "border-blue-600 bg-slate-800 ring-2 ring-blue-600/20" : "bg-slate-800 border-slate-700"} transition hover:border-blue-600/50`}>
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
          className={`w-full ${popular ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 hover:bg-slate-600"}`}
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}
