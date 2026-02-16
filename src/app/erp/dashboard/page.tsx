'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Package,
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  FileText,
  DollarSign,
  Activity,
  Clock,
} from 'lucide-react';

interface DashboardMetrics {
  total_customers: number;
  total_products: number;
  total_warehouses: number;
  total_inventory_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_sales_orders: number;
  pending_sales_orders: number;
  total_sales_value: number;
  monthly_sales_value: number;
  total_purchase_orders: number;
  pending_purchase_orders: number;
  total_purchase_value: number;
  monthly_purchase_value: number;
  total_invoices: number;
  outstanding_invoices: number;
  outstanding_amount: number;
  overdue_invoices: number;
  overdue_amount: number;
}

interface LowStockAlert {
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: number;
  reorder_point: number;
}

interface PendingOrder {
  id: string;
  order_number: string;
  order_type: 'purchase' | 'sales';
  date: string;
  status: string;
  total_amount: number;
}

interface RecentActivity {
  id: string;
  type: 'invoice' | 'payment' | 'stock_movement' | 'purchase_order' | 'sales_order';
  description: string;
  amount?: number;
  quantity?: number;
  date: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  low_stock_alerts: LowStockAlert[];
  pending_orders: PendingOrder[];
  recent_activity: RecentActivity[];
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getActivityIcon(type: RecentActivity['type']) {
  const icons = {
    invoice: FileText,
    payment: DollarSign,
    stock_movement: Package,
    purchase_order: ShoppingCart,
    sales_order: TrendingUp,
  };
  return icons[type] || Activity;
}

export default function ERPDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = localStorage.getItem('workspace_id') || 'demo-workspace';
      const response = await fetch(`/api/erp/dashboard?workspace_id=${workspaceId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: unknown) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || 'Failed to load dashboard'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { metrics, low_stock_alerts, pending_orders, recent_activity } = data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ERP Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of your business operations
        </p>
      </div>

      {/* Key Metrics - Row 1: Business Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_customers}</div>
            <p className="text-xs text-muted-foreground">Total customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_products}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_warehouses}</div>
            <p className="text-xs text-muted-foreground">Storage locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.total_inventory_value)}
            </div>
            <p className="text-xs text-muted-foreground">Current stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics - Row 2: Sales & Purchases */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_sales_orders}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pending_sales_orders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.total_sales_value)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.monthly_sales_value)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_purchase_orders}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pending_purchase_orders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.total_purchase_value)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.monthly_purchase_value)} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics - Row 3: Invoicing & Alerts */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_invoices}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.outstanding_invoices} outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.outstanding_amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.overdue_invoices} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.low_stock_items}</div>
            <p className="text-xs text-muted-foreground">Below reorder point</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.out_of_stock_items}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>
              {low_stock_alerts.length === 0
                ? 'No low stock alerts'
                : `${low_stock_alerts.length} product${low_stock_alerts.length !== 1 ? 's' : ''} below reorder point`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {low_stock_alerts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Reorder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {low_stock_alerts.map((alert) => (
                    <TableRow key={`${alert.product_id}-${alert.warehouse_id}`}>
                      <TableCell>
                        <div className="font-medium">{alert.product_name}</div>
                        <div className="text-sm text-muted-foreground">{alert.product_sku}</div>
                      </TableCell>
                      <TableCell>{alert.warehouse_name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={alert.quantity_on_hand === 0 ? 'destructive' : 'secondary'}>
                          {alert.quantity_on_hand}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{alert.reorder_point}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                All stock levels are healthy
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Pending Orders
            </CardTitle>
            <CardDescription>
              {pending_orders.length === 0
                ? 'No pending orders'
                : `${pending_orders.length} order${pending_orders.length !== 1 ? 's' : ''} awaiting action`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pending_orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending_orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <Badge variant={order.order_type === 'sales' ? 'default' : 'secondary'}>
                          {order.order_type === 'sales' ? 'Sales' : 'Purchase'}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pending orders
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest transactions across all ERP modules</CardDescription>
        </CardHeader>
        <CardContent>
          {recent_activity.length > 0 ? (
            <div className="space-y-4">
              {recent_activity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className="bg-muted p-2 rounded-lg">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                    </div>
                    {activity.amount && (
                      <div className="text-sm font-medium">{formatCurrency(activity.amount)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
