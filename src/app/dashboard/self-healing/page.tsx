/**
 * Self-Healing Dashboard Page
 * Unite Group - Version 14.0 Phase 1
 * 
 * Dashboard page for autonomous self-healing infrastructure management
 */

import React from 'react';
import { Metadata } from 'next';
import SelfHealingDashboard from '@/components/autonomous/SelfHealingDashboard';
import { CompleteSelfHealingService } from '@/lib/autonomous/self-healing/complete-service';
import { SelfHealingConfig } from '@/lib/autonomous/self-healing/types';

export const metadata: Metadata = {
  title: 'Self-Healing Infrastructure | Unite Group',
  description: 'Autonomous system monitoring and recovery management dashboard',
};

// Mock configuration for the self-healing service
const mockConfig: SelfHealingConfig = {
  monitoring: {
    interval: 30000, // 30 seconds
    enabled: true
  },
  prediction: {
    enabled: true,
    modelThreshold: 0.8,
    predictionWindow: 3600 // 1 hour
  },
  recovery: {
    enabled: true,
    maxConcurrentActions: 5,
    timeoutDuration: 300 // 5 minutes
  },
  optimization: {
    enabled: true,
    analysisInterval: 300000, // 5 minutes
    performanceThreshold: 0.9
  },
  logging: {
    level: 'info',
    maxEvents: 1000,
    retention: 86400000 // 24 hours
  }
};

async function getSelfHealingData() {
  try {
    // In a real implementation, this would get actual system data
    // For now, we'll generate mock data to demonstrate the dashboard
    
    const service = new CompleteSelfHealingService(mockConfig);
    const healthData = await service.getSystemHealthOverview();
    
    // Add some mock component data for demonstration
    const mockComponentHealth = [
      {
        componentId: 'cpu-primary',
        status: 'healthy' as const,
        healthScore: 95,
        trend: 'stable' as const,
        lastCheck: new Date()
      },
      {
        componentId: 'memory-pool-1',
        status: 'healthy' as const,
        healthScore: 88,
        trend: 'improving' as const,
        lastCheck: new Date()
      },
      {
        componentId: 'disk-storage-main',
        status: 'warning' as const,
        healthScore: 75,
        trend: 'degrading' as const,
        lastCheck: new Date()
      },
      {
        componentId: 'network-gateway',
        status: 'healthy' as const,
        healthScore: 92,
        trend: 'stable' as const,
        lastCheck: new Date()
      },
      {
        componentId: 'api-service',
        status: 'healthy' as const,
        healthScore: 98,
        trend: 'improving' as const,
        lastCheck: new Date()
      },
      {
        componentId: 'cache-redis',
        status: 'healthy' as const,
        healthScore: 91,
        trend: 'stable' as const,
        lastCheck: new Date()
      }
    ];

    const mockEvents = [
      {
        type: 'system_optimization',
        message: 'Automated performance optimization completed',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        level: 'info' as const,
        component: 'optimization-engine'
      },
      {
        type: 'health_check',
        message: 'All system components healthy',
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        level: 'info' as const,
        component: 'health-monitor'
      },
      {
        type: 'predictive_alert',
        message: 'Disk usage trending upward, monitoring closely',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        level: 'warning' as const,
        component: 'disk-storage-main'
      },
      {
        type: 'recovery_action_complete',
        message: 'Cache optimization completed successfully',
        timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
        level: 'info' as const,
        component: 'cache-redis'
      }
    ];

    return {
      ...healthData,
      componentHealth: mockComponentHealth,
      recentEvents: mockEvents,
      overallHealth: Math.round(
        mockComponentHealth.reduce((sum, comp) => sum + comp.healthScore, 0) / 
        mockComponentHealth.length
      )
    };

  } catch (error) {
    console.error('Failed to get self-healing data:', error);
    
    // Return fallback data
    return {
      overallHealth: 85,
      componentHealth: [
        {
          componentId: 'system-fallback',
          status: 'healthy' as const,
          healthScore: 85,
          trend: 'stable' as const,
          lastCheck: new Date()
        }
      ],
      activeRecoveries: [],
      recentEvents: [
        {
          type: 'system_info',
          message: 'Self-healing dashboard loaded with mock data',
          timestamp: new Date(),
          level: 'info' as const,
          component: 'dashboard'
        }
      ]
    };
  }
}

export default async function SelfHealingPage() {
  const systemHealthData = await getSelfHealingData();

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 lg:p-8">
      <SelfHealingDashboard 
        initialData={systemHealthData}
        refreshInterval={30000} // 30 seconds
      />
    </div>
  );
}
