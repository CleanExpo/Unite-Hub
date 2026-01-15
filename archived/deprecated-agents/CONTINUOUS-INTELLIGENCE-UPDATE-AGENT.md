# CONTINUOUS INTELLIGENCE UPDATE AGENT SPECIFICATION

**Agent Name**: Continuous Intelligence Update Agent
**Agent Type**: Tier 5 - Continuous Learning Agent
**Priority**: P2 - Important
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `client_emails` - Incoming emails (monitored)
- `media_files` - Uploaded media (monitored)
- `email_intelligence` - Intelligence data (read/write)
- `mindmap_nodes` - Mindmap visualization (read/write)
- `dynamic_questionnaires` - Questionnaires (read/write)
- `marketing_strategies` - Strategies (read/write)
- `contacts` - Contact profiles (read/write)

### Agent Purpose
Monitors new emails and media uploads in real-time, automatically triggers AI Intelligence Extraction Agent for new content, incrementally updates intelligence without re-analyzing old content, updates mindmaps with new nodes and connections, and refreshes strategies when significant new intelligence is discovered.

---

## 2. PURPOSE & SCOPE

### What This Agent Does
1. **Real-time Monitoring**: Watch for new emails and media uploads (every 5 minutes)
2. **Automatic Analysis**: Trigger AI Intelligence Extraction Agent for new content
3. **Incremental Updates**: Merge new intelligence with existing data (no re-analysis)
4. **Mindmap Sync**: Add new nodes and connections to mindmaps
5. **Strategy Refresh**: Update strategies when decision readiness changes significantly
6. **Gap Closure Detection**: Detect when knowledge gaps are filled by new information

### What This Agent Does NOT Do
- Does NOT manually fetch emails (handled by Email Integration Agent)
- Does NOT transcribe media (handled by Media Transcription Agent)
- Does NOT generate new strategies from scratch (handled by Marketing Strategy Generator Agent)
- Does NOT send notifications (can be added in Phase 2)

---

## 3. DATABASE SCHEMA MAPPING

### Monitored Tables

**client_emails** (NEW content trigger):
```sql
CREATE TABLE client_emails (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  contact_id UUID,
  from_email TEXT,
  subject TEXT,
  body_text TEXT,
  received_at TIMESTAMPTZ,
  intelligence_analyzed BOOLEAN DEFAULT false, -- NEW COLUMN NEEDED
  analyzed_at TIMESTAMPTZ
);
```

**media_files** (NEW content trigger):
```sql
CREATE TABLE media_files (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  contact_id UUID,
  file_type TEXT,
  transcript JSONB,
  ai_analysis JSONB,
  status TEXT,
  intelligence_analyzed BOOLEAN DEFAULT false, -- NEW COLUMN NEEDED
  analyzed_at TIMESTAMPTZ
);
```

**TypeScript Interfaces**:
```typescript
interface MonitoredEmail {
  id: string;
  workspace_id: string;
  contact_id: string;
  from_email: string;
  subject?: string;
  body_text?: string;
  received_at: Date;
  intelligence_analyzed: boolean;
  analyzed_at?: Date;
}

interface MonitoredMedia {
  id: string;
  workspace_id: string;
  contact_id: string;
  file_type: string;
  transcript?: Record<string, any>;
  ai_analysis?: Record<string, any>;
  status: string;
  intelligence_analyzed: boolean;
  analyzed_at?: Date;
}
```

---

## 4. CORE FUNCTIONS

### 4.1 monitorNewContent()
**Purpose**: Continuously monitor for new emails and media.

**Input**:
```typescript
interface MonitorNewContentRequest {
  workspace_id?: string; // If omitted, monitor all workspaces
  lookback_minutes?: number; // Default: 5
}
```

**Output**:
```typescript
interface MonitorNewContentResult {
  success: boolean;
  new_emails: number;
  new_media: number;
  intelligence_updated: number;
  contacts_affected: string[];
}
```

**Business Logic**:
1. **Fetch unanalyzed emails** (last 5 minutes):
   ```typescript
   const cutoffTime = new Date(Date.now() - lookback_minutes * 60 * 1000);

   let emailQuery = supabase
     .from('client_emails')
     .select('*')
     .eq('intelligence_analyzed', false)
     .gte('received_at', cutoffTime.toISOString());

   if (workspace_id) {
     emailQuery = emailQuery.eq('workspace_id', workspace_id);
   }

   const { data: newEmails } = await emailQuery;
   ```

