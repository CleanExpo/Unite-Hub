/**
 * Scope of Work Validator - V2.2
 * Task-007: Verification System - Phased Implementation
 *
 * Validates scope of work documents for:
 * - Duplicate items detection
 * - Missing standard items based on damage type
 * - Work sequence validation (demo before rebuild)
 * - Safety items verification
 * - Completeness scoring
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  VerificationResult,
  ScopeVerificationResult,
  ScopeItem,
  SequenceIssue,
  DamageType,
  VerificationError,
} from './types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ============================================================================
// Standard Scope Items by Damage Type
// ============================================================================

const STANDARD_ITEMS_BY_DAMAGE_TYPE: Record<DamageType, string[]> = {
  water: [
    'Emergency water extraction',
    'Moisture mapping and documentation',
    'Drying equipment setup',
    'Daily moisture readings',
    'Antimicrobial treatment',
    'Affected material removal',
    'Dehumidification',
    'Air quality testing (if required)',
    'Final clearance inspection',
  ],
  fire: [
    'Emergency board-up',
    'Debris removal',
    'Smoke and soot cleaning',
    'Ozone treatment',
    'HVAC cleaning',
    'Contents pack-out (if required)',
    'Air quality testing',
    'Structural assessment',
    'Final clearance inspection',
  ],
  mould: [
    'Mould assessment and testing',
    'Containment setup',
    'HEPA air scrubbers',
    'Affected material removal',
    'HEPA vacuuming',
    'Antimicrobial treatment',
    'Clearance air testing',
    'Containment removal',
    'Final inspection',
  ],
  structural: [
    'Structural engineering assessment',
    'Temporary shoring (if required)',
    'Demolition of affected areas',
    'Debris removal',
    'Structural repairs',
    'Building certification',
    'Final inspection',
  ],
  biohazard: [
    'Hazard assessment',
    'PPE and containment setup',
    'Biohazard material removal',
    'Disinfection and sanitization',
    'ATP testing',
    'Waste disposal certification',
    'Clearance testing',
    'Final inspection',
  ],
  storm: [
    'Emergency tarping',
    'Water extraction (if flooded)',
    'Debris removal',
    'Drying (if required)',
    'Roof repairs',
    'Window/door repairs',
    'Structural assessment',
    'Final inspection',
  ],
  unknown: [
    'Site assessment',
    'Damage documentation',
    'Scope development',
    'Final inspection',
  ],
  none: [],
};

// ============================================================================
// Safety Items (Required based on property age/type)
// ============================================================================

const SAFETY_ITEMS = {
  asbestos: {
    description: 'Asbestos testing and clearance',
    required_when: 'Property built before 1990',
    category: 'safety',
  },
  lead_paint: {
    description: 'Lead paint testing',
    required_when: 'Property built before 1970',
    category: 'safety',
  },
  electrical: {
    description: 'Electrical inspection and isolation',
    required_when: 'Water or fire damage affecting electrical',
    category: 'safety',
  },
  structural_engineer: {
    description: 'Structural engineering assessment',
    required_when: 'Any structural damage or fire damage',
    category: 'safety',
  },
  air_quality: {
    description: 'Air quality testing',
    required_when: 'Mould, fire, or biohazard damage',
    category: 'safety',
  },
};

// ============================================================================
// Work Sequence Rules
// ============================================================================

const SEQUENCE_RULES = [
  { before: 'Demolition', after: 'Rebuild', reason: 'Cannot rebuild before demolition is complete' },
  { before: 'Water extraction', after: 'Drying', reason: 'Standing water must be extracted before drying' },
  { before: 'Containment setup', after: 'Material removal', reason: 'Containment required before removing mould-affected materials' },
  { before: 'Asbestos testing', after: 'Demolition', reason: 'Asbestos must be tested before any demolition in pre-1990 buildings' },
  { before: 'Moisture mapping', after: 'Final clearance', reason: 'Initial moisture mapping must precede clearance' },
  { before: 'Structural assessment', after: 'Structural repairs', reason: 'Assessment required before repairs' },
  { before: 'HEPA air scrubbers', after: 'Clearance air testing', reason: 'Air scrubbing must occur before clearance testing' },
  { before: 'Antimicrobial treatment', after: 'Drying equipment removal', reason: 'Treatment should complete before drying equipment is removed' },
];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Extract scope items from text
 */
