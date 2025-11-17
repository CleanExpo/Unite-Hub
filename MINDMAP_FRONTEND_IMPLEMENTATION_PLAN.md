# Mindmap Frontend Implementation Plan

**Status**: Ready to implement
**Estimated Time**: 4-6 hours
**Priority**: High

---

## Phase 1: Install Dependencies ✓

### Required Packages
```bash
npm install reactflow dagre @types/dagre
```

**Dependencies**:
- `reactflow` (v11+) - React Flow library for interactive node-based graphs
- `dagre` - Graph layout algorithm for auto-positioning
- `@types/dagre` - TypeScript definitions

---

## Phase 2: Component Architecture

### Directory Structure
```
src/
├── components/
│   └── mindmap/
│       ├── MindmapCanvas.tsx           # Main canvas component
│       ├── nodes/
│       │   ├── ProjectRootNode.tsx     # Root node type
│       │   ├── FeatureNode.tsx         # Feature node type
│       │   ├── TaskNode.tsx            # Task node type
│       │   ├── MilestoneNode.tsx       # Milestone node type
│       │   ├── IdeaNode.tsx            # Idea node type
│       │   ├── QuestionNode.tsx        # Question node type
│       │   ├── RequirementNode.tsx     # Requirement node type
│       │   └── NoteNode.tsx            # Note node type
│       ├── edges/
│       │   └── CustomEdge.tsx          # Custom connection edges
│       ├── panels/
│       │   ├── NodeToolbar.tsx         # Node editing toolbar
│       │   ├── AISuggestionPanel.tsx   # AI suggestions sidebar
│       │   └── MindmapControls.tsx     # Zoom/fit controls
│       └── hooks/
│           ├── useMindmapData.tsx      # Data fetching hook
│           └── useAutoLayout.tsx       # Auto-layout hook
│
└── app/
    └── dashboard/
        └── projects/
            └── [projectId]/
                └── mindmap/
                    └── page.tsx         # Mindmap page route
```

---

## Phase 3: Core Components

### 1. MindmapCanvas.tsx (Main Component)
**Features**:
- React Flow integration
- Drag-and-drop node repositioning
- Connection creation between nodes
- Auto-layout with Dagre
- Real-time updates
- Keyboard shortcuts (Delete, Esc, etc.)

**Props**:
```typescript
interface MindmapCanvasProps {
  projectId: string;
  workspaceId: string;
  onNodeAdd?: (node: MindmapNode) => void;
  onNodeUpdate?: (node: MindmapNode) => void;
  onConnectionAdd?: (connection: MindmapConnection) => void;
}
```

**Key Features**:
- ✅ Load mindmap data from API
- ✅ Display nodes with custom node types
- ✅ Allow drag-drop repositioning
- ✅ Create connections between nodes
- ✅ Auto-save position changes
- ✅ Zoom/pan/fit controls
- ✅ Context menu for node actions

### 2. Node Type Components (8 types)

Each node type has unique styling and behavior:

**ProjectRootNode**:
- Large central node
- Bold title
- Shows project name
- Cannot be deleted

**FeatureNode**:
- Blue color scheme
- Feature icon
- Shows feature name + description
- Priority indicator

**TaskNode**:
- Green color scheme
- Checkbox icon
- Shows task + status
- Priority + assignee

**MilestoneNode**:
- Purple color scheme
- Flag icon
- Shows milestone + date
- Progress indicator

**IdeaNode**:
- Yellow color scheme
- Lightbulb icon
- Shows idea + notes
- Can be converted to feature

**QuestionNode**:
- Orange color scheme
- Question mark icon
- Shows question
- Can be marked resolved

**RequirementNode**:
- Red color scheme
- Document icon
- Shows requirement
- Acceptance criteria

**NoteNode**:
- Gray color scheme
- Note icon
- Shows free-form text
- Minimal styling

### 3. CustomEdge.tsx (Connection Types)

