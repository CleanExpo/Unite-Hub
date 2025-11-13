# Competitor Analysis System - Technical Specification

## Overview

The Competitor Analysis system is a **Professional tier feature** that enables agencies to track competitors, run AI-powered competitive analysis, and discover market opportunities for their clients.

## Features

### 1. Competitor Management
- Add competitors manually with detailed information
- Track up to **3 competitors** on Starter tier, **10 on Professional**
- Categorize competitors: Direct, Indirect, or Potential
- Store competitor data including:
  - Basic info (name, website, description)
  - Strengths and weaknesses
  - Pricing model and range
  - Target audience segments
  - Marketing channels used
  - Content strategy
  - Social media presence
  - Logo and screenshots

### 2. AI-Powered Analysis
- Comprehensive competitive intelligence using Claude AI
- Analyzes all competitors together for holistic insights
- Generates:
  - Market gaps and opportunities
  - Differentiation strategies
  - SWOT analysis
  - Pricing analysis and recommendations
  - Content gaps
  - Actionable insights with priority levels

### 3. Visualization & Reports
- SWOT quadrant visualization
- Side-by-side competitor comparison matrix
- Market gaps panel with opportunity mapping
- Differentiation opportunities with effort/impact matrix
- Priority-based actionable insights
- Export functionality (JSON format)

### 4. Integration Points
- Links to client personas for audience overlap analysis
- References marketing strategy for positioning context
- Connects to social templates for competitive content
- Integrates with content calendar for timing strategies

## Database Schema

### `competitors` Table
```typescript
{
  _id: Id<"competitors">,
  clientId: Id<"clients">,
  competitorName: string,
  website: string,
  description: string,
  category: "direct" | "indirect" | "potential",
  strengths: string[],
  weaknesses: string[],
  pricing?: {
    model: string,
    range: string
  },
  targetAudience: string[],
  marketingChannels: string[],
  contentStrategy?: string,
  socialPresence: {
    facebook?: string,
    instagram?: string,
    linkedin?: string,
    tiktok?: string,
    twitter?: string
  },
  logoUrl?: string,
  screenshots: string[],
  lastAnalyzed: number,
  createdAt: number,
  updatedAt: number
}
```

**Indexes:**
- `by_client`: `[clientId]`
- `by_category`: `[category]`
- `by_client_and_category`: `[clientId, category]`

### `competitorAnalyses` Table
```typescript
{
  _id: Id<"competitorAnalyses">,
  clientId: Id<"clients">,
  analysisDate: number,
  competitorsAnalyzed: Id<"competitors">[],
  marketGaps: Array<{
    gap: string,
    opportunity: string,
    priority: "high" | "medium" | "low"
  }>,
  differentiationOpportunities: Array<{
    area: string,
    recommendation: string,
    effort: "low" | "medium" | "high",
    impact: "low" | "medium" | "high"
  }>,
  pricingAnalysis: {
    marketAverage: string,
    yourPosition: string,
    recommendation: string
  },
  swotAnalysis: {
    strengths: string[],
    weaknesses: string[],
    opportunities: string[],
    threats: string[]
  },
  contentGaps: Array<{
    topic: string,
    competitorCoverage: string,
    yourCoverage: string,
    recommendation: string
  }>,
  actionableInsights: Array<{
    insight: string,
    action: string,
    priority: "high" | "medium" | "low"
  }>,
  aiSummary: string,
  createdAt: number
}
```

**Indexes:**
- `by_client`: `[clientId]`
- `by_date`: `[analysisDate]`
- `by_client_and_date`: `[clientId, analysisDate]`

## API Endpoints

### Competitor Management

#### `POST /api/competitors`
Create a new competitor.

**Request:**
```json
{
  "clientId": "...",
  "competitorName": "Competitor Inc",
  "website": "https://competitor.com",
  "description": "Brief description...",
  "category": "direct",
  "strengths": ["Strong brand", "Large budget"],
  "weaknesses": ["Poor customer service"],
  "pricing": {
    "model": "Subscription",
    "range": "$99-$299/mo"
  },
  "targetAudience": ["SMBs", "Enterprise"],
  "marketingChannels": ["Facebook", "LinkedIn"],
  "socialPresence": {
    "facebook": "@competitor",
    "instagram": "@competitor"
  }
}
```

**Response:**
```json
{
  "success": true,
  "competitorId": "...",
  "message": "Competitor added successfully"
}
```

#### `GET /api/competitors?clientId={id}&category={category}`
Get all competitors for a client, optionally filtered by category.

**Response:**
```json
{
  "success": true,
  "competitors": [...]
}
```

#### `GET /api/competitors/{id}`
Get a single competitor by ID.

#### `PUT /api/competitors/{id}`
Update a competitor.

**Request:**
```json
{
  "updates": {
    "competitorName": "New Name",
    "strengths": ["Updated strength"]
  }
}
```

#### `DELETE /api/competitors/{id}`
Delete a competitor.

### Analysis

#### `POST /api/competitors/analyze`
Run AI-powered competitor analysis.

