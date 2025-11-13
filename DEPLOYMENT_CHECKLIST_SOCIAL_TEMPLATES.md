# Social Templates - Deployment Checklist

## Pre-Deployment Verification

### 1. File Structure ✅
```
✅ 13 React components in src/components/social-templates/
✅ 10 API route files in src/app/api/social-templates/
✅ 815 lines in masterTemplates.ts (250+ templates)
✅ Schema updated with socialCopyTemplates table
✅ Convex functions file (socialTemplates.ts)
✅ 3 documentation files
```

### 2. Environment Variables
```bash
# Required
ANTHROPIC_API_KEY=your_key_here
CONVEX_DEPLOYMENT=your_deployment
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# Optional
RATE_LIMIT_TEMPLATES=100  # per hour
```

### 3. Dependencies
```json
{
  "@anthropic-ai/sdk": "latest",
  "convex": "latest",
  "next": "15.x",
  "react": "19.x"
}
```

## Deployment Steps

### Step 1: Deploy Schema
```bash
# Deploy Convex schema
npx convex deploy

# Verify deployment
npx convex dev
```

### Step 2: Test API Endpoints
```bash
# Test generation endpoint
curl -X POST http://localhost:3000/api/social-templates/generate \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","platform":"facebook","category":"promotional","count":5}'

# Test fetch endpoint
curl http://localhost:3000/api/clients/test/social-templates

# Test search endpoint
curl "http://localhost:3000/api/social-templates/search?clientId=test&query=product"
```

### Step 3: Verify Components
1. Navigate to `/dashboard/content/templates`
2. Verify template library loads
3. Click "Load Pre-Built Templates"
4. Verify 250+ templates appear
5. Test filters and search
6. Test AI generation
7. Test tone variations
8. Test platform previews

### Step 4: Load Master Templates
```typescript
// For each new client, seed templates
import { seedTemplatesForClient } from "@/lib/social-templates";

await seedTemplatesForClient(clientId);
// Should return 250+ templates
```

### Step 5: Test Claude AI Integration
```bash
# Test AI generation
curl -X POST http://localhost:3000/api/social-templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test",
    "platform": "instagram",
    "category": "promotional",
    "count": 10,
    "businessContext": "E-commerce fashion brand"
  }'

# Verify response contains templates with:
# - templateName
# - copyText
# - hashtags
# - emojiSuggestions
# - variations (3 tones)
# - performancePrediction
```

## Verification Tests

### Database Tests
```typescript
// Test 1: Create template
const templateId = await createTemplate({
  clientId: "test",
  platform: "facebook",
  category: "promotional",
  templateName: "Test Template",
  copyText: "Test copy text",
  hashtags: ["test"],
  emojiSuggestions: ["✅"],
  variations: [],
  performancePrediction: {
    estimatedReach: "1000-2000",
    estimatedEngagement: "5-8%",
    bestTimeToPost: "12-2 PM",
  },
  aiGenerated: false,
  tags: ["test"],
});

// Test 2: Fetch templates
const templates = await getTemplates({ clientId: "test" });
console.assert(templates.length > 0, "Templates should exist");

// Test 3: Search templates
const results = await searchTemplates({
  clientId: "test",
  query: "test",
});
console.assert(results.length > 0, "Search should return results");

// Test 4: Toggle favorite
const isFavorite = await toggleFavorite({ templateId });
console.assert(typeof isFavorite === "boolean", "Should return boolean");

// Test 5: Track usage
const usageCount = await trackUsage({ templateId });
console.assert(usageCount > 0, "Usage count should increment");

// Test 6: Delete template
await deleteTemplate({ templateId });
const deleted = await getTemplate({ templateId });
console.assert(deleted === null, "Template should be deleted");
```

### Component Tests
```typescript
// Test 1: TemplateLibrary renders
render(<TemplateLibrary clientId="test" />);
expect(screen.getByText("Social Copy Templates")).toBeInTheDocument();

// Test 2: Filters work
const platformFilter = screen.getByText("Facebook");
fireEvent.click(platformFilter);
// Verify filtered templates

// Test 3: Search works
const searchInput = screen.getByPlaceholderText("Search templates...");
fireEvent.change(searchInput, { target: { value: "product" } });
// Verify filtered results

// Test 4: Copy to clipboard works
const copyButton = screen.getByText("Copy");
fireEvent.click(copyButton);
// Verify copied to clipboard
```

