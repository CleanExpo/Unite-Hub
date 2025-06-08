import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, BookOpen, Users, Award, Video, FileText,
  ArrowRight, CheckCircle, Star, Calendar, Laptop, Trophy, Briefcase
} from 'lucide-react';
import { generateMetadata as generateSEOMetadata } from '@/components/seo/SEOHead';
import { JsonLd } from '@/components/seo/SEOHead';
import { generateServiceSchema } from '@/lib/seo/schema';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Expert Education & Training Services - Powered by CARSI',
  description: 'Transform your team with expert-led training powered by CARSI. IICRC certifications, corporate workshops, technical training, and custom learning programs designed for measurable skill advancement.',
  keywords: ['corporate training', 'expert education', 'IICRC certification', 'CARSI training', 'technical workshops', 'professional development', 'team training', 'Brisbane training'],
  url: 'https://unitegroup.com.au/services/expert-education',
});

export default function ExpertEducationPage() {
  const serviceSchema = generateServiceSchema({
    name: 'Expert Education Services - Powered by CARSI',
    description: 'Professional training and education services powered by CARSI. IICRC certifications, corporate workshops, and custom learning programs',
    serviceType: 'Educational Services',
  });

  const trainingPrograms = [
    {
      icon: <Award className="h-8 w-8" />,
      title: 'IICRC Certifications',
      description: 'Industry-leading restoration certifications through CARSI',
      topics: [
        'Water Damage Restoration (WRT)',
        'Applied Structural Drying (ASD)',
        'Fire & Smoke Restoration (FSRT)',
        'Mold Remediation (AMRT)',
        'Carpet Cleaning (CCT)',
        'Odor Control (OCT)',
      ],
      featured: true,
    },
    {
      icon: <Laptop className="h-8 w-8" />,
      title: 'Technical Training',
      description: 'Master cutting-edge technologies with hands-on workshops',
      topics: [
        'Modern Web Development',
        'Cloud Architecture (AWS/Azure)',
        'DevOps & CI/CD',
        'AI & Machine Learning',
        'Cybersecurity Fundamentals',
        'Database Design & Optimization',
      ],
    },
    {
      icon: <Briefcase className="h-8 w-8" />,
      title: 'Corporate Programs',
      description: 'Custom training solutions aligned with your business goals',
      topics: [
        'Leadership Development',
        'Change Management',
        'Digital Transformation',
        'Innovation Workshops',
        'Team Performance',
        'Strategic Planning',
      ],
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Industry Training',
      description: 'Specialized programs for specific industry needs',
      topics: [
        'Construction Safety',
        'Healthcare Compliance',
        'Financial Services',
        'Manufacturing Excellence',
        'Retail Management',
        'Hospitality Standards',
      ],
    },
  ];

  const deliveryFormats = [
    {
      format: 'On-site Workshops',
      duration: '1-5 days',
      participants: 'Up to 30',
      features: ['Hands-on labs', 'Interactive sessions', 'Team exercises', 'Q&A sessions'],
    },
    {
      format: 'Virtual Training',
      duration: 'Flexible',
      participants: 'Unlimited',
      features: ['Live instruction', 'Screen sharing', 'Breakout rooms', 'Recording available'],
    },
    {
      format: 'Hybrid Programs',
      duration: '2-12 weeks',
      participants: 'Customizable',
      features: ['Self-paced + live sessions', 'Mentorship', 'Project work', 'Certification'],
    },
  ];

  const outcomes = [
    { metric: 'Skill Improvement', value: '87%', description: 'Average skill advancement' },
    { metric: 'Knowledge Retention', value: '92%', description: 'After 6 months' },
    { metric: 'ROI on Training', value: '340%', description: 'Within first year' },
    { metric: 'Employee Satisfaction', value: '95%', description: 'Training rating' },
  ];

  const packages = [
    {
      name: 'Workshop Days',
      price: '$165',
      duration: '/day/person',
      description: 'Single-day intensive workshop for your team',
      features: [
        'Expert-led instruction',
        'Custom curriculum',
        'Hands-on exercises',
        'Digital materials',
        'Completion certificates',
        'Follow-up resources',
      ],
      ideal: 'Quick skill boost',
    },
    {
      name: 'Learning Program - CARSI Membership',
      price: 'Tiered',
      duration: '',
      description: 'Comprehensive learning journey with ongoing support',
      features: [
        'Free Library - Access to basic resources',
        'Foundation Membership - $44/month',
        'Growth Membership - $99/month',
        'Weekly sessions',
        'Personal mentoring',
        'Project assignments',
        'Progress tracking',
        'Certification prep',
      ],
      ideal: 'Deep skill development',
      recommended: true,
      tiers: [
        { name: 'Free Library', price: 'Free', description: 'Basic resources and guides' },
        { name: 'Foundation', price: '$44/mo', description: 'Core training modules' },
        { name: 'Growth', price: '$99/mo', description: 'Full access with mentoring' },
      ]
    },
    {
      name: 'Enterprise Academy',
      price: 'Coming Soon',
      duration: '',
      description: 'Build a culture of continuous learning',
      features: [
        'Unlimited participants',
        'Custom learning paths',
        'Leadership programs',
        'Technical bootcamps',
        'Learning portal',
        'Quarterly reviews',
        'Executive briefings',
      ],
      ideal: 'Organization-wide transformation',
      comingSoon: true,
    },
  ];

  return (
    <>
      <JsonLd data={serviceSchema} />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-cyan-600/10" />
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-teal-600 text-white">Powered by CARSI</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Expert Education & Training Services
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                Unite Group partners with CARSI to deliver world-class training and certifications. 
                From IICRC restoration certifications to corporate leadership programs, we provide 
                comprehensive education solutions that transform teams and drive business growth.
              </p>
              <div className="flex items-center justify-center gap-4 mb-8">
                <Badge variant="outline" className="text-sm">
                  <Trophy className="h-4 w-4 mr-1" />
                  IICRC Approved School
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Award className="h-4 w-4 mr-1" />
                  500+ Certifications Issued
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Users className="h-4 w-4 mr-1" />
                  10,000+ Professionals Trained
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="https://carsi.au" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                    View Full CARSI Catalog
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline">
                    Design Custom Program
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="py-16 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {outcomes.map((outcome, index) => (
                <div
                  key={outcome.metric}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                    {outcome.value}
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">{outcome.metric}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{outcome.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Training Programs */}
        <section id="programs" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Training Programs
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Comprehensive programs designed for immediate impact and lasting transformation
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {trainingPrograms.map((program, index) => (
                <div key={program.title}>
                  <Card className={`h-full hover:shadow-xl transition-shadow ${program.featured ? 'border-2 border-teal-600' : ''}`}>
                    <CardHeader>
                      {program.featured && (
                        <Badge className="w-fit mb-2 bg-teal-600 text-white">Featured Partnership</Badge>
                      )}
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center text-white mb-4">
                        {program.icon}
                      </div>
                      <CardTitle className="text-2xl">{program.title}</CardTitle>
                      <CardDescription className="text-base">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {program.topics.map((topic) => (
                          <div key={topic} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Delivery Formats */}
        <section className="py-20 bg-gray-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Flexible Delivery Options
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Choose the format that works best for your team and schedule
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {deliveryFormats.map((format, index) => (
                <div
                  key={format.format}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {format.format}
                  </h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{format.duration}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Participants:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{format.participants}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {format.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Training Packages
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Investment in your team&apos;s future starts here
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {packages.map((pkg, index) => (
                <div
                  key={pkg.name}
                  className={`relative ${pkg.recommended ? 'md:-mt-4' : ''}`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-teal-600 text-white">Most Popular</Badge>
                    </div>
                  )}
                  {pkg.comingSoon && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-orange-600 text-white">Coming Soon</Badge>
                    </div>
                  )}
                  <Card className={`h-full ${pkg.recommended ? 'border-teal-600 shadow-xl' : ''} ${pkg.comingSoon ? 'opacity-75' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <div className="mt-4">
                        {pkg.tiers ? (
                          <div className="space-y-2">
                            {pkg.tiers.map((tier) => (
                              <div key={tier.name} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded">
                                <span className="text-sm font-medium">{tier.name}</span>
                                <span className="text-lg font-bold text-teal-600">{tier.price}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">
                              {pkg.price}
                            </span>
                            {pkg.duration && (
                              <span className="text-gray-600 dark:text-gray-400">{pkg.duration}</span>
                            )}
                          </>
                        )}
                      </div>
                      <CardDescription className="mt-4">
                        {pkg.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!pkg.tiers && (
                        <ul className="space-y-3 mb-6">
                          {pkg.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {pkg.tiers && (
                        <div className="space-y-4 mb-6">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Includes:</div>
                          <ul className="space-y-2">
                            {pkg.features.filter(f => !f.includes('$')).map((feature) => (
                              <li key={feature} className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <strong>Ideal for:</strong> {pkg.ideal}
                      </div>
                      <Button 
                        className={`w-full ${
                          pkg.recommended 
                            ? 'bg-teal-600 hover:bg-teal-700' 
                            : ''
                        }`}
                        variant={pkg.recommended ? 'default' : 'outline'}
                        disabled={pkg.comingSoon}
                      >
                        {pkg.comingSoon ? 'Coming Soon' : 'Get Started'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
          <div className="container mx-auto px-4 text-center">
            <div>
              <Badge className="mb-4 bg-white text-teal-600">Limited Availability</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Invest in Your Team&apos;s Future Today
              </h2>
              <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
                Join 500+ companies that have transformed their teams through our expert-led 
                training programs. Start your learning journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
                    <Calendar className="mr-2 h-5 w-5" />
                    Schedule Training
                  </Button>
                </Link>
                <Link href="/download-catalog">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
                    Download Course Catalog
                  </Button>
                </Link>
              </div>
              <p className="mt-8 text-sm text-teal-100">
                🎓 Expert instructors • 📈 Measurable results • 🏆 Certification available
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
