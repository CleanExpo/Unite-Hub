# HotLeadsPanel Component

A beautiful, production-ready React component that displays AI-detected hot leads with real-time analysis capabilities.

## Features

- ⚡ **Real-time Hot Lead Detection** - Automatically fetches and displays high-priority contacts
- 🔄 **One-Click Refresh** - Re-analyze entire workspace with a single button
- 📊 **Rich Visual Indicators** - Progress bars, badges, and color-coded metrics
- 💡 **AI-Powered Insights** - Shows engagement score, intent, stage, sentiment
- 🎯 **Actionable Recommendations** - Displays next best action for each lead
- ⚠️ **Risk & Opportunity Signals** - Visual indicators of concerns and opportunities
- 🎨 **Beautiful Dark UI** - Matches modern SaaS aesthetic

## Installation

The component is already created at:
```
src/components/HotLeadsPanel.tsx
```

## Usage

### Basic Implementation

```tsx
import { HotLeadsPanel } from "@/components/HotLeadsPanel";

export default function Dashboard() {
  const workspaceId = "your-workspace-id";

  return (
    <div>
      <HotLeadsPanel workspaceId={workspaceId} />
    </div>
  );
}
```

### Full Dashboard Example

A complete dashboard page is available at:
```
src/app/dashboard/intelligence/page.tsx
```

Visit: http://localhost:3006/dashboard/intelligence

## Component Props

```typescript
interface HotLeadsPanelProps {
  workspaceId: string;  // Required - The workspace to analyze
}
```

## Component Features

### 1. Auto-Load on Mount
- Automatically fetches hot leads when component mounts
- Shows loading spinner during initial fetch

### 2. Refresh Analysis
- Button to trigger workspace-wide analysis
- Analyzes up to 10 contacts
- Shows "Analyzing..." state with spinner
- Auto-refreshes hot leads after analysis

### 3. Lead Cards

Each lead card displays:

#### Header
- Contact name and job title
- Company name
- Composite score badge (yellow highlight)

#### Key Indicators (4-column grid)
- **Intent**: high/medium/low/unknown
- **Stage**: awareness/consideration/decision/unknown
- **Role**: decision_maker/influencer/end_user/unknown
- **Sentiment**: Color-coded score (-50 to +100)
  - Green: > 50
  - Yellow: 0-50
  - Red: < 0

#### AI Score Progress
- Visual progress bar
- Score out of 100
- Shows engagement level

#### Recommended Action
- Blue-highlighted box
- AI-generated next best action
- Actionable recommendation

#### Signals Grid
- **Opportunities** (green box)
  - Shows top 2 positive signals
  - Indicates deal drivers

- **Risks** (amber box)
  - Shows top 2 risk signals
  - Highlights concerns

#### Action Buttons
- **Send Email** - Primary action
- **View Details** - Secondary action

### 4. Empty State
Shows helpful message when no hot leads exist yet.

## API Integration

The component makes two API calls:

### 1. Get Hot Leads
```typescript
POST /api/agents/contact-intelligence
{
  "action": "get_hot_leads",
  "workspaceId": "uuid"
}
```

### 2. Analyze Workspace
```typescript
POST /api/agents/contact-intelligence
{
  "action": "analyze_workspace",
  "workspaceId": "uuid"
}
```

## Styling

The component uses:
- **Tailwind CSS** for styling
- **shadcn/ui** components (Card, Badge, Button, Progress)
- **lucide-react** icons
- **Dark theme** with slate colors

### Color Scheme
- Background: `slate-800`
- Borders: `slate-700`/`slate-600`
- Text: `white`/`slate-400`
- Accent: `yellow-400` (hot leads)
- Success: `green-400`
- Warning: `amber-400`
- Info: `blue-400`

## State Management

The component uses React hooks:

```typescript
const [hotLeads, setHotLeads] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [refreshing, setRefreshing] = useState(false);
```

## Responsive Design

- **Desktop** (>= 1024px): Full 4-column indicator grid
- **Tablet** (768-1023px): Adapts to 2 columns
- **Mobile** (< 768px): Stacks vertically

## Customization

### Change Theme Colors

```tsx
<Card className="bg-purple-800 border-purple-700">
  {/* Custom color scheme */}
</Card>
```

### Adjust Hot Lead Threshold

Currently shows leads with composite score >= 70.
To change, modify the backend:

