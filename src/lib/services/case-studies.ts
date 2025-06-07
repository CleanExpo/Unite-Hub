import { supabaseClient } from '@/lib/supabase/client';
import { 
  CaseStudy, 
  CaseStudyMetric, 
  CaseStudyTestimonial,
  CaseStudyTechnology,
  CaseStudiesQuery,
  IndustryType,
  Service
} from '@/types/case-studies';

// Get all case studies with filters
export async function getCaseStudies(query: CaseStudiesQuery = {}) {
  let supabaseQuery = supabaseClient
    .from('case_studies')
    .select(`
      *,
      metrics:case_study_metrics(*),
      testimonials:case_study_testimonials(*),
      technologies:case_study_technologies(*)
    `)
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (query.industry) {
    supabaseQuery = supabaseQuery.eq('industry', query.industry);
  }

  if (query.service) {
    supabaseQuery = supabaseQuery.contains('services_used', [query.service]);
  }

  if (query.featured !== undefined) {
    supabaseQuery = supabaseQuery.eq('featured', query.featured);
  }

  if (query.search) {
    supabaseQuery = supabaseQuery.or(
      `title.ilike.%${query.search}%,client_name.ilike.%${query.search}%,challenge.ilike.%${query.search}%,solution.ilike.%${query.search}%`
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

  // Fetch services data for each case study
  const caseStudiesWithServices = await Promise.all(
    (data || []).map(async (caseStudy) => {
      if (caseStudy.services_used && caseStudy.services_used.length > 0) {
        const { data: services } = await supabaseClient
          .from('services')
          .select('*')
          .in('id', caseStudy.services_used);
        
        return {
          ...caseStudy,
          services: services || []
        };
      }
      return {
        ...caseStudy,
        services: []
      };
    })
  );

  return caseStudiesWithServices as CaseStudy[];
}

// Get single case study by slug
export async function getCaseStudyBySlug(slug: string) {
  const { data, error } = await supabaseClient
    .from('case_studies')
    .select(`
      *,
      metrics:case_study_metrics(*),
      testimonials:case_study_testimonials(*),
      technologies:case_study_technologies(*)
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) throw error;

  // Fetch services data
  let services: Service[] = [];
  if (data.services_used && data.services_used.length > 0) {
    const { data: servicesData } = await supabaseClient
      .from('services')
      .select('*')
      .in('id', data.services_used);
    
    services = servicesData || [];
  }

  // Sort metrics by display order
  if (data.metrics) {
    data.metrics.sort((a: CaseStudyMetric, b: CaseStudyMetric) => a.display_order - b.display_order);
  }

  return {
    ...data,
    services
  } as CaseStudy;
}

// Get featured case studies
export async function getFeaturedCaseStudies(limit = 3) {
  const { data, error } = await supabaseClient
    .from('case_studies')
    .select(`
      *,
      metrics:case_study_metrics(*),
      testimonials:case_study_testimonials(*)
    `)
    .eq('published', true)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as CaseStudy[];
}

// Get case studies by industry
export async function getCaseStudiesByIndustry(industry: IndustryType, limit = 10) {
  const { data, error } = await supabaseClient
    .from('case_studies')
    .select(`
      *,
      metrics:case_study_metrics(*),
      testimonials:case_study_testimonials(*)
    `)
    .eq('published', true)
    .eq('industry', industry)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as CaseStudy[];
}

// Get case studies by service
export async function getCaseStudiesByService(serviceId: string, limit = 10) {
  const { data, error } = await supabaseClient
    .from('case_studies')
    .select(`
      *,
      metrics:case_study_metrics(*),
      testimonials:case_study_testimonials(*)
    `)
    .eq('published', true)
    .contains('services_used', [serviceId])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as CaseStudy[];
}

// Get related case studies
export async function getRelatedCaseStudies(
  currentCaseStudyId: string,
  industry: IndustryType,
  servicesUsed: string[],
  limit = 3
) {
  // First try to get case studies from the same industry
  const { data: industryData, error } = await supabaseClient
    .from('case_studies')
    .select(`
      *,
      metrics:case_study_metrics(*),
      testimonials:case_study_testimonials(*)
    `)
    .eq('published', true)
    .eq('industry', industry)
    .neq('id', currentCaseStudyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  let data = industryData;

  // If we don't have enough, get more based on services used
  if (!data || data.length < limit) {
    const { data: additionalData, error: additionalError } = await supabaseClient
      .from('case_studies')
      .select(`
        *,
        metrics:case_study_metrics(*),
        testimonials:case_study_testimonials(*)
      `)
      .eq('published', true)
      .neq('id', currentCaseStudyId)
      .overlaps('services_used', servicesUsed)
      .order('created_at', { ascending: false })
      .limit(limit - (data?.length || 0));

    if (!additionalError && additionalData) {
      data = [...(data || []), ...additionalData];
    }
  }

  return data as CaseStudy[];
}

// Get all services
export async function getServices() {
  const { data, error } = await supabaseClient
    .from('services')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Service[];
}

// Get service by slug
export async function getServiceBySlug(slug: string) {
  const { data, error } = await supabaseClient
    .from('services')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data as Service;
}

// Get case study statistics
export async function getCaseStudyStats() {
  const { count: totalCaseStudies, error: totalError } = await supabaseClient
    .from('case_studies')
    .select('id', { count: 'exact', head: true })
    .eq('published', true);

  if (totalError) throw totalError;

  const { data: industries, error: industriesError } = await supabaseClient
    .from('case_studies')
    .select('industry')
    .eq('published', true);

  if (industriesError) throw industriesError;

  // Count case studies by industry
  const industryBreakdown: Record<IndustryType, number> = {
    technology: 0,
    healthcare: 0,
    finance: 0,
    retail: 0,
    manufacturing: 0,
    education: 0,
    real_estate: 0,
    hospitality: 0,
    logistics: 0,
    other: 0
  };

  industries?.forEach(item => {
    if (item.industry in industryBreakdown) {
      industryBreakdown[item.industry as IndustryType]++;
    }
  });

  // Get average metrics improvements
  const { data: metrics, error: metricsError } = await supabaseClient
    .from('case_study_metrics')
    .select('metric_improvement');

  if (metricsError) throw metricsError;

  // Calculate average improvement percentage
  let totalImprovement = 0;
  let improvementCount = 0;

  metrics?.forEach(metric => {
    if (metric.metric_improvement) {
      const match = metric.metric_improvement.match(/\+?(\d+)%/);
      if (match) {
        totalImprovement += parseInt(match[1]);
        improvementCount++;
      }
    }
  });

  const averageImprovement = improvementCount > 0 
    ? Math.round(totalImprovement / improvementCount)
    : 0;

  return {
    totalCaseStudies: totalCaseStudies || 0,
    industryBreakdown,
    averageImprovement
  };
}

// Search case studies
export async function searchCaseStudies(searchTerm: string, limit = 10) {
  const { data, error } = await supabaseClient
    .from('case_studies')
    .select(`
      *,
      metrics:case_study_metrics(*),
      testimonials:case_study_testimonials(*)
    `)
    .eq('published', true)
    .or(`title.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%,challenge.ilike.%${searchTerm}%,solution.ilike.%${searchTerm}%,results.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as CaseStudy[];
}
