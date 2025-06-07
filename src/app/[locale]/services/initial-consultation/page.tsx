import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Clock, Users, TrendingUp, MessageSquare, 
  FileText, Target, ArrowRight, Calendar, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { generateMetadata as generateSEOMetadata } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/SEOHead';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Initial Business Consultation - $550',
  description: 'Transform your business with our comprehensive consultation service. Get expert insights, strategic recommendations, and a clear roadmap for success.',
  keywords: ['business consultation', 'strategic planning', 'business analysis', 'expert advice', 'Brisbane consultant'],
  url: 'https://unitegroup.com.au/services/initial-consultation',
});

export default function InitialConsultationPage() {
  const serviceSchema = generateServiceSchema({
    name: 'Initial Business Consultation',
    description: 'Comprehensive business consultation service providing strategic insights and actionable recommendations',
    price: '550',
    serviceType: 'Business Consulting',
  });

  const processSteps = [
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'Discovery Call',
      description: '30-minute preliminary discussion to understand your business needs and objectives',
      duration: '30 mins'
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Business Analysis',
      description: 'In-depth analysis of your current business model, challenges, and opportunities',
      duration: '2 hours'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Strategy Session',
      description: 'Interactive workshop with key stakeholders to develop strategic recommendations',
      duration: '3 hours'
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Action Plan Delivery',
      description: 'Comprehensive report with prioritized recommendations and implementation roadmap',
      duration: '1 week'
    }
  ];

  const deliverables = [
    'Executive Summary Report',
    'SWOT Analysis',
    'Market Opportunity Assessment',
    'Technology Stack Recommendations',
    'Growth Strategy Blueprint',
    '90-Day Action Plan',
    'KPI Framework',
    'Budget Projections',
    'Risk Assessment Matrix',
    'Follow-up Support (30 days)'
  ];

  const industries = [
    'Healthcare & Medical',
    'Financial Services',
    'E-commerce & Retail',
    'Education & Training',
    'Manufacturing & Logistics',
    'Technology & SaaS',
    'Professional Services',
    'Real Estate'
  ];

  return (
    <>
      <JsonLd data={serviceSchema} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="relative container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="mb-4 bg-blue-600 text-white">Most Popular Service</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Initial Business Consultation
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Transform your business vision into reality with our comprehensive consultation service. 
                Get expert insights, strategic recommendations, and a clear roadmap for success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/book-consultation">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Book Your Consultation - $550
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Have Questions? Contact Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 bg-white dark:bg-slate-800">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="h-full border-t-4 border-t-blue-600">
                  <CardHeader>
                    <Clock className="h-10 w-10 text-blue-600 mb-4" />
                    <CardTitle>Fast Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">
                      Get actionable insights and recommendations within one week of your consultation.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="h-full border-t-4 border-t-green-600">
                  <CardHeader>
                    <TrendingUp className="h-10 w-10 text-green-600 mb-4" />
                    <CardTitle>ROI Focused</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">
                      Average client sees 300% ROI within 6 months of implementing our recommendations.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="h-full border-t-4 border-t-purple-600">
                  <CardHeader>
                    <Shield className="h-10 w-10 text-purple-600 mb-4" />
                    <CardTitle>Risk-Free</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">
                      100% satisfaction guarantee. If you&apos;re not completely satisfied, we&apos;ll refund your investment.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Process Section */}
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
                Our Proven Process
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                A structured approach to understanding your business and delivering transformative insights
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="mb-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white">
                        {step.icon}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Step {index + 1}: {step.title}
                        </h3>
                        <Badge variant="secondary">{step.duration}</Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="ml-8 mt-4 mb-4 h-8 w-0.5 bg-gradient-to-b from-blue-600 to-purple-600" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Deliverables */}
        <section className="py-16 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                What You&apos;ll Receive
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Comprehensive deliverables designed to drive immediate action and long-term success
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-4">
                {deliverables.map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Industries */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Industry Expertise
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Specialized knowledge across diverse industries
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3">
              {industries.map((industry, index) => (
                <motion.div
                  key={industry}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Badge 
                    variant="outline" 
                    className="px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors cursor-default"
                  >
                    {industry}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join 500+ businesses that have accelerated their growth with our strategic consultation
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/book-consultation">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                    <Calendar className="mr-2 h-5 w-5" />
                    Schedule Your Consultation
                  </Button>
                </Link>
                <Link href="/case-studies">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                    View Success Stories
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-sm text-blue-100">
                ⚡ Limited slots available this month • 💰 100% Money-back guarantee
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
