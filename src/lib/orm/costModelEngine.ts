/**
 * Cost Model Engine
 * Phase 67: Compute per-client and per-agent costs from real usage data
 */

export interface CostBreakdown {
  ai_tokens: number;
  storage_gb: number;
  bandwidth_gb: number;
  compute_hours: number;
  email_sends: number;
  voice_chars: number;
  image_generations: number;
  total: number;
}

export interface ClientCostRecord {
  client_id: string;
  workspace_id: string;
  period: string; // YYYY-MM-DD week start
  costs: CostBreakdown;
  revenue: number;
  margin: number;
  margin_percent: number;
  cost_per_deliverable: number;
  deliverable_count: number;
}

export interface AgentCostRecord {
  agent_id: string;
  workspace_id: string;
  period: string;
  tokens_used: number;
  cost: number;
  requests_count: number;
  avg_cost_per_request: number;
}

export interface CostRates {
  claude_per_1k_tokens: number;
  gemini_per_1k_tokens: number;
  openai_per_1k_tokens: number;
  elevenlabs_per_1k_chars: number;
  storage_per_gb: number;
  bandwidth_per_gb: number;
  compute_per_hour: number;
  email_per_send: number;
  image_per_generation: number;
}

// Default cost rates (adjust based on actual contracts)
const DEFAULT_RATES: CostRates = {
  claude_per_1k_tokens: 0.015,
  gemini_per_1k_tokens: 0.001,
  openai_per_1k_tokens: 0.01,
  elevenlabs_per_1k_chars: 0.30,
  storage_per_gb: 0.10,
  bandwidth_per_gb: 0.05,
  compute_per_hour: 0.05,
  email_per_send: 0.001,
  image_per_generation: 0.02,
};

export interface UsageData {
  claude_tokens: number;
  gemini_tokens: number;
  openai_tokens: number;
  elevenlabs_chars: number;
  storage_gb: number;
  bandwidth_gb: number;
  compute_hours: number;
  email_sends: number;
  image_generations: number;
}

export class CostModelEngine {
  private rates: CostRates;

  constructor(rates?: Partial<CostRates>) {
    this.rates = { ...DEFAULT_RATES, ...rates };
  }

