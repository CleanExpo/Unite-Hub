'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, Shield, AlertTriangle, Check, X, Zap, Globe, Star } from 'lucide-react';

export default function CompetitorAnalyzer() {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const mockCompetitorData = {
    'example.com': {
      name: 'Brisbane Pro Plumbing',
      overallScore: 72,
      strengths: [
        'Strong local citations (45+)',
        'Active Google My Business',
        'Mobile responsive website',
        '200+ Google reviews'
      ],
      weaknesses: [
        'Slow page load speed (4.2s)',
        'No blog or content marketing',
        'Missing schema markup',
        'Poor internal linking',
        'No SSL certificate'
      ],
      metrics: {
        domainAuthority: 28,
        pageSpeed: 42,
        mobileScore: 85,
        contentScore: 35,
        technicalSEO: 61,
        backlinks: 156,
        monthlyTraffic: 2400,
        keywordRankings: 23
      },
      opportunities: [
        { area: 'Page Speed', impact: 'high', effort: 'low', improvement: '+35% traffic' },
        { area: 'Content Marketing', impact: 'high', effort: 'medium', improvement: '+50% rankings' },
        { area: 'Technical SEO', impact: 'medium', effort: 'low', improvement: '+20% visibility' },
        { area: 'Link Building', impact: 'medium', effort: 'high', improvement: '+15% authority' }
      ]
    }
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setShowResults(true);
    }, 2000);
  };

  const data = mockCompetitorData['example.com'];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
          <Search className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Competitor Analyzer</h3>
          <p className="text-gray-600">Discover opportunities to outrank your competition</p>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Competitor Website URL
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="e.g., competitorplumbing.com.au"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {analyzing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze Competitor'
            )}
          </button>
        </div>
      </div>

      {showResults && (
        <div className="space-y-8">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{data.name}</h4>
                <p className="text-gray-600">Overall SEO Score</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{data.overallScore}/100</div>
                <div className="text-sm text-gray-500">Room for improvement</div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-1000"
                style={{ width: `${data.overallScore}%` }}
              ></div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-600">Domain Authority</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{data.metrics.domainAuthority}</div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600">Page Speed</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{data.metrics.pageSpeed}</div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-gray-600">Monthly Traffic</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{data.metrics.monthlyTraffic}</div>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-gray-600">Keywords Ranking</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{data.metrics.keywordRankings}</div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h4 className="font-bold text-lg mb-4 text-gray-900 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Their Strengths
              </h4>
              <ul className="space-y-2">
                {data.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h4 className="font-bold text-lg mb-4 text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Their Weaknesses (Your Opportunities)
              </h4>
              <ul className="space-y-2">
                {data.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start">
                    <X className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Opportunities Matrix */}
          <div>
            <h4 className="font-bold text-lg mb-4 text-gray-900">Quick Win Opportunities</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {data.opportunities.map((opp, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-bold text-gray-900">{opp.area}</h5>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      opp.impact === 'high' ? 'bg-green-100 text-green-700' :
                      opp.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {opp.impact} impact
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Effort: {opp.effort}</span>
                    <span className="font-bold text-blue-600">{opp.improvement}</span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Priority Score</span>
                      <div className="flex gap-1">
                        {[...Array(opp.impact === 'high' ? 5 : opp.impact === 'medium' ? 3 : 2)].map((_, i) => (
                          <span key={i} className="text-yellow-400">★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
            <h4 className="text-2xl font-bold mb-4">Your Competitive Advantage Plan</h4>
            <p className="mb-6 text-blue-100">
              Based on this analysis, you can outrank {data.name} by focusing on these quick wins:
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">2-3 weeks</div>
                <div className="text-sm text-blue-100">to surpass their technical SEO</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">45% faster</div>
                <div className="text-sm text-blue-100">page load speed advantage</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">3x more</div>
                <div className="text-sm text-blue-100">content opportunities</div>
              </div>
            </div>
            
            <button className="w-full px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:shadow-xl transition-all duration-300">
              Get Your Custom Outranking Strategy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}