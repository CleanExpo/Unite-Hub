'use client';

/**
 * Pre-Clients Dashboard
 *
 * Founder view for managing pre-system client profiles discovered from historical emails.
 * Part of the Client Historical Email Identity Engine.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Mail,
  Search,
  Plus,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  UserPlus,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

interface PreClient {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: string;
  totalThreads: number;
  totalMessages: number;
  firstContactDate?: string;
  lastContactDate?: string;
  sentimentScore?: number;
  engagementLevel: string;
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byEngagement: Record<string, number>;
}

export default function PreClientsPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId') || '';

  const [preClients, setPreClients] = useState<PreClient[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, byStatus: {}, byEngagement: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [engagementFilter, setEngagementFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', company: '' });

  const fetchPreClients = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({ workspaceId });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (engagementFilter !== 'all') params.append('engagement', engagementFilter);

      const response = await fetch(`/api/pre-clients?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPreClients(data.profiles);

        // Calculate stats
        const byStatus: Record<string, number> = {};
        const byEngagement: Record<string, number> = {};

        data.profiles.forEach((p: PreClient) => {
          byStatus[p.status] = (byStatus[p.status] || 0) + 1;
          byEngagement[p.engagementLevel] = (byEngagement[p.engagementLevel] || 0) + 1;
        });

        setStats({
          total: data.total,
          byStatus,
          byEngagement,
        });
      }
    } catch (error) {
      console.error('Failed to fetch pre-clients:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, search, statusFilter, engagementFilter]);

  useEffect(() => {
    fetchPreClients();
  }, [fetchPreClients]);

  const handleCreate = async () => {
    if (!workspaceId || !newClient.name || !newClient.email) return;

    try {
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/pre-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          action: 'create',
          ...newClient,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateDialog(false);
        setNewClient({ name: '', email: '', company: '' });
        fetchPreClients();
      }
    } catch (error) {
      console.error('Failed to create pre-client:', error);
    } finally {
      setCreating(false);
    }
  };

  const getEngagementBadge = (level: string) => {
    const colors: Record<string, string> = {
      cold: 'bg-blue-100 text-blue-800',
      warm: 'bg-yellow-100 text-yellow-800',
      hot: 'bg-orange-100 text-orange-800',
      active: 'bg-green-100 text-green-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      discovered: 'bg-purple-100 text-purple-800',
      ingesting: 'bg-blue-100 text-blue-800',
      analyzed: 'bg-green-100 text-green-800',
      converted: 'bg-emerald-100 text-emerald-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSentimentColor = (score?: number) => {
    if (score === undefined) return 'text-gray-400';
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pre-Clients</h1>
          <p className="text-muted-foreground">
            Client profiles discovered from historical email conversations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPreClients} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Pre-Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Pre-Client</DialogTitle>
                <DialogDescription>
                  Manually add a pre-client profile to track historical communications.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company (optional)</Label>
                  <Input
                    id="company"
                    value={newClient.company}
                    onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating || !newClient.name || !newClient.email}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pre-Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byEngagement?.hot || 0) + (stats.byEngagement?.active || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyzed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStatus?.analyzed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Ingestion</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byStatus?.discovered || 0) + (stats.byStatus?.ingesting || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-Client List</CardTitle>
          <CardDescription>
            View and manage pre-system client profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="discovered">Discovered</SelectItem>
                <SelectItem value="ingesting">Ingesting</SelectItem>
                <SelectItem value="analyzed">Analyzed</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={engagementFilter} onValueChange={setEngagementFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Engagement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engagement</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="text-center">Messages</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : preClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No pre-clients found</p>
                        <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add your first pre-client
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  preClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.company ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span>{client.company}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(client.status)}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEngagementBadge(client.engagementLevel)}>
                          {client.engagementLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-medium">{client.totalMessages}</span>
                          <span className="text-muted-foreground text-xs">
                            ({client.totalThreads} threads)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(client.lastContactDate)}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${getSentimentColor(client.sentimentScore)}`}>
                          {client.sentimentScore !== undefined
                            ? `${Math.round(client.sentimentScore * 100)}%`
                            : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/founder/pre-clients/${client.id}?workspaceId=${workspaceId}`}
                          >
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {client.status === 'analyzed' && (
                            <Button variant="ghost" size="sm" title="Convert to Contact">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
