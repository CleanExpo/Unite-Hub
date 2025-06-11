import { supabaseClient } from '@/lib/supabase/client';
import { 
  BlogPost, 
  BlogPostWithRelations, 
  BlogCategory, 
  BlogTag, 
  Author,
  BlogPostsQuery,
  NewsletterSubscriber
} from '@/types/blog';

// Calculate reading time based on word count (average 200 words per minute)
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Blog Posts
export async function getBlogPosts(query: BlogPostsQuery = {}) {
  let supabaseQuery = supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:authors(*),
      category:blog_categories(*),
      tags:blog_tags(*)
    `)
    .eq('status', query.status || 'published')
    .order('published_at', { ascending: false });

  if (query.category) {
    supabaseQuery = supabaseQuery.eq('category.slug', query.category);
  }

  if (query.featured !== undefined) {
    supabaseQuery = supabaseQuery.eq('featured', query.featured);
  }

  if (query.search) {
    supabaseQuery = supabaseQuery.or(
      `title.ilike.%${query.search}%,excerpt.ilike.%${query.search}%,content.ilike.%${query.search}%`
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
  return data as BlogPostWithRelations[];
}

export async function getBlogPostBySlug(slug: string) {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:authors(*),
      category:blog_categories(*),
      tags:blog_post_tags(
        tag:blog_tags(*)
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) throw error;

  // Transform tags structure
  const post = {
    ...data,
    tags: data.tags?.map((pt: any) => pt.tag) || []
  };

  return post as BlogPostWithRelations;
}

export async function incrementBlogPostViews(postId: string) {
  // Fetch current views
  const { data: post, error: fetchError } = await supabaseClient
    .from('blog_posts')
    .select('views')
    .eq('id', postId)
    .single();

  if (fetchError) throw fetchError;

  // Increment views
  const { error: updateError } = await supabaseClient
    .from('blog_posts')
    .update({ views: (post.views || 0) + 1 })
    .eq('id', postId);

  if (updateError) throw updateError;
}

// Categories
export async function getBlogCategories() {
  const { data, error } = await supabaseClient
    .from('blog_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as BlogCategory[];
}

export async function getBlogCategoryBySlug(slug: string) {
  const { data, error } = await supabaseClient
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as BlogCategory;
}

// Tags
export async function getBlogTags() {
  const { data, error } = await supabaseClient
    .from('blog_tags')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as BlogTag[];
}

export async function getBlogTagBySlug(slug: string) {
  const { data, error } = await supabaseClient
    .from('blog_tags')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as BlogTag;
}

// Authors
export async function getAuthors() {
  const { data, error } = await supabaseClient
    .from('authors')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Author[];
}

export async function getAuthorById(id: string) {
  const { data, error } = await supabaseClient
    .from('authors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Author;
}

export async function getAuthorPosts(authorId: string, limit = 10) {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(*)
    `)
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as BlogPostWithRelations[];
}

// Related Posts
export async function getRelatedPosts(
  postId: string, 
  categoryId: string | null, 
  limit = 3
) {
  let query = supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:authors(*),
      category:blog_categories(*)
    `)
    .eq('status', 'published')
    .neq('id', postId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as BlogPostWithRelations[];
}

// Newsletter
export async function subscribeToNewsletter(
  email: string, 
  name?: string, 
  categories?: string[]
) {
  const { data, error } = await supabaseClient
    .from('newsletter_subscribers')
    .insert({
      email,
      name,
      categories: categories || [],
      verification_token: crypto.randomUUID()
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('This email is already subscribed');
    }
    throw error;
  }

  return data as NewsletterSubscriber;
}

export async function unsubscribeFromNewsletter(email: string) {
  const { error } = await supabaseClient
    .from('newsletter_subscribers')
    .update({ subscribed: false })
    .eq('email', email);

  if (error) throw error;
}

export async function verifyNewsletterSubscription(token: string) {
  const { data, error } = await supabaseClient
    .from('newsletter_subscribers')
    .update({ verified: true, verification_token: null })
    .eq('verification_token', token)
    .select()
    .single();

  if (error) throw error;
  return data as NewsletterSubscriber;
}

// Popular Posts
export async function getPopularPosts(limit = 5) {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:authors(*),
      category:blog_categories(*)
    `)
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as BlogPostWithRelations[];
}

// Featured Posts
export async function getFeaturedPosts(limit = 3) {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:authors(*),
      category:blog_categories(*)
    `)
    .eq('status', 'published')
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as BlogPostWithRelations[];
}

// Search functionality
export async function searchBlogPosts(searchTerm: string, limit = 10) {
  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:authors(*),
      category:blog_categories(*)
    `)
    .eq('status', 'published')
    .or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as BlogPostWithRelations[];
}

// Get posts by tag
export async function getPostsByTag(tagSlug: string, limit = 10) {
  const { data: tag, error: tagError } = await supabaseClient
    .from('blog_tags')
    .select('id')
    .eq('slug', tagSlug)
    .single();

  if (tagError) throw tagError;

  const { data, error } = await supabaseClient
    .from('blog_posts')
    .select(`
      *,
      author:authors(*),
      category:blog_categories(*),
      blog_post_tags!inner(tag_id)
    `)
    .eq('status', 'published')
    .eq('blog_post_tags.tag_id', tag.id)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as BlogPostWithRelations[];
}
