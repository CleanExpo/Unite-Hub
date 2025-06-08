import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, ArrowRight, CheckCircle, Sparkles, Trophy, 
  Users, Zap, DollarSign, Calendar, Target, Award,
  BookOpen, Code, TrendingUp, Shield
} from 'lucide-react';
import { BUNDLE_OFFERINGS } from '@/lib/types/crm-integration';
import { CARSIPartnershipBadge } from '@/components/services/CARSIPartnership';

export const metadata: Metadata = {
  title: 'Bundle Packages | Unite Group + CARSI',
  description: 'Discover our exclusive bundle packages combining Unite Group consulting services with CARSI education programs. Save money while transforming your business.',
  keywords: ['bundle packages', 'Unite Group CARSI', 'consulting training packages', 'business transformation bundles'],
};

export default function BundlesPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getBundleIcon = (bundleId: string) => {
    switch (bundleId) {
      case 'digital-transformation':
        return <Code className="h-8 w-8" />;
      case 'seo-mastery':
        return <TrendingUp className="h-8 w-8" />;
      case 'business-growth':
        return <Target className="h-8 w-8" />;
      default:
        return <Package className="h-8 w-8" />;
    }
  };

  const totalSavings = BUNDLE_OFFERINGS.reduce((sum, bundle) => sum + bundle.savings, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-cyan-600/10" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-teal-600 text-white">Unite Group × CARSI</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Exclusive Bundle Packages
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Combine the power of Unite Group&apos;s consulting expertise with CARSI&apos;s 
              industry-leading education programs. Transform your business while saving 
              up to {formatCurrency(Math.max(...BUNDLE_OFFERINGS.map(b => b.savings)))}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="#bundles">
                <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                  Explore Bundles
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Custom Bundle Request
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Bundles?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get more value by combining services and education in one comprehensive package
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Save Up To
              </h3>
              <div className="text-3xl font-bold text-teal-600">
                {formatCurrency(Math.max(...BUNDLE_OFFERINGS.map(b => b.savings)))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Combined package savings
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Unified Support
              </h3>
              <div className="text-3xl font-bold text-teal-600">24/7</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Single point of contact
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Faster Results
              </h3>
              <div className="text-3xl font-bold text-teal-600">2x</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Accelerated transformation
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Success Rate
              </h3>
              <div className="text-3xl font-bold text-teal-600">95%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Client satisfaction
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Packages */}
      <section id="bundles" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Bundle Packages
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Each bundle is carefully designed to address specific business needs and goals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {BUNDLE_OFFERINGS.map((bundle, index) => (
              <div key={bundle.id} className="relative">
                {index === 1 && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full ${index === 1 ? 'border-2 border-teal-600 shadow-xl' : ''} hover:shadow-xl transition-shadow`}>
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center text-white mb-4">
                      {getBundleIcon(bundle.id)}
                    </div>
                    <CardTitle className="text-2xl">{bundle.name}</CardTitle>
                    <CardDescription className="text-base">
                      {bundle.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pricing */}
                    <div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(bundle.totalPrice)}
                        </span>
                        {bundle.duration && (
                          <span className="text-gray-600 dark:text-gray-400">
                            / {bundle.duration}
                          </span>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40">
                        Save {formatCurrency(bundle.savings)}
                      </Badge>
                    </div>

                    {/* Services Included */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          Unite Group Services
                        </h4>
                        <ul className="space-y-2">
                          {bundle.uniteServices.map((service) => (
                            <li key={service} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 dark:text-gray-300">{service}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-teal-600" />
                          CARSI Training
                        </h4>
                        <ul className="space-y-2">
                          {bundle.carsiCourses.map((course) => (
                            <li key={course} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 dark:text-gray-300">{course}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <strong>Ideal for:</strong> {bundle.targetAudience.join(', ')} businesses
                      </p>
                      <Button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How Bundle Packages Work
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Simple process from selection to transformation
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Choose Your Bundle
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select the bundle that best matches your business size and goals. 
                    Each package is designed for specific outcomes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Unified Onboarding
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    One simple onboarding process covers both Unite Group services and 
                    CARSI education programs. Single point of contact for everything.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Coordinated Delivery
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Services and training are delivered in perfect sync. Learn new skills 
                    as we implement solutions, ensuring immediate application.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Measure Success
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track progress through unified dashboards. See how consulting outcomes 
                    and skill development work together to transform your business.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARSI Partnership Badge */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <CARSIPartnershipBadge />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex p-4 bg-white/10 rounded-full mb-6">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-teal-100 mb-8">
              Join hundreds of businesses that have accelerated their growth through 
              our integrated consulting and education bundles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
                  Get Your Custom Bundle
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/download-bundle-guide">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
                  Download Bundle Guide
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm text-teal-100">
              🎯 Tailored Solutions • 📚 Expert Training • 💰 Significant Savings
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
