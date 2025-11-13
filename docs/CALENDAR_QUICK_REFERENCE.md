# Content Calendar - Quick Reference

## For Developers

### Database Schema
```typescript
// convex/schema.ts
contentCalendarPosts: defineTable({
  clientId: v.id("clients"),
  strategyId: v.optional(v.id("marketingStrategies")),
  scheduledDate: v.number(),
  platform: v.union(...), // 6 platforms
  postType: v.union(...), // 5 types
  contentPillar: v.string(),
  suggestedCopy: v.string(),
  suggestedHashtags: v.array(v.string()),
  suggestedImagePrompt: v.optional(v.string()),
  status: v.union(...), // 4 statuses
  aiReasoning: v.string(),
  // ... more fields
})
```

### Key Functions

#### Generate Calendar
```typescript
// API Route
POST /api/calendar/generate
Body: { clientId, startDate, endDate, platforms }

// Convex
await convex.mutation(api.contentCalendar.generateCalendar, {
  clientId,
  startDate,
  endDate,
  platforms
});

await convex.mutation(api.contentCalendar.batchCreatePosts, {
  posts: [...] // AI-generated posts
});
```

#### Get Posts
```typescript
// By Month
const posts = useQuery(api.contentCalendar.getCalendarPosts, {
  clientId,
  month: 1-12,
  year: 2025
});

// By Date Range
const posts = useQuery(api.contentCalendar.getPostsByDateRange, {
  clientId,
  startDate,
  endDate
});

// By Platform
const posts = useQuery(api.contentCalendar.getPostsByPlatform, {
  clientId,
  platform: "instagram",
  limit: 10
});
```

#### Update Post
```typescript
await updatePost({
  postId,
  suggestedCopy: "New copy",
  suggestedHashtags: ["new", "hashtags"],
  callToAction: "New CTA"
});
```

#### Approve Post
```typescript
await approvePost({ postId });
```

#### Regenerate Post
```typescript
POST /api/calendar/[postId]/regenerate
// AI generates fresh content
```

### Components

#### Calendar View
```tsx
<CalendarView
  posts={posts}
  onPostClick={handlePostClick}
  onApprove={handleApprove}
  onRegenerate={handleRegenerate}
  currentMonth={month}
  currentYear={year}
  onMonthChange={handleMonthChange}
/>
```

#### Post Card
```tsx
<CalendarPost
  post={post}
  onApprove={() => handleApprove(post._id)}
  onRegenerate={() => handleRegenerate(post._id)}
  onEdit={() => handleEdit(post)}
/>
```

#### Post Modal
```tsx
<PostDetailsModal
  post={selectedPost}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onApprove={handleApprove}
  onRegenerate={handleRegenerate}
  onUpdate={handleUpdate}
/>
```

### AI Prompting

#### System Prompt
```typescript
import { CONTENT_CALENDAR_SYSTEM_PROMPT } from "@/lib/claude/prompts";
```

#### User Prompt
```typescript
import { buildContentCalendarUserPrompt } from "@/lib/claude/prompts";

const prompt = buildContentCalendarUserPrompt({
  persona,
  strategy,
  businessContext: client.businessDescription,
  platforms: ["facebook", "instagram"],
  startDate: "2025-01-01",
  durationDays: 30,
  contentPillars: strategy.contentPillars,
  tier: "starter"
});
```

#### Call Claude
```typescript
const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 8000,
  system: CONTENT_CALENDAR_SYSTEM_PROMPT,
  messages: [{ role: "user", content: userPrompt }]
});
```

### Tier Limits

```typescript
import { TIER_LIMITS } from "@/convex/lib/permissions";

TIER_LIMITS.starter.calendarPosts; // 30
TIER_LIMITS.professional.calendarPosts; // 90
```

### Platform Colors

```typescript
const platformColors = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  tiktok: "#000000",
  linkedin: "#0A66C2",
  blog: "#6B7280",
  email: "#8B5CF6",
};
```

### Status Colors

```typescript
const statusColors = {
  suggested: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  published: "bg-purple-100 text-purple-800",
};
```

---

## For Product Managers

### Feature Summary
- AI generates 30-90 days of posts
- 6 platforms supported
- 5 content types
- Platform-optimized content
- Full editing capabilities
- Performance analytics