**Connection Types**:
1. **depends_on** - Solid arrow (black)
2. **relates_to** - Dashed line (gray)
3. **leads_to** - Arrow with label (blue)
4. **part_of** - Thick line (green)
5. **inspired_by** - Dotted line (yellow)
6. **conflicts_with** - Red zigzag line

**Features**:
- Color coding by type
- Strength indicator (line thickness)
- Hover labels
- Delete button on hover

### 4. AISuggestionPanel.tsx

**Layout**: Right sidebar overlay

**Features**:
- List of AI suggestions
- Confidence score badges
- Suggestion type icons
- Accept/Dismiss buttons
- Apply suggestion action

**States**:
- Loading (analyzing project)
- Empty (no suggestions)
- Populated (show suggestions)
- Applied (show success)

### 5. NodeToolbar.tsx

**Features**:
- Add new node (with type selector)
- Delete node
- Change node type
- Edit node properties
- Trigger AI analysis

---

## Phase 4: Data Flow

### API Integration

**1. Load Mindmap**:
```typescript
GET /api/projects/[projectId]/mindmap
```

**2. Create/Update Node**:
```typescript
POST /api/mindmap/[mindmapId]/nodes
PUT /api/mindmap/nodes/[nodeId]
```

**3. Create Connection**:
```typescript
POST /api/mindmap/[mindmapId]/connections
```

**4. Request AI Analysis**:
```typescript
POST /api/mindmap/[mindmapId]/ai-analyze
```

**5. Update Suggestion**:
```typescript
PUT /api/mindmap/suggestions/[suggestionId]
```

### State Management

**Use React Query for**:
- Fetching mindmap data
- Caching suggestions
- Optimistic updates
- Auto-refetch on focus

**Local State**:
- Node positions (React Flow state)
- Selected nodes
- Connection mode
- UI states (modals, panels)

---

## Phase 5: Features to Implement

### Core Features
- ✅ View existing mindmap
- ✅ Add new nodes
- ✅ Edit node properties
- ✅ Delete nodes
- ✅ Create connections
- ✅ Delete connections
- ✅ Drag-drop repositioning
- ✅ Auto-layout (Dagre)

### Advanced Features
- ✅ AI analysis button
- ✅ AI suggestion panel
- ✅ Accept/dismiss suggestions
- ✅ Apply suggestions automatically
- ✅ Node search/filter
- ✅ Export as image
- ✅ Export as JSON
- ✅ Undo/redo (optional)

### UI/UX Features
- ✅ Zoom controls
- ✅ Fit view button
- ✅ Minimap (React Flow built-in)
- ✅ Context menu (right-click)
- ✅ Keyboard shortcuts
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications

---

## Phase 6: Styling

### Design System
- Use **shadcn/ui** components
- Use **Tailwind CSS** for styling
- Use **Lucide React** for icons
- Follow existing dashboard theme

### Color Palette
```typescript
const nodeColors = {
  project_root: '#3b82f6', // blue-500
  feature: '#8b5cf6',      // violet-500
  requirement: '#ef4444',  // red-500
  task: '#10b981',         // green-500
  milestone: '#f59e0b',    // amber-500
  idea: '#fbbf24',         // yellow-400
  question: '#f97316',     // orange-500
  note: '#6b7280',         // gray-500
};

const connectionColors = {
  depends_on: '#000000',    // black
  relates_to: '#9ca3af',    // gray-400
  leads_to: '#3b82f6',      // blue-500
  part_of: '#10b981',       // green-500
  inspired_by: '#fbbf24',   // yellow-400
  conflicts_with: '#ef4444', // red-500
};
```

---

## Phase 7: Testing Checklist

### Unit Tests
- [ ] Node components render correctly
- [ ] Edge components render correctly
- [ ] API hooks work correctly
- [ ] Auto-layout algorithm works

### Integration Tests
- [ ] Create mindmap for project
- [ ] Add nodes of each type
- [ ] Create connections
- [ ] Edit node properties
- [ ] Delete nodes/connections
- [ ] Request AI analysis
- [ ] Accept/dismiss suggestions

