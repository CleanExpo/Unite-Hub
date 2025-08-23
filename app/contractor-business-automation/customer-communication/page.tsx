"use client";

import React from 'react';
import Link from 'next/link';
import { 
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Calendar,
  Bell,
  Heart,
  TrendingUp,
  Camera
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function CustomerCommunication() {
  const communicationSequences = [
    {
      name: "New Lead Nurture",
      timeline: "14 days",
      messages: [
        { day: 0, type: "SMS", content: "Thanks for your inquiry! We'll call within 2 hours" },
        { day: 0, type: "Email", content: "Welcome email with company info" },
        { day: 1, type: "Call", content: "Personal follow-up call" },
        { day: 3, type: "SMS", content: "Quote reminder if not opened" },
        { day: 7, type: "Email", content: "Case studies & testimonials" },
        { day: 14, type: "SMS", content: "Special offer - 10% off this month" }
      ],
      conversion: "47% vs 19% manual"
    },
    {
      name: "Active Job Updates",
      timeline: "Project duration",
      messages: [
        { day: -1, type: "SMS", content: "Crew arriving tomorrow 8am" },
        { day: 0, type: "SMS", content: "Crew on site - ETA 3pm finish" },
        { day: 1, type: "Photo", content: "Progress photo update" },
        { day: "Daily", type: "SMS", content: "End of day summary" },
        { day: "Complete", type: "SMS", content: "Job complete - invoice attached" },
        { day: "+3", type: "Email", content: "Review request" }
      ],
      satisfaction: "4.9★ average"
    }
  ];

  const templates = [
    {
      category: "Quotes & Estimates",
      templates: [
        "Quote ready - view online",
        "Quote follow-up Day 3",
        "Limited time offer",
        "Quote expiry warning"
      ]
    },
    {
      category: "Job Updates",
      templates: [
        "Booking confirmation",
        "Running 30 mins late",
        "Job complete summary",
        "Weather delay notice"
      ]
    },
    {
      category: "Payments",
      templates: [
        "Invoice ready - pay online",
        "Payment received thanks",
        "Overdue reminder",
        "Payment plan available"
      ]
    },
    {
      category: "Reviews & Referrals",
      templates: [
        "Google review request",
        "Referral program invite",
        "Birthday discount",
        "Annual service reminder"
      ]
    }
  ];

  const automationTools = [
    {
      tool: "SMS Automation",
      provider: "Twilio/MessageMedia",
      cost: "$0.07-0.12 per SMS",
      features: [
        "Bulk SMS campaigns",
        "Two-way messaging",
        "Delivery tracking",
        "Schedule sending"
      ],
      bestFor: "Instant updates"
    },
    {
      tool: "Email Marketing",
      provider: "Mailchimp/ActiveCampaign",
      cost: "$15-50/month",
      features: [
        "Drag-drop templates",
        "Segmentation",
        "A/B testing",
        "Analytics"
      ],
      bestFor: "Newsletters & quotes"
    },
    {
      tool: "Review Management",
      provider: "BirdEye/Reputation",
      cost: "$29-99/month",
      features: [
        "Review invitations",
        "Response templates",
        "Multi-platform",
        "Sentiment analysis"
      ],
      bestFor: "Building reputation"
    }
  ];

  const metrics = {
    responseTime: { before: "4-6 hours", after: "< 5 minutes" },
    customerSatisfaction: { before: "3.8★", after: "4.8★" },
    reviewCount: { before: "2/month", after: "15/month" },
    repeatBusiness: { before: "22%", after: "48%" }
  };

  const roi = {
    costs: {
      sms: "$150/month (2000 messages)",
      email: "$29/month",
      review: "$49/month",
      setup: "$500 one-time",
      total: "$228/month"
    },
    benefits: {
      timesSaved: "15 hrs/week @ $75 = $4,500",
      extraJobs: "5 from reviews = $7,500",
      repeatBusiness: "+26% = $12,000",
      total: "$24,000/month"
    },
    netBenefit: "$23,772/month",
    roi: "10,400%"
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Customer Communication Automation for Contractors',
          description: 'Automated customer communication systems for contractors. Streamline customer interactions, automate follow-ups, and improve customer satisfaction.',
          provider: 'Unite Group',
          serviceType: 'Customer Communication Automation',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/contractor-business-automation" className="text-gray-400 hover:text-white transition">
              Business Automation
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-purple-400">Customer Communication</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-10 h-10 text-purple-400" />
              <span className="px-4 py-1 bg-purple-400/10 border border-purple-400/30 rounded-full text-purple-400 text-sm">
                5-Star Communication
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Never Miss a{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Customer Touchpoint
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Automate every customer interaction from first inquiry to 5-star review. 
              Keep customers informed, happy, and coming back for more.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Clock className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">&lt;5min</div>
                <div className="text-sm text-gray-400">Response time</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Star className="w-6 h-6 text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">4.9★</div>
                <div className="text-sm text-gray-400">Avg rating</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Heart className="w-6 h-6 text-red-400 mb-2" />
                <div className="text-2xl font-bold text-white">48%</div>
                <div className="text-sm text-gray-400">Repeat rate</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">+47%</div>
                <div className="text-sm text-gray-400">Conversion</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Communication Sequences */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Proven <span className="gradient-text">Communication Sequences</span>
            </h2>
            <p className="text-xl text-gray-400">
              Copy these exact sequences that convert
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {communicationSequences.map((sequence, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{sequence.name}</h3>
                    <p className="text-gray-400">Duration: {sequence.timeline}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">Result</p>
                    <p className="text-lg font-bold text-green-400">
                      {sequence.conversion || sequence.satisfaction}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {sequence.messages.map((msg, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="flex-shrink-0">
                        {msg.type === 'SMS' && <Smartphone className="w-5 h-5 text-blue-400" />}
                        {msg.type === 'Email' && <Mail className="w-5 h-5 text-purple-400" />}
                        {msg.type === 'Call' && <Phone className="w-5 h-5 text-green-400" />}
                        {msg.type === 'Photo' && <Camera className="w-5 h-5 text-yellow-400" />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400">
                            Day {msg.day === 'Daily' ? 'Daily' : msg.day === 'Complete' ? 'Complete' : msg.day}
                          </span>
                          <span className="text-xs text-purple-400">{msg.type}</span>
                        </div>
                        <p className="text-sm text-gray-300">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Message Templates */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Ready-to-Use <span className="gradient-text">Message Templates</span>
            </h2>
            <p className="text-xl text-gray-400">
              Proven messages that get responses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">{category.category}</h3>
                <ul className="space-y-2">
                  {category.templates.map((template, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{template}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center">
            <p className="text-lg text-white mb-2">
              Want all 47 proven templates?
            </p>
            <Link href="https://unitegroup.com.au/consultation" 
              className="inline-flex items-center gap-2 text-purple-400 font-semibold hover:text-purple-300 transition">
              Get Template Pack Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Automation Tools */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Best <span className="gradient-text">Communication Tools</span>
            </h2>
            <p className="text-xl text-gray-400">
              Tools that integrate with your existing systems
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {automationTools.map((tool, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-2">{tool.tool}</h3>
                <p className="text-purple-400 mb-1">{tool.provider}</p>
                <p className="text-lg font-semibold text-cyan-400 mb-4">{tool.cost}</p>
                
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Features</h4>
                  <ul className="space-y-2">
                    {tool.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">Best for</p>
                  <p className="text-white font-semibold">{tool.bestFor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Metrics */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              The <span className="gradient-text">Communication Transformation</span>
            </h2>
            <p className="text-xl text-gray-400">
              Real results from Brisbane contractors
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Before Automation</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Response Time</span>
                  <span className="text-red-400 font-semibold">{metrics.responseTime.before}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Customer Rating</span>
                  <span className="text-red-400 font-semibold">{metrics.customerSatisfaction.before}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Reviews/Month</span>
                  <span className="text-red-400 font-semibold">{metrics.reviewCount.before}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Repeat Business</span>
                  <span className="text-red-400 font-semibold">{metrics.repeatBusiness.before}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">After Automation</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Response Time</span>
                  <span className="text-green-400 font-semibold">{metrics.responseTime.after}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Customer Rating</span>
                  <span className="text-green-400 font-semibold">{metrics.customerSatisfaction.after}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Reviews/Month</span>
                  <span className="text-green-400 font-semibold">{metrics.reviewCount.after}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Repeat Business</span>
                  <span className="text-green-400 font-semibold">{metrics.repeatBusiness.after}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-black mb-6 text-center">
              Communication Automation <span className="gradient-text">ROI</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-4">Monthly Costs</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-gray-300">
                    <span>SMS (2000/month)</span>
                    <span className="text-white">{roi.costs.sms}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Email platform</span>
                    <span className="text-white">{roi.costs.email}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Review management</span>
                    <span className="text-white">{roi.costs.review}</span>
                  </li>
                  <li className="flex justify-between font-bold text-white pt-2 border-t border-white/20">
                    <span>Total</span>
                    <span className="text-red-400">{roi.costs.total}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold text-green-400 mb-4">Monthly Benefits</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between text-gray-300">
                    <span>Time saved</span>
                    <span className="text-white">{roi.benefits.timesSaved}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Extra jobs</span>
                    <span className="text-white">{roi.benefits.extraJobs}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Repeat business</span>
                    <span className="text-white">{roi.benefits.repeatBusiness}</span>
                  </li>
                  <li className="flex justify-between font-bold text-white pt-2 border-t border-white/20">
                    <span>Total</span>
                    <span className="text-green-400">{roi.benefits.total}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 text-center">
              <p className="text-lg text-gray-300 mb-2">Net Monthly Benefit</p>
              <p className="text-5xl font-black text-green-400 mb-2">{roi.netBenefit}</p>
              <p className="text-gray-400">ROI: <span className="text-white font-bold">{roi.roi}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Start Delighting <span className="gradient-text">Customers Automatically</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Set up your first automated sequence in 24 hours
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get Communication Audit
            </Link>
            <Link href="/contractor-business-automation" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Automation Hub
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}