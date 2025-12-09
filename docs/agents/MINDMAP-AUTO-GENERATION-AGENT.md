# MINDMAP AUTO-GENERATION AGENT SPECIFICATION

**Agent Name**: Mindmap Auto-Generation Agent
**Agent Type**: Tier 2 - Knowledge Structuring Agent
**Priority**: P1 - Critical (Build Second)
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `project_mindmaps` - Mindmap metadata (one per project/contact)
- `mindmap_nodes` - Individual nodes in the mindmap
- `mindmap_connections` - Connections between nodes
- `ai_suggestions` - AI-generated suggestions for mindmap improvements
- `email_intelligence` - Source intelligence data (read-only)
- `media_files` (ai_analysis) - Source intelligence data (read-only)

### Agent Purpose
The Mindmap Auto-Generation Agent is the **visual intelligence structuring layer** for the Client Intelligence System. It automatically generates interactive mind maps from extracted intelligence (ideas, goals, pain points, requirements), creates hierarchical node structures, identifies connections between concepts, and generates visual layouts. This agent transforms Duncan's business intelligence into a visual business model that can be explored, refined, and used to drive strategy.

### Agent Responsibilities
1. **Mindmap Generation**: Create mindmap structure from intelligence data
2. **Node Creation**: Generate nodes for ideas, goals, pain points, requirements, gaps
3. **Connection Mapping**: Identify relationships between concepts (relates_to, depends_on, leads_to)
4. **Gap Identification**: Detect and visualize knowledge gaps as nodes
5. **Layout Calculation**: Generate x/y coordinates for nodes (radial, tree, force-directed)
6. **Auto-Update**: Incrementally update mindmap when new intelligence arrives
7. **AI Suggestions**: Generate suggestions for mindmap improvements (add features, clarify requirements)

---

## 2. PURPOSE & SCOPE

### Core Responsibilities

#### IN SCOPE ✅
- Mindmap generation from comprehensive intelligence
- Node creation for all intelligence categories (ideas, goals, pain points, requirements, gaps)
- Connection detection (semantic similarity, dependency analysis, cause-effect)
- Layout calculation (radial layout, tree layout, force-directed graph)
- Incremental mindmap updates (add new nodes without regenerating entire mindmap)
- Knowledge gap detection and visualization
- AI-powered suggestions for mindmap improvements
- Visual styling (colors, icons, node sizes based on priority/category)
- Mindmap versioning (track changes over time)

#### OUT OF SCOPE ❌
- Interactive mindmap UI (handled by frontend)
- Real-time collaboration (Phase 2)
- Custom mindmap templates (Phase 2)
- Export to third-party mindmap tools (Phase 2)
- 3D mindmap visualization (Phase 3)

### Integration Touchpoints
- **AI Intelligence Extraction Agent**: Receives comprehensive intelligence for mindmap generation
- **Knowledge Gap Analysis Agent**: Receives gap data to visualize in mindmap
- **Dynamic Questionnaire Generator Agent**: Uses gap nodes to generate questions
- **Marketing Strategy Generator Agent**: Uses mindmap structure as input for strategy
- **Analytics Agent**: Provides mindmap metrics (total nodes, connections, gap coverage)

---

## 3. DATABASE SCHEMA MAPPING

### project_mindmaps Table
```typescript
interface ProjectMindmap {
  id: string; // UUID
  project_id: string; // UUID - References projects.id
  workspace_id: string; // UUID - References workspaces.id
  org_id: string; // UUID - References organizations.id
  version: number; // Mindmap version (increments on updates)
  created_by?: string | null; // UUID - References auth.users.id
  last_updated_by?: string | null; // UUID - References auth.users.id
  created_at: Date; // TIMESTAMPTZ
  updated_at: Date; // TIMESTAMPTZ
}

// Indexes:
// - idx_project_mindmaps_project_id ON project_mindmaps(project_id)
// - idx_project_mindmaps_workspace_id ON project_mindmaps(workspace_id)
// - UNIQUE(project_id) - One mindmap per project
```

