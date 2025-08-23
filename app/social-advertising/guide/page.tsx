import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, BookOpen, BarChart3, Megaphone } from 'lucide-react';
import AuthorInfo, { AUTHORS } from '@/components/AuthorInfo';

export const metadata: Metadata = {
  title: 'Social Advertising Guide | Unite Group',
  description: 'Master social media advertising with our comprehensive guide. Learn strategies for Facebook, Instagram, LinkedIn, and more.',
  keywords: 'social advertising guide, facebook ads, instagram marketing, linkedin advertising, social media ROI',
};

export default function SocialAdvertisingGuidePage() {
  const guideSteps = [
    {
      step: 1,
      title: 'Platform Selection',
      description: 'Choose the right social platforms based on your audience and objectives.',
      topics: [
        'Platform demographics analysis',
        'Audience behavior patterns',
        'Content format preferences',
        'Business objective alignment'
      ]
    },
    {
      step: 2,
      title: 'Audience Targeting',
      description: 'Master advanced targeting techniques to reach your ideal customers.',
      topics: [
        'Custom audience creation',
        'Lookalike audience strategies',
        'Interest and behavior targeting',
        'Demographic segmentation'
      ]
    },
    {
      step: 3,
      title: 'Creative Development',
      description: 'Create compelling ad creative that drives engagement and conversions.',
      topics: [
        'Visual storytelling principles',
        'Video content optimization',
        'Copy writing best practices',
        'A/B testing strategies'
      ]
    },
    {
      step: 4,
      title: 'Campaign Optimization',
      description: 'Continuously improve performance through data-driven optimization.',
      topics: [
        'Bid strategy selection',
        'Budget allocation methods',
        'Performance monitoring',
        'Conversion tracking setup'
      ]
    },
    {
      step: 5,
      title: 'ROI Measurement',
      description: 'Track and measure return on investment across all campaigns.',
      topics: [
        'Attribution modeling',
        'Conversion value tracking',
        'Lifetime value calculation',
        'ROAS optimization'
      ]
    }
  ];

  const platforms = [
    {
      name: 'Facebook Ads',
      description: 'Largest user base with sophisticated targeting options',
      strengths: ['Detailed demographics', 'Interest targeting', 'Custom audiences'],
      bestFor: 'B2C brands, local businesses, e-commerce'
    },
    {
      name: 'Instagram Ads',
      description: 'Visual-first platform perfect for lifestyle brands',
      strengths: ['Visual storytelling', 'Young demographics', 'Shopping integration'],
      bestFor: 'Fashion, food, lifestyle, visual products'
    },
    {
      name: 'LinkedIn Ads',
      description: 'Professional network ideal for B2B marketing',
      strengths: ['Professional targeting', 'Industry focus', 'Lead generation'],
      bestFor: 'B2B services, recruitment, professional development'
    },
    {
      name: 'TikTok Ads',
      description: 'Fast-growing platform with engaged younger audience',
      strengths: ['High engagement', 'Creative formats', 'Viral potential'],
      bestFor: 'Gen Z brands, entertainment, trendy products'
    }
  ];

  const adFormats = [
    { name: 'Image Ads', description: 'Single image with compelling copy' },
    { name: 'Video Ads', description: 'Engaging video content up to 60 seconds' },
    { name: 'Carousel Ads', description: 'Multiple images or videos in one ad' },
    { name: 'Collection Ads', description: 'Showcase multiple products' },
    { name: 'Story Ads', description: 'Full-screen immersive experiences' },
    { name: 'Reels Ads', description: 'Short-form vertical video content' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Megaphone className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Social Advertising Mastery Guide
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Learn how to create, optimize, and scale profitable social media advertising campaigns 
            across all major platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=social-advertising"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              Get Expert Help
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href={"/downloads/social-advertising-guide-2025.pdf" as any}
              className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Download Guide PDF
            </Link>
          </div>
        </div>
      </section>

      {/* Author Info */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <AuthorInfo 
            author={AUTHORS.sarahMitchell} 
            publishDate="January 5, 2025"
            readTime="12"
          />
        </div>
      </section>

      {/* Guide Steps */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            5-Step Social Advertising Framework
          </h2>
          <div className="space-y-8">
            {guideSteps.map((step) => (
              <div key={step.step} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-6 flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {step.topics.map((topic, index) => (
                        <div key={index} className="flex items-start text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {topic}
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

      {/* Platform Comparison */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Platform Comparison Guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {platforms.map((platform, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{platform.name}</h3>
                <p className="text-gray-600 mb-4">{platform.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Strengths:</h4>
                  <ul className="space-y-1">
                    {platform.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Best for:</strong> {platform.bestFor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Formats */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Ad Format Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adFormats.map((format, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900 mb-2">{format.name}</h3>
                <p className="text-sm text-gray-600">{format.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Essential Metrics to Track
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">CTR</div>
              <h3 className="text-lg font-semibold mb-2">Click-Through Rate</h3>
              <p className="text-blue-100 text-sm">
                Measures ad relevance and audience engagement
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">CPM</div>
              <h3 className="text-lg font-semibold mb-2">Cost Per Mille</h3>
              <p className="text-blue-100 text-sm">
                Shows efficiency of reaching your target audience
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">CPA</div>
              <h3 className="text-lg font-semibold mb-2">Cost Per Acquisition</h3>
              <p className="text-blue-100 text-sm">
                Tracks the cost to acquire each customer
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">ROAS</div>
              <h3 className="text-lg font-semibold mb-2">Return on Ad Spend</h3>
              <p className="text-blue-100 text-sm">
                Measures revenue generated per dollar spent
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Strategies */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Advanced Optimization Strategies
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Audience Layering</h3>
              <p className="text-gray-600 mb-3">
                Combine multiple targeting criteria to create highly specific audience segments for better relevance and lower costs.
              </p>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Example: Target "Business Owners" + "Technology Interests" + "Marketing Tools Users" for B2B software ads
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Creative Rotation</h3>
              <p className="text-gray-600 mb-3">
                Prevent ad fatigue by regularly rotating creative assets and testing new variations to maintain performance.
              </p>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Best Practice: Refresh creatives every 7-14 days or when frequency exceeds 3x
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Dynamic Remarketing</h3>
              <p className="text-gray-600 mb-3">
                Show personalized ads featuring products or services users previously viewed on your website.
              </p>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Impact: Remarketing campaigns typically achieve 2-3x higher conversion rates
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Scale Your Social Advertising?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get expert help implementing these strategies and maximizing your ROI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?service=social-advertising"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              Schedule Consultation
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/social-advertising"
              className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              View Our Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}