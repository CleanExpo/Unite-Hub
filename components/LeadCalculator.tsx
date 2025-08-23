'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MapPin, Search, Phone, Mail, Globe, Target } from 'lucide-react';

export default function LeadCalculator() {
  const [suburb, setSuburb] = useState('Brisbane CBD');
  const [tradeType, setTradeType] = useState('plumbing');
  const [currentWebsite, setCurrentWebsite] = useState('basic');
  const [currentMarketing, setCurrentMarketing] = useState('word-of-mouth');
  
  const [results, setResults] = useState({
    monthlySearches: 0,
    competitorCount: 0,
    potentialLeads: 0,
    estimatedConversions: 0,
    revenueOpportunity: 0,
    marketShare: 0
  });

  const tradeData = {
    plumbing: {
      avgJobValue: 850,
      searchVolume: 2400,
      conversionRate: 3.2,
      competition: 'high'
    },
    electrical: {
      avgJobValue: 750,
      searchVolume: 1800,
      conversionRate: 2.8,
      competition: 'high'
    },
    hvac: {
      avgJobValue: 3200,
      searchVolume: 950,
      conversionRate: 2.5,
      competition: 'medium'
    },
    construction: {
      avgJobValue: 12000,
      searchVolume: 1200,
      conversionRate: 1.8,
      competition: 'very high'
    },
    roofing: {
      avgJobValue: 8500,
      searchVolume: 1100,
      conversionRate: 2.2,
      competition: 'high'
    },
    landscaping: {
      avgJobValue: 4500,
      searchVolume: 800,
      conversionRate: 3.5,
      competition: 'medium'
    }
  };

  const suburbMultipliers = {
    'Brisbane CBD': 1.0,
    'Gold Coast': 1.2,
    'Sunshine Coast': 0.9,
    'Ipswich': 0.7,
    'Logan': 0.8,
    'Redlands': 0.75,
    'Moreton Bay': 0.85
  };

  const websiteFactors = {
    none: { visibility: 0.05, conversion: 0.5 },
    basic: { visibility: 0.15, conversion: 0.8 },
    professional: { visibility: 0.35, conversion: 1.2 },
    optimized: { visibility: 0.65, conversion: 1.8 }
  };

  const marketingFactors = {
    'word-of-mouth': { reach: 0.1, quality: 1.5 },
    'facebook-only': { reach: 0.25, quality: 0.8 },
    'google-ads': { reach: 0.4, quality: 1.2 },
    'seo-focused': { reach: 0.7, quality: 1.4 },
    'multi-channel': { reach: 0.85, quality: 1.3 }
  };

  useEffect(() => {
    calculateLeads();
  }, [suburb, tradeType, currentWebsite, currentMarketing]);

  const calculateLeads = () => {
    const trade = tradeData[tradeType as keyof typeof tradeData];
    const suburbMultiplier = suburbMultipliers[suburb as keyof typeof suburbMultipliers] || 1;
    const websiteFactor = websiteFactors[currentWebsite as keyof typeof websiteFactors];
    const marketingFactor = marketingFactors[currentMarketing as keyof typeof marketingFactors];
    
    const baseSearches = trade.searchVolume * suburbMultiplier;
    const competitors = trade.competition === 'very high' ? 25 : 
                       trade.competition === 'high' ? 18 : 
                       trade.competition === 'medium' ? 12 : 8;
    
    const visibility = websiteFactor.visibility * marketingFactor.reach;
    const potentialLeads = Math.round(baseSearches * visibility);
    const conversionRate = (trade.conversionRate / 100) * websiteFactor.conversion * marketingFactor.quality;
    const estimatedConversions = Math.round(potentialLeads * conversionRate);
    const revenueOpportunity = estimatedConversions * trade.avgJobValue;
    const marketShare = Math.round((visibility / competitors) * 100);
    
    setResults({
      monthlySearches: Math.round(baseSearches),
      competitorCount: competitors,
      potentialLeads: potentialLeads,
      estimatedConversions: estimatedConversions,
      revenueOpportunity: Math.round(revenueOpportunity),
      marketShare: Math.min(marketShare, 35) // Cap at realistic 35%
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
          <Target className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Lead Generation Calculator</h3>
          <p className="text-gray-600">Discover your untapped market potential</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="inline h-4 w-4 mr-1" />
            Service Area
          </label>
          <select
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Brisbane CBD">Brisbane CBD</option>
            <option value="Gold Coast">Gold Coast</option>
            <option value="Sunshine Coast">Sunshine Coast</option>
            <option value="Ipswich">Ipswich</option>
            <option value="Logan">Logan</option>
            <option value="Redlands">Redlands</option>
            <option value="Moreton Bay">Moreton Bay</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline h-4 w-4 mr-1" />
            Trade Type
          </label>
          <select
            value={tradeType}
            onChange={(e) => setTradeType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
            <option value="construction">Construction</option>
            <option value="roofing">Roofing</option>
            <option value="landscaping">Landscaping</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="inline h-4 w-4 mr-1" />
            Current Website
          </label>
          <select
            value={currentWebsite}
            onChange={(e) => setCurrentWebsite(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="none">No Website</option>
            <option value="basic">Basic Website</option>
            <option value="professional">Professional Website</option>
            <option value="optimized">SEO Optimized Site</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <TrendingUp className="inline h-4 w-4 mr-1" />
            Current Marketing
          </label>
          <select
            value={currentMarketing}
            onChange={(e) => setCurrentMarketing(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="word-of-mouth">Word of Mouth Only</option>
            <option value="facebook-only">Facebook Only</option>
            <option value="google-ads">Google Ads</option>
            <option value="seo-focused">SEO Focused</option>
            <option value="multi-channel">Multi-Channel</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">Monthly Searches</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {results.monthlySearches.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Competitors</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {results.competitorCount}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Potential Leads</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {results.potentialLeads}/mo
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-gray-600">Est. Conversions</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {results.estimatedConversions}/mo
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-gray-600">Market Share</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {results.marketShare}%
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl p-4 border border-emerald-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <span className="text-sm text-gray-700 font-medium">Revenue Opportunity</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            ${results.revenueOpportunity.toLocaleString()}/mo
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-bold text-lg mb-3 text-gray-900">Your Market Opportunity:</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Currently Capturing:</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600">{results.marketShare}%</span>
              <span className="text-gray-500">of available market</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Potential Growth:</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600">
                {Math.round((35 - results.marketShare) / results.marketShare * 100)}%
              </span>
              <span className="text-gray-500">increase possible</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-gray-700">
            With proper SEO and digital marketing, you could be generating{' '}
            <span className="font-bold text-blue-600">
              {Math.round(results.estimatedConversions * 3.5)} conversions
            </span>{' '}
            per month, worth approximately{' '}
            <span className="font-bold text-green-600">
              ${Math.round(results.revenueOpportunity * 3.5).toLocaleString()}
            </span>.
          </p>
        </div>
      </div>
    </div>
  );
}