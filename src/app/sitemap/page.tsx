'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Folder, 
  ExternalLink, 
  Download, 
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Globe,
  Calendar,
  Eye
} from 'lucide-react';

interface SitemapNode {
  id: string;
  title: string;
  url: string;
  type: 'page' | 'section' | 'external';
  lastModified: string;
  priority: number;
  changeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  children?: SitemapNode[];
  expanded?: boolean;
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    // Mock sitemap data loading
    const loadSitemap = async () => {
      try {
        setLoading(true);
        
        // Mock sitemap structure
        const mockSitemap: SitemapNode = {
          id: 'root',
          title: 'Unite Group Website',
          url: '/',
          type: 'section',
          lastModified: '2024-01-15',
          priority: 1.0,
          changeFreq: 'daily',
          expanded: true,
          children: [
            {
              id: 'home',
              title: 'Home',
              url: '/',
              type: 'page',
              lastModified: '2024-01-15',
              priority: 1.0,
              changeFreq: 'weekly'
            },
            {
              id: 'about',
              title: 'About Us',
              url: '/about-us',
              type: 'page',
              lastModified: '2024-01-10',
              priority: 0.8,
              changeFreq: 'monthly'
            },
            {
              id: 'services',
              title: 'Services',
              url: '/services',
              type: 'section',
              lastModified: '2024-01-12',
              priority: 0.9,
              changeFreq: 'weekly',
              expanded: false,
              children: [
                {
                  id: 'business-strategy',
                  title: 'Business Strategy',
                  url: '/services/business-strategy',
                  type: 'page',
                  lastModified: '2024-01-12',
                  priority: 0.8,
                  changeFreq: 'monthly'
                },
                {
                  id: 'software-development',
                  title: 'Software Development',
                  url: '/services/software-development',
                  type: 'page',
                  lastModified: '2024-01-11',
                  priority: 0.8,
                  changeFreq: 'monthly'
                },
                {
                  id: 'expert-education',
                  title: 'Expert Education',
                  url: '/services/expert-education',
                  type: 'page',
                  lastModified: '2024-01-10',
                  priority: 0.8,
                  changeFreq: 'monthly'
                },
                {
                  id: 'performance',
                  title: 'Performance Optimization',
                  url: '/services/performance',
                  type: 'page',
                  lastModified: '2024-01-09',
                  priority: 0.7,
                  changeFreq: 'monthly'
                },
                {
                  id: 'strategic-seo',
                  title: 'Strategic SEO',
                  url: '/services/strategic-seo',
                  type: 'page',
                  lastModified: '2024-01-08',
                  priority: 0.7,
                  changeFreq: 'monthly'
                }
              ]
            },
            {
              id: 'dashboard',
              title: 'Dashboard',
              url: '/dashboard',
              type: 'section',
              lastModified: '2024-01-14',
              priority: 0.6,
              changeFreq: 'daily',
              expanded: false,
              children: [
                {
                  id: 'dashboard-main',
                  title: 'Main Dashboard',
                  url: '/dashboard',
                  type: 'page',
                  lastModified: '2024-01-14',
                  priority: 0.6,
                  changeFreq: 'daily'
                },
                {
                  id: 'dashboard-crm',
                  title: 'CRM Dashboard',
                  url: '/dashboard/crm',
                  type: 'page',
                  lastModified: '2024-01-13',
                  priority: 0.5,
                  changeFreq: 'daily'
                },
                {
                  id: 'dashboard-billing',
                  title: 'Billing Dashboard',
                  url: '/dashboard/billing',
                  type: 'page',
                  lastModified: '2024-01-12',
                  priority: 0.4,
                  changeFreq: 'weekly'
                }
              ]
            },
            {
              id: 'projects',
              title: 'Projects',
              url: '/projects',
              type: 'page',
              lastModified: '2024-01-11',
              priority: 0.7,
              changeFreq: 'weekly'
            },
            {
              id: 'organizations',
              title: 'Organizations',
              url: '/organizations',
              type: 'page',
              lastModified: '2024-01-10',
              priority: 0.6,
              changeFreq: 'weekly'
            },
            {
              id: 'pricing',
              title: 'Pricing',
              url: '/pricing',
              type: 'page',
              lastModified: '2024-01-09',
              priority: 0.8,
              changeFreq: 'monthly'
            },
            {
              id: 'contact',
              title: 'Contact',
              url: '/contact',
              type: 'page',
              lastModified: '2024-01-08',
              priority: 0.7,
              changeFreq: 'monthly'
            }
          ]
        };

        setSitemap(mockSitemap);
      } catch (error) {
        console.error('Failed to load sitemap:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSitemap();
  }, []);

  const toggleExpanded = (nodeId: string) => {
    const updateNode = (node: SitemapNode): SitemapNode => {
      if (node.id === nodeId) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNode)
        };
      }
      return node;
    };

    if (sitemap) {
      setSitemap(updateNode(sitemap));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'section':
        return <Folder className="h-4 w-4" />;
      case 'external':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'section':
        return <Badge variant="outline" className="text-blue-600">Section</Badge>;
      case 'external':
        return <Badge variant="outline" className="text-purple-600">External</Badge>;
      default:
        return <Badge variant="outline" className="text-green-600">Page</Badge>;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.8) return 'text-green-600';
    if (priority >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || node.type === filterType;

    if (!matchesSearch || !matchesFilter) {
      return null;
    }

    return (
      <div key={node.id} className={`ml-${level * 4}`}>
        <Card className="mb-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {hasChildren && (
                  <button
                    onClick={() => toggleExpanded(node.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {node.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                
                <div className="flex items-center space-x-2">
                  {getTypeIcon(node.type)}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {node.title}
                    </h3>
                    <p className="text-sm text-gray-500">{node.url}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {getTypeBadge(node.type)}
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${getPriorityColor(node.priority)}`}>
                    Priority: {node.priority}
                  </div>
                  <div className="text-xs text-gray-500">
                    {node.changeFreq}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(node.lastModified).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last modified
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && node.expanded && (
          <div className="ml-6">
            {node.children?.map(child => renderSitemapNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const flattenSitemap = (node: SitemapNode): SitemapNode[] => {
    let result = [node];
    if (node.children) {
      node.children.forEach(child => {
        result = result.concat(flattenSitemap(child));
      });
    }
    return result;
  };

  const getSitemapStats = () => {
    if (!sitemap) return { total: 0, pages: 0, sections: 0, external: 0 };
    
    const allNodes = flattenSitemap(sitemap);
    return {
      total: allNodes.length - 1, // Exclude root
      pages: allNodes.filter(n => n.type === 'page').length,
      sections: allNodes.filter(n => n.type === 'section').length - 1, // Exclude root
      external: allNodes.filter(n => n.type === 'external').length
    };
  };

  const stats = getSitemapStats();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Website Sitemap</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete structure and navigation of the Unite Group website
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export XML
          </Button>
          <Button variant="outline">
            <Globe className="h-4 w-4 mr-2" />
            View Live
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All site pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pages}</div>
            <p className="text-xs text-muted-foreground">Individual pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sections</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sections}</div>
            <p className="text-xs text-muted-foreground">Page sections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground">Sitemap refresh</p>
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
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1 text-sm w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Type:</span>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Types</option>
                <option value="page">Pages</option>
                <option value="section">Sections</option>
                <option value="external">External</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sitemap Tree */}
      <div className="space-y-2">
        {sitemap && renderSitemapNode(sitemap)}
      </div>

      {/* SEO Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>SEO Information</CardTitle>
          <CardDescription>
            Sitemap optimization details for search engines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">XML Sitemap</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Automatically generated XML sitemap for search engines
              </p>
              <Button variant="outline" size="sm">
                <Download className="h-3 w-3 mr-1" />
                Download XML
              </Button>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Priority Distribution</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>High Priority (0.8-1.0)</span>
                  <span className="text-green-600">
                    {flattenSitemap(sitemap || {} as SitemapNode).filter(n => n.priority >= 0.8).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Medium Priority (0.5-0.7)</span>
                  <span className="text-yellow-600">
                    {flattenSitemap(sitemap || {} as SitemapNode).filter(n => n.priority >= 0.5 && n.priority < 0.8).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Low Priority (0.1-0.4)</span>
                  <span className="text-red-600">
                    {flattenSitemap(sitemap || {} as SitemapNode).filter(n => n.priority < 0.5).length}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Update Frequency</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Daily</span>
                  <span>{flattenSitemap(sitemap || {} as SitemapNode).filter(n => n.changeFreq === 'daily').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly</span>
                  <span>{flattenSitemap(sitemap || {} as SitemapNode).filter(n => n.changeFreq === 'weekly').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly</span>
                  <span>{flattenSitemap(sitemap || {} as SitemapNode).filter(n => n.changeFreq === 'monthly').length}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
