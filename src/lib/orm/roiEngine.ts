/**
 * ROI Engine
 * Phase 67: Real ROI score computation from actual outputs and deliverables
 */

export interface DeliverableMetrics {
  seo_audits_completed: number;
  rankings_improved: number;
  visual_assets_created: number;
  campaigns_launched: number;
  emails_sent: number;
  content_pieces_published: number;
  reports_generated: number;
  leads_generated: number;
  conversions: number;
}

export interface ClientROI {
  client_id: string;
  client_name: string;
  workspace_id: string;
  period: string;
  deliverables: DeliverableMetrics;
  value_delivered_index: number; // 0-100
  roi_score: number; // Based on cost vs value
  cost_efficiency: number; // Deliverables per dollar
  quality_score: number; // Based on outcomes
  timeline_adherence: number; // % on-time delivery
  overall_rating: 'excellent' | 'good' | 'fair' | 'poor';
  highlights: string[];
  areas_for_improvement: string[];
}

export interface ROISummary {
  workspace_id: string;
  period: string;
  total_deliverables: number;
  avg_value_delivered_index: number;
  avg_roi_score: number;
  top_performers: { client_id: string; client_name: string; roi_score: number }[];
  bottom_performers: { client_id: string; client_name: string; roi_score: number }[];
  deliverable_breakdown: { type: string; count: number; percent: number }[];
}

// Value weights for different deliverable types
const DELIVERABLE_VALUES: Record<keyof DeliverableMetrics, number> = {
  seo_audits_completed: 15,
  rankings_improved: 20,
  visual_assets_created: 10,
  campaigns_launched: 25,
  emails_sent: 1,
  content_pieces_published: 12,
  reports_generated: 8,
  leads_generated: 30,
  conversions: 50,
};

export class ROIEngine {
  /**
   * Calculate client ROI
   */
  calculateClientROI(
    clientId: string,
    clientName: string,
    workspaceId: string,
    period: string,
    deliverables: DeliverableMetrics,
    totalCost: number,
    timelineAdherence: number = 85
  ): ClientROI {
    // Calculate value delivered index (0-100)
    let totalValue = 0;
    let maxPossibleValue = 0;

    for (const [key, count] of Object.entries(deliverables)) {
      const value = DELIVERABLE_VALUES[key as keyof DeliverableMetrics];
      totalValue += count * value;
      // Assume reasonable max for normalization
      maxPossibleValue += 10 * value; // Max 10 of each type
    }

    const valueDeliveredIndex = Math.min(100, (totalValue / maxPossibleValue) * 100);

    // Calculate ROI score
    const costEfficiency = totalCost > 0 ? totalValue / totalCost : 0;
    const roiScore = Math.min(100, costEfficiency * 10); // Normalize to 0-100

    // Calculate quality score based on high-value deliverables
    const highValueDeliverables = deliverables.leads_generated + deliverables.conversions + deliverables.rankings_improved;
    const qualityScore = Math.min(100, highValueDeliverables * 5);

    // Determine overall rating
    const avgScore = (valueDeliveredIndex + roiScore + qualityScore + timelineAdherence) / 4;
    let overallRating: 'excellent' | 'good' | 'fair' | 'poor';
    if (avgScore >= 80) {
overallRating = 'excellent';
} else if (avgScore >= 60) {
overallRating = 'good';
} else if (avgScore >= 40) {
overallRating = 'fair';
} else {
overallRating = 'poor';
}

    // Generate highlights
    const highlights: string[] = [];
    if (deliverables.conversions > 0) {
      highlights.push(`${deliverables.conversions} conversion(s) achieved`);
    }
    if (deliverables.leads_generated > 5) {
      highlights.push(`Strong lead generation: ${deliverables.leads_generated} leads`);
    }
    if (deliverables.rankings_improved > 10) {
      highlights.push(`Significant SEO improvement: ${deliverables.rankings_improved} rankings up`);
    }
    if (timelineAdherence >= 90) {
      highlights.push('Excellent timeline adherence');
    }

    // Generate improvement areas
    const areasForImprovement: string[] = [];
    if (deliverables.conversions === 0) {
      areasForImprovement.push('Focus on conversion optimization');
    }
    if (deliverables.leads_generated < 3) {
      areasForImprovement.push('Increase lead generation activities');
    }
    if (timelineAdherence < 70) {
      areasForImprovement.push('Improve delivery timeline adherence');
    }
    if (costEfficiency < 5) {
      areasForImprovement.push('Review cost efficiency of deliverables');
    }

    return {
      client_id: clientId,
      client_name: clientName,
      workspace_id: workspaceId,
      period,
      deliverables,
      value_delivered_index: Math.round(valueDeliveredIndex * 10) / 10,
      roi_score: Math.round(roiScore * 10) / 10,
      cost_efficiency: Math.round(costEfficiency * 100) / 100,
      quality_score: Math.round(qualityScore * 10) / 10,
      timeline_adherence: timelineAdherence,
      overall_rating: overallRating,
      highlights,
      areas_for_improvement: areasForImprovement,
    };
  }

