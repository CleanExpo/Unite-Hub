'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import type { UserAgency } from '@/lib/tenancy';

export default function AgencySwitcherPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [agencies, setAgencies] = useState<UserAgency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAgencies = useCallback(async () => {
    if (!session?.access_token) {
return;
}

    try {
      const response = await fetch('/api/agency/switch', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgencies(data.tenants || []);
      }
    } catch (error) {
      console.error('Failed to fetch agencies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleSwitch = async (agencyId: string) => {
    if (!session?.access_token) {
return;
}

    try {
      const response = await fetch('/api/agency/switch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId: agencyId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store current tenant in localStorage
        localStorage.setItem('currentTenantId', agencyId);
        localStorage.setItem('currentTenantContext', JSON.stringify(data.context));
        router.push(`/founder/agency/${agencyId}/dashboard`);
      }
    } catch (error) {
      console.error('Failed to switch agency:', error);
    }
  };

  const handleCreate = async () => {
    if (!session?.access_token || !newName || !newSlug) {
return;
}

    setCreating(true);
    try {
      const response = await fetch('/api/agency/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAgencies(prev => [...prev, {
          agencyId: data.agency.id,
          agencyName: data.agency.name,
          agencySlug: data.agency.slug,
          role: 'owner',
          isActive: true,
        }]);
        setShowCreate(false);
        setNewName('');
        setNewSlug('');
      }
    } catch (error) {
      console.error('Failed to create agency:', error);
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-500',
      manager: 'bg-blue-500',
      staff: 'bg-green-500',
      client: 'bg-gray-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading agencies...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Your Agencies</h1>
            <p className="text-muted-foreground">
              Select an agency to manage or create a new one
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-2" />
          New Agency
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Agency</CardTitle>
            <CardDescription>
              Set up a new agency tenant for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agency Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Agency"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="my-agency"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating || !newName || !newSlug}>
                {creating ? 'Creating...' : 'Create Agency'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agencies.map((agency) => (
          <Card
            key={agency.agencyId}
            className={`cursor-pointer transition-colors hover:bg-accent ${!agency.isActive ? 'opacity-50' : ''}`}
            onClick={() => agency.isActive && handleSwitch(agency.agencyId)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{agency.agencyName}</h3>
                  <p className="text-sm text-muted-foreground">
                    /{agency.agencySlug}
                  </p>
                </div>
                <Badge className={getRoleBadge(agency.role)}>
                  {agency.role}
                </Badge>
              </div>
              <div className="flex items-center justify-end mt-4">
                {agency.isActive ? (
                  <Button variant="ghost" size="sm">
                    Open <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">Inactive</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agencies.length === 0 && !showCreate && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Agencies Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first agency to get started
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Agency
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
