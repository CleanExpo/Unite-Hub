export type ResourceType = 'whitepaper' | 'template' | 'checklist' | 'ebook' | 'guide' | 'case_study';

export interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: ResourceType;
  file_url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  author_id: string | null;
  file_size: number | null;
  page_count: number | null;
  download_count: number;
  featured: boolean;
  requires_auth: boolean;
  requires_form: boolean;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
  // Relations
  category?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  author?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface ResourceDownload {
  id: string;
  resource_id: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  company: string | null;
  job_title: string | null;
  phone: string | null;
  ip_address: string | null;
  user_agent: string | null;
  downloaded_at: string;
}

export interface ResourceRecommendation {
  id: string;
  resource_id: string;
  recommended_resource_id: string;
  score: number;
  created_at: string;
  // Relations
  recommended_resource?: Resource;
}

export interface DownloadFormData {
  email: string;
  name: string;
  company?: string;
  job_title?: string;
  phone?: string;
  newsletter_consent?: boolean;
}

export interface ResourcesQuery {
  type?: ResourceType;
  category?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  whitepaper: 'Whitepaper',
  template: 'Template',
  checklist: 'Checklist',
  ebook: 'E-book',
  guide: 'Guide',
  case_study: 'Case Study'
};

export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  whitepaper: 'FileText',
  template: 'FileSpreadsheet',
  checklist: 'CheckSquare',
  ebook: 'Book',
  guide: 'BookOpen',
  case_study: 'Briefcase'
};
