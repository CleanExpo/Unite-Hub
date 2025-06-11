"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  website?: string;
  phone?: string;
  email?: string;
  employees: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const router = useRouter();

  useEffect(() => {
    // Mock data loading
    const loadOrganizations = async () => {
      try {
        setLoading(true);
        
        // Mock organizations data
        const mockOrganizations: Organization[] = [
          {
            id: '1',
            name: 'Tech Innovations Inc.',
            description: 'Leading technology solutions provider',
            industry: 'Technology',
            size: 'Large',
            location: 'San Francisco, CA',
            website: 'https://techinnovations.com',
            phone: '+1 (555) 123-4567',
            email: 'contact@techinnovations.com',
            employees: 500,
            status: 'active',
            createdAt: '2024-01-15'
          },
          {
            id: '2',
            name: 'Green Energy Solutions',
            description: 'Sustainable energy consulting and implementation',
            industry: 'Energy',
            size: 'Medium',
            location: 'Austin, TX',
            website: 'https://greenenergy.com',
            phone: '+1 (555) 987-6543',
            email: 'info@greenenergy.com',
            employees: 150,
            status: 'active',
            createdAt: '2024-02-01'
          },
          {
            id: '3',
            name: 'Healthcare Partners LLC',
            description: 'Healthcare management and consulting services',
            industry: 'Healthcare',
            size: 'Large',
            location: 'Boston, MA',
            website: 'https://healthcarepartners.com',
            phone: '+1 (555) 456-7890',
            email: 'contact@healthcarepartners.com',
            employees: 750,
            status: 'active',
            createdAt: '2024-01-20'
          },
          {
            id: '4',
            name: 'StartupXYZ',
            description: 'Innovative fintech startup',
            industry: 'Financial Services',
            size: 'Small',
            location: 'New York, NY',
            website: 'https://startupxyz.com',
            phone: '+1 (555) 321-0987',
            email: 'hello@startupxyz.com',
            employees: 25,
            status: 'pending',
            createdAt: '2024-02-10'
          }
        ];

        setOrganizations(mockOrganizations);
      } catch (error) {
        console.error('Failed to load organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getSizeBadge = (size: string) => {
    switch (size) {
      case 'Small':
        return <Badge variant="outline" className="text-blue-600">Small (1-50)</Badge>;
      case 'Medium':
        return <Badge variant="outline" className="text-green-600">Medium (51-250)</Badge>;
      case 'Large':
        return <Badge variant="outline" className="text-purple-600">Large (250+)</Badge>;
      default:
        return <Badge variant="outline">{size}</Badge>;
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === 'all' || org.industry === selectedIndustry;
    const matchesSize = selectedSize === 'all' || org.size === selectedSize;
    
    return matchesSearch && matchesIndustry && matchesSize;
  });

  const industries = [...new Set(organizations.map(org => org.industry))];
  const sizes = [...new Set(organizations.map(org => org.size))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage and track organizational partnerships</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">All registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(org => org.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + org.employees, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{industries.length}</div>
            <p className="text-xs text-muted-foreground">Different sectors</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1 text-sm w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Industry:</span>
              <select 
                value={selectedIndustry} 
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Size:</span>
              <select 
                value={selectedSize} 
                onChange={(e) => setSelectedSize(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Sizes</option>
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      <div className="grid gap-6">
        {filteredOrganizations.map((organization) => (
          <Card key={organization.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">{organization.name}</CardTitle>
                  <CardDescription>{organization.description}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  {getStatusBadge(organization.status)}
                  {getSizeBadge(organization.size)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{organization.industry}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{organization.location}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{organization.employees.toLocaleString()} employees</span>
                </div>
                
                {organization.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{organization.phone}</span>
                  </div>
                )}
                
                {organization.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{organization.email}</span>
                  </div>
                )}
                
                {organization.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 mt-6">
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrganizations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No organizations found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
