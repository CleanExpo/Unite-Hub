import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, Bug, CheckCircle2, Zap, FileSearch, Monitor,
  ArrowRight, CheckCircle, AlertTriangle, Clock, Users, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMetadata as generateSEOMetadata } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/SEOHead';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Quality Assurance & Testing Services',
  description: 'Comprehensive QA and testing services to ensure flawless software. Manual testing, automation, performance testing, and security audits for bug-free applications.',
  keywords: ['quality assurance', 'software testing', 'QA services', 'test automation', 'performance testing', 'security testing'],
  url: 'https://unitegroup.com.au/services/quality-assurance',
});

export default function QualityAssurancePage() {
  const serviceSchema = generateServiceSchema({
    name: 'Quality Assurance Services',
    description: 'Professional software testing and quality assurance services including manual testing, automation, and performance optimization',
    serviceType: 'Software Testing',
  });

  const testingServices = [
    {
      icon: <FileSearch className="h-8 w-8" />,
      title: 'Manual Testing',
      description: 'Thorough human-driven testing to catch what automation misses',
      coverage: [
        'Functional testing',
        'Usability testing',
        'Exploratory testing',
        'User acceptance testing',
        'Cross-browser testing',
        'Mobile device testing',
      ],
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Test Automation',
      description: 'Efficient automated testing for faster releases and better coverage',
      coverage: [
        'UI automation',
        'API testing',
        'Integration testing',
        'Regression testing',
        'CI/CD integration',
        'Test framework development',
      ],
    },
    {
      icon: <Monitor className="h-8 w-8" />,
      title: 'Performance Testing',
      description: 'Ensure your application performs under real-world conditions',
      coverage: [
        'Load testing',
        'Stress testing',
        'Scalability testing',
        'Volume testing',
        'Spike testing',
        'Performance optimization',
      ],
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Security Testing',
      description: 'Identify vulnerabilities before hackers do',
      coverage: [
        'Vulnerability assessment',
        'Penetration testing',
        'Security code review',
        'OWASP compliance',
        'Authentication testing',
        'Data protection validation',
      ],
    },
  ];

  const testingProcess = [
    {
      phase: 'Requirements Analysis',
      description: 'Understanding your quality goals and defining test criteria',
      activities: ['Test planning', 'Risk assessment', 'Coverage definition'],
    },
    {
      phase: 'Test Design',
      description: 'Creating comprehensive test cases and scenarios',
      activities: ['Test case creation', 'Test data preparation', 'Environment setup'],
    },
    {
      phase: 'Test Execution',
      description: 'Running tests and documenting results',
      activities: ['Manual execution', 'Automated testing', 'Bug reporting'],
    },
    {
      phase: 'Results & Optimization',
      description: 'Analyzing results and improving quality',
      activities: ['Defect analysis', 'Performance tuning', 'Process improvement'],
    },
  ];

  const qualityMetrics = [
    { metric: 'Defect Detection Rate', value: 98, unit: '%' },
    { metric: 'Test Coverage', value: 95, unit: '%' },
    { metric: 'Automation Coverage', value: 80, unit: '%' },
    { metric: 'Critical Bug Prevention', value: 99.9, unit: '%' },
  ];

  const packages = [
    {
      name: 'Essential QA',
      price: '$3,000',
      duration: '/project',
      description: 'Core testing for small to medium projects',
      features: [
        'Functional testing',
        'Basic UI/UX testing',
        'Browser compatibility',
        'Test documentation',
        'Bug tracking setup',
        '30-day support',
      ],
      bestFor: 'MVPs, small applications',
    },
    {
      name: 'Comprehensive Testing',
      price: '$8,000',
      duration: '/project',
      description: 'Full testing suite for complex applications',
      features: [
        'Everything in Essential',
        'Test automation setup',
        'Performance testing',
        'Security assessment',
        'API testing',
        'Regression test suite',
        '90-day support',
      ],
      bestFor: 'Enterprise applications',
      recommended: true,
    },
    {
      name: 'Continuous QA',
      price: '$5,000',
      duration: '/month',
      description: 'Ongoing testing partnership for continuous delivery',
      features: [
        'Dedicated QA team',
        'Full test automation',
        'CI/CD integration',
        'Performance monitoring',
        'Security scanning',
        'Weekly reporting',
        'Unlimited testing',
      ],
      bestFor: 'Agile teams, SaaS products',
    },
  ];

  return (
    <>
      <JsonLd data={serviceSchema} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10" />
          <div className="relative container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="mb-4 bg-orange-600 text-white">Zero Defects Goal</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Quality Assurance & Testing
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Ship with confidence. Our comprehensive QA services ensure your software 
                performs flawlessly, delights users, and stands up to real-world demands.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                    Get QA Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#process">
                  <Button size="lg" variant="outline">
                    View Our Process
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quality Metrics */}
        <section className="py-16 bg-white dark:bg-slate-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {qualityMetrics.map((metric, index) => (
                <motion.div
                  key={metric.metric}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - metric.value / 100)}`}
                        className="text-orange-600 transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metric.value}{metric.unit}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{metric.metric}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testing Services */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Comprehensive Testing Services
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Multi-layered testing approach to ensure quality at every level
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {testingServices.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center text-white mb-4">
                        {service.icon}
                      </div>
                      <CardTitle className="text-2xl">{service.title}</CardTitle>
                      <CardDescription className="text-base">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {service.coverage.map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testing Process */}
        <section id="process" className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Our QA Process
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Systematic approach to delivering bug-free software
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              {testingProcess.map((phase, index) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="mb-12 last:mb-0"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {phase.phase}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {phase.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {phase.activities.map((activity) => (
                          <Badge key={activity} variant="secondary">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {index < testingProcess.length - 1 && (
                    <div className="ml-6 mt-6 mb-6 w-0.5 h-12 bg-gradient-to-b from-orange-600 to-red-600" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools & Technologies */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Testing Tools & Technologies
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Industry-leading tools for comprehensive quality assurance
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
              {[
                'Selenium', 'Cypress', 'Jest', 'Postman', 'JMeter', 'LoadRunner',
                'Appium', 'TestRail', 'BrowserStack', 'Jenkins', 'OWASP ZAP', 'Burp Suite'
              ].map((tool, index) => (
                <motion.div
                  key={tool}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <Bug className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{tool}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                QA Service Packages
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Flexible testing solutions for every project size and budget
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative ${pkg.recommended ? 'md:-mt-4' : ''}`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-orange-600 text-white">Recommended</Badge>
                    </div>
                  )}
                  <Card className={`h-full ${pkg.recommended ? 'border-orange-600 shadow-xl' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {pkg.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">{pkg.duration}</span>
                      </div>
                      <CardDescription className="mt-4">
                        {pkg.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {pkg.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <strong>Best for:</strong> {pkg.bestFor}
                      </div>
                      <Button 
                        className={`w-full ${
                          pkg.recommended 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : ''
                        }`}
                        variant={pkg.recommended ? 'default' : 'outline'}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-white text-orange-600">Free Assessment</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Stop Shipping Bugs. Start Shipping Excellence.
              </h2>
              <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                Get a free quality assessment and discover how we can improve your 
                software quality while reducing testing time and costs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                    <Shield className="mr-2 h-5 w-5" />
                    Get Free Assessment
                  </Button>
                </Link>
                <Link href="/case-studies">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
                    View QA Success Stories
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-sm text-orange-100">
                🐛 98% bug detection rate • ⚡ 50% faster testing • 🛡️ Zero critical defects
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