### mindmap_nodes Table
```typescript
interface MindmapNode {
  id: string; // UUID
  mindmap_id: string; // UUID - References project_mindmaps.id
  parent_id?: string | null; // UUID - References mindmap_nodes.id (hierarchical structure)
  node_type: NodeType; // Type of node
  label: string; // Node title (e.g., "Increase brand awareness by 50%")
  description?: string | null; // Detailed description
  position_x: number; // X coordinate for visual layout
  position_y: number; // Y coordinate for visual layout
  color?: string | null; // Node color (e.g., "#4CAF50")
  icon?: string | null; // Icon name (e.g., "lightbulb", "target", "alert-triangle")
  status: NodeStatus; // Node status
  priority: number; // 0-10 (importance/urgency)
  metadata: Record<string, any>; // JSONB - Additional data (source_quote, confidence, etc.)
  ai_generated: boolean; // Whether node was AI-generated
  created_at: Date; // TIMESTAMPTZ
  updated_at: Date; // TIMESTAMPTZ
}

type NodeType =
  | 'project_root' // Central node (client/project name)
  | 'feature' // Feature or idea
  | 'requirement' // Specific requirement
  | 'task' // Actionable task
  | 'milestone' // Key milestone
  | 'idea' // Business idea
  | 'question' // Unanswered question (knowledge gap)
  | 'note'; // General note

type NodeStatus =
  | 'pending' // Not yet actioned
  | 'in_progress' // Being worked on
  | 'completed' // Completed
  | 'blocked' // Blocked by dependency
  | 'on_hold'; // On hold

// Indexes:
// - idx_mindmap_nodes_mindmap_id ON mindmap_nodes(mindmap_id)
// - idx_mindmap_nodes_parent_id ON mindmap_nodes(parent_id)
// - idx_mindmap_nodes_node_type ON mindmap_nodes(node_type)
// - idx_mindmap_nodes_metadata ON mindmap_nodes USING GIN(metadata)
```

### mindmap_connections Table
```typescript
interface MindmapConnection {
  id: string; // UUID
  mindmap_id: string; // UUID - References project_mindmaps.id
  source_node_id: string; // UUID - References mindmap_nodes.id
  target_node_id: string; // UUID - References mindmap_nodes.id
  connection_type: ConnectionType; // Type of connection
  label?: string | null; // Connection label (e.g., "requires", "solves")
  strength: number; // 1-10 (relationship strength)
  created_at: Date; // TIMESTAMPTZ
}

type ConnectionType =
  | 'relates_to' // General relationship
  | 'depends_on' // Dependency (source depends on target)
  | 'leads_to' // Progression (source leads to target)
  | 'part_of' // Hierarchy (source is part of target)
  | 'inspired_by' // Inspiration (source inspired by target)
  | 'conflicts_with'; // Conflict (source conflicts with target)

// Indexes:
// - idx_mindmap_connections_mindmap_id ON mindmap_connections(mindmap_id)
// - idx_mindmap_connections_source_node_id ON mindmap_connections(source_node_id)
// - idx_mindmap_connections_target_node_id ON mindmap_connections(target_node_id)
// - UNIQUE(source_node_id, target_node_id, connection_type) - No duplicate connections
```

### ai_suggestions Table
```typescript
interface AISuggestion {
  id: string; // UUID
  mindmap_id: string; // UUID - References project_mindmaps.id
  node_id?: string | null; // UUID - References mindmap_nodes.id (suggestion for specific node)
  suggestion_type: SuggestionType; // Type of suggestion
  suggestion_text: string; // Suggestion content
  reasoning?: string | null; // Why AI suggests this
  confidence_score?: number | null; // 0.0-1.0 (how confident)
  status: SuggestionStatus; // Suggestion status
  applied_at?: Date | null; // TIMESTAMPTZ - When suggestion was applied
  dismissed_at?: Date | null; // TIMESTAMPTZ - When suggestion was dismissed
  created_at: Date; // TIMESTAMPTZ
}

type SuggestionType =
  | 'add_feature' // Suggest adding a feature node
  | 'clarify_requirement' // Suggest clarifying a requirement
  | 'identify_dependency' // Suggest adding a dependency connection
  | 'suggest_technology' // Suggest technology choice
  | 'warn_complexity' // Warn about complexity
  | 'estimate_cost' // Suggest cost estimate
  | 'propose_alternative'; // Propose alternative approach

type SuggestionStatus =
  | 'pending' // Not yet reviewed
  | 'accepted' // User accepted
  | 'dismissed' // User dismissed
  | 'applied'; // Applied to mindmap

// Indexes:
// - idx_ai_suggestions_mindmap_id ON ai_suggestions(mindmap_id)
// - idx_ai_suggestions_node_id ON ai_suggestions(node_id)
// - idx_ai_suggestions_status ON ai_suggestions(status)
```