2. **Fetch unanalyzed media** (transcribed but not analyzed):
   ```typescript
   let mediaQuery = supabase
     .from('media_files')
     .select('*')
     .eq('intelligence_analyzed', false)
     .eq('status', 'completed') // Must be transcribed first
     .gte('created_at', cutoffTime.toISOString());

   if (workspace_id) {
     mediaQuery = mediaQuery.eq('workspace_id', workspace_id);
   }

   const { data: newMedia } = await mediaQuery;
   ```

3. **Process each new email**:
   ```typescript
   const intelligenceUpdates: string[] = [];

   for (const email of newEmails) {
     try {
       // Call AI Intelligence Extraction Agent
       const intelligence = await fetch('/api/intelligence/analyze', {
         method: 'POST',
         body: JSON.stringify({
           email_id: email.id,
           contact_id: email.contact_id,
           workspace_id: email.workspace_id,
         }),
       }).then(r => r.json());

       // Merge with existing intelligence
       await mergeIntelligence(email.contact_id, intelligence);

       // Mark as analyzed
       await supabase
         .from('client_emails')
         .update({
           intelligence_analyzed: true,
           analyzed_at: new Date(),
         })
         .eq('id', email.id);

       intelligenceUpdates.push(email.contact_id);
     } catch (error) {
       console.error(`Failed to analyze email ${email.id}:`, error);
     }
   }
   ```

4. **Process each new media**:
   ```typescript
   for (const media of newMedia) {
     try {
       // Extract AI analysis from transcript
       const intelligence = await fetch('/api/intelligence/analyze', {
         method: 'POST',
         body: JSON.stringify({
           media_id: media.id,
           contact_id: media.contact_id,
           workspace_id: media.workspace_id,
         }),
       }).then(r => r.json());

       // Merge with existing intelligence
       await mergeIntelligence(media.contact_id, intelligence);

       // Mark as analyzed
       await supabase
         .from('media_files')
         .update({
           intelligence_analyzed: true,
           analyzed_at: new Date(),
         })
         .eq('id', media.id);

       intelligenceUpdates.push(media.contact_id);
     } catch (error) {
       console.error(`Failed to analyze media ${media.id}:`, error);
     }
   }
   ```

5. **Return summary**:
   ```typescript
   return {
     success: true,
     new_emails: newEmails.length,
     new_media: newMedia.length,
     intelligence_updated: new Set(intelligenceUpdates).size,
     contacts_affected: Array.from(new Set(intelligenceUpdates)),
   };
   ```

**Performance**: < 10 seconds per batch (5 emails + 2 media)

---

### 4.2 mergeIntelligence()
**Purpose**: Incrementally merge new intelligence with existing data.

**Input**:
```typescript
interface MergeIntelligenceRequest {
  contact_id: string;
  new_intelligence: EmailIntelligence;
}
```

**Output**:
```typescript
interface MergeIntelligenceResult {
  success: boolean;
  new_ideas_added: number;
  new_goals_added: number;
  new_pain_points_added: number;
  duplicates_avoided: number;
  decision_readiness_change: number; // -10 to +10
}
```

**Business Logic**:
1. **Fetch existing intelligence**:
   ```typescript
   const { data: existing } = await supabase
     .from('email_intelligence')
     .select('*')
     .eq('contact_id', contact_id)
     .order('analyzed_at', { ascending: false });
   ```

2. **De-duplicate ideas** (text similarity > 80%):
   ```typescript
   const newIdeas = new_intelligence.ideas.filter(newIdea => {
     return !existing.some(intel =>
       intel.ideas.some(existingIdea =>
         calculateSimilarity(newIdea.text, existingIdea.text) > 0.8
       )
     );
   });
   ```

3. **De-duplicate goals, pain points, requirements**:
   ```typescript
   const newGoals = deduplicateArray(new_intelligence.business_goals, existing.flatMap(e => e.business_goals));
   const newPainPoints = deduplicateArray(new_intelligence.pain_points, existing.flatMap(e => e.pain_points));
   const newRequirements = deduplicateArray(new_intelligence.requirements, existing.flatMap(e => e.requirements));
   ```

4. **Calculate decision readiness change**:
   ```typescript
   const avgOldReadiness = existing.length > 0
     ? existing.reduce((sum, e) => sum + e.decision_readiness, 0) / existing.length
     : 5;

   const decisionReadinessChange = new_intelligence.decision_readiness - avgOldReadiness;
   ```

5. **Trigger downstream updates** if significant change:
   ```typescript
   if (Math.abs(decisionReadinessChange) >= 2) {
     // Update mindmap
     await fetch('/api/mindmap/update', {
       method: 'POST',
       body: JSON.stringify({ contact_id, new_intelligence }),
     });

     // Update strategy if decision readiness crossed threshold (< 7 → >= 7)
     if (avgOldReadiness < 7 && new_intelligence.decision_readiness >= 7) {
       await fetch('/api/strategies/refresh', {
         method: 'POST',
         body: JSON.stringify({ contact_id }),
       });
     }
   }
   ```

