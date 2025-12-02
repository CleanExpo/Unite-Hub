/**
 * Competitive Benchmark Service
 * Phase 89A: Head-to-head competitor analysis
 */

import logger from '@/lib/logger';

export interface CompetitorMetrics {
  domain: string;
  ranking_keywords: number;
  estimated_monthly_traffic: number;
  average_ranking_position: number;
  domain_authority: number;
  visibility_score: number;
}

export interface CompetitiveBenchmarkResult {
  summary: {
    overall_market_position: 'leader' | 'strong_challenger' | 'challenger' | 'emerging';
    win_loss_ratio: number;
    biggest_threat: string;
    biggest_opportunity: string;
    competitive_gap: number;
  };
  competitors: CompetitorMetrics[];
  win_loss_analysis: {
    keywords_winning: number;
    keywords_losing: number;
    keywords_tied: number;
  };
}

export class CompetitiveBenchmarkService {
  analyzeBenchmark(clientDomain: string, competitors: string[]): CompetitiveBenchmarkResult {
    logger.info('[CompetitiveBenchmark] Starting analysis', {
      clientDomain,
      competitors: competitors.length,
    });

    const competitorData = this.generateMockCompetitorData(competitors);
    const clientData = this.generateMockCompetitorData([clientDomain])[0];

    const winLossAnalysis = {
      keywords_winning: Math.floor(Math.random() * 150) + 50,
      keywords_losing: Math.floor(Math.random() * 200) + 75,
      keywords_tied: Math.floor(Math.random() * 50),
    };

    const winLossRatio = winLossAnalysis.keywords_winning / Math.max(1, winLossAnalysis.keywords_losing);
    const competitivePower = clientData.ranking_keywords + clientData.domain_authority;
    const biggestThreat = competitorData[0]?.domain || competitors[0] || 'unknown';
    const biggest_opportunity = 'Long-tail keyword targeting';

    return {
      summary: {
        overall_market_position: winLossRatio > 1.5 ? 'leader' : winLossRatio > 0.8 ? 'strong_challenger' : winLossRatio > 0.5 ? 'challenger' : 'emerging',
        win_loss_ratio: Math.round(winLossRatio * 100) / 100,
        biggest_threat: biggestThreat,
        biggest_opportunity,
        competitive_gap: competitivePower - (competitorData[0]?.ranking_keywords || 0) - (competitorData[0]?.domain_authority || 0),
      },
      competitors: competitorData,
      win_loss_analysis,
    };
  }

  private generateMockCompetitorData(domains: string[]): CompetitorMetrics[] {
    return domains.map(domain => ({
      domain,
      ranking_keywords: Math.floor(Math.random() * 5000) + 500,
      estimated_monthly_traffic: Math.floor(Math.random() * 500000) + 10000,
      average_ranking_position: Math.floor(Math.random() * 30) + 5,
      domain_authority: Math.floor(Math.random() * 70) + 20,
      visibility_score: Math.floor(Math.random() * 100),
    }));
  }
}

export const competitiveBenchmarkService = new CompetitiveBenchmarkService();
