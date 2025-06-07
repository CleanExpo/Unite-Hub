import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, Target, TrendingUp, Users, BarChart3, Brain,
  ArrowRight, CheckCircle, Rocket, Shield, LineChart, Briefcase
} from 'lucide-react';
import { generateMetadata as generateSEOMetadata } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/SEOHead';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Business Strategy Consulting - Transform Your Vision',
  description: 'Expert business strategy consulting to accelerate growth. Market analysis, competitive positioning, digital transformation, and strategic planning for sustainable success.',
  keywords: ['business strategy', 'strategic consulting', 'business transformation', 'growth strategy', 'Brisbane consultants', 'digital transformation'],
  url: 'https://unitegroup.com.au/services/business-strategy',
});

export default function BusinessStrategyPage() {
  const serviceSchema = generateServiceSchema({
    name: 'Business Strategy Consulting',
    description: 'Comprehensive business strategy services including market analysis, growth planning, and digital transformation',
    serviceType: 'Management Consulting',
  });

  const strategies = [
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: 'Innovation Strategy',
      description: 'Transform ideas into market-leading products and services',
      outcomes: [
        'Innovation framework development',
        'R&D process optimization',
        'Product-market fit analysis',
        'Technology roadmapping',
        'Innovation culture building',
      ],
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Market Expansion',
      description: 'Identify and capture new market opportunities for growth',
      outcomes: [
        'Market entry strategies',
        'Geographic expansion planning',
        'Channel development',
        'Partnership strategies',
        'International growth plans',
      ],
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Digital Transformation',
      description: 'Leverage technology to revolutionize your business model',
      outcomes: [
        'Digital maturity assessment',
        'Technology stack planning',
        'Process digitization',
        'Data strategy development',
        'Change management',
      ],
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Organizational Excellence',
      description: 'Build high-performing teams and scalable operations',
      outcomes: [
        'Organizational design',
        'Leadership development',
        'Performance frameworks',
        'Culture transformation',
        'Talent strategy',
      ],
    },
  ];

  const frameworks = {
    analysis: [
      'SWOT Analysis',
      'Porter\'s Five Forces',
      'Value Chain Analysis',
      'PESTLE Analysis',
      'BCG Matrix',
    ],
    planning: [
      'OKR Framework',
      'Balanced Scorecard',
      'Blue Ocean Strategy',
      'Scenario Planning',
      'Strategic Roadmapping',
    ],
    execution: [
      'Agile Transformation',
      'Change Management',
      'KPI Development',
      'Risk Management',
      'Performance Tracking',
    ],
  };

  const engagementModels = [
    {
      name: 'Strategic Sprint',
      duration: '2-4 weeks',
      price: '$15,000',
      description: 'Rapid strategy development for specific challenges',
      features: [
        'Focused problem-solving',
        'Quick market analysis',
        'Action plan development',
        'Executive workshop',
        'Implementation roadmap',
      ],
      ideal: 'Urgent strategic decisions',
    },
    {
      name: 'Transformation Program',
      duration: '3-6 months',
      price: '$50,000',
      description: 'Comprehensive business transformation initiative',
      features: [
        'Full strategic assessment',
        'Multi-phase planning',
        'Change management',
        'Team enablement',
        'Progress monitoring',
        'Executive coaching',
      ],
      ideal: 'Major business pivots',
      recommended: true,
    },
    {
      name: 'Strategic Partnership',
      duration: '12+ months',
      price: 'Custom',
      description: 'Ongoing strategic advisory and implementation support',
      features: [
        'Dedicated strategy team',
        'Quarterly planning cycles',
        'Board advisory services',
        'Continuous optimization',
        'Market intelligence',
        'C-suite mentoring',
      ],
      ideal: 'Long-term growth ambitions',
    },
  ];

  const caseStudyResults = [
    { metric: 'Revenue Growth', value: '234%', description: 'Average 3-year growth' },
    { metric: 'Market Share', value: '+18%', description: 'Competitive gain' },
    { metric: 'Operational Efficiency', value: '47%', description: 'Cost reduction' },
    { metric: 'Time to Market', value: '-65%', description: 'Speed improvement' },
  ];

  return (
    <>
      <JsonLd data={serviceSchema} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10" />
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-indigo-600 text-white">Strategic Excellence</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Business Strategy Consulting
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Transform your vision into reality with data-driven strategies. We help ambitious 
                companies navigate complexity, seize opportunities, and achieve sustainable growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/book-consultation">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                    Schedule Strategy Session
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#frameworks">
                  <Button size="lg" variant="outline">
                    Explore Our Approach
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Results Showcase */}
        <section className="py-16 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {caseStudyResults.map((result, index) => (
                <div
                  key={result.metric}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {result.value}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">{result.metric}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{result.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Strategy Services */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Strategic Solutions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Comprehensive strategies tailored to your unique challenges and opportunities
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {strategies.map((strategy, index) => (
                <div key={strategy.title}>
                  <Card className="h-full hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
                        {strategy.icon}
                      </div>
                      <CardTitle className="text-2xl">{strategy.title}</CardTitle>
                      <CardDescription className="text-base">
                        {strategy.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {strategy.outcomes.map((outcome) => (
                          <li key={outcome} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Frameworks */}
        <section id="frameworks" className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Proven Methodologies
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                World-class frameworks adapted to your specific context
              </p>
            </div>

            <Tabs defaultValue="analysis" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="planning">Planning</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
              </TabsList>

              {Object.entries(frameworks).map(([category, items]) => (
                <TabsContent key={category} value={category} className="mt-8">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((framework, index) => (
                      <div
                        key={framework}
                        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <Brain className="h-6 w-6 text-indigo-600" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {framework}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Engagement Models */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Engagement Models
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Flexible engagement options to match your needs and timeline
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {engagementModels.map((model, index) => (
                <div
                  key={model.name}
                  className={`relative ${model.recommended ? 'md:-mt-4' : ''}`}
                >
                  {model.recommended && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-indigo-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <Card className={`h-full ${model.recommended ? 'border-indigo-600 shadow-xl' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-2xl">{model.name}</CardTitle>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {model.price}
                        </span>
                        {model.price !== 'Custom' && (
                          <span className="text-gray-600 dark:text-gray-400">starting</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {model.duration}
                      </p>
                      <CardDescription className="mt-4">
                        {model.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {model.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <strong>Ideal for:</strong> {model.ideal}
                      </div>
                      <Button 
                        className={`w-full ${
                          model.recommended 
                            ? 'bg-indigo-600 hover:bg-indigo-700' 
                            : ''
                        }`}
                        variant={model.recommended ? 'default' : 'outline'}
                      >
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                The Unite Group Advantage
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                What sets our strategic consulting apart
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Data-Driven Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Every recommendation backed by rigorous analysis and market data
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Implementation Focus
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Practical strategies designed for real-world execution and results
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Risk Mitigation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive scenario planning to navigate uncertainty
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="container mx-auto px-4 text-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Let&apos;s create a strategy that turns your vision into measurable success
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/book-consultation">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Book Strategy Session
                  </Button>
                </Link>
                <Link href="/case-studies">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
                    View Success Stories
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-sm text-indigo-100">
                🎯 Custom strategies • 📊 Data-driven approach • 🚀 Proven results
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
