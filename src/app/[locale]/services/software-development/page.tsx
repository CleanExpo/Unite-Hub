import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, Smartphone, Globe, Database, Cloud, Shield,
  ArrowRight, CheckCircle, Zap, Users, TrendingUp, Clock
} from 'lucide-react';
import { generateMetadata as generateSEOMetadata } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/SEOHead';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Custom Software Development Services',
  description: 'Enterprise-grade software development services. From web applications to mobile apps and cloud solutions, we build scalable software that drives business growth.',
  keywords: ['software development', 'custom software', 'web development', 'mobile apps', 'cloud solutions', 'Brisbane developers'],
  url: 'https://unitegroup.com.au/services/software-development',
});

export default function SoftwareDevelopmentPage() {
  const serviceSchema = generateServiceSchema({
    name: 'Custom Software Development',
    description: 'Full-stack software development services including web applications, mobile apps, and enterprise solutions',
    serviceType: 'Software Development',
  });

  const techStack = {
    frontend: [
      { name: 'React/Next.js', level: 'Expert' },
      { name: 'TypeScript', level: 'Expert' },
      { name: 'Tailwind CSS', level: 'Expert' },
      { name: 'Vue.js', level: 'Advanced' },
      { name: 'Angular', level: 'Advanced' },
    ],
    backend: [
      { name: 'Node.js', level: 'Expert' },
      { name: 'Python/Django', level: 'Expert' },
      { name: '.NET Core', level: 'Advanced' },
      { name: 'Java/Spring', level: 'Advanced' },
      { name: 'Go', level: 'Intermediate' },
    ],
    mobile: [
      { name: 'React Native', level: 'Expert' },
      { name: 'Flutter', level: 'Advanced' },
      { name: 'iOS (Swift)', level: 'Advanced' },
      { name: 'Android (Kotlin)', level: 'Advanced' },
    ],
    cloud: [
      { name: 'AWS', level: 'Expert' },
      { name: 'Google Cloud', level: 'Advanced' },
      { name: 'Azure', level: 'Advanced' },
      { name: 'Vercel', level: 'Expert' },
      { name: 'Docker/K8s', level: 'Advanced' },
    ],
  };

  const services = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Web Applications',
      description: 'Scalable, responsive web applications built with modern frameworks and best practices',
      features: [
        'Progressive Web Apps (PWA)',
        'Single Page Applications (SPA)',
        'E-commerce Platforms',
        'SaaS Solutions',
        'Enterprise Portals',
      ],
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: 'Mobile Development',
      description: 'Native and cross-platform mobile apps that deliver exceptional user experiences',
      features: [
        'iOS & Android Apps',
        'Cross-platform Solutions',
        'Offline Functionality',
        'Push Notifications',
        'App Store Deployment',
      ],
    },
    {
      icon: <Database className="h-8 w-8" />,
      title: 'Backend & APIs',
      description: 'Robust backend systems and APIs that power your applications',
      features: [
        'RESTful & GraphQL APIs',
        'Microservices Architecture',
        'Database Design',
        'Real-time Features',
        'Third-party Integrations',
      ],
    },
    {
      icon: <Cloud className="h-8 w-8" />,
      title: 'Cloud Solutions',
      description: 'Cloud-native applications with auto-scaling and high availability',
      features: [
        'Cloud Migration',
        'Serverless Architecture',
        'DevOps Implementation',
        'Container Orchestration',
        'CI/CD Pipelines',
      ],
    },
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$5,000',
      duration: '4-6 weeks',
      description: 'Perfect for MVPs and small projects',
      features: [
        'Single platform (web or mobile)',
        'Core features implementation',
        'Basic UI/UX design',
        'Cloud deployment',
        '30-day support',
      ],
      recommended: false,
    },
    {
      name: 'Professional',
      price: '$15,000',
      duration: '8-12 weeks',
      description: 'Ideal for growing businesses',
      features: [
        'Multi-platform support',
        'Advanced features',
        'Custom UI/UX design',
        'API integrations',
        'Performance optimization',
        '90-day support',
      ],
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      duration: '3-6 months',
      description: 'Complete digital transformation',
      features: [
        'Full-scale applications',
        'Microservices architecture',
        'Enterprise integrations',
        'Advanced security',
        'Dedicated team',
        '12-month support',
      ],
      recommended: false,
    },
  ];

  const process = [
    { phase: 'Discovery', duration: '1-2 weeks', description: 'Requirements gathering and technical planning' },
    { phase: 'Design', duration: '2-3 weeks', description: 'UI/UX design and architecture planning' },
    { phase: 'Development', duration: '4-12 weeks', description: 'Agile development with weekly demos' },
    { phase: 'Testing', duration: '1-2 weeks', description: 'Comprehensive testing and quality assurance' },
    { phase: 'Deployment', duration: '1 week', description: 'Launch preparation and go-live support' },
    { phase: 'Support', duration: 'Ongoing', description: 'Maintenance and continuous improvement' },
  ];

  return (
    <>
      <JsonLd data={serviceSchema} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-purple-600 text-white">Full-Stack Excellence</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Custom Software Development
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Transform your ideas into powerful software solutions. We build scalable, 
                secure applications that drive business growth and deliver exceptional user experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Start Your Project
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#portfolio">
                  <Button size="lg" variant="outline">
                    View Our Portfolio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Development Services
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                End-to-end software development solutions tailored to your business needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <div key={service.title}>
                  <Card className="h-full hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white mb-4">
                        {service.icon}
                      </div>
                      <CardTitle className="text-2xl">{service.title}</CardTitle>
                      <CardDescription className="text-base">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
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

        {/* Tech Stack */}
        <section className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Technology Stack
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Cutting-edge technologies to build modern, scalable applications
              </p>
            </div>

            <Tabs defaultValue="frontend" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="frontend">Frontend</TabsTrigger>
                <TabsTrigger value="backend">Backend</TabsTrigger>
                <TabsTrigger value="mobile">Mobile</TabsTrigger>
                <TabsTrigger value="cloud">Cloud</TabsTrigger>
              </TabsList>

              {Object.entries(techStack).map(([category, technologies]) => (
                <TabsContent key={category} value={category} className="mt-8">
                  <div className="grid md:grid-cols-2 gap-4">
                    {technologies.map((tech, index) => (
                      <div
                        key={tech.name}
                        className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Code2 className="h-5 w-5 text-purple-600" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {tech.name}
                            </span>
                          </div>
                          <Badge variant={tech.level === 'Expert' ? 'default' : 'secondary'}>
                            {tech.level}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Transparent Pricing
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Choose the package that fits your needs, or let us create a custom solution
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <div
                  key={tier.name}
                  className={`relative ${tier.recommended ? 'md:-mt-4' : ''}`}
                >
                  {tier.recommended && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-purple-600 text-white">Recommended</Badge>
                    </div>
                  )}
                  <Card className={`h-full ${tier.recommended ? 'border-purple-600 shadow-xl' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {tier.price}
                        </span>
                        {tier.price !== 'Custom' && <span className="text-gray-600 dark:text-gray-400">+</span>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {tier.duration}
                      </p>
                      <CardDescription className="mt-4">
                        {tier.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className={`w-full mt-6 ${
                          tier.recommended 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : ''
                        }`}
                        variant={tier.recommended ? 'default' : 'outline'}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our Development Process
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Agile methodology with continuous delivery and transparent communication
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {process.map((phase, index) => (
                  <div
                    key={phase.phase}
                    className="mb-8 flex items-center"
                  >
                    <div className="flex-shrink-0 w-32 text-right pr-8">
                      <Badge variant="outline">{phase.duration}</Badge>
                    </div>
                    <div className="flex-shrink-0 w-4 h-4 bg-purple-600 rounded-full relative">
                      {index < process.length - 1 && (
                        <div className="absolute top-4 left-1.5 w-0.5 h-12 bg-purple-200" />
                      )}
                    </div>
                    <div className="flex-grow pl-8">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {phase.phase}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="container mx-auto px-4 text-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Build Something Amazing?
              </h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Let&apos;s discuss your project and create a custom solution that exceeds expectations
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                    <Zap className="mr-2 h-5 w-5" />
                    Start Your Project
                  </Button>
                </Link>
                <Link href="/book-consultation">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                    Schedule Consultation
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-sm text-purple-100">
                🚀 Fast delivery • 🛡️ Secure by design • 📱 Mobile-first approach
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
