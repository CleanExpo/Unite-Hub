# Visual Campaign Builder UI

**Created**: 2026-01-27
**Status**: Complete
**Task**: Unite-Hub-ove.3.2 (Visual Campaign Builder UI)

---

## Overview

React-based drag-and-drop campaign builder using ReactFlow (v11.11.4) with custom node components for visual workflow design.

**Features**:
- **7 Custom Node Types**: Trigger, Email, Wait, Condition, Split, Action, Exit
- **Drag-and-Drop Canvas**: ReactFlow integration with grid background
- **Visual Connections**: Edge connections with validation
- **MiniMap & Controls**: Navigation and zoom controls
- **Toolbar**: Quick node addition with color-coded buttons
- **Real-Time Save**: Canvas state persistence

---

## Components

### 1. CampaignBuilder (Main Component)

```typescript
import { CampaignBuilder } from '@/components/campaigns/builder';

<CampaignBuilder
  campaignId="campaign-123"
  initialData={canvasData}
  onSave={(data) => console.log('Saved:', data)}
  readOnly={false}
/>
```

**Props**:
- `campaignId?: string` - Campaign ID (optional)
- `initialData?: CanvasData` - Initial canvas state
- `onSave?: (data: CanvasData) => void` - Save callback
- `readOnly?: boolean` - Read-only mode (default: false)

**Features**:
- Node state management (useNodesState, useEdgesState)
- Connection handling with validation
- Viewport persistence
- Keyboard shortcuts support

### 2. Node Components