---

## 4. CORE FUNCTIONS

### 4.1 generateFromIntelligence()
**Purpose**: Generate complete mindmap from comprehensive intelligence.

**Input**:
```typescript
interface GenerateFromIntelligenceRequest {
  contact_id: string; // UUID
  workspace_id: string; // UUID
  project_id?: string; // UUID - Create project if not exists
  layout_type?: 'radial' | 'tree' | 'force'; // Default: 'radial'
}
```

**Output**:
```typescript
interface GenerateFromIntelligenceResult {
  success: boolean;
  mindmap_id: string; // UUID
  mindmap: {
    root_node: MindmapNode;
    total_nodes: number;
    total_connections: number;
    branches: {
      ideas: MindmapNode[];
      goals: MindmapNode[];
      pain_points: MindmapNode[];
      requirements: MindmapNode[];
      gaps: MindmapNode[];
    };
  };
  processing_time_ms: number;
  error?: string;
}
```

**Business Logic**:
1. **Fetch comprehensive intelligence**: Call AI Intelligence Extraction Agent's analyzeCombined()
2. **Create/get project**:
   - If project_id not provided, create new project with contact as client
   - Get project_id for mindmap association
3. **Create mindmap**: INSERT into project_mindmaps
4. **Create center node**:
   ```typescript
   const rootNode: MindmapNode = {
     node_type: 'project_root',
     label: contact.name || 'Client Vision',
     description: intelligence.executive_summary,
     position_x: 0,
     position_y: 0,
     color: '#2196F3', // Blue for center
     icon: 'user',
     priority: 10,
     ai_generated: true,
   };
   ```
5. **Create branch nodes**: For each category (ideas, goals, pain_points, requirements, gaps):
   ```typescript
   const branches = [
     { label: 'Ideas', color: '#FFC107', icon: 'lightbulb', angle: 0 },
     { label: 'Goals', color: '#4CAF50', icon: 'target', angle: 60 },
     { label: 'Pain Points', color: '#F44336', icon: 'alert-triangle', angle: 120 },
     { label: 'Requirements', color: '#9C27B0', icon: 'list', angle: 180 },
     { label: 'Knowledge Gaps', color: '#FF5722', icon: 'help-circle', angle: 240 },
   ];

   branches.forEach(branch => {
     const branchNode = createBranchNode(branch);
     // Calculate position using radial layout
     branchNode.position_x = 300 * Math.cos(branch.angle * Math.PI / 180);
     branchNode.position_y = 300 * Math.sin(branch.angle * Math.PI / 180);
   });
   ```
6. **Create item nodes**: For each intelligence item, create child nodes under respective branches
7. **Create connections**: Identify relationships between nodes (see linkRelatedIdeas())
8. **Calculate layout**: Adjust node positions based on layout_type
9. **Return mindmap**: Return mindmap with all nodes and connections

