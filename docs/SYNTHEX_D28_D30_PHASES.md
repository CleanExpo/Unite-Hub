# Synthex D28-D30 Phases Documentation

**Generated**: December 2025
**Status**: Complete
**Version**: 1.0.0

---

## Overview

D28-D30 represent the advanced intelligence and relationship management layers of the Synthex Autonomous Growth Stack:

| Phase | Name | Purpose |
|-------|------|---------|
| D28 | Multi-Brand Cross-Domain Intelligence | AI-powered cross-brand analytics and strategic recommendations |
| D29 | Attribution Memory Engine v2 | Contact-level attribution with event vectors and journey tracking |
| D30 | Unified Opportunity Graph | Graph-based relationship and opportunity tracking |

---

## D28: Multi-Brand Cross-Domain Intelligence Engine

### Purpose

Enable organizations with multiple brands to share insights, detect synergies, and coordinate cross-brand strategies while maintaining brand isolation.

### Database Schema

**Migration**: `457_synthex_multibrand_intel.sql`

**Tables**:

| Table | Purpose |
|-------|---------|
| `synthex_library_crossbrand_profiles` | Brand profiles with market positioning |
| `synthex_library_crossbrand_domains` | Domain verification and tracking |
| `synthex_library_crossbrand_insights` | AI-generated cross-brand insights |
| `synthex_library_crossbrand_synergies` | Brand synergy calculations |
| `synthex_library_crossbrand_campaigns` | Cross-brand campaign coordination |
| `synthex_library_crossbrand_metrics` | Aggregated brand metrics |

**Enums**:
- `synthex_crossbrand_market_segment`: b2b, b2c, b2b2c, d2c, enterprise, smb, mixed
- `synthex_crossbrand_tone`: professional, casual, luxury, playful, technical, warm, bold
- `synthex_crossbrand_position`: premium, value, niche, mass_market, disruptor, legacy
- `synthex_crossbrand_insight_type`: synergy, conflict, opportunity, threat, trend, recommendation

### Service Layer

**File**: `src/lib/synthex/crossBrandIntelService.ts`

**Key Functions**:

```typescript
// Profile Management
createCrossBrandProfile(tenantId, data, userId)
updateCrossBrandProfile(profileId, updates)
listCrossBrandProfiles(tenantId, filters)
getCrossBrandProfile(profileId)

// Domain Management
addDomain(tenantId, crossbrandId, domain)
verifyDomain(domainId)
listDomains(tenantId, crossbrandId)

// AI Insights
generateCrossBrandInsight(tenantId, options)
listCrossBrandInsights(tenantId, filters)

// Synergy Analysis
calculateSynergy(tenantId, brandAId, brandBId)
listSynergies(tenantId, filters)

// Campaigns
createCrossBrandCampaign(tenantId, data, userId)
listCrossBrandCampaigns(tenantId, filters)
recordCampaignPerformance(campaignId, data)

// Metrics & Health
getPortfolioHealth(tenantId)
getCrossBrandStats(tenantId)
```

### API Endpoints

**Route**: `/api/synthex/crossbrand-intel`

**GET Types**:
- `stats` - Portfolio-wide statistics
- `profiles` - List brand profiles
- `profile` - Single profile by ID
- `domains` - List domains for a brand
- `insights` - AI-generated insights
- `synergies` - Brand synergy calculations
- `campaigns` - Cross-brand campaigns
- `metrics` - Brand metrics
- `portfolio_health` - Overall portfolio health

**POST Actions**:
- `create_profile` - Create new brand profile
- `update_profile` - Update existing profile
- `add_domain` - Add domain to brand
- `verify_domain` - Mark domain as verified
- `generate_insight` - Generate AI insight
- `calculate_synergy` - Calculate synergy between brands
- `create_campaign` - Create cross-brand campaign
- `record_campaign_performance` - Record performance data
- `record_metrics` - Record brand metrics

### Dashboard

**Route**: `/synthex/crossbrand-intel`

**Features**:
- Overview with portfolio stats
- Brand profiles grid with synergy scores
- AI insights with recommendations
- Synergy matrix visualization
- Campaign management

---

## D29: Attribution Memory Engine v2

### Purpose

Provide granular contact-level attribution tracking with event vectors, channel bias detection, journey reconstruction, and AI-powered insights.

### Database Schema

**Migration**: `458_synthex_attribution_memory_v2.sql`

**Tables**:

| Table | Purpose |
|-------|---------|
| `synthex_library_attribution_contacts` | Contact attribution profiles |
| `synthex_library_attribution_events` | Individual touchpoint events |
| `synthex_library_attribution_journeys` | Customer journey tracking |
| `synthex_library_attribution_models` | Attribution model configurations |
| `synthex_library_channel_performance` | Channel-level metrics |
| `synthex_library_attribution_insights` | AI-generated attribution insights |

