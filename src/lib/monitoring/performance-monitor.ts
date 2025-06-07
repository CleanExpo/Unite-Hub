// Unite Group + CARSI Performance Monitoring System

import { createClient } from '@/lib/supabase/server';

// Monitoring Types
export type MonitorType = 
  | 'api-health'
  | 'response-time'
  | 'error-rate'
  | 'sync-status'
  | 'workflow-queue'
  | 'sso-auth'
  | 'email-delivery';

export type MetricType =
  | 'latency'
  | 'availability'
  | 'throughput'
  | 'error-count'
  | 'success-rate';

export type AlertSeverity = 'info' | 'warning' | 'critical';

// Monitoring Configuration
export interface MonitorConfig {
  id: string;
  name: string;
  type: MonitorType;
  endpoint?: string;
  interval: number; // milliseconds
  threshold: MetricThreshold;
  alertChannels: AlertChannel[];
  enabled: boolean;
}

export interface MetricThreshold {
  metric: MetricType;
  warning: number;
  critical: number;
  comparison: 'above' | 'below';
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook';
  destination: string;
  severities: AlertSeverity[];
}

export interface HealthCheckResult {
  monitoId: string;
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<MetricType, number>;
  details?: Record<string, any>;
}

export interface PerformanceMetric {
  timestamp: Date;
  metric: MetricType;
  value: number;
  tags: Record<string, string>;
}

// Default Monitor Configurations
export const DEFAULT_MONITORS: MonitorConfig[] = [
  {
    id: 'unite-api-health',
    name: 'Unite API Health Check',
    type: 'api-health',
    endpoint: '/api/health',
    interval: 60000, // 1 minute
    threshold: {
      metric: 'availability',
      warning: 99,
      critical: 95,
      comparison: 'below',
    },
    alertChannels: [
      {
        type: 'email',
        destination: process.env.ADMIN_EMAIL || 'admin@unitegroup.com.au',
        severities: ['critical'],
      },
    ],
    enabled: true,
  },
  {
    id: 'carsi-api-health',
    name: 'CARSI API Health Check',
    type: 'api-health',
    endpoint: 'https://api.carsi.au/health',
    interval: 60000,
    threshold: {
      metric: 'availability',
      warning: 99,
      critical: 95,
      comparison: 'below',
    },
    alertChannels: [
      {
        type: 'email',
        destination: process.env.ADMIN_EMAIL || 'admin@unitegroup.com.au',
        severities: ['critical'],
      },
    ],
    enabled: true,
  },
  {
    id: 'api-response-time',
    name: 'API Response Time Monitor',
    type: 'response-time',
    interval: 30000, // 30 seconds
    threshold: {
      metric: 'latency',
      warning: 500, // ms
      critical: 1000, // ms
      comparison: 'above',
    },
    alertChannels: [
      {
        type: 'slack',
        destination: process.env.SLACK_WEBHOOK_URL || '',
        severities: ['warning', 'critical'],
      },
    ],
    enabled: true,
  },
  {
    id: 'crm-sync-monitor',
    name: 'CRM Sync Status',
    type: 'sync-status',
    interval: 300000, // 5 minutes
    threshold: {
      metric: 'success-rate',
      warning: 95,
      critical: 90,
      comparison: 'below',
    },
    alertChannels: [
      {
        type: 'email',
        destination: process.env.ADMIN_EMAIL || 'admin@unitegroup.com.au',
        severities: ['warning', 'critical'],
      },
    ],
    enabled: true,
  },
  {
    id: 'workflow-queue-depth',
    name: 'Workflow Queue Monitor',
    type: 'workflow-queue',
    interval: 120000, // 2 minutes
    threshold: {
      metric: 'throughput',
      warning: 100, // queue depth
      critical: 500,
      comparison: 'above',
    },
    alertChannels: [
      {
        type: 'slack',
        destination: process.env.SLACK_WEBHOOK_URL || '',
        severities: ['warning', 'critical'],
      },
    ],
    enabled: true,
  },
  {
    id: 'sso-auth-monitor',
    name: 'SSO Authentication Health',
    type: 'sso-auth',
    interval: 180000, // 3 minutes
    threshold: {
      metric: 'error-count',
      warning: 10,
      critical: 50,
      comparison: 'above',
    },
    alertChannels: [
      {
        type: 'email',
        destination: process.env.ADMIN_EMAIL || 'admin@unitegroup.com.au',
        severities: ['critical'],
      },
    ],
    enabled: true,
  },
];

/**
 * Perform health check based on monitor configuration
 */
