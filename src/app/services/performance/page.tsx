import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gauge, 
  Rocket, 
  Zap, 
  Target, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  BarChart3,
  Shield,
  Globe
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Performance Optimization Services | Unite Group',
  description: 'Boost your website and application performance with our comprehensive optimization services. Improve speed, user experience, and search rankings.',
  keywords: 'performance optimization, website speed, core web vitals, SEO performance, user experience optimization',
};

const performanceServices = [
  {
    icon: Gauge,
    title: 'Core Web Vitals',
    description: 'Perfect scores on Google Core Web Vitals for better SEO and user experience.',
    features: [
      'Largest Contentful Paint optimization',
      'First Input Delay reduction',
      'Cumulative Layout Shift elimination',
      'Performance monitoring setup'
    ]
  },
  {
    icon: Rocket,
    title: 'Speed Optimization',
    description: 'Dramatically improve your website loading times and overall performance.',
    features: [
      'Image optimization and compression',
      'Code minification and bundling',
      'Caching strategy implementation',
      'CDN setup and configuration'
    ]
  },
  {
    icon: Zap,
    title: 'Frontend Performance',
    description: 'Optimize your frontend code for maximum speed and efficiency.',
    features: [
      'JavaScript optimization',
      'CSS performance tuning',
      'Lazy loading implementation',
      'Critical path optimization'
    ]
  },
  {
    icon: Target,
    title: 'Backend Optimization',
    description: 'Enhance server-side performance and database efficiency.',
    features: [
      'Database query optimization',
      'Server response time improvement',
      'API performance enhancement',
      'Resource utilization optimization'
    ]
  },
  {
    icon: TrendingUp,
    title: 'Mobile Performance',
    description: 'Ensure optimal performance across all mobile devices and networks.',
    features: [
      'Mobile-first optimization',
      'Progressive Web App features',
      'Offline functionality',
      'Touch interaction optimization'
    ]
  },
  {
    icon: Shield,
    title: 'Security Performance',
    description: 'Balance security measures with optimal performance.',
    features: [
      'SSL/TLS optimization',
      'Security header configuration',
      'DDoS protection setup',
      'Performance-aware security'
    ]
  }
];

const benefits = [
  {
    title: 'Improved SEO Rankings',
    description: 'Better performance directly impacts your search engine rankings and visibility.'
  },
  {
    title: 'Enhanced User Experience',
    description: 'Faster loading times lead to higher user satisfaction and engagement.'
  },
  {
    title: 'Increased Conversions',
    description: 'Performance improvements typically result in higher conversion rates.'
  },
  {
    title: 'Reduced Bounce Rate',
    description: 'Users are more likely to stay on fast-loading, responsive websites.'
  },
  {
    title: 'Cost Efficiency',
    description: 'Optimized performance reduces server costs and resource usage.'
  },
  {
    title: 'Competitive Advantage',
    description: 'Outperform competitors with superior website and application speed.'
  }
];

const performanceMetrics = [
  { metric: 'Page Load Time', improvement: '75% faster', icon: Clock },
  { metric: 'Core Web Vitals', improvement: '90+ scores', icon: Gauge },
  { metric: 'Bounce Rate', improvement: '40% reduction', icon: TrendingUp },
  { metric: 'Conversion Rate', improvement: '25% increase', icon: Target }
];

const testimonials = [
  {
    name: 'David Chen',
    role: 'CTO, E-commerce Plus',
    content: 'Our website speed improved by 80% after Unite Group optimization. Sales increased by 35% within the first month.',
    rating: 5,
    metric: '80% speed improvement'
  },
  {
    name: 'Lisa Rodriguez',
    role: 'Marketing Director, TechStart',
    content: 'The performance optimization transformed our user experience. Our Google PageSpeed score went from 45 to 98.',
    rating: 5,
    metric: '98 PageSpeed score'
  },
  {
    name: 'Michael Johnson',
    role: 'Product Manager, SaaS Solutions',
    content: 'Exceptional results! Our application now loads 3x faster and user engagement has significantly improved.',
    rating: 5,
    metric: '3x faster loading'
  }
];

const process = [
  {
    step: '01',
    title: 'Performance Audit',
    description: 'Comprehensive analysis of current performance bottlenecks and opportunities.'
  },
  {
    step: '02',
    title: 'Optimization Strategy',
    description: 'Custom optimization plan tailored to your specific needs and goals.'
  },
  {
    step: '03',
    title: 'Implementation',
    description: 'Expert implementation of performance improvements with minimal disruption.'
  },
  {
    step: '04',
    title: 'Monitoring & Maintenance',
    description: 'Ongoing performance monitoring and continuous optimization.'
  }
];

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-green-100 text-green-800">
            Performance Optimization
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Supercharge Your
            <span className="text-green-600"> Website Performance</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your website into a speed demon. Our performance optimization services 
            deliver lightning-fast loading times, improved SEO rankings, and exceptional user experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Get Performance Audit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              View Case Studies
            </Button>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Proven Performance Results
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See the measurable improvements our optimization services deliver.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {performanceMetrics.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-green-600">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.metric}
                  </h3>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {item.improvement}
                  </div>
                  <p className="text-sm text-gray-500">Average improvement</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Services */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Performance Services
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive optimization services covering every aspect of web performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {performanceServices.map((service, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 text-green-600">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
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
              Our Optimization Process
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A systematic approach to delivering maximum performance improvements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
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
              Performance Optimization Benefits
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover how performance optimization can transform your business results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              Performance Success Stories
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Real results from businesses that transformed their performance.
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
                  <div className="mb-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {testimonial.role}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {testimonial.metric}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Boost Your Performance?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Get a free performance audit and discover how much faster your website can be.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Get Free Audit
                  <BarChart3 className="ml-2 h-5 w-5" />
                </Button>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-green-600">
                    Contact Performance Team
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
