'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Warehouse,
  Users,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

interface ERPModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  features: string[];
}

const ERP_MODULES: ERPModule[] = [
  {
    id: 'dashboard',
    title: 'Analytics Dashboard',
    description: 'Real-time business intelligence and key metrics',
    icon: LayoutDashboard,
    href: '/erp/dashboard',
    color: 'bg-blue-500',
    features: [
      '20+ key business metrics',
      'Low stock alerts',
      'Pending orders tracking',
      'Recent activity feed',
    ],
  },
  {
    id: 'invoicing',
    title: 'Invoicing',
    description: 'Customer management, invoicing, and payment tracking',
    icon: FileText,
    href: '/erp/invoicing',
    color: 'bg-green-500',
    features: [
      'Customer profiles',
      'Invoice generation',
      'Payment tracking',
      'Australian GST compliance',
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    description: 'Multi-warehouse stock tracking and valuation',
    icon: Package,
    href: '/erp/inventory',
    color: 'bg-purple-500',
    features: [
      'Multi-warehouse support',
      'Stock movements',
      'Weighted average costing',
      'Reorder point alerts',
    ],
  },
  {
    id: 'purchase-orders',
    title: 'Purchase Orders',
    description: 'Supplier ordering and stock receiving',
    icon: ShoppingCart,
    href: '/erp/purchase-orders',
    color: 'bg-orange-500',
    features: [
      'Supplier management',
      'PO workflow',
      'Stock receiving',
      'Cost tracking',
    ],
  },
  {
    id: 'sales-orders',
    title: 'Sales Orders',
    description: 'Customer orders and fulfillment',
    icon: TrendingUp,
    href: '/erp/sales-orders',
    color: 'bg-indigo-500',
    features: [
      'Order management',
      'Stock allocation',
      'Shipment tracking',
      'Fulfillment workflow',
    ],
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'Comprehensive business reporting',
    icon: BarChart3,
    href: '/erp/reports',
    color: 'bg-pink-500',
    features: [
      '8 report types',
      'Period-based analysis',
      'Customer/product insights',
      'Financial reporting',
    ],
  },
];

const QUICK_STATS = [
  {
    label: 'Modules',
    value: '6',
    icon: LayoutDashboard,
    color: 'text-blue-600',
  },
  {
    label: 'Customers',
    value: '150+',
    icon: Users,
    color: 'text-green-600',
  },
  {
    label: 'Products',
    value: '500+',
    icon: Package,
    color: 'text-purple-600',
  },
  {
    label: 'Revenue',
    value: '$1.2M',
    icon: DollarSign,
    color: 'text-orange-600',
  },
];

export default function ERPHomePage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">ERP System</h1>
        <p className="text-xl text-muted-foreground">
          Complete business management suite for inventory, sales, and operations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {QUICK_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Unite-Hub ERP provides end-to-end business management with Australian tax compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Multi-Warehouse</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Track stock across multiple locations with real-time visibility
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Australian Tax Compliance</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Built-in 10% GST calculations for all invoicing and orders
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Business Intelligence</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time dashboards and comprehensive reporting suite
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ERP Modules */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">ERP Modules</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ERP_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${module.color} bg-opacity-10`}>
                      <Icon className={`h-6 w-6 ${module.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {module.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={module.href}>
                    <Button className="w-full" variant="outline">
                      Open Module
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/erp/sales-orders">
                <TrendingUp className="mr-2 h-4 w-4" />
                Create Sales Order
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/erp/purchase-orders">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Purchase Order
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/erp/invoicing">
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/erp/inventory">
                <Package className="mr-2 h-4 w-4" />
                Check Stock Levels
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/erp/reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Report
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/erp/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="border-t pt-6 text-center text-sm text-muted-foreground">
        <p>Unite-Hub ERP v1.0 • Complete business management suite</p>
        <p className="mt-1">6 integrated modules • Australian tax compliant • Multi-warehouse support</p>
      </div>
    </div>
  );
}
