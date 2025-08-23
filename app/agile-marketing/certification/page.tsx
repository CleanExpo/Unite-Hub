import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, GraduationCap, Clock, Users, Trophy } from 'lucide-react';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = {
  title: 'Agile Marketing Certification | Unite Group',
  description: 'Get certified in Agile Marketing methodologies. Comprehensive training program covering Scrum, Kanban, and Sprint planning for marketing teams.',
  keywords: 'agile marketing certification, scrum marketing training, marketing team certification, agile methodology training',
};

export default function AgileMarketingCertificationPage() {
  const certificationLevels = [
    {
      level: 'Foundation',
      duration: '2 days',
      price: '$1,299',
      description: 'Introduction to Agile Marketing principles and basic methodologies',
      topics: [
        'Agile Marketing Manifesto',
        'Scrum fundamentals for marketing',
        'Sprint planning basics',
        'Team collaboration techniques',
        'Measurement and retrospectives'
      ],
      outcome: 'Certified Agile Marketing Practitioner (CAMP)'
    },
    {
      level: 'Advanced',
      duration: '3 days',
      price: '$1,899',
      description: 'Advanced techniques for scaling Agile across marketing organizations',
      topics: [
        'Advanced Scrum practices',
        'Kanban implementation',
        'Cross-functional team management',
        'Agile marketing metrics',
        'Leadership in Agile environments',
        'Change management strategies'
      ],
      outcome: 'Certified Agile Marketing Professional (CAMP-P)'
    },
    {
      level: 'Master',
      duration: '5 days',
      price: '$2,899',
      description: 'Expert-level training for Agile Marketing coaches and leaders',
      topics: [
        'Agile transformation leadership',
        'Team coaching techniques',
        'Advanced facilitation skills',
        'Organizational design',
        'Scaling frameworks (SAFe, LeSS)',
        'Training delivery methods'
      ],
      outcome: 'Certified Agile Marketing Coach (CAMC)'
    }
  ];

  const trainingModules = [
    {
      module: 1,
      title: 'Agile Marketing Foundations',
      duration: '4 hours',
      content: [
        'History and evolution of Agile Marketing',
        'Agile Marketing Manifesto deep dive',
        'Traditional vs Agile marketing comparison',
        'ROI and efficiency benefits'
      ]
    },
    {
      module: 2,
      title: 'Scrum for Marketing Teams',
      duration: '6 hours',
      content: [
        'Scrum roles in marketing context',
        'Sprint planning for campaigns',
        'Daily standups and team coordination',
        'Sprint reviews and retrospectives'
      ]
    },
    {
      module: 3,
      title: 'Kanban Implementation',
      duration: '4 hours',
      content: [
        'Kanban board setup for marketing',
        'Work-in-progress (WIP) limits',
        'Continuous flow optimization',
        'Metrics and improvement cycles'
      ]
    },
    {
      module: 4,
      title: 'Agile Marketing Metrics',
      duration: '4 hours',
      content: [
        'Sprint velocity tracking',
        'Marketing performance metrics',
        'Continuous improvement indicators',
        'ROI measurement frameworks'
      ]
    },
    {
      module: 5,
      title: 'Team Leadership & Coaching',
      duration: '6 hours',
      content: [
        'Servant leadership principles',
        'Team facilitation techniques',
        'Conflict resolution in Agile teams',
        'Coaching for continuous improvement'
      ]
    }
  ];

  const benefits = [
    {
      icon: Trophy,
      title: 'Industry Recognition',
      description: 'Earn internationally recognized certifications that validate your expertise in Agile Marketing methodologies.'
    },
    {
      icon: Users,
      title: 'Team Performance',
      description: 'Learn to lead high-performing marketing teams with improved collaboration and faster delivery cycles.'
    },
    {
      icon: Clock,
      title: 'Increased Efficiency',
      description: 'Implement proven frameworks that reduce waste and increase marketing campaign effectiveness by 40%.'
    },
    {
      icon: Check,
      title: 'Career Advancement',
      description: 'Position yourself as a leader in modern marketing practices and advance your career opportunities.'
    }
  ];

  const upcomingDates = [
    { date: 'March 15-16, 2025', level: 'Foundation', location: 'Brisbane' },
    { date: 'March 22-24, 2025', level: 'Advanced', location: 'Sydney' },
    { date: 'April 5-9, 2025', level: 'Master', location: 'Melbourne' },
    { date: 'April 19-20, 2025', level: 'Foundation', location: 'Online' },
    { date: 'May 3-5, 2025', level: 'Advanced', location: 'Brisbane' },
    { date: 'May 17-21, 2025', level: 'Master', location: 'Online' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <GraduationCap className="w-16 h-16 text-purple-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Agile Marketing Certification
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Become a certified Agile Marketing professional. Master Scrum, Kanban, and Sprint 
            methodologies to transform your marketing organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=agile-certification"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center"
            >
              Enroll Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href={"/downloads/certification-program-details.pdf" as any}
              className="border border-purple-600 text-purple-600 px-8 py-4 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Download Brochure
            </Link>
          </div>
        </div>
      </section>

      {/* Author Info */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AuthorInfo 
            author={AUTHORS.sarahMitchell} 
            publishDate="January 12, 2025"
            readTime="6"
          />
        </div>
      </section>

      {/* Certification Levels */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Certification Levels
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {certificationLevels.map((cert, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{cert.level}</h3>
                  <div className="text-3xl font-bold text-purple-600 mb-2">{cert.price}</div>
                  <div className="text-gray-600 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {cert.duration}
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{cert.description}</p>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Topics Covered:</h4>
                  <ul className="space-y-2">
                    {cert.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-purple-800 mb-2">Certification:</h4>
                  <p className="text-purple-700 text-sm">{cert.outcome}</p>
                </div>
                
                <Link
                  href={`/contact?service=agile-certification-${cert.level.toLowerCase()}`}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors text-center block"
                >
                  Enroll in {cert.level}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Modules */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Training Curriculum
          </h2>
          <div className="space-y-6">
            {trainingModules.map((module) => (
              <div key={module.module} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-6 flex-shrink-0">
                    {module.module}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{module.title}</h3>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {module.duration}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {module.content.map((item, index) => (
                        <div key={index} className="flex items-start text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Get Certified?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start">
                <benefit.icon className="w-8 h-8 text-purple-600 mr-4 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Dates */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Upcoming Training Dates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingDates.map((training, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{training.level} Level</h3>
                  <p className="text-purple-600 font-semibold mb-2">{training.date}</p>
                  <p className="text-gray-600 mb-4">{training.location}</p>
                  <Link
                    href={`/contact?service=agile-certification-${training.level.toLowerCase()}&date=${encodeURIComponent(training.date)}`}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-center block text-sm"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prerequisites & Requirements */}
      <section className="py-16 px-4 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Prerequisites & Requirements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Foundation Level</h3>
              <ul className="text-purple-100 space-y-2">
                <li>• Marketing experience (1+ years)</li>
                <li>• Basic project management knowledge</li>
                <li>• Team collaboration experience</li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Advanced Level</h3>
              <ul className="text-purple-100 space-y-2">
                <li>• Foundation certification or equivalent</li>
                <li>• Marketing leadership experience</li>
                <li>• Team management background</li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Master Level</h3>
              <ul className="text-purple-100 space-y-2">
                <li>• Advanced certification</li>
                <li>• 3+ years Agile experience</li>
                <li>• Training or coaching background</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of marketing professionals who have already transformed their careers with our certification program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=agile-certification"
              className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center"
            >
              Enroll Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/agile-marketing/team-training"
              className="border border-purple-600 text-purple-600 px-8 py-4 rounded-lg hover:bg-purple-50 transition-colors"
            >
              View Team Training
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}