```typescript
// In src/lib/agents/contact-intelligence.ts
export async function getHotLeads(workspaceId: string, limit = 10) {
  const scored = contacts
    .filter((c) => c.compositeScore >= 80)  // Change threshold
    .slice(0, limit);
}
```

### Add Custom Actions

```tsx
<Button
  size="sm"
  onClick={() => scheduleCall(lead)}
  className="flex-1"
>
  Schedule Call
</Button>
```

## Performance Considerations

### Caching
- Component doesn't cache results
- Consider adding React Query or SWR for caching

```tsx
import { useQuery } from '@tanstack/react-query';

const { data: hotLeads, isLoading } = useQuery({
  queryKey: ['hotLeads', workspaceId],
  queryFn: () => fetchHotLeads(workspaceId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Polling
Add auto-refresh every 5 minutes:

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    loadHotLeads();
  }, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, [workspaceId]);
```

## Error Handling

Currently logs errors to console. Enhance with toast notifications:

```tsx
import { toast } from "sonner";

const loadHotLeads = async () => {
  try {
    // ... fetch logic
  } catch (error) {
    toast.error("Failed to load hot leads");
    console.error(error);
  }
};
```

## Accessibility

Improvements to consider:

```tsx
<Button
  aria-label="Refresh hot leads analysis"
  onClick={refreshAnalysis}
>
  Refresh Analysis
</Button>

<div role="region" aria-label="Hot leads list">
  {hotLeads.map((lead) => (
    <article key={lead.id} aria-label={`Lead: ${lead.name}`}>
      {/* Lead card content */}
    </article>
  ))}
</div>
```

## Testing

### Unit Tests (Jest + React Testing Library)

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { HotLeadsPanel } from './HotLeadsPanel';

test('loads and displays hot leads', async () => {
  render(<HotLeadsPanel workspaceId="test-id" />);

  await waitFor(() => {
    expect(screen.getByText(/Sarah Chen/i)).toBeInTheDocument();
  });
});

test('triggers refresh analysis', async () => {
  const { getByText } = render(<HotLeadsPanel workspaceId="test-id" />);

  const refreshButton = getByText('Refresh Analysis');
  fireEvent.click(refreshButton);

  expect(getByText('Analyzing...')).toBeInTheDocument();
});
```

## Integration Examples

### With Authentication

```tsx
import { useSession } from "next-auth/react";
import { HotLeadsPanel } from "@/components/HotLeadsPanel";

export default function Dashboard() {
  const { data: session } = useSession();

  if (!session) {
    return <div>Please sign in</div>;
  }

  return <HotLeadsPanel workspaceId={session.user.workspaceId} />;
}
```

### With Workspace Context

```tsx
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { HotLeadsPanel } from "@/components/HotLeadsPanel";

export default function Dashboard() {
  const { currentWorkspace } = useWorkspace();

  return <HotLeadsPanel workspaceId={currentWorkspace.id} />;
}
```

### Side-by-Side with Other Panels

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <HotLeadsPanel workspaceId={workspaceId} />
  <ContactListPanel workspaceId={workspaceId} />
</div>
```

## Dependencies

Required packages (already installed):
- `react` - Core React library
- `lucide-react` - Icons
- `@radix-ui/react-*` - UI components (via shadcn/ui)

## Troubleshooting

### "No hot leads yet" shown despite having contacts

1. Ensure contacts have been analyzed:
```bash
curl -X POST http://localhost:3006/api/agents/contact-intelligence \
  -H "Content-Type: application/json" \
  -d '{"action": "analyze_workspace", "workspaceId": "your-id"}'
```

2. Check composite score threshold
   - Leads need score >= 70 to appear
   - Review scoring algorithm in `getHotLeads()`

### Component not loading

1. Verify API endpoint is accessible
2. Check browser console for errors
3. Ensure workspace ID is valid
4. Verify authentication (if required)

### Styling issues

1. Ensure Tailwind CSS is configured
2. Check all shadcn/ui components are installed:
```bash
npx shadcn-ui@latest add card badge button progress
```

## Future Enhancements

Planned improvements:
- [ ] Infinite scroll for many leads
- [ ] Filter by intent/stage/role
- [ ] Sort by different metrics
- [ ] Export to CSV
- [ ] Bulk actions (email multiple leads)
- [ ] Lead activity timeline
- [ ] Integration with email client
- [ ] Mobile-optimized view
- [ ] Real-time updates via WebSocket
- [ ] Lead comparison view

## License

Part of Unite-Hub - Internal use only
