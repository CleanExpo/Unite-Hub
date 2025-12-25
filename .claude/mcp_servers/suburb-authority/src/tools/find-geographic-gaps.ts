/**
 * MCP Tool: Find Geographic Gaps
 * Specialized tool for Scout Agent to identify suburb opportunities
 */

import { z } from 'zod';
import type { SuburbaseService } from '../services/supabase.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('FindGeographicGapsTool');

export const findGeographicGapsSchema = z.object({
  workspaceId: z.string().uuid().describe('Workspace ID'),
  state: z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']).optional().describe('Filter by Australian state'),
  limit: z.number().min(1).max(100).optional().describe('Max results (default 20)'),
});

export type FindGeographicGapsInput = z.infer<typeof findGeographicGapsSchema>;

export function createFindGeographicGapsTool(supabaseService: SuburbaseService) {
  return {
    name: 'find_geographic_gaps',
    description:
      'Find geographic market gaps (suburbs with low client authority) for opportunity identification. ' +
      'Returns suburbs sorted by gap severity (100 - authority_score). ' +
      'Ideal for Scout Agent to identify where client should expand local presence.',
    inputSchema: findGeographicGapsSchema,
    callback: async (input: FindGeographicGapsInput) => {
      try {
        log.info('Finding geographic gaps:', input);

        const gaps = await supabaseService.findGeographicGaps({
          workspaceId: input.workspaceId,
          state: input.state,
          limit: input.limit ?? 20,
        });

        log.info(`Found ${gaps.length} geographic gaps`);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(gaps, null, 2)
            }
          ]
        };
      } catch (error) {
        log.error('Failed to find geographic gaps:', error);
        throw error;
      }
    }
  };
}