**Radial Layout Calculation**:
```typescript
function calculateRadialLayout(nodes: MindmapNode[], center: MindmapNode): void {
  // Branch nodes at radius 300px
  const branches = nodes.filter(n => n.parent_id === center.id);
  const angleStep = 360 / branches.length;

  branches.forEach((branch, i) => {
    const angle = i * angleStep;
    branch.position_x = 300 * Math.cos(angle * Math.PI / 180);
    branch.position_y = 300 * Math.sin(angle * Math.PI / 180);

    // Child nodes at radius 600px
    const children = nodes.filter(n => n.parent_id === branch.id);
    const childAngleStep = 40 / children.length; // 40 degrees per branch

    children.forEach((child, j) => {
      const childAngle = angle - 20 + (j * childAngleStep);
      child.position_x = 600 * Math.cos(childAngle * Math.PI / 180);
      child.position_y = 600 * Math.sin(childAngle * Math.PI / 180);
    });
  });
}
```

**Performance Requirements**:
- Generation time: < 5 seconds (for 100+ intelligence items)
- Database inserts: Batch insert nodes and connections

**Error Codes**:
- `MINDMAP_GEN_001`: Contact not found
- `MINDMAP_GEN_002`: No intelligence data available
- `MINDMAP_GEN_003`: Project creation failed
- `MINDMAP_GEN_004`: Mindmap generation failed

---

### 4.2 createCenterNode()
**Purpose**: Create the central node (client/project name).

**Input**:
```typescript
interface CreateCenterNodeRequest {
  mindmap_id: string; // UUID
  contact: Contact; // Contact data
  executive_summary: string; // Summary from intelligence
}
```

**Output**:
```typescript
interface CreateCenterNodeResult {
  success: boolean;
  node: MindmapNode;
  error?: string;
}
```

**Business Logic**:
1. **Create root node**: INSERT into mindmap_nodes with node_type='project_root'
2. **Set metadata**:
   ```typescript
   metadata: {
     contact_id: contact.id,
     contact_email: contact.email,
     contact_company: contact.company,
     summary: executive_summary,
   }
   ```
3. **Return node**: Return created node

---

### 4.3 createBranch()
**Purpose**: Create a category branch and its child nodes.

**Input**:
```typescript
interface CreateBranchRequest {
  mindmap_id: string; // UUID
  parent_id: string; // UUID - Root node ID
  category: 'ideas' | 'goals' | 'pain_points' | 'requirements' | 'gaps';
  items: Idea[] | BusinessGoal[] | PainPoint[] | Requirement[] | Gap[];
  angle: number; // Radial position (0-360 degrees)
}
```

**Output**:
```typescript
interface CreateBranchResult {
  success: boolean;
  branch_node: MindmapNode;
  child_nodes: MindmapNode[];
  total_nodes_created: number;
  error?: string;
}
```

**Business Logic**:
1. **Create branch node**: INSERT into mindmap_nodes with parent_id=root node
2. **Set branch properties**:
   ```typescript
   const branchConfig = {
     ideas: { label: 'Ideas', color: '#FFC107', icon: 'lightbulb' },
     goals: { label: 'Goals', color: '#4CAF50', icon: 'target' },
     pain_points: { label: 'Pain Points', color: '#F44336', icon: 'alert-triangle' },
     requirements: { label: 'Requirements', color: '#9C27B0', icon: 'list' },
     gaps: { label: 'Knowledge Gaps', color: '#FF5722', icon: 'help-circle' },
   };
   ```
3. **Create child nodes**: For each item, INSERT into mindmap_nodes with parent_id=branch node
4. **Set child metadata**:
   ```typescript
   metadata: {
     source_quote: item.source_quote,
     category: item.category,
     priority: item.priority || 'medium',
     confidence: item.confidence || 0.8,
   }
   ```
5. **Calculate child positions**: Spread children around branch (radial distribution)
6. **Return result**: Return branch node + child nodes

---

### 4.4 linkRelatedIdeas()
**Purpose**: Identify and create connections between related nodes.

**Input**:
```typescript
interface LinkRelatedIdeasRequest {
  mindmap_id: string; // UUID
  nodes: MindmapNode[]; // All nodes in mindmap
}
```

**Output**:
```typescript
interface LinkRelatedIdeasResult {
  success: boolean;
  connections: MindmapConnection[];
  total_connections: number;
  error?: string;
}
```