export async function performHealthCheck(monitor: MonitorConfig): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const metrics: Record<MetricType, number> = {
    latency: 0,
    availability: 0,
    throughput: 0,
    'error-count': 0,
    'success-rate': 0,
  };

  try {
    switch (monitor.type) {
      case 'api-health':
        return await checkAPIHealth(monitor, metrics);
      
      case 'response-time':
        return await checkResponseTime(monitor, metrics);
      
      case 'sync-status':
        return await checkSyncStatus(monitor, metrics);
      
      case 'workflow-queue':
        return await checkWorkflowQueue(monitor, metrics);
      
      case 'sso-auth':
        return await checkSSOAuth(monitor, metrics);
      
      case 'email-delivery':
        return await checkEmailDelivery(monitor, metrics);
      
      default:
        throw new Error(`Unknown monitor type: ${monitor.type}`);
    }
  } catch (error) {
    console.error(`Health check failed for ${monitor.id}:`, error);
    
    return {
      monitoId: monitor.id,
      timestamp: new Date(),
      status: 'unhealthy',
      metrics: {
        ...metrics,
        availability: 0,
        'error-count': 1,
      },
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Check API endpoint health
 */
async function checkAPIHealth(
  monitor: MonitorConfig,
  metrics: Record<MetricType, number>
): Promise<HealthCheckResult> {
  if (!monitor.endpoint) {
    throw new Error('API health check requires endpoint');
  }

  const startTime = Date.now();
  
  try {
    const response = await fetch(
      monitor.endpoint.startsWith('http') 
        ? monitor.endpoint 
        : `${process.env.NEXT_PUBLIC_SITE_URL}${monitor.endpoint}`,
      {
        method: 'GET',
        headers: {
          'X-Health-Check': 'true',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );

    metrics.latency = Date.now() - startTime;
    metrics.availability = response.ok ? 100 : 0;
    
    return {
      monitoId: monitor.id,
      timestamp: new Date(),
      status: response.ok ? 'healthy' : 'unhealthy',
      metrics,
      details: {
        statusCode: response.status,
        responseTime: metrics.latency,
      },
    };
  } catch (error) {
    metrics.latency = Date.now() - startTime;
    metrics.availability = 0;
    metrics['error-count'] = 1;
    
    return {
      monitoId: monitor.id,
      timestamp: new Date(),
      status: 'unhealthy',
      metrics,
      details: {
        error: error instanceof Error ? error.message : 'Connection failed',
      },
    };
  }
}

/**
 * Check API response times
 */
async function checkResponseTime(
  monitor: MonitorConfig,
  metrics: Record<MetricType, number>
): Promise<HealthCheckResult> {
  const supabase = await createClient();
  
  // Get recent API response times from logs
  const { data: recentRequests } = await supabase
    .from('api_metrics')
    .select('response_time')
    .gte('created_at', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
    .order('created_at', { ascending: false })
    .limit(100);

  if (!recentRequests || recentRequests.length === 0) {
    return {
      monitoId: monitor.id,
      timestamp: new Date(),
      status: 'healthy',
      metrics: {
        ...metrics,
        latency: 0,
        availability: 100,
      },
      details: {
        message: 'No recent requests to analyze',
      },
    };
  }

  // Calculate average response time
  const avgResponseTime = recentRequests.reduce((sum, r) => sum + r.response_time, 0) / recentRequests.length;
  const p95ResponseTime = recentRequests
    .map(r => r.response_time)
    .sort((a, b) => a - b)[Math.floor(recentRequests.length * 0.95)];

  metrics.latency = avgResponseTime;
  metrics.availability = 100;
  
  // Determine health status based on threshold
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (monitor.threshold.comparison === 'above') {
    if (p95ResponseTime > monitor.threshold.critical) {
      status = 'unhealthy';
    } else if (p95ResponseTime > monitor.threshold.warning) {
      status = 'degraded';
    }
  }

  return {
    monitoId: monitor.id,
    timestamp: new Date(),
    status,
    metrics,
    details: {
      avgResponseTime,
      p95ResponseTime,
      sampleSize: recentRequests.length,
    },
  };
}

/**
 * Check CRM sync status
 */
async function checkSyncStatus(
  monitor: MonitorConfig,
  metrics: Record<MetricType, number>
): Promise<HealthCheckResult> {
  const supabase = await createClient();
  
  // Get recent sync operations
  const { data: syncOps } = await supabase
    .from('crm_sync_log')
    .select('status, error')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .order('created_at', { ascending: false })
    .limit(100);

  if (!syncOps || syncOps.length === 0) {
    return {
      monitoId: monitor.id,
      timestamp: new Date(),
      status: 'healthy',
      metrics: {
        ...metrics,
        'success-rate': 100,
        availability: 100,
      },
    };
  }

  const successCount = syncOps.filter(op => op.status === 'success').length;
  const successRate = (successCount / syncOps.length) * 100;

  metrics['success-rate'] = successRate;
  metrics['error-count'] = syncOps.length - successCount;
  metrics.availability = successRate > 0 ? 100 : 0;

  // Determine health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (monitor.threshold.comparison === 'below') {
    if (successRate < monitor.threshold.critical) {
      status = 'unhealthy';
    } else if (successRate < monitor.threshold.warning) {
      status = 'degraded';
    }
  }

  return {
    monitoId: monitor.id,
    timestamp: new Date(),
    status,
    metrics,
    details: {
      totalSyncs: syncOps.length,
      successCount,
      failureCount: syncOps.length - successCount,
      recentErrors: syncOps.filter(op => op.error).slice(0, 5).map(op => op.error),
    },
  };
}

/**
 * Check workflow queue depth
 */
async function checkWorkflowQueue(
  monitor: MonitorConfig,
  metrics: Record<MetricType, number>
): Promise<HealthCheckResult> {
  const supabase = await createClient();
  
  // Get pending workflows
  const { data: pendingWorkflows, count } = await supabase
    .from('workflow_queue')
    .select('*', { count: 'exact', head: false })
    .eq('status', 'pending');

  const queueDepth = count || 0;
  
  // Get processing rate (workflows processed in last 5 minutes)
  const { data: processedWorkflows } = await supabase
    .from('workflow_queue')
    .select('id')
    .eq('status', 'completed')
    .gte('processed_at', new Date(Date.now() - 300000).toISOString());

  const processingRate = (processedWorkflows?.length || 0) / 5; // per minute

  metrics.throughput = queueDepth;
  metrics.availability = queueDepth < 1000 ? 100 : 0; // Consider unavailable if queue is too deep
  
  // Determine health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (monitor.threshold.comparison === 'above') {
    if (queueDepth > monitor.threshold.critical) {
      status = 'unhealthy';
    } else if (queueDepth > monitor.threshold.warning) {
      status = 'degraded';
    }
  }

  return {
    monitoId: monitor.id,
    timestamp: new Date(),
    status,
    metrics,
    details: {
      queueDepth,
      processingRate,
      estimatedClearTime: processingRate > 0 ? queueDepth / processingRate : null,
    },
  };
}

/**
 * Check SSO authentication health
 */
async function checkSSOAuth(
  monitor: MonitorConfig,
  metrics: Record<MetricType, number>
): Promise<HealthCheckResult> {
  const supabase = await createClient();
  
  // Get recent auth attempts
  const { data: authLogs } = await supabase
    .from('auth_logs')
    .select('success, error_type')
    .gte('created_at', new Date(Date.now() - 1800000).toISOString()) // Last 30 minutes
    .order('created_at', { ascending: false })
    .limit(200);

  if (!authLogs || authLogs.length === 0) {
    return {
      monitoId: monitor.id,
      timestamp: new Date(),
      status: 'healthy',
      metrics: {
        ...metrics,
        'error-count': 0,
        'success-rate': 100,
        availability: 100,
      },
    };
  }

  const errorCount = authLogs.filter(log => !log.success).length;
  const successRate = ((authLogs.length - errorCount) / authLogs.length) * 100;

  metrics['error-count'] = errorCount;
  metrics['success-rate'] = successRate;
  metrics.availability = successRate > 50 ? 100 : 0;

  // Determine health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (monitor.threshold.comparison === 'above') {
    if (errorCount > monitor.threshold.critical) {
      status = 'unhealthy';
    } else if (errorCount > monitor.threshold.warning) {
      status = 'degraded';
    }
  }

  return {
    monitoId: monitor.id,
    timestamp: new Date(),
    status,
    metrics,
    details: {
      totalAttempts: authLogs.length,
      errorCount,
      successCount: authLogs.length - errorCount,
      errorTypes: authLogs
        .filter(log => log.error_type)
        .reduce((acc, log) => {
          acc[log.error_type] = (acc[log.error_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
    },
  };
}

/**
 * Check email delivery health
 */
async function checkEmailDelivery(
  monitor: MonitorConfig,
  metrics: Record<MetricType, number>
): Promise<HealthCheckResult> {
  const supabase = await createClient();
  
  // Get recent email sends
  const { data: emailLogs } = await supabase
    .from('email_analytics')
    .select('status, bounce_type')
    .gte('sent_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .order('sent_at', { ascending: false })
    .limit(100);

  if (!emailLogs || emailLogs.length === 0) {
    return {
      monitoId: monitor.id,
      timestamp: new Date(),
      status: 'healthy',
      metrics: {
        ...metrics,
        'success-rate': 100,
        availability: 100,
      },
    };
  }

  const deliveredCount = emailLogs.filter(log => log.status === 'delivered').length;
  const deliveryRate = (deliveredCount / emailLogs.length) * 100;

  metrics['success-rate'] = deliveryRate;
  metrics['error-count'] = emailLogs.filter(log => log.status === 'failed' || log.status === 'bounced').length;
  metrics.availability = deliveryRate > 50 ? 100 : 0;

  // Determine health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (deliveryRate < 90) {
    status = 'degraded';
  }
  if (deliveryRate < 80) {
    status = 'unhealthy';
  }

  return {
    monitoId: monitor.id,
    timestamp: new Date(),
    status,
    metrics,
    details: {
      totalSent: emailLogs.length,
      delivered: deliveredCount,
      bounced: emailLogs.filter(log => log.status === 'bounced').length,
      failed: emailLogs.filter(log => log.status === 'failed').length,
    },
  };
}

/**
 * Record performance metric
 */
export async function recordMetric(metric: PerformanceMetric): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase.from('performance_metrics').insert({
      timestamp: metric.timestamp.toISOString(),
      metric_type: metric.metric,
      value: metric.value,
      tags: metric.tags,
    });
  } catch (error) {
    console.error('Failed to record metric:', error);
  }
}

/**
 * Send alert based on health check result
 */
export async function sendAlert(
  monitor: MonitorConfig,
  result: HealthCheckResult,
  severity: AlertSeverity
): Promise<void> {
  const relevantChannels = monitor.alertChannels.filter(
    channel => channel.severities.includes(severity)
  );

  for (const channel of relevantChannels) {
    try {
      switch (channel.type) {
        case 'email':
          await sendEmailAlert(channel.destination, monitor, result, severity);
          break;
        
        case 'slack':
          await sendSlackAlert(channel.destination, monitor, result, severity);
          break;
        
        case 'webhook':
          await sendWebhookAlert(channel.destination, monitor, result, severity);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel.type} alert:`, error);
    }
  }
}

/**
 * Send email alert
 */
async function sendEmailAlert(
  destination: string,
  monitor: MonitorConfig,
  result: HealthCheckResult,
  severity: AlertSeverity
): Promise<void> {
  // In production, integrate with email service
  console.log('Email alert:', {
    to: destination,
    subject: `[${severity.toUpperCase()}] ${monitor.name} - ${result.status}`,
    monitor: monitor.name,
    result,
  });
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(
  webhookUrl: string,
  monitor: MonitorConfig,
  result: HealthCheckResult,
  severity: AlertSeverity
): Promise<void> {
  if (!webhookUrl) return;

  const color = {
    info: '#0EA5E9',
    warning: '#F59E0B',
    critical: '#EF4444',
  }[severity];

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: `${monitor.name} - ${result.status.toUpperCase()}`,
        fields: [
          {
            title: 'Severity',
            value: severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Timestamp',
            value: result.timestamp.toISOString(),
            short: true,
          },
          ...Object.entries(result.metrics).map(([key, value]) => ({
            title: key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: `${value}${key === 'latency' ? 'ms' : key.includes('rate') ? '%' : ''}`,
            short: true,
          })),
        ],
        footer: 'Unite Group + CARSI Integration Monitor',
      }],
    }),
  });
}

/**
 * Send webhook alert
 */
async function sendWebhookAlert(
  webhookUrl: string,
  monitor: MonitorConfig,
  result: HealthCheckResult,
  severity: AlertSeverity
): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      monitor: monitor.id,
      monitorName: monitor.name,
      severity,
      result,
      timestamp: new Date().toISOString(),
    }),
  });
}

/**
 * Run all enabled monitors
 */
export async function runMonitors(): Promise<void> {
  const monitors = DEFAULT_MONITORS.filter(m => m.enabled);
  
  for (const monitor of monitors) {
    try {
      const result = await performHealthCheck(monitor);
      
      // Record metrics
      await recordMetric({
        timestamp: result.timestamp,
        metric: monitor.threshold.metric,
        value: result.metrics[monitor.threshold.metric],
        tags: {
          monitor: monitor.id,
          type: monitor.type,
        },
      });

      // Check thresholds and send alerts
      const metricValue = result.metrics[monitor.threshold.metric];
      let shouldAlert = false;
      let severity: AlertSeverity = 'info';

      if (monitor.threshold.comparison === 'above') {
        if (metricValue > monitor.threshold.critical) {
          shouldAlert = true;
          severity = 'critical';
        } else if (metricValue > monitor.threshold.warning) {
          shouldAlert = true;
          severity = 'warning';
        }
      } else {
        if (metricValue < monitor.threshold.critical) {
          shouldAlert = true;
          severity = 'critical';
        } else if (metricValue < monitor.threshold.warning) {
          shouldAlert = true;
          severity = 'warning';
        }
      }

      if (shouldAlert) {
        await sendAlert(monitor, result, severity);
      }
    } catch (error) {
      console.error(`Monitor ${monitor.id} failed:`, error);
    }
  }
}
