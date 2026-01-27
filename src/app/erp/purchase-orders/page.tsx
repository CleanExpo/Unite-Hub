'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    // Get workspace ID from context or user metadata
    // For now, using a placeholder
    setWorkspaceId('placeholder-workspace-id');
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    async function loadData() {
      try {
        setLoading(true);

        // Load purchase orders
        const response = await fetch(`/api/erp/purchase-orders?workspace_id=${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          setPurchaseOrders(data.purchase_orders || []);
        }
      } catch (error) {
        console.error('Error loading purchase orders:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [workspaceId]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      submitted: 'outline',
      confirmed: 'default',
      partially_received: 'default',
      received: 'default',
      cancelled: 'destructive',
    };

    const colors: Record<string, string> = {
      draft: 'text-gray-600',
      submitted: 'text-blue-600',
      confirmed: 'text-green-600',
      partially_received: 'text-yellow-600',
      received: 'text-green-700',
      cancelled: 'text-red-600',
    };

    return (
      <Badge variant={variants[status] || 'default'} className={colors[status]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Calculate summary metrics
  const totalPOs = purchaseOrders.length;
  const pendingPOs = purchaseOrders.filter((po) =>
    ['draft', 'submitted', 'confirmed'].includes(po.status)
  ).length;
  const receivedPOs = purchaseOrders.filter((po) => po.status === 'received').length;
  const totalValue = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading purchase orders...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Purchase Orders</h1>
        <p className="text-muted-foreground">
          Manage purchase orders and receive stock from suppliers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPOs}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPOs}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivedPOs}</div>
            <p className="text-xs text-muted-foreground">Fully received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">All POs</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Purchase Orders</h2>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No purchase orders yet. Create your first PO to order stock from suppliers.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.supplier_name || 'Unknown Supplier'}</TableCell>
                    <TableCell>{formatDate(po.order_date)}</TableCell>
                    <TableCell>
                      {po.expected_delivery_date
                        ? formatDate(po.expected_delivery_date)
                        : '—'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(po.total_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          po.payment_status === 'paid'
                            ? 'default'
                            : po.payment_status === 'partial'
                            ? 'outline'
                            : 'secondary'
                        }
                      >
                        {po.payment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
