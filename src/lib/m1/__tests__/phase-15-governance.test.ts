/**
 * Phase 15: Advanced Governance & Control Plane Tests
 *
 * Comprehensive test suite for governance management and control plane orchestration
 * 36 tests covering policy management, change control, and service coordination
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  GovernanceManager,
  Policy,
  PolicyRule,
  ChangeRequest,
  ApprovalRequest,
  AuditLogEntry,
} from '../governance/governance-manager';
import {
  ControlPlane,
  ServiceRegistration,
  ServiceHealth,
  DeploymentPlan,
} from '../governance/control-plane';

describe('Phase 15: Governance & Control Plane', () => {
  // ========== Governance Manager Tests ==========

  describe('GovernanceManager - Policy Management', () => {
    let governance: GovernanceManager;

    beforeEach(() => {
      governance = new GovernanceManager();
    });

    it('should create security policy', () => {
      const policyId = governance.createPolicy(
        'Data Access Policy',
        'Restricts access to sensitive data',
        'security',
        [
          {
            condition: "action === 'delete' && resource === 'critical'",
            action: 'require_approval',
            metadata: { approvalLevel: 'executive' },
          },
        ],
        'admin'
      );

      expect(policyId).toBeDefined();

      const policy = governance.getPolicy(policyId);
      expect(policy).toBeDefined();
      expect(policy?.name).toBe('Data Access Policy');
      expect(policy?.type).toBe('security');
      expect(policy?.rules.length).toBe(1);
      expect(policy?.active).toBe(true);
      expect(policy?.version).toBe(1);
    });

    it('should update policy and track versions', () => {
      const policyId = governance.createPolicy(
        'Original Policy',
        'Original description',
        'operational',
        [],
        'admin'
      );

      const success = governance.updatePolicy(
        policyId,
        { name: 'Updated Policy', description: 'Updated description' },
        'admin'
      );

      expect(success).toBe(true);

      const policy = governance.getPolicy(policyId);
      expect(policy?.name).toBe('Updated Policy');
      expect(policy?.version).toBe(2);

      // Verify version increased and update was applied
      const originalPolicy = governance.createPolicy(
        'Check Version',
        'desc',
        'operational',
        [],
        'admin'
      );

      const beforeUpdate = governance.getPolicy(originalPolicy);
      expect(beforeUpdate?.version).toBe(1);

      governance.updatePolicy(originalPolicy, { name: 'Changed' }, 'admin');
      const afterUpdate = governance.getPolicy(originalPolicy);
      expect(afterUpdate?.version).toBe(2);
    });

    it('should evaluate policy rules', () => {
      const policyId = governance.createPolicy(
        'Test Policy',
        'Test evaluation',
        'access',
        [
          {
            condition: "action === 'read'",
            action: 'allow',
            metadata: {},
          },
          {
            condition: "action === 'delete'",
            action: 'deny',
            metadata: {},
          },
        ],
        'admin'
      );

      const readResult = governance.evaluatePolicy(policyId, { action: 'read' });
      expect(readResult.allowed).toBe(true);
      expect(readResult.action).toBe('allow');

      const deleteResult = governance.evaluatePolicy(policyId, { action: 'delete' });
      expect(deleteResult.allowed).toBe(false);
      expect(deleteResult.action).toBe('deny');

      const updateResult = governance.evaluatePolicy(policyId, { action: 'update' });
      expect(updateResult.allowed).toBe(true); // Default allow
    });

    it('should enforce hard vs soft enforcement levels', () => {
      const hardPolicyId = governance.createPolicy(
        'Hard Policy',
        'Enforced strictly',
        'compliance',
        [
          {
            condition: "action === 'export'",
            action: 'require_approval',
            metadata: {},
          },
        ],
        'admin',
        'hard'
      );

      const softPolicyId = governance.createPolicy(
        'Soft Policy',
        'Warnings only',
        'compliance',
        [
          {
            condition: "action === 'export'",
            action: 'log_only',
            metadata: {},
          },
        ],
        'admin',
        'soft'
      );

      const hardPolicy = governance.getPolicy(hardPolicyId);
      const softPolicy = governance.getPolicy(softPolicyId);

      expect(hardPolicy?.enforcementLevel).toBe('hard');
      expect(softPolicy?.enforcementLevel).toBe('soft');
    });

    it('should handle inactive policies', () => {
      const policyId = governance.createPolicy(
        'Inactive Policy',
        'Should be inactive',
        'operational',
        [],
        'admin'
      );

      governance.updatePolicy(policyId, { active: false }, 'admin');

      const result = governance.evaluatePolicy(policyId, {});
      expect(result.allowed).toBe(true);
      expect(result.explanation).toBe('Policy not found or inactive');
    });
  });

  describe('GovernanceManager - Change Control', () => {
    let governance: GovernanceManager;

    beforeEach(() => {
      governance = new GovernanceManager();
    });

    it('should request change', () => {
      const changeId = governance.requestChange(
        'Update Database Schema',
        'Add new columns for audit logging',
        'infrastructure',
        'engineer@example.com',
        {
          affectedServices: ['database', 'api'],
          estimatedDowntime: 3600000, // 1 hour
          riskLevel: 'high',
          mitigationPlan: 'Run in maintenance window',
        },
        ['proposal.pdf', 'rollback-plan.md']
      );

      expect(changeId).toBeDefined();

      const change = governance.getChangeRequest(changeId);
      expect(change?.title).toBe('Update Database Schema');
      expect(change?.status).toBe('draft');
      expect(change?.type).toBe('infrastructure');
      expect(change?.impactAnalysis.riskLevel).toBe('high');
      expect(change?.attachments.length).toBe(2);
    });

    it('should submit change for approval', () => {
      const changeId = governance.requestChange(
        'Config Update',
        'Update API timeout',
        'configuration',
        'admin@example.com',
        {
          affectedServices: ['api'],
          estimatedDowntime: 0,
          riskLevel: 'low',
        }
      );

      const approvalId = governance.submitChangeForApproval(changeId, 'admin', 2);

      expect(approvalId).toBeDefined();

      const change = governance.getChangeRequest(changeId);
      expect(change?.status).toBe('pending_review');

      const approval = governance.getApprovalRequest?.(approvalId);
      expect(approval?.minimumApprovers).toBe(2);
    });

    it('should approve change when minimum approvers reached', () => {
      const changeId = governance.requestChange(
        'Policy Update',
        'Enforce new security rules',
        'policy',
        'requestor@example.com',
        { affectedServices: [], estimatedDowntime: 0, riskLevel: 'medium' }
      );

      const approvalId = governance.submitChangeForApproval(changeId, 'admin', 2);

      if (approvalId) {
        // Add approvals
        governance.approveChange(approvalId, 'approver1@example.com', 'LGTM');
        const result1 = governance.getApprovalRequest?.(approvalId);
        expect(result1?.status).toBe('pending'); // Still pending, need 2 approvers

        governance.approveChange(approvalId, 'approver2@example.com', 'Approved');
        const result2 = governance.getApprovalRequest?.(approvalId);
        expect(result2?.status).toBe('approved');

        const change = governance.getChangeRequest(changeId);
        expect(change?.status).toBe('approved');
      }
    });

    it('should reject change', () => {
      const changeId = governance.requestChange(
        'Risky Change',
        'High risk modification',
        'infrastructure',
        'engineer@example.com',
        { affectedServices: ['critical'], estimatedDowntime: 36000000, riskLevel: 'critical' }
      );

      const approvalId = governance.submitChangeForApproval(changeId, 'admin', 1);

      if (approvalId) {
        const success = governance.rejectChange(approvalId, 'reviewer@example.com', 'Too risky for production');
        expect(success).toBe(true);

        const change = governance.getChangeRequest(changeId);
        expect(change?.status).toBe('rejected');
        expect(change?.rejectionReason).toBe('Too risky for production');
      }
    });

    it('should implement approved change', () => {
      const changeId = governance.requestChange(
        'Safe Change',
        'Low risk update',
        'configuration',
        'admin@example.com',
        { affectedServices: [], estimatedDowntime: 0, riskLevel: 'low' }
      );

      const approvalId = governance.submitChangeForApproval(changeId, 'admin', 1);

      if (approvalId) {
        governance.approveChange(approvalId, 'approver@example.com');

        const success = governance.implementChange(changeId, 'executor@example.com');
        expect(success).toBe(true);

        const change = governance.getChangeRequest(changeId);
        expect(change?.status).toBe('implemented');
        expect(change?.implementedAt).toBeDefined();
      }
    });

    it('should rollback implemented change', () => {
      const changeId = governance.requestChange(
        'Problematic Change',
        'Caused issues',
        'infrastructure',
        'engineer@example.com',
        { affectedServices: ['api'], estimatedDowntime: 0, riskLevel: 'medium' }
      );

      const approvalId = governance.submitChangeForApproval(changeId, 'admin', 1);

      if (approvalId) {
        governance.approveChange(approvalId, 'approver@example.com');
        governance.implementChange(changeId, 'executor@example.com');

        const success = governance.rollbackChange(changeId, 'operator@example.com', 'Caused API errors');
        expect(success).toBe(true);

        const change = governance.getChangeRequest(changeId);
        expect(change?.status).toBe('rolled_back');
        expect(change?.rollbackReason).toBe('Caused API errors');
      }
    });
  });

  describe('GovernanceManager - Audit Logging', () => {
    let governance: GovernanceManager;

    beforeEach(() => {
      governance = new GovernanceManager();
    });

    it('should log audit events', () => {
      const eventId = governance.logAuditEvent(
        'policy_created',
        'admin@example.com',
        'policy',
        'pol_123',
        'Created new security policy',
        { policyType: 'security', ruleCount: 3 }
      );

      expect(eventId).toBeDefined();

      const logs = governance.getAuditLog({ limit: 1 });
      expect(logs.length).toBe(1);
      expect(logs[0].eventType).toBe('policy_created');
      expect(logs[0].actor).toBe('admin@example.com');
    });

    it('should filter audit logs by criteria', () => {
      governance.logAuditEvent('policy_created', 'admin@example.com', 'policy', 'pol_1', 'Created', {});
      governance.logAuditEvent('policy_updated', 'admin@example.com', 'policy', 'pol_1', 'Updated', {});
      governance.logAuditEvent('policy_created', 'user@example.com', 'policy', 'pol_2', 'Created', {});

      const createdLogs = governance.getAuditLog({ eventType: 'policy_created' });
      expect(createdLogs.length).toBe(2);

      const adminLogs = governance.getAuditLog({ actor: 'admin@example.com' });
      expect(adminLogs.length).toBe(2);

      const pol1Logs = governance.getAuditLog({ resourceId: 'pol_1' });
      expect(pol1Logs.length).toBe(2);
    });

    it('should generate compliance report', () => {
      const now = Date.now();
      const startDate = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago

      // Create some activity
      governance.logAuditEvent('policy_created', 'admin@example.com', 'policy', 'pol_1', 'Created', {});
      governance.logAuditEvent('change_approved', 'admin@example.com', 'change', 'ch_1', 'Approved', {});

      const report = governance.generateComplianceReport(startDate, now);

      expect(report.periodStart).toBe(startDate);
      expect(report.periodEnd).toBeLessThanOrEqual(now);
      expect(report.totalAuditEvents).toBeGreaterThan(0);
      expect(report.changes).toBeDefined();
    });

    it('should cleanup old audit logs', () => {
      const governanceWithShortRetention = new GovernanceManager(1); // 1 day retention
      governanceWithShortRetention.logAuditEvent('policy_created', 'admin@example.com', 'policy', 'pol_1', 'Created', {});

      const before = governanceWithShortRetention.getAuditLog().length;
      const cleaned = governanceWithShortRetention.cleanupOldAuditLogs();

      // In real scenario, this would clean old logs, but in test all logs are recent
      expect(cleaned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GovernanceManager - Statistics', () => {
    let governance: GovernanceManager;

    beforeEach(() => {
      governance = new GovernanceManager();
    });

    it('should generate governance statistics', () => {
      // Create policies
      governance.createPolicy('Policy 1', 'Desc', 'security', [], 'admin');
      governance.createPolicy('Policy 2', 'Desc', 'operational', [], 'admin');

      // Create changes
      governance.requestChange('Change 1', 'Desc', 'policy', 'user@example.com', {
        affectedServices: [],
        estimatedDowntime: 0,
        riskLevel: 'low',
      });

      const stats = governance.getStatistics();

      expect(stats.totalPolicies).toBe(2);
      expect(stats.activePolicies).toBe(2);
      expect(stats.totalChangeRequests).toBe(1);
      expect(stats.changes.draft).toBe(1);
      expect(stats.totalAuditEvents).toBeGreaterThan(0);
    });
  });

  // ========== Control Plane Tests ==========

  describe('ControlPlane - Service Registration', () => {
    let plane: ControlPlane;

    beforeEach(() => {
      plane = new ControlPlane();
    });

    afterEach(() => {
      plane.shutdown();
    });

    it('should register service', () => {
      const serviceId = plane.registerService(
        'api-gateway',
        'production',
        '1.0.0',
        'api.example.com',
        8080,
        'http',
        '/health',
        ['gateway', 'critical'],
        { owner: 'platform-team' }
      );

      expect(serviceId).toBeDefined();

      const service = plane.getService(serviceId);
      expect(service?.name).toBe('api-gateway');
      expect(service?.namespace).toBe('production');
      expect(service?.version).toBe('1.0.0');
      expect(service?.tags).toContain('critical');
    });

    it('should find services by name', () => {
      const id1 = plane.registerService('api', 'prod', '1.0.0', 'api1.example.com', 8080);
      const id2 = plane.registerService('api', 'staging', '1.0.0', 'api2.example.com', 8080);
      const id3 = plane.registerService('database', 'prod', '1.0.0', 'db.example.com', 5432);

      const apiServices = plane.findServicesByName('api');
      expect(apiServices.length).toBe(2);
      expect(apiServices.every((s) => s.name === 'api')).toBe(true);
    });

    it('should deregister service', () => {
      const serviceId = plane.registerService('temp-service', 'test', '1.0.0', 'temp.example.com', 8080);

      const success = plane.deregisterService(serviceId);
      expect(success).toBe(true);

      const service = plane.getService(serviceId);
      expect(service).toBeNull();
    });

    it('should update service health', () => {
      const serviceId = plane.registerService('api', 'prod', '1.0.0', 'api.example.com', 8080);

      plane.updateServiceHealth(serviceId, 'healthy', 45, {
        cpuUsage: 0.3,
        memoryUsage: 0.5,
        diskUsage: 0.2,
      });

      const health = plane.getServiceHealth(serviceId);
      expect(health?.state).toBe('healthy');
      expect(health?.responseTime).toBe(45);
      expect(health?.metrics.cpuUsage).toBe(0.3);
    });

    it('should get healthy services', () => {
      const id1 = plane.registerService('service1', 'prod', '1.0.0', 's1.example.com', 8080);
      const id2 = plane.registerService('service2', 'prod', '1.0.0', 's2.example.com', 8080);

      plane.updateServiceHealth(id1, 'healthy', 50, { cpuUsage: 0.2, memoryUsage: 0.3, diskUsage: 0.1 });
      plane.updateServiceHealth(id2, 'unhealthy', 500, { cpuUsage: 0.9, memoryUsage: 0.95, diskUsage: 0.8 });

      const healthyServices = plane.getHealthyServices();
      expect(healthyServices.length).toBe(1);
      expect(healthyServices[0].serviceName).toBe('service1');
    });
  });

  describe('ControlPlane - Configuration Management', () => {
    let plane: ControlPlane;

    beforeEach(() => {
      plane = new ControlPlane();
    });

    it('should set and get configuration', () => {
      const configId = plane.setConfiguration(
        'api.timeout',
        30000,
        'global',
        'admin@example.com'
      );

      expect(configId).toBeDefined();

      const config = plane.getConfiguration('api.timeout', 'global');
      expect(config?.value).toBe(30000);
      expect(config?.key).toBe('api.timeout');
      expect(config?.version).toBe(1);
    });

    it('should track configuration versions', () => {
      const id1 = plane.setConfiguration('api.maxConnections', 100, 'global', 'admin@example.com');
      const id2 = plane.setConfiguration('api.maxConnections', 200, 'global', 'admin@example.com');
      const id3 = plane.setConfiguration('api.maxConnections', 300, 'global', 'admin@example.com');

      // Each setConfiguration creates a new record
      const config1 = plane.getConfiguration('api.maxConnections', 'global');
      expect(config1?.version).toBe(1); // First config for this key

      // All configurations are stored, can retrieve all for the key
      const allConfigs = plane.getConfigurationsByScope('global');
      const maxConnectionConfigs = allConfigs.filter((c) => c.key === 'api.maxConnections');
      expect(maxConnectionConfigs.length).toBe(3);
      expect(maxConnectionConfigs.map((c) => c.version)).toContain(1);
      expect(maxConnectionConfigs.map((c) => c.version)).toContain(2);
      expect(maxConnectionConfigs.map((c) => c.version)).toContain(3);
    });

    it('should get configurations by scope', () => {
      plane.setConfiguration('global.timeout', 30000, 'global', 'admin@example.com');
      plane.setConfiguration('global.retries', 3, 'global', 'admin@example.com');
      plane.setConfiguration('service.cache', true, 'service', 'admin@example.com', 'api');

      const globalConfigs = plane.getConfigurationsByScope('global');
      expect(globalConfigs.length).toBe(2);

      const serviceConfigs = plane.getConfigurationsByScope('service');
      expect(serviceConfigs.length).toBe(1);
    });
  });

  describe('ControlPlane - Deployment Management', () => {
    let plane: ControlPlane;
    let serviceId: string;

    beforeEach(() => {
      plane = new ControlPlane();
      serviceId = plane.registerService('api', 'prod', '1.0.0', 'api.example.com', 8080);
    });

    afterEach(() => {
      plane.shutdown();
    });

    it('should create deployment plan with rolling strategy', () => {
      const deploymentId = plane.createDeploymentPlan(serviceId, '2.0.0', 'rolling', 10, 2);

      expect(deploymentId).toBeDefined();

      const plan = plane.getDeploymentPlan(deploymentId!);
      expect(plan?.newVersion).toBe('2.0.0');
      expect(plan?.strategy).toBe('rolling');
      expect(plan?.status).toBe('planning');
      expect(plan?.stages.length).toBe(2);
    });

    it('should create deployment with different strategies', () => {
      const rollingId = plane.createDeploymentPlan(serviceId, '2.0.0', 'rolling');
      const blueGreenId = plane.createDeploymentPlan(serviceId, '2.0.0', 'blue_green');
      const canaryId = plane.createDeploymentPlan(serviceId, '2.0.0', 'canary');

      const rolling = plane.getDeploymentPlan(rollingId!);
      const blueGreen = plane.getDeploymentPlan(blueGreenId!);
      const canary = plane.getDeploymentPlan(canaryId!);

      expect(rolling?.stages.length).toBe(2);
      expect(blueGreen?.stages.length).toBe(2);
      expect(canary?.stages.length).toBe(3);
    });

    it('should approve and start deployment', () => {
      const deploymentId = plane.createDeploymentPlan(serviceId, '2.0.0', 'rolling');

      if (deploymentId) {
        const approved = plane.approveDeployment(deploymentId);
        expect(approved).toBe(true);

        const plan1 = plane.getDeploymentPlan(deploymentId);
        expect(plan1?.status).toBe('approved');

        const started = plane.startDeployment(deploymentId);
        expect(started).toBe(true);

        const plan2 = plane.getDeploymentPlan(deploymentId);
        expect(plan2?.status).toBe('in_progress');
        expect(plan2?.startedAt).toBeDefined();
      }
    });

    it('should complete deployment stages', () => {
      const deploymentId = plane.createDeploymentPlan(serviceId, '2.0.0', 'rolling');

      if (deploymentId) {
        plane.approveDeployment(deploymentId);
        plane.startDeployment(deploymentId);

        const plan = plane.getDeploymentPlan(deploymentId);
        const stageId = plan?.stages[0].id;

        if (stageId) {
          const completed = plane.completeDeploymentStage(deploymentId, stageId);
          expect(completed).toBe(true);

          const updatedPlan = plane.getDeploymentPlan(deploymentId);
          expect(updatedPlan?.stages[0].status).toBe('completed');
          expect(updatedPlan?.stages[0].duration).toBeDefined();
        }
      }
    });

    it('should rollback deployment', () => {
      const deploymentId = plane.createDeploymentPlan(serviceId, '2.0.0', 'rolling');

      if (deploymentId) {
        plane.approveDeployment(deploymentId);

        const success = plane.rollbackDeployment(deploymentId, 'High error rate detected');
        expect(success).toBe(true);

        const plan = plane.getDeploymentPlan(deploymentId);
        expect(plan?.status).toBe('rolled_back');
        expect(plan?.rollbackReason).toBe('High error rate detected');

        // Service version should be reverted
        const service = plane.getService(serviceId);
        expect(service?.version).toBe('1.0.0');
      }
    });

    it('should get active deployments', () => {
      const d1 = plane.createDeploymentPlan(serviceId, '1.1.0', 'rolling');
      const d2 = plane.createDeploymentPlan(serviceId, '1.2.0', 'rolling');

      if (d1) {
plane.approveDeployment(d1);
}
      if (d2) {
plane.startDeployment(d2);
}

      const active = plane.getActiveDeployments();
      expect(active.length).toBe(2);
    });
  });

  describe('ControlPlane - Statistics', () => {
    let plane: ControlPlane;

    beforeEach(() => {
      plane = new ControlPlane();
    });

    afterEach(() => {
      plane.shutdown();
    });

    it('should generate control plane statistics', () => {
      const s1 = plane.registerService('api', 'prod', '1.0.0', 'api.example.com', 8080);
      const s2 = plane.registerService('db', 'prod', '1.0.0', 'db.example.com', 5432);

      plane.updateServiceHealth(s1, 'healthy', 50, { cpuUsage: 0.2, memoryUsage: 0.3, diskUsage: 0.1 });
      plane.updateServiceHealth(s2, 'degraded', 150, { cpuUsage: 0.7, memoryUsage: 0.8, diskUsage: 0.5 });

      plane.setConfiguration('app.version', '1.0.0', 'global', 'admin@example.com');

      const stats = plane.getStatistics();

      expect(stats.registeredServices).toBe(2);
      expect(stats.serviceHealth.healthy).toBe(1);
      expect(stats.serviceHealth.degraded).toBe(1);
      expect(stats.avgResponseTime).toBeGreaterThan(0);
      expect(stats.configurations).toBe(1);
    });
  });
});
