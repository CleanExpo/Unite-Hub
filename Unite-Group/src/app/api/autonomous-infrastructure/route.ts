import { NextRequest, NextResponse } from 'next/server';
import { enhancedMonitoringService } from '@/lib/autonomous/infrastructure/enhanced-monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          status: enhancedMonitoringService.getSystemStatus(),
          metrics: enhancedMonitoringService.getSystemMetrics(),
          healthChecks: Object.fromEntries(enhancedMonitoringService.getHealthChecks()),
          repairActions: enhancedMonitoringService.getRepairActions().slice(-10), // Last 10 actions
          timestamp: new Date().toISOString()
        });

      case 'metrics':
        return NextResponse.json({
          metrics: enhancedMonitoringService.getSystemMetrics(),
          timestamp: new Date().toISOString()
        });

      case 'health':
        return NextResponse.json({
          healthChecks: Object.fromEntries(enhancedMonitoringService.getHealthChecks()),
          overallStatus: enhancedMonitoringService.getSystemStatus(),
          timestamp: new Date().toISOString()
        });

      case 'repairs':
        return NextResponse.json({
          repairActions: enhancedMonitoringService.getRepairActions(),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          status: enhancedMonitoringService.getSystemStatus(),
          metrics: enhancedMonitoringService.getSystemMetrics(),
          healthChecks: Object.fromEntries(enhancedMonitoringService.getHealthChecks()),
          repairActions: enhancedMonitoringService.getRepairActions().slice(-5),
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error in autonomous infrastructure API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'force-health-check':
        await enhancedMonitoringService.forceHealthCheck();
        return NextResponse.json({
          success: true,
          message: 'Health check initiated',
          timestamp: new Date().toISOString()
        });

      case 'start-monitoring':
        await enhancedMonitoringService.startMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Monitoring started',
          timestamp: new Date().toISOString()
        });

      case 'stop-monitoring':
        await enhancedMonitoringService.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Monitoring stopped',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action', availableActions: ['force-health-check', 'start-monitoring', 'stop-monitoring'] },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in autonomous infrastructure POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
