/**
 * Author Attribution & E.E.A.T. Signal Generator
 *
 * Generates author profiles with Expertise, Experience, Authoritativeness, Trustworthiness
 * signals for schema.org markup. This improves content credibility for search engines
 * and LLM platforms.
 */

export type AuthorType = 'business-owner' | 'employee' | 'customer' | 'expert';

export interface AuthorProfile {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  jobTitle: string;
  affiliation: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  knowsAbout: string[]; // Areas of expertise
  hasCredential: string[]; // Certifications, licenses
  hasOccupation?: {
    '@type': 'Occupation';
    name: string;
    description?: string;
  };
  sameAs?: string[]; // LinkedIn, social profiles
  image?: string;
  description?: string;
  yearsOfExperience?: number;
}

export interface E2EATSignals {
  expertise: {
    score: number; // 0-100
    signals: string[];
  };
  experience: {
    score: number; // 0-100
    signals: string[];
  };
  authoritativeness: {
    score: number; // 0-100
    signals: string[];
  };
  trustworthiness: {
    score: number; // 0-100
    signals: string[];
  };
  overallScore: number; // 0-100
}

export interface ContributorContext {
  name: string;
  type: AuthorType;
  jobTitle?: string;
  businessName: string;
  yearsOfExperience?: number;
  certifications?: string[];
  specialties?: string[];
  linkedInUrl?: string;
  mediaType: 'video' | 'photo' | 'voice' | 'text' | 'review' | 'faq';
}

/**
 * Generate author profile with E.E.A.T. signals
 */
export function generateAuthorProfile(context: ContributorContext): AuthorProfile {
  const expertise = extractExpertiseSignals(context);
  const certifications = context.certifications || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: context.name,
    jobTitle: context.jobTitle || 'Customer',
    affiliation: {
      '@type': 'Organization',
      name: context.businessName,
      url: '', // Should be populated with actual business URL
    },
    knowsAbout: expertise,
    hasCredential: certifications,
    yearsOfExperience: context.yearsOfExperience || 0,
    sameAs: context.linkedInUrl ? [context.linkedInUrl] : undefined,
    description: generateAuthorDescription(context),
  };
}

/**
 * Calculate E.E.A.T. scores for content
 */
export function calculateE2EATScores(context: ContributorContext): E2EATSignals {
  const expertiseScore = calculateExpertiseScore(context);
  const experienceScore = calculateExperienceScore(context);
  const authoritativenessScore = calculateAuthoritatnessScore(context);
  const trustworthinessScore = calculateTrustworthinessScore(context);

  const overallScore = Math.round(
    (expertiseScore + experienceScore + authoritativenessScore + trustworthinessScore) / 4
  );

  return {
    expertise: {
      score: expertiseScore,
      signals: getExpertiseSignals(context),
    },
    experience: {
      score: experienceScore,
      signals: getExperienceSignals(context),
    },
    authoritativeness: {
      score: authoritativenessScore,
      signals: getAuthoritatnessSignals(context),
    },
    trustworthiness: {
      score: trustworthinessScore,
      signals: getTrustworthinessSignals(context),
    },
    overallScore,
  };
}

/**
 * Calculate Expertise Score (0-100)
 * Factors: Specialized knowledge, certifications, job title, years in field
 */
function calculateExpertiseScore(context: ContributorContext): number {
  let score = 40; // Base score for all contributors

  // Job title bonus
  if (context.jobTitle) {
    const expertKeywords = ['master', 'senior', 'lead', 'director', 'principal', 'expert'];
    if (expertKeywords.some((kw) => context.jobTitle!.toLowerCase().includes(kw))) {
      score += 20;
    } else if (context.jobTitle.toLowerCase().includes('manager')) {
      score += 15;
    }
  }

  // Certifications bonus
  if (context.certifications && context.certifications.length > 0) {
    score += Math.min(context.certifications.length * 10, 30);
  }

  // Years of experience bonus
  if (context.yearsOfExperience) {
    if (context.yearsOfExperience >= 10) score += 20;
    else if (context.yearsOfExperience >= 5) score += 15;
    else if (context.yearsOfExperience >= 2) score += 10;
  }

  // Media type bonus (video and voice show more expertise)
  if (context.mediaType === 'video') score += 5;
  if (context.mediaType === 'voice') score += 3;

  return Math.min(score, 100);
}