**Enums**:
- `synthex_attribution_event_type`: impression, click, visit, form_submit, signup, purchase, referral, share, review, support, renewal, upsell
- `synthex_attribution_channel_type`: organic_search, paid_search, social_organic, social_paid, email, direct, referral, display, video, affiliate, offline, other
- `synthex_attribution_model_type`: first_touch, last_touch, linear, time_decay, position_based, data_driven, custom
- `synthex_journey_type`: acquisition, activation, retention, expansion, advocacy
- `synthex_persona_type`: champion, user, evaluator, decision_maker, influencer, blocker, unknown
- `synthex_insight_type`: channel_optimization, journey_improvement, persona_targeting, timing_optimization, conversion_opportunity

### Service Layer

**File**: `src/lib/synthex/attributionMemoryService.ts`

**Key Functions**:

```typescript
// Contact Attribution
getOrCreateAttributionContact(tenantId, contactId)
updateAttributionContact(attributionContactId, updates)
listAttributionContacts(tenantId, filters)

// Event Tracking
recordEvent(tenantId, contactId, eventData)
listEvents(tenantId, filters)

// Journey Management
createJourney(tenantId, attributionContactId, options)
completeJourney(journeyId, options)
analyzeJourney(tenantId, journeyId)
listJourneys(tenantId, filters)

// Attribution Models
createAttributionModel(tenantId, modelData, userId)
listAttributionModels(tenantId)

// Channel Performance
getChannelPerformance(tenantId, filters)

// AI Insights
generateAttributionInsight(tenantId, options)
listAttributionInsights(tenantId, filters)

// Statistics
getAttributionStats(tenantId)
```

### API Endpoints

**Route**: `/api/synthex/attribution-memory`

**GET Types**:
- `stats` - Attribution statistics
- `contacts` - Attribution contacts with filters
- `events` - Touchpoint events
- `journeys` - Customer journeys
- `models` - Attribution models
- `channel_performance` - Channel metrics
- `insights` - AI insights

**POST Actions**:
- `record_event` - Record touchpoint event
- `create_journey` - Start new journey
- `complete_journey` - Mark journey complete
- `analyze_journey` - Run AI journey analysis
- `create_model` - Create attribution model
- `generate_insight` - Generate AI insight
- `get_or_create_contact` - Get/create attribution contact
- `update_contact` - Update contact data

### Dashboard

**Route**: `/synthex/attribution-memory`

**Features**:
- Overview with attribution stats
- Contact list with persona types
- Event timeline with channel icons
- Journey visualization
- AI insights panel

---

## D30: Unified Opportunity Graph Engine

### Purpose

Provide graph-based opportunity and relationship tracking with nodes, edges, paths, clusters, and AI-powered analysis for complex relationship understanding.

### Database Schema

**Migration**: `459_synthex_opportunity_graph.sql`

**Tables**:

| Table | Purpose |
|-------|---------|
| `synthex_library_opportunity_nodes` | Graph nodes (contacts, companies, deals, etc.) |
| `synthex_library_opportunity_edges` | Relationships between nodes |
| `synthex_library_opportunity_paths` | Computed paths through graph |
| `synthex_library_opportunity_clusters` | Groupings of related nodes |
| `synthex_library_opportunity_analysis` | AI analysis results |

**Enums**:
- `synthex_opportunity_node_type`: contact, company, deal, campaign, content, event, channel, product, segment, milestone, custom
- `synthex_opportunity_edge_type`: influences, leads_to, blocks, requires, supports, competes_with, belongs_to, triggers, converts_from, converts_to, interacts_with, custom
- `synthex_opportunity_node_status`: active, inactive, converted, lost, pending, archived
- `synthex_opportunity_cluster_type`: conversion_path, influence_network, risk_group, opportunity_zone, competitive_arena, growth_segment, custom
- `synthex_opportunity_analysis_type`: path_optimization, bottleneck_detection, influence_scoring, conversion_prediction, risk_assessment, opportunity_ranking, cluster_analysis, network_health

**Functions**:
- `calculate_node_graph_metrics(tenant_id, node_id)` - Calculate node degrees
- `find_opportunity_path(tenant_id, start, end, max_depth)` - Find shortest paths
- `get_cluster_members(tenant_id, cluster_id)` - Get cluster member details
- `get_opportunity_graph_stats(tenant_id)` - Get graph statistics
- `add_node_to_cluster(tenant_id, cluster_id, node_id)` - Add node to cluster
- `remove_node_from_cluster(tenant_id, cluster_id, node_id)` - Remove from cluster

### Service Layer

**File**: `src/lib/synthex/opportunityGraphService.ts`

**Key Functions**:

```typescript
// Node Management
createNode(tenantId, data, userId)
updateNode(nodeId, updates)
getNode(nodeId)
listNodes(tenantId, filters)
deleteNode(nodeId)

// Edge Management
createEdge(tenantId, data)
updateEdge(edgeId, updates)
listEdges(tenantId, filters)
deleteEdge(edgeId)
getNodeConnections(tenantId, nodeId)
bulkCreateEdges(tenantId, edges)

// Path Operations
createPath(tenantId, data)
listPaths(tenantId, filters)
findShortestPath(tenantId, startNodeId, endNodeId, maxDepth)

// Cluster Management
createCluster(tenantId, data)
updateCluster(clusterId, updates)
listClusters(tenantId, filters)
addNodeToCluster(tenantId, clusterId, nodeId)
removeNodeFromCluster(tenantId, clusterId, nodeId)
getClusterMembers(tenantId, clusterId)

// AI Analysis
runAnalysis(tenantId, data, userId)
listAnalyses(tenantId, filters)

// Statistics & Utilities
getGraphStats(tenantId)
calculateNodeMetrics(tenantId, nodeId)
linkExternalEntity(tenantId, data)
```

### API Endpoints

**Route**: `/api/synthex/opportunity-graph`

**GET Types**:
- `stats` - Graph statistics
- `nodes` - List nodes with filters
- `node` - Single node by ID
- `node_connections` - Node incoming/outgoing edges
- `edges` - List edges
- `paths` - List paths
- `find_path` - Find shortest path between nodes
- `clusters` - List clusters
- `cluster_members` - Get cluster members
- `analyses` - List AI analyses

**POST Actions**:
- `create_node` - Create new node
- `update_node` - Update node
- `delete_node` - Delete node
- `link_external` - Link external entity (contact, deal, etc.)
- `calculate_metrics` - Calculate node metrics
- `create_edge` - Create edge
- `update_edge` - Update edge
- `delete_edge` - Delete edge
- `bulk_create_edges` - Bulk create edges
- `create_path` - Create path
- `create_cluster` - Create cluster
- `update_cluster` - Update cluster
- `add_to_cluster` - Add node to cluster
- `remove_from_cluster` - Remove node from cluster
- `run_analysis` - Run AI analysis

### Dashboard

**Route**: `/synthex/opportunity-graph`

**Features**:
- Overview with graph metrics
- Node grid with type icons and scores
- Edge table with relationship types
- Cluster cards with AI summaries
- AI analysis panel with recommendations

---

## Technical Patterns

### Lazy Anthropic Client

All services use lazy initialization with 60-second circuit breaker:

```typescript
let anthropicClient: Anthropic | null = null;
let clientCreatedAt: number = 0;
const CLIENT_TTL_MS = 60_000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - clientCreatedAt > CLIENT_TTL_MS) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
    clientCreatedAt = now;
  }
  return anthropicClient;
}
```

### RLS Pattern

All tables use standard RLS with tenant isolation:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for table_name"
    ON table_name
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

### API Response Pattern

All endpoints return consistent response format:

```typescript
// Success
{ success: true, data: {...} }

// Error
{ error: "Error message" }
```

---

## Integration Points

### D28 → D29

Cross-brand profiles can be linked to attribution contacts for multi-brand journey tracking.

### D29 → D30

Attribution events and journeys automatically create opportunity graph nodes and edges.

### All Phases

- Share `tenant_id` for data isolation
- Use consistent Synthex dark mode UI
- Integrate with existing analytics, journeys, and automation systems

---

## File Index

### Migrations

```
supabase/migrations/
├── 457_synthex_multibrand_intel.sql     # D28
├── 458_synthex_attribution_memory_v2.sql # D29
└── 459_synthex_opportunity_graph.sql     # D30
```

### Services

```
src/lib/synthex/
├── crossBrandIntelService.ts      # D28
├── attributionMemoryService.ts    # D29
└── opportunityGraphService.ts     # D30
```

### API Routes

```
src/app/api/synthex/
├── crossbrand-intel/route.ts      # D28
├── attribution-memory/route.ts    # D29
└── opportunity-graph/route.ts     # D30
```

### Dashboard Pages

```
src/app/(synthex)/synthex/
├── crossbrand-intel/page.tsx      # D28
├── attribution-memory/page.tsx    # D29
└── opportunity-graph/page.tsx     # D30
```

---

## Usage Examples

### D28: Generate Cross-Brand Insight

```typescript
const insight = await fetch('/api/synthex/crossbrand-intel', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'uuid',
    action: 'generate_insight',
    insight_type: 'synergy',
    target_brands: ['brand-a-id', 'brand-b-id'],
  })
});
```

### D29: Record Attribution Event

```typescript
const event = await fetch('/api/synthex/attribution-memory', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'uuid',
    action: 'record_event',
    contact_id: 'contact-uuid',
    event_type: 'click',
    channel: 'email',
    campaign_id: 'campaign-uuid',
  })
});
```

### D30: Run Graph Analysis

```typescript
const analysis = await fetch('/api/synthex/opportunity-graph', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: 'uuid',
    action: 'run_analysis',
    analysis_type: 'bottleneck_detection',
    analysis_name: 'Q4 Bottleneck Analysis',
  })
});
```

---

## Next Steps

After D28-D30, the following phases may be implemented:

- **D31**: Real-time Graph Streaming
- **D32**: Predictive Opportunity Scoring
- **D33**: Automated Journey Optimization

---

**End of D28-D30 Documentation**