### User Workflows

1. **Generate**: Click button → AI creates calendar → 30-60 seconds
2. **Review**: Browse calendar/list → View post details
3. **Approve**: Review → Click approve → Ready to schedule
4. **Edit**: Click edit → Modify content → Save
5. **Regenerate**: Click regenerate → AI creates new version
6. **Track**: View analytics → See performance

### KPIs to Track
- Calendars generated per week
- Approval rate (target: 80%+)
- Regeneration rate (target: <20%)
- Time saved vs manual planning
- Engagement improvement

---

## For Designers

### Color System
- **Facebook**: #1877F2 (Blue)
- **Instagram**: #E4405F (Pink/Red)
- **TikTok**: #000000 (Black)
- **LinkedIn**: #0A66C2 (Blue)
- **Blog**: #6B7280 (Gray)
- **Email**: #8B5CF6 (Purple)

### Status Colors
- **Suggested**: Yellow (#FEF3C7 bg, #92400E text)
- **Approved**: Green (#D1FAE5 bg, #065F46 text)
- **Scheduled**: Blue (#DBEAFE bg, #1E40AF text)
- **Published**: Purple (#EDE9FE bg, #5B21B6 text)

### Component States
- Default
- Hover (subtle background change)
- Active (border highlight)
- Disabled (50% opacity)
- Loading (skeleton/spinner)

### Typography
- **Titles**: font-bold text-xl-3xl
- **Body**: text-sm-base
- **Labels**: text-xs-sm font-medium
- **Meta**: text-xs text-gray-600

---

## For QA

### Test Cases

#### Happy Path
1. Generate 30-day calendar → Success
2. View calendar grid → Shows all posts
3. Click post → Opens modal
4. Edit post → Saves changes
5. Approve post → Status updates
6. Regenerate post → New content

#### Edge Cases
1. No persona → Error message
2. No strategy → Error message
3. Tier limit exceeded → Clear error
4. AI failure → Graceful fallback
5. Empty calendar → Empty state
6. Network error → Retry option

#### Performance
1. 30 posts generate in <60s
2. Calendar renders in <2s
3. List view scrolls smoothly
4. Modal opens instantly
5. Filter updates in <500ms

---

## For Customer Success

### Common Questions

**Q: How long does generation take?**
A: 30-60 seconds for a full calendar

**Q: Can I edit AI-generated posts?**
A: Yes, all content is fully editable

**Q: What if I don't like a post?**
A: Click "Regenerate with AI" for a fresh version

**Q: How many platforms supported?**
A: 6 platforms: Facebook, Instagram, TikTok, LinkedIn, Blog, Email

**Q: What's the difference between tiers?**
A: Starter gets 30 days, Professional gets 90 days

**Q: Can I track performance?**
A: Yes, analytics show engagement and distribution

### Troubleshooting

**Issue**: Calendar won't generate
**Fix**: Ensure persona and strategy exist

**Issue**: Posts not relevant
**Fix**: Update persona and strategy, regenerate

**Issue**: Can't edit post
**Fix**: Refresh page, check browser console

---

## File Locations

```
D:\Unite-Hub\
├── convex/
│   ├── schema.ts (contentCalendarPosts table)
│   └── contentCalendar.ts (all functions)
├── lib/
│   └── claude/
│       └── prompts.ts (AI prompts)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── calendar/ (API routes)
│   │   └── dashboard/
│   │       └── calendar/
│   │           └── page.tsx (main page)
│   └── components/
│       └── calendar/ (all components)
└── docs/
    ├── CONTENT_CALENDAR_SPEC.md (full spec)
    ├── CONTENT_CALENDAR_USER_GUIDE.md (user guide)
    └── CALENDAR_QUICK_REFERENCE.md (this file)
```

---

## Quick Commands

```bash
# View schema
cat convex/schema.ts | grep -A 50 contentCalendarPosts

# View functions
cat convex/contentCalendar.ts

# View prompts
cat lib/claude/prompts.ts | grep -A 200 CONTENT_CALENDAR

# View components
ls src/components/calendar/

# View API routes
ls src/app/api/calendar/

# View docs
ls docs/ | grep CALENDAR
```

---

**Last Updated**: 2025-11-13
**Version**: 1.0.0