**Business Logic**:
1. **Semantic similarity analysis**: Compare node labels using text similarity
   ```typescript
   function areNodesRelated(node1: MindmapNode, node2: MindmapNode): boolean {
     const similarity = calculateTextSimilarity(node1.label, node2.label);
     return similarity > 0.6; // 60% similar = related
   }
   ```
2. **Dependency detection**: Identify "depends_on" connections
   - If goal mentions requirement → goal depends_on requirement
   - If requirement addresses pain_point → requirement depends_on pain_point
3. **Cause-effect relationships**: Identify "leads_to" connections
   - If idea solves pain_point → idea leads_to solution
4. **Conflict detection**: Identify "conflicts_with" connections
   - If two requirements contradict → requirement conflicts_with requirement
5. **Create connections**: INSERT into mindmap_connections
6. **Set connection strength**:
   - High similarity (>80%) → strength: 9-10
   - Medium similarity (60-80%) → strength: 5-8
   - Low similarity (40-60%) → strength: 1-4
7. **Return connections**: Return all created connections

**Example Connection Detection**:
```typescript
// Goal: "Increase brand awareness by 50%"
// Pain Point: "Current marketing not delivering results"
// Connection: goal depends_on solving pain_point

// Requirement: "Budget cap of $50,000"
// Idea: "Q4 marketing campaign"
// Connection: idea depends_on requirement (budget constraint)
```

**Performance Requirements**:
- Connection detection: < 2 seconds (for 100 nodes)
- Use pairwise comparison with early termination (skip if similarity < 0.4)

**Error Codes**:
- `MINDMAP_GEN_005`: Connection detection failed
- `MINDMAP_GEN_006`: Connection creation failed

---

### 4.5 identifyDependencies()
**Purpose**: Identify dependency connections (what depends on what).

**Input**: Same as `linkRelatedIdeas()`

**Output**: Same as `linkRelatedIdeas()`

**Business Logic**:
1. **Rule-based dependency detection**:
   - Goal → Requirement: Goal depends on requirement being met
   - Requirement → Pain Point: Requirement addresses pain point
   - Idea → Goal: Idea enables goal achievement
2. **Keyword matching**:
   - "requires", "needs", "depends on" → creates depends_on connection
   - "solves", "addresses", "fixes" → creates leads_to connection
3. **Create dependency connections**: INSERT into mindmap_connections with connection_type='depends_on'

---

### 4.6 identifyKnowledgeGaps()
**Purpose**: Detect knowledge gaps and create gap nodes.

**Input**:
```typescript
interface IdentifyKnowledgeGapsRequest {
  mindmap_id: string; // UUID
  comprehensive_intelligence: ComprehensiveIntelligence;
}
```

**Output**:
```typescript
interface IdentifyKnowledgeGapsResult {
  success: boolean;
  gaps: Gap[];
  gap_nodes: MindmapNode[];
  total_gaps: number;
  error?: string;
}

interface Gap {
  text: string; // Gap description
  category: string; // Gap category
  importance: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string; // Why this is a gap
}
```

**Business Logic**:
1. **Analyze intelligence completeness**:
   - **Budget**: Is budget discussed? If no → gap: "Budget not discussed"
   - **Timeline**: Is timeline defined? If no → gap: "Timeline not defined"
   - **Team**: Is team structure mentioned? If no → gap: "Team structure unknown"
   - **Metrics**: Are success metrics defined? If no → gap: "Success metrics not defined"
2. **Check required information**:
   ```typescript
   const requiredCategories = [
     'target_audience', 'budget', 'timeline', 'technical_requirements',
     'team_resources', 'success_metrics', 'competitive_landscape',
   ];

   const gaps: Gap[] = [];
   requiredCategories.forEach(category => {
     if (!hasInformationFor(category, intelligence)) {
       gaps.push({
         text: `${category.replace('_', ' ')} not discussed`,
         category,
         importance: getCategoryImportance(category),
         reasoning: `No information found about ${category}`,
       });
     }
   });
   ```
3. **Create gap nodes**: INSERT into mindmap_nodes with node_type='question'
4. **Link gaps to related nodes**: If gap relates to specific requirement/goal, create connection
5. **Return gaps**: Return gap data and nodes

