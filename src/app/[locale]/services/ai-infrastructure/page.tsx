import { Metadata } from 'next';
import { Bot, CheckCircle2, ArrowRight, Zap, Shield, BarChart3, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Infrastructure Services | Unite Group',
  description: 'Production-ready AI gateway with multi-provider support and intelligent routing. 99.9% uptime guarantee, 503 error resolution, and 40% cost reduction.',
  keywords: ['AI Infrastructure', 'OpenAI', 'Claude', 'Google AI', 'Azure AI', 'AI Gateway', 'Multi-Provider AI', 'AI Cost Optimization'],
};

const features = [
  {
    title: 'Multi-Provider Integration',
    description: 'Seamless integration with OpenAI, Claude, Google AI, and Azure for maximum flexibility',
    icon: Globe,
  },
  {
    title: 'Intelligent Routing',
    description: 'Automatic failover and load balancing ensures your AI services never go down',
    icon: Zap,
  },
  {
    title: 'Cost Optimization',
    description: 'Advanced caching and rate limiting reduces costs by up to 40%',
    icon: BarChart3,
  },
  {
    title: 'Enterprise Security',
    description: 'SOC2 compliant infrastructure with advanced security monitoring',
    icon: Shield,
  },
];

const benefits = [
  '99.9% API uptime guarantee',
  '503 error resolution',
  '40% cost reduction',
  'Real-time failover',
  'Intelligent caching',
  'Usage analytics',
  'Rate limiting',
  'Multi-provider support',
];

export default function AIInfrastructurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white mb-8">
            <Bot className="w-12 h-12" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            AI Infrastructure
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Production-ready AI gateway with multi-provider support and intelligent routing. 
            Ensure your AI services never fail with our enterprise-grade infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/contact">
                Book Consultation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Enterprise AI Infrastructure Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
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

      {/* Technical Details */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Technical Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Supported Providers</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>OpenAI (GPT-4, GPT-3.5, DALL-E, Whisper)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Anthropic Claude (Claude 3, Claude 2)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Google AI (Gemini Pro, PaLM 2)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Azure OpenAI Service</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Custom model integration support</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6">Infrastructure Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Automatic failover between providers</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Intelligent request routing</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Response caching and optimization</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Real-time monitoring and analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Cost tracking and optimization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Why Choose Our AI Infrastructure?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
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
            Ready to Scale Your AI Infrastructure?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Join leading companies that trust Unite Group for their AI infrastructure needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90">
              <Link href="/[locale]/contact">
                Start Your Project
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/[locale]/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
