import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HealthCheckHero } from '@/app/health-check/components/HealthCheckHero';
import { OverallHealthScore } from '@/app/health-check/components/OverallHealthScore';
import { EEATBreakdown } from '@/app/health-check/components/EEATBreakdown';
import { TechnicalAuditSummary } from '@/app/health-check/components/TechnicalAuditSummary';
import { ConnectionStatus } from '@/app/health-check/components/ConnectionStatus';
import { RealTimeThreatFeed } from '@/app/health-check/components/RealTimeThreatFeed';
import { CompetitorBenchmark } from '@/app/health-check/components/CompetitorBenchmark';
import { RecommendationGrid } from '@/app/health-check/components/RecommendationGrid';

describe('Health Check Dashboard Components', () => {
  describe('HealthCheckHero', () => {
    it('should render domain input field', () => {
      const mockOnAnalyze = vi.fn();
      render(<HealthCheckHero onAnalyze={mockOnAnalyze} loading={false} />);

      const input = screen.getByPlaceholderText(/enter domain/i);
      expect(input).toBeInTheDocument();
    });

    it('should validate domain format', async () => {
      const mockOnAnalyze = vi.fn();
      render(<HealthCheckHero onAnalyze={mockOnAnalyze} loading={false} />);

      const input = screen.getByPlaceholderText(/enter domain/i);
      const button = screen.getByText(/analyze/i);

      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid domain/i)).toBeInTheDocument();
      });
    });

    it('should accept valid domain and trigger analysis', async () => {
      const mockOnAnalyze = vi.fn();
      render(<HealthCheckHero onAnalyze={mockOnAnalyze} loading={false} />);

      const input = screen.getByPlaceholderText(/enter domain/i);
      const button = screen.getByText(/analyze/i);

      fireEvent.change(input, { target: { value: 'example.com' } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnAnalyze).toHaveBeenCalledWith('example.com');
      });
    });

    it('should show loading state while analyzing', () => {
      const mockOnAnalyze = vi.fn();
      render(<HealthCheckHero onAnalyze={mockOnAnalyze} loading={true} />);

      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    });

    it('should display info cards about features', () => {
      const mockOnAnalyze = vi.fn();
      render(<HealthCheckHero onAnalyze={mockOnAnalyze} loading={false} />);

      expect(screen.getByText(/6/)).toBeInTheDocument(); // Threat types
      expect(screen.getByText(/real-time/i)).toBeInTheDocument();
      expect(screen.getByText(/<2s/i)).toBeInTheDocument(); // Analysis time
    });
  });

  describe('OverallHealthScore', () => {
    const mockScore = 85;
    const mockHistory = [
      { overall_score: 80, created_at: '2025-01-10T10:00:00Z' },
      { overall_score: 82, created_at: '2025-01-11T10:00:00Z' },
      { overall_score: 85, created_at: '2025-01-12T10:00:00Z' },
    ];

    it('should render score display', () => {
      render(<OverallHealthScore score={mockScore} historicalScores={mockHistory} />);
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('should show score label', () => {
      render(<OverallHealthScore score={mockScore} historicalScores={mockHistory} />);
      expect(screen.getByText(/excellent/i)).toBeInTheDocument();
    });

    it('should display score range reference', () => {
      render(<OverallHealthScore score={mockScore} historicalScores={mockHistory} />);
      expect(screen.getByText(/80-100/)).toBeInTheDocument();
      expect(screen.getByText(/excellent/i)).toBeInTheDocument();
    });

    it('should show 7-day trend with direction indicator', () => {
      render(<OverallHealthScore score={mockScore} historicalScores={mockHistory} />);
      // Trend should show improvement (85 > 80)
      expect(screen.getByText(/80 → 85/)).toBeInTheDocument();
    });

    it('should display accessibility info', () => {
      const { container } = render(
        <OverallHealthScore score={mockScore} historicalScores={mockHistory} />,
      );
      const srText = container.querySelector('.sr-only');
      expect(srText?.textContent).toContain('85');
      expect(srText?.textContent).toContain('Excellent');
    });
  });

  describe('EEATBreakdown', () => {
    const mockEEAT = {
      expertise: 85,
      authority: 72,
      trust: 90,
    };

    it('should render three EEAT metrics', () => {
      render(<EEATBreakdown eeat={mockEEAT} />);

      expect(screen.getByText(/expertise/i)).toBeInTheDocument();
      expect(screen.getByText(/authority/i)).toBeInTheDocument();
      expect(screen.getByText(/trust/i)).toBeInTheDocument();
    });

    it('should display individual scores', () => {
      render(<EEATBreakdown eeat={mockEEAT} />);

      expect(screen.getByText('85')).toBeInTheDocument(); // Expertise
      expect(screen.getByText('72')).toBeInTheDocument(); // Authority
      expect(screen.getByText('90')).toBeInTheDocument(); // Trust
    });

    it('should calculate and display average', () => {
      render(<EEATBreakdown eeat={mockEEAT} />);

      const average = Math.round((85 + 72 + 90) / 3);
      expect(screen.getByText(String(average))).toBeInTheDocument();
    });

    it('should show score labels', () => {
      render(<EEATBreakdown eeat={mockEEAT} />);

      expect(screen.getAllByText(/excellent/i).length).toBeGreaterThan(0);
    });
  });

  describe('TechnicalAuditSummary', () => {
    const mockTechnical = {
      lcp: 2000, // Good
      cls: 0.08, // Good
      inp: 150, // Good
      security: 90, // Good
    };

    it('should render Core Web Vitals metrics', () => {
      render(<TechnicalAuditSummary technical={mockTechnical} />);

      expect(screen.getByText(/largest contentful paint/i)).toBeInTheDocument();
      expect(screen.getByText(/cumulative layout shift/i)).toBeInTheDocument();
      expect(screen.getByText(/interaction to next paint/i)).toBeInTheDocument();
    });

    it('should display metric values with units', () => {
      render(<TechnicalAuditSummary technical={mockTechnical} />);

      expect(screen.getByText(/2.00s/)).toBeInTheDocument(); // LCP in seconds
      expect(screen.getByText(/0.080/)).toBeInTheDocument(); // CLS
      expect(screen.getByText(/150ms/)).toBeInTheDocument(); // INP
    });

    it('should show security score', () => {
      render(<TechnicalAuditSummary technical={mockTechnical} />);
      expect(screen.getByText(/90\/100/)).toBeInTheDocument();
    });

    it('should display passing status indicators', () => {
      render(<TechnicalAuditSummary technical={mockTechnical} />);

      // All metrics are good, so should show "Passing"
      expect(screen.getAllByText(/passing/i).length).toBeGreaterThan(0);
    });

    it('should show summary grid with counts', () => {
      render(<TechnicalAuditSummary technical={mockTechnical} />);

      expect(screen.getByText(/metrics passing/i)).toBeInTheDocument();
    });

    it('should warn on poor LCP', () => {
      const poorTechnical = { ...mockTechnical, lcp: 5000 };
      render(<TechnicalAuditSummary technical={poorTechnical} />);

      expect(screen.getByText(/failing/i)).toBeInTheDocument();
    });
  });

  describe('ConnectionStatus', () => {
    it('should show connected status with green dot', () => {
      render(<ConnectionStatus isConnected={true} />);

      expect(screen.getByText(/live/i)).toBeInTheDocument();
    });

    it('should show disconnected status with red dot', () => {
      render(<ConnectionStatus isConnected={false} />);

      expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
    });
  });

  describe('RealTimeThreatFeed', () => {
    const mockThreats = [
      {
        id: '1',
        threat: {
          severity: 'critical',
          type: 'ranking_drop',
          title: 'Ranking Drop',
          description: 'Site dropped 5 positions',
          domain: 'example.com',
          detected_at: new Date().toISOString(),
        },
      },
    ];

    const mockSummary = {
      total: 1,
      critical: 1,
      high: 0,
      medium: 0,
      low: 0,
    };

    it('should render threat list', () => {
      render(
        <RealTimeThreatFeed threats={mockThreats} summary={mockSummary} isConnected={true} />,
      );

      expect(screen.getByText(/ranking drop/i)).toBeInTheDocument();
    });

    it('should show threat severity', () => {
      render(
        <RealTimeThreatFeed threats={mockThreats} summary={mockSummary} isConnected={true} />,
      );

      expect(screen.getByText(/critical/i)).toBeInTheDocument();
    });

    it('should display threat domain', () => {
      render(
        <RealTimeThreatFeed threats={mockThreats} summary={mockSummary} isConnected={true} />,
      );

      expect(screen.getByText(/example.com/)).toBeInTheDocument();
    });

    it('should show loading state when connecting', () => {
      render(<RealTimeThreatFeed threats={[]} summary={mockSummary} isConnected={false} />);

      expect(screen.getByText(/connecting to threat feed/i)).toBeInTheDocument();
    });

    it('should show empty state when no threats', () => {
      render(<RealTimeThreatFeed threats={[]} summary={mockSummary} isConnected={true} />);

      expect(screen.getByText(/no threats detected/i)).toBeInTheDocument();
    });

    it('should display severity summary stats', () => {
      render(
        <RealTimeThreatFeed threats={mockThreats} summary={mockSummary} isConnected={true} />,
      );

      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  describe('CompetitorBenchmark', () => {
    const mockCompetitors = [
      { domain: 'competitor1.com', health_score: 92 },
      { domain: 'competitor2.com', health_score: 85 },
      { domain: 'competitor3.com', health_score: 78 },
    ];

    it('should render top 3 competitors', () => {
      render(<CompetitorBenchmark competitors={mockCompetitors} currentDomain="example.com" />);

      expect(screen.getByText(/competitor1.com/)).toBeInTheDocument();
      expect(screen.getByText(/competitor2.com/)).toBeInTheDocument();
      expect(screen.getByText(/competitor3.com/)).toBeInTheDocument();
    });

    it('should display competitor ranking badges', () => {
      render(<CompetitorBenchmark competitors={mockCompetitors} currentDomain="example.com" />);

      expect(screen.getByText('1')).toBeInTheDocument(); // 1st place
      expect(screen.getByText('2')).toBeInTheDocument(); // 2nd place
      expect(screen.getByText('3')).toBeInTheDocument(); // 3rd place
    });

    it('should show health scores', () => {
      render(<CompetitorBenchmark competitors={mockCompetitors} currentDomain="example.com" />);

      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('78')).toBeInTheDocument();
    });

    it('should handle empty competitor list', () => {
      render(<CompetitorBenchmark competitors={[]} />);

      expect(screen.getByText(/no competitor data/i)).toBeInTheDocument();
    });
  });

  describe('RecommendationGrid', () => {
    const mockInsights = [
      {
        title: 'Improve Page Speed',
        impact: 'high',
        effort: 'low',
        description: 'Optimize images and enable caching',
      },
      {
        title: 'Build Backlinks',
        impact: 'high',
        effort: 'high',
        description: 'Establish authoritative linking profile',
      },
    ];

    it('should render recommendation cards', () => {
      render(<RecommendationGrid insights={mockInsights} />);

      expect(screen.getByText(/improve page speed/i)).toBeInTheDocument();
      expect(screen.getByText(/build backlinks/i)).toBeInTheDocument();
    });

    it('should categorize by impact/effort quadrants', () => {
      render(<RecommendationGrid insights={mockInsights} />);

      expect(screen.getByText(/quick wins/i)).toBeInTheDocument();
      expect(screen.getByText(/major projects/i)).toBeInTheDocument();
    });

    it('should show implementation strategy', () => {
      render(<RecommendationGrid insights={mockInsights} />);

      expect(screen.getByText(/implementation strategy/i)).toBeInTheDocument();
      expect(screen.getByText(/start with quick wins/i)).toBeInTheDocument();
    });

    it('should display summary counts', () => {
      render(<RecommendationGrid insights={mockInsights} />);

      expect(screen.getByText(/quick wins/i)).toBeInTheDocument();
    });

    it('should handle empty insights', () => {
      render(<RecommendationGrid insights={[]} />);

      expect(screen.getByText(/no recommendations yet/i)).toBeInTheDocument();
    });
  });
});
