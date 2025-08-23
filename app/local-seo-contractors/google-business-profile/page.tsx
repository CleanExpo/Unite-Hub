"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Building,
  Star,
  Camera,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Phone,
  Globe,
  ArrowRight
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function GoogleBusinessProfile() {
  const optimizationChecklist = [
    {
      category: "Profile Completion",
      importance: "Critical",
      tasks: [
        { task: "Business name with keywords", status: "required", tip: "Brisbane Emergency Plumber - John's Plumbing" },
        { task: "Primary & secondary categories", status: "required", tip: "Plumber + Emergency Plumber" },
        { task: "Service areas (all suburbs)", status: "required", tip: "List 20+ suburbs you service" },
        { task: "Business description (750 chars)", status: "required", tip: "Include main keywords naturally" },
        { task: "Opening hours + special hours", status: "required", tip: "Show 24/7 if applicable" },
        { task: "Website + appointment links", status: "required", tip: "Track with UTM parameters" }
      ]
    },
    {
      category: "Visual Content",
      importance: "Critical",
      tasks: [
        { task: "Logo & cover photo", status: "required", tip: "Professional, high-res images" },
        { task: "20+ work photos", status: "required", tip: "Before/after shots work best" },
        { task: "5+ team photos", status: "required", tip: "Build trust with faces" },
        { task: "10+ vehicle photos", status: "recommended", tip: "Shows legitimacy" },
        { task: "Video tour/intro", status: "recommended", tip: "60 seconds max" },
        { task: "Monthly photo updates", status: "ongoing", tip: "Shows active business" }
      ]
    },
    {
      category: "Reviews & Q&A",
      importance: "Critical",
      tasks: [
        { task: "50+ reviews minimum", status: "required", tip: "Ask every happy customer" },
        { task: "4.7+ star average", status: "required", tip: "Address negatives fast" },
        { task: "Respond to ALL reviews", status: "required", tip: "Within 24 hours" },
        { task: "5+ reviews monthly", status: "ongoing", tip: "Velocity matters" },
        { task: "Answer all questions", status: "required", tip: "Add your own Q&As" },
        { task: "Keywords in responses", status: "recommended", tip: "Natural placement only" }
      ]
    },
    {
      category: "Posts & Updates",
      importance: "High",
      tasks: [
        { task: "Weekly update posts", status: "ongoing", tip: "Jobs, tips, offers" },
        { task: "Offer posts (monthly)", status: "recommended", tip: "10% off, free quotes" },
        { task: "Event posts", status: "recommended", tip: "Community involvement" },
        { task: "Product posts", status: "recommended", tip: "Showcase services" },
        { task: "COVID updates", status: "if applicable", tip: "Safety measures" },
        { task: "Holiday hours", status: "required", tip: "Update in advance" }
      ]
    }
  ];

  const rankingFactors = [
    { factor: "Proximity to searcher", weight: "32%", control: "Limited", tip: "Multiple locations help" },
    { factor: "Review signals", weight: "28%", control: "High", tip: "Quantity, velocity, diversity" },
    { factor: "On-page signals", weight: "15%", control: "High", tip: "Website optimization" },
    { factor: "Link signals", weight: "12%", control: "Medium", tip: "Local citations" },
    { factor: "Behavioral signals", weight: "8%", control: "Medium", tip: "Clicks, calls, directions" },
    { factor: "Personalization", weight: "5%", control: "None", tip: "User history" }
  ];

  const postingSchedule = {
    monday: { type: "Update", content: "Weekend job showcase", time: "9:00 AM" },
    tuesday: { type: "Tip", content: "Maintenance advice", time: "12:00 PM" },
    wednesday: { type: "Offer", content: "Mid-week special", time: "3:00 PM" },
    thursday: { type: "Team", content: "Staff spotlight", time: "10:00 AM" },
    friday: { type: "Review", content: "Customer testimonial", time: "2:00 PM" },
    saturday: { type: "Emergency", content: "24/7 availability", time: "8:00 AM" }
  };

  const reviewStrategy = [
    {
      stage: "Ask",
      when: "Job completion",
      method: "In-person + SMS follow-up",
      script: "Would you mind sharing your experience on Google?",
      success: "35% leave review"
    },
    {
      stage: "Simplify",
      when: "Same day",
      method: "Direct review link via SMS",
      script: "Click here to review: [short link]",
      success: "Makes it effortless"
    },
    {
      stage: "Remind",
      when: "Day 3",
      method: "Email with instructions",
      script: "Your feedback helps other locals",
      success: "+15% completion"
    },
    {
      stage: "Incentivize",
      when: "Monthly draw",
      method: "Review rewards program",
      script: "Monthly $100 voucher draw",
      success: "Drives consistency"
    }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Google Business Profile Optimization for Contractors',
          description: 'Professional Google Business Profile optimization services for contractors. Maximize your local visibility, attract more customers, and dominate local search results.',
          provider: 'Unite Group',
          serviceType: 'Google Business Profile Optimization',
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
            <span className="text-blue-400">Google Business Profile</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-10 h-10 text-blue-400" />
              <span className="px-4 py-1 bg-blue-400/10 border border-blue-400/30 rounded-full text-blue-400 text-sm">
                38% of Local Ranking
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Dominate Google's{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                3-Pack Listings
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Your Google Business Profile is your #1 local ranking factor. 
              Optimize it right and watch leads pour in 24/7.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Star className="w-6 h-6 text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">4.7+</div>
                <div className="text-sm text-gray-400">Target rating</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Camera className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">20+</div>
                <div className="text-sm text-gray-400">Photos needed</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <MessageSquare className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">Weekly</div>
                <div className="text-sm text-gray-400">Post frequency</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Phone className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">+250%</div>
                <div className="text-sm text-gray-400">More calls</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optimization Checklist */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Complete <span className="gradient-text">GBP Optimization Checklist</span>
            </h2>
            <p className="text-xl text-gray-400">
              Every item that impacts your ranking
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {optimizationChecklist.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">{category.category}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    category.importance === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {category.importance}
                  </span>
                </div>

                <div className="space-y-3">
                  {category.tasks.map((item, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          item.status === 'required' ? 'text-red-400' :
                          item.status === 'recommended' ? 'text-yellow-400' :
                          'text-green-400'
                        }`} />
                        <div className="flex-grow">
                          <p className="text-white font-semibold mb-1">{item.task}</p>
                          <p className="text-sm text-gray-400">{item.tip}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ranking Factors */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Google's <span className="gradient-text">Ranking Algorithm</span>
            </h2>
            <p className="text-xl text-gray-400">
              What actually moves the needle
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankingFactors.map((factor, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{factor.factor}</h3>
                  <span className="text-2xl font-bold text-blue-400">{factor.weight}</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Your control</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      factor.control === 'High' ? 'bg-green-500/20 text-green-400' :
                      factor.control === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      factor.control === 'Limited' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {factor.control}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-300">{factor.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Posting Schedule */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Weekly <span className="gradient-text">Posting Schedule</span>
            </h2>
            <p className="text-xl text-gray-400">
              Stay top of mind with consistent updates
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-px bg-white/10">
                <div className="bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-gray-400">Day</p>
                </div>
                <div className="bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-gray-400">Post Type</p>
                </div>
                <div className="bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-gray-400">Content</p>
                </div>
                <div className="bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-gray-400">Best Time</p>
                </div>
              </div>
              
              {Object.entries(postingSchedule).map(([day, details], index) => (
                <div key={index} className="grid grid-cols-4 gap-px bg-white/10">
                  <div className="bg-slate-950 p-4">
                    <p className="text-white font-semibold capitalize">{day}</p>
                  </div>
                  <div className="bg-slate-950 p-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded">
                      {details.type}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-4">
                    <p className="text-gray-300 text-sm">{details.content}</p>
                  </div>
                  <div className="bg-slate-950 p-4">
                    <p className="text-cyan-400 font-semibold">{details.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Review Generation Strategy */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4-Step <span className="gradient-text">Review Generation System</span>
            </h2>
            <p className="text-xl text-gray-400">
              Get 5+ reviews every month, guaranteed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviewStrategy.map((stage, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{stage.stage}</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">When</p>
                    <p className="text-white">{stage.when}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Method</p>
                    <p className="text-gray-300">{stage.method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Script</p>
                    <p className="text-cyan-400 italic">"{stage.script}"</p>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-sm text-green-400">{stage.success}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Optimize Your GBP?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get our complete GBP optimization service
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-105">
              Get GBP Audit
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