async function extractScopeItems(scopeText: string): Promise<ScopeItem[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `Extract individual scope items from this scope of work document.

SCOPE DOCUMENT:
${scopeText}

Respond with JSON array only (no markdown):
[
  {
    "id": "item_1",
    "description": "Item description",
    "category": "Category (e.g., demolition, drying, cleaning, rebuild, safety)",
    "area": "Area of property (if specified)"
  }
]

Extract each line item. Combine duplicates. Standardize descriptions.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
return [];
}

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Find duplicate items using AI similarity detection
 */
async function findDuplicates(items: ScopeItem[]): Promise<ScopeItem[]> {
  if (items.length < 2) {
return [];
}

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Identify duplicate or very similar scope items in this list.

ITEMS:
${JSON.stringify(items, null, 2)}

Respond with JSON array of DUPLICATE items only (no markdown):
[
  {
    "id": "item_id",
    "description": "Description",
    "category": "Category",
    "duplicate_of": "ID of the item this duplicates"
  }
]

Consider items duplicates if:
- They describe the same work in different words
- One is a subset of another
- They would be billed as the same line item`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
return [];
}

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

/**
 * Find missing standard items based on damage type
 */
function findMissingStandardItems(
  items: ScopeItem[],
  damageType: DamageType
): ScopeItem[] {
  const standardItems = STANDARD_ITEMS_BY_DAMAGE_TYPE[damageType] || [];
  const missing: ScopeItem[] = [];

  const itemDescriptions = items.map((i) => i.description.toLowerCase());

  for (let i = 0; i < standardItems.length; i++) {
    const standard = standardItems[i];
    const standardLower = standard.toLowerCase();

    // Check if any item matches this standard item
    const found = itemDescriptions.some((desc) => {
      // Check for keyword matches
      const keywords = standardLower.split(/\s+/).filter((w) => w.length > 3);
      const matches = keywords.filter((kw) => desc.includes(kw));
      return matches.length >= Math.ceil(keywords.length * 0.5);
    });

    if (!found) {
      missing.push({
        id: `missing_${i}`,
        description: standard,
        category: damageType,
      });
    }
  }

  return missing;
}

/**
 * Check for sequence issues
 */
function findSequenceIssues(items: ScopeItem[]): SequenceIssue[] {
  const issues: SequenceIssue[] = [];
  const itemDescriptions = items.map((i) => i.description.toLowerCase());

  for (const rule of SEQUENCE_RULES) {
    const beforeLower = rule.before.toLowerCase();
    const afterLower = rule.after.toLowerCase();

    // Find indices of before and after items
    const beforeIndex = itemDescriptions.findIndex((desc) =>
      desc.includes(beforeLower) || beforeLower.split(' ').every((w) => desc.includes(w))
    );
    const afterIndex = itemDescriptions.findIndex((desc) =>
      desc.includes(afterLower) || afterLower.split(' ').every((w) => desc.includes(w))
    );

    // If both exist and after comes before in the list
    if (beforeIndex !== -1 && afterIndex !== -1 && afterIndex < beforeIndex) {
      issues.push({
        item_a: items[afterIndex].description,
        item_b: items[beforeIndex].description,
        reason: rule.reason,
        correct_order: 'b_before_a',
      });
    }
  }

  return issues;
}

/**
 * Check for required safety items
 */
function checkSafetyItems(
  items: ScopeItem[],
  damageType: DamageType,
  propertyAge?: number
): { present: boolean; missing: string[] } {
  const itemDescriptions = items.map((i) => i.description.toLowerCase());
  const missing: string[] = [];

  // Check asbestos for older properties
  if (propertyAge && propertyAge < 1990) {
    const hasAsbestos = itemDescriptions.some(
      (desc) => desc.includes('asbestos') || desc.includes('acm')
    );
    if (!hasAsbestos) {
      missing.push(SAFETY_ITEMS.asbestos.description);
    }
  }

  // Check lead paint for very old properties
  if (propertyAge && propertyAge < 1970) {
    const hasLead = itemDescriptions.some((desc) => desc.includes('lead'));
    if (!hasLead) {
      missing.push(SAFETY_ITEMS.lead_paint.description);
    }
  }

  // Check electrical for water/fire damage
  if (damageType === 'water' || damageType === 'fire') {
    const hasElectrical = itemDescriptions.some(
      (desc) => desc.includes('electrical') || desc.includes('isolat')
    );
    if (!hasElectrical) {
      missing.push(SAFETY_ITEMS.electrical.description);
    }
  }

  // Check structural engineer for structural/fire damage
  if (damageType === 'structural' || damageType === 'fire') {
    const hasStructural = itemDescriptions.some(
      (desc) => desc.includes('structural') && (desc.includes('engineer') || desc.includes('assessment'))
    );
    if (!hasStructural) {
      missing.push(SAFETY_ITEMS.structural_engineer.description);
    }
  }

  // Check air quality for mould/fire/biohazard
  if (damageType === 'mould' || damageType === 'fire' || damageType === 'biohazard') {
    const hasAirQuality = itemDescriptions.some(
      (desc) => desc.includes('air quality') || desc.includes('air test')
    );
    if (!hasAirQuality) {
      missing.push(SAFETY_ITEMS.air_quality.description);
    }
  }

  return {
    present: missing.length === 0,
    missing,
  };
}

/**
 * Calculate completeness score
 */