  /**
   * Generate ROI summary
   */
  generateROISummary(
    workspaceId: string,
    period: string,
    clientROIs: ClientROI[]
  ): ROISummary {
    if (clientROIs.length === 0) {
      return {
        workspace_id: workspaceId,
        period,
        total_deliverables: 0,
        avg_value_delivered_index: 0,
        avg_roi_score: 0,
        top_performers: [],
        bottom_performers: [],
        deliverable_breakdown: [],
      };
    }

    // Aggregate deliverables
    const totalDeliverables: DeliverableMetrics = {
      seo_audits_completed: 0,
      rankings_improved: 0,
      visual_assets_created: 0,
      campaigns_launched: 0,
      emails_sent: 0,
      content_pieces_published: 0,
      reports_generated: 0,
      leads_generated: 0,
      conversions: 0,
    };

    for (const roi of clientROIs) {
      for (const key of Object.keys(totalDeliverables) as (keyof DeliverableMetrics)[]) {
        totalDeliverables[key] += roi.deliverables[key];
      }
    }

    const totalCount = Object.values(totalDeliverables).reduce((sum, v) => sum + v, 0);
    const avgValueDeliveredIndex = clientROIs.reduce((sum, r) => sum + r.value_delivered_index, 0) / clientROIs.length;
    const avgROIScore = clientROIs.reduce((sum, r) => sum + r.roi_score, 0) / clientROIs.length;

    // Top and bottom performers
    const sorted = [...clientROIs].sort((a, b) => b.roi_score - a.roi_score);
    const topPerformers = sorted.slice(0, 3).map(r => ({
      client_id: r.client_id,
      client_name: r.client_name,
      roi_score: r.roi_score,
    }));
    const bottomPerformers = sorted.slice(-3).reverse().map(r => ({
      client_id: r.client_id,
      client_name: r.client_name,
      roi_score: r.roi_score,
    }));

    // Deliverable breakdown
    const deliverableBreakdown = Object.entries(totalDeliverables)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        type: this.formatDeliverableType(type),
        count,
        percent: totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      workspace_id: workspaceId,
      period,
      total_deliverables: totalCount,
      avg_value_delivered_index: Math.round(avgValueDeliveredIndex * 10) / 10,
      avg_roi_score: Math.round(avgROIScore * 10) / 10,
      top_performers: topPerformers,
      bottom_performers: bottomPerformers,
      deliverable_breakdown: deliverableBreakdown,
    };
  }

  /**
   * Format deliverable type for display
   */
  private formatDeliverableType(type: string): string {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Calculate value-per-cost ratio
   */
  calculateValuePerCostRatio(roi: ClientROI, cost: number): number {
    if (cost === 0) {
return 0;
}
    return Math.round((roi.value_delivered_index / cost) * 100) / 100;
  }

  /**
   * Get deliverable value weights
   */
  getDeliverableValues(): Record<string, number> {
    return { ...DELIVERABLE_VALUES };
  }
}

export default ROIEngine;
