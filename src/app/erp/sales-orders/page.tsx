'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';

type SalesOrderStatus =
  | 'draft'
  | 'confirmed'
  | 'picking'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface SalesOrder {
  id: string;
  so_number: string;
  customer_id: string;
  warehouse_id: string;
  order_date: string;
  requested_delivery_date?: string;
  actual_delivery_date?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: SalesOrderStatus;
  payment_status: string;
  notes?: string;
  created_at: string;
}

function getStatusColor(status: SalesOrderStatus): string {
  const colors: Record<SalesOrderStatus, string> = {
    draft: 'bg-gray-500',
    confirmed: 'bg-blue-500',
    picking: 'bg-yellow-500',
    packed: 'bg-orange-500',
    shipped: 'bg-purple-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
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

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary stats
  const totalOrders = salesOrders.length;
  const pendingOrders = salesOrders.filter(
    (so) => so.status === 'draft' || so.status === 'confirmed' || so.status === 'picking'
  ).length;
  const shippedOrders = salesOrders.filter(
    (so) => so.status === 'shipped' || so.status === 'delivered'
  ).length;
  const totalValue = salesOrders.reduce((sum, so) => sum + so.total_amount, 0);

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  async function fetchSalesOrders() {
    try {
      setLoading(true);
      setError(null);

      // Get workspace_id from localStorage or user context
      const workspaceId = localStorage.getItem('workspace_id') || 'demo-workspace';

      const response = await fetch(`/api/erp/sales-orders?workspace_id=${workspaceId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch sales orders: ${response.statusText}`);
      }

      const data = await response.json();
      setSalesOrders(data.sales_orders || []);
    } catch (err: any) {
      console.error('Error fetching sales orders:', err);
      setError(err.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading sales orders...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchSalesOrders} className="mt-4" variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
        </div>
        <Button>Create Sales Order</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">All sales orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shippedOrders}</div>
            <p className="text-xs text-muted-foreground">Shipped/Delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">All orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Orders</CardTitle>
          <CardDescription>
            {salesOrders.length === 0
              ? 'No sales orders found. Create your first order to get started.'
              : `Showing ${salesOrders.length} sales order${salesOrders.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOrders.map((so) => (
                  <TableRow key={so.id}>
                    <TableCell className="font-medium">{so.so_number}</TableCell>
                    <TableCell>{formatDate(so.order_date)}</TableCell>
                    <TableCell>
                      {so.requested_delivery_date
                        ? formatDate(so.requested_delivery_date)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(so.status)}>{so.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          so.payment_status === 'paid'
                            ? 'default'
                            : so.payment_status === 'partial'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {so.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(so.subtotal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(so.tax_amount)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(so.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sales orders yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first sales order to start tracking customer orders
              </p>
              <Button>Create Sales Order</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
