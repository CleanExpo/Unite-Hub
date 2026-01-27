'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Warehouse, AlertTriangle, TrendingUp } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any>(null);
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

        // Load products with stock levels
        const productsRes = await fetch(
          `/api/erp/products?workspace_id=${workspaceId}&include_stock=true`
        );
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products || []);
        }

        // Load warehouses
        const warehousesRes = await fetch(`/api/erp/warehouses?workspace_id=${workspaceId}`);
        if (warehousesRes.ok) {
          const data = await warehousesRes.json();
          setWarehouses(data.warehouses || []);
        }

        // Load low stock products
        const lowStockRes = await fetch(
          `/api/erp/stock/low-stock?workspace_id=${workspaceId}`
        );
        if (lowStockRes.ok) {
          const data = await lowStockRes.json();
          setLowStock(data.low_stock_products || []);
        }

        // Load inventory valuation
        const valuationRes = await fetch(
          `/api/erp/stock/valuation?workspace_id=${workspaceId}`
        );
        if (valuationRes.ok) {
          const data = await valuationRes.json();
          setValuation(data.valuation);
        }
      } catch (error) {
        console.error('Error loading inventory data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [workspaceId]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading inventory data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Inventory & Stock Management</h1>
        <p className="text-muted-foreground">
          Manage products, warehouses, stock levels, and movements
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter((p) => p.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
            <p className="text-xs text-muted-foreground">
              {warehouses.filter((w) => w.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStock.length}</div>
            <p className="text-xs text-muted-foreground">Require reordering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {valuation ? formatCurrency(valuation.total_value) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {valuation?.total_units || 0} units in stock
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Products</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Sell Price</TableHead>
                  <TableHead>Stock On Hand</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No products yet. Add your first product to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.cost_price
                          ? formatCurrency(product.cost_price)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {product.sell_price
                          ? formatCurrency(product.sell_price)
                          : '—'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {product.total_stock || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Warehouses</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Warehouse
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No warehouses yet. Add your first warehouse to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.code}</TableCell>
                      <TableCell>
                        {warehouse.name}
                        {warehouse.is_default && (
                          <Badge variant="outline" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{warehouse.city || '—'}</TableCell>
                      <TableCell>{warehouse.state || '—'}</TableCell>
                      <TableCell>{warehouse.manager_name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                          {warehouse.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Low Stock Items</h2>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Reorder Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No low stock items. All products are above reorder levels.
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStock.map((item) => (
                    <TableRow key={`${item.product.id}-${item.warehouse.id}`}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>{item.product.sku}</TableCell>
                      <TableCell>{item.warehouse.name}</TableCell>
                      <TableCell className="text-destructive font-semibold">
                        {item.stock_level.quantity_available}
                      </TableCell>
                      <TableCell>{item.product.reorder_level}</TableCell>
                      <TableCell>{item.product.reorder_quantity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