/**
 * Calculate Experience Score (0-100)
 * Factors: Author type (business owner > employee > customer), media richness, years in role
 */
function calculateExperienceScore(context: ContributorContext): number {
  let score = 30; // Base score

  // Author type bonus
  if (context.type === 'business-owner') {
    score += 40;
  } else if (context.type === 'employee') {
    score += 20;
  } else if (context.type === 'expert') {
    score += 35;
  }

  // Years of experience
  if (context.yearsOfExperience) {
    if (context.yearsOfExperience >= 10) score += 15;
    else if (context.yearsOfExperience >= 5) score += 10;
    else if (context.yearsOfExperience >= 1) score += 5;
  }

  // Media type (video shows real experience)
  if (context.mediaType === 'video') score += 10;
  if (context.mediaType === 'photo') score += 5;

  return Math.min(score, 100);
}

/**
 * Calculate Authoritativeness Score (0-100)
 * Factors: Certifications, credentials, job seniority, public presence
 */
function calculateAuthoritatnessScore(context: ContributorContext): number {
  let score = 35; // Base score

  // Certifications are strong authority signal
  if (context.certifications && context.certifications.length > 0) {
    score += Math.min(context.certifications.length * 15, 35);
  }

  // Seniority in job title
  if (context.jobTitle) {
    const seniorKeywords = ['director', 'principal', 'chief', 'lead', 'founder'];
    if (seniorKeywords.some((kw) => context.jobTitle!.toLowerCase().includes(kw))) {
      score += 20;
    } else if (context.jobTitle.toLowerCase().includes('manager')) {
      score += 15;
    } else if (context.jobTitle.toLowerCase().includes('specialist')) {
      score += 10;
    }
  }

  // Public presence (LinkedIn profile)
  if (context.linkedInUrl) {
    score += 15;
  }

  return Math.min(score, 100);
}

/**
 * Calculate Trustworthiness Score (0-100)
 * Factors: Real person (video/photo), named business, verified type, explicit consent
 */
