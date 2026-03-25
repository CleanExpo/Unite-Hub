// src/lib/ai/features/web-fetch.ts
// Server-side URL fetch utility — retrieves page content for prompt injection.
// Not an Anthropic API tool; runs in Next.js route handlers before building the prompt.
//
// Usage:
//   const page = await fetchUrlContent('https://ato.gov.au/...')
//   if (page) messages.push({ role: 'user', content: `URL content:\n${page.content}` })

// ── Types ────────────────────────────────────────────────────────────────────

export interface FetchedPage {
  url: string
  title: string
  content: string
  /** Content length after truncation (characters). */
  truncatedLength: number
}

// ── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_MAX_CHARS = 12000 // ~3 000 tokens — enough for most reference pages
const FETCH_TIMEOUT_MS  = 8000

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch a URL's text content for injection into an AI prompt.
 * Strips HTML tags, collapses whitespace, and truncates to maxChars.
 * Returns null on any network or parsing error — callers should degrade gracefully.
 */
export async function fetchUrlContent(
  url: string,
  maxChars = DEFAULT_MAX_CHARS
): Promise<FetchedPage | null> {
  let html: string

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Unite-Group-Nexus/2.0 (research assistant)' },
    })
    clearTimeout(timer)

    if (!response.ok) return null
    html = await response.text()
  } catch {
    return null
  }

  const title = extractTitle(html)
  const text  = stripHtml(html)
  const truncated = text.slice(0, maxChars)

  return {
    url,
    title,
    content: truncated,
    truncatedLength: truncated.length,
  }
}

/**
 * Format a fetched page as a prompt-ready context block.
 */
export function formatPageForPrompt(page: FetchedPage): string {
  return [
    `[WEB CONTENT — ${page.url}]`,
    `Title: ${page.title}`,
    '',
    page.content,
    page.truncatedLength < page.content.length
      ? `[Content truncated at ${page.truncatedLength} characters]`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match ? decodeHtmlEntities(match[1].trim()) : 'Untitled'
}

function stripHtml(html: string): string {
  return html
    // Remove scripts and styles entirely
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}
