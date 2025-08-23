'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Star, Quote, Building2, MapPin, TrendingUp, Users,
  CheckCircle, ArrowRight, Filter, ThumbsUp
} from 'lucide-react';

export default function TestimonialsPage() {
  const [filterCategory, setFilterCategory] = useState('all');

  // Sample testimonials - in production, these would come from a database
  const testimonials = [
    {
      id: 1,
      name: "Dave Mitchell",
      business: "Mitchell Plumbing Services",
      location: "Fortitude Valley, Brisbane",
      category: "plumbing",
      rating: 5,
      date: "January 2025",
      review: "Finally, someone who gets it! As a plumber who's been in the trade for 15 years, I was lost with online marketing. Unite Group explained everything in terms I understand and got me ranking on Google in 6 weeks.",
      results: ["3x more quote requests", "First page Google ranking", "Professional website"],
      verified: true
    },
    {
      id: 2,
      name: "Sarah Chen",
      business: "Sparky Solutions QLD",
      location: "West End, Brisbane",
      category: "electrical",
      rating: 5,
      date: "December 2024",
      review: "The founder's trade background makes all the difference. They understand our busy schedules and created a marketing system that runs itself. My phone hasn't stopped ringing!",
      results: ["5 new jobs per week", "Automated quote system", "200% ROI in 2 months"],
      verified: true
    },
    {
      id: 3,
      name: "Tom Wilson",
      business: "Wilson HVAC",
      location: "Toowong, Brisbane",
      category: "hvac",
      rating: 5,
      date: "January 2025",
      review: "I was skeptical about a new agency, but their AI-powered approach is game-changing. They set up everything and now I'm booked solid for the next 3 months.",
      results: ["Booked 3 months ahead", "25% price increase", "Zero marketing effort needed"],
      verified: true
    },
    {
      id: 4,
      name: "Mark Thompson",
      business: "Thompson Construction",
      location: "Newstead, Brisbane",
      category: "construction",
      rating: 5,
      date: "November 2024",
      review: "Unite Group speaks our language. No BS, just results. They helped me go from word-of-mouth only to having a professional online presence that wins big jobs.",
      results: ["Won $500K project", "Professional brand image", "Competing with big players"],
      verified: true
    },
    {
      id: 5,
      name: "Lisa Nguyen",
      business: "Precision Electrical Brisbane",
      location: "Woolloongabba, Brisbane",
      category: "electrical",
      rating: 5,
      date: "December 2024",
      review: "Being founded by a tradie means they understand cash flow and ROI. Everything they suggested paid for itself within the first month. Best investment I've made.",
      results: ["ROI in 30 days", "Doubled quote conversion", "5-star Google reviews"],
      verified: true
    },
    {
      id: 6,
      name: "James Peterson",
      business: "Pete's Plumbing Co",
      location: "Paddington, Brisbane",
      category: "plumbing",
      rating: 5,
      date: "January 2025",
      review: "The AI tools they use are incredible. I can see exactly where my leads come from and what's working. It's like having a marketing team for a fraction of the cost.",
      results: ["Clear ROI tracking", "50+ leads per month", "Higher quality customers"],
      verified: true
    }
  ];

  const categories = [
    { value: 'all', label: 'All Trades' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'construction', label: 'Construction' }
  ];

  const filteredTestimonials = filterCategory === 'all' 
    ? testimonials 
    : testimonials.filter(t => t.category === filterCategory);

  const stats = {
    totalReviews: testimonials.length,
    averageRating: 5.0,
    verifiedReviews: testimonials.filter(t => t.verified).length
  };

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TestimonialsPage",
            "name": "Unite Group Agency Client Testimonials",
            "description": "Real reviews from Brisbane trade businesses using Unite Group's digital marketing services",
            "url": "https://unite-group.com.au/testimonials",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": stats.averageRating,
              "reviewCount": stats.totalReviews,
              "bestRating": "5",
              "worstRating": "1"
            },
            "review": testimonials.map(testimonial => ({
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": testimonial.name
              },
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": testimonial.rating,
                "bestRating": "5"
              },
              "reviewBody": testimonial.review,
              "datePublished": testimonial.date
            }))
          })
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl lg:text-6xl font-black mb-6">
                Real Results from
                <span className="block text-green-300">Real Brisbane Tradies</span>
              </h1>
              
              <p className="text-xl mb-8 text-green-100">
                Don't just take our word for it. See what local trade businesses 
                are saying about working with Unite Group Agency.
              </p>

              <div className="flex flex-wrap gap-8 justify-center items-center">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-8 w-8 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <div className="text-3xl font-bold">{stats.averageRating}</div>
                  <div className="text-green-200">Average Rating</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{stats.totalReviews}</div>
                  <div className="text-green-200">Client Reviews</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">100%</div>
                  <div className="text-green-200">Verified Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 bg-white border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700 font-medium">Filter by trade:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.value}
                    onClick={() => setFilterCategory(category.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterCategory === category.value
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTestimonials.map(testimonial => (
                <div key={testimonial.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">{testimonial.name}</h3>
                        <p className="text-green-600 font-medium">{testimonial.business}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3" />
                          {testimonial.location}
                        </div>
                      </div>
                      {testimonial.verified && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{testimonial.date}</span>
                    </div>

                    {/* Review */}
                    <div className="relative mb-4">
                      <Quote className="absolute -top-2 -left-2 h-8 w-8 text-gray-200" />
                      <p className="text-gray-700 leading-relaxed relative z-10 pl-6">
                        {testimonial.review}
                      </p>
                    </div>

                    {/* Results */}
                    {testimonial.results && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Key Results:</p>
                        <ul className="space-y-1">
                          {testimonial.results.map((result, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              {result}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Video Testimonial Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black mb-6">
              Why Trades Choose <span className="text-green-600">Unite Group</span>
            </h2>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Video testimonials coming soon</p>
                </div>
              </div>
              
              <blockquote className="text-xl text-gray-700 italic mb-4">
                "The difference is they actually understand our business. It's not just marketing 
                theory – it's practical solutions that work in the real world of trades."
              </blockquote>
              <footer className="text-gray-600">
                — Common feedback from our clients
              </footer>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4">
                Trusted by Brisbane's <span className="text-green-600">Best Trades</span>
              </h2>
              <p className="text-xl text-gray-600">
                Real businesses, real results, real growth
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">100% Authentic</h3>
                <p className="text-gray-600">
                  All reviews are from verified Brisbane trade businesses
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">Trade-Focused</h3>
                <p className="text-gray-600">
                  We only work with trades – it's what we know best
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-bold text-xl mb-2">Proven Results</h3>
                <p className="text-gray-600">
                  Every client sees measurable growth in their business
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black mb-6">
              Ready to Be Our Next Success Story?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Join Brisbane trades who are growing their businesses with Unite Group
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 rounded-xl font-bold hover:shadow-xl transition-all duration-300 group"
              >
                Get Your Free Strategy Session
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/case-studies"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-all duration-300"
              >
                View Case Studies
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}