 
/* global process */

/**
 * Test Suite: Independent Verifier Agent
 *
 * Tests that Independent Verifier:
 * 1. Catches false completion claims (verified=false)
 * 2. Accepts real completion with evidence (verified=true)
 * 3. Never trusts agent's self-reported status
 * 4. Collects proper evidence for audit trail
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { IndependentVerifier, VerificationRequest } from '@/lib/agents/independent-verifier';

describe('Independent Verifier Agent', () => {
  let verifier: IndependentVerifier;
  let testDir: string;

  beforeEach(async () => {
    verifier = new IndependentVerifier();
    // Create temporary test directory
    testDir = resolve(process.cwd(), '.test-verification');
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (_e) {
      // Directory might already exist
    }
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (_e) {
      // Ignore cleanup errors
    }
  });

  describe('Fake Completion Claims (MUST FAIL)', () => {
    it('should REJECT claim of file creation when file does not exist', async () => {
      const request: VerificationRequest = {
        task_id: 'fake-file-task',
        claimed_outputs: ['/path/that/does/not/exist.ts'],
        completion_criteria: [
          'file_exists:/path/that/does/not/exist.ts'
        ],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      // CRITICAL: Must be false, not true
      expect(result.verified).toBe(false);
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.summary).toContain('FAILED');
    });

    it('should REJECT claim when file is empty (0 bytes)', async () => {
      const emptyFile = resolve(testDir, 'empty.ts');
      await fs.writeFile(emptyFile, '');

      const request: VerificationRequest = {
        task_id: 'empty-file-task',
        claimed_outputs: [emptyFile],
        completion_criteria: [
          `file_exists:${emptyFile}`
        ],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      expect(result.verified).toBe(false);
      expect(result.failures.some(f => f.criterion.includes('empty'))).toBe(true);
    });

    it('should REJECT claim when placeholders are found', async () => {
      const fileWithPlaceholders = resolve(testDir, 'incomplete.ts');
      const content = `
export function feature() {
  // TODO: implement this
  return null;
}`;
      await fs.writeFile(fileWithPlaceholders, content);

      const request: VerificationRequest = {
        task_id: 'placeholder-task',
        claimed_outputs: [fileWithPlaceholders],
        completion_criteria: [
          `no_placeholders:${fileWithPlaceholders}`
        ],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      expect(result.verified).toBe(false);
      expect(result.failures.some(f => f.criterion.includes('placeholder'))).toBe(true);
    });

    it('should REJECT when ANY criterion fails', async () => {
      const goodFile = resolve(testDir, 'good.ts');
      const badFile = resolve(testDir, 'bad-with-todo.ts');

      // Create valid file
      await fs.writeFile(goodFile, 'export const x = 1;');

      // Create file with placeholder
      await fs.writeFile(badFile, 'export const y = 1; // TODO');

      const request: VerificationRequest = {
        task_id: 'mixed-task',
        claimed_outputs: [goodFile, badFile],
        completion_criteria: [
          `file_exists:${goodFile}`,
          `no_placeholders:${goodFile}`,
          `file_exists:${badFile}`,
          `no_placeholders:${badFile}`
        ],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      // CRITICAL: Even one failure makes verified=false
      expect(result.verified).toBe(false);
      expect(result.failures.length).toBeGreaterThan(0);
    });
  });

  describe('Real Completion Claims (MUST PASS)', () => {
    it('should ACCEPT valid file with all criteria met', async () => {
      const validFile = resolve(testDir, 'valid-module.ts');
      const content = `
export interface User {
  id: string;
  name: string;
}

export function getUser(id: string): User {
  return { id, name: 'Test User' };
}`;

      await fs.writeFile(validFile, content);

      const request: VerificationRequest = {
        task_id: 'valid-task',
        claimed_outputs: [validFile],
        completion_criteria: [
          `file_exists:${validFile}`,
          `no_placeholders:${validFile}`
        ],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      expect(result.verified).toBe(true);
      expect(result.failures.length).toBe(0);
      expect(result.evidence.every(e => e.result === 'pass')).toBe(true);
    });

    it('should provide EVIDENCE for every passing criterion', async () => {
      const goodFile = resolve(testDir, 'evidence-test.ts');
      await fs.writeFile(goodFile, 'export const value = 42;');

      const request: VerificationRequest = {
        task_id: 'evidence-task',
        claimed_outputs: [goodFile],
        completion_criteria: [
          `file_exists:${goodFile}`,
          `no_placeholders:${goodFile}`
        ],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      // Each criterion must have corresponding evidence
      expect(result.evidence.length).toBe(request.completion_criteria.length);

      // Each evidence must have proof
      result.evidence.forEach(ev => {
        expect(ev.criterion).toBeDefined();
        expect(ev.method).toBeDefined();
        expect(ev.result).toBe('pass');
        expect(ev.proof).toBeDefined();
        expect(ev.proof.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Evidence Collection', () => {
    it('should include file size in file evidence', async () => {
      const testFile = resolve(testDir, 'size-test.ts');
      const content = 'export const x = "this file has known size";';
      await fs.writeFile(testFile, content);

      const request: VerificationRequest = {
        task_id: 'size-task',
        claimed_outputs: [testFile],
        completion_criteria: [`file_exists:${testFile}`],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      const evidence = result.evidence.find(e => e.criterion.includes('file_exists'));
      expect(evidence).toBeDefined();
      expect(evidence!.proof).toContain('bytes');
      expect(evidence!.proof).toContain(testFile);
    });

    it('should include timestamp in all evidence', async () => {
      const testFile = resolve(testDir, 'timestamp-test.ts');
      await fs.writeFile(testFile, 'export const y = 1;');

      const request: VerificationRequest = {
        task_id: 'timestamp-task',
        claimed_outputs: [testFile],
        completion_criteria: [`file_exists:${testFile}`],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);

      result.evidence.forEach(ev => {
        expect(ev.checked_at).toBeDefined();
        expect(new Date(ev.checked_at).getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('Verifier Identity', () => {
    it('should include verifier_agent_id in result', async () => {
      const request: VerificationRequest = {
        task_id: 'identity-task',
        claimed_outputs: [],
        completion_criteria: [],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      expect(result.verifier_agent_id).toBeDefined();
      expect(result.verifier_agent_id).toContain('independent-verifier');
      // Proves it's NOT the requesting agent
      expect(result.verifier_agent_id).not.toBe(request.requesting_agent_id);
    });

    it('getVerifierId() should return consistent ID', () => {
      const id1 = verifier.getVerifierId();
      const id2 = verifier.getVerifierId();

      expect(id1).toBe(id2);
      expect(id1).toContain('independent-verifier');
    });
  });

  describe('All-Or-Nothing Verification', () => {
    it('should require ALL criteria to pass (not just majority)', async () => {
      const file1 = resolve(testDir, 'file1.ts');
      const file2 = resolve(testDir, 'file2.ts');

      // Create file1 validly
      await fs.writeFile(file1, 'export const a = 1;');

      // file2 doesn't exist

      const request: VerificationRequest = {
        task_id: 'all-or-nothing-task',
        claimed_outputs: [file1, file2],
        completion_criteria: [
          `file_exists:${file1}`,
          `file_exists:${file2}` // This will fail
        ],
        requesting_agent_id: 'some-agent'
      };

      const result = await verifier.verify(request);

      // Even though 1 of 2 passed, overall verified must be false
      expect(result.verified).toBe(false);
    });
  });
});