6. **Update contact AI score**:
   ```typescript
   const newScore = calculateCompositeScore({
     ...existing,
     ...new_intelligence,
   });

   await supabase
     .from('contacts')
     .update({ ai_score: newScore })
     .eq('id', contact_id);
   ```

7. **Return merge summary**:
   ```typescript
   return {
     success: true,
     new_ideas_added: newIdeas.length,
     new_goals_added: newGoals.length,
     new_pain_points_added: newPainPoints.length,
     duplicates_avoided: (new_intelligence.ideas.length - newIdeas.length),
     decision_readiness_change: decisionReadinessChange,
   };
   ```

**Performance**: < 2 seconds

---

### 4.3 updateMindmap()
**Purpose**: Add new intelligence to existing mindmap.

**Input**:
```typescript
interface UpdateMindmapRequest {
  contact_id: string;
  new_intelligence: EmailIntelligence;
}
```

**Output**:
```typescript
interface UpdateMindmapResult {
  success: boolean;
  nodes_added: number;
  connections_added: number;
}
```

**Business Logic**:
1. **Fetch existing mindmap**:
   ```typescript
   const { data: mindmap } = await supabase
     .from('project_mindmaps')
     .select('*, mindmap_nodes(*), mindmap_connections(*)')
     .eq('contact_id', contact_id)
     .single();
   ```

2. **Create nodes for new ideas**:
   ```typescript
   const newNodes: MindmapNode[] = [];

   // Add new ideas
   new_intelligence.ideas.forEach(idea => {
     newNodes.push({
       mindmap_id: mindmap.id,
       parent_id: findBranchId(mindmap, 'Ideas'),
       node_type: 'idea',
       label: idea.text,
       priority: idea.priority === 'high' ? 8 : idea.priority === 'medium' ? 5 : 3,
       metadata: { category: idea.category, source_quote: idea.source_quote },
       ai_generated: true,
     });
   });

   // Add new goals
   new_intelligence.business_goals.forEach(goal => {
     newNodes.push({
       mindmap_id: mindmap.id,
       parent_id: findBranchId(mindmap, 'Goals'),
       node_type: 'requirement',
       label: goal.text,
       priority: 9,
       metadata: { source_quote: goal.source_quote },
       ai_generated: true,
     });
   });

   // Add new pain points
   new_intelligence.pain_points.forEach(pain => {
     newNodes.push({
       mindmap_id: mindmap.id,
       parent_id: findBranchId(mindmap, 'Pain Points'),
       node_type: 'requirement',
       label: pain.text,
       priority: 7,
       metadata: { severity: pain.severity, source_quote: pain.source_quote },
       ai_generated: true,
     });
   });
   ```

3. **Recalculate node positions** (radial layout):
   ```typescript
   const updatedNodes = [...mindmap.mindmap_nodes, ...newNodes];
   calculateRadialLayout(updatedNodes, mindmap.center_node);
   ```

4. **Identify new connections**:
   ```typescript
   const newConnections = identifyConnections(newNodes, updatedNodes);
   ```

5. **Insert nodes and connections**:
   ```typescript
   await supabase.from('mindmap_nodes').insert(newNodes);
   await supabase.from('mindmap_connections').insert(newConnections);
   ```

6. **Return summary**:
   ```typescript
   return {
     success: true,
     nodes_added: newNodes.length,
     connections_added: newConnections.length,
   };
   ```

**Performance**: < 3 seconds

---

### 4.4 refreshStrategy()
**Purpose**: Update strategy when decision readiness crosses threshold.

**Input**:
```typescript
interface RefreshStrategyRequest {
  contact_id: string;
  trigger_reason?: string; // "decision_readiness_threshold" | "budget_discovered" | "manual"
}
```

**Output**:
```typescript
interface RefreshStrategyResult {
  success: boolean;
  strategy_updated: boolean;
  changes_made: string[];
}
```

**Business Logic**:
1. **Fetch active strategy**:
   ```typescript
   const { data: strategy } = await supabase
     .from('marketing_strategies')
     .select('*')
     .eq('contact_id', contact_id)
     .eq('status', 'active')
     .single();

   if (!strategy) {
     // No active strategy to refresh
     return { success: true, strategy_updated: false, changes_made: [] };
   }
   ```

