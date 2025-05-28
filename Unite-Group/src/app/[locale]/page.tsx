import { HeroSection } from '@/components/landing/HeroSection';
import { InteractiveSolutions } from '@/components/landing/InteractiveSolutions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import '../../styles/animations.css';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Enhanced Hero Section */}
      <HeroSection />

      {/* Key Benefits */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in-up">Why Choose Unite Group?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500 hover-lift animate-slide-in-left">
            <CardHeader>
              <CardTitle className="text-green-600">99.9% Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enterprise-grade reliability with automatic failover and advanced monitoring systems.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 hover-lift animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-blue-600">AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced AI gateway supporting OpenAI, Claude, Google AI, and Azure with intelligent routing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover-lift animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-purple-600">Global Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Multi-language support, CDN optimization, and worldwide deployment capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover-lift animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-orange-600">Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SOC2 compliance, GDPR ready, MFA authentication, and advanced security monitoring.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="container mx-auto" />

      {/* Interactive Solutions Section */}
      <InteractiveSolutions />

      <Separator className="container mx-auto" />

      {/* Technology Stack */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in-up">Our Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
          <div className="p-4 hover-scale">
            <div className="text-4xl mb-2">⚛️</div>
            <h3 className="font-semibold">React/Next.js</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Frontend Framework</p>
          </div>
          <div className="p-4 hover-scale">
            <div className="text-4xl mb-2">🟦</div>
            <h3 className="font-semibold">TypeScript</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Type Safety</p>
          </div>
          <div className="p-4 hover-scale">
            <div className="text-4xl mb-2">🐘</div>
            <h3 className="font-semibold">Supabase</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Database & Auth</p>
          </div>
          <div className="p-4 hover-scale">
            <div className="text-4xl mb-2">🤖</div>
            <h3 className="font-semibold">AI Gateway</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Multi-Provider AI</p>
          </div>
          <div className="p-4 hover-scale">
            <div className="text-4xl mb-2">☁️</div>
            <h3 className="font-semibold">Vercel</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cloud Platform</p>
          </div>
          <div className="p-4 hover-scale">
            <div className="text-4xl mb-2">🎨</div>
            <h3 className="font-semibold">Tailwind CSS</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">UI Framework</p>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in-up">Proven Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="animate-scale-in">
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-lg font-semibold mb-1">Uptime Guarantee</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Enterprise reliability with AI failover</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-bold text-green-600 mb-2">&lt;1s</div>
              <div className="text-lg font-semibold mb-1">Response Time</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lightning-fast performance globally</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-lg font-semibold mb-1">Features Built</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Comprehensive enterprise platform</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-lg font-semibold mb-1">Monitoring</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Advanced analytics and alerting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto animate-fade-in-up">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Let&apos;s discuss how our enterprise-grade AI solutions and comprehensive SaaS platform 
            can accelerate your digital transformation and drive business growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/book-consultation">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover-lift">
                Schedule Free Consultation
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="hover-lift">
                Contact Our Team
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>🔒 SOC2 Compliant • 🌍 Global Infrastructure • 🤖 AI-Powered • ⚡ Enterprise Performance</p>
          </div>
        </div>
      </section>
    </div>
  );
}