function calculateTrustworthinessScore(context: ContributorContext): number {
  let score = 50; // Base score for real contributor

  // Rich media (video/photo are more trustworthy than text)
  if (context.mediaType === 'video') {
    score += 25; // Video shows real person
  } else if (context.mediaType === 'photo') {
    score += 15; // Photo shows real content
  } else if (context.mediaType === 'voice') {
    score += 20; // Voice shows real person
  } else if (context.mediaType === 'text') {
    score += 5; // Text is least trustworthy
  }

  // Named business context
  if (context.businessName) {
    score += 10;
  }

  // Specific job title (more specific = more trustworthy)
  if (context.jobTitle && context.jobTitle.length > 3) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Get expertise signals for this context
 */
function getExpertiseSignals(context: ContributorContext): string[] {
  const signals: string[] = [];

  if (context.certifications && context.certifications.length > 0) {
    signals.push(`Certified: ${context.certifications.join(', ')}`);
  }

  if (context.specialties && context.specialties.length > 0) {
    signals.push(`Specializes in: ${context.specialties.join(', ')}`);
  }

  if (context.jobTitle) {
    signals.push(`Role: ${context.jobTitle}`);
  }

  if (context.yearsOfExperience) {
    signals.push(`Experience: ${context.yearsOfExperience}+ years`);
  }

  if (context.mediaType === 'video') {
    signals.push('Expert demonstrates knowledge via video');
  }

  return signals;
}

/**
 * Get experience signals for this context
 */
function getExperienceSignals(context: ContributorContext): string[] {
  const signals: string[] = [];

  if (context.type === 'business-owner') {
    signals.push('Business owner/operator (hands-on experience)');
  } else if (context.type === 'employee') {
    signals.push('Direct employee (day-to-day experience)');
  } else if (context.type === 'customer') {
    signals.push('Real customer (verified user experience)');
  }

  if (context.yearsOfExperience) {
    if (context.yearsOfExperience >= 10) {
      signals.push('Decades of hands-on experience');
    } else if (context.yearsOfExperience >= 5) {
      signals.push('Multiple years of proven experience');
    }
  }

  if (context.mediaType === 'video') {
    signals.push('First-person testimony in video format');
  }

  return signals;
}

/**
 * Get authoritativeness signals
 */
function getAuthoritatnessSignals(context: ContributorContext): string[] {
  const signals: string[] = [];

  if (context.certifications && context.certifications.length > 0) {
    context.certifications.forEach((cert) => {
      signals.push(`${cert} - verified credential`);
    });
  }

  if (context.jobTitle) {
    const seniorKeywords = ['director', 'principal', 'chief', 'founder', 'owner'];
    if (seniorKeywords.some((kw) => context.jobTitle!.toLowerCase().includes(kw))) {
      signals.push(`Leadership position: ${context.jobTitle}`);
    }
  }

  if (context.linkedInUrl) {
    signals.push('Verified public professional profile');
  }

  if (context.businessName) {
    signals.push(`Affiliated with: ${context.businessName}`);
  }

  return signals;
}

/**
 * Get trustworthiness signals
 */
function getTrustworthinessSignals(context: ContributorContext): string[] {
  const signals: string[] = [];

  if (context.mediaType === 'video') {
    signals.push('Verified real person (video testimony)');
  } else if (context.mediaType === 'photo') {
    signals.push('Real content verified with photos');
  }

  if (context.type === 'customer') {
    signals.push('Verified customer (genuine user experience)');
  } else if (context.type === 'business-owner') {
    signals.push('Direct business operator (accountable party)');
  }

  if (context.businessName) {
    signals.push(`Transparent business affiliation: ${context.businessName}`);
  }

  if (context.jobTitle) {
    signals.push(`Identified role: ${context.jobTitle}`);
  }

  signals.push('User-generated content (authentic voice)');

  return signals;
}

/**
 * Generate author description
 */
function generateAuthorDescription(context: ContributorContext): string {
  const parts: string[] = [];

  if (context.type === 'business-owner') {
    parts.push(`Owner and operator of ${context.businessName}`);
  } else if (context.type === 'employee') {
    parts.push(`Employee at ${context.businessName}`);
  } else if (context.type === 'customer') {
    parts.push(`Customer of ${context.businessName}`);
  }

  if (context.jobTitle) {
    parts.push(`serving as ${context.jobTitle}`);
  }

  if (context.yearsOfExperience) {
    parts.push(`with ${context.yearsOfExperience}+ years of experience`);
  }

  if (context.specialties && context.specialties.length > 0) {
    parts.push(`specializing in ${context.specialties.join(', ')}`);
  }

  return parts.join(', ').replace(', serving', ' serving').replace(', with', ', with') + '.';
}

/**
 * Extract expertise signals from context
 */
function extractExpertiseSignals(context: ContributorContext): string[] {
  const expertise: string[] = [];

  if (context.specialties) {
    expertise.push(...context.specialties);
  }

  if (context.jobTitle) {
    // Extract domain from job title
    const titleDomains = extractDomainsFromTitle(context.jobTitle);
    expertise.push(...titleDomains);
  }

  // Add business category as expertise
  expertise.push('Customer Service', 'Quality Assurance', 'Professional Services');

  return [...new Set(expertise)]; // Remove duplicates
}

/**
 * Extract domains from job title
 */
function extractDomainsFromTitle(jobTitle: string): string[] {
  const domains: string[] = [];
  const titleLower = jobTitle.toLowerCase();

  if (titleLower.includes('plumb')) domains.push('Plumbing', 'Pipe Repair', 'Installation');
  if (titleLower.includes('electric')) domains.push('Electrical Work', 'Wiring', 'Installation');
  if (titleLower.includes('hvac')) domains.push('HVAC', 'Climate Control', 'Maintenance');
  if (titleLower.includes('design')) domains.push('Design', 'Creative Services', 'Project Planning');
  if (titleLower.includes('engineer')) domains.push('Engineering', 'Technical Problem Solving');
  if (titleLower.includes('manager')) domains.push('Project Management', 'Team Leadership');
  if (titleLower.includes('developer')) domains.push('Software Development', 'Technical Services');
  if (titleLower.includes('consultant')) domains.push('Consultation', 'Expert Advice');
  if (titleLower.includes('director')) domains.push('Business Operations', 'Strategic Planning');

  return domains.length > 0 ? domains : ['Professional Services', 'Business Operations'];
}
