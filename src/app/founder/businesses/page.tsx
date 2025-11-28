/**
 * Businesses List Page
 *
 * Grid/list view of all businesses with:
 * - Search and filter
 * - Add new business button
 * - Pagination
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Plus,
  Search,
  Grid3x3,
  List,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

interface Business {
  id: string;
  name: string;
  industry: string;
  healthScore: number;
  recentSignals: number;
  status: 'healthy' | 'attention' | 'critical';
  createdAt: string;
  lastActivity: string;
}

type ViewMode = 'grid' | 'list';

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    // TODO: Replace with actual API call
    const mockBusinesses: Business[] = [
      {
        id: '1',
        name: 'Balustrade Co.',
        industry: 'Construction',
        healthScore: 87,
        recentSignals: 12,
        status: 'healthy',
        createdAt: '2024-01-15',
        lastActivity: '2 hours ago',
      },
      {
        id: '2',
        name: 'Tech Startup',
        industry: 'SaaS',
        healthScore: 65,
        recentSignals: 8,
        status: 'attention',
        createdAt: '2024-02-20',
        lastActivity: '5 hours ago',
      },
      {
        id: '3',
        name: 'E-commerce Store',
        industry: 'Retail',
        healthScore: 92,
        recentSignals: 5,
        status: 'healthy',
        createdAt: '2024-03-10',
        lastActivity: '1 day ago',
      },
      {
        id: '4',
        name: 'Marketing Agency',
        industry: 'Marketing',
        healthScore: 78,
        recentSignals: 15,
        status: 'healthy',
        createdAt: '2024-01-05',
        lastActivity: '3 hours ago',
      },
      {
        id: '5',
        name: 'Consulting Firm',
        industry: 'Consulting',
        healthScore: 45,
        recentSignals: 20,
        status: 'critical',
        createdAt: '2023-12-01',
        lastActivity: '10 hours ago',
      },
    ];

    setBusinesses(mockBusinesses);
    setFilteredBusinesses(mockBusinesses);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = businesses;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === selectedFilter);
    }

    setFilteredBusinesses(filtered);
  }, [searchQuery, selectedFilter, businesses]);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: Business['status']) => {
    const colors = {
      healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
      attention: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const labels = {
      healthy: 'Healthy',
      attention: 'Needs Attention',
      critical: 'Critical',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredBusinesses.map((business) => (
        <Link key={business.id} href={`/founder/businesses/${business.id}`}>
          <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/70 transition-colors cursor-pointer h-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-100">{business.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{business.industry}</p>
              </div>
              {getStatusBadge(business.status)}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Health Score</span>
                  <span className={`text-sm font-semibold ${getHealthColor(business.healthScore)}`}>
                    {business.healthScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      business.healthScore >= 80
                        ? 'bg-green-500'
                        : business.healthScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${business.healthScore}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Recent Signals</span>
                <span className="text-gray-100 font-medium">{business.recentSignals}</span>
              </div>

              <div className="pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500">Last activity: {business.lastActivity}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );

  const renderListView = () => (
    <Card className="bg-gray-800/50 border-gray-700">
      <div className="divide-y divide-gray-700">
        {filteredBusinesses.map((business) => (
          <Link key={business.id} href={`/founder/businesses/${business.id}`}>
            <div className="p-4 hover:bg-gray-800/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <Building2 className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-100">{business.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{business.industry}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Health Score</p>
                    <p className={`text-sm font-semibold ${getHealthColor(business.healthScore)}`}>
                      {business.healthScore}/100
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">Signals</p>
                    <p className="text-sm font-semibold text-gray-100">{business.recentSignals}</p>
                  </div>

                  <div className="text-right min-w-[120px]">
                    {getStatusBadge(business.status)}
                  </div>

                  <div className="text-right min-w-[100px]">
                    <p className="text-xs text-gray-500">{business.lastActivity}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Businesses</h1>
            <p className="text-gray-400 mt-2">Manage your business portfolio</p>
          </div>
          <Link href="/founder/businesses/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          </Link>
        </div>
      </Section>

      {/* Filters and View Toggle */}
      <Section>
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-gray-100"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('all')}
                className={selectedFilter === 'all' ? 'bg-blue-600' : 'border-gray-600'}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={selectedFilter === 'healthy' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('healthy')}
                className={selectedFilter === 'healthy' ? 'bg-green-600' : 'border-gray-600'}
                size="sm"
              >
                Healthy
              </Button>
              <Button
                variant={selectedFilter === 'attention' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('attention')}
                className={selectedFilter === 'attention' ? 'bg-yellow-600' : 'border-gray-600'}
                size="sm"
              >
                Attention
              </Button>
              <Button
                variant={selectedFilter === 'critical' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('critical')}
                className={selectedFilter === 'critical' ? 'bg-red-600' : 'border-gray-600'}
                size="sm"
              >
                Critical
              </Button>
            </div>

            {/* View toggle */}
            <div className="flex items-center space-x-2 border border-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-blue-600' : ''}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-blue-600' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </Section>

      {/* Business List */}
      <Section>
        {filteredBusinesses.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-100 mb-2">No businesses found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first business'}
            </p>
            {!searchQuery && (
              <Link href="/founder/businesses/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Business
                </Button>
              </Link>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          renderGridView()
        ) : (
          renderListView()
        )}
      </Section>

      {/* Pagination (placeholder) */}
      {filteredBusinesses.length > 0 && (
        <Section>
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" className="border-gray-600" disabled>
              Previous
            </Button>
            <span className="text-sm text-gray-400">Page 1 of 1</span>
            <Button variant="outline" className="border-gray-600" disabled>
              Next
            </Button>
          </div>
        </Section>
      )}
    </PageContainer>
  );
}