#### TriggerNode (Entry Point)
**Color**: Emerald (#10b981)
**Icon**: Play, Calendar, Tag, TrendingUp, Webhook
**Handles**: 1 output (bottom)

**Types**: manual, new_contact, tag, score_threshold, webhook, scheduled

#### EmailNode (Send Email)
**Color**: Indigo (#6366f1)
**Icon**: Mail
**Badge**: Sparkles (if personalization enabled)
**Handles**: 1 input (top), 1 output (bottom)

**Config**: subject, body, personalization_enabled

#### WaitNode (Delay)
**Color**: Amber (#f59e0b)
**Icon**: Clock (duration) or Zap (event-based)
**Handles**: 1 input (top), 1 output (bottom)

**Types**: duration, until_event, until_time

#### ConditionNode (Branching)
**Color**: Violet (#8b5cf6)
**Icon**: GitBranch
**Handles**: 1 input (top), 2 outputs (bottom - Yes/No)

**Outputs**: true (left, green), false (right, red)

#### SplitNode (A/B Test)
**Color**: Fuchsia (#d946ef)
**Icon**: Split
**Badge**: "A/B" (if ab_test type)
**Handles**: 1 input (top), N outputs (bottom - one per variant)

**Config**: type (ab_test|random), variants array

#### ActionNode (Execute Action)
**Color**: Varies by type (cyan, orange, teal, slate, sky, rose)
**Icon**: Tag, TrendingUp, RefreshCw, Webhook, Zap, Bell
**Handles**: 1 input (top), 1 output (bottom)

**Types**: tag, score, field_update, webhook, segment, notification

#### ExitNode (End Point)
**Color**: Red (#ef4444)
**Icon**: Flag
**Handles**: 1 input (top), 0 outputs

**Config**: reason (optional exit message)

### 3. CampaignToolbar

Floating toolbar for adding nodes and saving.

**Buttons** (7 node types + Save):
- Trigger (emerald)
- Email (indigo)
- Wait (amber)
- Condition (violet)
- A/B Split (fuchsia)
- Action (cyan)
- Exit (red)
- Save (blue)

**Position**: Top-left panel (ReactFlow Panel component)

---

## Usage Examples

### Basic Setup

```typescript
'use client';

import { CampaignBuilder } from '@/components/campaigns/builder';
import { CanvasData } from '@/lib/models/social-drip-campaign';

export default function CampaignBuilderPage() {
  const [canvasData, setCanvasData] = useState<CanvasData>({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  });

  const handleSave = async (data: CanvasData) => {
    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvas_data: data }),
    });

    if (response.ok) {
      console.log('Campaign saved successfully');
    }
  };

  return (
    <div className="h-screen">
      <CampaignBuilder
        campaignId={campaignId}
        initialData={canvasData}
        onSave={handleSave}
      />
    </div>
  );
}
```

### Loading Existing Campaign

```typescript
import { SocialDripCampaign } from '@/lib/models/social-drip-campaign';

const campaign: SocialDripCampaign = await getCampaign(campaignId);

<CampaignBuilder
  campaignId={campaign.id}
  initialData={campaign.canvas_data}
  onSave={handleSave}
/>
```

### Read-Only Mode

```typescript
<CampaignBuilder
  campaignId={campaignId}
  initialData={campaign.canvas_data}
  readOnly={true}
/>
```

---

## Node Configuration

### Adding Node Data

When creating nodes, attach configuration to `data.config`:

```typescript
const emailNode: Node = {
  id: 'node_123',
  type: 'email',
  position: { x: 100, y: 100 },
  data: {
    label: 'Welcome Email',
    stepId: 'step-uuid',
    config: {
      subject: 'Welcome to {{company_name}}!',
      body: 'Hi {{first_name}}, welcome aboard!',
      personalization_enabled: true,
    },
  },
};
```

### Condition Node with Branches

```typescript
const conditionNode: Node = {
  id: 'node_condition_1',
  type: 'condition',
  position: { x: 200, y: 200 },
  data: {
    label: 'Check Email Opened',
    config: {
      branches: [
        {
          id: 'branch_true',
          condition: {
            type: 'event',
            event_type: 'email_opened',
            time_window: 24, // hours
          },
          target_node_id: 'node_next_yes',
          label: 'Opened',
        },
        {
          id: 'branch_false',
          condition: { type: 'default' },
          target_node_id: 'node_next_no',
          label: 'Not Opened',
        },
      ],
    },
  },
};
```

### A/B Split Node

```typescript
const splitNode: Node = {
  id: 'node_split_1',
  type: 'split',
  position: { x: 300, y: 300 },
  data: {
    label: 'A/B Test: Subject Lines',
    config: {
      type: 'ab_test',
      variants: [
        { id: 'variant_a', name: 'Short Subject', percentage: 50 },
        { id: 'variant_b', name: 'Long Subject', percentage: 50 },
      ],
    },
  },
};
```

---

## Edge Connections

### Connection Validation

ReactFlow handles connections automatically. Custom validation can be added:

```typescript
const isValidConnection = (connection: Connection) => {
  const { source, target, sourceHandle } = connection;

  // Prevent self-connections
  if (source === target) return false;

  // Validate handle compatibility
  // (e.g., condition "true" handle should only connect to specific nodes)

  return true;
};

<ReactFlow
  isValidConnection={isValidConnection}
  // ...
/>
```

### Edge Types

```typescript
const edge: Edge = {
  id: 'edge-1',
  source: 'node_1',
  target: 'node_2',
  sourceHandle: 'true', // For condition nodes
  type: 'smoothstep', // smoothstep | straight | step
  animated: false,
  label: 'Yes',
};
```

---

## Styling & Theming

### Node Colors

Defined in each node component:
- **Emerald**: Trigger (#10b981)
- **Indigo**: Email (#6366f1)
- **Amber**: Wait (#f59e0b)
- **Violet**: Condition (#8b5cf6)
- **Fuchsia**: Split (#d946ef)
- **Cyan/Orange/Teal/Slate/Sky/Rose**: Actions
- **Red**: Exit (#ef4444)

### Custom Styling

Modify node components in `src/components/campaigns/builder/nodes/*.tsx`:

```typescript
<div className="custom-node-class">
  {/* Node content */}
</div>
```

### Background Grid

```typescript
<Background
  variant={BackgroundVariant.Dots} // Dots | Lines | Cross
  gap={16}
  size={1}
  color="#cbd5e1"
/>
```

---

## Integration with Backend

### Saving Canvas Data

```typescript
const handleSave = async (data: CanvasData) => {
  await fetch(`/api/campaigns/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify({
      canvas_data: data,
      campaign_type: 'branching', // linear | branching | ab_test
    }),
  });
};
```

### Loading Canvas Data

```typescript
const campaign = await fetch(`/api/campaigns/${campaignId}`).then((r) => r.json());

<CampaignBuilder initialData={campaign.canvas_data} />
```

### Syncing with Steps

When saving, also update `campaign_steps` table:

```typescript
const syncStepsWithCanvas = async (campaignId: string, canvasData: CanvasData) => {
  // For each node in canvasData.nodes:
  for (const node of canvasData.nodes) {
    await upsertCampaignStep({
      campaign_id: campaignId,
      node_id: node.id,
      node_type: node.type,
      node_position: node.position,
      // ... other step data
    });
  }
};
```

---

## Keyboard Shortcuts

ReactFlow built-in shortcuts:
- **Delete**: Delete selected nodes/edges
- **Ctrl+A**: Select all
- **Ctrl+Z**: Undo (if implemented)
- **Ctrl+C/V**: Copy/paste (if implemented)

---

## Accessibility

All nodes have:
- **Semantic HTML**: Proper div structure
- **ARIA labels**: Screen reader support
- **Keyboard navigation**: Tab, arrow keys
- **Focus indicators**: Visual focus states

---

## Performance

### Optimization Tips

1. **Memoize Nodes**: All nodes use `memo()`
2. **Limit Nodes**: Recommend < 100 nodes per canvas
3. **Lazy Loading**: Load canvas on demand
4. **Debounce Save**: Delay save by 500ms

```typescript
const debouncedSave = useMemo(
  () => debounce((data: CanvasData) => onSave(data), 500),
  [onSave]
);
```

---

## Browser Compatibility

- **Chrome**: ✅ Full support
- **Firefox**: ✅ Full support
- **Safari**: ✅ Full support
- **Edge**: ✅ Full support
- **Mobile**: ⚠️ Limited (touch gestures work, but desktop recommended)

---

## Next Steps

1. ✅ Visual builder UI complete
2. ⏭️  Property panels for node configuration
3. ⏭️  Campaign workflow engine (execution logic)
4. ⏭️  Real-time collaboration (multi-user editing)

---

**Status**: ✅ COMPLETE
**Task**: Unite-Hub-ove.3.2
**Next**: Unite-Hub-ove.3.3 (Campaign Workflow Engine)

**Components Created**: 10 React components (7 nodes + 3 core)
**Lines of Code**: 800+ lines
**Dependencies**: ReactFlow v11.11.4
