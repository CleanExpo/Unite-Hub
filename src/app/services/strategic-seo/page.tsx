import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Globe, 
  CheckCircle,
  ArrowRight,
  Star,
  Eye,
  Users,
  Zap,
  Award
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Strategic SEO Services | Unite Group',
  description: 'Dominate search rankings with our comprehensive SEO strategies. Drive organic traffic, improve visibility, and grow your business online.',
  keywords: 'SEO services, search engine optimization, organic traffic, keyword ranking, digital marketing, online visibility',
};

const seoServices = [
  {
    icon: <Search className="h-8 w-8" />,
    title: 'Keyword Research & Strategy',
    description: 'Comprehensive keyword analysis to target the right audience and maximize organic traffic.',
    features: [
      'Competitor keyword analysis',
      'Long-tail keyword identification',
      'Search intent mapping',
      'Keyword difficulty assessment'
    ]
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'On-Page Optimization',
    description: 'Optimize every element of your website for maximum search engine visibility.',
    features: [
      'Title tag and meta description optimization',
      'Header structure improvement',
      'Internal linking strategy',
      'Content optimization'
    ]
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: 'Technical SEO',
    description: 'Ensure your website meets all technical requirements for optimal search performance.',
    features: [
      'Site speed optimization',
      'Mobile responsiveness',
      'Schema markup implementation',
      'XML sitemap optimization'
    ]
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Content Strategy',
    description: 'Create and optimize content that ranks well and engages your target audience.',
    features: [
      'Content gap analysis',
      'Editorial calendar development',
      'SEO-optimized content creation',
      'Content performance tracking'
    ]
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: 'Link Building',
    description: 'Build high-quality backlinks to improve domain authority and search rankings.',
    features: [
      'Link opportunity identification',
      'Outreach campaign management',
      'Guest posting strategies',
      'Link quality assessment'
    ]
  },
  {
    icon: <Eye className="h-8 w-8" />,
    title: 'Local SEO',
    description: 'Dominate local search results and attract customers in your geographic area.',
    features: [
      'Google My Business optimization',
      'Local citation building',
      'Review management',
      'Local keyword targeting'
    ]
  }
];

const benefits = [
  {
    title: 'Increased Organic Traffic',
    description: 'Drive more qualified visitors to your website through improved search rankings.'
  },
  {
    title: 'Higher Conversion Rates',
    description: 'Target users with high purchase intent to maximize your ROI.'
  },
  {
    title: 'Brand Authority',
    description: 'Establish your brand as an industry leader through top search positions.'
  },
  {
    title: 'Long-term Results',
    description: 'Build sustainable organic growth that compounds over time.'
  },
  {
    title: 'Cost-Effective Marketing',
    description: 'Generate leads and sales without ongoing advertising costs.'
  },
  {
    title: 'Competitive Advantage',
    description: 'Outrank competitors and capture their market share.'
  }
];

const seoMetrics = [
  { metric: 'Organic Traffic', improvement: '300% increase', icon: TrendingUp },
  { metric: 'Keyword Rankings', improvement: 'Top 3 positions', icon: Target },
  { metric: 'Conversion Rate', improvement: '45% improvement', icon: Zap },
  { metric: 'Domain Authority', improvement: '25+ point gain', icon: Award }
];

const testimonials = [
  {
    name: 'Sarah Williams',
    role: 'Marketing Director, E-commerce Pro',
    content: 'Our organic traffic increased by 400% in 6 months. Unite Group SEO strategy transformed our online presence.',
    rating: 5,
    result: '400% traffic increase'
  },
  {
    name: 'James Chen',
    role: 'CEO, Local Services Inc.',
    content: 'We now rank #1 for all our target keywords. The ROI from SEO has been incredible for our business.',
    rating: 5,
    result: '#1 rankings achieved'
  },
  {
    name: 'Maria Rodriguez',
    role: 'Founder, Tech Startup',
    content: 'Professional SEO service that delivered real results. Our lead generation increased by 250% through organic search.',
    rating: 5,
    result: '250% more leads'
  }
];

const process = [
  {
    step: '01',
    title: 'SEO Audit & Analysis',
    description: 'Comprehensive analysis of your current SEO performance and opportunities.'
  },
  {
    step: '02',
    title: 'Strategy Development',
    description: 'Custom SEO strategy based on your business goals and market analysis.'
  },
  {
    step: '03',
    title: 'Implementation',
    description: 'Execute optimization strategies across technical, on-page, and off-page factors.'
  },
  {
    step: '04',
    title: 'Monitoring & Reporting',
    description: 'Track progress with detailed reporting and continuous optimization.'
  }
];

const packages = [
  {
    name: 'Starter SEO',
    price: '$1,500',
    period: '/month',
    description: 'Perfect for small businesses getting started with SEO',
    features: [
      'Keyword research (up to 50 keywords)',
      'On-page optimization (10 pages)',
      'Technical SEO audit',
      'Monthly reporting',
      'Google My Business optimization'
    ],
    popular: false
  },
  {
    name: 'Professional SEO',
    price: '$3,500',
    period: '/month',
    description: 'Comprehensive SEO for growing businesses',
    features: [
      'Keyword research (up to 200 keywords)',
      'On-page optimization (25 pages)',
      'Content creation (4 articles/month)',
      'Link building campaign',
      'Technical SEO implementation',
      'Bi-weekly reporting'
    ],
    popular: true
  },
  {
    name: 'Enterprise SEO',
    price: '$7,500',
    period: '/month',
    description: 'Advanced SEO for large organizations',
    features: [
      'Unlimited keyword research',
      'Full website optimization',
      'Content strategy & creation',
      'Advanced link building',
      'Technical SEO management',
      'Weekly reporting & consultation'
    ],
    popular: false
  }
];

export default function StrategicSEOPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            Strategic SEO
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Dominate Search Rankings with
            <span className="text-blue-600"> Strategic SEO</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Drive organic traffic, improve search visibility, and grow your business with our 
            comprehensive SEO strategies. Get found by customers actively searching for your services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get SEO Audit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              View SEO Packages
            </Button>
          </div>
        </div>
      </section>

      {/* SEO Metrics */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Proven SEO Results
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See the measurable improvements our SEO strategies deliver for businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {seoMetrics.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.metric}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {item.improvement}
                  </div>
                  <p className="text-sm text-gray-500">Average client result</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Services */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our SEO Services
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive SEO solutions covering every aspect of search engine optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {seoServices.map((service, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                    {service.icon}
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

      {/* SEO Packages */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              SEO Packages
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the SEO package that best fits your business needs and goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <Card key={index} className={`relative ${pkg.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {pkg.price}
                    </span>
                    <span className="text-gray-500">{pkg.period}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${pkg.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={pkg.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our SEO Process
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A proven methodology for delivering sustainable SEO results.
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

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              SEO Success Stories
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Real results from businesses that transformed their online presence with our SEO.
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
                  <Badge className="bg-blue-100 text-blue-800">
                    {testimonial.result}
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
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Dominate Search Results?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Get a free SEO audit and discover how to outrank your competitors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Get Free SEO Audit
                  <Search className="ml-2 h-5 w-5" />
                </Button>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                    Contact SEO Team
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
