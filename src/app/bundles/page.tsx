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
              Combine the power of Unite Group's consulting expertise with CARSI's 
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
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose Bundle Packages?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Get more value by combining our services with strategic partnerships
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>Significant Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Save up to {formatCurrency(totalSavings)} compared to purchasing services separately
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>Integrated Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Seamlessly combine consulting services with education programs for maximum impact
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full w-fit">
                    <Trophy className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle>Proven Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Benefit from our track record of successful business transformations
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Packages */}
      <section id="bundles" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Your Bundle Package
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Tailored combinations designed for different business needs and growth stages
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {BUNDLE_OFFERINGS.map((bundle, index) => (
                <Card key={bundle.id} className={`relative ${index === 1 ? 'ring-2 ring-teal-500 scale-105' : ''}`}>
                  {index === 1 && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-teal-600 text-white px-4 py-1">
                        <Sparkles className="h-4 w-4 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-full w-fit">
                      {getBundleIcon(bundle.id)}
                    </div>
                    <CardTitle className="text-2xl">{bundle.name}</CardTitle>
                    <CardDescription className="text-base">
                      {bundle.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(bundle.price)}
                        </span>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <div className="line-through">
                            {formatCurrency(bundle.originalPrice)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Save {formatCurrency(bundle.savings)}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Includes:</h4>
                      <ul className="space-y-2">
                        {bundle.services.map((service, serviceIndex) => (
                          <li key={serviceIndex} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {service}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Key Benefits:</h4>
                      <ul className="space-y-2">
                        {bundle.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex} className="flex items-start gap-2">
                            <Award className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4">
                      <Link href={`/contact?bundle=${bundle.id}`}>
                        <Button 
                          className={`w-full ${
                            index === 1 
                              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700' 
                              : ''
                          }`}
                          variant={index === 1 ? 'default' : 'outline'}
                        >
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="py-16 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <CARSIPartnershipBadge />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-8">
              Powered by Strategic Partnership
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Our exclusive partnership with CARSI enables us to offer comprehensive solutions 
              that combine world-class consulting with industry-leading education programs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-teal-600" />
                    Unite Group Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Strategic Business Consulting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Digital Transformation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Process Optimization</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-cyan-600" />
                    CARSI Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Industry-Leading Courses</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Certification Programs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Ongoing Support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Don't miss out on these exclusive bundle packages. Limited time offers available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="bg-white text-teal-600 hover:bg-gray-100">
                  Schedule Consultation
                  <Calendar className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/about-us">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More About Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
