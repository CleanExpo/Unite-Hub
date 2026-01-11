/**
 * POST /api/guardian/ai/rule-suggestions/[id]/apply - Apply suggestion (create rule)
 */

import { NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSuggestion, updateSuggestionStatus, addSuggestionFeedback } from '@/lib/guardian/ai/ruleSuggestionOrchestrator';

export const POST = withErrorBoundary(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) throw new Error('workspaceId required');
  await validateUserAndWorkspace(req, workspaceId, { adminOnly: true });

  const suggestion = await getSuggestion(workspaceId, id);

  // Create the rule using the draft from the suggestion
  // This would normally call the existing rule creation service/API
  // For now, we'll simulate creating a rule and return the result
  const supabase = getSupabaseServer();

  try {
    // Insert the rule draft as a new rule
    // Note: This is simplified; you'd want to call the existing rule creation flow
    const { data: newRule, error } = await supabase
      .from('guardian_rules')
      .insert({
        workspace_id: workspaceId,
        name: suggestion.rule_draft.name,
        description: suggestion.rule_draft.description,
        type: suggestion.rule_draft.type || 'alert',
        config: suggestion.rule_draft.config || {},
        enabled: false, // Always draft, never auto-enable
        metadata: {
          source_suggestion_id: suggestion.id,
          created_from_suggestion: true,
        },
      })
      .select('id');

    if (error || !newRule || newRule.length === 0) {
      throw new Error('Failed to create rule from suggestion');
    }

    const ruleId = newRule[0].id;

    // Update suggestion to mark as applied
    await updateSuggestionStatus(workspaceId, id, 'applied', {
      appliedRuleId: ruleId,
    });

    // Record feedback
    await addSuggestionFeedback(workspaceId, id, {
      action: 'applied',
      actor: 'api-admin',
    });

    return successResponse({
      suggestionId: id,
      ruleId,
      status: 'applied',
      message: 'Rule created from suggestion (draft state). Review and enable in rule editor.',
    });
  } catch (error) {
    throw new Error(`Failed to apply suggestion: ${error instanceof Error ? error.message : String(error)}`);
  }
});
