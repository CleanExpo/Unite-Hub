'use client';

/**
 * Industry-Specific Landing Page: Restoration Services
 * Phase 52: Targeted landing for water/fire damage restoration companies
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Droplets, Flame, Clock, FileText } from 'lucide-react';
import { trackIndustryVariant, trackCTAClick, useScrollDepthTracking } from '@/lib/analytics/landingEvents';

export default function LandingRestorationPage() {
  useEffect(() => {
    trackIndustryVariant('restoration');
    useScrollDepthTracking();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Unite-Hub
          </div>
          <Badge variant="outline" className="border-cyan-500 text-cyan-400">
            For Restoration Services
          </Badge>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="space-y-8 text-center">
          <Badge className="mx-auto bg-blue-600/20 text-blue-300 border-blue-600/30 px-4 py-2">
            Built for Water & Fire Damage Restoration
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-white max-w-4xl mx-auto">
            Turn Emergency Calls Into{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Long-Term Customers
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            AI-powered CRM built for restoration companies. Capture leads from insurance adjusters,
            track job progress, and build relationships that generate referrals—all in 90 days.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 gap-2"
              onClick={() => trackCTAClick('hero_trial')}
              asChild
            >
              <a href="/signup?industry=restoration">
                Start 14-Day Trial <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => trackCTAClick('hero_demo')}
            >
              See Restoration Demo
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
            icon={<Clock className="w-6 h-6" />}
            title="24/7 Lead Capture"
            description="Never miss an emergency call. AI routes leads and sends instant responses."
          />
          <FeatureCard
            icon={<Droplets className="w-6 h-6" />}
            title="Job Status Tracking"
            description="Track mitigation stages from first response to final walkthrough."
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Insurance Documentation"
            description="Auto-generate reports and documentation for adjusters."
          />
          <FeatureCard
            icon={<Flame className="w-6 h-6" />}
            title="Referral Management"
            description="Build adjuster relationships and track referral sources."
          />
        </div>

        {/* What to Expect */}
        <div className="mt-24 bg-slate-800/50 border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Your 90-Day Activation for Restoration
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-blue-400 font-bold mb-2">Days 1-14: Setup</div>
              <p className="text-sm text-slate-400">
                Connect your call system, import contacts, set up job templates for water/fire/mold.
              </p>
            </div>
            <div className="text-center">
              <div className="text-cyan-400 font-bold mb-2">Days 15-45: Systems</div>
              <p className="text-sm text-slate-400">
                Automated follow-ups, adjuster relationship tracking, review request sequences.
              </p>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-bold mb-2">Days 46-90: Growth</div>
              <p className="text-sm text-slate-400">
                Referral programs, insurance partner campaigns, quarterly reporting.
              </p>
            </div>
          </div>
        </div>

        {/* Honest Expectations */}
        <div className="mt-16 bg-amber-900/20 border border-amber-700/30 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-400 mb-2">Honest Expectations</h3>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Building adjuster relationships takes months, not days. Our 90-day program helps you
            establish systems for sustainable growth—not overnight miracles. Real referral networks
            require consistent service and follow-through.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 gap-2"
            onClick={() => trackCTAClick('footer_cta')}
            asChild
          >
            <a href="/signup?industry=restoration">
              Start Your Restoration Trial <ArrowRight className="w-4 h-4" />
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
          <div className="text-cyan-400">{icon}</div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