**Request:**
```json
{
  "clientId": "..."
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "...",
  "analysis": {
    "marketGaps": [...],
    "differentiationOpportunities": [...],
    "pricingAnalysis": {...},
    "swotAnalysis": {...},
    "contentGaps": [...],
    "actionableInsights": [...],
    "aiSummary": "..."
  }
}
```

#### `GET /api/competitors/analysis/latest?clientId={id}`
Get the latest analysis for a client.

**Response:**
```json
{
  "success": true,
  "analysis": {...},
  "competitors": [...]
}
```

#### `POST /api/competitors/compare`
Compare multiple competitors side-by-side.

**Request:**
```json
{
  "competitorIds": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "success": true,
  "comparison": {
    "competitors": [...],
    "comparison": {
      "categories": [...],
      "targetAudiences": [...],
      "channels": [...],
      "pricingModels": [...]
    }
  }
}
```

## Convex Functions

### Queries
- `getCompetitors(clientId, category?)` - Get all competitors
- `getCompetitor(competitorId)` - Get single competitor
- `getCompetitorCount(clientId)` - Get competitor counts by category
- `getAnalyses(clientId, limit?)` - Get all analyses
- `getLatestAnalysis(clientId)` - Get latest analysis
- `getAnalysis(analysisId)` - Get specific analysis
- `compareCompetitors(competitorIds[])` - Compare multiple

### Mutations
- `addCompetitor(...)` - Create competitor
- `updateCompetitor(competitorId, updates)` - Update competitor
- `deleteCompetitor(competitorId)` - Delete competitor
- `createAnalysis(...)` - Save analysis results
- `updateLastAnalyzed(competitorId)` - Update timestamp
- `bulkAddCompetitors(clientId, competitors[])` - Import multiple

## React Components

### Core Components

#### `CompetitorsList.tsx`
Main list view with search, filter, and CRUD operations.

**Props:**
```typescript
{
  clientId: string;
  competitors: Competitor[];
  onRefresh: () => void;
}
```

#### `AddCompetitorModal.tsx`
Modal form for adding/editing competitors.

**Props:**
```typescript
{
  clientId: string;
  competitor?: Competitor | null;
  onClose: () => void;
  onSuccess: () => void;
}
```

#### `CompetitorCard.tsx`
Individual competitor display card.

**Props:**
```typescript
{
  competitor: Competitor;
  onClick?: () => void;
}
```

### Analysis Components

#### `SWOTAnalysis.tsx`
Four-quadrant SWOT visualization.

**Props:**
```typescript
{
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }
}
```

#### `MarketGapsPanel.tsx`
Display identified market gaps with opportunities.

**Props:**
```typescript
{
  marketGaps: Array<{
    gap: string;
    opportunity: string;
    priority: "high" | "medium" | "low";
  }>;
}
```

#### `OpportunitiesPanel.tsx`
Differentiation opportunities with effort/impact matrix.

**Props:**
```typescript
{
  opportunities: Array<{
    area: string;
    recommendation: string;
    effort: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
  }>;
}
```

#### `ActionableInsights.tsx`
Priority-based action items.

**Props:**
```typescript
{
  insights: Array<{
    insight: string;
    action: string;
    priority: "high" | "medium" | "low";
  }>;
}
```

#### `ComparisonMatrix.tsx`
Side-by-side competitor comparison table.

**Props:**
```typescript
{
  competitors: Competitor[];
  yourBusiness?: {
    name: string;
    pricing?: { model: string; range: string };
    channels?: string[];
  };
}
```

## AI Analysis Methodology

### 1. Data Collection
The system collects:
- All competitor data from database
- Client business context (name, description, strategy)
- Active marketing strategy information
- Existing personas for audience analysis

### 2. AI Prompt Engineering
Uses specialized prompts for:
- **Comprehensive Analysis**: Full competitive landscape review
- **Market Gap Analysis**: Identifying underserved segments
- **SWOT Analysis**: Strengths, weaknesses, opportunities, threats
- **Differentiation Strategy**: Unique positioning recommendations
- **Content Strategy**: Content opportunities and gaps
- **Pricing Strategy**: Competitive pricing recommendations
- **Social Media Strategy**: Platform-specific tactics

### 3. Analysis Output
Claude AI generates structured JSON containing:
- Market gaps (3-5 high-value opportunities)
- Differentiation opportunities (5-10 specific recommendations)
- Pricing analysis and strategy
- Complete SWOT breakdown
- Content gaps and recommendations
- Actionable insights (prioritized by high/medium/low)
- Executive summary (2-3 paragraphs)

### 4. Result Storage
Analysis saved to database with:
- Timestamp for tracking
- Links to analyzed competitors
- Full structured results
- AI-generated summary

## Usage Workflow

### For Agencies:

1. **Add Competitors**
   - Navigate to Insights > Competitors
   - Click "Add Competitor"
   - Fill in known information
   - Save competitor

2. **Run Analysis**
   - Ensure at least 1 competitor added
   - Click "Run Analysis" button
   - AI analyzes all competitors together
   - Results displayed in tabs

