'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Download, Calendar } from 'lucide-react';

interface ReportConfig {
  label: string;
  description: string;
  requiresDateRange: boolean;
  supportsWarehouseFilter?: boolean;
  supportsProductFilter?: boolean;
  supportsPeriodType?: boolean;
}

const REPORT_TYPES: Record<string, ReportConfig> = {
  stock_valuation: {
    label: 'Stock Valuation Report',
    description: 'Current stock value across all warehouses',
    requiresDateRange: false,
    supportsWarehouseFilter: true,
  },
  stock_movement: {
    label: 'Stock Movement Report',
    description: 'All stock movements within date range',
    requiresDateRange: true,
    supportsWarehouseFilter: true,
    supportsProductFilter: true,
  },
  sales_by_period: {
    label: 'Sales by Period',
    description: 'Sales aggregated by month or week',
    requiresDateRange: true,
    supportsPeriodType: true,
  },
  sales_by_customer: {
    label: 'Sales by Customer',
    description: 'Top customers by revenue',
    requiresDateRange: true,
  },
  sales_by_product: {
    label: 'Sales by Product',
    description: 'Top selling products',
    requiresDateRange: true,
  },
  purchases_by_period: {
    label: 'Purchases by Period',
    description: 'Purchase orders aggregated by month or week',
    requiresDateRange: true,
    supportsPeriodType: true,
  },
  aged_receivables: {
    label: 'Aged Receivables',
    description: 'Overdue invoices by aging bucket',
    requiresDateRange: false,
  },
  payment_collection: {
    label: 'Payment Collection',
    description: 'Invoice issuance and payment collection by period',
    requiresDateRange: true,
  },
};

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

export default function ERPReportsPage() {
  const [reportType, setReportType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodType, setPeriodType] = useState<string>('month');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReport = reportType ? REPORT_TYPES[reportType] : null;

  async function generateReport() {
    if (!reportType) {
      setError('Please select a report type');
      return;
    }

    if (selectedReport?.requiresDateRange && (!startDate || !endDate)) {
      setError('Please select start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const workspaceId = localStorage.getItem('workspace_id') || 'demo-workspace';
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        report_type: reportType,
      });

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (periodType) params.append('period_type', periodType);

      const response = await fetch(`/api/erp/reports?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const data = await response.json();
      setReportData(data);
    } catch (err: unknown) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  function renderReportData() {
    if (!reportData || !reportData.data) return null;

    const data = reportData.data;
    const type = reportData.report_type;

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No data available for this report
        </div>
      );
    }

    switch (type) {
      case 'stock_valuation':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={`${item.product_id}-${item.warehouse_id}`}>
                  <TableCell>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-muted-foreground">{item.product_sku}</div>
                  </TableCell>
                  <TableCell>{item.warehouse_name}</TableCell>
                  <TableCell className="text-right">{item.quantity_on_hand}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.average_cost)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'stock_movement':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(item.movement_date)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-muted-foreground">{item.product_sku}</div>
                  </TableCell>
                  <TableCell>{item.warehouse_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.movement_type}</Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {item.quantity > 0 ? '+' : ''}
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.reference_number || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'sales_by_period':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.period}>
                  <TableCell className="font-medium">{item.period}</TableCell>
                  <TableCell className="text-right">{item.order_count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.round(item.total_revenue / item.order_count))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'sales_by_customer':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.customer_id}>
                  <TableCell className="font-medium">{item.customer_name}</TableCell>
                  <TableCell className="text-right">{item.order_count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.average_order_value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'sales_by_product':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.product_id}>
                  <TableCell>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-muted-foreground">{item.product_sku}</div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity_sold}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.round(item.total_revenue / item.quantity_sold))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'purchases_by_period':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Avg Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.period}>
                  <TableCell className="font-medium">{item.period}</TableCell>
                  <TableCell className="text-right">{item.order_count}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Math.round(item.total_cost / item.order_count))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'aged_receivables':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Days Overdue</TableHead>
                <TableHead>Aging</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.invoice_id}>
                  <TableCell className="font-medium">{item.customer_name}</TableCell>
                  <TableCell>{item.invoice_number}</TableCell>
                  <TableCell>{formatDate(item.due_date)}</TableCell>
                  <TableCell className="text-right text-red-600">{item.days_overdue}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.aging_bucket === '90+' ? 'destructive' : 'secondary'
                      }
                    >
                      {item.aging_bucket} days
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case 'payment_collection':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Invoices Issued</TableHead>
                <TableHead className="text-right">Invoices Paid</TableHead>
                <TableHead className="text-right">Total Issued</TableHead>
                <TableHead className="text-right">Total Collected</TableHead>
                <TableHead className="text-right">Collection Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.period}>
                  <TableCell className="font-medium">{item.period}</TableCell>
                  <TableCell className="text-right">{item.invoices_issued}</TableCell>
                  <TableCell className="text-right">{item.invoices_paid}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.total_issued)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.total_collected)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={item.collection_rate >= 80 ? 'default' : 'secondary'}
                    >
                      {item.collection_rate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return <div className="text-muted-foreground">Unknown report type</div>;
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ERP Reports</h1>
        <p className="text-muted-foreground">Generate comprehensive business reports</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>Select report type and parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock_valuation">Stock Valuation Report</SelectItem>
                <SelectItem value="stock_movement">Stock Movement Report</SelectItem>
                <SelectItem value="sales_by_period">Sales by Period</SelectItem>
                <SelectItem value="sales_by_customer">Sales by Customer</SelectItem>
                <SelectItem value="sales_by_product">Sales by Product</SelectItem>
                <SelectItem value="purchases_by_period">Purchases by Period</SelectItem>
                <SelectItem value="aged_receivables">Aged Receivables</SelectItem>
                <SelectItem value="payment_collection">Payment Collection</SelectItem>
              </SelectContent>
            </Select>
            {selectedReport && (
              <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
            )}
          </div>

          {selectedReport?.requiresDateRange && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedReport?.supportsPeriodType && (
            <div className="space-y-2">
              <Label>Period Type</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading || !reportType}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            {reportData && (
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedReport?.label}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({reportData.data.length} {reportData.data.length === 1 ? 'row' : 'rows'})
              </span>
            </CardTitle>
            {startDate && endDate && (
              <CardDescription>
                <Calendar className="h-4 w-4 inline mr-1" />
                {formatDate(startDate)} to {formatDate(endDate)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>{renderReportData()}</CardContent>
        </Card>
      )}
    </div>
  );
}
