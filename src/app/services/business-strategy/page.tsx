import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Users, 
  BarChart3, 
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  DollarSign
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Strategy Consulting | Unite Group',
  description: 'Transform your business with our strategic consulting services. We help companies develop winning strategies, optimize operations, and achieve sustainable growth.',
  keywords: 'business strategy, strategic consulting, business transformation, growth strategy, operational excellence',
};

const strategies = [
  {
    icon: <Lightbulb className="h-8 w-8" />,
    title: 'Strategic Planning',
    description: 'Develop comprehensive business strategies aligned with your vision and market opportunities.',
    features: [
      'Market analysis and competitive intelligence',
      'SWOT analysis and strategic positioning',
      'Goal setting and KPI development',
      'Strategic roadmap creation'
    ]
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: 'Market Entry Strategy',
    description: 'Navigate new markets successfully with our proven market entry frameworks.',
    features: [
      'Market research and opportunity assessment',
      'Entry strategy development',
      'Risk assessment and mitigation',
      'Go-to-market planning'
    ]
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Growth Strategy',
    description: 'Accelerate your business growth with data-driven strategies and execution plans.',
    features: [
      'Growth opportunity identification',
      'Revenue optimization strategies',
      'Scaling frameworks',
      'Performance tracking systems'
    ]
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Organizational Strategy',
    description: 'Optimize your organizational structure and culture for maximum effectiveness.',
    features: [
      'Organizational design and restructuring',
      'Change management strategies',
      'Leadership development programs',
      'Culture transformation initiatives'
    ]
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Digital Transformation',
    description: 'Lead your industry with comprehensive digital transformation strategies.',
    features: [
      'Digital maturity assessment',
      'Technology strategy development',
      'Process digitization roadmap',
      'Digital culture implementation'
    ]
  },
  {
    icon: <DollarSign className="h-8 w-8" />,
    title: 'Financial Strategy',
    description: 'Optimize your financial performance with strategic financial planning and analysis.',
    features: [
      'Financial planning and forecasting',
      'Investment strategy development',
      'Cost optimization programs',
      'Financial risk management'
    ]
  }
];

const benefits = [
  {
    title: 'Proven Methodology',
    description: 'Our strategic frameworks have been tested across industries and proven to deliver results.'
  },
  {
    title: 'Expert Team',
    description: 'Work with experienced strategy consultants who understand your industry challenges.'
  },
  {
    title: 'Actionable Insights',
    description: 'Receive practical recommendations that can be implemented immediately.'
  },
  {
    title: 'Ongoing Support',
    description: 'Get continued support during strategy implementation and execution phases.'
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'CEO, TechStart Inc.',
    content: 'Unite Group helped us develop a comprehensive growth strategy that resulted in 300% revenue increase over 18 months.',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'COO, Global Manufacturing',
    content: 'Their organizational strategy consulting transformed our operations and improved efficiency by 40%.',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    role: 'Founder, Digital Solutions',
    content: 'The digital transformation strategy they developed positioned us as industry leaders in our market.',
    rating: 5
  }
];

const process = [
  {
    step: '01',
    title: 'Discovery & Assessment',
    description: 'We conduct thorough analysis of your current situation, challenges, and opportunities.'
  },
  {
    step: '02',
    title: 'Strategy Development',
    description: 'Our team develops customized strategies based on your specific needs and market conditions.'
  },
  {
    step: '03',
    title: 'Implementation Planning',
    description: 'We create detailed implementation plans with timelines, resources, and success metrics.'
  },
  {
    step: '04',
    title: 'Execution Support',
    description: 'Ongoing support and guidance throughout the strategy execution phase.'
  }
];

export default function BusinessStrategyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            Strategic Consulting
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transform Your Business with
            <span className="text-blue-600"> Strategic Excellence</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Unlock your business potential with our comprehensive strategy consulting services. 
            We help organizations develop winning strategies, optimize operations, and achieve sustainable growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Strategic Consultation
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              View Case Studies
            </Button>
          </div>
        </div>
      </section>

      {/* Strategy Services */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Strategic Services
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive strategy consulting services designed to address every aspect of your business growth and transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {strategies.map((strategy, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                    {strategy.icon}
                  </div>
                  <CardTitle className="text-xl">{strategy.title}</CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {strategy.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Strategic Process
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A proven methodology that ensures successful strategy development and implementation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Strategic Consulting
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Partner with us for strategic excellence and measurable business results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Client Success Stories
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See how our strategic consulting has transformed businesses across industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Business Strategy?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Let's discuss how our strategic consulting can help you achieve your business goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Schedule Consultation
                  <Clock className="ml-2 h-5 w-5" />
                </Button>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                    Contact Our Team
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
