'use client';

/**
 * Industry-Specific Landing Page: Local Services
 * Phase 52: Targeted landing for general local service businesses
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MapPin, Users, TrendingUp, Phone } from 'lucide-react';
import { trackIndustryVariant, trackCTAClick, useScrollDepthTracking } from '@/lib/analytics/landingEvents';

export default function LandingLocalServicesPage() {
  useEffect(() => {
    trackIndustryVariant('local_services');
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
          <Badge variant="outline" className="border-green-500 text-green-400">
            For Local Services
          </Badge>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="space-y-8 text-center">
          <Badge className="mx-auto bg-green-600/20 text-green-300 border-green-600/30 px-4 py-2">
            Built for Local Service Businesses
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-white max-w-4xl mx-auto">
            Dominate Your{' '}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Local Market
            </span>{' '}
            in 90 Days
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            AI-powered CRM for local service businesses. Manage customers, automate marketing,
            and grow your reputation in your service area. Real results in a realistic timeframe.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 gap-2"
              onClick={() => trackCTAClick('hero_trial')}
              asChild
            >
              <a href="/signup?industry=local_services">
                Start 14-Day Trial <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => trackCTAClick('hero_demo')}
            >
              See Local Services Demo
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
            icon={<MapPin className="w-6 h-6" />}
            title="Local SEO Tools"
            description="Optimize your Google Business Profile and local citations."
          />
          <FeatureCard
            icon={<Phone className="w-6 h-6" />}
            title="Lead Response"
            description="Instant follow-ups ensure you respond before competitors."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Customer Database"
            description="Track service history and know when to reach out."
          />
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Reputation Builder"
            description="Systematic review requests to build your online presence."
          />
        </div>

        {/* What to Expect */}
        <div className="mt-24 bg-slate-800/50 border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Your 90-Day Local Growth Program
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-green-400 font-bold mb-2">Days 1-14: Foundation</div>
              <p className="text-sm text-slate-400">
                Import customers, claim/optimize Google Business, set up service areas.
              </p>
            </div>
            <div className="text-center">
              <div className="text-emerald-400 font-bold mb-2">Days 15-45: Systems</div>
              <p className="text-sm text-slate-400">
                Automated follow-ups, review sequences, local content calendar.
              </p>
            </div>
            <div className="text-center">
              <div className="text-teal-400 font-bold mb-2">Days 46-90: Expansion</div>
              <p className="text-sm text-slate-400">
                Neighbourhood targeting, referral programs, quarterly reporting.
              </p>
            </div>
          </div>
        </div>

        {/* Honest Expectations */}
        <div className="mt-16 bg-amber-900/20 border border-amber-700/30 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-amber-400 mb-2">Honest Expectations</h3>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Local SEO visibility takes 90+ days of consistent effort. We provide the tools and
            guidance, but your results depend on service quality, review consistency, and following
            through on the program. There are no shortcuts to local market dominance.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 gap-2"
            onClick={() => trackCTAClick('footer_cta')}
            asChild
          >
            <a href="/signup?industry=local_services">
              Start Your Local Services Trial <ArrowRight className="w-4 h-4" />
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
          <div className="text-green-400">{icon}</div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
