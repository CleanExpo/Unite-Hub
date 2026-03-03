/**
 * Autonomous Platform Audit System
 *
 * A comprehensive audit system that provides:
 * - User Journey Testing
 * - UX Friction Detection
 * - API Route Auditing
 * - Evidence Collection & Storage
 * - Scheduled Audit Execution
 * - Report Generation
 */

// Core Components
export { UserJourneyRunner, COMMON_JOURNEYS } from "./user-journey-runner";
export type {
  JourneyDefinition,
  JourneyStep,
  JourneyAction,
  JourneyResult,
  StepResult,
  StepEvidence,
  FrictionPoint,
} from "./user-journey-runner";

export { UXFrictionDetector } from "./ux-friction-detector";
export type {
  FrictionAnalysis,
  DetailedFrictionPoint,
  FrictionCategory,
  FrictionMetrics,
  Recommendation,
} from "./ux-friction-detector";

export { EvidenceCollector } from "./evidence-collector";
export type {
  Evidence,
  EvidenceType,
  EvidenceSource,
  EvidenceCategory,
  EvidenceQuery,
  EvidenceStats,
} from "./evidence-collector";

export { APIRouteAuditor } from "./api-route-auditor";
export type {
  RouteDefinition,
  RouteAuditResult,
  RouteCheck,
  RouteIssue,
  AuditReport as RouteAuditReport,
} from "./api-route-auditor";

export { ScheduledAuditRunner } from "./scheduled-audit-runner";
export type {
  AuditSchedule,
  AuditType,
  AuditConfig,
  ScheduledAuditResult,
  Alert,
} from "./scheduled-audit-runner";

export { ReportGenerator } from "./report-generator";
export type {
  AuditReport,
  ReportConfig,
  ReportFormat,
  ReportSummary,
  ReportSection,
} from "./report-generator";

/**
 * Create a fully configured audit system instance
 */
export function createAuditSystem(options?: {
  baseUrl?: string;
  apiDir?: string;
  evidenceStorage?: string;
}) {
  const { UserJourneyRunner } = require("./user-journey-runner");
  const { UXFrictionDetector } = require("./ux-friction-detector");
  const { EvidenceCollector } = require("./evidence-collector");
  const { APIRouteAuditor } = require("./api-route-auditor");
  const { ScheduledAuditRunner } = require("./scheduled-audit-runner");
  const { ReportGenerator } = require("./report-generator");

  return {
    journeyRunner: new UserJourneyRunner(),
    frictionDetector: new UXFrictionDetector(),
    evidenceCollector: new EvidenceCollector({
      localStoragePath: options?.evidenceStorage,
    }),
    routeAuditor: new APIRouteAuditor({ baseUrl: options?.baseUrl }),
    scheduledRunner: new ScheduledAuditRunner(options),
    reportGenerator: new ReportGenerator(),
  };
}
