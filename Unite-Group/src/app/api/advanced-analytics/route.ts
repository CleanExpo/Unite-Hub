/**
 * Advanced Analytics API Route
 * Unite Group - Version 11.0 Phase 4 Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvancedAnalyticsService } from '@/lib/ai/analytics/service';
import { AIGateway } from '@/lib/ai/gateway/ai-gateway';
import type { AdvancedAnalyticsConfig } from '@/lib/ai/analytics/types';

const config: AdvancedAnalyticsConfig = {
  realTimeMonitoring: {
    enabled: true,
    refreshIntervalMs: 30000, // 30 seconds
    alertThresholds: {
      performanceDegradation: 0.2, // 20% degradation
      errorRate: 0.05, // 5% error rate
      responseTime: 1000 // 1 second response time
    },
    maxDataPoints: 10000
  },
  predictiveAnalytics: {
    enabled: true,
    forecastingHorizonDays: 30,
    confidenceInterval: 0.95,
    modelUpdateFrequency: '0 2 * * *', // Daily at 2 AM AEST
    features: ['time', 'seasonality', 'marketing_spend', 'user_activity', 'market_trends']
  },
  reporting: {
    autoGeneration: true,
    schedules: [
      {
        id: 'daily-summary',
        name: 'Daily Performance Summary',
        type: 'performance_summary',
        frequency: 'daily',
        recipients: ['admin@unite-group.com.au'],
        timezone: 'Australia/Sydney',
        enabled: true
      },
      {
        id: 'weekly-business-intelligence',
        name: 'Weekly Business Intelligence Report',
        type: 'business_intelligence',
        frequency: 'weekly',
        recipients: ['admin@unite-group.com.au'],
        timezone: 'Australia/Sydney',
        enabled: true
      }
    ],
    retentionDays: 90,
    exportFormats: ['pdf', 'csv', 'excel', 'json']
  },
  dashboards: {
    enableCustomDashboards: true,
    maxDashboardsPerUser: 10,
    enableDataExport: true,
    enableSharing: true
  }
};

let analyticsService: AdvancedAnalyticsService | null = null;

function getAnalyticsService(): AdvancedAnalyticsService {
  if (!analyticsService) {
    const aiGateway = new AIGateway({
      providers: [{
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.3
      }],
      cache: {
        enabled: true,
        ttl: 300000,
        maxSize: 1000,
        keyStrategy: 'hash'
      },
      monitoring: {
        enabled: true,
        metricsRetentionDays: 30,
        healthCheckIntervalSeconds: 60
      }
    });

    analyticsService = new AdvancedAnalyticsService(aiGateway, config);
  }
  return analyticsService;
}

export async function POST(request: NextRequest) {
  try {
    const service = getAnalyticsService();
    const { action, ...data } = await request.json();

    switch (action) {
      case 'get_real_time_metrics':
        const metrics = await service.getRealTimeMetrics();
        return NextResponse.json({ success: true, data: metrics });

      case 'subscribe_to_metrics':
        // In a real implementation, this would use WebSocket or Server-Sent Events
        return NextResponse.json({ success: true, message: 'Subscription started' });

      case 'create_model':
        const model = await service.createModel(data.config);
        return NextResponse.json({ success: true, data: model });

      case 'train_model':
        await service.trainModel(data.modelId);
        return NextResponse.json({ success: true, message: 'Model training started' });

      case 'generate_prediction':
        const prediction = await service.generatePrediction(data.modelId, data.features);
        return NextResponse.json({ success: true, data: prediction });

      case 'detect_anomalies':
        const anomalies = await service.detectAnomalies(data.metricId, data.timeRange);
        return NextResponse.json({ success: true, data: anomalies });

      case 'acknowledge_anomaly':
        await service.acknowledgeAnomaly(data.anomalyId, data.userId, data.notes);
        return NextResponse.json({ success: true, message: 'Anomaly acknowledged' });

      case 'resolve_anomaly':
        await service.resolveAnomaly(data.anomalyId, data.resolution);
        return NextResponse.json({ success: true, message: 'Anomaly resolved' });

      case 'create_alert':
        const alert = await service.createAlert(data.config);
        return NextResponse.json({ success: true, data: alert });

      case 'acknowledge_alert':
        await service.acknowledgeAlert(data.alertId, data.userId, data.notes);
        return NextResponse.json({ success: true, message: 'Alert acknowledged' });

      case 'resolve_alert':
        await service.resolveAlert(data.alertId, data.userId, data.notes);
        return NextResponse.json({ success: true, message: 'Alert resolved' });

      case 'create_dashboard':
        const dashboard = await service.createDashboard(data.dashboard);
        return NextResponse.json({ success: true, data: dashboard });

      case 'update_dashboard':
        const updatedDashboard = await service.updateDashboard(data.dashboardId, data.updates);
        return NextResponse.json({ success: true, data: updatedDashboard });

      case 'generate_report':
        const report = await service.generateReport(data.parameters);
        return NextResponse.json({ success: true, data: report });

      case 'schedule_report':
        await service.scheduleReport(data.schedule);
        return NextResponse.json({ success: true, message: 'Report scheduled' });

      case 'generate_business_intelligence':
        const businessIntelligence = await service.generateBusinessIntelligence(data.timeRange);
        return NextResponse.json({ success: true, data: businessIntelligence });

      case 'get_forecast':
        const forecast = await service.getForecast(data.metricId, data.horizonDays);
        return NextResponse.json({ success: true, data: forecast });

      case 'get_recommendations':
        const recommendations = await service.getRecommendations(data.priority);
        return NextResponse.json({ success: true, data: recommendations });

      case 'ingest_metric':
        await service.ingestMetric(data.metricId, data.value, data.timestamp, data.metadata);
        return NextResponse.json({ success: true, message: 'Metric ingested' });

      case 'get_time_series':
        const timeSeries = await service.getTimeSeries(data.metricId, data.timeRange, data.aggregation);
        return NextResponse.json({ success: true, data: timeSeries });

      case 'update_config':
        await service.updateConfig(data.config);
        return NextResponse.json({ success: true, message: 'Configuration updated' });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Advanced Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const service = getAnalyticsService();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const dashboardId = url.searchParams.get('dashboardId');
    const reportId = url.searchParams.get('reportId');
    const userId = url.searchParams.get('userId');
    const category = url.searchParams.get('category');

    switch (action) {
      case 'get_dashboard':
        if (!dashboardId) {
          return NextResponse.json(
            { success: false, error: 'Dashboard ID required' },
            { status: 400 }
          );
        }
        const dashboard = await service.getDashboard(dashboardId);
        return NextResponse.json({ success: true, data: dashboard });

      case 'get_report_history':
        const reports = await service.getReportHistory(userId || undefined);
        return NextResponse.json({ success: true, data: reports });

      case 'download_report':
        if (!reportId) {
          return NextResponse.json(
            { success: false, error: 'Report ID required' },
            { status: 400 }
          );
        }
        const reportBuffer = await service.downloadReport(reportId);
        
        return new NextResponse(reportBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="report-${reportId}.json"`
          }
        });

      case 'get_insights':
        const insights = await service.getInsights((category as any) || undefined);
        return NextResponse.json({ success: true, data: insights });

      case 'get_metric_definitions':
        const definitions = await service.getMetricDefinitions((category as any) || undefined);
        return NextResponse.json({ success: true, data: definitions });

      case 'get_config':
        const config = await service.getConfig();
        return NextResponse.json({ success: true, data: config });

      case 'get_real_time_metrics':
        const metrics = await service.getRealTimeMetrics();
        return NextResponse.json({ success: true, data: metrics });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Advanced Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
