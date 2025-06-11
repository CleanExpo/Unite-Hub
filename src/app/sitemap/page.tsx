'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null> 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <Home className="h-4 w-4" /> 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <FileText className="h-4 w-4" /> 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" /> 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <div key={node.name} className={`${level > 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p> 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link> 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link> 'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Home, FileText, Globe, Calendar } from 'lucide-react';
import Link from 'next/link';

interface SitemapNode {
  name: string;
  url?: string;
  lastModified?: string;
  priority?: number;
  children?: SitemapNode[];
}

export default function SitemapPage() {
  const [sitemap, setSitemap] = useState<SitemapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const response = await fetch('/api/sitemap/visual');
      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Failed to fetch sitemap:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'home':
        return <Home className="h-4 w-4" />;
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'services':
        return <Globe className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderSitemapNode = (node: SitemapNode, level: number = 0) => {
    const isCategory = !node.url;

    if (isCategory && node.children) {
      return (
        <div key={node.name} className={`${level > 0 ? 'ml-6' : ''} mb-6`}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {getCategoryIcon(node.name)}
            {node.name}
          </h3>
          <div className="grid gap-2">
            {node.children.map(child => renderSitemapNode(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.url || node.name}
        className={`${level > 1 ? 'ml-6' : ''} p-3 rounded-lg border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {node.url ? (
              <Link
                href={node.url.replace(window.location.origin, '')}
                className="text-blue-600 hover:underline font-medium"
              >
                {node.name}
              </Link>
            ) : (
              <span className="font-medium">{node.name}</span>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              {node.lastModified && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(node.lastModified)}
                </span>
              )}
              {node.priority !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Priority: {node.priority}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Site Map</h1>
          <p className="text-muted-foreground text-lg">
            Navigate through all pages and resources available on Unite Group
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page Directory</CardTitle>
            <CardDescription>
              All public pages organized by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : sitemap ? (
              <div className="space-y-6">
                {sitemap.children?.map(category => 
                  renderSitemapNode(category)
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Unable to load sitemap. Please try again later.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Looking for something specific?{' '}
            <Link href="/search" className="text-blue-600 hover:underline">
              Use our search
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact us
            </Link>{' '}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
.Value -replace "'", "'" </p>
        </div>
      </div>
    </div>
  );
}
