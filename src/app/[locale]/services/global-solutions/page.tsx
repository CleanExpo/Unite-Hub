import { Metadata } from 'next';
import { Globe, CheckCircle2, ArrowRight, Languages, DollarSign, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Global Solutions | Unite Group',
  description: 'Multi-language and multi-region capabilities for worldwide deployment. Internationalization, localization, and global CDN deployment.',
  keywords: ['Global Solutions', 'Internationalization', 'i18n', 'Localization', 'Multi-language', 'Multi-region', 'Global CDN', 'Multi-currency'],
};

const features = [
  {
    title: 'Multi-Language Support',
    description: 'Complete internationalization with support for 50+ languages',
    icon: Languages,
  },
  {
    title: 'Multi-Currency',
    description: 'Support for 100+ currencies with real-time exchange rates',
    icon: DollarSign,
  },
  {
    title: 'Global Infrastructure',
    description: 'Deploy to 200+ edge locations worldwide for optimal performance',
    icon: MapPin,
  },
  {
    title: 'Cultural Adaptation',
    description: 'Localized content and UX tailored to regional preferences',
    icon: Users,
  },
];

const globalCapabilities = [
  {
    region: 'Americas',
    countries: ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina'],
    features: ['Local payment methods', 'Regional compliance', 'CDN presence'],
  },
  {
    region: 'Europe',
    countries: ['United Kingdom', 'Germany', 'France', 'Spain', 'Italy'],
    features: ['GDPR compliance', 'VAT handling', 'Multi-language support'],
  },
  {
    region: 'Asia-Pacific',
    countries: ['Japan', 'China', 'India', 'Australia', 'Singapore'],
    features: ['Local hosting options', 'Regional APIs', 'Cultural customization'],
  },
];

export default function GlobalSolutionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white mb-8">
            <Globe className="w-12 h-12" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Global Solutions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Expand your business worldwide with our comprehensive global deployment solutions. 
            From localization to multi-region infrastructure, we help you reach every market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Go Global Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/contact">
                Discuss Your Market
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Global Deployment Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Global Reach */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Global Reach & Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {globalCapabilities.map((region, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-2xl">{region.region}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Key Markets</h4>
                    <div className="flex flex-wrap gap-2">
                      {region.countries.map((country) => (
                        <Badge key={country} variant="secondary">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Regional Features</h4>
                    <ul className="space-y-2">
                      {region.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Localization Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Comprehensive Localization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-6">Language & Content</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>50+ language translations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>RTL language support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Cultural content adaptation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Regional SEO optimization</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6">Technical Infrastructure</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Global CDN deployment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Multi-region databases</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Compliance management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <span>Local payment gateways</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Benefits of Going Global with Unite Group
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Global market reach',
              'Localized experiences',
              'Multi-currency support',
              'Cultural adaptation',
              'Regional compliance',
              'Local performance',
              'International SEO',
              'Cross-border payments',
            ].map((benefit, index) => (
              <div key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Expand Globally?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Let&apos;s build your global presence with enterprise-grade infrastructure and localization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Start Global Expansion
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/pricing">
                View Global Packages
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
