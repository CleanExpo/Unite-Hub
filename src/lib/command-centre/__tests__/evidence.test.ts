import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { writeEvidence, resolveWikiPath, DEFAULT_WIKI_PATH } from '@/lib/obsidian/evidence'

let tempWiki: string
const originalWikiPath = process.env.WIKI_PATH

beforeEach(async () => {
  tempWiki = await mkdtemp(path.join(tmpdir(), 'cc-evidence-'))
  process.env.WIKI_PATH = tempWiki
})

afterEach(async () => {
  if (originalWikiPath === undefined) delete process.env.WIKI_PATH
  else process.env.WIKI_PATH = originalWikiPath
  await rm(tempWiki, { recursive: true, force: true })
})

describe('resolveWikiPath', () => {
  it('uses WIKI_PATH when set', () => {
    process.env.WIKI_PATH = tempWiki
    expect(resolveWikiPath()).toBe(tempWiki)
  })

  it('falls back to the canonical vault when unset', () => {
    delete process.env.WIKI_PATH
    expect(resolveWikiPath()).toBe(DEFAULT_WIKI_PATH)
  })
})

describe('writeEvidence', () => {
  it('round-trips a schema-d note under raw/command-centre/<project>', async () => {
    const result = await writeEvidence({
      project: 'Unite-Hub',
      taskId: 'CC-TEST',
      kind: 'validation',
      frontmatter: { title: 'Starter validation', tags: ['command-center', 'evidence'], confidence: 'high' },
      body: 'All gates green.',
      sources: ['D:/Unite-Hub/package.json'],
    })

    expect(result.notePath).toContain(path.join('raw', 'command-centre', 'Unite-Hub'))
    expect(result.suffixed).toBe(false)

    const written = await readFile(result.notePath, 'utf-8')
    expect(written).toContain('title: "Starter validation"')
    expect(written).toContain('type: "validation"')
    expect(written).toContain('confidence: high')
    expect(written).toContain('# Starter validation')
    expect(written).toContain('All gates green.')
    expect(written).toContain('D:/Unite-Hub/package.json')

    // log.md gets exactly the one appended line.
    const log = await readFile(path.join(tempWiki, 'log.md'), 'utf-8')
    expect(log).toContain('Command Centre evidence')
    expect(log).toContain(result.relativePath)
  })

  it('never overwrites an existing note (suffixes a timestamp on collision)', async () => {
    const first = await writeEvidence({
      project: 'Synthex', taskId: 'CC-DUP', kind: 'summary',
      frontmatter: { title: 'First' }, body: 'one',
    })
    const second = await writeEvidence({
      project: 'Synthex', taskId: 'CC-DUP', kind: 'summary',
      frontmatter: { title: 'Second' }, body: 'two',
    })

    expect(second.suffixed).toBe(true)
    expect(second.notePath).not.toBe(first.notePath)
    expect(await readFile(first.notePath, 'utf-8')).toContain('one')
    expect(await readFile(second.notePath, 'utf-8')).toContain('two')
  })

  it('throws when the body contains a planted sk- secret', async () => {
    await expect(
      writeEvidence({
        project: 'Unite-Hub', taskId: 'CC-LEAK', kind: 'research',
        frontmatter: { title: 'Leak attempt' },
        body: 'Here is a key sk-ABCDEF1234567890 do not write me',
      }),
    ).rejects.toThrow(/secret/i)
  })

  it('throws when frontmatter contains a Bearer token', async () => {
    await expect(
      writeEvidence({
        project: 'Unite-Hub', taskId: 'CC-LEAK2', kind: 'research',
        frontmatter: { title: 'Leak', note: 'Authorization: Bearer abc123' },
        body: 'clean body',
      }),
    ).rejects.toThrow(/secret/i)
  })

  it('rejects postgres:// connection strings and Supabase env leaks', async () => {
    await expect(
      writeEvidence({
        project: 'Unite-Hub', taskId: 'CC-LEAK3', kind: 'research',
        frontmatter: { title: 'Leak3' },
        body: 'db = postgres://user:pass@host/db',
      }),
    ).rejects.toThrow(/secret/i)

    await expect(
      writeEvidence({
        project: 'Unite-Hub', taskId: 'CC-LEAK4', kind: 'research',
        frontmatter: { title: 'Leak4' },
        body: 'SUPABASE_SERVICE_ROLE_KEY=xxxxx',
      }),
    ).rejects.toThrow(/secret/i)
  })
})
