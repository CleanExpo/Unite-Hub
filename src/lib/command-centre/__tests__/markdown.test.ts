import { describe, it, expect } from 'vitest'
import {
  parseMarkdownTable,
  splitRow,
  topRows,
  findColumnIndex,
} from '@/lib/command-centre/markdown'

describe('splitRow', () => {
  it('splits a basic pipe row', () => {
    expect(splitRow('| a | b | c |')).toEqual(['a', 'b', 'c'])
  })

  it('splits a pipe row without leading/trailing pipes', () => {
    expect(splitRow('a | b | c')).toEqual(['a', 'b', 'c'])
  })

  it('trims cell whitespace', () => {
    expect(splitRow('|   foo  |  bar  |')).toEqual(['foo', 'bar'])
  })

  it('returns an empty array for a line with no pipes', () => {
    expect(splitRow('not a table row')).toEqual([])
  })
})

describe('parseMarkdownTable', () => {
  it('returns null for an empty string', () => {
    expect(parseMarkdownTable('')).toBeNull()
  })

  it('returns null for text with no pipe rows', () => {
    expect(parseMarkdownTable('# heading\n\njust a paragraph\n')).toBeNull()
  })

  it('returns null for a header without a separator', () => {
    expect(parseMarkdownTable('| a | b |\n| c | d |\n')).toBeNull()
  })

  it('parses a 2-column table', () => {
    const md = '| col1 | col2 |\n| --- | --- |\n| v1 | v2 |\n| v3 | v4 |\n'
    const t = parseMarkdownTable(md)
    expect(t).not.toBeNull()
    expect(t?.headers).toEqual(['col1', 'col2'])
    expect(t?.rows).toEqual([
      ['v1', 'v2'],
      ['v3', 'v4'],
    ])
  })

  it('parses a 4-column table (matches the real backlog shape)', () => {
    const md = [
      '| # | Lane | Status | Next action |',
      '| --- | --- | --- | --- |',
      '| 1 | Foo | merged | none |',
      '| 2 | Bar | open | build it |',
    ].join('\n')
    const t = parseMarkdownTable(md)
    expect(t).not.toBeNull()
    expect(t?.headers).toHaveLength(4)
    expect(t?.rows).toHaveLength(2)
    expect(t?.rows[0]).toEqual(['1', 'Foo', 'merged', 'none'])
  })

  it('pads short rows to match the header width', () => {
    const md = '| a | b | c |\n| --- | --- | --- |\n| 1 | 2 |\n'
    const t = parseMarkdownTable(md)
    expect(t?.rows[0]).toEqual(['1', '2', ''])
  })

  it('trims long rows to match the header width', () => {
    const md = '| a | b |\n| --- | --- |\n| 1 | 2 | 3 | 4 |\n'
    const t = parseMarkdownTable(md)
    expect(t?.rows[0]).toEqual(['1', '2'])
  })

  it('stops parsing at the first non-pipe line after the header', () => {
    const md = [
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
      'not a pipe row',
      '| 3 | 4 |',
    ].join('\n')
    const t = parseMarkdownTable(md)
    expect(t?.rows).toEqual([['1', '2']])
  })

  it('handles separator rows with alignment colons', () => {
    const md = [
      '| left | center | right |',
      '| :--- | :---: | ---: |',
      '| 1 | 2 | 3 |',
    ].join('\n')
    const t = parseMarkdownTable(md)
    expect(t).not.toBeNull()
    expect(t?.rows).toEqual([['1', '2', '3']])
  })

  it('handles a table preceded by a heading', () => {
    const md = [
      '# Heading',
      '',
      'Some prose',
      '',
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
    ].join('\n')
    const t = parseMarkdownTable(md)
    expect(t).not.toBeNull()
    expect(t?.rows).toEqual([['1', '2']])
  })
})

describe('topRows', () => {
  it('returns the first n rows', () => {
    const md = '| a | b |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |\n| 5 | 6 |\n'
    const t = parseMarkdownTable(md)!
    expect(topRows(t, 2)).toEqual([
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('returns all rows when n exceeds row count', () => {
    const md = '| a | b |\n| --- | --- |\n| 1 | 2 |\n'
    const t = parseMarkdownTable(md)!
    expect(topRows(t, 10)).toEqual([['1', '2']])
  })

  it('returns an empty array when n is less than 1', () => {
    const md = '| a | b |\n| --- | --- |\n| 1 | 2 |\n'
    const t = parseMarkdownTable(md)!
    expect(topRows(t, 0)).toEqual([])
  })
})

describe('findColumnIndex', () => {
  it('returns the index of a header containing the needle (case-insensitive)', () => {
    expect(findColumnIndex(['Lane', 'Status', 'Action'], 'status')).toBe(1)
    expect(findColumnIndex(['Lane', 'Status', 'Action'], 'ACTION')).toBe(2)
  })

  it('returns -1 when no header matches', () => {
    expect(findColumnIndex(['Lane', 'Status'], 'foo')).toBe(-1)
  })
})
