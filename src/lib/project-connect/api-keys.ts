import { createHash, randomBytes } from 'crypto';

export function generateApiKey(projectSlug: string): { key: string; hash: string; prefix: string } {
  const raw = `uh_${projectSlug}_${randomBytes(32).toString('hex')}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  return { key: raw, hash, prefix: raw.slice(0, 12) };
}

export function verifyApiKey(raw: string, hash: string): boolean {
  const computed = createHash('sha256').update(raw).digest('hex');
  return computed === hash;
}
