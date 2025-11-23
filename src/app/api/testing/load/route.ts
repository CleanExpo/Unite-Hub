/**
 * Load Test API
 * Phase 65: Manage load test execution and results
 */

import { NextRequest, NextResponse } from 'next/server';
import LoadTestEngine, { LoadScenario } from '@/lib/testing/loadTestEngine';
import LoadReportService from '@/lib/testing/loadReportService';

const loadTestEngine = new LoadTestEngine();
const reportService = new LoadReportService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action') || 'status';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'status': {
        // Get current test status
        const currentTest = loadTestEngine.getCurrentTest();
        return NextResponse.json({
          current_test: currentTest,
          available_scenarios: loadTestEngine.getAvailableScenarios(),
        });
      }

      case 'scenarios': {
        // List available scenarios with configs
        const scenarios = loadTestEngine.getAvailableScenarios();
        const scenarioDetails = scenarios.map(scenario => ({
          scenario,
          config: loadTestEngine.getScenarioConfig(scenario),
        }));
        return NextResponse.json({ scenarios: scenarioDetails });
      }

      case 'report': {
        // Generate stability report (mock data for now)
        const mockLoadTests = [loadTestEngine.getCurrentTest()].filter(Boolean);
        const report = reportService.generateStabilityReport(
          workspaceId,
          mockLoadTests as any[],
          [],
          'weekly'
        );
        return NextResponse.json({ report });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Load test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, workspaceId, scenario, config } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start': {
        // Start a load test
        if (!scenario) {
          return NextResponse.json(
            { error: 'scenario is required' },
            { status: 400 }
          );
        }

        // Validate scenario
        const availableScenarios = loadTestEngine.getAvailableScenarios();
        if (!availableScenarios.includes(scenario as LoadScenario)) {
          return NextResponse.json(
            { error: `Invalid scenario. Available: ${availableScenarios.join(', ')}` },
            { status: 400 }
          );
        }

        // Check if test already running
        const currentTest = loadTestEngine.getCurrentTest();
        if (currentTest && currentTest.status === 'running') {
          return NextResponse.json(
            { error: 'A test is already running' },
            { status: 409 }
          );
        }

        // Start test in shadow mode
        const result = await loadTestEngine.startTest(
          workspaceId,
          scenario as LoadScenario,
          config
        );

        return NextResponse.json({
          message: 'Load test started',
          test: result,
        });
      }

      case 'abort': {
        // Abort current test
        loadTestEngine.abortTest();
        return NextResponse.json({
          message: 'Test aborted',
          test: loadTestEngine.getCurrentTest(),
        });
      }

      case 'generate_report': {
        // Generate report from historical data
        const mockLoadTests = [loadTestEngine.getCurrentTest()].filter(Boolean);
        const report = reportService.generateStabilityReport(
          workspaceId,
          mockLoadTests as any[],
          [],
          body.period || 'weekly'
        );

        return NextResponse.json({
          message: 'Report generated',
          report,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, abort, generate_report' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Load test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
