'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  location?: string;
  status: 'prospect' | 'lead' | 'customer' | 'contact';
  ai_score: number;
  created_at: string;
  last_interaction?: string;
}

export default function AIDOClientsPage() {
  const { currentOrganization } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (currentOrganization?.org_id) {
      fetchClients();
    }
  }, [currentOrganization]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { supabaseBrowser } = await import('@/lib/supabase');
      const session = await supabaseBrowser.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        workspaceId: currentOrganization!.org_id,
      });

      const response = await fetch(`/api/contacts?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.contacts || []);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) {
return 'text-green-600 dark:text-green-400';
}
    if (score >= 60) {
return 'text-yellow-600 dark:text-yellow-400';
}
    return 'text-text-secondary';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      prospect: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      lead: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      customer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      contact: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[status as keyof typeof colors] || colors.contact;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold">Client Profiles</h1>
        </div>
        <p className="text-text-secondary">
          AI-powered client intelligence and relationship management
        </p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search clients by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'prospect' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('prospect')}
                size="sm"
              >
                Prospects
              </Button>
              <Button
                variant={filterStatus === 'lead' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('lead')}
                size="sm"
              >
                Leads
              </Button>
              <Button
                variant={filterStatus === 'customer' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('customer')}
                size="sm"
              >
                Customers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Prospects</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'prospect').length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Leads</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'lead').length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Customers</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'customer').length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading clients...</p>
          </CardContent>
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No clients found</p>
            {searchQuery && (
              <Button
                variant="link"
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    {client.company && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" />
                        {client.company}
                      </CardDescription>
                    )}
                  </div>
                  <Badge className={getStatusBadge(client.status)}>
                    {client.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* AI Score */}
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm text-text-secondary">AI Score</span>
                    <span className={`text-lg font-bold ${getScoreColor(client.ai_score)}`}>
                      {client.ai_score}/100
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Phone className="w-4 h-4" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.location && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <MapPin className="w-4 h-4" />
                        <span>{client.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Interaction */}
                  {client.last_interaction && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                      <Calendar className="w-3 h-3" />
                      <span>Last contact: {new Date(client.last_interaction).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3">
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-3 h-3 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
