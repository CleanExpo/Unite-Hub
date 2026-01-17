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
    if (score >= 80) {
return 'text-success-400';
}
    if (score >= 60) {
return 'text-warning-400';
}
    return 'text-error-400';
  };

  const getStatusBadge = (status: Business['status']) => {
    const colors = {
      healthy: 'bg-success-500/20 text-success-400 border-success-500/30',
      attention: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      critical: 'bg-error-500/20 text-error-400 border-error-500/30',
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
    if (type === 'positive') {
return <TrendingUp className="w-5 h-5 text-success-400" />;
}
    if (type === 'negative') {
return <TrendingDown className="w-5 h-5 text-error-400" />;
}
    return <Activity className="w-5 h-5 text-text-muted" />;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <Card className="bg-bg-card/50 border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Business Information</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted">Description</p>
            <p className="text-text-primary mt-1">{business?.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-muted">Industry</p>
              <p className="text-text-primary mt-1">{business?.industry}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Created</p>
              <p className="text-text-primary mt-1">{business?.createdAt}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-bg-card/50 border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-muted">Health Score</h4>
            <Activity className="w-5 h-5 text-text-muted" />
          </div>
          <p className={`text-3xl font-bold ${getHealthColor(business?.healthScore || 0)}`}>
            {business?.healthScore}/100
          </p>
          <div className="w-full bg-bg-raised rounded-full h-2 mt-4">
            <div
              className={`h-2 rounded-full ${
                (business?.healthScore || 0) >= 80
                  ? 'bg-success-500'
                  : (business?.healthScore || 0) >= 60
                  ? 'bg-warning-500'
                  : 'bg-error-500'
              }`}
              style={{ width: `${business?.healthScore || 0}%` }}
            />
          </div>
        </Card>

        <Card className="bg-bg-card/50 border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-muted">Recent Signals</h4>
            <TrendingUp className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-3xl font-bold text-text-primary">{signals.length}</p>
          <p className="text-sm text-text-muted mt-2">Last 7 days</p>
        </Card>

        <Card className="bg-bg-card/50 border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-muted">Last Activity</h4>
            <AlertCircle className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-lg font-semibold text-text-primary">{business?.lastActivity}</p>
          <p className="text-sm text-text-muted mt-2">System updated</p>
        </Card>
      </div>
    </div>
  );

  const renderSignals = () => (
    <Card className="bg-bg-card/50 border-border">
      <div className="divide-y divide-border">
        {signals.map((signal) => (
          <div key={signal.id} className="p-4 hover:bg-bg-card/30 transition-colors">
            <div className="flex items-start space-x-3">
              {getSignalIcon(signal.type)}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-text-primary">{signal.title}</h4>
                <p className="text-sm text-text-muted mt-1">{signal.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-text-muted">{signal.source}</span>
                  <span className="text-xs text-text-muted">{signal.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderVault = () => (
    <Card className="bg-bg-card/50 border-border p-12 text-center">
      <Lock className="w-16 h-16 text-text-muted mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text-primary mb-2">Secure Vault</h3>
      <p className="text-text-muted mb-6">
        Store passwords, API keys, and sensitive credentials for this business
      </p>
      <Button className="bg-info-600 hover:bg-info-700">Add Credential</Button>
    </Card>
  );

  const renderSnapshots = () => (
    <Card className="bg-bg-card/50 border-border p-12 text-center">
      <Camera className="w-16 h-16 text-text-muted mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-text-primary mb-2">Business Snapshots</h3>
      <p className="text-text-muted mb-6">
        Visual timeline of your business evolution with metrics and milestones
      </p>
      <Button className="bg-info-600 hover:bg-info-700">Create Snapshot</Button>
    </Card>
  );

  const renderLinks = () => (
    <div className="space-y-4">
      {business?.links.website && (
        <Card className="bg-bg-card/50 border-border p-4">
          <a
            href={business.links.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-bg-card/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Website</p>
                <p className="text-xs text-text-muted">{business.links.website}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-text-muted" />
          </a>
        </Card>
      )}

      {business?.links.linkedIn && (
        <Card className="bg-bg-card/50 border-border p-4">
          <a
            href={business.links.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-bg-card/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Linkedin className="w-5 h-5 text-info-400" />
              <div>
                <p className="text-sm font-semibold text-text-primary">LinkedIn</p>
                <p className="text-xs text-text-muted">{business.links.linkedIn}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-text-muted" />
          </a>
        </Card>
      )}

      {business?.links.facebook && (
        <Card className="bg-bg-card/50 border-border p-4">
          <a
            href={business.links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-bg-card/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Facebook className="w-5 h-5 text-info-500" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Facebook</p>
                <p className="text-xs text-text-muted">{business.links.facebook}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-text-muted" />
          </a>
        </Card>
      )}

      {business?.links.instagram && (
        <Card className="bg-bg-card/50 border-border p-4">
          <a
            href={business.links.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-bg-card/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Instagram className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Instagram</p>
                <p className="text-xs text-text-muted">{business.links.instagram}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-text-muted" />
          </a>
        </Card>
      )}

      {business?.links.twitter && (
        <Card className="bg-bg-card/50 border-border p-4">
          <a
            href={business.links.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between hover:bg-bg-card/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Twitter className="w-5 h-5 text-info-400" />
              <div>
                <p className="text-sm font-semibold text-text-primary">X (Twitter)</p>
                <p className="text-xs text-text-muted">{business.links.twitter}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-text-muted" />
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-500" />
          </div>
        </Section>
      </PageContainer>
    );
  }

  if (!business) {
    return (
      <PageContainer>
        <Section>
          <Card className="bg-bg-card/50 border-border p-12 text-center">
            <AlertCircle className="w-16 h-16 text-error-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">Business not found</h3>
            <p className="text-text-muted mb-6">
              The business you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push('/founder/businesses')}
              className="bg-info-600 hover:bg-info-700"
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
            <div className="w-16 h-16 bg-gradient-to-br from-info-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{business.name}</h1>
              <p className="text-text-muted mt-1">{business.industry}</p>
              <div className="flex items-center space-x-3 mt-2">
                {getStatusBadge(business.status)}
                <span className="text-sm text-text-muted">
                  Last updated: {business.lastActivity}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="border-border">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="border-border text-error-400 hover:text-error-300">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </div>
        </div>
      </Section>

      {/* Tabs */}
      <Section>
        <div className="border-b border-border">
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
                    ? 'border-info-500 text-info-400'
                    : 'border-transparent text-text-muted hover:text-text-secondary'
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
