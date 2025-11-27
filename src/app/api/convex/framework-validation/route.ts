/**
 * API Route: /api/convex/framework-validation
 *
 * Provides real-time framework validation:
 * - Validate framework structure
 * - Check component integrity
 * - Analyze performance patterns
 * - Suggest improvements
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';
import { validateFramework } from '@/lib/convex/framework-builder';

interface ValidationRequest {
  workspaceId: string;
  components?: any[];
  rules?: any[];
  reasoning_patterns?: any[];
  frameworkId?: string;
  action: 'validate' | 'analyze' | 'suggest';
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
  }>;
  score: number;
  analysis?: {
    completeness: number;
    consistency: number;
    complexity: number;
    reusability: number;
  };
  suggestions?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const body = (await req.json()) as ValidationRequest;
    const { workspaceId, components, rules, reasoning_patterns, frameworkId, action } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    let result: ValidationResult;

    if (action === 'validate') {
      // Validate framework structure
      if (!components) {
        return NextResponse.json(
          { error: 'Missing components for validation' },
          { status: 400 }
        );
      }

      const validation = validateFramework({
        components,
        rules,
        reasoning_patterns,
      });

      result = {
        valid: validation.valid,
        errors: validation.errors,
        score: calculateValidationScore(validation.errors),
      };
    } else if (action === 'analyze') {
      // Analyze framework quality
      if (!frameworkId) {
        return NextResponse.json(
          { error: 'Missing frameworkId for analysis' },
          { status: 400 }
        );
      }

      const { data: framework, error: frameworkError } = await supabase
        .from('convex_custom_frameworks')
        .select('*')
        .eq('id', frameworkId)
        .eq('workspace_id', workspaceId)
        .single();

      if (frameworkError || !framework) {
        return NextResponse.json(
          { error: 'Framework not found' },
          { status: 404 }
        );
      }

      const analysis = analyzeFramework(framework);
      result = {
        valid: true,
        errors: [],
        score: (analysis.completeness + analysis.consistency + analysis.complexity + analysis.reusability) / 4,
        analysis,
      };
    } else if (action === 'suggest') {
      // Generate improvement suggestions
      if (!frameworkId && !components) {
        return NextResponse.json(
          { error: 'Missing frameworkId or components for suggestions' },
          { status: 400 }
        );
      }

      let framework: any = null;

      if (frameworkId) {
        const { data: fw, error: fwError } = await supabase
          .from('convex_custom_frameworks')
          .select('*')
          .eq('id', frameworkId)
          .eq('workspace_id', workspaceId)
          .single();

        if (!fwError && fw) {
          framework = fw;
        }
      }

      const suggestions = generateSuggestions(framework || { components });
      result = {
        valid: true,
        errors: [],
        score: 75,
        suggestions,
      };
    } else {
      return NextResponse.json(
        { error: 'Unknown action' },
        { status: 400 }
      );
    }

    logger.info(`[VALIDATION] Framework validation completed: ${action}`);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('[VALIDATION] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateValidationScore(errors: any[]): number {
  let score = 100;

  errors.forEach((error) => {
    if (error.severity === 'error') {
      score -= 20;
    } else if (error.severity === 'warning') {
      score -= 10;
    } else if (error.severity === 'info') {
      score -= 5;
    }
  });

  return Math.max(0, score);
}

function analyzeFramework(framework: any): {
  completeness: number;
  consistency: number;
  complexity: number;
  reusability: number;
} {
  const components = framework.components || [];
  const rules = framework.rules || [];
  const patterns = framework.reasoning_patterns || [];

  // Calculate completeness (0-100)
  // Based on having components, rules, and patterns
  const hasComponents = components.length > 0 ? 33 : 0;
  const hasRules = rules.length > 0 ? 33 : 0;
  const hasPatterns = patterns.length > 0 ? 34 : 0;
  const completeness = hasComponents + hasRules + hasPatterns;

  // Calculate consistency (0-100)
  // Based on whether all components follow similar structure
  let consistency = 80;
  if (components.length > 0) {
    const hasAllRequired = components.every(
      (c: any) => c.name && c.description && c.type
    );
    if (!hasAllRequired) consistency -= 20;
  }

  // Calculate complexity (0-100)
  // Based on number of components and rules
  const componentCount = components.length;
  const ruleCount = rules.length;
  const complexity = Math.min(100, 30 + (componentCount * 5) + (ruleCount * 3));

  // Calculate reusability (0-100)
  // Based on component modularity and clarity
  let reusability = 70;
  if (componentCount >= 5) reusability += 15;
  if (patterns.length > 0) reusability += 15;
  reusability = Math.min(100, reusability);

  return {
    completeness,
    consistency,
    complexity,
    reusability,
  };
}

function generateSuggestions(framework: any): string[] {
  const suggestions: string[] = [];
  const components = framework.components || [];
  const rules = framework.rules || [];

  // Suggestion 1: Add more components
  if (components.length < 5) {
    suggestions.push(
      'Consider adding 5+ components for better framework coverage. Most effective frameworks have 8-12 components.'
    );
  }

  // Suggestion 2: Add business rules
  if (rules.length === 0) {
    suggestions.push(
      'Add business rules to define decision criteria and workflow logic. This improves framework clarity.'
    );
  }

  // Suggestion 3: Name consistency
  if (components.length > 0) {
    const withoutNames = components.filter((c: any) => !c.name || c.name.trim() === '').length;
    if (withoutNames > 0) {
      suggestions.push(
        `${withoutNames} component(s) missing names. Clear naming helps with team adoption.`
      );
    }
  }

  // Suggestion 4: Documentation
  const withoutDesc = components.filter((c: any) => !c.description || c.description.trim() === '').length;
  if (withoutDesc > 0) {
    suggestions.push(
      `${withoutDesc} component(s) missing descriptions. Documentation improves reusability.`
    );
  }

  // Suggestion 5: Type variety
  if (components.length > 0) {
    const types = new Set(components.map((c: any) => c.type));
    if (types.size === 1) {
      suggestions.push(
        'Framework uses only one component type. Mixing types (input, section, rule) creates richer frameworks.'
      );
    }
  }

  // Suggestion 6: Test patterns
  if (!framework.test_patterns || Object.keys(framework.test_patterns || {}).length === 0) {
    suggestions.push(
      'Define test patterns to measure framework effectiveness. Use metrics like conversion rate and engagement.'
    );
  }

  // Suggestion 7: Team usage
  if (!framework.team_feedback || framework.team_feedback.length === 0) {
    suggestions.push(
      'Share framework with team for feedback. Community input improves framework quality and adoption.'
    );
  }

  // Suggestion 8: Versioning
  if (!framework.versions || framework.versions.length < 2) {
    suggestions.push(
      'Create versions as you refine the framework. Version history helps track improvements over time.'
    );
  }

  return suggestions;
}
