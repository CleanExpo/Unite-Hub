# Web Scraper Dashboard Guide

Complete UI for discovering URLs, scraping content, and extracting data for article research.

## Accessing the Dashboard

Navigate to: `/scraper?workspaceId=YOUR_WORKSPACE_ID`

**Required:** Workspace ID must be passed as query parameter

## Dashboard Views

### 1. Projects List (Home View)

Shows all your scraping projects with status indicators.

**Features:**
- Projects displayed as cards in a grid (3 columns on desktop)
- Real-time status updates (pending, searching, scraping, extracting, completed, failed)
- Progress bars showing URL discovery/scraping progress
- Statistics: URLs found, scraped, failed
- Quick actions: View Details, Delete

**Status Colors:**
- 🔵 Pending: Blue
- 🟣 Searching URLs: Purple
- 🟡 Scraping: Yellow
- 🔷 Extracting Data: Cyan
- 🟢 Completed: Green
- 🔴 Failed: Red

**Empty State:**
- Displays when no projects exist
- CTA to create first project

### 2. Create Project Form

Form to create a new scraping project.

**Fields:**

| Field | Required | Notes |
|-------|----------|-------|
| Project Name | Yes | Display name for the project |
| Description | No | Optional context about what you're researching |
| Seed URL | Yes | Starting domain (e.g., openai.com) |
| Keywords | Yes (1-5) | Search terms to find related URLs |
| Max URLs | No | Default 20, range 5-50 |
| Include Images | No | Extract images from pages (default: true) |
| Extract Pricing | No | Parse pricing models (default: true) |

**Keyword Tips:**
- Be specific: "AI pricing models" > "AI"
- 2-5 keywords optimal
- Press Enter or click Add to add keywords
- Click X to remove keywords

**Time Estimates:**
- 5-10 URLs: 3-5 minutes
- 10-20 URLs: 5-10 minutes
- 20-50 URLs: 10-20 minutes

### 3. Project Detail View

Full project status and results dashboard (visible after creation).

#### Overview Tab
**Shows:**
- Project configuration (seed URL, keywords)
- Current status & progress
- Real-time progress bar while processing
- Error messages if scraping failed
- Summary statistics (products, pricing, images found)

#### Products Tab
**Shows:**
- All extracted products in a grid
- Product details:
  - Name, description
  - Price & currency
  - Product image
  - Features list
  - Link to source

**Actions:**
- Click product card to view full details
- Hover for emphasis

#### Pricing Tab
**Shows:**
- Pricing models in a table format
- Columns: Plan Name, Price, Features
- All pricing tiers from scraped pages
- Easy comparison between different plans

#### Images Tab
**Shows:**
- Gallery of all extracted images
- Categorized by type: product, feature, logo, other
- Alt text when available
- Hover zoom effect

#### Article Tab
**Shows:**
- Generated article outline
- Structure with suggested sections
- Key highlights extracted from data
- Sources for each section
- Call-to-action
- Export options (Markdown, PDF)

## Key Features

### Real-Time Progress Tracking

While a project is running:
- Live progress bar updates
- Current stage indicator (searching URLs, scraping, extracting)
- Current/total count
- Updates every 3 seconds via polling

### Design System Integration