function calculateCompletenessScore(
  items: ScopeItem[],
  duplicates: ScopeItem[],
  missingItems: ScopeItem[],
  sequenceIssues: SequenceIssue[],
  missingSafetyItems: string[]
): number {
  if (items.length === 0) {
return 0;
}

  // Start with base score
  let score = 100;

  // Deductions for issues
  const duplicateRatio = duplicates.length / items.length;
  score -= duplicateRatio * 20; // Up to -20 for duplicates

  const missingRatio = missingItems.length / (items.length + missingItems.length);
  score -= missingRatio * 30; // Up to -30 for missing standard items

  score -= sequenceIssues.length * 10; // -10 per sequence issue

  score -= missingSafetyItems.length * 15; // -15 per missing safety item

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a scope of work document
 */
export async function validateScope(
  scopeText: string,
  context: {
    damage_type: DamageType;
    property_year_built?: number;
    strict_mode?: boolean;
  }
): Promise<VerificationResult<ScopeVerificationResult>> {
  const startTime = Date.now();
  const errors: VerificationError[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  try {
    // Step 1: Extract scope items
    const items = await extractScopeItems(scopeText);

    if (items.length === 0) {
      return {
        status: 'failed',
        passed: false,
        message: 'No scope items could be extracted from the document',
        errors: [
          {
            code: 'NO_SCOPE_ITEMS',
            message: 'The scope document appears to be empty or unreadable',
            severity: 'critical',
          },
        ],
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      };
    }

    // Step 2: Find duplicates
    const duplicates = await findDuplicates(items);

    // Step 3: Find missing standard items
    const missingItems = findMissingStandardItems(items, context.damage_type);

    // Step 4: Check work sequence
    const sequenceIssues = findSequenceIssues(items);

    // Step 5: Check safety items
    const safetyCheck = checkSafetyItems(
      items,
      context.damage_type,
      context.property_year_built
    );

    // Step 6: Calculate completeness score
    const completenessScore = calculateCompletenessScore(
      items,
      duplicates,
      missingItems,
      sequenceIssues,
      safetyCheck.missing
    );

    // Build errors and warnings
    if (duplicates.length > 0) {
      warnings.push(`Found ${duplicates.length} duplicate item(s)`);
      recommendations.push('Review and consolidate duplicate line items');
    }

    if (missingItems.length > 0) {
      warnings.push(`Missing ${missingItems.length} standard item(s) for ${context.damage_type} damage`);
      recommendations.push(`Consider adding: ${missingItems.map((i) => i.description).join(', ')}`);
    }

    if (sequenceIssues.length > 0) {
      errors.push({
        code: 'SEQUENCE_ERROR',
        message: `${sequenceIssues.length} work sequence issue(s) found`,
        severity: 'error',
      });
      for (const issue of sequenceIssues) {
        recommendations.push(`${issue.item_b} should come before ${issue.item_a}: ${issue.reason}`);
      }
    }

    if (!safetyCheck.present) {
      errors.push({
        code: 'MISSING_SAFETY_ITEMS',
        message: `Missing required safety item(s): ${safetyCheck.missing.join(', ')}`,
        severity: context.strict_mode ? 'critical' : 'error',
      });
      recommendations.push('Add required safety assessments before proceeding');
    }

    // Determine if valid
    const isValid =
      completenessScore >= 70 &&
      safetyCheck.present &&
      sequenceIssues.length === 0 &&
      (!context.strict_mode || duplicates.length === 0);

    const result: ScopeVerificationResult = {
      is_valid: isValid,
      completeness_score: completenessScore,
      duplicate_items: duplicates,
      missing_items: missingItems,
      sequence_issues: sequenceIssues,
      safety_items_present: safetyCheck.present,
      missing_safety_items: safetyCheck.missing,
      recommendations,
    };

    return {
      status: isValid ? 'passed' : errors.some((e) => e.severity === 'critical') ? 'failed' : 'warning',
      passed: isValid,
      message: isValid
        ? `Scope validated with ${completenessScore}% completeness`
        : `Scope requires review: ${completenessScore}% completeness`,
      data: result,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: recommendations.length > 0 ? recommendations : undefined,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Scope validation error:', error);
    return {
      status: 'failed',
      passed: false,
      message: 'Scope validation failed due to an internal error',
      errors: [
        {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'critical',
        },
      ],
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * Quick scope check (basic validation)
 */
export function quickCheckScope(scopeText: string): {
  has_content: boolean;
  line_count: number;
  has_safety_keywords: boolean;
} {
  const lines = scopeText.split('\n').filter((l) => l.trim().length > 0);
  const textLower = scopeText.toLowerCase();

  return {
    has_content: lines.length > 0,
    line_count: lines.length,
    has_safety_keywords:
      textLower.includes('safety') ||
      textLower.includes('asbestos') ||
      textLower.includes('electrical') ||
      textLower.includes('ppe'),
  };
}

export default {
  validateScope,
  quickCheckScope,
};
