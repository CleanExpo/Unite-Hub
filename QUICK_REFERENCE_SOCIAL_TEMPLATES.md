# Social Templates - Quick Reference Card

## 🚀 Getting Started (3 Steps)

1. **Navigate**: `/dashboard/content/templates`
2. **Load Templates**: Click "Load Pre-Built Templates (250+)"
3. **Start Using**: Browse, search, copy, and customize!

---

## 📱 Platform Overview

| Platform | Max | Optimal | Templates | Best Time |
|----------|-----|---------|-----------|-----------|
| 📘 Facebook | 63,206 | 250 | 50+ | 1-3 PM weekdays |
| 📷 Instagram | 2,200 | 125 | 50+ | 11 AM-1 PM |
| 🎵 TikTok | 2,200 | 150 | 50+ | 7-9 PM |
| 💼 LinkedIn | 3,000 | 150 | 50+ | 8-10 AM Tue-Thu |
| 🐦 Twitter | 280 | 240 | 50+ | 12-2 PM |

---

## 🎯 10 Template Categories

1. 💰 **Promotional** - Sales, offers, launches
2. 📚 **Educational** - Tips, guides, how-tos
3. 💬 **Engagement** - Polls, questions, interactive
4. 🎨 **Brand Story** - Mission, values, culture
5. 👥 **User Generated** - Testimonials, features
6. 🎬 **Behind Scenes** - Process, team, workspace
7. 🚀 **Product Launch** - New releases, limited editions
8. 🎄 **Seasonal** - Holidays, events, time-sensitive
9. ⭐ **Testimonial** - Reviews, success stories
10. 📝 **How To** - Tutorials, instructions

---

## 🎨 7 Tone Variations

1. 💼 **Professional** - Formal, authoritative
2. 😊 **Casual** - Friendly, conversational
3. ✨ **Inspirational** - Uplifting, motivating
4. 😄 **Humorous** - Fun, entertaining
5. ⚡ **Urgent** - Time-sensitive, action-driven
6. 📖 **Educational** - Informative, teaching
7. ❤️ **Emotional** - Heartfelt, connecting

---

## 🔧 Key Features

### Browse & Filter
- Filter by platform
- Filter by category
- Search by keyword
- Sort by various criteria
- Show favorites only

### Generate & Customize
- AI-powered generation
- Edit copy text
- Modify hashtags
- Change emojis
- Update CTAs

### Preview & Export
- Platform-specific previews
- Copy to clipboard
- Export CSV
- Export JSON
- Bulk operations

---

## 📊 API Endpoints

### Core Operations
```typescript
// Generate AI templates
POST /api/social-templates/generate

// Get all templates
GET /api/clients/:id/social-templates

// Search templates
GET /api/social-templates/search

// Get single template
GET /api/social-templates/:id

// Update template
PUT /api/social-templates/:id

// Delete template
DELETE /api/social-templates/:id
```

### Advanced Operations
```typescript
// Toggle favorite
POST /api/social-templates/:id/favorite

// Generate variations
POST /api/social-templates/:id/variations

// Duplicate template
POST /api/social-templates/:id/duplicate

// Track usage
POST /api/social-templates/:id/track-usage

// Export templates
POST /api/social-templates/export

// Bulk operations
POST /api/social-templates/bulk

// Get statistics
GET /api/social-templates/stats

// Seed templates
POST /api/clients/:id/social-templates/seed
```

---

## 💻 Quick Code Examples

### Generate Templates
```typescript
const response = await fetch("/api/social-templates/generate", {
  method: "POST",
  body: JSON.stringify({
    clientId: "your-client-id",
    platform: "instagram",
    category: "promotional",
    count: 10,
    businessContext: "E-commerce fashion brand",
  }),
});
```

### Fetch Templates
```typescript
const response = await fetch(
  `/api/clients/${clientId}/social-templates?platform=instagram&category=promotional`
);
const data = await response.json();
```

### Generate Variations
```typescript
const response = await fetch(`/api/social-templates/${templateId}/variations`, {
  method: "POST",
  body: JSON.stringify({
    tones: ["professional", "casual", "inspirational"],
  }),
});
```

### Search Templates
```typescript
const response = await fetch(
  `/api/social-templates/search?clientId=${clientId}&query=product+launch`
);
```

### Export Templates
```typescript
const response = await fetch("/api/social-templates/export", {
  method: "POST",
  body: JSON.stringify({
    clientId,
    format: "csv", // or "json"
  }),
});
```

---

## 🎯 Component Usage

### Template Library
```tsx
import { TemplateLibrary } from "@/components/social-templates";

<TemplateLibrary clientId={clientId} />
```

### Template Card
```tsx
import { TemplateCard } from "@/components/social-templates";

<TemplateCard
  template={template}
  onFavorite={handleFavorite}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onCopy={handleCopy}
  onViewVariations={handleVariations}
/>
```

