# Landing Page Builder Components

## Overview

React components for the DIY Landing Page Builder feature. These components provide a complete interface for creating, editing, and optimizing landing page copy with AI assistance.

## Components

### ChecklistOverview

Grid view of all landing page checklists with filtering and actions.

**Props:**
- `checklists`: Array of checklist objects
- `onDelete?: (id: string) => void` - Delete handler
- `onDuplicate?: (id: string) => void` - Duplicate handler

**Features:**
- Grid layout with responsive design
- Progress indicators
- Status badges
- Quick actions (view, duplicate, delete)
- Empty state handling

### SectionCard

Individual section editor with expandable details.

**Props:**
- `section`: Section object with copy data
- `sectionIndex`: Number for ordering
- `onUpdate`: Update handler for section changes
- `onRegenerate`: AI regeneration handler
- `onToggleComplete`: Completion toggle handler

**Features:**
- Collapsible design
- Inline copy editing
- AI regeneration
- Alternative variations display
- Image prompt suggestions
- Completion checkbox

### CopyEditor

Inline copy editing interface with character/word counts.

**Props:**
- `headline?: string`
- `subheadline?: string`
- `bodyCopy?: string`
- `cta?: string`
- `onUpdate`: Save handler
- `isEditing`: Edit mode state
- `onToggleEdit`: Toggle edit mode

**Features:**
- Read/edit mode toggle
- Real-time character counting
- Word count for headlines
- Validation feedback

### ProgressBar

Visual progress tracking for checklist completion.

**Props:**
- `completed`: Number of completed sections
- `total`: Total sections
- `percentage`: Completion percentage

**Features:**
- Animated progress bar
- Stats display (completed/remaining/total)
- Status messages
- Visual completion indicator

### SEOOptimizer

SEO metadata editor with validation and tips.

**Props:**
- `seoData`: SEO metadata object
- `onUpdate`: Update handler

**Features:**
- Meta title optimization (50-60 chars)
- Meta description optimization (120-160 chars)
- Keyword management
- Open Graph tags
- Character count validation
- SEO tips and best practices

### DesignPreview

Visual preview of landing page with color scheme.

**Props:**
- `sections`: Array of sections
- `colorScheme?: ColorScheme` - Optional color palette
- `onExport`: Export handler

**Features:**
- Live preview of copy
- Color scheme visualization
- Export functionality
- Design tips

### CopyVariations

A/B testing variations display and selection.

**Props:**
- `variations`: Array of copy variations
- `onSelect`: Selection handler
- `onGenerateMore`: Generate more variations

**Features:**
- Tabbed variation display
- Side-by-side comparison
- One-click selection
- Generate more variations

### ExportModal

Export options dialog for different file formats.

**Props:**
- `isOpen`: Modal open state
- `onClose`: Close handler
- `onExport`: Export handler with options
- `checklistTitle`: Title for export

**Features:**
- Multiple format support (PDF, DOCX, HTML, Markdown)
- Customizable export options
- Selective content inclusion
- Format-specific settings

## Usage Example

```tsx
import { ChecklistOverview } from "@/components/landing-pages/ChecklistOverview";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function LandingPagesPage() {
  const checklists = useQuery(api.landingPages.listByClient, {
    clientId: "client_123"
  });

  const deleteChecklist = useMutation(api.landingPages.remove);

  const handleDelete = async (id: string) => {
    await deleteChecklist({ checklistId: id });
  };

  return (
    <ChecklistOverview
      checklists={checklists || []}
      onDelete={handleDelete}
    />
  );
}
```

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui component library
- Responsive design patterns
- Consistent spacing and typography
- Accessible color contrasts

## Accessibility

Components follow WCAG 2.1 AA guidelines:
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility

## Best Practices

1. **State Management**: Use Convex for real-time data synchronization
2. **Error Handling**: Always wrap mutations in try-catch blocks
3. **Loading States**: Show loading indicators during async operations
4. **Optimistic Updates**: Use optimistic UI updates for better UX
5. **Validation**: Validate input before submitting to API
6. **Toast Notifications**: Provide feedback for all user actions

## Integration Points

### With Personas
```tsx
const persona = useQuery(api.personas.get, { personaId });
// Use persona data to tailor copy generation
```

### With Marketing Strategy
```tsx
const strategy = useQuery(api.strategies.getActive, { clientId });
// Use strategy for messaging alignment
```

### With Hooks Library
```tsx
const hooks = useQuery(api.hooks.listByClient, { clientId });
// Reference proven hooks in copy
```

### With DALL-E
```tsx
// Generate images from section image prompts
const imageUrl = await generateImage(section.imagePrompt);
```

## Performance Considerations

1. **Lazy Loading**: Components use dynamic imports where appropriate
2. **Memoization**: Expensive computations are memoized
3. **Virtual Scrolling**: For large lists of sections
4. **Debouncing**: Auto-save with debouncing to reduce API calls
5. **Optimistic UI**: Immediate feedback before server confirmation

## Testing

Components should be tested for:
- Rendering with different props
- User interactions (clicks, typing)
- State changes
- Edge cases (empty states, errors)
- Accessibility compliance

## Future Enhancements

1. **Real-time Collaboration**: Multiple users editing simultaneously
2. **Version History**: Track and revert changes
3. **AI Suggestions**: Proactive improvement recommendations
4. **Template Library**: Pre-built section templates
5. **Analytics Integration**: Track performance metrics
