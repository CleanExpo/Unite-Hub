'use client';

/**
 * Synthex Agency Control Panel
 * Phase B32: Agency Multi-Workspace + Brand Switcher
 *
 * Allows agencies to manage multiple client workspaces from a single view
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  Globe,
  TrendingUp,
  Activity,
  RefreshCw,
  Plus,
  Search,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  Archive,
  ArrowRightLeft,
} from 'lucide-react';

interface AgencyWithStats {
  agency_id: string;
  agency_name: string;
  role: string;
  client_count: number;
  active_client_count: number;
}

interface ClientSummary {
  tenant_id: string;
  label: string;
  primary_domain?: string;
  status: string;
  seo_health_score?: number;
  active_campaigns?: number;
  audience_size?: number;
  leads_this_month?: number;
  risk_indicators?: string[];
}

interface PortfolioSummary {
  agency_id: string;
  agency_name: string;
  total_clients: number;
  active_clients: number;
  clients: ClientSummary[];
  aggregate_stats: {
    total_audience: number;
    total_campaigns: number;
    total_leads: number;
    avg_seo_health: number;
  };
}

export default function AgencyPage() {
  const [agencies, setAgencies] = useState<AgencyWithStats[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newClientLabel, setNewClientLabel] = useState('');
  const [newClientDomain, setNewClientDomain] = useState('');
  const [newClientTenantId, setNewClientTenantId] = useState('');

  useEffect(() => {
    fetchAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgency) {
      fetchPortfolio(selectedAgency);
    }
  }, [selectedAgency]);

  const fetchAgencies = async () => {
    try {
      const res = await fetch('/api/synthex/agency');
      const data = await res.json();
      if (data.agencies) {
        setAgencies(data.agencies);
        if (data.agencies.length > 0 && !selectedAgency) {
          setSelectedAgency(data.agencies[0].agency_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async (agencyId: string) => {
    try {
      const res = await fetch(`/api/synthex/agency?action=portfolio&agencyId=${agencyId}`);
      const data = await res.json();
      if (data.portfolio) {
        setPortfolio(data.portfolio);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  const createAgency = async () => {
    if (!newAgencyName.trim()) return;

    try {
      const res = await fetch('/api/synthex/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAgencyName }),
      });
      const data = await res.json();
      if (data.agency) {
        setNewAgencyName('');
        fetchAgencies();
      }
    } catch (error) {
      console.error('Failed to create agency:', error);
    }
  };

  const addClient = async () => {
    if (!selectedAgency || !newClientLabel.trim() || !newClientTenantId.trim()) return;

    try {
      const res = await fetch('/api/synthex/agency/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: selectedAgency,
          tenant_id: newClientTenantId,
          label: newClientLabel,
          domain: newClientDomain,
        }),
      });
      const data = await res.json();
      if (data.client) {
        setNewClientLabel('');
        setNewClientDomain('');
        setNewClientTenantId('');
        fetchPortfolio(selectedAgency);
      }
    } catch (error) {
      console.error('Failed to add client:', error);
    }
  };

  const switchToTenant = async (tenantId: string) => {
    setSwitchingTo(tenantId);
    try {
      const res = await fetch('/api/synthex/agency/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          agency_id: selectedAgency,
        }),
      });
      const data = await res.json();
      if (data.active_tenant) {
        // Refresh the page or update context
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    } finally {
      setSwitchingTo(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-zinc-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      archived: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    };
    return variants[status] || variants.active;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Building2 className="h-8 w-8 text-orange-500" />
              Agency Control Panel
            </h1>
            <p className="text-zinc-400 mt-1">
              Manage multiple client workspaces from a single dashboard
            </p>
          </div>

          {/* Brand Switcher Dropdown */}
          <div className="flex items-center gap-4">
            <select
              value={selectedAgency || ''}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500"
            >
              {agencies.map((agency) => (
                <option key={agency.agency_id} value={agency.agency_id}>
                  {agency.agency_name} ({agency.active_client_count} active)
                </option>
              ))}
            </select>
            <Button
              onClick={() => fetchPortfolio(selectedAgency!)}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Aggregate Stats */}
        {portfolio && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Audience</p>
                    <p className="text-2xl font-bold text-white">
                      {portfolio.aggregate_stats.total_audience.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Target className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Active Campaigns</p>
                    <p className="text-2xl font-bold text-white">
                      {portfolio.aggregate_stats.total_campaigns}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Leads This Month</p>
                    <p className="text-2xl font-bold text-white">
                      {portfolio.aggregate_stats.total_leads}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Avg SEO Health</p>
                    <p className="text-2xl font-bold text-white">
                      {portfolio.aggregate_stats.avg_seo_health}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-800 border border-zinc-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">
              Overview
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-orange-500">
              Clients
            </TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-orange-500">
              Add New
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Cards */}
              {portfolio?.clients.map((client) => (
                <Card key={client.tenant_id} className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(client.status)}
                        <div>
                          <CardTitle className="text-white text-lg">{client.label}</CardTitle>
                          {client.primary_domain && (
                            <CardDescription className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {client.primary_domain}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusBadge(client.status)}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Client Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500">SEO Health</p>
                        <p className="text-xl font-semibold text-white">
                          {client.seo_health_score ?? '--'}%
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500">Campaigns</p>
                        <p className="text-xl font-semibold text-white">
                          {client.active_campaigns ?? 0}
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500">Audience</p>
                        <p className="text-xl font-semibold text-white">
                          {(client.audience_size ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500">Leads</p>
                        <p className="text-xl font-semibold text-white">
                          {client.leads_this_month ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Risk Indicators */}
                    {client.risk_indicators && client.risk_indicators.length > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-400">
                          {client.risk_indicators.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => switchToTenant(client.tenant_id)}
                        disabled={switchingTo === client.tenant_id}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {switchingTo === client.tenant_id ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowRightLeft className="h-4 w-4 mr-2" />
                        )}
                        Switch to Workspace
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Empty State */}
              {(!portfolio || portfolio.clients.length === 0) && (
                <Card className="bg-zinc-900 border-zinc-800 col-span-2">
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No clients yet</h3>
                    <p className="text-zinc-400 mb-4">
                      Add your first client to start managing their workspace
                    </p>
                    <Button
                      onClick={() => setActiveTab('add')}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Client List</CardTitle>
                <CardDescription>All clients managed by this agency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio?.clients.map((client) => (
                    <div
                      key={client.tenant_id}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(client.status)}
                        <div>
                          <p className="font-medium text-white">{client.label}</p>
                          <p className="text-sm text-zinc-400">{client.primary_domain}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">SEO: {client.seo_health_score ?? '--'}%</p>
                          <p className="text-sm text-zinc-400">{client.active_campaigns ?? 0} campaigns</p>
                        </div>
                        <Button
                          onClick={() => switchToTenant(client.tenant_id)}
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 text-zinc-300"
                        >
                          Switch
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add New Tab */}
          <TabsContent value="add" className="space-y-6">
            {/* Create Agency */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Create New Agency</CardTitle>
                <CardDescription>Set up a new agency to manage client workspaces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    placeholder="Agency name"
                    value={newAgencyName}
                    onChange={(e) => setNewAgencyName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button
                    onClick={createAgency}
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={!newAgencyName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agency
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Add Client */}
            {selectedAgency && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Add Client to Agency</CardTitle>
                  <CardDescription>Link a tenant workspace as a managed client</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Client label (e.g., 'Acme Corp')"
                      value={newClientLabel}
                      onChange={(e) => setNewClientLabel(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <Input
                      placeholder="Primary domain (e.g., acme.com)"
                      value={newClientDomain}
                      onChange={(e) => setNewClientDomain(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <Input
                    placeholder="Tenant ID (UUID)"
                    value={newClientTenantId}
                    onChange={(e) => setNewClientTenantId(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button
                    onClick={addClient}
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={!newClientLabel.trim() || !newClientTenantId.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                  <p className="text-xs text-zinc-500">
                    {/* TODO: Future phase - tenant picker dropdown instead of UUID input */}
                    Note: In a future phase, this will include a tenant picker dropdown for easier selection.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* TODO markers for future phases */}
        <div className="text-xs text-zinc-600 space-y-1">
          <p>/* TODO: B35+ Cross-client comparison reports */</p>
          <p>/* TODO: B35+ Agency-wide rollup analytics */</p>
          <p>/* TODO: B35+ Bulk actions across multiple clients */</p>
        </div>
      </div>
    </div>
  );
}
