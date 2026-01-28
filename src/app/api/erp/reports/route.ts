import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as reportsService from '@/lib/erp/reportsService';

/**
 * GET /api/erp/reports
 * Generate ERP reports
 *
 * Query params:
 * - workspace_id (required)
 * - report_type (required): 'stock_valuation' | 'stock_movement' | 'sales_by_period' |
 *   'sales_by_customer' | 'sales_by_product' | 'purchases_by_period' |
 *   'aged_receivables' | 'payment_collection'
 * - start_date (for date range reports): YYYY-MM-DD
 * - end_date (for date range reports): YYYY-MM-DD
 * - period_type (optional): 'month' | 'week' (default: 'month')
 * - warehouse_id (optional): Filter by warehouse
 * - product_id (optional): Filter by product
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    const reportType = request.nextUrl.searchParams.get('report_type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    if (!reportType) {
      return NextResponse.json({ error: 'report_type required' }, { status: 400 });
    }

    // Get optional parameters
    const startDate = request.nextUrl.searchParams.get('start_date');
    const endDate = request.nextUrl.searchParams.get('end_date');
    const periodType = (request.nextUrl.searchParams.get('period_type') || 'month') as
      | 'month'
      | 'week';
    const warehouseId = request.nextUrl.searchParams.get('warehouse_id') || undefined;
    const productId = request.nextUrl.searchParams.get('product_id') || undefined;

    // Route to appropriate report
    switch (reportType) {
      case 'stock_valuation':
        const stockValuation = await reportsService.getStockValuationReport(
          workspaceId,
          warehouseId
        );
        return NextResponse.json({ report_type: reportType, data: stockValuation });

      case 'stock_movement':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'start_date and end_date required for stock_movement report' },
            { status: 400 }
          );
        }
        const stockMovement = await reportsService.getStockMovementReport(
          workspaceId,
          { start_date: startDate, end_date: endDate },
          warehouseId,
          productId
        );
        return NextResponse.json({ report_type: reportType, data: stockMovement });

      case 'sales_by_period':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'start_date and end_date required for sales_by_period report' },
            { status: 400 }
          );
        }
        const salesByPeriod = await reportsService.getSalesByPeriodReport(
          workspaceId,
          { start_date: startDate, end_date: endDate },
          periodType
        );
        return NextResponse.json({ report_type: reportType, data: salesByPeriod });

      case 'sales_by_customer':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'start_date and end_date required for sales_by_customer report' },
            { status: 400 }
          );
        }
        const salesByCustomer = await reportsService.getSalesByCustomerReport(workspaceId, {
          start_date: startDate,
          end_date: endDate,
        });
        return NextResponse.json({ report_type: reportType, data: salesByCustomer });

      case 'sales_by_product':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'start_date and end_date required for sales_by_product report' },
            { status: 400 }
          );
        }
        const salesByProduct = await reportsService.getSalesByProductReport(workspaceId, {
          start_date: startDate,
          end_date: endDate,
        });
        return NextResponse.json({ report_type: reportType, data: salesByProduct });

      case 'purchases_by_period':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'start_date and end_date required for purchases_by_period report' },
            { status: 400 }
          );
        }
        const purchasesByPeriod = await reportsService.getPurchasesByPeriodReport(
          workspaceId,
          { start_date: startDate, end_date: endDate },
          periodType
        );
        return NextResponse.json({ report_type: reportType, data: purchasesByPeriod });

      case 'aged_receivables':
        const agedReceivables = await reportsService.getAgedReceivablesReport(workspaceId);
        return NextResponse.json({ report_type: reportType, data: agedReceivables });

      case 'payment_collection':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'start_date and end_date required for payment_collection report' },
            { status: 400 }
          );
        }
        const paymentCollection = await reportsService.getPaymentCollectionReport(workspaceId, {
          start_date: startDate,
          end_date: endDate,
        });
        return NextResponse.json({ report_type: reportType, data: paymentCollection });

      default:
        return NextResponse.json({ error: `Unknown report type: ${reportType}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
