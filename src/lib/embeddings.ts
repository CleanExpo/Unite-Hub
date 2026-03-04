/**
 * Embedding generation + semantic search utilities (pgvector)
 *
 * Uses OpenAI text-embedding-3-small when OPENAI_API_KEY is set.
 * Falls back to a simple TF-IDF-style placeholder otherwise.
 */

import { supabaseAdmin } from '@/lib/supabase';

const EMBEDDING_DIM = 1536;
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

// ─── Embedding Generation ──────────────────────────────────────────────────

/**
 * Generate a 1536-dimensional embedding for the given text.
 * Uses OpenAI API if available, otherwise returns a deterministic placeholder.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    return generateOpenAIEmbedding(text, apiKey);
  }

  return generatePlaceholderEmbedding(text);
}

async function generateOpenAIEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text.slice(0, 8000), // API limit guard
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embedding error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.data[0].embedding as number[];
}

/**
 * Deterministic placeholder embedding using simple hash-based projection.
 * NOT suitable for production search quality — install OPENAI_API_KEY for real results.
 */
function generatePlaceholderEmbedding(text: string): number[] {
  const normalised = text.toLowerCase().trim();
  const vec = new Float64Array(EMBEDDING_DIM);

  for (let i = 0; i < normalised.length; i++) {
    const code = normalised.charCodeAt(i);
    const idx = (code * 31 + i * 7) % EMBEDDING_DIM;
    vec[idx] += 1.0;
  }

  // L2 normalise
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1;
  const result: number[] = new Array(EMBEDDING_DIM);
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    result[i] = vec[i] / norm;
  }

  return result;
}

// ─── Semantic Search ───────────────────────────────────────────────────────

export interface ContactSearchResult {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  ai_score: number;
  similarity: number;
}

export interface NexusPageSearchResult {
  id: string;
  title: string;
  icon: string | null;
  page_type: string;
  updated_at: string;
  similarity: number;
}

/**
 * Semantic search across contacts using pgvector cosine similarity.
 */
export async function searchContacts(
  query: string,
  workspaceId: string,
  limit = 10,
  threshold = 0.7,
): Promise<ContactSearchResult[]> {
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabaseAdmin.rpc('match_contacts', {
    query_embedding: `[${embedding.join(',')}]`,
    match_threshold: threshold,
    match_count: limit,
    filter_workspace_id: workspaceId,
  });

  if (error) {
    console.error('[searchContacts]', error.message);
    return [];
  }

  return (data ?? []) as ContactSearchResult[];
}

/**
 * Semantic search across NEXUS pages using pgvector cosine similarity.
 */
export async function searchNexusPages(
  query: string,
  userId: string,
  limit = 10,
  threshold = 0.7,
): Promise<NexusPageSearchResult[]> {
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabaseAdmin.rpc('match_nexus_pages', {
    query_embedding: `[${embedding.join(',')}]`,
    match_threshold: threshold,
    match_count: limit,
    filter_owner_id: userId,
  });

  if (error) {
    console.error('[searchNexusPages]', error.message);
    return [];
  }

  return (data ?? []) as NexusPageSearchResult[];
}
