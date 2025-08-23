'use client';

import { Calculator, FileText, PlayCircle, TrendingUp, Filter, Download } from 'lucide-react';
import { useState } from 'react';

export default function ToolsSidebar() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  return (
    <div className="space-y-6">
      {/* Quick Filters */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Quick Filters</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="all">All Categories</option>
              <option value="analytics">Analytics</option>
              <option value="testing">A/B Testing</option>
              <option value="email">Email Marketing</option>
              <option value="social">Social Media</option>
              <option value="automation">Automation</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Price Range</label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="under50">Under $50/mo</option>
              <option value="under200">Under $200/mo</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tool Calculator */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">ROI Calculator</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          Calculate the potential ROI of your growth tool stack.
        </p>
        <a
          href="/growth-hacking/calculator"
          className="block w-full text-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          Open Calculator
        </a>
      </div>

      {/* Download Resources */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Free Resources</h3>
        <div className="space-y-3">
          <a
            href="/downloads/tool-comparison-matrix.xlsx"
            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-sm font-medium text-white">Tool Comparison Matrix</p>
              <p className="text-xs text-gray-400">Excel • Compare 50+ tools</p>
            </div>
          </a>
          
          <a
            href="/downloads/tool-stack-template.pdf"
            className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Download className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-white">Tool Stack Template</p>
              <p className="text-xs text-gray-400">PDF • Build your stack</p>
            </div>
          </a>
        </div>
      </div>

      {/* Popular Tools */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Trending Tools</h3>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Framer', category: 'No-code', trend: '+45%' },
            { name: 'Notion', category: 'Productivity', trend: '+38%' },
            { name: 'Linear', category: 'Project Management', trend: '+52%' },
            { name: 'Vercel', category: 'Deployment', trend: '+67%' }
          ].map((tool) => (
            <div key={tool.name} className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-white">{tool.name}</p>
                <p className="text-xs text-gray-400">{tool.category}</p>
              </div>
              <span className="text-xs text-green-400 font-medium">{tool.trend}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Video Tutorial */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <PlayCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Video Guide</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          Watch our 10-minute guide on choosing the right growth tools.
        </p>
        <a
          href="https://youtube.com/watch?v=growth-tools"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Watch Tutorial
        </a>
      </div>

      {/* Tool Updates */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Latest Updates</h3>
        <div className="space-y-3 text-sm">
          <div className="pb-3 border-b border-slate-700">
            <p className="text-white font-medium">Mixpanel adds AI insights</p>
            <p className="text-xs text-gray-400">2 days ago</p>
          </div>
          <div className="pb-3 border-b border-slate-700">
            <p className="text-white font-medium">Hotjar launches new heatmaps</p>
            <p className="text-xs text-gray-400">5 days ago</p>
          </div>
          <div>
            <p className="text-white font-medium">Zapier adds 100 new integrations</p>
            <p className="text-xs text-gray-400">1 week ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}