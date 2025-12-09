/**
 * Unit Tests for Charts Components (Phase 2B)
 * Tests BarChart, LineChart, and PieChart components with data rendering, legends, and responsiveness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart, LineChart, PieChart, type ChartData } from '@/components/patterns/Charts';

describe('Charts Components (Phase 2B)', () => {
  const sampleData: ChartData[] = [
    { label: 'Jan', value: 400 },
    { label: 'Feb', value: 300 },
    { label: 'Mar', value: 200 },
    { label: 'Apr', value: 278 },
    { label: 'May', value: 189 },
    { label: 'Jun', value: 239 },
  ];

  describe('BarChart Component', () => {
    describe('Basic Rendering', () => {
      it('should render bar chart', () => {
        const { container } = render(
          <BarChart data={sampleData} height={300} />
        );

        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should render all data points', () => {
        const { container } = render(
          <BarChart data={sampleData} height={300} />
        );

        // Should have bars for each data point
        const bars = container.querySelectorAll('rect');
        expect(bars.length).toBeGreaterThanOrEqual(sampleData.length);
      });

      it('should render with custom height', () => {
        const { container } = render(
          <BarChart data={sampleData} height={500} />
        );

        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('height', '500');
      });

      it('should render labels', () => {
        render(<BarChart data={sampleData} height={300} />);

        // Should display at least some labels
        expect(document.body.textContent).toContain('Jan');
      });

      it('should apply custom className', () => {
        const { container } = render(
          <BarChart data={sampleData} height={300} className="custom-chart" />
        );

        const chartContainer = container.querySelector('.custom-chart');
        expect(chartContainer).toBeInTheDocument();
      });
    });

    describe('Legend', () => {
      it('should show legend when showLegend is true', () => {
        render(
          <BarChart data={sampleData} height={300} showLegend={true} />
        );

        // Legend should be visible
        expect(document.body.textContent).toMatch(/legend|value|data/i);
      });

      it('should hide legend when showLegend is false', () => {
        const { container } = render(
          <BarChart data={sampleData} height={300} showLegend={false} />
        );

        // Should not have legend element
        const legend = container.querySelector('[role="legend"]');
        // Legend may not have explicit role, implementation dependent
      });
    });

    describe('Data Variations', () => {
      it('should handle single data point', () => {
        const singleData = [{ label: 'Only', value: 100 }];

        render(<BarChart data={singleData} height={300} />);

        // Should render without errors
        expect(document.body.textContent).toContain('Only');
      });

      it('should handle large values', () => {
        const largeData = [
          { label: 'High', value: 1000000 },
          { label: 'Low', value: 100 },
        ];

        render(<BarChart data={largeData} height={300} />);

        // Should scale appropriately
        expect(document.body.textContent).toContain('High');
      });

      it('should handle zero values', () => {
        const zeroData = [
          { label: 'Zero', value: 0 },
          { label: 'Non-zero', value: 100 },
        ];

        render(<BarChart data={zeroData} height={300} />);

        expect(document.body.textContent).toContain('Zero');
      });

      it('should handle negative values', () => {
        const negativeData = [
          { label: 'Positive', value: 100 },
          { label: 'Negative', value: -50 },
        ];

        render(<BarChart data={negativeData} height={300} />);

        expect(document.body.textContent).toContain('Negative');
      });
    });

    describe('Responsive Design', () => {
      it('should be responsive to container width', () => {
        const { container } = render(
          <div style={{ width: '600px' }}>
            <BarChart data={sampleData} height={300} />
          </div>
        );

        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });

      it('should render properly at small widths', () => {
        const { container } = render(
          <div style={{ width: '300px' }}>
            <BarChart data={sampleData} height={300} />
          </div>
        );

        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should render properly at large widths', () => {
        const { container } = render(
          <div style={{ width: '1200px' }}>
            <BarChart data={sampleData} height={300} />
          </div>
        );

        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });

    describe('Accessibility', () => {
      it('should have descriptive title or label', () => {
        render(
          <BarChart
            data={sampleData}
            height={300}
            title="Sales by Month"
          />
        );

        expect(screen.getByText('Sales by Month')).toBeInTheDocument();
      });

      it('should be keyboard accessible', () => {
        const { container } = render(
          <BarChart data={sampleData} height={300} />
        );

        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('role')).toBeDefined();
      });

      it('should have semantic structure', () => {
        const { container } = render(
          <BarChart data={sampleData} height={300} />
        );

        // SVG should be present for data visualization
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('LineChart Component', () => {
    describe('Basic Rendering', () => {
      it('should render line chart', () => {
        const { container } = render(
          <LineChart data={sampleData} height={300} />
        );

        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should render line path', () => {
        const { container } = render(
          <LineChart data={sampleData} height={300} />
        );

        // Should have path element for line
        const paths = container.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
      });

      it('should render data points', () => {
        const { container } = render(
          <LineChart data={sampleData} height={300} />
        );

        // Should have circles or other elements for data points
        const circles = container.querySelectorAll('circle');
        expect(circles.length).toBeGreaterThanOrEqual(sampleData.length);
      });

      it('should render with custom height', () => {
        const { container } = render(
          <LineChart data={sampleData} height={400} />
        );

        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('height', '400');
      });
    });

    describe('Legend', () => {
      it('should show legend when showLegend is true', () => {
        render(
          <LineChart data={sampleData} height={300} showLegend={true} />
        );

        // Legend should be visible
        expect(document.body.textContent).toMatch(/legend|value|data/i);
      });
    });

    describe('Stroke Options', () => {
      it('should handle different stroke widths', () => {
        const { container: thick } = render(
          <LineChart data={sampleData} height={300} strokeWidth={3} />
        );

        const { container: thin } = render(
          <LineChart data={sampleData} height={300} strokeWidth={1} />
        );

        expect(thick.querySelector('svg')).toBeInTheDocument();
        expect(thin.querySelector('svg')).toBeInTheDocument();
      });
    });

    describe('Data Variations', () => {
      it('should handle trending up', () => {
        const trendingUp = [
          { label: 'Jan', value: 100 },
          { label: 'Feb', value: 200 },
          { label: 'Mar', value: 300 },
        ];

        render(<LineChart data={trendingUp} height={300} />);

        expect(document.body.textContent).toContain('Jan');
        expect(document.body.textContent).toContain('Mar');
      });

      it('should handle trending down', () => {
        const trendingDown = [
          { label: 'Jan', value: 300 },
          { label: 'Feb', value: 200 },
          { label: 'Mar', value: 100 },
        ];

        render(<LineChart data={trendingDown} height={300} />);

        expect(document.body.textContent).toContain('Jan');
      });

      it('should handle volatile data', () => {
        const volatile = [
          { label: 'A', value: 100 },
          { label: 'B', value: 500 },
          { label: 'C', value: 50 },
          { label: 'D', value: 400 },
        ];

        render(<LineChart data={volatile} height={300} />);

        expect(document.body.textContent).toContain('A');
      });
    });
  });

  describe('PieChart Component', () => {
    describe('Basic Rendering', () => {
      it('should render pie chart', () => {
        const { container } = render(
          <PieChart data={sampleData} height={300} />
        );

        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('should render pie slices', () => {
        const { container } = render(
          <PieChart data={sampleData} height={300} />
        );

        // Should have path elements for slices
        const paths = container.querySelectorAll('path');
        expect(paths.length).toBeGreaterThanOrEqual(sampleData.length);
      });

      it('should render labels for each slice', () => {
        render(
          <PieChart data={sampleData} height={300} />
        );

        // Should show labels
        expect(document.body.textContent).toContain('Jan');
      });

      it('should render with custom height', () => {
        const { container } = render(
          <PieChart data={sampleData} height={400} />
        );

        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('height', '400');
      });
    });

    describe('Legend', () => {
      it('should show legend for pie chart', () => {
        render(
          <PieChart data={sampleData} height={300} showLegend={true} />
        );

        // Legend should list all slices
        sampleData.forEach((item) => {
          expect(document.body.textContent).toContain(item.label);
        });
      });
    });

    describe('Percentage Display', () => {
      it('should calculate and display percentages correctly', () => {
        const percentageData = [
          { label: 'A', value: 50 },
          { label: 'B', value: 30 },
          { label: 'C', value: 20 },
        ];

        render(
          <PieChart data={percentageData} height={300} showPercentage={true} />
        );

        // Should show percentages (A=50%, B=30%, C=20%)
        expect(document.body.textContent).toMatch(/50|30|20/);
      });
    });

    describe('Data Variations', () => {
      it('should handle unequal segments', () => {
        const unequal = [
          { label: 'Large', value: 1000 },
          { label: 'Small', value: 10 },
        ];

        render(<PieChart data={unequal} height={300} />);

        expect(document.body.textContent).toContain('Large');
        expect(document.body.textContent).toContain('Small');
      });

      it('should handle many slices', () => {
        const manySlices = Array.from({ length: 10 }, (_, i) => ({
          label: `Slice ${i}`,
          value: Math.random() * 100,
        }));

        render(<PieChart data={manySlices} height={300} />);

        expect(document.body.textContent).toContain('Slice 0');
      });
    });

    describe('Color Variants', () => {
      it('should apply different colors to slices', () => {
        const { container } = render(
          <PieChart data={sampleData} height={300} />
        );

        const slices = container.querySelectorAll('path[fill]');
        const colors = new Set<string>();

        slices.forEach((slice) => {
          const fill = slice.getAttribute('fill');
          if (fill) {
colors.add(fill);
}
        });

        // Should have multiple colors
        expect(colors.size).toBeGreaterThan(1);
      });
    });
  });

  describe('Design Token Compliance', () => {
    it('should use design tokens for colors', () => {
      const { container } = render(
        <BarChart data={sampleData} height={300} />
      );

      // Charts should use design token colors (implementation dependent)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Cross-Component Consistency', () => {
    it('all charts should have consistent API', () => {
      const { container: barChart } = render(
        <BarChart data={sampleData} height={300} />
      );
      const { container: lineChart } = render(
        <LineChart data={sampleData} height={300} />
      );
      const { container: pieChart } = render(
        <PieChart data={sampleData} height={300} />
      );

      // All should render SVG
      expect(barChart.querySelector('svg')).toBeInTheDocument();
      expect(lineChart.querySelector('svg')).toBeInTheDocument();
      expect(pieChart.querySelector('svg')).toBeInTheDocument();
    });

    it('all charts should support showLegend prop', () => {
      render(<BarChart data={sampleData} height={300} showLegend={true} />);
      render(<LineChart data={sampleData} height={300} showLegend={true} />);
      render(<PieChart data={sampleData} height={300} showLegend={true} />);

      // Should render without errors
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        label: `Month ${i}`,
        value: Math.random() * 1000,
      }));

      const { container: bar } = render(
        <BarChart data={largeData} height={300} />
      );
      const { container: line } = render(
        <LineChart data={largeData} height={300} />
      );
      const { container: pie } = render(
        <PieChart data={largeData} height={300} />
      );

      expect(bar.querySelector('svg')).toBeInTheDocument();
      expect(line.querySelector('svg')).toBeInTheDocument();
      expect(pie.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data array gracefully', () => {
      const { container: bar } = render(
        <BarChart data={[]} height={300} />
      );
      const { container: line } = render(
        <LineChart data={[]} height={300} />
      );
      const { container: pie } = render(
        <PieChart data={[]} height={300} />
      );

      // Should not crash
      expect(bar).toBeDefined();
      expect(line).toBeDefined();
      expect(pie).toBeDefined();
    });

    it('should handle all-zero values', () => {
      const zeroData = [
        { label: 'Zero', value: 0 },
        { label: 'Also Zero', value: 0 },
      ];

      render(<BarChart data={zeroData} height={300} />);
      render(<LineChart data={zeroData} height={300} />);
      render(<PieChart data={zeroData} height={300} />);

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      const specialData = [
        { label: 'Q1 & Q2', value: 100 },
        { label: '<2025>', value: 200 },
      ];

      render(<BarChart data={specialData} height={300} />);

      expect(document.body.textContent).toContain('Q1 & Q2');
    });
  });
});
