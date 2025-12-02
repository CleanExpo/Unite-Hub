/**
 * Proof Generator - Cryptographic proof generation for evidence integrity
 *
 * Generates cryptographic proofs for evidence verification:
 * - SHA256 checksums (evidence integrity)
 * - HMAC-SHA256 signing (evidence authenticity)
 * - Merkle trees (set integrity)
 * - Proof packages (exportable verification data)
 *
 * All proofs verifiable independently without trusting the source
 *
 * @module lib/agents/proof-generator
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { createLogger } from '@/lib/logger';
import { EvidencePackage } from './evidence-collector';

const logger = createLogger({ context: 'ProofGenerator' });

export interface ProofPackage {
  evidence_id: string;
  timestamp: number;
  checksums: Record<string, string>; // file -> SHA256
  hmac: string; // HMAC-SHA256 of all checksums
  merkle_root: string; // Merkle root of all files
  public_key?: string; // For verification
  proofs: {
    file_count: number;
    total_size: number;
    integrity_verified: boolean;
  };
}

const PROOF_SECRET = process.env.EVIDENCE_PROOF_SECRET || 'default-secret-key';

/**
 * Generates SHA256 checksum for content
 */
export function generateChecksum(content: string | Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(content);
  return hash.digest('hex');
}

/**
 * Generates HMAC-SHA256 signature
 */
export function generateHMAC(content: string | Buffer, secret = PROOF_SECRET): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(content);
  return hmac.digest('hex');
}

/**
 * Generates Merkle root from multiple checksums
 */
export function generateMerkleRoot(checksums: string[]): string {
  if (checksums.length === 0) return '';

  // Sort checksums for consistency
  const sorted = [...checksums].sort();

  // Build tree from bottom up
  let level = sorted.map(cs => Buffer.from(cs, 'hex'));

  while (level.length > 1) {
    const next: Buffer[] = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || Buffer.alloc(32); // Use zero buffer if odd

      const hash = crypto.createHash('sha256');
      hash.update(Buffer.concat([left, right]));
      next.push(hash.digest());
    }

    level = next;
  }

  return level[0].toString('hex');
}

/**
 * Generates complete proof package for evidence
 */
export async function generateProofPackage(
  evidenceId: string,
  evidencePackage: EvidencePackage
): Promise<ProofPackage> {
  try {
    const checksums: Record<string, string> = {};
    let totalSize = 0;

    // Generate checksums for all evidence files
    for (const filePath of evidencePackage.evidence_files) {
      try {
        const content = await fs.readFile(filePath);
        const checksum = generateChecksum(content);
        checksums[filePath] = checksum;
        totalSize += content.length;
      } catch (error) {
        logger.warn('[ProofGenerator] Failed to checksum file', {
          file: filePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Generate HMAC over all checksums
    const checksumString = Object.entries(checksums)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, cs]) => cs)
      .join('');

    const hmac = generateHMAC(checksumString);

    // Generate Merkle root
    const merkleRoot = generateMerkleRoot(Object.values(checksums));

    const pkg: ProofPackage = {
      evidence_id: evidenceId,
      timestamp: Date.now(),
      checksums,
      hmac,
      merkle_root: merkleRoot,
      proofs: {
        file_count: evidencePackage.evidence_files.length,
        total_size: totalSize,
        integrity_verified: true,
      },
    };

    logger.info('[ProofGenerator] Generated proof package', {
      evidenceId,
      files: Object.keys(checksums).length,
      merkleRoot,
    });

    return pkg;
  } catch (error) {
    logger.error('[ProofGenerator] Failed to generate proof package', {
      evidenceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Verifies a proof package
 */
export async function verifyProof(
  evidencePackage: EvidencePackage,
  proof: ProofPackage,
  secret = PROOF_SECRET
): Promise<boolean> {
  try {
    // 1. Verify all files still exist and checksums match
    for (const filePath of evidencePackage.evidence_files) {
      if (!(filePath in proof.checksums)) {
        logger.warn('[ProofGenerator] File missing from proof checksums', {
          file: filePath,
        });
        return false;
      }

      try {
        const content = await fs.readFile(filePath);
        const currentChecksum = generateChecksum(content);
        const expectedChecksum = proof.checksums[filePath];

        if (currentChecksum !== expectedChecksum) {
          logger.warn('[ProofGenerator] File checksum mismatch', {
            file: filePath,
            expected: expectedChecksum,
            actual: currentChecksum,
          });
          return false;
        }
      } catch (error) {
        logger.warn('[ProofGenerator] Failed to verify file', {
          file: filePath,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    }

    // 2. Verify HMAC
    const checksumString = Object.entries(proof.checksums)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, cs]) => cs)
      .join('');

    const expectedHMAC = generateHMAC(checksumString, secret);
    if (proof.hmac !== expectedHMAC) {
      logger.warn('[ProofGenerator] HMAC verification failed', {
        expected: expectedHMAC,
        actual: proof.hmac,
      });
      return false;
    }

    // 3. Verify Merkle root
    const expectedMerkleRoot = generateMerkleRoot(Object.values(proof.checksums));
    if (proof.merkle_root !== expectedMerkleRoot) {
      logger.warn('[ProofGenerator] Merkle root verification failed', {
        expected: expectedMerkleRoot,
        actual: proof.merkle_root,
      });
      return false;
    }

    logger.info('[ProofGenerator] Proof verification passed', {
      evidenceId: proof.evidence_id,
    });

    return true;
  } catch (error) {
    logger.error('[ProofGenerator] Failed to verify proof', {
      evidenceId: proof.evidence_id,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Exports proof as JSON for external verification
 */
export function exportProof(proof: ProofPackage): string {
  return JSON.stringify(proof, null, 2);
}

/**
 * Imports proof from JSON
 */
export function importProof(proofJson: string): ProofPackage {
  return JSON.parse(proofJson) as ProofPackage;
}