  /**
   * Calculate total cost from usage data
   */
  calculateCost(usage: UsageData): CostBreakdown {
    const ai_tokens =
      (usage.claude_tokens / 1000) * this.rates.claude_per_1k_tokens +
      (usage.gemini_tokens / 1000) * this.rates.gemini_per_1k_tokens +
      (usage.openai_tokens / 1000) * this.rates.openai_per_1k_tokens;

    const storage_gb = usage.storage_gb * this.rates.storage_per_gb;
    const bandwidth_gb = usage.bandwidth_gb * this.rates.bandwidth_per_gb;
    const compute_hours = usage.compute_hours * this.rates.compute_per_hour;
    const email_sends = usage.email_sends * this.rates.email_per_send;
    const voice_chars = (usage.elevenlabs_chars / 1000) * this.rates.elevenlabs_per_1k_chars;
    const image_generations = usage.image_generations * this.rates.image_per_generation;

    const total = ai_tokens + storage_gb + bandwidth_gb + compute_hours + email_sends + voice_chars + image_generations;

    return {
      ai_tokens: Math.round(ai_tokens * 100) / 100,
      storage_gb: Math.round(storage_gb * 100) / 100,
      bandwidth_gb: Math.round(bandwidth_gb * 100) / 100,
      compute_hours: Math.round(compute_hours * 100) / 100,
      email_sends: Math.round(email_sends * 100) / 100,
      voice_chars: Math.round(voice_chars * 100) / 100,
      image_generations: Math.round(image_generations * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Calculate client cost record
   */
  calculateClientCost(
    clientId: string,
    workspaceId: string,
    period: string,
    usage: UsageData,
    revenue: number,
    deliverableCount: number
  ): ClientCostRecord {
    const costs = this.calculateCost(usage);
    const margin = revenue - costs.total;
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
    const costPerDeliverable = deliverableCount > 0 ? costs.total / deliverableCount : 0;

    return {
      client_id: clientId,
      workspace_id: workspaceId,
      period,
      costs,
      revenue,
      margin: Math.round(margin * 100) / 100,
      margin_percent: Math.round(marginPercent * 10) / 10,
      cost_per_deliverable: Math.round(costPerDeliverable * 100) / 100,
      deliverable_count: deliverableCount,
    };
  }

  /**
   * Calculate agent cost record
   */
  calculateAgentCost(
    agentId: string,
    workspaceId: string,
    period: string,
    tokensUsed: number,
    requestsCount: number,
    provider: 'claude' | 'gemini' | 'openai' = 'claude'
  ): AgentCostRecord {
    const rateKey = `${provider}_per_1k_tokens` as keyof CostRates;
    const rate = this.rates[rateKey] as number;
    const cost = (tokensUsed / 1000) * rate;
    const avgCostPerRequest = requestsCount > 0 ? cost / requestsCount : 0;

    return {
      agent_id: agentId,
      workspace_id: workspaceId,
      period,
      tokens_used: tokensUsed,
      cost: Math.round(cost * 100) / 100,
      requests_count: requestsCount,
      avg_cost_per_request: Math.round(avgCostPerRequest * 1000) / 1000,
    };
  }

  /**
   * Aggregate costs across multiple clients
   */
  aggregateCosts(records: ClientCostRecord[]): {
    total_cost: number;
    total_revenue: number;
    total_margin: number;
    avg_margin_percent: number;
    clients_count: number;
    profitable_clients: number;
    loss_clients: number;
  } {
    if (records.length === 0) {
      return {
        total_cost: 0,
        total_revenue: 0,
        total_margin: 0,
        avg_margin_percent: 0,
        clients_count: 0,
        profitable_clients: 0,
        loss_clients: 0,
      };
    }

    const totalCost = records.reduce((sum, r) => sum + r.costs.total, 0);
    const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);
    const totalMargin = totalRevenue - totalCost;
    const avgMarginPercent = records.reduce((sum, r) => sum + r.margin_percent, 0) / records.length;
    const profitableClients = records.filter(r => r.margin > 0).length;
    const lossClients = records.filter(r => r.margin < 0).length;

    return {
      total_cost: Math.round(totalCost * 100) / 100,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_margin: Math.round(totalMargin * 100) / 100,
      avg_margin_percent: Math.round(avgMarginPercent * 10) / 10,
      clients_count: records.length,
      profitable_clients: profitableClients,
      loss_clients: lossClients,
    };
  }

  /**
   * Get cost breakdown by category
   */
  getCostBreakdownByCategory(records: ClientCostRecord[]): {
    category: string;
    total: number;
    percent: number;
  }[] {
    const totals = {
      ai_tokens: 0,
      storage_gb: 0,
      bandwidth_gb: 0,
      compute_hours: 0,
      email_sends: 0,
      voice_chars: 0,
      image_generations: 0,
    };

    for (const record of records) {
      totals.ai_tokens += record.costs.ai_tokens;
      totals.storage_gb += record.costs.storage_gb;
      totals.bandwidth_gb += record.costs.bandwidth_gb;
      totals.compute_hours += record.costs.compute_hours;
      totals.email_sends += record.costs.email_sends;
      totals.voice_chars += record.costs.voice_chars;
      totals.image_generations += record.costs.image_generations;
    }

    const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);

    return [
      { category: 'AI Tokens', total: totals.ai_tokens, percent: grandTotal > 0 ? (totals.ai_tokens / grandTotal) * 100 : 0 },
      { category: 'Storage', total: totals.storage_gb, percent: grandTotal > 0 ? (totals.storage_gb / grandTotal) * 100 : 0 },
      { category: 'Bandwidth', total: totals.bandwidth_gb, percent: grandTotal > 0 ? (totals.bandwidth_gb / grandTotal) * 100 : 0 },
      { category: 'Compute', total: totals.compute_hours, percent: grandTotal > 0 ? (totals.compute_hours / grandTotal) * 100 : 0 },
      { category: 'Email', total: totals.email_sends, percent: grandTotal > 0 ? (totals.email_sends / grandTotal) * 100 : 0 },
      { category: 'Voice', total: totals.voice_chars, percent: grandTotal > 0 ? (totals.voice_chars / grandTotal) * 100 : 0 },
      { category: 'Images', total: totals.image_generations, percent: grandTotal > 0 ? (totals.image_generations / grandTotal) * 100 : 0 },
    ].map(c => ({
      ...c,
      total: Math.round(c.total * 100) / 100,
      percent: Math.round(c.percent * 10) / 10,
    }));
  }

  /**
   * Update cost rates
   */
  updateRates(newRates: Partial<CostRates>): void {
    this.rates = { ...this.rates, ...newRates };
  }

  /**
   * Get current rates
   */
  getRates(): CostRates {
    return { ...this.rates };
  }
}

export default CostModelEngine;
