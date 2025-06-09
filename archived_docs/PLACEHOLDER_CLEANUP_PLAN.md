# Placeholder Cleanup Action Plan

## Real Placeholders Found (NOT form field hints):

### 1. **Chart/Table Placeholders**
- `src/components/ai/AIGatewayDashboard.tsx` - "Chart placeholder"
- `src/components/analytics/AnalyticsDashboard.tsx` - Chart and Table placeholder components

### 2. **TODO Comments**
- `src/components/crm/NotesSection.tsx` - TODO: Implement note saving logic, TODO: Add notes list
- `src/components/crm/CallTimeline.tsx` - Placeholder for call duration

### 3. **Example Data**
- `src/components/dashboard/ActivityFeed.tsx` - example.com emails
- `src/app/[locale]/admin/page.tsx` - john.doe@example.com, jane.smith@example.com
- `src/components/crm/EmailTimeline.tsx` - /placeholder-avatar.jpg

### 4. **Mock Data Issues**
- Various components using hardcoded test data instead of real data

## Action Items:

1. Replace chart placeholders with real chart components
2. Implement TODO functionality or remove comments
3. Replace example.com with unite-group.com
4. Replace placeholder images with real avatars
5. Connect components to real data sources
