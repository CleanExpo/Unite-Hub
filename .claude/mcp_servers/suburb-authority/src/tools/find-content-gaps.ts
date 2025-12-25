/**
 * MCP Tool: Find Content Gaps
 * Specialized tool for Scout Agent to identify missing proof points
 */

import { z } from 'zod';
import type { SuburbaseService } from '../services/supabase.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('FindContentGapsTool');

export const findContentGapsSchema = z.object({
  workspaceId: z.string().uuid().describe('Workspace ID'),
  state: z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']).optional().describe('Filter by Australian state'),
  limit: z.number().min(1).max(100).optional().describe('Max results (default 20)'),
});

export type FindContentGapsInput = z.infer<typeof findContentGapsSchema>;

export function createFindContentGapsTool(supabaseService: SuburbaseService) {
  return {
    name: 'find_content_gaps',
    description:
      'Find content gaps (suburbs with high content_gap_score indicating missing proof points). ' +
      'Returns suburbs where client has jobs but lacks testimonials, photos, or schema markup. ' +
      'Ideal for Scout Agent to identify content creation opportunities.',
    inputSchema: findContentGapsSchema,
    callback: async (input: FindContentGapsInput) => {
      try {
        log.info('Finding content gaps:', input);

        const gaps = await supabaseService.findContentGaps({
          workspaceId: input.workspaceId,
          state: input.state,
          limit: input.limit ?? 20,
        });

        log.info(`Found ${gaps.length} content gaps`);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(gaps, null, 2)
            }
          ]
        };
      } catch (error) {
        log.error('Failed to find content gaps:', error);
        throw error;
      }
    }
  };
}