2. **Fetch latest intelligence**:
   ```typescript
   const { data: latestIntel } = await supabase
     .from('email_intelligence')
     .select('*')
     .eq('contact_id', contact_id)
     .order('analyzed_at', { ascending: false })
     .limit(1)
     .single();
   ```

3. **Determine what to update**:
   ```typescript
   const changesToMake: string[] = [];

   // If decision readiness crossed threshold (< 7 → >= 7)
   if (latestIntel.decision_readiness >= 7) {
     changesToMake.push('Add conversion-focused content pillar');
     changesToMake.push('Increase urgency in messaging');
   }

   // If budget discovered
   if (trigger_reason === 'budget_discovered') {
     changesToMake.push('Update budget allocation section');
     changesToMake.push('Adjust campaign tactics based on budget');
   }

   // If new goals discovered
   const newGoals = latestIntel.business_goals.filter(g =>
     !strategy.strategy_document.objectives.some(obj => obj.includes(g.text))
   );
   if (newGoals.length > 0) {
     changesToMake.push('Add new objectives to strategy');
   }
   ```

4. **Call Marketing Strategy Generator Agent** (update mode):
   ```typescript
   if (changesToMake.length > 0) {
     await fetch('/api/strategies/update', {
       method: 'PUT',
       body: JSON.stringify({
         strategy_id: strategy.id,
         new_intelligence: latestIntel,
       }),
     });

     return {
       success: true,
       strategy_updated: true,
       changes_made: changesToMake,
     };
   }
   ```

5. **No changes needed**:
   ```typescript
   return {
     success: true,
     strategy_updated: false,
     changes_made: [],
   };
   ```

**Performance**: < 15 seconds (if strategy update needed)

---

### 4.5 detectGapClosure()
**Purpose**: Detect when knowledge gaps are filled by new intelligence.

**Input**:
```typescript
interface DetectGapClosureRequest {
  contact_id: string;
  new_intelligence: EmailIntelligence;
}
```

**Output**:
```typescript
interface DetectGapClosureResult {
  success: boolean;
  gaps_closed: Gap[];
  remaining_gaps: Gap[];
}
```

**Business Logic**:
1. **Fetch active gaps**:
   ```typescript
   const { data: gaps } = await supabase
     .from('knowledge_graph_nodes')
     .select('*')
     .eq('contact_id', contact_id)
     .eq('node_type', 'question')
     .eq('status', 'open'); // Assuming status field exists
   ```

2. **Check if new intelligence fills gaps**:
   ```typescript
   const gapsClosed: Gap[] = [];

   gaps.forEach(gap => {
     // Budget gap
     if (gap.label.includes('budget') || gap.label.includes('Budget')) {
       const budgetMentioned = new_intelligence.requirements.some(r =>
         r.text.toLowerCase().includes('budget') || r.text.includes('$')
       );
       if (budgetMentioned) {
         gapsClosed.push(gap);
       }
     }

     // Timeline gap
     if (gap.label.includes('timeline') || gap.label.includes('Timeline')) {
       const timelineMentioned = new_intelligence.requirements.some(r =>
         r.text.toLowerCase().includes('timeline') ||
         r.text.match(/Q[1-4]|month|week|deadline/i)
       );
       if (timelineMentioned) {
         gapsClosed.push(gap);
       }
     }

     // Target audience gap
     if (gap.label.includes('audience') || gap.label.includes('Audience')) {
       const audienceMentioned = new_intelligence.business_goals.some(g =>
         g.text.toLowerCase().includes('audience') ||
         g.text.toLowerCase().includes('demographic')
       );
       if (audienceMentioned) {
         gapsClosed.push(gap);
       }
     }
   });
   ```

3. **Mark gaps as closed**:
   ```typescript
   if (gapsClosed.length > 0) {
     await supabase
       .from('knowledge_graph_nodes')
       .update({ status: 'closed', closed_at: new Date() })
       .in('id', gapsClosed.map(g => g.id));
   }
   ```

4. **Trigger questionnaire update** (remove answered questions):
   ```typescript
   if (gapsClosed.length > 0) {
     await fetch('/api/questionnaires/update', {
       method: 'POST',
       body: JSON.stringify({
         contact_id,
         gaps_closed: gapsClosed.map(g => g.label),
       }),
     });
   }
   ```

5. **Return summary**:
   ```typescript
   return {
     success: true,
     gaps_closed: gapsClosed,
     remaining_gaps: gaps.filter(g => !gapsClosed.includes(g)),
   };
   ```

**Performance**: < 1 second

---

## 5. API ENDPOINTS

### POST /api/intelligence/monitor
**Request**:
```json
{
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "lookback_minutes": 5
}
```