**Color Scheme:**
- Dark theme (#08090a base, #0f1012 raised)
- Orange accent (#ff6b35)
- Semantic colors (green success, red error, blue info)

**Typography:**
- Heading hierarchy for visual organization
- Color-coded text (primary, secondary, muted)
- Font sizes responsive to viewport

**Spacing:**
- Consistent padding/gaps
- Responsive breakpoints (mobile, tablet, desktop)
- Visual separation with borders and dividers

### Multi-Device Support

- **Mobile:** Single column layouts, touch-optimized buttons
- **Tablet:** 2-column grids, readable text
- **Desktop:** 3+ column grids, full feature set

## Workflows

### Create & Run a Project

1. Click **+ New Project** (top right of list view)
2. Fill in project details:
   - Name: "AI Tools Pricing"
   - Seed URL: "openai.com"
   - Keywords: ["AI pricing", "API costs", "model comparison"]
   - Max URLs: 20
3. Click **Start Scraping**
4. Monitor progress in real-time
5. Results appear automatically when completed

### View & Use Results

1. Projects automatically appear in list view
2. Click **View Results** when completed
3. Browse tabs:
   - **Products:** Copy product details for article
   - **Pricing:** Create comparison tables
   - **Images:** Embed product screenshots
   - **Article:** Use pre-generated outline

### Export Content

1. Go to Project > Article tab
2. Click export buttons:
   - **Copy as Markdown:** Use in your editor
   - **Download as PDF:** Save for reference

### Delete a Project

1. Find project in list
2. Click **Delete** button
3. Confirm deletion
4. Project removed from dashboard

## Component Structure

```
ScraperDashboard (main container)
├── Header
│   ├── Title
│   └── + New Project button
│
├── View: Projects List
│   └── ScraperProjectsList
│       └── ProjectCards (grid)
│           ├── Status badge
│           ├── Keywords
│           ├── Stats (URLs found, scraped, failed)
│           ├── Progress bar
│           └── Actions (View Details, Delete)
│
├── View: Create Form
│   └── ScraperCreateForm
│       ├── Project Name input
│       ├── Description textarea
│       ├── Seed URL input
│       ├── Keywords manager
│       ├── Max URLs slider
│       ├── Options (Images, Pricing)
│       ├── Time estimate display
│       └── Submit/Cancel buttons
│
└── View: Project Detail
    └── ScraperProjectDetail
        ├── Header (title, status, back button)
        ├── Status bar (status, URLs found, scraped, failed)
        ├── Progress bar (if processing)
        ├── Tabs:
        │   ├── Overview (config + summary)
        │   ├── Products (product grid)
        │   ├── Pricing (pricing table)
        │   ├── Images (image gallery)
        │   └── Article (outline + export)
        └── Delete button
```

## Data Flow

```
User Input (Form)
    ↓
POST /api/scraper/projects
    ↓
universalScrapeProject()
    ├─ discoverURLs() → 20 URLs
    ├─ scrapeBatch() → Raw HTML
    ├─ extractDataFromHTML() → Structured data
    └─ aggregateResults() → Combined results
    ↓
GET /api/scraper/projects/[id] (polling every 3s)
    ↓
Status updates → Progress bar
    ↓
Results available → Display in tabs
```

## States & Transitions

```
List View
├─ Empty (no projects) → Create new
├─ With Projects → Click to view details
│   ├─ Pending
│   ├─ Searching URLs
│   ├─ Scraping
│   ├─ Extracting Data
│   └─ Completed ← Show tabs with results
└─ Failed (error state)

Create Form
├─ Fill form
├─ Validate inputs
├─ Submit → Loading state
└─ Success → Detail view

Detail View
├─ Processing (Overview only + progress)
├─ Completed (All tabs visible)
│   ├─ Overview (summary)
│   ├─ Products (grid)
│   ├─ Pricing (table)
│   ├─ Images (gallery)
│   └─ Article (outline + export)
└─ Failed (error message + retry option)
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "No workspace ID" | Missing query parameter | Add `?workspaceId=YOUR_ID` to URL |
| "Keyword already added" | Duplicate keyword | Remove and re-add |
| "Maximum 5 keywords" | Too many keywords | Remove some keywords |
| Scraping fails | Website blocked/timeout | Check seed URL, retry |
| 0 URLs discovered | Bad keywords | Try more specific keywords |
| "Failed to create project" | Form validation error | Check all required fields |

## Performance

| Operation | Time | Details |
|-----------|------|---------|
| Create form load | <1s | Client-side |
| URL discovery | 30-60s | Exa search + patterns |
| Batch scraping | 2-5 min | 10-15 URLs/min |
| Data extraction | 3-10 min | Claude + HTML parsing |
| Aggregation | 1 min | Combine & analyze |
| **Total** | **7-20 min** | For 20 URLs |

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter (in keyword field) | Add keyword |
| Escape (in form) | Cancel |
| Ctrl+C (on results) | Copy to clipboard |

## API Integration

Dashboard communicates via REST API:

**Endpoints Used:**

```bash
# List projects
GET /api/scraper/projects?workspaceId={id}

# Create project
POST /api/scraper/projects?workspaceId={id}
Body: {
  name, description, seedUrl, keywords,
  maxUrlsToScrape, includeImages, includePricing
}

# Get project status + results
GET /api/scraper/projects/{id}?workspaceId={id}

# Delete project
DELETE /api/scraper/projects/{id}?workspaceId={id}
```

## Tips & Tricks

### Best Practices

✅ Use specific keywords (3-5 words)
✅ Choose well-known sites as seed URLs
✅ Start with 10-15 URLs for quick results
✅ Use article outline to structure writing
✅ Export markdown for easy editing

### Common Use Cases

**Competitive Analysis:**
- Seed: competitor.com
- Keywords: ["pricing", "features", "products"]
- Use: Create comparison article

**Product Research:**
- Seed: techcrunch.com
- Keywords: ["new AI tools 2024", "product launches"]
- Use: Market analysis article

**Pricing Intelligence:**
- Seed: g2.com
- Keywords: ["SaaS pricing", "plan comparison"]
- Use: Pricing guide article

**Feature Benchmarking:**
- Seed: capterra.com
- Keywords: ["software features", "capabilities"]
- Use: Feature comparison table

## Troubleshooting

**Dashboard not loading:**
- Verify workspace ID in URL
- Check browser console for errors
- Try refreshing page

**Projects not showing:**
- Wait a few seconds for data load
- Check network tab for API errors
- Verify workspace has projects

**Scraping incomplete:**
- Check for error message in project
- Seed URL may be blocked
- Try reducing max URLs
- Check Bright Data API key

**No products/pricing extracted:**
- Website structure may vary
- Try different seed URL
- Reduce max URLs for debug
- Check extraction in detail view

## Future Enhancements

- [ ] Scheduled recurring scrapes
- [ ] Custom extraction rules
- [ ] Multi-language support
- [ ] Direct article generation
- [ ] Competitor alerts
- [ ] Advanced filtering/search
- [ ] Batch project creation
- [ ] API rate limit dashboard
- [ ] Data visualization charts
