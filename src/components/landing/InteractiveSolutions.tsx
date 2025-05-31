'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  Code, 
  Search, 
  Target, 
  Award,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface Service {
  id: string;
  icon: typeof Clock;
  title: string;
  description: string;
  features: string[];
  href: string;
  iconBg: string;
}

const services: Service[] = [
  {
    id: 'initial-consultation',
    icon: Clock,
    title: 'Initial Consultation',
    description: 'Comprehensive business analysis and strategic planning to understand your unique needs and challenges.',
    features: [
      'In-depth business assessment',
      'Technology needs analysis', 
      'Strategic roadmap development',
      'Custom solution recommendations'
    ],
    href: '/services/initial-consultation',
    iconBg: 'bg-green-500'
  },
  {
    id: 'expert-education',
    icon: Users,
    title: 'Expert Education',
    description: 'Professional training and development programs designed to enhance your team\'s capabilities and drive innovation.',
    features: [
      'Custom curriculum development',
      'Expert-led training sessions',
      'Hands-on workshops',
      'Certification programs'
    ],
    href: '/services/expert-education',
    iconBg: 'bg-blue-500'
  },
  {
    id: 'software-development',
    icon: Code,
    title: 'Software Development',
    description: 'Cutting-edge software solutions built with modern technologies to streamline your operations and boost efficiency.',
    features: [
      'Custom application development',
      'Modern tech stack implementation',
      'Scalable architecture design',
      'Quality assurance & testing'
    ],
    href: '/services/software-development',
    iconBg: 'bg-blue-600'
  },
  {
    id: 'strategic-seo',
    icon: Search,
    title: 'Strategic SEO',
    description: 'Data-driven SEO strategies to improve your online visibility, drive organic growth, and reach your target audience.',
    features: [
      'Comprehensive SEO audit',
      'Keyword research & strategy',
      'Technical SEO optimization',
      'Performance monitoring'
    ],
    href: '/services/strategic-seo',
    iconBg: 'bg-green-600'
  },
  {
    id: 'business-strategy',
    icon: Target,
    title: 'Business Strategy',
    description: 'Strategic consulting to help you navigate challenges, identify opportunities, and achieve sustainable growth.',
    features: [
      'Market analysis',
      'Competitive research',
      'Growth strategy development',
      'Performance optimization'
    ],
    href: '/services/business-strategy',
    iconBg: 'bg-orange-500'
  },
  {
    id: 'quality-assurance',
    icon: Award,
    title: 'Quality Assurance',
    description: 'Rigorous testing and quality assurance processes to ensure your solutions meet the highest standards.',
    features: [
      'Comprehensive testing',
      'Performance optimization',
      'Security audits',
      'Ongoing maintenance'
    ],
    href: '/services/quality-assurance',
    iconBg: 'bg-red-500'
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
            Our Services
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Comprehensive enterprise solutions designed to transform your business operations 
            and accelerate digital innovation.
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
                  <div className={`p-4 rounded-full ${service.iconBg} text-white`}>
                    <service.icon className="w-8 h-8" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  {service.description}
                </CardDescription>
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
                    Learn More
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
