"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Star,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  TrendingUp,
  Users,
  Shield,
  CheckCircle,
  XCircle,
  ArrowRight,
  Phone,
  Mail,
  Smartphone
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function ReviewManagement() {
  const reviewPlatforms = [
    {
      platform: "Google Reviews",
      importance: "Critical",
      impact: "65% of customers check",
      targetRating: "4.7+",
      targetQuantity: "50+ reviews",
      responseTime: "< 24 hours"
    },
    {
      platform: "Facebook Reviews",
      importance: "High",
      impact: "35% of customers check",
      targetRating: "4.5+",
      targetQuantity: "20+ reviews",
      responseTime: "< 48 hours"
    },
    {
      platform: "ProductReview.com.au",
      importance: "Medium",
      impact: "SEO value high",
      targetRating: "4.5+",
      targetQuantity: "15+ reviews",
      responseTime: "< 72 hours"
    },
    {
      platform: "HiPages",
      importance: "Medium",
      impact: "Trade-specific",
      targetRating: "4.5+",
      targetQuantity: "10+ reviews",
      responseTime: "< 72 hours"
    }
  ];

  const reviewGeneration = {
    timing: [
      { when: "Job completion", method: "In-person ask", success: "35%" },
      { when: "Same day", method: "SMS with link", success: "25%" },
      { when: "Day 3", method: "Email follow-up", success: "15%" },
      { when: "Day 7", method: "Final reminder", success: "10%" }
    ],
    scripts: {
      inPerson: "If you're happy with our work, would you mind sharing your experience on Google? It really helps our small business.",
      sms: "Hi [Name], thanks for choosing us! If you have 30 seconds, we'd love a quick review: [link]",
      email: "Your feedback helps other Brisbane locals find quality tradies. Mind leaving a quick review?"
    },
    incentives: [
      "Monthly draw for $100 voucher",
      "10% off next service",
      "Priority booking status",
      "Charity donation per review"
    ]
  };

  const responseTemplates = {
    fiveStar: `Thank you so much for the 5-star review, [Name]! We're thrilled you had a great experience. 
    
Your support means everything to our local family business. We look forward to helping you again!

[Your name], [Business name]`,
    
    fourStar: `Thanks for the positive feedback, [Name]! We appreciate the 4 stars.

If there's anything we could have done better, please let us know at [email] - we're always looking to improve.

Thanks again for choosing us!`,
    
    negative: `Hi [Name], thank you for your feedback. We're sorry to hear about your experience.

We'd like to make this right. Please contact me directly at [phone] or [email] so we can resolve this immediately.

[Your name], Owner`
  };

  const damageControl = [
    {
      situation: "Unfair 1-star review",
      action: "Respond publicly with empathy, offer to resolve offline",
      doNot: "Never argue or get defensive",
      example: "Professional response showing you care"
    },
    {
      situation: "Fake/competitor review",
      action: "Flag to Google with evidence",
      doNot: "Don't accuse publicly",
      example: "Document everything, report properly"
    },
    {
      situation: "Legitimate complaint",
      action: "Apologize, fix issue, update review response",
      doNot: "Don't make excuses",
      example: "Turn negative into positive"
    }
  ];

  const metrics = {
    current: {
      rating: "4.2",
      reviews: "23",
      responseRate: "45%",
      velocity: "1/month"
    },
    target: {
      rating: "4.7+",
      reviews: "50+",
      responseRate: "100%",
      velocity: "5/month"
    },
    impact: {
      leads: "+65%",
      conversion: "+38%",
      seo: "Top 3 ranking",
      trust: "92% trust level"
    }
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Online Review Management for Contractors',
          description: 'Professional online review management services for contractors. Build a strong online reputation, manage reviews, and attract more customers through positive testimonials.',
          provider: 'Unite Group',
          serviceType: 'Online Review Management & Reputation Services',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/local-seo-contractors" className="text-gray-400 hover:text-white transition">
              Local SEO
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-blue-400">Review Management</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-10 h-10 text-yellow-400" />
              <span className="px-4 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-sm">
                28% of Ranking Factor
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Turn Reviews Into{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Revenue Machines
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Get 5+ five-star reviews every month, respond like a pro, and watch 
              your local rankings (and revenue) skyrocket.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Star className="w-6 h-6 text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">4.7+</div>
                <div className="text-sm text-gray-400">Target rating</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">5/mo</div>
                <div className="text-sm text-gray-400">Review velocity</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <MessageSquare className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-gray-400">Response rate</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Users className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">+65%</div>
                <div className="text-sm text-gray-400">More leads</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Review Platforms */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Platforms That <span className="gradient-text">Matter Most</span>
            </h2>
            <p className="text-xl text-gray-400">
              Focus your efforts where customers actually look
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {reviewPlatforms.map((platform, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{platform.platform}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    platform.importance === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    platform.importance === 'High' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {platform.importance}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-gray-400">Customer Impact</span>
                    <span className="text-white font-semibold">{platform.impact}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-gray-400">Target Rating</span>
                    <span className="text-yellow-400 font-semibold">{platform.targetRating}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-gray-400">Target Quantity</span>
                    <span className="text-cyan-400 font-semibold">{platform.targetQuantity}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="text-sm text-gray-400">Response Time</span>
                    <span className="text-green-400 font-semibold">{platform.responseTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Generation System */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4-Touch <span className="gradient-text">Review Generation System</span>
            </h2>
            <p className="text-xl text-gray-400">
              Proven system that gets 85% more reviews
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Timing & Methods</h3>
              <div className="space-y-4">
                {reviewGeneration.timing.map((step, index) => (
                  <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-semibold text-white">{step.when}</span>
                      </div>
                      <span className="text-green-400 font-semibold">{step.success} success</span>
                    </div>
                    <div className="pl-11">
                      <p className="text-gray-300">{step.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Scripts That Work</h3>
              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-white">In-Person</span>
                  </div>
                  <p className="text-gray-300 italic">"{reviewGeneration.scripts.inPerson}"</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">SMS</span>
                  </div>
                  <p className="text-gray-300 italic">"{reviewGeneration.scripts.sms}"</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-white">Email</span>
                  </div>
                  <p className="text-gray-300 italic">"{reviewGeneration.scripts.email}"</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-white mb-3">Incentive Ideas</h4>
                <div className="grid grid-cols-2 gap-2">
                  {reviewGeneration.incentives.map((incentive, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>{incentive}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Response Templates */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Professional <span className="gradient-text">Response Templates</span>
            </h2>
            <p className="text-xl text-gray-400">
              Copy & paste templates for every situation
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">5-Star Response</h3>
              <pre className="bg-black/30 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap">
                {responseTemplates.fiveStar}
              </pre>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <Star className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">4-Star Response</h3>
              <pre className="bg-black/30 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap">
                {responseTemplates.fourStar}
              </pre>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-red-400 fill-red-400" />
                <Star className="w-5 h-5 text-gray-400" />
                <Star className="w-5 h-5 text-gray-400" />
                <Star className="w-5 h-5 text-gray-400" />
                <Star className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Negative Response</h3>
              <pre className="bg-black/30 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap">
                {responseTemplates.negative}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Damage Control */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Negative Review <span className="gradient-text">Damage Control</span>
            </h2>
            <p className="text-xl text-gray-400">
              Turn disasters into demonstrations of great service
            </p>
          </div>

          <div className="space-y-6">
            {damageControl.map((scenario, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="grid lg:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{scenario.situation}</h3>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Action to Take</p>
                    <p className="text-green-400">{scenario.action}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">What NOT to Do</p>
                    <p className="text-red-400">{scenario.doNot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Result</p>
                    <p className="text-cyan-400">{scenario.example}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-20 px-6 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Your Review <span className="gradient-text">Performance Metrics</span>
            </h2>
            <p className="text-xl text-gray-400">
              Where you are vs where you need to be
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold text-red-400 mb-6">Current State</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Average Rating</p>
                    <p className="text-2xl font-bold text-white">{metrics.current.rating}★</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Reviews</p>
                    <p className="text-2xl font-bold text-white">{metrics.current.reviews}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Response Rate</p>
                    <p className="text-2xl font-bold text-white">{metrics.current.responseRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Review Velocity</p>
                    <p className="text-2xl font-bold text-white">{metrics.current.velocity}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-green-400 mb-6">Target State</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Average Rating</p>
                    <p className="text-2xl font-bold text-green-400">{metrics.target.rating}★</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Reviews</p>
                    <p className="text-2xl font-bold text-green-400">{metrics.target.reviews}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Response Rate</p>
                    <p className="text-2xl font-bold text-green-400">{metrics.target.responseRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Review Velocity</p>
                    <p className="text-2xl font-bold text-green-400">{metrics.target.velocity}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-yellow-400 mb-6">Expected Impact</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Lead Increase</p>
                    <p className="text-2xl font-bold text-yellow-400">{metrics.impact.leads}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Conversion Boost</p>
                    <p className="text-2xl font-bold text-yellow-400">{metrics.impact.conversion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">SEO Impact</p>
                    <p className="text-2xl font-bold text-yellow-400">{metrics.impact.seo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Trust Level</p>
                    <p className="text-2xl font-bold text-yellow-400">{metrics.impact.trust}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Dominate Reviews?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Let us manage your reviews and watch your business grow
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-yellow-500/30 transition-all transform hover:scale-105">
              Get Review Management
            </Link>
            <Link href="/local-seo-contractors" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Local SEO
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}