export interface CapacityMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export interface CapacityPlan {
  current: CapacityMetrics;
  projected: CapacityMetrics;
  recommendations: string[];
}

export class CapacityPlanner {
  private metrics: CapacityMetrics[] = [];

  constructor() {
    // Capacity Planner initialized
  }

  addMetrics(metrics: CapacityMetrics): void {
    this.metrics.push(metrics);
  }

  generatePlan(): CapacityPlan {
    const current = this.getCurrentMetrics();
    const projected = this.projectFutureNeeds();
    const recommendations = this.generateRecommendations();

    return {
      current,
      projected,
      recommendations
    };
  }

  private getCurrentMetrics(): CapacityMetrics {
    if (this.metrics.length === 0) {
      return { cpu: 0, memory: 0, storage: 0, network: 0 };
    }
    
    const latest = this.metrics[this.metrics.length - 1];
    return { ...latest };
  }

  private projectFutureNeeds(): CapacityMetrics {
    const current = this.getCurrentMetrics();
    return {
      cpu: current.cpu * 1.2,
      memory: current.memory * 1.15,
      storage: current.storage * 1.3,
      network: current.network * 1.1
    };
  }

  private generateRecommendations(): string[] {
    return [
      "Monitor CPU usage trends",
      "Plan for memory expansion",
      "Implement storage optimization",
      "Review network capacity"
    ];
  }
}

export default CapacityPlanner;