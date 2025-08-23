'use client';

import React from 'react';
import { Clock, Zap, TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';

interface MetricProps {
  title: string;
  value: string;
  comparison?: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const Metric = ({ title, value, comparison, icon: Icon, color, description }: MetricProps) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {comparison && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
            vs {comparison}
          </span>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
};

export default function TimeToValueMetrics() {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Time is Money. Save Both.
        </h2>
        <p className="text-lg text-gray-600">
          See exactly how fast you can launch compared to traditional methods
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Metric
          title="Website Launch Time"
          value="45 minutes"
          comparison="3-6 weeks"
          icon={Clock}
          color="blue"
          description="From signup to live website with custom domain"
        />
        
        <Metric
          title="First Sale Possible"
          value="Same day"
          comparison="2-4 weeks"
          icon={DollarSign}
          color="green"
          description="Payment processing and checkout ready instantly"
        />
        
        <Metric
          title="SEO Results Visible"
          value="48 hours"
          comparison="3-6 months"
          icon={TrendingUp}
          color="purple"
          description="Google indexing with automatic optimization"
        />
        
        <Metric
          title="Email Campaign Setup"
          value="5 minutes"
          comparison="2-3 days"
          icon={Zap}
          color="orange"
          description="Complete automation sequence ready to send"
        />
        
        <Metric
          title="Analytics Dashboard"
          value="Instant"
          comparison="1-2 weeks"
          icon={BarChart3}
          color="blue"
          description="Real-time tracking from moment one"
        />
        
        <Metric
          title="ROI Breakeven"
          value="1st month"
          comparison="6-12 months"
          icon={Target}
          color="green"
          description="Start profitable with no setup fees"
        />
      </div>

      {/* Comparison Table */}
      <div className="mt-12 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h3 className="text-xl font-bold">Detailed Time Comparison</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unite-Group
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agency
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DIY/Freelancer
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Saved
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Initial Setup
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="text-green-600 font-semibold">5 min</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  2-3 days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  1 week
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">99%</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Design & Development
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="text-green-600 font-semibold">30 min</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  3-4 weeks
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  2-3 months
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">98%</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Content Creation
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="text-green-600 font-semibold">15 min</span>
                  <span className="text-xs text-gray-500 block">AI-assisted</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  1-2 weeks
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  2-4 weeks
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">97%</span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Testing & Launch
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="text-green-600 font-semibold">Automatic</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  3-5 days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                  1 week
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">100%</span>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  Total Time to Launch
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="text-green-600 font-bold text-lg">&lt; 1 hour</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 font-semibold">
                  6-8 weeks
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 font-semibold">
                  3-4 months
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full font-bold">98% faster</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <p className="text-lg text-gray-700 mb-4">
          Why wait weeks when you can launch today?
        </p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
          Start Your 45-Minute Launch →
        </button>
      </div>
    </div>
  );
}