### Platform Preview
```tsx
import { CopyPreview } from "@/components/social-templates";

<CopyPreview
  platform="instagram"
  copyText="Check out our new product!"
  hashtags={["product", "new"]}
  emojis={["✨", "🎉"]}
/>
```

---

## 🔍 Search Operators

```
keyword                    # Simple search
"exact phrase"            # Exact match
hashtag:product           # Search hashtags
platform:instagram        # Filter by platform
category:promotional      # Filter by category
favorite:true            # Favorites only
```

---

## ⚡ Keyboard Shortcuts

```
Ctrl/Cmd + K             # Focus search
Ctrl/Cmd + F             # Open filters
Ctrl/Cmd + N             # New template
Ctrl/Cmd + E             # Edit selected
Ctrl/Cmd + D             # Delete selected
Ctrl/Cmd + C             # Copy template
Esc                      # Close modals
```

---

## 📈 Performance Tips

1. **Batch Generation**: Generate 5-10 templates at a time
2. **Use Filters**: Narrow results before searching
3. **Export Smart**: Export specific templates vs all
4. **Cache Favorites**: Mark frequently used templates
5. **Track Usage**: Monitor what works best

---

## 🚨 Troubleshooting

### Templates Not Loading
```typescript
// Check client ID
console.log(clientId);

// Check API response
const response = await fetch(`/api/clients/${clientId}/social-templates`);
console.log(await response.json());
```

### AI Generation Failing
```typescript
// Check API key
console.log(process.env.ANTHROPIC_API_KEY ? "Set" : "Missing");

// Test with smaller count
await fetch("/api/social-templates/generate", {
  method: "POST",
  body: JSON.stringify({ clientId, platform: "facebook", category: "promotional", count: 1 }),
});
```

### Character Count Issues
```typescript
// Accurate emoji counting
function getCharacterCount(text: string): number {
  const emojiRegex = /[\p{Emoji}]/gu;
  const emojiCount = (text.match(emojiRegex) || []).length;
  return text.length + emojiCount; // Emojis = 2 chars
}
```

---

## 📚 Documentation Links

- **Full Spec**: `/docs/SOCIAL_TEMPLATES_SPEC.md`
- **Integration Guide**: `/docs/SOCIAL_TEMPLATES_INTEGRATION.md`
- **Main README**: `/README_SOCIAL_TEMPLATES.md`
- **Deployment**: `/DEPLOYMENT_CHECKLIST_SOCIAL_TEMPLATES.md`

---

## 🎓 Best Practices

### Content Creation
1. ✅ Use platform-appropriate character counts
2. ✅ Match tone to platform (casual for TikTok, professional for LinkedIn)
3. ✅ Include clear CTAs
4. ✅ Use relevant hashtags (10-15 for Instagram, 1-2 for Twitter)
5. ✅ Add emojis strategically (3-5 for Instagram, 2-3 for Facebook)

### Template Management
1. ✅ Favorite your best performers
2. ✅ Track usage to identify top templates
3. ✅ Generate variations for A/B testing
4. ✅ Export regularly for backup
5. ✅ Update templates based on performance

### AI Generation
1. ✅ Provide detailed business context
2. ✅ Specify target audience
3. ✅ Define brand voice
4. ✅ Generate in batches (5-10)
5. ✅ Review and customize outputs

---

## 💡 Pro Tips

1. **Seasonal Prep**: Generate holiday templates 2-3 weeks early
2. **A/B Testing**: Use tone variations to test what resonates
3. **Batch Export**: Export all templates monthly for backup
4. **Tag System**: Use consistent tags for easy filtering
5. **Performance Tracking**: Monitor which platforms/categories work best

---

## 📊 Success Metrics

### Template Performance
- **Usage Count**: How often template is copied
- **Engagement Rate**: Predicted vs actual engagement
- **Reach**: Estimated vs actual reach
- **Best Times**: Validate posting time recommendations

### Platform Distribution
- **Most Used Platform**: Which platform gets most content
- **Category Balance**: Ensure variety across categories
- **Tone Analysis**: Which tones perform best per platform

---

## 🔗 Quick Links

| Link | URL |
|------|-----|
| Templates Page | `/dashboard/content/templates` |
| API Docs | `/docs/SOCIAL_TEMPLATES_SPEC.md` |
| Integration Guide | `/docs/SOCIAL_TEMPLATES_INTEGRATION.md` |
| Support | `support@unite-hub.com` |

---

## ✅ Quick Checklist

### Daily Tasks
- [ ] Check template stats
- [ ] Review most used templates
- [ ] Generate new variations as needed
- [ ] Export templates for backup

### Weekly Tasks
- [ ] Analyze performance metrics
- [ ] Update underperforming templates
- [ ] Generate seasonal content
- [ ] Review and favorite best templates

### Monthly Tasks
- [ ] Full export for backup
- [ ] Performance analysis report
- [ ] Generate next month's content
- [ ] Clean up unused templates

---

**Version**: 1.0.0
**Last Updated**: January 13, 2025
**Status**: Production Ready ✅
