'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Cpu, 
  Code2, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface Service {
  id: string;
  icon: typeof Cpu;
  image?: string;
  title: string;
  description: string;
  features: string[];
  href: string;
  iconBg: string;
}

const services: Service[] = [
  {
    id: 'ai-infrastructure',
    icon: Cpu,
    image: '/images/SAP_System_and_Products.png',
    title: 'AI Infrastructure',
    description: 'Enterprise-grade AI Gateway with multi-provider support, advanced security, and intelligent optimization.',
    features: [
      'Multi-provider AI gateway',
      'Advanced security framework',
      'Performance optimization',
      'Predictive analytics'
    ],
    href: '/services/ai-infrastructure',
    iconBg: 'bg-purple-500'
  },
  {
    id: 'saas-development',
    icon: Code2,
    image: '/images/Software_Development.png',
    title: 'SaaS Development',
    description: 'Build next-generation SaaS platforms with modern architecture, scalable infrastructure, and comprehensive security.',
    features: [
      'Modern tech stack',
      'Scalable architecture',
      'Cloud-native deployment',
      'Enterprise security'
    ],
    href: '/services/saas-development',
    iconBg: 'bg-blue-500'
  },
  {
    id: 'business-intelligence',
    icon: BarChart3,
    image: '/images/Strategic_Planning.png',
    title: 'Business Intelligence',
    description: 'Transform your data into actionable insights with AI-powered analytics and real-time dashboards.',
    features: [
      'Real-time analytics',
      'AI-powered insights',
      'Predictive analytics',
      'Custom reporting'
    ],
    href: '/services/business-intelligence',
    iconBg: 'bg-green-500'
  },
  {
    id: 'security-compliance',
    icon: Shield,
    image: '/images/Professional_Training.png',
    title: 'Security & Compliance',
    description: 'Enterprise-grade security solutions with comprehensive compliance frameworks including SOC 2, GDPR, and ISO 27001.',
    features: [
      'Zero-trust architecture',
      'Advanced threat protection',
      'Compliance automation',
      '24/7 security monitoring'
    ],
    href: '/services/security-compliance',
    iconBg: 'bg-red-500'
  },
  {
    id: 'performance',
    icon: Zap,
    image: '/images/Strategic_Growth.png',
    title: 'Performance Optimization',
    description: 'Achieve sub-second load times and optimal user experience with advanced performance optimization.',
    features: [
      'Lightning-fast load times',
      'Core Web Vitals optimization',
      'Global CDN deployment',
      'Server optimization'
    ],
    href: '/services/performance',
    iconBg: 'bg-yellow-500'
  },
  {
    id: 'global-solutions',
    icon: Globe2,
    image: '/images/Strategic_SEO.png',
    title: 'Global Solutions',
    description: 'Expand worldwide with multi-language support, global payments, and regional compliance.',
    features: [
      'Multi-language support',
      'Multi-currency platform',
      'Regional compliance',
      'Cultural localization'
    ],
    href: '/services/global-solutions',
    iconBg: 'bg-teal-500'
  }
];

export function InteractiveSolutions() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <section className="bg-slate-900 py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Transform Your Business with Unite Group
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            From strategic consulting to cutting-edge development, we provide end-to-end solutions 
            that drive measurable business outcomes and sustainable growth.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service) => (
            <Card
              key={service.id}
              className="bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 overflow-hidden group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  {service.image ? (
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`p-4 rounded-full ${service.iconBg} text-white`}>
                      <service.icon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                  {service.title}
                </CardTitle>
                <div className="text-slate-600 text-base leading-relaxed mt-2">
                  {service.description}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button asChild
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 group transition-all duration-300"
                >
                  <Link href={`/${locale}${service.href}`}>
                    Explore Service
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
