export type IndustryType = 
  | 'technology'
  | 'healthcare'
  | 'finance'
  | 'retail'
  | 'manufacturing'
  | 'education'
  | 'real_estate'
  | 'hospitality'
  | 'logistics'
  | 'other';

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  client_name: string;
  client_logo: string | null;
  industry: IndustryType;
  services_used: string[];
  challenge: string;
  solution: string;
  results: string;
  implementation_time: string | null;
  project_value: number | null;
  featured_image: string | null;
  gallery_images: string[];
  demo_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  featured: boolean;
  published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  services?: Service[];
  metrics?: CaseStudyMetric[];
  testimonials?: CaseStudyTestimonial[];
  technologies?: CaseStudyTechnology[];
}

export interface CaseStudyMetric {
  id: string;
  case_study_id: string;
  metric_name: string;
  metric_value: string;
  metric_improvement: string | null;
  metric_icon: string | null;
  display_order: number;
  created_at: string;
}

export interface CaseStudyTestimonial {
  id: string;
  case_study_id: string;
  author_name: string;
  author_title: string;
  author_company: string;
  author_photo: string | null;
  testimonial_text: string;
  rating: number | null;
  created_at: string;
}

export interface CaseStudyTechnology {
  id: string;
  case_study_id: string;
  technology_name: string;
  technology_logo: string | null;
  created_at: string;
}

export interface CaseStudiesQuery {
  industry?: IndustryType;
  service?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export const INDUSTRY_LABELS: Record<IndustryType, string> = {
  technology: 'Technology',
  healthcare: 'Healthcare',
  finance: 'Finance',
  retail: 'Retail',
  manufacturing: 'Manufacturing',
  education: 'Education',
  real_estate: 'Real Estate',
  hospitality: 'Hospitality',
  logistics: 'Logistics',
  other: 'Other'
};

export const INDUSTRY_ICONS: Record<IndustryType, string> = {
  technology: 'Cpu',
  healthcare: 'Heart',
  finance: 'DollarSign',
  retail: 'ShoppingBag',
  manufacturing: 'Factory',
  education: 'GraduationCap',
  real_estate: 'Building',
  hospitality: 'Hotel',
  logistics: 'Truck',
  other: 'Briefcase'
};
