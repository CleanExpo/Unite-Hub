import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  BookOpen, 
  Users, 
  Target, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  Award as Certificate,
  Video,
  FileText
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Expert Education & Training | Unite Group',
  description: 'Elevate your team with our comprehensive education and training programs. Professional development, skill enhancement, and certification courses.',
  keywords: 'professional training, skill development, certification programs, corporate education, team training',
};

const trainingPrograms = [
  {
    icon: <Award className="h-8 w-8" />,
    title: 'Leadership Development',
    description: 'Comprehensive leadership training programs for managers and executives.',
    duration: '8 weeks',
    format: 'Hybrid',
    features: [
      'Executive coaching sessions',
      'Leadership assessment tools',
      'Team management strategies',
      'Performance optimization techniques'
    ]
  },
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: 'Technical Skills Training',
    description: 'Advanced technical training in cutting-edge technologies and methodologies.',
    duration: '12 weeks',
    format: 'Online',
    features: [
      'Hands-on coding workshops',
      'Industry best practices',
      'Project-based learning',
      'Certification preparation'
    ]
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Team Collaboration',
    description: 'Enhance team dynamics and collaboration through proven methodologies.',
    duration: '6 weeks',
    format: 'In-person',
    features: [
      'Team building exercises',
      'Communication workshops',
      'Conflict resolution training',
      'Agile methodology training'
    ]
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: 'Strategic Planning',
    description: 'Learn strategic thinking and planning methodologies for business success.',
    duration: '10 weeks',
    format: 'Hybrid',
    features: [
      'Strategic framework development',
      'Market analysis techniques',
      'Goal setting and KPI tracking',
      'Implementation planning'
    ]
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Digital Transformation',
    description: 'Navigate digital transformation with comprehensive training programs.',
    duration: '14 weeks',
    format: 'Online',
    features: [
      'Digital strategy development',
      'Technology adoption frameworks',
      'Change management processes',
      'Digital culture building'
    ]
  },
  {
    icon: <Certificate className="h-8 w-8" />,
    title: 'Professional Certification',
    description: 'Industry-recognized certification programs to advance your career.',
    duration: '16 weeks',
    format: 'Self-paced',
    features: [
      'Comprehensive curriculum',
      'Expert instructor support',
      'Practice examinations',
      'Career placement assistance'
    ]
  }
];

const learningFormats = [
  {
    icon: <Video className="h-6 w-6" />,
    title: 'Live Virtual Sessions',
    description: 'Interactive online classes with real-time instructor feedback'
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'In-Person Workshops',
    description: 'Hands-on training sessions at our state-of-the-art facilities'
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Self-Paced Learning',
    description: 'Flexible online modules you can complete at your own pace'
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: 'Blended Programs',
    description: 'Combination of online and in-person training for optimal learning'
  }
];

const benefits = [
  {
    title: 'Expert Instructors',
    description: 'Learn from industry experts with years of practical experience and proven track records.'
  },
  {
    title: 'Practical Application',
    description: 'Apply your learning immediately with real-world projects and case studies.'
  },
  {
    title: 'Flexible Scheduling',
    description: 'Choose from various formats and schedules that fit your busy professional life.'
  },
  {
    title: 'Certification & Recognition',
    description: 'Earn industry-recognized certifications that enhance your professional credentials.'
  },
  {
    title: 'Ongoing Support',
    description: 'Access to mentorship, resources, and community support throughout your learning journey.'
  },
  {
    title: 'Career Advancement',
    description: 'Gain skills and knowledge that directly contribute to your career growth and opportunities.'
  }
];

const testimonials = [
  {
    name: 'Jennifer Martinez',
    role: 'Senior Manager, Global Tech',
    content: 'The leadership development program transformed my management approach and helped me advance to a senior role.',
    rating: 5,
    program: 'Leadership Development'
  },
  {
    name: 'Robert Kim',
    role: 'Software Engineer, StartupCorp',
    content: 'The technical training was comprehensive and practical. I gained skills that I use daily in my current role.',
    rating: 5,
    program: 'Technical Skills Training'
  },
  {
    name: 'Amanda Thompson',
    role: 'Project Manager, Enterprise Solutions',
    content: 'The strategic planning course gave me the tools to lead successful projects and drive business results.',
    rating: 5,
    program: 'Strategic Planning'
  }
];

const stats = [
  { number: '10,000+', label: 'Professionals Trained' },
  { number: '95%', label: 'Completion Rate' },
  { number: '4.8/5', label: 'Average Rating' },
  { number: '85%', label: 'Career Advancement' }
];

export default function ExpertEducationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-purple-100 text-purple-800">
            Professional Education
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Elevate Your Skills with
            <span className="text-purple-600"> Expert Education</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your career with our comprehensive training programs. Learn from industry experts, 
            gain practical skills, and earn certifications that advance your professional journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Explore Programs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              Schedule Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Programs */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Training Programs
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive education programs designed to enhance your skills and advance your career.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trainingPrograms.map((program, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                    {program.icon}
                  </div>
                  <CardTitle className="text-xl">{program.title}</CardTitle>
                  <CardDescription>{program.description}</CardDescription>
                  
                  <div className="flex gap-2 mt-4">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {program.duration}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {program.format}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {program.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Formats */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Flexible Learning Formats
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the learning format that best fits your schedule and learning style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {learningFormats.map((format, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-purple-600">
                    {format.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {format.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {format.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Education Programs
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the advantages of learning with industry-leading education programs.
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
              Success Stories
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hear from professionals who have transformed their careers through our programs.
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
                  <Badge variant="outline" className="text-xs">
                    {testimonial.program}
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
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Advance Your Career?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of professionals who have transformed their careers with our expert education programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Browse All Programs
                  <BookOpen className="ml-2 h-5 w-5" />
                </Button>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-purple-600">
                    Get Started Today
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
