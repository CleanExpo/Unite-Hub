// src/lib/ai/__tests__/features/web-search.test.ts
// Tests for web search tool builder and result parser.

import { describe, it, expect } from 'vitest'
import { buildWebSearchTool, parseWebSearchResults } from '../../features/web-search'
import type { Citation } from '../../types'

describe('buildWebSearchTool', () => {
  it('returns a tool definition with correct type and name', () => {
    const tool = buildWebSearchTool()
    expect(tool).toEqual({
      type: 'web_search_20250305',
      name: 'web_search',
    })
  })

  it('sets max_uses when maxResults is provided', () => {
    const tool = buildWebSearchTool({ maxResults: 5 })
    expect(tool).toEqual({
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,
    })
  })
})

describe('parseWebSearchResults', () => {
  it('extracts citations from web_search_tool_result blocks', () => {
    const blocks = [
      { type: 'text', text: 'Here are the results:' },
      {
        type: 'web_search_tool_result',
        content: [
          {
            type: 'web_search_result',
            url: 'https://example.com/article',
            title: 'Example Article',
            snippet: 'An example snippet about the topic.',
          },
          {
            type: 'web_search_result',
            url: 'https://ato.gov.au/ruling',
            title: 'ATO Ruling',
            snippet: 'Tax ruling details.',
          },
        ],
      },
    ]

    const citations: Citation[] = parseWebSearchResults(blocks)
    expect(citations).toHaveLength(2)
    expect(citations[0]).toEqual({
      type: 'web_search',
      title: 'Example Article',
      url: 'https://example.com/article',
      content: 'An example snippet about the topic.',
    })
    expect(citations[1]).toEqual({
      type: 'web_search',
      title: 'ATO Ruling',
      url: 'https://ato.gov.au/ruling',
      content: 'Tax ruling details.',
    })
  })

  it('returns empty array when no search results exist', () => {
    const blocks = [
      { type: 'text', text: 'No search was performed.' },
    ]
    expect(parseWebSearchResults(blocks)).toEqual([])
  })

  it('returns empty array for an empty block list', () => {
    expect(parseWebSearchResults([])).toEqual([])
  })
})