**Response**:
```json
{
  "success": true,
  "new_emails": 3,
  "new_media": 1,
  "intelligence_updated": 2,
  "contacts_affected": [
    "660e8400-e29b-41d4-a716-446655440000",
    "770e8400-e29b-41d4-a716-446655440001"
  ]
}
```

### POST /api/intelligence/merge
**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "new_intelligence": {
    "ideas": [...],
    "business_goals": [...],
    "decision_readiness": 8
  }
}
```

**Response**:
```json
{
  "success": true,
  "new_ideas_added": 2,
  "new_goals_added": 1,
  "new_pain_points_added": 0,
  "duplicates_avoided": 3,
  "decision_readiness_change": 2
}
```

### POST /api/mindmap/update
**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "new_intelligence": { ... }
}
```

**Response**:
```json
{
  "success": true,
  "nodes_added": 5,
  "connections_added": 3
}
```

---

## 6. BUSINESS RULES

### Monitoring Frequency
- **Email Monitoring**: Every 5 minutes (cron: `*/5 * * * *`)
- **Media Monitoring**: Every 10 minutes (cron: `*/10 * * * *`)
- **Strategy Refresh**: Only when decision readiness changes ≥ 2 points

### De-duplication Rules
- **Text Similarity Threshold**: 80% (using Levenshtein distance or cosine similarity)
- **Same Source**: If same email/media, skip (prevent double-counting)
- **Time Window**: Consider content from last 90 days for similarity check

### Trigger Thresholds
- **Decision Readiness Change**: ± 2 points → Update mindmap
- **Decision Readiness Threshold**: < 7 → ≥ 7 → Refresh strategy
- **New Goals**: ≥ 2 new goals → Refresh strategy
- **Budget Discovered**: Always → Refresh strategy

---

## 7. PERFORMANCE REQUIREMENTS

### Response Times
- **Monitor Batch**: < 10 seconds (5 emails + 2 media)
- **Merge Intelligence**: < 2 seconds
- **Update Mindmap**: < 3 seconds
- **Refresh Strategy**: < 15 seconds
- **Detect Gap Closure**: < 1 second

### Throughput
- **Emails Processed**: 100 per 5-minute interval
- **Media Processed**: 20 per 10-minute interval

---

## 8. TESTING STRATEGY

### Unit Tests
```typescript
describe('Continuous Intelligence Update Agent', () => {
  describe('mergeIntelligence()', () => {
    it('should avoid duplicate ideas', async () => {
      const existing = [{ ideas: [{ text: 'Increase brand awareness by 50%' }] }];
      const newIntel = { ideas: [{ text: 'Boost brand awareness by 50%' }] };

      const result = await mergeIntelligence({ contact_id, new_intelligence: newIntel });
      expect(result.duplicates_avoided).toBe(1);
      expect(result.new_ideas_added).toBe(0);
    });
  });

  describe('detectGapClosure()', () => {
    it('should detect when budget gap is filled', async () => {
      const gaps = [{ label: 'Budget not discussed' }];
      const newIntel = { requirements: [{ text: 'Budget: $50,000' }] };

      const result = await detectGapClosure({ contact_id, new_intelligence: newIntel });
      expect(result.gaps_closed).toHaveLength(1);
    });
  });
});
```

---

## 9. ERROR CODES

| Code | Description |
|------|-------------|
| CONT_UPD_001 | No new content to process |
| CONT_UPD_002 | Intelligence merge failed |
| CONT_UPD_003 | Mindmap update failed |
| CONT_UPD_004 | Strategy refresh failed |
| CONT_UPD_005 | Gap closure detection failed |

---

## 10. AUSTRALIAN COMPLIANCE

### Monitoring Hours
- **Active Monitoring**: 6am-10pm AEST (business hours + evening)
- **Reduced Monitoring**: 10pm-6am AEST (every 30 minutes instead of 5)

---

## 11. FUTURE ENHANCEMENTS

### Phase 2
1. **Real-time Webhooks**: Replace polling with Gmail push notifications
2. **User Notifications**: Alert users when significant intelligence is discovered
3. **Auto-Questionnaire Updates**: Remove questions when gaps are filled
4. **Intelligence Confidence Scoring**: Track confidence over time as more data arrives

### Phase 3
1. **Predictive Intelligence**: Use ML to predict next likely client questions/concerns
2. **Sentiment Trend Analysis**: Track sentiment changes over time
3. **Multi-Contact Intelligence Linking**: Connect related contacts (same company)
4. **Auto-Strategy Versioning**: Create strategy versions as intelligence evolves

---

**END OF CONTINUOUS INTELLIGENCE UPDATE AGENT SPECIFICATION**
