/**
 * Business Detail Page
 *
 * Displays single business with:
 * - Business info header
 * - Tabbed content: Overview, Signals, Vault, Snapshots, Links
 * - Edit and Archive buttons
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Edit,
  Archive,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  AlertCircle,
  FileText,
  Lock,
  Camera,
  ExternalLink,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { useParams, useRouter } from 'next/navigation';

type Tab = 'overview' | 'signals' | 'vault' | 'snapshots' | 'links';

interface Business {
  id: string;
  name: string;
  industry: string;
  healthScore: number;
  status: 'healthy' | 'attention' | 'critical';
  description: string;
  createdAt: string;
  lastActivity: string;
  links: {
    website?: string;
    linkedIn?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

interface Signal {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  timestamp: string;
  source: string;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [business, setBusiness] = useState<Business | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const mockBusiness: Business = {
      id: businessId,
      name: 'Balustrade Co.',
      industry: 'Construction',
      healthScore: 87,
      status: 'healthy',
      description:
        'Premium stainless steel and glass balustrade manufacturer serving commercial and residential projects across Australia.',
      createdAt: '2024-01-15',
      lastActivity: '2 hours ago',
      links: {
        website: 'https://balustrade.example.com',
        linkedIn: 'https://linkedin.com/company/balustrade-co',
        facebook: 'https://facebook.com/balustradeco',
        instagram: 'https://instagram.com/balustradeco',
      },
    };

    const mockSignals: Signal[] = [
      {
        id: '1',
        type: 'positive',
        title: 'Positive customer review on Google',
        description: '5-star review mentioning quality and professionalism',
        timestamp: '2 hours ago',
        source: 'Google Reviews',
      },
      {
        id: '2',
        type: 'positive',
        title: 'Website traffic increased 25%',
        description: 'Week-over-week growth in organic search traffic',
        timestamp: '1 day ago',
        source: 'Analytics',
      },
      {
        id: '3',
        type: 'neutral',
        title: 'New competitor launched in Melbourne',
        description: 'Similar product offering at comparable pricing',
        timestamp: '2 days ago',
        source: 'Market Monitor',
      },
      {
        id: '4',
        type: 'positive',
        title: 'LinkedIn engagement up 40%',
        description: 'Recent posts seeing higher reach and interaction',
        timestamp: '3 days ago',
        source: 'LinkedIn Insights',
      },
    ];

    setBusiness(mockBusiness);
    setSignals(mockSignals);
    setLoading(false);
  }, [businessId]);

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
      <Badge className={colors[status]} variant="outline">
        {labels[status]}
      </Badge>
    );
  };

  const getSignalIcon = (type: Signal['type']) => {
    if (type === 'positive') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (type === 'negative') return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Activity className="w-5 h-5 text-gray-400" />;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Business Information</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Description</p>
            <p className="text-gray-100 mt-1">{business?.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Industry</p>
              <p className="text-gray-100 mt-1">{business?.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Created</p>
              <p className="text-gray-100 mt-1">{business?.createdAt}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-400">Health Score</h4>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <p className={`text-3xl font-bold ${getHealthColor(business?.healthScore || 0)}`}>
            {business?.healthScore}/100
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
            <div
              className={`h-2 rounded-full ${
                (business?.healthScore || 0) >= 80
                  ? 'bg-green-500'
                  : (business?.healthScore || 0) >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${business?.healthScore || 0}%` }}
            />
          </div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-400">Recent Signals</h4>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-100">{signals.length}</p>
          <p className="text-sm text-gray-400 mt-2">Last 7 days</p>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-400">Last Activity</h4>
            <AlertCircle className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-100">{business?.lastActivity}</p>
          <p className="text-sm text-gray-400 mt-2">System updated</p>
        </Card>
      </div>
    </div>
  );

  const renderSignals = () => (
    <Card className="bg-gray-800/50 border-gray-700">
      <div className="divide-y divide-gray-700">
        {signals.map((signal) => (
          <div key={signal.id} className="p-4 hover:bg-gray-800/30 transition-colors">
            <div className="flex items-start space-x-3">
              {getSignalIcon(signal.type)}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-100">{signal.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{signal.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">{signal.source}</span>
                  <span className="text-xs text-gray-500">{signal.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderVault = () => (
    <Card className="bg-gray-800/50 border-gray-700 p-12 text-center">
      <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-100 mb-2">Secure Vault</h3>
      <p className="text-gray-400 mb-6">
        Store passwords, API keys, and sensitive credentials for this business
      </p>
      <Button className="bg-blue-600 hover:bg-blue-700">Add Credential</Button>
    </Card>
  );

  const renderSnapshots = () => (
    <Card className="bg-gray-800/50 border-gray-700 p-12 text-center">
      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-100 mb-2">Business Snapshots</h3>
      <p className="text-gray-400 mb-6">
        Visual timeline of your business evolution with metrics and milestones
      </p>
      <Button className="bg-blue-600 hover:bg-blue-700">Create Snapshot</Button>
    </Card>
  );

  const renderLinks = () => (
    <div className="space-y-4">
      {business?.links.website && (
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <a
            href={business.links.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-100">Website</p>
                <p className="text-xs text-gray-400">{business.links.website}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </Card>
      )}

      {business?.links.linkedIn && (
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <a
            href={business.links.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Linkedin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-gray-100">LinkedIn</p>
                <p className="text-xs text-gray-400">{business.links.linkedIn}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </Card>
      )}

      {business?.links.facebook && (
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <a
            href={business.links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Facebook className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-semibold text-gray-100">Facebook</p>
                <p className="text-xs text-gray-400">{business.links.facebook}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </Card>
      )}

      {business?.links.instagram && (
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <a
            href={business.links.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Instagram className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-sm font-semibold text-gray-100">Instagram</p>
                <p className="text-xs text-gray-400">{business.links.instagram}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </Card>
      )}

      {business?.links.twitter && (
        <Card className="bg-gray-800/50 border-gray-700 p-4">
          <a
            href={business.links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-gray-800/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Twitter className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-gray-100">X (Twitter)</p>
                <p className="text-xs text-gray-400">{business.links.twitter}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </Card>
      )}
    </div>
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

  if (!business) {
    return (
      <PageContainer>
        <Section>
          <Card className="bg-gray-800/50 border-gray-700 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Business not found</h3>
            <p className="text-gray-400 mb-6">
              The business you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push('/founder/businesses')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Back to Businesses
            </Button>
          </Card>
        </Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <Section>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">{business.name}</h1>
              <p className="text-gray-400 mt-1">{business.industry}</p>
              <div className="flex items-center space-x-3 mt-2">
                {getStatusBadge(business.status)}
                <span className="text-sm text-gray-500">
                  Last updated: {business.lastActivity}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="border-gray-600">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="border-gray-600 text-red-400 hover:text-red-300">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </div>
        </div>
      </Section>

      {/* Tabs */}
      <Section>
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'signals', label: 'Signals', icon: Activity },
              { id: 'vault', label: 'Vault', icon: Lock },
              { id: 'snapshots', label: 'Snapshots', icon: Camera },
              { id: 'links', label: 'Links', icon: ExternalLink },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`flex items-center space-x-2 px-1 py-4 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </Section>

      {/* Tab Content */}
      <Section>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'signals' && renderSignals()}
        {activeTab === 'vault' && renderVault()}
        {activeTab === 'snapshots' && renderSnapshots()}
        {activeTab === 'links' && renderLinks()}
      </Section>
    </PageContainer>
  );
}
