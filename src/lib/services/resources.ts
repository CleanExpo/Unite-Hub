import { supabaseClient } from '@/lib/supabase/client';
import { 
  Resource, 
  ResourceDownload, 
  ResourceRecommendation,
  ResourcesQuery,
  DownloadFormData,
  ResourceType
} from '@/types/resources';

// Format file size for display
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'N/A';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Get all resources with filters
export async function getResources(query: ResourcesQuery = {}) {
  let supabaseQuery = supabaseClient
    .from('resources')
    .select(`
      *,
      category:blog_categories(*),
      author:authors(id, name, email, avatar_url)
    `)
    .order('published_at', { ascending: false });

  if (query.type) {
    supabaseQuery = supabaseQuery.eq('type', query.type);
  }

  if (query.category) {
    supabaseQuery = supabaseQuery.eq('category.slug', query.category);
  }

  if (query.featured !== undefined) {
    supabaseQuery = supabaseQuery.eq('featured', query.featured);
  }

  if (query.search) {
    supabaseQuery = supabaseQuery.or(
      `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
    );
  }

  if (query.limit) {
    supabaseQuery = supabaseQuery.limit(query.limit);
  }

  if (query.offset) {
    supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 10) - 1);
  }

  const { data, error } = await supabaseQuery;

  if (error) throw error;
  return data as Resource[];
}

// Get single resource by slug
export async function getResourceBySlug(slug: string) {
  const { data, error } = await supabaseClient
    .from('resources')
    .select(`
      *,
      category:blog_categories(*),
      author:authors(id, name, email, avatar_url)
    `)
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as Resource;
}

// Get featured resources
export async function getFeaturedResources(limit = 3) {
  const { data, error } = await supabaseClient
    .from('resources')
    .select(`
      *,
      category:blog_categories(*),
      author:authors(id, name, email, avatar_url)
    `)
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Resource[];
}

// Get popular resources
export async function getPopularResources(limit = 5) {
  const { data, error } = await supabaseClient
    .from('resources')
    .select(`
      *,
      category:blog_categories(*),
      author:authors(id, name, email, avatar_url)
    `)
    .order('download_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Resource[];
}

// Get resources by type
export async function getResourcesByType(type: ResourceType, limit = 10) {
  const { data, error } = await supabaseClient
    .from('resources')
    .select(`
      *,
      category:blog_categories(*),
      author:authors(id, name, email, avatar_url)
    `)
    .eq('type', type)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Resource[];
}

// Track resource download
export async function trackResourceDownload(
  resourceId: string,
  downloadData: DownloadFormData & { 
    user_id?: string;
    ip_address?: string;
    user_agent?: string;
  }
) {
  // Record the download
  const { data: download, error: downloadError } = await supabaseClient
    .from('resource_downloads')
    .insert({
      resource_id: resourceId,
      user_id: downloadData.user_id || null,
      email: downloadData.email,
      name: downloadData.name,
      company: downloadData.company || null,
      job_title: downloadData.job_title || null,
      phone: downloadData.phone || null,
      ip_address: downloadData.ip_address || null,
      user_agent: downloadData.user_agent || null
    })
    .select()
    .single();

  if (downloadError) throw downloadError;

  // Increment download count
  const { error: incrementError } = await supabaseClient
    .rpc('increment_resource_downloads', { resource_id: resourceId });

  if (incrementError) throw incrementError;

  // If newsletter consent, subscribe them
  if (downloadData.newsletter_consent) {
    try {
      await supabaseClient
        .from('newsletter_subscribers')
        .insert({
          email: downloadData.email,
          name: downloadData.name,
          verification_token: crypto.randomUUID()
        });
    } catch (error) {
      // Ignore duplicate email errors
      console.log('Newsletter subscription error:', error);
    }
  }

  return download as ResourceDownload;
}

// Get related resources
export async function getRelatedResources(resourceId: string, limit = 3) {
  const { data, error } = await supabaseClient
    .rpc('get_related_resources', {
      p_resource_id: resourceId,
      p_limit: limit
    });

  if (error) throw error;
  return data as Resource[];
}

// Get user's download history
export async function getUserDownloads(userId: string) {
  const { data, error } = await supabaseClient
    .from('resource_downloads')
    .select(`
      *,
      resource:resources(*)
    `)
    .eq('user_id', userId)
    .order('downloaded_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Check if user has already downloaded a resource
export async function hasUserDownloadedResource(
  resourceId: string,
  userId?: string,
  email?: string
) {
  let query = supabaseClient
    .from('resource_downloads')
    .select('id')
    .eq('resource_id', resourceId);

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    return false;
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return !!data;
}

// Search resources
export async function searchResources(searchTerm: string, limit = 10) {
  const { data, error } = await supabaseClient
    .from('resources')
    .select(`
      *,
      category:blog_categories(*),
      author:authors(id, name, email, avatar_url)
    `)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('download_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Resource[];
}

// Get resource statistics
export async function getResourceStats() {
  const { data: totalResources, error: totalError } = await supabaseClient
    .from('resources')
    .select('id', { count: 'exact', head: true });

  if (totalError) throw totalError;

  const { data: totalDownloads, error: downloadsError } = await supabaseClient
    .from('resource_downloads')
    .select('id', { count: 'exact', head: true });

  if (downloadsError) throw downloadsError;

  const { data: typeBreakdown, error: typeError } = await supabaseClient
    .from('resources')
    .select('type')
    .then(result => {
      if (result.error) throw result.error;
      
      const breakdown: Record<ResourceType, number> = {
        whitepaper: 0,
        template: 0,
        checklist: 0,
        ebook: 0,
        guide: 0,
        case_study: 0
      };
      
      result.data?.forEach(resource => {
        breakdown[resource.type as ResourceType]++;
      });
      
      return { data: breakdown, error: null };
    });

  if (typeError) throw typeError;

  return {
    totalResources: totalResources || 0,
    totalDownloads: totalDownloads || 0,
    typeBreakdown: typeBreakdown || {}
  };
}
