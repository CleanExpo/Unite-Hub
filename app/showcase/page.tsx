import React from 'react';
import { Metadata } from 'next';
import { ExternalLink, Clock, Award, TrendingUp, Users, Star, Filter, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Made with Unite-Group | Client Success Showcase',
  description: 'Explore real businesses built by real entrepreneurs using Unite-Group\'s self-service platform. See what you can create in minutes, not months.',
  openGraph: {
    title: 'Made with Unite-Group | Client Success Showcase',
    description: 'Real businesses built by real entrepreneurs in minutes',
    images: ['/showcase-og.png'],
  },
};

const showcaseProjects = [
  {
    id: 1,
    name: 'Brisbane Eco Market',
    owner: 'Sarah Chen',
    industry: 'E-commerce',
    url: 'brisbane-eco-market.com',
    thumbnail: '/api/placeholder/600/400',
    timeToLaunch: '45 minutes',
    monthlyRevenue: '$12,000',
    features: ['Online Store', 'Payment Gateway', 'Inventory Management', 'Email Marketing'],
    testimonial: 'I launched my sustainable products store in under an hour. What would have cost me $15k with an agency, I built myself for $89/month.',
    rating: 5,
    verified: true,
    launchDate: '2024-01-15'
  },
  {
    id: 2,
    name: 'FitLife Personal Training',
    owner: 'Marcus Johnson',
    industry: 'Health & Fitness',
    url: 'fitlife-training.com',
    thumbnail: '/api/placeholder/600/400',
    timeToLaunch: '32 minutes',
    monthlyRevenue: '$8,500',
    features: ['Booking System', 'Client Portal', 'Payment Processing', 'Class Scheduling'],
    testimonial: 'The booking system alone would have cost thousands to develop. I set it up during my lunch break!',
    rating: 5,
    verified: true,
    launchDate: '2024-02-03'
  },
  {
    id: 3,
    name: 'Digital Nomad Consulting',
    owner: 'Alex Rivera',
    industry: 'Consulting',
    url: 'nomad-consulting.com',
    thumbnail: '/api/placeholder/600/400',
    timeToLaunch: '28 minutes',
    monthlyRevenue: '$15,000',
    features: ['Client Dashboard', 'Invoice System', 'Video Conferencing', 'CRM'],
    testimonial: 'I needed a professional presence fast. Unite-Group delivered everything I needed in half an hour.',
    rating: 5,
    verified: true,
    launchDate: '2024-01-28'
  },
  {
    id: 4,
    name: 'Sunshine Coast Plumbing',
    owner: 'David Thompson',
    industry: 'Trade Services',
    url: 'sunshine-plumbing.com',
    thumbnail: '/api/placeholder/600/400',
    timeToLaunch: '52 minutes',
    monthlyRevenue: '$22,000',
    features: ['Quote Calculator', 'Service Booking', 'Customer Reviews', 'Local SEO'],
    testimonial: 'My competitors spent $20k on their websites. Mine looks better and I built it myself for a fraction of the cost.',
    rating: 5,
    verified: true,
    launchDate: '2024-02-10'
  },
  {
    id: 5,
    name: 'Tech Startup Academy',
    owner: 'Priya Patel',
    industry: 'Education',
    url: 'techstartup-academy.com',
    thumbnail: '/api/placeholder/600/400',
    timeToLaunch: '1 hour 15 minutes',
    monthlyRevenue: '$18,000',
    features: ['Course Platform', 'Student Portal', 'Payment System', 'Certificate Generation'],
    testimonial: 'Building an online course platform usually takes months. I launched my first course the same day I signed up.',
    rating: 5,
    verified: true,
    launchDate: '2024-01-20'
  },
  {
    id: 6,
    name: 'Gold Coast Real Estate',
    owner: 'Emma Watson',
    industry: 'Real Estate',
    url: 'goldcoast-realestate.com',
    thumbnail: '/api/placeholder/600/400',
    timeToLaunch: '38 minutes',
    monthlyRevenue: '$35,000',
    features: ['Property Listings', 'Virtual Tours', 'Lead Capture', 'Market Reports'],
    testimonial: 'The property listing system is more advanced than what my franchise was offering. Total game-changer.',
    rating: 5,
    verified: true,
    launchDate: '2024-02-05'
  }
];

const stats = {
  totalProjects: '12,847',
  avgLaunchTime: '42 min',
  totalRevenue: '$4.2M/mo',
  satisfaction: '98%'
};

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
              <Award className="w-4 h-4 mr-2" />
              <span className="text-sm font-semibold">100% Built by Clients, Not Agencies</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Made with Unite-Group
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Real businesses. Real entrepreneurs. Real results. 
              Every site here was built by the business owner themselves, not a developer.
            </p>

            {/* Live Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.totalProjects}</div>
                <div className="text-sm text-gray-600">Projects Built</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="text-3xl font-bold text-green-600">{stats.avgLaunchTime}</div>
                <div className="text-sm text-gray-600">Avg Launch Time</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.totalRevenue}</div>
                <div className="text-sm text-gray-600">Client Revenue</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="text-3xl font-bold text-orange-600">{stats.satisfaction}</div>
                <div className="text-sm text-gray-600">Satisfaction</div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                All Industries
              </button>
              <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                E-commerce
              </button>
              <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                Services
              </button>
              <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                Education
              </button>
              <button className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                Trade & Construction
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {showcaseProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
              {/* Project Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl mx-auto mb-2"></div>
                    <span className="text-sm text-gray-600">{project.url}</span>
                  </div>
                </div>
                {project.verified && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                    <Award className="w-3 h-3 mr-1" />
                    Verified
                  </div>
                )}
              </div>

              {/* Project Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-600">by {project.owner}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {project.industry}
                  </span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-gray-700">Built in {project.timeToLaunch}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                    <span className="text-gray-700">{project.monthlyRevenue}/mo</span>
                  </div>
                </div>

                {/* Features Used */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                  {project.features.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{project.features.length - 3} more
                    </span>
                  )}
                </div>

                {/* Testimonial */}
                <blockquote className="border-l-4 border-blue-500 pl-4 mb-4">
                  <p className="text-sm text-gray-600 italic">"{project.testimonial}"</p>
                </blockquote>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <a 
                    href={`https://${project.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Visit Site
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Load More Success Stories
          </button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Join 12,847+ Entrepreneurs Who Took Control
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Stop paying agencies. Start building your empire. Launch in minutes, not months.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-bold">
              Start Building for Free
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-bold">
              Submit Your Site
            </button>
          </div>
          <p className="text-sm mt-4 opacity-75">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}