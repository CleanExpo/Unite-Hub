// src/lib/obsidian/evidence.ts
//
// Safe evidence-note WRITER for the Nexus Command Centre.
//
// Writes schema'd markdown ONLY under `<WIKI_PATH>/raw/command-centre/<project>/`
// and appends one line to `<WIKI_PATH>/log.md`. It never deletes or overwrites an
// existing note (a path collision is resolved by suffixing a timestamp). A hard
// secret-pattern guard rejects any payload that looks like it contains a credential.
//
// WIKI_PATH resolution matches the wider Hermes/knowledge convention: the
// `WIKI_PATH` env var, falling back to the canonical vault `D:\Hermes\wiki`.

import { mkdir, writeFile, appendFile, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'

/** Canonical fallback vault when WIKI_PATH is not set. */
export const DEFAULT_WIKI_PATH = 'D:\\Hermes\\wiki'

/** Resolve the wiki root the same way the knowledge layer does: env then fallback. */
export function resolveWikiPath(): string {
  const fromEnv = process.env.WIKI_PATH?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_WIKI_PATH
}

/**
 * Secret patterns that must NEVER reach the wiki. If any appears in the body or
 * frontmatter, the write is rejected. Reference env var *names* only, never values.
 */
export const SECRET_PATTERNS: readonly string[] = [
  'sk-',
  'lin_api_',
  'SUPABASE_',
  'postgres://',
  'Bearer ',
] as const

export type EvidenceKind =
  | 'validation'
  | 'research'
  | 'decision'
  | 'summary'
  | 'handoff'
  | string

export interface EvidenceFrontmatter {
  title: string
  type: EvidenceKind
  tags?: string[]
  confidence?: 'high' | 'medium' | 'low'
  /** Optional extra frontmatter fields (must not contain secrets). */
  [key: string]: unknown
}

export interface WriteEvidenceInput {
  /** Project name; used as the sub-folder under raw/command-centre. */
  project: string
  /** Task / ticket id used in the filename (e.g. "CC-01" or a slug). */
  taskId: string
  /** The kind of evidence note. */
  kind: EvidenceKind
  /** Frontmatter fields (title required). */
  frontmatter: Omit<EvidenceFrontmatter, 'type'> & { type?: EvidenceKind }
  /** Markdown body. */
  body: string
  /** Source references (paths, URLs) — names only, no secrets. */
  sources?: string[]
}

export interface WriteEvidenceResult {
  /** Absolute path of the written note. */
  notePath: string
  /** Relative (to WIKI_PATH) path of the written note. */
  relativePath: string
  /** Whether a timestamp suffix was added to avoid overwriting. */
  suffixed: boolean
}

/** Reject control characters and path separators from path segments. */
function slugifySegment(input: string): string {
  return input
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    || 'untitled'
}

/** Throw if any secret pattern is present in the supplied text. */
function assertNoSecrets(text: string, where: string): void {
  for (const pattern of SECRET_PATTERNS) {
    if (text.includes(pattern)) {
      throw new Error(
        `evidence writer: refusing to write — possible secret detected in ${where} (matched "${pattern}"). Reference env var names only.`,
      )
    }
  }
}

/** YAML-escape a scalar string value for frontmatter. */
function yamlScalar(value: string): string {
  // Quote and escape to keep YAML valid and on a single line.
  return JSON.stringify(value)
}

function buildFrontmatter(fm: EvidenceFrontmatter, now: string, sources: string[]): string {
  const lines: string[] = ['---']
  lines.push(`title: ${yamlScalar(fm.title)}`)
  lines.push(`created: ${now}`)
  lines.push(`updated: ${now}`)
  lines.push(`type: ${yamlScalar(fm.type)}`)
  const tags = Array.isArray(fm.tags) ? fm.tags : ['command-center', 'evidence']
  lines.push(`tags: [${tags.map((t) => yamlScalar(t)).join(', ')}]`)
  lines.push(`sources: [${sources.map((s) => yamlScalar(s)).join(', ')}]`)
  lines.push(`confidence: ${fm.confidence ?? 'medium'}`)

  // Emit any additional custom frontmatter keys (skip the ones already handled).
  const handled = new Set(['title', 'created', 'updated', 'type', 'tags', 'sources', 'confidence'])
  for (const [key, raw] of Object.entries(fm)) {
    if (handled.has(key)) continue
    if (typeof raw === 'string') lines.push(`${key}: ${yamlScalar(raw)}`)
    else if (typeof raw === 'number' || typeof raw === 'boolean') lines.push(`${key}: ${raw}`)
  }

  lines.push('---')
  return lines.join('\n')
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Write a schema'd evidence note under `<WIKI_PATH>/raw/command-centre/<project>/`.
 * - Hard secret guard on body + frontmatter.
 * - Never overwrites: a collision gets a timestamp suffix.
 * - Appends one line to `<WIKI_PATH>/log.md`.
 */
export async function writeEvidence(input: WriteEvidenceInput): Promise<WriteEvidenceResult> {
  const wikiPath = resolveWikiPath()
  const now = new Date()
  const isoDate = now.toISOString().slice(0, 10)
  const timestamp = now.toISOString().replace(/[:.]/g, '-')

  const fmType: EvidenceKind =
    typeof input.frontmatter.type === 'string' ? input.frontmatter.type : input.kind
  const fm: EvidenceFrontmatter = {
    ...input.frontmatter,
    title: String(input.frontmatter.title),
    type: fmType,
  } as EvidenceFrontmatter
  const sources = input.sources ?? []

  // --- Hard secret guard (frontmatter + sources + body) -------------------
  const frontmatterProbe = JSON.stringify(fm) + '\n' + sources.join('\n')
  assertNoSecrets(frontmatterProbe, 'frontmatter')
  assertNoSecrets(input.body, 'body')

  // --- Resolve target path (additive only) --------------------------------
  const projectSeg = slugifySegment(input.project)
  const fileBase = `${slugifySegment(input.taskId)}-${slugifySegment(input.kind)}`
  const dir = path.join(wikiPath, 'raw', 'command-centre', projectSeg)
  await mkdir(dir, { recursive: true })

  let fileName = `${fileBase}.md`
  let notePath = path.join(dir, fileName)
  let suffixed = false
  if (await pathExists(notePath)) {
    fileName = `${fileBase}-${timestamp}.md`
    notePath = path.join(dir, fileName)
    suffixed = true
  }

  // --- Compose + write ----------------------------------------------------
  const frontmatter = buildFrontmatter(fm, isoDate, sources)
  const sourcesBlock = sources.length
    ? `\n## Sources\n\n${sources.map((s) => `- ${s}`).join('\n')}\n`
    : ''
  const content = `${frontmatter}\n\n# ${fm.title}\n\n${input.body.trim()}\n${sourcesBlock}`

  // `wx` flag = fail if exists, so we can never clobber a concurrent writer.
  await writeFile(notePath, content, { encoding: 'utf-8', flag: 'wx' })

  // --- Append one line to the wiki log ------------------------------------
  const relativePath = path.relative(wikiPath, notePath).replace(/\\/g, '/')
  const logLine = `- **Command Centre evidence** \`${input.project}\` ${fm.type} → \`${relativePath}\` (${now.toISOString()})\n`
  await appendFile(path.join(wikiPath, 'log.md'), logLine, { encoding: 'utf-8' })

  return { notePath, relativePath, suffixed }
}