**Gap Importance Calculation**:
```typescript
function getCategoryImportance(category: string): 'critical' | 'high' | 'medium' | 'low' {
  const critical = ['budget', 'timeline', 'decision_makers'];
  const high = ['target_audience', 'success_metrics', 'technical_requirements'];
  const medium = ['team_resources', 'competitive_landscape'];

  if (critical.includes(category)) return 'critical';
  if (high.includes(category)) return 'high';
  if (medium.includes(category)) return 'medium';
  return 'low';
}
```

**Performance Requirements**:
- Gap detection: < 1 second

**Error Codes**:
- `MINDMAP_GEN_007`: Gap detection failed
- `MINDMAP_GEN_008`: Gap node creation failed

---

### 4.7 updateMindmapWithNewIntel()
**Purpose**: Incrementally update mindmap when new intelligence arrives (don't regenerate entire mindmap).

**Input**:
```typescript
interface UpdateMindmapWithNewIntelRequest {
  mindmap_id: string; // UUID
  new_intelligence: EmailIntelligence | AIMediaAnalysis;
}
```

**Output**:
```typescript
interface UpdateMindmapWithNewIntelResult {
  success: boolean;
  nodes_added: number;
  nodes_updated: number;
  connections_added: number;
  gaps_resolved: number;
  error?: string;
}
```

**Business Logic**:
1. **Extract new items**: Get new ideas, goals, pain_points, requirements from new intelligence
2. **De-duplicate**: Compare new items with existing nodes (text similarity)
   - If duplicate (>80% similar), skip or update existing node
   - If new, create new node
3. **Create new nodes**: INSERT new nodes under appropriate branches
4. **Update existing nodes**: If item mentioned again, increment metadata.mention_count
5. **Detect new connections**: Run linkRelatedIdeas() on new nodes + existing nodes
6. **Check if gaps resolved**: If new intelligence fills a gap, mark gap node as resolved (status='completed')
7. **Increment mindmap version**: UPDATE project_mindmaps SET version = version + 1
8. **Return update result**: Return counts of added/updated items

**De-duplication Logic**:
```typescript
function findExistingNode(newItem: Idea, existingNodes: MindmapNode[]): MindmapNode | null {
  return existingNodes.find(node => {
    const similarity = calculateTextSimilarity(newItem.text, node.label);
    return similarity > 0.8; // 80% similar = duplicate
  }) || null;
}
```

**Performance Requirements**:
- Update time: < 3 seconds (even for large mindmaps)

**Error Codes**:
- `MINDMAP_GEN_009`: Mindmap not found
- `MINDMAP_GEN_010`: Update failed

---

### 4.8 calculateNodePositions()
**Purpose**: Calculate x/y coordinates for all nodes based on layout type.

**Input**:
```typescript
interface CalculateNodePositionsRequest {
  mindmap_id: string; // UUID
  layout_type: 'radial' | 'tree' | 'force'; // Layout algorithm
}
```

**Output**:
```typescript
interface CalculateNodePositionsResult {
  success: boolean;
  nodes: {
    id: string;
    position_x: number;
    position_y: number;
  }[];
  error?: string;
}
```

**Business Logic**:
1. **Fetch all nodes**: SELECT * FROM mindmap_nodes WHERE mindmap_id = ?
2. **Apply layout algorithm**:
   - **Radial**: Center node at (0, 0), branches at radius 300px, children at radius 600px
   - **Tree**: Hierarchical top-down layout (root at top, children below)
   - **Force**: Force-directed graph (simulate physics, nodes repel, connections attract)
3. **Update node positions**: Batch UPDATE mindmap_nodes SET position_x, position_y
4. **Return positions**: Return updated coordinates

**Force-Directed Layout** (D3-style):
```typescript
function calculateForceLayout(nodes: MindmapNode[], connections: MindmapConnection[]): void {
  // Simulate physics for 100 iterations
  for (let i = 0; i < 100; i++) {
    // Repulsion between nodes
    nodes.forEach(n1 => {
      nodes.forEach(n2 => {
        if (n1.id === n2.id) return;
        const dx = n2.position_x - n1.position_x;
        const dy = n2.position_y - n1.position_y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = 100 / (distance * distance); // Coulomb's law
        n1.position_x -= (dx / distance) * force;
        n1.position_y -= (dy / distance) * force;
      });
    });

    // Attraction along connections
    connections.forEach(conn => {
      const source = nodes.find(n => n.id === conn.source_node_id)!;
      const target = nodes.find(n => n.id === conn.target_node_id)!;
      const dx = target.position_x - source.position_x;
      const dy = target.position_y - source.position_y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const force = distance * 0.01; // Hooke's law
      source.position_x += (dx / distance) * force;
      source.position_y += (dy / distance) * force;
      target.position_x -= (dx / distance) * force;
      target.position_y -= (dy / distance) * force;
    });
  }
}
```

**Performance Requirements**:
- Layout calculation: < 2 seconds (for 200 nodes)

**Error Codes**:
- `MINDMAP_GEN_011`: Layout calculation failed

---

## 5. API ENDPOINTS

### POST /api/mindmaps/generate
**Description**: Generate mindmap from comprehensive intelligence.

**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "layout_type": "radial"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "mindmap_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "mindmap": {
    "root_node": {
      "id": "bb0e8400-e29b-41d4-a716-446655440000",
      "label": "Duncan Smith - TechCorp Australia",
      "position_x": 0,
      "position_y": 0,
      "color": "#2196F3",
      "icon": "user"
    },
    "total_nodes": 47,
    "total_connections": 23,
    "branches": {
      "ideas": [15 nodes],
      "goals": [8 nodes],
      "pain_points": [12 nodes],
      "requirements": [20 nodes],
      "gaps": [5 nodes]
    }
  },
  "processing_time_ms": 4250
}
```

---

### PATCH /api/mindmaps/:mindmap_id/update
**Description**: Update mindmap with new intelligence.

**Request**:
```json
{
  "new_intelligence": {
    "ideas": [
      {
        "text": "Add AI chatbot to website",
        "category": "feature",
        "priority": "high"
      }
    ],
    "goals": [],
    "pain_points": [],
    "requirements": []
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "nodes_added": 1,
  "nodes_updated": 0,
  "connections_added": 2,
  "gaps_resolved": 0
}
```

---

### GET /api/mindmaps/:mindmap_id/gaps
**Description**: Get all knowledge gaps in mindmap.

**Response** (200 OK):
```json
{
  "success": true,
  "gaps": [
    {
      "text": "Budget not discussed",
      "category": "budget",
      "importance": "critical",
      "reasoning": "No budget information found in any communications"
    },
    {
      "text": "Target audience not defined",
      "category": "target_audience",
      "importance": "high",
      "reasoning": "Demographic details missing"
    }
  ],
  "total_gaps": 2
}
```

---

## 6. INTEGRATION POINTS

### Inputs (What This Agent Receives)

1. **From AI Intelligence Extraction Agent**:
   - Comprehensive intelligence (all ideas, goals, pain points, requirements)
   - New intelligence (incremental updates)

2. **From Knowledge Gap Analysis Agent**:
   - Detected knowledge gaps
   - Gap priorities and categories

### Outputs (What This Agent Provides)

1. **To Dynamic Questionnaire Generator Agent**:
   - Gap nodes (what to ask about)
   - Mindmap structure (context for questions)

2. **To Marketing Strategy Generator Agent**:
   - Mindmap structure (visual business model)
   - Prioritized goals and requirements

3. **To Analytics Agent**:
   - Mindmap metrics (total nodes, connections, gap coverage)

---

## 7. BUSINESS RULES

### Node Creation Rules

1. **One root node per mindmap**: Only one node with node_type='project_root'
2. **Branch nodes for each category**: Always create 5 branch nodes (Ideas, Goals, Pain Points, Requirements, Gaps)
3. **Maximum depth: 3 levels**: Root → Branch → Items (no deeper nesting)

### Connection Rules

1. **No self-connections**: source_node_id cannot equal target_node_id
2. **No duplicate connections**: UNIQUE constraint on (source_node_id, target_node_id, connection_type)
3. **Bidirectional connections**: If A relates_to B, also create B relates_to A (symmetric)

### Gap Detection Rules

1. **Critical gaps**: Budget, Timeline, Decision Makers
2. **High-priority gaps**: Target Audience, Success Metrics, Technical Requirements
3. **Medium-priority gaps**: Team Resources, Competitive Landscape
4. **Low-priority gaps**: Other missing information

---

## 8. PERFORMANCE REQUIREMENTS

| Function | Target | Maximum |
|----------|--------|---------|
| generateFromIntelligence() | < 5s | 10s |
| createBranch() | < 1s | 3s |
| linkRelatedIdeas() | < 2s | 5s |
| identifyKnowledgeGaps() | < 1s | 3s |
| updateMindmapWithNewIntel() | < 3s | 7s |
| calculateNodePositions() | < 2s | 5s |

---

## 9. TESTING STRATEGY

### Unit Tests

```typescript
describe('Mindmap Auto-Generation Agent', () => {
  it('should generate mindmap from intelligence', async () => {
    const result = await generateFromIntelligence({
      contact_id: testContact.id,
      workspace_id: TEST_WORKSPACE_ID,
      layout_type: 'radial',
    });

    expect(result.success).toBe(true);
    expect(result.mindmap.total_nodes).toBeGreaterThan(0);
    expect(result.mindmap.branches.ideas.length).toBeGreaterThan(0);
  });

  it('should detect knowledge gaps', async () => {
    const result = await identifyKnowledgeGaps({
      mindmap_id: testMindmap.id,
      comprehensive_intelligence: incompleteIntelligence,
    });

    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.gaps.find(g => g.category === 'budget')).toBeDefined();
  });
});
```

---

## 10. ERROR CODES

| Error Code | Description | HTTP Status |
|-----------|-------------|-------------|
| MINDMAP_GEN_001 | Contact not found | 404 |
| MINDMAP_GEN_002 | No intelligence data available | 404 |
| MINDMAP_GEN_003 | Project creation failed | 500 |
| MINDMAP_GEN_004 | Mindmap generation failed | 500 |
| MINDMAP_GEN_005 | Connection detection failed | 500 |
| MINDMAP_GEN_006 | Connection creation failed | 500 |
| MINDMAP_GEN_007 | Gap detection failed | 500 |
| MINDMAP_GEN_008 | Gap node creation failed | 500 |
| MINDMAP_GEN_009 | Mindmap not found | 404 |
| MINDMAP_GEN_010 | Update failed | 500 |
| MINDMAP_GEN_011 | Layout calculation failed | 500 |

---

## 11. MONITORING & METRICS

### Prometheus Metrics

```typescript
const mindmapsGenerated = new Counter({
  name: 'mindmaps_generated_total',
  help: 'Total mindmaps generated',
  labelNames: ['workspace_id'],
});

const mindmapNodes = new Gauge({
  name: 'mindmap_nodes_total',
  help: 'Total nodes in mindmap',
  labelNames: ['mindmap_id', 'node_type'],
});

const knowledgeGaps = new Gauge({
  name: 'knowledge_gaps_total',
  help: 'Total knowledge gaps detected',
  labelNames: ['mindmap_id', 'importance'],
});
```

---

## 12. FUTURE ENHANCEMENTS

### Phase 2
1. Real-time collaboration (multiple users editing mindmap simultaneously)
2. Custom mindmap templates (industry-specific templates)
3. 3D mindmap visualization

### Phase 3
1. AI-powered mindmap refinement suggestions
2. Export to Miro, MindMeister, XMind
3. Voice-to-mindmap (speak ideas, auto-generate nodes)

---

## AGENT METADATA

**Created**: 2025-11-18
**Version**: 1.0.0
**Status**: Active Development
**Dependencies**: AI Intelligence Extraction Agent, Knowledge Gap Analysis Agent

---

**END OF MINDMAP AUTO-GENERATION AGENT SPECIFICATION**
