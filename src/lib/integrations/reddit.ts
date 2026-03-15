/**
 * Reddit API Client — OAuth2 Script App
 *
 * Uses password grant flow for script-type Reddit applications.
 * All API calls go through https://oauth.reddit.com with a cached token.
 *
 * Env vars required:
 *   REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD
 *
 * Rate limit: Reddit enforces ~60 requests/minute for OAuth clients.
 * Callers should avoid rapid sequential calls.
 */

const REDDIT_API = 'https://oauth.reddit.com'
const REDDIT_AUTH = 'https://www.reddit.com/api/v1'

interface RedditAuthToken {
  access_token: string
  expires_at: number
}

let cachedToken: RedditAuthToken | null = null

function getUserAgent(): string {
  const username = process.env.REDDIT_USERNAME ?? 'unknown'
  return `Unite-Group/1.0 (by /u/${username})`
}

/**
 * Get a Reddit OAuth token using password grant (script app).
 * Caches the token until expiry.
 */
async function getRedditToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    return cachedToken.access_token
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const username = process.env.REDDIT_USERNAME
  const password = process.env.REDDIT_PASSWORD

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error('Reddit credentials not configured. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD.')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${REDDIT_AUTH}/access_token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': getUserAgent(),
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Reddit auth failed (${response.status}): ${text}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`Reddit auth error: ${data.error}`)
  }

  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  }

  return cachedToken.access_token
}

/**
 * Make an authenticated request to the Reddit API.
 */
async function redditFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getRedditToken()
  const url = path.startsWith('http') ? path : `${REDDIT_API}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': getUserAgent(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Reddit API error (${response.status}) ${path}: ${text}`)
  }

  return response
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RedditPost {
  id: string
  title: string
  url: string
  subreddit: string
  score: number
  numComments: number
  createdAt: string
}

export interface RedditSubmitResult {
  id: string
  name: string // t3_<id>
  url: string
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

/**
 * Submit a text post to a subreddit.
 * POST /api/submit with kind=self
 */
export async function submitTextPost(
  subreddit: string,
  title: string,
  body: string
): Promise<RedditSubmitResult> {
  const response = await redditFetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_type: 'json',
      kind: 'self',
      sr: subreddit,
      title,
      text: body,
    }),
  })

  const data = await response.json()
  const result = data?.json?.data

  if (!result) {
    const errors = data?.json?.errors
    throw new Error(`Reddit submit failed: ${JSON.stringify(errors ?? data)}`)
  }

  return {
    id: result.id,
    name: result.name,
    url: result.url,
  }
}

/**
 * Submit a link post to a subreddit.
 * POST /api/submit with kind=link
 */
export async function submitLinkPost(
  subreddit: string,
  title: string,
  url: string
): Promise<RedditSubmitResult> {
  const response = await redditFetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_type: 'json',
      kind: 'link',
      sr: subreddit,
      title,
      url,
    }),
  })

  const data = await response.json()
  const result = data?.json?.data

  if (!result) {
    const errors = data?.json?.errors
    throw new Error(`Reddit submit failed: ${JSON.stringify(errors ?? data)}`)
  }

  return {
    id: result.id,
    name: result.name,
    url: result.url,
  }
}

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

/**
 * Reply to a Reddit comment or post.
 * POST /api/comment with thing_id=t1_xxx or t3_xxx
 */
export async function replyToThing(
  thingId: string,
  body: string
): Promise<string> {
  const response = await redditFetch('/api/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_type: 'json',
      thing_id: thingId,
      text: body,
    }),
  })

  const data = await response.json()
  const things = data?.json?.data?.things

  if (!things || things.length === 0) {
    const errors = data?.json?.errors
    throw new Error(`Reddit comment failed: ${JSON.stringify(errors ?? data)}`)
  }

  return things[0].data.id as string
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Map a Reddit API listing child to our RedditPost interface.
 */
function mapPost(child: Record<string, unknown>): RedditPost {
  const d = child.data as Record<string, unknown>
  return {
    id: d.id as string,
    title: d.title as string,
    url: d.url as string,
    subreddit: d.subreddit as string,
    score: d.score as number,
    numComments: d.num_comments as number,
    createdAt: new Date((d.created_utc as number) * 1000).toISOString(),
  }
}

/**
 * Fetch recent posts from a subreddit (hot/new).
 * GET /r/{subreddit}/{sort}
 */
export async function fetchSubredditPosts(
  subreddit: string,
  sort: 'hot' | 'new' = 'new',
  limit: number = 25
): Promise<RedditPost[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  const response = await redditFetch(`/r/${subreddit}/${sort}?${params}`)
  const data = await response.json()

  const children = data?.data?.children ?? []
  return children.map(mapPost)
}

/**
 * Search Reddit for mentions of a keyword.
 * GET /search?q=keyword
 */
export async function searchReddit(
  query: string,
  subreddit?: string,
  limit: number = 25
): Promise<RedditPost[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    sort: 'new',
    type: 'link',
  })

  if (subreddit) {
    params.set('restrict_sr', 'true')
  }

  const path = subreddit
    ? `/r/${subreddit}/search?${params}`
    : `/search?${params}`

  const response = await redditFetch(path)
  const data = await response.json()

  const children = data?.data?.children ?? []
  return children.map(mapPost)
}
