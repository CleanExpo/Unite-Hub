export type LeadQualificationBand =
  | "needs_review"
  | "qualified"
  | "nurture"
  | "spam_risk";

export type QualifyLeadInput = {
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  message?: string | null;
  interests?: string[] | null;
  marketingConsent?: boolean | null;
  referralSource?: string | null;
  source?: string | null;
};

export type LeadQualificationResult = {
  score: number;
  band: LeadQualificationBand;
  reasons: string[];
  recommendationOnly: true;
};

const TEST_LIKE_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.test",
  "localhost",
]);

const DISPOSABLE_DOMAIN_PARTS = [
  "mailinator",
  "tempmail",
  "10minutemail",
  "guerrillamail",
  "yopmail",
  "throwaway",
  "disposable",
];

const SPAM_TERMS = [
  "casino",
  "crypto",
  "loan",
  "viagra",
  "betting",
  "forex",
  "jackpot",
];
const BUSINESS_TERMS = [
  "crm",
  "automation",
  "integration",
  "migration",
  "rollout",
  "implementation",
  "pipeline",
  "sales",
  "marketing",
];

export function qualifyLead(input: QualifyLeadInput): LeadQualificationResult {
  const email = normalise(input.email);
  const phone = normalise(input.phone);
  const company = normalise(input.company);
  const jobTitle = normalise(input.jobTitle);
  const message = normalise(input.message);
  const interests = Array.isArray(input.interests)
    ? input.interests.map(normalise).filter(Boolean)
    : [];
  const marketingConsent = input.marketingConsent === true;

  const reasons: string[] = [];
  let score = 0;

  const hasEmail = isLikelyEmail(email);
  const hasPhone = phone.replace(/\D/g, "").length >= 8;
  const hasContactPath = hasEmail || hasPhone;
  const hasCompany = company.length >= 2;
  const hasJobTitle = jobTitle.length >= 2;
  const hasMessage = message.length >= 12;
  const hasInterest = interests.length > 0;
  const businessTermCount = countTerms(
    `${message} ${interests.join(" ")}`,
    BUSINESS_TERMS,
  );
  const urlCount = (message.match(/https?:\/\/|www\./gi) ?? []).length;
  const spamTermCount = countTerms(message, SPAM_TERMS);
  const nonBusinessDomain = hasEmail && isNonBusinessOrTestLikeDomain(email);

  if (hasContactPath) score += 18;
  if (hasEmail) score += 8;
  if (hasPhone) score += 14;
  if (hasCompany) score += 16;
  if (hasJobTitle) score += 8;
  if (hasMessage) score += message.length >= 80 ? 16 : 10;
  if (hasInterest) score += Math.min(12, interests.length * 6);
  if (marketingConsent) score += 12;
  if (normalise(input.referralSource)) score += 6;
  if (normalise(input.source)) score += 3;
  if (businessTermCount > 0) score += Math.min(12, businessTermCount * 4);

  if (hasCompany && hasContactPath) {
    reasons.push("Has company and direct contact path");
  } else if (!hasContactPath) {
    reasons.push("Missing real contact path");
    score -= 35;
  }

  if (marketingConsent) {
    reasons.push("Marketing consent provided");
  } else {
    reasons.push("Marketing consent missing");
    score -= 25;
  }

  if (hasMessage || hasInterest) {
    reasons.push("Has stated need or interest");
  }

  if (businessTermCount > 0) {
    reasons.push("Business need appears relevant");
  }

  if (!hasPhone || !hasJobTitle || message.length < 40 || !hasInterest) {
    reasons.push("Limited qualification detail");
  }

  if (!marketingConsent && (hasMessage || hasInterest || hasCompany)) {
    reasons.push("Manual review required before outreach");
  }

  let spamRisk = false;

  if (nonBusinessDomain) {
    spamRisk = true;
    score -= 35;
    reasons.push("Email domain is disposable or test-like");
  }

  if (spamTermCount > 0) {
    spamRisk = true;
    score -= Math.min(35, spamTermCount * 12);
    reasons.push("Message contains spam-like terms");
  }

  if (urlCount >= 3 || (urlCount >= 2 && message.length < 160)) {
    spamRisk = true;
    score -= 25;
    reasons.push("Message is URL-heavy");
  }

  if (!hasContactPath) {
    spamRisk = true;
  }

  score = clamp(score, 0, 100);

  const band: LeadQualificationBand = spamRisk
    ? "spam_risk"
    : score >= 75 && marketingConsent
      ? "qualified"
      : marketingConsent
        ? "nurture"
        : "needs_review";

  return {
    score,
    band,
    reasons: Array.from(new Set(reasons)),
    recommendationOnly: true,
  };
}

function normalise(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isLikelyEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function isNonBusinessOrTestLikeDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return true;
  if (TEST_LIKE_DOMAINS.has(domain)) return true;
  return DISPOSABLE_DOMAIN_PARTS.some((part) => domain.includes(part));
}

function countTerms(text: string, terms: string[]): number {
  const lowerText = text.toLowerCase();

  return terms.reduce((count, term) => {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lowerText.match(new RegExp(`\\b${escapedTerm}\\b`, "g"));
    return count + (matches?.length ?? 0);
  }, 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
