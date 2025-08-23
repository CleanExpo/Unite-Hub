'use client';

import React, { useState } from 'react';
import { Metadata } from 'next';
import { ChevronUp, MessageSquare, Rocket, Clock, CheckCircle, Circle, AlertCircle, Users, Star, TrendingUp, GitBranch, Calendar } from 'lucide-react';

const roadmapData = {
  released: [
    {
      id: 1,
      title: 'AI Content Generator',
      description: 'Generate SEO-optimized content with one click',
      votes: 892,
      category: 'AI Tools',
      releaseDate: '2024-01-15',
      impact: 'high'
    },
    {
      id: 2,
      title: 'Drag & Drop Website Builder',
      description: 'Visual editor with 200+ templates',
      votes: 1247,
      category: 'Core Platform',
      releaseDate: '2024-01-08',
      impact: 'critical'
    },
    {
      id: 3,
      title: 'Automated SEO Audits',
      description: 'Weekly SEO health checks and recommendations',
      votes: 654,
      category: 'SEO',
      releaseDate: '2023-12-20',
      impact: 'high'
    }
  ],
  inProgress: [
    {
      id: 4,
      title: 'Mobile App Builder',
      description: 'Convert your website to iOS/Android apps instantly',
      votes: 2341,
      category: 'Mobile',
      eta: 'Q1 2024',
      progress: 75,
      impact: 'critical'
    },
    {
      id: 5,
      title: 'Advanced Analytics Dashboard',
      description: 'Real-time business intelligence with AI insights',
      votes: 1876,
      category: 'Analytics',
      eta: 'Feb 2024',
      progress: 60,
      impact: 'high'
    },
    {
      id: 6,
      title: 'Multi-language Support',
      description: 'Auto-translate your site to 50+ languages',
      votes: 923,
      category: 'Internationalization',
      eta: 'Mar 2024',
      progress: 40,
      impact: 'medium'
    }
  ],
  planned: [
    {
      id: 7,
      title: 'WhatsApp Business Integration',
      description: 'Direct customer chat and automated responses',
      votes: 1654,
      category: 'Integrations',
      eta: 'Q2 2024',
      impact: 'high'
    },
    {
      id: 8,
      title: 'Voice Search Optimization',
      description: 'Optimize for Alexa, Siri, and Google Assistant',
      votes: 876,
      category: 'SEO',
      eta: 'Q2 2024',
      impact: 'medium'
    },
    {
      id: 9,
      title: 'AI Sales Assistant',
      description: 'Automated lead qualification and follow-ups',
      votes: 2109,
      category: 'AI Tools',
      eta: 'Q3 2024',
      impact: 'critical'
    }
  ],
  ideas: [
    {
      id: 10,
      title: 'Blockchain Payments',
      description: 'Accept crypto payments natively',
      votes: 432,
      category: 'Payments',
      status: 'evaluating'
    },
    {
      id: 11,
      title: 'AR Product Previews',
      description: '3D/AR preview for e-commerce products',
      votes: 567,
      category: 'E-commerce',
      status: 'researching'
    },
    {
      id: 12,
      title: 'TikTok Shop Integration',
      description: 'Sync products with TikTok shopping',
      votes: 1232,
      category: 'Social Commerce',
      status: 'evaluating'
    }
  ]
};

export default function RoadmapPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [votedItems, setVotedItems] = useState<number[]>([]);
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');

  const handleVote = (id: number) => {
    if (!votedItems.includes(id)) {
      setVotedItems([...votedItems, id]);
      // In production, this would make an API call
    }
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[impact as keyof typeof colors] || colors.medium;
  };

  const categories = ['all', 'Core Platform', 'AI Tools', 'SEO', 'Mobile', 'Analytics', 'Integrations', 'E-commerce'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <GitBranch className="w-4 h-4 mr-2" />
              <span className="text-sm font-semibold">Public Product Roadmap</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              You Control Our Future
            </h1>
            
            <p className="text-xl max-w-3xl mx-auto mb-8 text-white/90">
              Vote on features. Track progress. Shape the platform. 
              This isn't just our roadmap—it's yours.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">47</div>
                <div className="text-sm text-white/80">Features Released</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm text-white/80">In Development</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">18,432</div>
                <div className="text-sm text-white/80">Total Votes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Suggest Feature
            </button>
          </div>
        </div>
      </section>

      {/* Roadmap Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Released */}
          <div>
            <div className="flex items-center mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Released</h2>
              <span className="ml-auto text-sm text-gray-500">{roadmapData.released.length}</span>
            </div>
            <div className="space-y-4">
              {roadmapData.released.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getImpactColor(item.impact)}`}>
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {item.releaseDate}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {item.votes} votes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress */}
          <div>
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">In Progress</h2>
              <span className="ml-auto text-sm text-gray-500">{roadmapData.inProgress.length}</span>
            </div>
            <div className="space-y-4">
              {roadmapData.inProgress.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getImpactColor(item.impact)}`}>
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ETA: {item.eta}</span>
                    <button
                      onClick={() => handleVote(item.id)}
                      className={`flex items-center text-xs px-2 py-1 rounded transition-colors ${
                        votedItems.includes(item.id)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ChevronUp className="w-3 h-3 mr-1" />
                      {item.votes + (votedItems.includes(item.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Planned */}
          <div>
            <div className="flex items-center mb-4">
              <Circle className="w-5 h-5 text-purple-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Planned</h2>
              <span className="ml-auto text-sm text-gray-500">{roadmapData.planned.length}</span>
            </div>
            <div className="space-y-4">
              {roadmapData.planned.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getImpactColor(item.impact)}`}>
                      {item.impact}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">ETA: {item.eta}</span>
                    <button
                      onClick={() => handleVote(item.id)}
                      className={`flex items-center text-xs px-2 py-1 rounded transition-colors ${
                        votedItems.includes(item.id)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ChevronUp className="w-3 h-3 mr-1" />
                      {item.votes + (votedItems.includes(item.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ideas & Suggestions */}
          <div>
            <div className="flex items-center mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
              <h2 className="text-lg font-bold text-gray-900">Under Consideration</h2>
              <span className="ml-auto text-sm text-gray-500">{roadmapData.ideas.length}</span>
            </div>
            <div className="space-y-4">
              {roadmapData.ideas.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">{item.status}</span>
                    <button
                      onClick={() => handleVote(item.id)}
                      className={`flex items-center text-xs px-2 py-1 rounded transition-colors ${
                        votedItems.includes(item.id)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ChevronUp className="w-3 h-3 mr-1" />
                      {item.votes + (votedItems.includes(item.id) ? 1 : 0)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Request Form */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Have an Idea?</h2>
            <p className="text-gray-600 mb-6">
              Your feature request could be our next priority. Tell us what would make Unite-Group perfect for you.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feature Title
                </label>
                <input
                  type="text"
                  value={newFeatureTitle}
                  onChange={(e) => setNewFeatureTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Instagram Shopping Integration"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newFeatureDescription}
                  onChange={(e) => setNewFeatureDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe how this feature would help your business..."
                />
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Submit Feature Request
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}