### Performance Tests
```typescript
// Test 1: Load time
console.time("Load Templates");
await fetch(`/api/clients/test/social-templates`);
console.timeEnd("Load Templates");
// Should be < 1 second

// Test 2: Search performance
console.time("Search Templates");
await fetch(`/api/social-templates/search?clientId=test&query=product`);
console.timeEnd("Search Templates");
// Should be < 500ms

// Test 3: AI generation time
console.time("Generate Templates");
await fetch("/api/social-templates/generate", {
  method: "POST",
  body: JSON.stringify({
    clientId: "test",
    platform: "facebook",
    category: "promotional",
    count: 10,
  }),
});
console.timeEnd("Generate Templates");
// Should be < 30 seconds
```

## Post-Deployment Verification

### 1. Functional Tests
- [ ] Templates page loads without errors
- [ ] Pre-built templates load successfully (250+)
- [ ] AI generation works and returns valid templates
- [ ] Tone variations generate correctly
- [ ] Platform previews display accurately
- [ ] Character counter validates correctly
- [ ] Hashtag suggester works
- [ ] Search returns accurate results
- [ ] Filters work (platform, category, favorites)
- [ ] Export to CSV works
- [ ] Export to JSON works
- [ ] Bulk delete works
- [ ] Bulk favorite works
- [ ] Copy to clipboard works
- [ ] Usage tracking increments
- [ ] Stats dashboard displays correctly

### 2. Integration Tests
- [ ] Templates integrate with hooks library
- [ ] Templates integrate with social campaigns
- [ ] Templates adapt to personas
- [ ] Templates link to content calendar
- [ ] Templates work with DALL-E integration
- [ ] Usage tracking respects tier limits

### 3. UI/UX Tests
- [ ] Responsive design works on mobile
- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Success feedback shows
- [ ] Keyboard shortcuts work
- [ ] Accessibility (ARIA labels, keyboard nav)

### 4. Performance Tests
- [ ] Page load < 2 seconds
- [ ] Search results < 500ms
- [ ] Filter response < 200ms
- [ ] AI generation < 30 seconds
- [ ] No memory leaks
- [ ] Database queries optimized

### 5. Security Tests
- [ ] API key not exposed
- [ ] Input validation works
- [ ] SQL injection protected
- [ ] XSS protection enabled
- [ ] Rate limiting active
- [ ] Authentication checked

## Monitoring

### Metrics to Track
```typescript
// 1. Template usage
// - Most used templates
// - Platform distribution
// - Category distribution

// 2. AI generation
// - Generation success rate
// - Average generation time
// - API usage/costs

// 3. User engagement
// - Templates copied
// - Favorites added
// - Exports performed

// 4. Performance
// - Page load times
// - API response times
// - Error rates
```

### Alerts to Set Up
- API error rate > 5%
- AI generation failures > 10%
- Response time > 2 seconds
- Database queries > 1 second
- Rate limit exceeded

## Rollback Plan

### If Issues Occur
1. **Revert schema changes**
   ```bash
   npx convex rollback
   ```

2. **Disable AI generation**
   - Comment out Claude API calls
   - Use only pre-built templates

3. **Restore previous version**
   ```bash
   git revert HEAD
   git push
   ```

4. **Clear cache**
   - Clear browser cache
   - Clear Convex cache
   - Restart services

## Success Criteria

### Minimum Requirements
- ✅ 250+ templates loaded
- ✅ All API endpoints responding
- ✅ All components rendering
- ✅ AI generation working
- ✅ No console errors
- ✅ Page load < 3 seconds

### Optimal Performance
- ⭐ 250+ templates loaded
- ⭐ API response < 500ms
- ⭐ AI generation < 20 seconds
- ⭐ Page load < 1 second
- ⭐ Zero errors in production
- ⭐ 100% uptime

## Sign-Off

### Pre-Deployment
- [ ] Code review completed
- [ ] Tests passed
- [ ] Documentation reviewed
- [ ] Environment variables set
- [ ] Dependencies installed

### Deployment
- [ ] Schema deployed
- [ ] API routes deployed
- [ ] Components deployed
- [ ] Master templates loaded
- [ ] Verification tests passed

### Post-Deployment
- [ ] Functional tests passed
- [ ] Performance tests passed
- [ ] Security tests passed
- [ ] Monitoring configured
- [ ] Team notified

---

**Deployment Status**: Ready for Production ✅

**Deployed By**: _________________

**Date**: _________________

**Verified By**: _________________

**Date**: _________________
