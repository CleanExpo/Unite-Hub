/**
 * MCP Tool: Query Suburb Authority
 * Allows agents to query suburb_authority_substrate view for gap analysis
 */

import { z } from 'zod';
import type { SuburbaseService } from '../services/supabase.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('QuerySuburbAuthorityTool');

export const querySuburbAuthoritySchema = z.object({
  workspaceId: z.string().uuid().describe('Workspace ID to query data for'),
  minAuthorityScore: z.number().min(0).max(100).optional().describe('Minimum authority score filter'),
  maxAuthorityScore: z.number().min(0).max(100).optional().describe('Maximum authority score filter (use 50 for gaps only)'),
  state: z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']).optional().describe('Filter by Australian state'),
  limit: z.number().min(1).max(200).optional().describe('Max results to return (default 50)'),
});

export type QuerySuburbAuthorityInput = z.infer<typeof querySuburbAuthoritySchema>;

export function createQuerySuburbAuthorityTool(supabaseService: SuburbaseService) {
  return {
    name: 'query_suburb_authority',
    description:
      'Query the suburb_authority_substrate view to find market gaps and opportunities. ' +
      'Returns aggregated authority signals per suburb including jobs, photos, reviews, and authority scores. ' +
      'Use maxAuthorityScore < 50 to find geographic gaps (low authority = opportunity). ' +
      'Sort results by authority_score ascending to prioritize biggest gaps.',
    inputSchema: querySuburbAuthoritySchema,
    callback: async (input: QuerySuburbAuthorityInput) => {
      try {
        log.info('Querying suburb authority:', input);

        const data = await supabaseService.querySuburbAuthority({
          workspaceId: input.workspaceId,
          minAuthorityScore: input.minAuthorityScore,
          maxAuthorityScore: input.maxAuthorityScore ?? 50, // Default to gaps only
          state: input.state,
          limit: input.limit ?? 50,
        });

        log.info(`Found ${data.length} suburbs`);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        log.error('Failed to query suburb authority:', error);
        throw error;
      }
    }
  };
}
