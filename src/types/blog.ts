export interface Author {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  created_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  author_id: string | null;
  category_id: string | null;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  views: number;
  reading_time: number | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Author;
  category?: BlogCategory;
  tags?: BlogTag[];
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string | null;
  parent_comment_id: string | null;
  content: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  replies?: BlogComment[];
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name: string | null;
  subscribed: boolean;
  verified: boolean;
  verification_token: string | null;
  categories: string[];
  created_at: string;
  updated_at: string;
}

// Query types
export interface BlogPostsQuery {
  category?: string;
  tag?: string;
  author?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface BlogPostWithRelations extends BlogPost {
  author: Author;
  category: BlogCategory;
  tags: BlogTag[];
  comment_count?: number;
}
