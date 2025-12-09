/**
 * Insights Page
 *
 * Features:
 * - Filterable list of AI-generated insights
 * - Domain filter (by business)
 * - Date range filter
 * - Acknowledged vs pending toggle
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  Filter,
  CheckCircle,
  Circle,
  Calendar,
  Building2,
} from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  summary: string;
  details: string;
  businessId: string;
  businessName: string;
  category: string;
  timestamp: string;
  acknowledged: boolean;
  actionable: boolean;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const mockInsights: Insight[] = [
      {
        id: '1',
        type: 'positive',
        title: 'Strong SEO Performance',
        summary: 'Organic traffic increased 25% week-over-week',
        details:
          'Google Analytics shows a significant increase in organic search traffic. Main drivers are improved rankings for "stainless steel balustrades" and "glass railings Brisbane".',
        businessId: '1',
        businessName: 'Balustrade Co.',
        category: 'SEO',
        timestamp: '2 hours ago',
        acknowledged: false,
        actionable: true,
      },
      {
        id: '2',
        type: 'neutral',
        title: 'New Competitor Detected',
        summary: 'Similar business launched in Melbourne',
        details:
          'Market monitoring detected a new competitor offering similar products at comparable pricing. They have limited online presence currently.',
        businessId: '1',
        businessName: 'Balustrade Co.',
        category: 'Competition',
        timestamp: '1 day ago',
        acknowledged: false,
        actionable: true,
      },
      {
        id: '3',
        type: 'positive',
        title: 'Social Engagement Spike',
        summary: 'LinkedIn engagement up 40% this week',
        details:
          'Recent posts about product innovation are resonating well with the audience. Recommend continuing similar content strategy.',
        businessId: '2',
        businessName: 'Tech Startup',
        category: 'Social Media',
        timestamp: '2 days ago',
        acknowledged: true,
        actionable: false,
      },
      {
        id: '4',
        type: 'negative',
        title: 'Customer Support Delays',
        summary: 'Average response time increased to 48 hours',
        details:
          'Customer inquiries are taking longer to resolve. Consider implementing automated responses or hiring additional support staff.',
        businessId: '2',
        businessName: 'Tech Startup',
        category: 'Customer Service',
        timestamp: '3 days ago',
        acknowledged: false,
        actionable: true,
      },
      {
        id: '5',
        type: 'positive',
        title: 'Sales Milestone Achieved',
        summary: 'Monthly revenue target exceeded by 12%',
        details:
          'Strong performance driven by repeat customers and successful email campaign. Consider scaling winning strategies.',
        businessId: '3',
        businessName: 'E-commerce Store',
        category: 'Sales',
        timestamp: '4 days ago',
        acknowledged: true,
        actionable: false,
      },
    ];

    setInsights(mockInsights);
    setFilteredInsights(mockInsights);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = insights;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (insight) =>
          insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          insight.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          insight.businessName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Business filter
    if (selectedBusiness !== 'all') {
      filtered = filtered.filter((insight) => insight.businessId === selectedBusiness);
    }

    // Acknowledged filter
    if (!showAcknowledged) {
      filtered = filtered.filter((insight) => !insight.acknowledged);
    }

    setFilteredInsights(filtered);
  }, [searchQuery, selectedBusiness, showAcknowledged, insights]);

  const businesses = [
    { id: 'all', name: 'All Businesses' },
    { id: '1', name: 'Balustrade Co.' },
    { id: '2', name: 'Tech Startup' },
    { id: '3', name: 'E-commerce Store' },
  ];

  const handleAcknowledge = (insightId: string) => {
    setInsights((prev) =>
      prev.map((insight) =>
        insight.id === insightId ? { ...insight, acknowledged: true } : insight
      )
    );
  };

  const getInsightIcon = (type: Insight['type']) => {
    if (type === 'positive') {
return <TrendingUp className="w-5 h-5 text-green-400" />;
}
    if (type === 'negative') {
return <TrendingDown className="w-5 h-5 text-red-400" />;
}
    return <Activity className="w-5 h-5 text-yellow-400" />;
  };

  const getInsightColor = (type: Insight['type']) => {
    if (type === 'positive') {
return 'border-green-500/30 bg-green-500/10';
}
    if (type === 'negative') {
return 'border-red-500/30 bg-red-500/10';
}
    return 'border-yellow-500/30 bg-yellow-500/10';
  };

  if (loading) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        </Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <Section>
        <div>
          <h1 className="text-3xl font-bold text-gray-100">AI Insights</h1>
          <p className="text-gray-400 mt-2">
            AI-generated insights and recommendations across your business portfolio
          </p>
        </div>
      </Section>

      {/* Filters */}
      <Section>
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-gray-100"
              />
            </div>

            {/* Business filter */}
            <div>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="w-full h-10 px-3 bg-gray-900/50 border border-gray-700 text-gray-100 rounded-md"
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Acknowledged toggle */}
            <div>
              <Button
                variant={showAcknowledged ? 'outline' : 'default'}
                onClick={() => setShowAcknowledged(!showAcknowledged)}
                className={
                  showAcknowledged
                    ? 'w-full border-gray-600'
                    : 'w-full bg-blue-600 hover:bg-blue-700'
                }
              >
                {showAcknowledged ? 'All' : 'Pending Only'}
              </Button>
            </div>
          </div>
        </Card>
      </Section>

      {/* Stats */}
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Insights</p>
                <p className="text-2xl font-bold text-gray-100 mt-1">{insights.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {insights.filter((i) => !i.acknowledged).length}
                </p>
              </div>
              <Circle className="w-8 h-8 text-yellow-400" />
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Actionable</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {insights.filter((i) => i.actionable).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {insights.filter((i) => i.timestamp.includes('hours') || i.timestamp.includes('day')).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
        </div>
      </Section>

      {/* Insights List */}
      <Section>
        <div className="space-y-4">
          {filteredInsights.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700 p-12 text-center">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-100 mb-2">No insights found</h3>
              <p className="text-gray-400">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'AI Phill will generate insights as signals are detected'}
              </p>
            </Card>
          ) : (
            filteredInsights.map((insight) => (
              <Card
                key={insight.id}
                className={`border ${getInsightColor(insight.type)} hover:bg-opacity-20 transition-all`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3 flex-1">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-100">{insight.title}</h3>
                          {insight.actionable && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded border border-blue-500/30">
                              Actionable
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{insight.summary}</p>
                        <p className="text-sm text-gray-400 mb-4">{insight.details}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Building2 className="w-3 h-3 mr-1" />
                            {insight.businessName}
                          </span>
                          <span className="flex items-center">
                            <Filter className="w-3 h-3 mr-1" />
                            {insight.category}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {insight.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {!insight.acknowledged && (
                        <Button
                          onClick={() => handleAcknowledge(insight.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Acknowledge
                        </Button>
                      )}
                      {insight.acknowledged && (
                        <span className="flex items-center text-sm text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Section>
    </PageContainer>
  );
}
