/**
 * Visual Demo Service
 *
 * CRUD operations for visual demo entries.
 * Powers the inspiration gallery and visual experience engine.
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface VisualDemoEntry {
  id: string;
  workspace_id: string | null;
  slug: string;
  title: string;
  category: 'hero' | 'section' | 'card' | 'gallery' | 'social';
  persona: string | null;
  description: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateVisualDemoInput {
  slug: string;
  title: string;
  category: VisualDemoEntry['category'];
  persona?: string;
  description?: string;
  config?: Record<string, unknown>;
  workspace_id?: string;
}

export interface UpdateVisualDemoInput {
  slug?: string;
  title?: string;
  category?: VisualDemoEntry['category'];
  persona?: string;
  description?: string;
  config?: Record<string, unknown>;
}

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

export async function listVisualDemos() {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function listDemosByCategory(category: VisualDemoEntry['category']) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .select('*')
    .eq('category', category)
    .order('title');
}

export async function listDemosByPersona(persona: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .select('*')
    .eq('persona', persona)
    .order('title');
}

export async function getVisualDemo(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .select('*')
    .eq('id', id)
    .single();
}

export async function getVisualDemoBySlug(slug: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .select('*')
    .eq('slug', slug)
    .single();
}

export async function createVisualDemo(data: CreateVisualDemoInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .insert({
      ...data,
      config: data.config || {},
    })
    .select()
    .single();
}

export async function updateVisualDemo(id: string, data: UpdateVisualDemoInput) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .update(data)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteVisualDemo(id: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .delete()
    .eq('id', id);
}

export async function countDemosByCategory() {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('visual_demo_entries')
    .select('category');

  if (error) {
return { data: null, error };
}

  const counts: Record<string, number> = {};
  data.forEach((demo) => {
    counts[demo.category] = (counts[demo.category] || 0) + 1;
  });

  return { data: counts, error: null };
}

export async function searchVisualDemos(query: string) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .select('*')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('title');
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function bulkCreateDemos(demos: CreateVisualDemoInput[]) {
  const supabase = await getSupabaseServer();

  return supabase
    .from('visual_demo_entries')
    .insert(demos.map((d) => ({ ...d, config: d.config || {} })))
    .select();
}

export async function seedDefaultDemos() {
  const defaultDemos: CreateVisualDemoInput[] = [
    {
      slug: 'beam-sweep-hero',
      title: 'Beam Sweep Hero',
      category: 'hero',
      persona: 'saas',
      description: 'Horizontal light sweep animation for tech hero sections',
      config: { animation: 'beam-sweep-alpha', intensity: 'normal' },
    },
    {
      slug: 'clip-fade-service',
      title: 'Clip Fade Service Hero',
      category: 'hero',
      persona: 'trade',
      description: 'Elegant iris reveal for service-based businesses',
      config: { animation: 'clip-fade-radiance', intensity: 'subtle' },
    },
    {
      slug: 'card-morph-portfolio',
      title: 'Card Morph Portfolio',
      category: 'card',
      persona: 'agency',
      description: 'Smooth card transitions for portfolio galleries',
      config: { animation: 'switching-card-morph', intensity: 'normal' },
    },
    {
      slug: 'quantum-glow-ai',
      title: 'Quantum Glow AI Feature',
      category: 'section',
      persona: 'saas',
      description: 'Ethereal glow effect for AI/tech product features',
      config: { animation: 'quantum-glow-pulse', intensity: 'dramatic' },
    },
    {
      slug: 'soft-morph-nonprofit',
      title: 'Soft Morph Nonprofit',
      category: 'hero',
      persona: 'nonprofit',
      description: 'Gentle organic transitions for trust-focused brands',
      config: { animation: 'soft-material-morph', intensity: 'subtle' },
    },
  ];

  return bulkCreateDemos(defaultDemos);
}
