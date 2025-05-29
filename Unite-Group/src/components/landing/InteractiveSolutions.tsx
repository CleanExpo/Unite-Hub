'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Building2, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe,
  ChevronRight,
  CheckCircle2,
  Star,
  ArrowUpRight
} from 'lucide-react';

interface Solution {
  id: string;
  icon: typeof Bot;
  title: string;
  description: string;
  features: string[];
  benefits: string[];
  tags: string[];
  color: string;
  bgGradient: string;
  iconColor: string;
}

const solutions: Solution[] = [
  {
    id: 'ai-infrastructure',
    icon: Bot,
    title: 'AI Infrastructure',
    description: 'Production-ready AI gateway with multi-provider support and intelligent routing',
    features: [
      'OpenAI, Claude, Google AI, Azure integration',
      'Automatic failover and load balancing',
      'Intelligent caching and rate limiting',
      'Real-time monitoring and analytics',
      'Cost optimization and usage tracking'
    ],
    benefits: [
      '99.9% API uptime guarantee',
      '503 error resolution',
      '40% cost reduction',
      'Real-time failover'
    ],
    tags: ['Multi-Provider', '503 Resolution', 'Cost Optimized'],
    color: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
    iconColor: 'text-blue-600'
  },
  {
    id: 'saas-platform',
    icon: Building2,
    title: 'SaaS Platform Development',
    description: 'Full-stack enterprise applications with modern architecture and scalable design',
    features: [
      'Next.js 15 with App Router',
      'TypeScript and modern React patterns',
      'Supabase database and authentication',
      'Stripe payment integration',
      'PWA capabilities and offline support'
    ],
    benefits: [
      'Rapid development cycles',
      'Enterprise-grade security',
      'Scalable architecture',
      'Modern tech stack'
    ],
    tags: ['Next.js 15', 'TypeScript', 'Enterprise'],
    color: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
    iconColor: 'text-purple-600'
  },
  {
    id: 'business-intelligence',
    icon: BarChart3,
    title: 'Business Intelligence',
    description: 'Advanced analytics and performance monitoring with AI-powered insights',
    features: [
      'Real-time analytics dashboards',
      'Performance optimization tools',
      'User behavior tracking',
      'Custom reporting and insights',
      'Predictive analytics with AI'
    ],
    benefits: [
      'Data-driven decisions',
      'Performance insights',
      'Predictive forecasting',
      'Custom reporting'
    ],
    tags: ['Real-time', 'Predictive AI', 'Custom Reports'],
    color: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    iconColor: 'text-green-600'
  },
  {
    id: 'security-compliance',
    icon: Shield,
    title: 'Security & Compliance',
    description: 'Enterprise-grade security and regulatory compliance frameworks',
    features: [
      'SOC2 Type II compliance framework',
      'GDPR and privacy protection',
      'Multi-factor authentication (MFA)',
      'Role-based access control (RBAC)',
      'Advanced security monitoring'
    ],
    benefits: [
      'Regulatory compliance',
      'Data protection',
      'Zero trust security',
      'Audit ready'
    ],
    tags: ['SOC2', 'GDPR', 'Zero Trust'],
    color: 'from-red-500 to-orange-500',
    bgGradient: 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
    iconColor: 'text-red-600'
  },
  {
    id: 'performance',
    icon: Zap,
    title: 'Performance Optimization',
    description: 'Lightning-fast applications with global reach and enterprise performance',
    features: [
      'CDN optimization and image processing',
      'Database query optimization',
      'Caching strategies and Redis integration',
      'Bundle optimization and code splitting',
      'Load testing and performance monitoring'
    ],
    benefits: [
      'Sub-second load times',
      'Global CDN delivery',
      'Optimized databases',
      'Performance monitoring'
    ],
    tags: ['CDN', 'Caching', 'Global'],
    color: 'from-yellow-500 to-amber-500',
    bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20',
    iconColor: 'text-yellow-600'
  },
  {
    id: 'global-solutions',
    icon: Globe,
    title: 'Global Solutions',
    description: 'Multi-language and multi-region capabilities for worldwide deployment',
    features: [
      'Multi-language support (i18n)',
      'Regional content management',
      'Global CDN deployment',
      'Currency and payment localization',
      'Cultural adaptation and UX'
    ],
    benefits: [
      'Global market reach',
      'Localized experiences',
      'Multi-currency support',
      'Cultural adaptation'
    ],
    tags: ['i18n', 'Global CDN', 'Multi-Currency'],
    color: 'from-indigo-500 to-purple-500',
    bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20',
    iconColor: 'text-indigo-600'
  }
];

export function InteractiveSolutions() {
  const [selectedSolution, setSelectedSolution] = useState<string>(solutions[0].id);
  const [hoveredSolution, setHoveredSolution] = useState<string | null>(null);

  const activeSolution = solutions.find(s => s.id === selectedSolution) || solutions[0];

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Our Solutions
          </span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Comprehensive enterprise solutions designed to transform your business operations 
          and accelerate digital innovation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Solution Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {solutions.map((solution) => (
            <Card
              key={solution.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                selectedSolution === solution.id
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${
                hoveredSolution === solution.id ? 'scale-102' : ''
              } bg-gradient-to-br ${solution.bgGradient}`}
              onClick={() => setSelectedSolution(solution.id)}
              onMouseEnter={() => setHoveredSolution(solution.id)}
              onMouseLeave={() => setHoveredSolution(null)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${solution.color} text-white`}>
                    <solution.icon className="w-6 h-6" />
                  </div>
                  {selectedSolution === solution.id && (
                    <CheckCircle2 className="w-6 h-6 text-blue-500" />
                  )}
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {solution.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {solution.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {solution.tags.slice(0, 2).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs bg-white/60 dark:bg-gray-800/60"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Solution Details */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="pb-6">
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${activeSolution.color} text-white mb-4`}>
                <activeSolution.icon className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activeSolution.title}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                {activeSolution.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              {/* Key Features */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Key Features
                </h4>
                <ul className="space-y-3">
                  {activeSolution.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <ArrowUpRight className="w-5 h-5 mr-2 text-blue-500" />
                  Key Benefits
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {activeSolution.benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Tags */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {activeSolution.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      className={`bg-gradient-to-r ${activeSolution.color} text-white border-0`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Button 
                className={`w-full bg-gradient-to-r ${activeSolution.color} hover:opacity-90 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group`}
              >
                Learn More About {activeSolution.title}
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
