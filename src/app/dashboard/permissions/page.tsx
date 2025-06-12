'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRole, usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Settings, 
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  granted: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface BusinessUnit {
  id: string;
  name: string;
  description: string;
  roles: string[];
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('all');

  useEffect(() => {
    // Mock data loading
    const loadPermissionsData = async () => {
      try {
        setLoading(true);

        // Mock permissions
        setPermissions([
          {
            id: '1',
            name: 'View Clients',
            description: 'Can view client information',
            resource: 'clients',
            action: 'read',
            granted: true
          },
          {
            id: '2',
            name: 'Edit Clients',
            description: 'Can modify client information',
            resource: 'clients',
            action: 'write',
            granted: true
          },
          {
            id: '3',
            name: 'Delete Clients',
            description: 'Can delete client records',
            resource: 'clients',
            action: 'delete',
            granted: false
          },
          {
            id: '4',
            name: 'View Projects',
            description: 'Can view project information',
            resource: 'projects',
            action: 'read',
            granted: true
          },
          {
            id: '5',
            name: 'Manage Billing',
            description: 'Can access billing and invoicing',
            resource: 'billing',
            action: 'manage',
            granted: false
          }
        ]);

        // Mock roles
        setRoles([
          {
            id: '1',
            name: 'Admin',
            description: 'Full system access',
            permissions: ['1', '2', '3', '4', '5'],
            userCount: 3
          },
          {
            id: '2',
            name: 'Manager',
            description: 'Management level access',
            permissions: ['1', '2', '4', '5'],
            userCount: 8
          },
          {
            id: '3',
            name: 'Employee',
            description: 'Standard employee access',
            permissions: ['1', '4'],
            userCount: 25
          },
          {
            id: '4',
            name: 'Client',
            description: 'Client portal access',
            permissions: ['1'],
            userCount: 150
          }
        ]);

        // Mock business units
        setBusinessUnits([
          {
            id: '1',
            name: 'Sales',
            description: 'Sales and customer relations',
            roles: ['2', '3']
          },
          {
            id: '2',
            name: 'Development',
            description: 'Software development team',
            roles: ['2', '3']
          },
          {
            id: '3',
            name: 'Finance',
            description: 'Financial operations',
            roles: ['1', '2']
          }
        ]);

      } catch (error) {
        console.error('Failed to load permissions data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissionsData();
  }, []);

  const getPermissionBadge = (granted: boolean) => {
    return granted ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Granted
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <Lock className="h-3 w-3 mr-1" />
        Denied
      </Badge>
    );
  };

  const getRolePermissions = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return [];
    
    return permissions.filter(p => role.permissions.includes(p.id));
  };

  const filteredBusinessUnits = selectedBusinessUnit === 'all' 
    ? businessUnits 
    : businessUnits.filter(bu => bu.id === selectedBusinessUnit);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Permissions & Access Control
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage user roles, permissions, and access levels
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
          <Button>
            <Shield className="h-4 w-4 mr-2" />
            Security Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="business-units">Business Units</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roles.length}</div>
                <p className="text-xs text-muted-foreground">Active roles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {roles.reduce((sum, role) => sum + role.userCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all roles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{permissions.length}</div>
                <p className="text-xs text-muted-foreground">Available permissions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Business Units</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{businessUnits.length}</div>
                <p className="text-xs text-muted-foreground">Organizational units</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Permission Changes</CardTitle>
              <CardDescription>Latest updates to roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Manager role updated</p>
                    <p className="text-xs text-gray-500">Added billing management permission</p>
                  </div>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New user assigned to Employee role</p>
                    <p className="text-xs text-gray-500">John Smith added to Development team</p>
                  </div>
                  <span className="text-xs text-gray-400">5 hours ago</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Permission denied for Client role</p>
                    <p className="text-xs text-gray-500">Removed project editing access</p>
                  </div>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Manage user roles and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{role.name}</h3>
                      <p className="text-sm text-gray-600">{role.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {role.userCount} users
                        </span>
                        <span className="text-xs text-gray-500">
                          {role.permissions.length} permissions
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
              <CardDescription>Available permissions and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{permission.name}</h3>
                      <p className="text-sm text-gray-600">{permission.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {permission.resource}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {permission.action}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPermissionBadge(permission.granted)}
                      <Button variant="outline" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-units" className="space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <label className="text-sm font-medium">Filter by Business Unit:</label>
            <select 
              value={selectedBusinessUnit} 
              onChange={(e) => setSelectedBusinessUnit(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="all">All Units</option>
              {businessUnits.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-6">
            {filteredBusinessUnits.map((unit) => (
              <Card key={unit.id}>
                <CardHeader>
                  <CardTitle>{unit.name}</CardTitle>
                  <CardDescription>{unit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Assigned Roles:</h4>
                      <div className="flex flex-wrap gap-2">
                        {unit.roles.map(roleId => {
                          const role = roles.find(r => r.id === roleId);
                          return role ? (
                            <Badge key={roleId} variant="outline">
                              {role.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Total Users:</h4>
                      <p className="text-sm text-gray-600">
                        {unit.roles.reduce((sum, roleId) => {
                          const role = roles.find(r => r.id === roleId);
                          return sum + (role ? role.userCount : 0);
                        }, 0)} users across all roles
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Users className="h-3 w-3 mr-1" />
                        Manage Users
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
