/**
 * Agent Performance Prediction Model (APPM)
 * Evaluates agent task failure risk based on skill readiness and drift
 *
 * Read-only analysis - produces advisory risk assessments only
 * Does NOT block agent execution
 */

import fs from 'fs';
import path from 'path';
import { appmConfig } from './appm-config';
import { svieConfig } from '../svie-config';

export interface AgentRiskProfile {
  skillName: string;
  driftCount: number;
  healthScore: number;
  usageCount: number;
  riskContribution: number;
  issues: string[];
}

export interface APPMAnalysis {
  timestamp: string;
  totalSkillsEvaluated: number;
  overallRiskScore: number;
  riskClassification: 'high-risk' | 'medium-risk' | 'low-risk';
  riskBreakdown: {
    driftIssues: number;
    underutilizedSkills: number;
    poorHealthSkills: number;
    missingTests: number;
    missingDocs: number;
  };
  highRiskSkills: AgentRiskProfile[];
  mediumRiskSkills: AgentRiskProfile[];
  lowRiskSkills: AgentRiskProfile[];
  recommendations: string[];
  insights: string[];
}

export class AgentPerformancePredictionModel {
  /**
   * Load SVIE report from filesystem
   */
  private loadSVIEReport(): any {
    try {
      const reportPath = path.join(svieConfig.reportDir, 'SVIE_ANALYSIS_*.json');
      // Find latest report
      const reports = fs.readdirSync(svieConfig.reportDir)
        .filter(f => f.startsWith('SVIE_ANALYSIS_') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (reports.length === 0) {
        console.warn('⚠️  No SVIE report found');
        return null;
      }

      const latestReport = reports[0];
      const content = fs.readFileSync(path.join(svieConfig.reportDir, latestReport), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Failed to load SVIE report:', error);
      return null;
    }
  }

  /**
   * Load Drift report from filesystem
   */
  private loadDriftReport(): any {
    try {
      const reports = fs.readdirSync(svieConfig.reportDir)
        .filter(f => f.startsWith('SKILL_DRIFT_') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (reports.length === 0) {
        console.warn('⚠️  No Drift report found');
        return null;
      }

      const latestReport = reports[0];
      const content = fs.readFileSync(path.join(svieConfig.reportDir, latestReport), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Failed to load Drift report:', error);
      return null;
    }
  }

  /**
   * Calculate risk score for a skill
   */
  private calculateSkillRisk(
    skillName: string,
    svieData: any,
    driftData: any
  ): AgentRiskProfile {
    let riskScore = 0;
    const issues: string[] = [];

    // Get SVIE data for this skill
    const svieSkill = svieData?.analyzedSkills?.find((s: any) => s.name === skillName);
    const healthScore = svieSkill?.healthScore || 5;

    // Get drift data for this skill
    const driftIssues = driftData?.issues?.filter((i: any) => i.skillName === skillName) || [];
    const driftCount = driftIssues.length;

    // Calculate risk contributions
    const driftRisk = driftCount * appmConfig.riskWeights.driftIssue;
    riskScore += driftRisk;

    if (driftCount > 0) {
      issues.push(`${driftCount} drift issue${driftCount !== 1 ? 's' : ''} detected`);
    }

    // Poor health risk
    if (healthScore < 4) {
      riskScore += appmConfig.riskWeights.poorHealthSkill;
      issues.push(`Poor health score: ${healthScore}/10`);
    }

    // Underutilized risk
    if (svieSkill?.usageCount < 5) {
      riskScore += appmConfig.riskWeights.underutilizedSkill;
      issues.push(`Underutilized (${svieSkill?.usageCount || 0} uses)`);
    }

    // Missing tests
    if (!driftIssues.some((i: any) => i.issueType === 'missing_tests')) {
      // riskScore += appmConfig.riskWeights.missingTest;
      issues.push('Missing test coverage');
    }

    // Missing docs
    if (driftIssues.some((i: any) => i.issueType === 'missing_documentation')) {
      riskScore += appmConfig.riskWeights.missingDocs;
      issues.push('Missing or incomplete documentation');
    }

    return {
      skillName,
      driftCount,
      healthScore,
      usageCount: svieSkill?.usageCount || 0,
      riskContribution: Math.round(riskScore),
      issues
    };
  }

  /**
   * Evaluate overall agent performance risk
   */
  async evaluateAgentPerformance(): Promise<APPMAnalysis> {
    console.log('[APPM] Starting agent performance evaluation...');
    const startTime = Date.now();

    const analysis: APPMAnalysis = {
      timestamp: new Date().toISOString(),
      totalSkillsEvaluated: 0,
      overallRiskScore: 0,
      riskClassification: 'low-risk',
      riskBreakdown: {
        driftIssues: 0,
        underutilizedSkills: 0,
        poorHealthSkills: 0,
        missingTests: 0,
        missingDocs: 0
      },
      highRiskSkills: [],
      mediumRiskSkills: [],
      lowRiskSkills: [],
      recommendations: [],
      insights: []
    };

    try {
      // Load reports
      const svieData = this.loadSVIEReport();
      const driftData = this.loadDriftReport();

      if (!svieData?.analyzedSkills) {
        console.warn('⚠️  No skill data available');
        return analysis;
      }

      // Evaluate each skill
      const skillRisks: AgentRiskProfile[] = [];
      for (const skill of svieData.analyzedSkills) {
        const risk = this.calculateSkillRisk(skill.name, svieData, driftData);
        skillRisks.push(risk);
      }

      analysis.totalSkillsEvaluated = skillRisks.length;

      // Calculate breakdowns
      analysis.riskBreakdown.driftIssues = driftData?.issues?.length || 0;
      analysis.riskBreakdown.underutilizedSkills = svieData?.summary?.underutilizedSkills?.length || 0;
      analysis.riskBreakdown.poorHealthSkills = svieData?.summary?.poorHealthSkills?.length || 0;
      analysis.riskBreakdown.missingTests = driftData?.driftByCategory?.missing_tests || 0;
      analysis.riskBreakdown.missingDocs = driftData?.driftByCategory?.missing_documentation || 0;

      // Classify skills by risk
      for (const risk of skillRisks) {
        if (risk.riskContribution > appmConfig.riskThresholds.highRisk) {
          analysis.highRiskSkills.push(risk);
        } else if (risk.riskContribution > appmConfig.riskThresholds.mediumRisk) {
          analysis.mediumRiskSkills.push(risk);
        } else {
          analysis.lowRiskSkills.push(risk);
        }
      }

      // Sort by risk contribution
      analysis.highRiskSkills.sort((a, b) => b.riskContribution - a.riskContribution);
      analysis.mediumRiskSkills.sort((a, b) => b.riskContribution - a.riskContribution);

      // Calculate overall risk score
      const totalRisk = skillRisks.reduce((sum, skill) => sum + skill.riskContribution, 0);
      analysis.overallRiskScore = Math.round(totalRisk / Math.max(skillRisks.length, 1));

      // Classify overall risk
      if (analysis.overallRiskScore > appmConfig.riskThresholds.highRisk) {
        analysis.riskClassification = 'high-risk';
      } else if (analysis.overallRiskScore > appmConfig.riskThresholds.mediumRisk) {
        analysis.riskClassification = 'medium-risk';
      } else {
        analysis.riskClassification = 'low-risk';
      }

      // Generate insights
      analysis.insights = this.generateInsights(analysis, skillRisks);

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      console.log(`✓ Agent performance evaluation complete in ${(Date.now() - startTime) / 1000}s`);
      console.log(`  Overall Risk Score: ${analysis.overallRiskScore}/100`);
      console.log(`  Risk Classification: ${analysis.riskClassification}`);

      return analysis;
    } catch (error) {
      console.error('[APPM] Evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(analysis: APPMAnalysis, allSkills: AgentRiskProfile[]): string[] {
    const insights: string[] = [];

    // High-risk summary
    if (analysis.highRiskSkills.length > 0) {
      insights.push(
        `🚨 HIGH RISK: ${analysis.highRiskSkills.length} skill${analysis.highRiskSkills.length !== 1 ? 's' : ''} ` +
        `at immediate failure risk`
      );
    }

    // Medium-risk summary
    if (analysis.mediumRiskSkills.length > 0) {
      insights.push(
        `⚠️  MEDIUM RISK: ${analysis.mediumRiskSkills.length} skill${analysis.mediumRiskSkills.length !== 1 ? 's' : ''} ` +
        `require monitoring`
      );
    }

    // Low-risk status
    if (analysis.lowRiskSkills.length > 0 && analysis.highRiskSkills.length === 0) {
      insights.push(
        `✅ LOW RISK: ${analysis.lowRiskSkills.length} skill${analysis.lowRiskSkills.length !== 1 ? 's' : ''} ` +
        `healthy and ready`
      );
    }

    // Drift summary
    if (analysis.riskBreakdown.driftIssues > 0) {
      insights.push(
        `📋 DRIFT: ${analysis.riskBreakdown.driftIssues} issue${analysis.riskBreakdown.driftIssues !== 1 ? 's' : ''} ` +
        `detected across portfolio`
      );
    }

    // Utilization summary
    if (analysis.riskBreakdown.underutilizedSkills > 0) {
      const pct = Math.round((analysis.riskBreakdown.underutilizedSkills / analysis.totalSkillsEvaluated) * 100);
      insights.push(
        `💤 UTILIZATION: ${pct}% of skills underutilized`
      );
    }

    return insights;
  }

  /**
   * Generate executive recommendations
   */
  private generateRecommendations(analysis: APPMAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.riskClassification === 'high-risk') {
      recommendations.push(
        `🚨 PRIORITY 1: Immediate action required - ${analysis.highRiskSkills.length} skills at failure risk`
      );
      if (analysis.riskBreakdown.driftIssues > 0) {
        recommendations.push(
          `   • Fix ${analysis.riskBreakdown.driftIssues} architectural/security drift issues`
        );
      }
      if (analysis.highRiskSkills.length > 0) {
        recommendations.push(
          `   • Audit top ${Math.min(3, analysis.highRiskSkills.length)} highest-risk skills`
        );
      }
    }

    if (analysis.riskClassification === 'medium-risk') {
      recommendations.push(
        `⚠️  PRIORITY 2: Plan modernization sprint - ${analysis.mediumRiskSkills.length} skills need attention`
      );
    }

    if (analysis.riskBreakdown.underutilizedSkills > 3) {
      recommendations.push(
        `💤 PRIORITY 3: Review ${analysis.riskBreakdown.underutilizedSkills} underutilized skills for consolidation`
      );
    }

    if (analysis.riskBreakdown.missingTests > 5) {
      recommendations.push(
        `🧪 PRIORITY 4: Increase test coverage - ${analysis.riskBreakdown.missingTests} skills missing tests`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        `✅ Portfolio is healthy - maintain current practices and continue monitoring`
      );
    }

    return recommendations;
  }
}

export async function evaluateAgentPerformance(): Promise<APPMAnalysis> {
  const model = new AgentPerformancePredictionModel();
  return model.evaluateAgentPerformance();
}
