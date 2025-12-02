/* eslint-disable no-undef */
/* global process */

/**
 * Test Suite: Evidence Collection System
 *
 * Tests:
 * 1. Evidence capture (logs, snapshots, errors)
 * 2. Storage and retrieval
 * 3. Proof generation and validation
 * 4. Integration with independent verifier
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import * as evidenceCollector from '@/lib/agents/evidence-collector';
import * as evidenceStorage from '@/lib/agents/evidence-storage';
import * as proofGenerator from '@/lib/agents/proof-generator';

describe('Evidence Collection System', () => {
  const testTaskId = `test-evidence-${Date.now()}`;
  const testDir = resolve(process.cwd(), 'audit-reports/evidence', testTaskId);

  beforeEach(async () => {
    // Ensure clean test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Evidence Capture', () => {
    it('should capture execution logs', async () => {
      const steps = [
        {
          step_id: 'step-1',
          description: 'Test step 1',
          status: 'completed' as const,
          start_time: Date.now() - 1000,
          end_time: Date.now(),
        },
        {
          step_id: 'step-2',
          description: 'Test step 2',
          status: 'completed' as const,
          start_time: Date.now(),
          end_time: Date.now() + 100,
        },
      ];

      const logFile = await evidenceCollector.captureExecutionLog(testTaskId, steps);

      expect(logFile).toContain(testTaskId);
      expect(logFile).toContain('execution-log');

      const content = await fs.readFile(logFile, 'utf-8');
      const data = JSON.parse(content);

      expect(data.steps).toHaveLength(2);
      expect(data.steps[0].step_id).toBe('step-1');
      expect(data.steps[0].duration_ms).toBeDefined();
    });

    it('should capture state snapshots', async () => {
      const state = {
        verified: true,
        test_count: 42,
        passed: 40,
        failed: 2,
      };

      const snapshotFile = await evidenceCollector.captureStateSnapshot(
        testTaskId,
        'before',
        state
      );

      expect(snapshotFile).toContain('state-before');
      const content = await fs.readFile(snapshotFile, 'utf-8');
      const data = JSON.parse(content);

      expect(data.type).toBe('before');
      expect(data.state).toEqual(state);
    });

    it('should capture error evidence', async () => {
      const error = new Error('Test error message');
      const context = { step_id: 'failing-step', metadata: 'test' };

      const errorFile = await evidenceCollector.captureErrorEvidence(
        testTaskId,
        error,
        context
      );

      expect(errorFile).toContain('error');
      const content = await fs.readFile(errorFile, 'utf-8');
      const data = JSON.parse(content);

      expect(data.error).toBe('Test error message');
      expect(data.stack).toBeDefined();
      expect(data.context).toEqual(context);
    });

    it('should aggregate evidence into package', async () => {
      // Capture multiple evidence types
      const steps = [{ step_id: 's1', description: 'Test', status: 'completed' as const, start_time: Date.now(), end_time: Date.now() + 100 }];
      await evidenceCollector.captureExecutionLog(testTaskId, steps);
      await evidenceCollector.captureStateSnapshot(testTaskId, 'after', { test: true });

      const pkg = await evidenceCollector.getEvidencePackage(testTaskId);

      expect(pkg.taskId).toBe(testTaskId);
      expect(pkg.evidence_files.length).toBeGreaterThan(0);
      expect(pkg.logs.length).toBeGreaterThan(0);
      expect(pkg.snapshots.length).toBeGreaterThan(0);
      expect(pkg.integrity.total_files).toBeGreaterThan(0);
    });
  });

  describe('Evidence Storage', () => {
    it('should store evidence with retention policy', async () => {
      const steps = [{ step_id: 's1', description: 'Test', status: 'completed' as const, start_time: Date.now(), end_time: Date.now() + 100 }];
      await evidenceCollector.captureExecutionLog(testTaskId, steps);
      const pkg = await evidenceCollector.getEvidencePackage(testTaskId);

      const record = await evidenceStorage.storeEvidence(testTaskId, pkg, {
        test_metadata: 'value',
      });

      expect(record.taskId).toBe(testTaskId);
      expect(record.status).toBe('stored');
      expect(record.retention_days).toBe(90);
      expect(record.expires_at).toBeGreaterThan(Date.now());
    });

    it('should retrieve stored evidence', async () => {
      const steps = [{ step_id: 's1', description: 'Test', status: 'completed' as const, start_time: Date.now(), end_time: Date.now() + 100 }];
      await evidenceCollector.captureExecutionLog(testTaskId, steps);
      const originalPkg = await evidenceCollector.getEvidencePackage(testTaskId);

      await evidenceStorage.storeEvidence(testTaskId, originalPkg);

      const retrieved = await evidenceStorage.retrieveEvidence(testTaskId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.taskId).toBe(testTaskId);
      expect(retrieved?.logs.length).toBeGreaterThan(0);
    });

    it('should validate evidence integrity', async () => {
      const steps = [{ step_id: 's1', description: 'Test', status: 'completed' as const, start_time: Date.now(), end_time: Date.now() + 100 }];
      await evidenceCollector.captureExecutionLog(testTaskId, steps);

      const isValid = await evidenceStorage.validateEvidenceIntegrity(testTaskId);
      expect(isValid).toBe(true);
    });

    it('should return retention policy', () => {
      const policy = evidenceStorage.getEvidenceRetentionPolicy();

      expect(policy.default_retention_days).toBe(90);
      expect(policy.auto_cleanup_enabled).toBe(true);
      expect(policy.cleanup_interval_ms).toBeGreaterThan(0);
    });
  });

  describe('Proof Generation', () => {
    it('should generate checksums', () => {
      const content = 'test evidence content';
      const checksum = proofGenerator.generateChecksum(content);

      expect(checksum).toHaveLength(64); // SHA256 hex = 64 chars
      expect(checksum).toMatch(/^[a-f0-9]+$/);

      // Same content = same checksum
      const checksum2 = proofGenerator.generateChecksum(content);
      expect(checksum2).toBe(checksum);

      // Different content = different checksum
      const checksum3 = proofGenerator.generateChecksum('different');
      expect(checksum3).not.toBe(checksum);
    });

    it('should generate HMACs', () => {
      const content = 'test evidence';
      const secret = 'test-secret';

      const hmac = proofGenerator.generateHMAC(content, secret);
      expect(hmac).toHaveLength(64); // HMAC-SHA256 hex
      expect(hmac).toMatch(/^[a-f0-9]+$/);

      // Same secret = same HMAC
      const hmac2 = proofGenerator.generateHMAC(content, secret);
      expect(hmac2).toBe(hmac);

      // Different secret = different HMAC
      const hmac3 = proofGenerator.generateHMAC(content, 'different-secret');
      expect(hmac3).not.toBe(hmac);
    });

    it('should generate Merkle root', () => {
      const checksums = [
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      ];

      const root = proofGenerator.generateMerkleRoot(checksums);
      expect(root).toHaveLength(64);
      expect(root).toMatch(/^[a-f0-9]+$/);

      // Same checksums = same root
      const root2 = proofGenerator.generateMerkleRoot(checksums);
      expect(root2).toBe(root);

      // Different checksums = different root
      const root3 = proofGenerator.generateMerkleRoot([...checksums, 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd']);
      expect(root3).not.toBe(root);
    });

    it('should generate complete proof package', async () => {
      const steps = [{ step_id: 's1', description: 'Test', status: 'completed' as const, start_time: Date.now(), end_time: Date.now() + 100 }];
      await evidenceCollector.captureExecutionLog(testTaskId, steps);
      const pkg = await evidenceCollector.getEvidencePackage(testTaskId);

      const proof = await proofGenerator.generateProofPackage(testTaskId, pkg);

      expect(proof.evidence_id).toBe(testTaskId);
      expect(proof.checksums).not.toEqual({});
      expect(proof.hmac).toHaveLength(64);
      expect(proof.merkle_root).toHaveLength(64);
      expect(proof.proofs.integrity_verified).toBe(true);
    });

    it('should verify proof package', async () => {
      const steps = [{ step_id: 's1', description: 'Test', status: 'completed' as const, start_time: Date.now(), end_time: Date.now() + 100 }];
      await evidenceCollector.captureExecutionLog(testTaskId, steps);
      const pkg = await evidenceCollector.getEvidencePackage(testTaskId);
      const proof = await proofGenerator.generateProofPackage(testTaskId, pkg);

      const isValid = await proofGenerator.verifyProof(pkg, proof);
      expect(isValid).toBe(true);
    });

    it('should export and import proofs', async () => {
      const steps = [{ step_id: 's1', description: 'Test', status: 'completed' as const, start_time: Date.now(), end_time: Date.now() + 100 }];
      await evidenceCollector.captureExecutionLog(testTaskId, steps);
      const pkg = await evidenceCollector.getEvidencePackage(testTaskId);
      const proof = await proofGenerator.generateProofPackage(testTaskId, pkg);

      const exported = proofGenerator.exportProof(proof);
      expect(typeof exported).toBe('string');

      const imported = proofGenerator.importProof(exported);
      expect(imported.evidence_id).toBe(proof.evidence_id);
      expect(imported.merkle_root).toBe(proof.merkle_root);
    });
  });

  describe('Integration', () => {
    it('should complete full evidence workflow', async () => {
      // 1. Capture evidence
      const steps = [
        { step_id: 's1', description: 'Step 1', status: 'completed' as const, start_time: Date.now() - 1000, end_time: Date.now() },
        { step_id: 's2', description: 'Step 2', status: 'completed' as const, start_time: Date.now(), end_time: Date.now() + 100 },
      ];

      await evidenceCollector.captureExecutionLog(testTaskId, steps);
      await evidenceCollector.captureStateSnapshot(testTaskId, 'after', { verified: true });

      // 2. Get evidence package
      const pkg = await evidenceCollector.getEvidencePackage(testTaskId);
      expect(pkg.logs.length).toBeGreaterThan(0);

      // 3. Generate proof
      const proof = await proofGenerator.generateProofPackage(testTaskId, pkg);
      expect(proof.merkle_root).toBeDefined();

      // 4. Store evidence
      const record = await evidenceStorage.storeEvidence(testTaskId, pkg);
      expect(record.status).toBe('stored');

      // 5. Retrieve and verify
      const retrieved = await evidenceStorage.retrieveEvidence(testTaskId);
      const isValid = await proofGenerator.verifyProof(retrieved!, proof);
      expect(isValid).toBe(true);
    });
  });
});
