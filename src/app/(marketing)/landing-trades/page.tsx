'use client';

/**
 * Industry-Specific Landing Page: Trade Services
 * Phase 52: Targeted landing for plumbers, electricians, HVAC contractors
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Wrench, Calendar, Star, MessageSquare } from 'lucide-react';
import { trackIndustryVariant, trackCTAClick, setupScrollDepthTracking } from '@/lib/analytics/landingEvents';

export default function LandingTradesPage() {
  useEffect(() => {
    trackIndustryVariant('trades');
    setupScrollDepthTracking();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Unite-Hub
          </div>
          <Badge variant="outline" className="border-orange-500 text-orange-400">
            For Trade Contractors
          </Badge>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="space-y-8 text-center">
          <Badge className="mx-auto bg-orange-600/20 text-orange-300 border-orange-600/30 px-4 py-2">
            Built for Plumbers, Electricians & HVAC
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-white max-w-4xl mx-auto">
            Stop Chasing Leads.{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Start Building Customers
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            AI-powered CRM for trade contractors. Automate quotes, follow-ups, and review requests
            while you focus on the job. Build a real customer base in 90 days.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 gap-2"
              onClick={() => trackCTAClick('hero_trial')}
              asChild
            >
              <a href="/signup?industry=trades">
                Start 14-Day Trial <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => trackCTAClick('hero_demo')}
            >
              See Trades Demo
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex justify-center gap-6 text-sm text-slate-400 flex-wrap">
            <div>No credit card required</div>
            <div>14-day guided trial</div>
            <div>90-day activation program</div>
          </div>
        </div>

        {/* Industry-Specific Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<MessageSquare className="w-6 h-6" />}
            title="Instant Quote Follow-ups"
            description="Automatically follow up on quotes before your competition does."
          />
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Job Scheduling"
            description="Sync your calendar and send automated appointment reminders."
          />
          <FeatureCard
            icon={<Star className="w-6 h-6" />}
            title="Review Automation"
            description="Send review requests at the right time to build your reputation."
          />
          <FeatureCard
            icon={<Wrench className="w-6 h-6" />}
            title="Service History"
            description="Track every job and know when to reach out for maintenance."
          />
        </div>

        {/* What to Expect */}
        <div className="mt-24 bg-slate-800/50 border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Your 90-Day Activation for Trades
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-orange-400 font-bold mb-2">Days 1-14: Setup</div>
              <p className="text-sm text-slate-400">
                Import past customers, connect your calendar, set up service area and specialties.
              </p>
            </div>
            <div className="text-center">
              <div className="text-amber-400 font-bold mb-2">Days 15-45: Automation</div>
              <p className="text-sm text-slate-400">
                Quote follow-up sequences, review requests, seasonal maintenance reminders.
              </p>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold mb-2">Days 46-90: Growth</div>
              <p className="text-sm text-slate-400">
                Referral campaigns, Google Business optimisation, local SEO content.
              </p>
            </div>
          </div>
        </div>

        {/* Honest Expectations */}
        <div className="mt-16 bg-amber-900/20 border border-amber-700/30 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-400 mb-2">Honest Expectations</h3>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Ranking in Google Maps takes consistent effort over 90+ days. We help you build the
            systems for reviews, citations, and content—but overnight results aren't realistic.
            Quality work and follow-through matter more than any marketing tool.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 gap-2"
            onClick={() => trackCTAClick('footer_cta')}
            asChild
          >
            <a href="/signup?industry=trades">
              Start Your Trades Trial <ArrowRight className="w-4 h-4" />
            </a>
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
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="text-orange-400">{icon}</div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
