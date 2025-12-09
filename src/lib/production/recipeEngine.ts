/**
 * Production Recipe Engine
 * Phase 54: Execute marketing production recipes
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface Recipe {
  id: string;
  name: string;
  slug: string;
  recipe_type: string;
  description?: string;
  is_system: boolean;
  is_high_impact: boolean;
  steps: RecipeStep[];
  outputs: string[];
  estimated_duration_hours?: number;
  requires_approval: boolean;
}

export interface RecipeStep {
  step: number;
  title: string;
  action: string;
}

export interface ProductionPack {
  id: string;
  organization_id: string;
  client_id: string;
  recipe_id?: string;
  pack_type: string;
  title: string;
  description?: string;
  status: 'draft' | 'generating' | 'pending_review' | 'approved' | 'delivered' | 'archived';
  period_start?: string;
  period_end?: string;
  deliverables: any[];
  assets: any[];
  metrics: Record<string, any>;
  generated_at?: string;
  approved_at?: string;
  delivered_at?: string;
}

export interface PackDeliverable {
  id: string;
  pack_id: string;
  job_id?: string;
  title: string;
  deliverable_type: string;
  status: string;
  content: any;
  file_url?: string;
  ai_generated: boolean;
  requires_approval: boolean;
}

// Get all available recipes
export async function getRecipes(): Promise<Recipe[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('production_recipes')
    .select('*')
    .order('name');

  return data || [];
}

// Get recipe by slug
export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('production_recipes')
    .select('*')
    .eq('slug', slug)
    .single();

  return data;
}

// Create a production pack from a recipe
export async function createPackFromRecipe(
  organizationId: string,
  clientId: string,
  recipeSlug: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<ProductionPack | null> {
  const supabase = await getSupabaseServer();

  const recipe = await getRecipeBySlug(recipeSlug);
  if (!recipe) {
return null;
}

  // Determine pack type
  const packType = recipe.recipe_type.includes('strategy')
    ? 'monthly_strategy'
    : recipe.recipe_type.includes('execution')
    ? 'weekly_execution'
    : 'custom';

  // Generate title
  const period = periodStart
    ? `${new Date(periodStart).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`
    : new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
  const title = `${recipe.name} - ${period}`;

  const { data: pack, error } = await supabase
    .from('production_packs')
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      recipe_id: recipe.id,
      pack_type: packType,
      title,
      description: recipe.description,
      status: 'draft',
      period_start: periodStart?.toISOString().split('T')[0],
      period_end: periodEnd?.toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error || !pack) {
return null;
}

  // Create deliverable placeholders based on recipe outputs
  const deliverables = recipe.outputs.map((output) => ({
    pack_id: pack.id,
    title: output.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    deliverable_type: mapOutputToType(output),
    status: 'pending',
    ai_generated: true,
    requires_approval: recipe.requires_approval || recipe.is_high_impact,
  }));

  await supabase.from('pack_deliverables').insert(deliverables);

  return pack;
}

// Map recipe output to deliverable type
function mapOutputToType(output: string): string {
  const mapping: Record<string, string> = {
    content_calendar: 'other',
    blog_topics: 'blog_post',
    social_themes: 'social_post',
    visual_concepts: 'visual_concept',
    performance_summary: 'report',
    blog_post: 'blog_post',
    social_posts: 'social_post',
    email_template: 'email_template',
    visual_assets: 'visual_concept',
    keyword_report: 'seo_brief',
    content_brief: 'seo_brief',
    main_article: 'blog_post',
    supporting_pages: 'blog_post',
    link_map: 'other',
    analytics_summary: 'report',
    trend_report: 'report',
    recommendations: 'report',
    action_items: 'other',
  };
  return mapping[output] || 'other';
}

// Get packs for a client
export async function getClientPacks(
  clientId: string,
  status?: string
): Promise<ProductionPack[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('production_packs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data } = await query;
  return data || [];
}

// Get pack with deliverables
export async function getPackWithDeliverables(
  packId: string
): Promise<{ pack: ProductionPack; deliverables: PackDeliverable[] } | null> {
  const supabase = await getSupabaseServer();

  const { data: pack } = await supabase
    .from('production_packs')
    .select('*')
    .eq('id', packId)
    .single();

  if (!pack) {
return null;
}

  const { data: deliverables } = await supabase
    .from('pack_deliverables')
    .select('*')
    .eq('pack_id', packId)
    .order('created_at');

  return { pack, deliverables: deliverables || [] };
}

// Update pack status
export async function updatePackStatus(
  packId: string,
  status: ProductionPack['status'],
  userId?: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'approved') {
    updates.approved_at = new Date().toISOString();
    updates.approved_by = userId;
  } else if (status === 'delivered') {
    updates.delivered_at = new Date().toISOString();
  } else if (status === 'generating') {
    updates.generated_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('production_packs')
    .update(updates)
    .eq('id', packId);

  return !error;
}

// Update deliverable status
export async function updateDeliverableStatus(
  deliverableId: string,
  status: string,
  content?: any,
  userId?: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (content) {
    updates.content = content;
  }

  if (status === 'approved') {
    updates.approved_at = new Date().toISOString();
    updates.approved_by = userId;
  }

  const { error } = await supabase
    .from('pack_deliverables')
    .update(updates)
    .eq('id', deliverableId);

  return !error;
}

// Generate deliverables for a pack (stub for AI integration)
export async function generatePackDeliverables(packId: string): Promise<void> {
  // This would integrate with AI generation services
  // For now, update status to show generation started
  await updatePackStatus(packId, 'generating');

  // TODO: Queue AI generation jobs for each deliverable
  // Each deliverable would be generated based on recipe steps
}

export default {
  getRecipes,
  getRecipeBySlug,
  createPackFromRecipe,
  getClientPacks,
  getPackWithDeliverables,
  updatePackStatus,
  updateDeliverableStatus,
  generatePackDeliverables,
};
