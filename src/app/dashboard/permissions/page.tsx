'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRole, usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Permission {
  id: string;
  name: string;
  description: string;
  business_unit: string | null;
  resource: string;
  action: string;
}

const BUSINESS_UNITS = ['CARSI', 'Website Builder', 'Directory', 'AGI Builder', 'Oz-Invoice'];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useRole();
  const { hasPermission } = usePermissions(user);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/permissions');
      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }
      const data = await response.json();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesBusinessUnit = selectedBusinessUnit === 'all' || 
      permission.business_unit === selectedBusinessUnit ||
      (selectedBusinessUnit === 'system' && !permission.business_unit);
    
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesBusinessUnit && matchesSearch;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const key = permission.business_unit || 'System';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasPermission('system.permissions.view')) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Permission Management</h1>
        
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={selectedBusinessUnit} onValueChange={setSelectedBusinessUnit}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select business unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              <SelectItem value="system">System</SelectItem>
              {BUSINESS_UNITS.map(unit => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([businessUnit, permissions]) => (
          <Card key={businessUnit}>
            <CardHeader>
              <CardTitle>{businessUnit}</CardTitle>
              <CardDescription>
                {permissions.length} permissions in this unit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {permissions.map(permission => (
                  <div key={permission.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {permission.name}
                        </code>
                        <Badge variant="outline">{permission.action}</Badge>
                        {permission.resource && (
                          <Badge variant="secondary">{permission.resource}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