### E2E Tests
- [ ] Full user flow (create → edit → analyze → apply)
- [ ] Drag-drop repositioning
- [ ] Zoom/pan controls
- [ ] Export functionality

### Performance Tests
- [ ] Large mindmaps (100+ nodes)
- [ ] Rapid node creation
- [ ] Connection rendering
- [ ] Auto-layout performance

---

## Phase 8: API Endpoint Testing

### Test Plan

**1. Create Mindmap**:
```bash
curl -X POST http://localhost:3008/api/projects/PROJECT_ID/mindmap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "workspace_id": "WORKSPACE_ID"
  }'
```

**2. Get Mindmap**:
```bash
curl http://localhost:3008/api/mindmap/MINDMAP_ID \
  -H "Authorization: Bearer TOKEN"
```

**3. Add Node**:
```bash
curl -X POST http://localhost:3008/api/mindmap/MINDMAP_ID/nodes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "node_type": "feature",
    "label": "User Authentication",
    "description": "Implement OAuth login",
    "position_x": 100,
    "position_y": 200
  }'
```

**4. Create Connection**:
```bash
curl -X POST http://localhost:3008/api/mindmap/MINDMAP_ID/connections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "source_node_id": "NODE_1",
    "target_node_id": "NODE_2",
    "connection_type": "depends_on"
  }'
```

**5. Request AI Analysis**:
```bash
curl -X POST http://localhost:3008/api/mindmap/MINDMAP_ID/ai-analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "context": "Mobile banking app for millennials"
  }'
```

**6. Accept Suggestion**:
```bash
curl -X PUT http://localhost:3008/api/mindmap/suggestions/SUGGESTION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "status": "accepted"
  }'
```

---

## Phase 9: Production Deployment

### Pre-Deployment Checklist

**Code Quality**:
- [ ] ESLint passes
- [ ] TypeScript compiles
- [ ] No console errors
- [ ] All tests passing

**Performance**:
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading where appropriate

**Security**:
- [ ] RLS policies tested
- [ ] Authentication working
- [ ] Workspace isolation verified
- [ ] No data leakage

**Documentation**:
- [ ] README updated
- [ ] API docs complete
- [ ] User guide written
- [ ] Changelog updated

### Deployment Steps

**1. Build for Production**:
```bash
npm run build
```

**2. Test Production Build**:
```bash
npm run start
```

**3. Deploy to Vercel**:
```bash
vercel --prod
```

**4. Verify Deployment**:
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] API endpoints working
- [ ] Frontend loads correctly
- [ ] Monitoring active

---

## Phase 10: Success Metrics

### Feature Adoption
- Track mindmap creation rate
- Track AI analysis usage
- Track suggestion acceptance rate
- Track average nodes per mindmap

### Performance Metrics
- Page load time < 2s
- Time to interactive < 3s
- API response time < 500ms
- 99.9% uptime

### User Feedback
- User satisfaction score
- Feature requests
- Bug reports
- Usage patterns

---

## Next Steps

1. **Install dependencies** ✓ (in progress)
2. **Create MindmapCanvas.tsx** (next)
3. **Build node components** (8 types)
4. **Create AI panel** (suggestions UI)
5. **Build dashboard page** (route + layout)
6. **Test API endpoints** (all 7 endpoints)
7. **Deploy to production** (Vercel)

---

## Estimated Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Install dependencies | 5 min | ✓ In progress |
| 2 | MindmapCanvas component | 1 hour | Pending |
| 3 | Node components (8) | 2 hours | Pending |
| 4 | AI suggestion panel | 1 hour | Pending |
| 5 | Dashboard page | 30 min | Pending |
| 6 | API testing | 1 hour | Pending |
| 7 | Production deployment | 30 min | Pending |
| **TOTAL** | | **6 hours** | |

---

**Ready to start building!** 🚀

This plan covers everything needed to bring the mindmap feature from database → API → frontend → production.