3. **Review Insights**
   - **Overview**: Summary and competitor list
   - **SWOT**: Visual SWOT quadrants
   - **Market Gaps**: Opportunities competitors miss
   - **Opportunities**: Ways to differentiate
   - **Insights**: Specific action items
   - **Comparison**: Side-by-side matrix

4. **Take Action**
   - Focus on high-priority insights first
   - Implement quick wins (low effort, high impact)
   - Plan strategic initiatives
   - Re-run analysis quarterly

### For Clients (Portal View):
- View competitor overview
- See analysis summary
- Access actionable recommendations
- Cannot edit competitor data

## Tier Restrictions

### Starter Tier ($99/mo)
- **NO ACCESS** to competitor analysis
- Feature locked with upgrade prompt
- Can view feature preview

### Professional Tier ($299/mo)
- **Full access** to competitor analysis
- Track up to **10 competitors**
- Unlimited analyses
- All export formats
- AI-powered insights

### Enforcement
Tier validation in:
- API routes (check before allowing operations)
- UI components (show upgrade prompts)
- Convex functions (validate client tier)

## Best Practices

### Competitor Data Quality
1. **Complete profiles**: More data = better insights
2. **Regular updates**: Update quarterly or when changes occur
3. **Accurate categorization**: Direct vs Indirect vs Potential
4. **Honest assessment**: Both strengths AND weaknesses

### Analysis Frequency
- **Initial**: Run when first setting up
- **Regular**: Quarterly reviews
- **Triggered**: When major competitor moves occur
- **Strategy refresh**: Before major planning sessions

### Actionable Insights
1. **Prioritize**: Focus on high-priority items
2. **Assign owners**: Each insight needs an owner
3. **Set deadlines**: Timeline for implementation
4. **Measure**: Track impact of changes
5. **Iterate**: Refine based on results

## Error Handling

### Common Errors
1. **No competitors added**: Show prompt to add competitors
2. **API key missing**: Handle gracefully with user message
3. **Analysis fails**: Retry mechanism + error display
4. **Tier restriction**: Clear upgrade path

### Validation
- Validate required fields before API calls
- Check tier limits before operations
- Validate URLs and email formats
- Handle missing/optional fields gracefully

## Performance Considerations

### Database Queries
- Indexed queries for fast retrieval
- Pagination for large competitor lists
- Efficient filtering by category

### AI Analysis
- Can take 30-60 seconds for comprehensive analysis
- Loading states and progress indicators
- Cache results to avoid re-running

### UI/UX
- Lazy loading for tabs
- Optimistic updates for better UX
- Skeleton loaders during data fetch

## Future Enhancements

### Phase 2
- Automated competitor discovery
- Web scraping for competitor data
- Competitive pricing tracker
- Social media monitoring integration
- Automated quarterly reports

### Phase 3
- Competitor benchmarking scores
- Market share estimation
- Trend analysis and alerts
- Integration with SEO tools
- Competitive keyword research

## Integration with Other Features

### Personas
- Analyze audience overlap with competitors
- Identify underserved segments
- Refine targeting based on gaps

### Marketing Strategy
- Inform positioning recommendations
- Guide channel selection
- Shape messaging and differentiation

### Content Calendar
- Time content around competitor activity
- Fill content gaps identified
- Leverage competitive advantages

### Social Templates
- Create competitive response content
- Highlight differentiators
- Address market gaps in messaging

## Security & Privacy

### Data Protection
- Competitor data is client-specific
- No cross-client data sharing
- Secure storage in Convex

### API Security
- Authenticated endpoints only
- Client ID validation
- Tier-based access control

### AI Privacy
- No sensitive data sent to Claude
- Generic business information only
- Results stored securely

## Testing

### Unit Tests
- Convex functions
- API route handlers
- Utility functions

### Integration Tests
- Complete analysis workflow
- Data flow from UI to database
- AI integration

### E2E Tests
- Add competitor flow
- Run analysis flow
- View and export results

## Documentation

### User Documentation
- Feature overview and benefits
- Step-by-step guides
- Best practices
- FAQ

### Developer Documentation
- API reference
- Schema documentation
- Integration guides
- Deployment notes

## Monitoring & Analytics

### Track Usage
- Competitors added per client
- Analyses run per month
- Feature adoption rate
- Export usage

### Performance Metrics
- Analysis completion time
- API response times
- Error rates
- User satisfaction

## Support

### Common Questions
1. **How many competitors should I track?**
   - Start with 3-5 direct competitors
   - Add indirect/potential as needed

2. **How often should I run analysis?**
   - Quarterly for most businesses
   - Monthly for fast-moving industries

3. **What if competitor data is limited?**
   - Start with what you know
   - Analysis will still provide value
   - Update as you gather more intel

4. **Can I import competitors?**
   - Yes, use bulk add function
   - CSV import coming in Phase 2

## Conclusion

The Competitor Analysis system is a powerful Professional tier feature that provides agencies with AI-powered competitive intelligence. By combining manual competitor tracking with automated AI analysis, agencies can deliver high-value strategic insights to their clients and maintain competitive advantages in their markets.
