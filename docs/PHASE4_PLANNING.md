# Phase 4: Custom Framework Builder & Advanced Analytics

**Status**: Planning
**Target Duration**: 4 weeks
**Estimated Lines of Code**: 8,000-10,000
**Date**: 2025-11-27

---

## Overview

Phase 4 extends CONVEX with two major feature sets:

1. **Custom Framework Builder** - Allow users to create, modify, and manage their own marketing frameworks
2. **Advanced Analytics Dashboard** - Track strategy performance, ROI, and usage patterns

This transforms CONVEX from a fixed-framework system into a flexible, data-driven platform.

---

## Phase 4 Architecture

```
Phase 4 System Design
├── Custom Frameworks
│   ├── Framework Builder UI
│   ├── Template Library
│   ├── Framework Validation
│   └── Framework Analytics
│
├── Advanced Analytics
│   ├── Performance Dashboard
│   ├── ROI Tracking
│   ├── Usage Analytics
│   └── A/B Testing Framework
│
└── Supporting Infrastructure
    ├── Framework Metadata Tables
    ├── Analytics Tables
    ├── Performance APIs
    └── Reporting Engine
```

---

## Week 1-2: Custom Framework Builder

### Database Schema (Migration 242)

**New Tables**:

```sql
-- User-created frameworks
CREATE TABLE convex_custom_frameworks (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  framework_type TEXT,
  components JSONB[] NOT NULL,
  rules JSONB,
  reasoning_patterns JSONB[],
  version INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- Framework templates (sharable patterns)
CREATE TABLE convex_framework_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  framework_data JSONB,
  preview_image TEXT,
  downloads INTEGER DEFAULT 0,
  rating FLOAT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  featured BOOLEAN DEFAULT false
);

-- Framework component library
CREATE TABLE convex_framework_components (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  framework_id UUID,
  component_name TEXT NOT NULL,
  component_type TEXT,
  description TEXT,
  properties JSONB,
  validation_rules JSONB,
  examples JSONB[],
  reusable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (framework_id) REFERENCES convex_custom_frameworks(id)
);

-- Framework usage tracking
CREATE TABLE convex_framework_usage (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  framework_id UUID,
  strategy_id UUID,
  effectiveness_score FLOAT,
  completion_rate FLOAT,
  conversion_rate FLOAT,
  created_at TIMESTAMPTZ,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (framework_id) REFERENCES convex_custom_frameworks(id),
  FOREIGN KEY (strategy_id) REFERENCES convex_strategy_scores(id)
);
```

### Custom Framework Builder Component (1,500 lines)

**ConvexFrameworkBuilder.tsx**

```typescript
Features:
- Visual framework builder interface
- Drag-and-drop component management
- Component property editor
- Rule and pattern configuration
- Real-time preview
- Validation before save
- Framework versioning
- Publish to workspace

Key Props:
- workspaceId: string
- frameworkId?: string (for editing)
- onSave: (framework: Framework) => Promise<void>
- onPublish: (framework: Framework) => Promise<void>
```

**FrameworkComponentEditor.tsx** (800 lines)

```typescript
Features:
- Component property form generator
- Validation rules UI
- Example data management
- Reusability settings
- Property type selector
- Default value configuration
```

**FrameworkTemplateLibrary.tsx** (700 lines)

```typescript
Features:
- Browse framework templates
- Filter by category
- Preview templates
- Download/clone templates
- Rating system
- Trending templates
- Search functionality
```

### Framework Builder APIs (900 lines)

**POST /api/convex/frameworks**

```typescript
POST /api/convex/frameworks
- Create custom framework
- Validate framework structure
- Initialize version 1
- Log creation activity

GET /api/convex/frameworks?workspaceId=X
- List user's frameworks
- Include usage stats
- Sort by usage/date

GET /api/convex/frameworks/:id
- Get framework details
- Include components
- Include rules

PATCH /api/convex/frameworks/:id
- Update framework
- Auto-increment version
- Validate changes

DELETE /api/convex/frameworks/:id
- Remove framework
- Cascade delete components
```

**POST /api/convex/framework-templates**

```typescript
GET /api/convex/framework-templates
- Browse all templates
- Pagination support
- Filtering by category
- Search functionality

GET /api/convex/framework-templates/:id
- Get template details
- Include preview

POST /api/convex/framework-templates/:id/clone
- Clone template to user's workspace
- Increment download count
```

**POST /api/convex/framework-validation**

```typescript
POST /api/convex/framework-validation
- Validate framework structure
- Check component references
- Validate rules syntax
- Return error list or success
```

---

## Week 3-4: Advanced Analytics & Performance Dashboard

### Database Schema (Migration 243)

**Analytics Tables**:

```sql
-- Strategy performance tracking
CREATE TABLE convex_strategy_performance (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  strategy_id UUID,
  metric_name TEXT,
  metric_value FLOAT,
  measurement_date DATE,
  created_at TIMESTAMPTZ,
  metadata JSONB,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (strategy_id) REFERENCES convex_strategy_scores(id)
);

-- ROI and conversion tracking
CREATE TABLE convex_roi_tracking (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  strategy_id UUID,
  campaign_id TEXT,
  initial_investment DECIMAL,
  revenue_generated DECIMAL,
  roi_percentage FLOAT,
  conversion_count INTEGER,
  conversion_rate FLOAT,
  measurement_period_start DATE,
  measurement_period_end DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- A/B test results
CREATE TABLE convex_ab_tests (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  strategy_id UUID,
  test_name TEXT,
  variant_a TEXT,
  variant_b TEXT,
  variant_a_performance FLOAT,
  variant_b_performance FLOAT,
  winner TEXT,
  statistical_significance FLOAT,
  test_duration INTEGER,
  sample_size INTEGER,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Usage analytics (aggregated)
CREATE TABLE convex_usage_analytics (
  id UUID PRIMARY KEY,
  workspace_id UUID,
  metric_date DATE,
  active_users INTEGER,
  strategies_created INTEGER,
  strategies_updated INTEGER,
  collaborations_count INTEGER,
  searches_executed INTEGER,
  average_session_duration FLOAT,
  created_at TIMESTAMPTZ
);
```

### Analytics Dashboard Component (2,000 lines)

**ConvexAnalyticsDashboard.tsx** (1,200 lines)

```typescript
Features:
- Strategy performance metrics
- ROI tracking with charts
- Usage trends over time
- Top performing strategies
- Team collaboration metrics
- Search analytics
- Framework performance comparison
- Real-time metric updates

Key Sections:
1. Performance Overview
   - Total strategies
   - Average score
   - Performance trend

2. ROI Tracking
   - Total ROI
   - Campaign breakdown
   - ROI by framework
   - ROI trends

3. Usage Metrics
   - Active users
   - Strategies per user
   - Collaboration rate
   - Search frequency

4. Framework Performance
   - Framework comparison
   - Effectiveness scores
   - Completion rates
   - Usage distribution
```

**ROITrackingPanel.tsx** (600 lines)

```typescript
Features:
- Input investment & revenue
- ROI calculation
- Campaign management
- Historical tracking
- Export data

UI Elements:
- Form inputs for investment/revenue
- ROI display with trend
- Campaign list with details
- Charts and graphs
```

**PerformanceMetricsCard.tsx** (400 lines)

```typescript
Features:
- Metric display with history
- Trend indicators
- Comparison to previous period
- Goal progress
- Custom metric configuration
```

### Analytics APIs (800 lines)

**GET /api/convex/analytics**

```typescript
GET /api/convex/analytics?workspaceId=X&period=month
- Get performance metrics for workspace
- Aggregate usage data
- Return trend data

Query Parameters:
- period: day/week/month/year
- framework: filter by framework (optional)
- strategy: filter by strategy (optional)
```

**POST /api/convex/roi-tracking**

```typescript
POST /api/convex/roi-tracking
- Record investment & revenue
- Calculate ROI
- Store for reporting

GET /api/convex/roi-tracking?workspaceId=X
- Get all ROI records
- Aggregate by campaign
- Calculate average ROI
```

**POST /api/convex/ab-testing**

```typescript
POST /api/convex/ab-testing
- Create A/B test
- Record variant data
- Calculate statistical significance

GET /api/convex/ab-testing?workspaceId=X
- Get test history
- Get current tests
- Get completed tests
```

---

## Testing Strategy

### Unit Tests (500 lines)
- Framework validation logic
- ROI calculation
- Analytics aggregation
- Statistical significance

### Integration Tests (600 lines)
- Framework creation workflow
- Template cloning
- Analytics recording
- ROI tracking

### E2E Tests (700 lines)
- Build custom framework end-to-end
- Save and load framework
- Clone template
- Track ROI
- View analytics dashboard

### Performance Tests
- Dashboard load <2s
- Analytics query <1s
- Report generation <5s

---

## Features Matrix

### Custom Framework Builder

| Feature | Details | Status |
|---------|---------|--------|
| Visual Builder | Drag-drop interface | In Progress |
| Components | Library of reusable | In Progress |
| Templates | Shareable patterns | In Progress |
| Validation | Structure checking | In Progress |
| Versioning | Track changes | In Progress |
| Publishing | Share with team | In Progress |
| Analytics | Usage tracking | In Progress |

### Advanced Analytics

| Feature | Details | Status |
|---------|---------|--------|
| Performance Dashboard | Real-time metrics | In Progress |
| ROI Tracking | Investment to revenue | In Progress |
| Usage Analytics | User behavior | In Progress |
| Framework Comparison | Performance by framework | In Progress |
| A/B Testing | Statistical testing | In Progress |
| Reports | Exportable analytics | In Progress |
| Trends | Historical analysis | In Progress |

---

## Implementation Timeline

### Week 1 (Days 1-3): Framework Builder Foundation
- [ ] Create migration 242 (custom framework tables)
- [ ] Build ConvexFrameworkBuilder component
- [ ] Build FrameworkComponentEditor component
- [ ] Create /api/convex/frameworks endpoint
- [ ] Create /api/convex/framework-validation endpoint
- [ ] Write unit tests for validation

### Week 1 (Days 4-5): Templates & Components
- [ ] Build FrameworkTemplateLibrary component
- [ ] Create /api/convex/framework-templates endpoint
- [ ] Build component reusability system
- [ ] Create component library management
- [ ] Write integration tests

### Week 2 (Days 1-5): Framework Features
- [ ] Framework versioning system
- [ ] Framework publishing/sharing
- [ ] Framework usage tracking
- [ ] Framework search and filtering
- [ ] Framework import/export
- [ ] E2E tests for all features

### Week 3 (Days 1-3): Analytics Foundation
- [ ] Create migration 243 (analytics tables)
- [ ] Build ConvexAnalyticsDashboard component
- [ ] Create /api/convex/analytics endpoint
- [ ] Set up metric aggregation
- [ ] Write unit tests

### Week 3 (Days 4-5): ROI & Performance
- [ ] Build ROITrackingPanel component
- [ ] Create /api/convex/roi-tracking endpoint
- [ ] Build performance comparison charts
- [ ] Create metric visualization
- [ ] Write integration tests

### Week 4 (Days 1-3): A/B Testing
- [ ] Build A/B test configuration UI
- [ ] Create /api/convex/ab-testing endpoint
- [ ] Implement statistical significance calculation
- [ ] Create test results display
- [ ] Write unit tests

### Week 4 (Days 4-5): Polish & Testing
- [ ] Complete E2E test suite
- [ ] Performance optimization
- [ ] Documentation
- [ ] User acceptance testing
- [ ] Bug fixes

---

## Success Criteria

### Functionality
- [ ] Custom frameworks can be created
- [ ] Frameworks can be edited and versioned
- [ ] Templates can be cloned
- [ ] Components are reusable
- [ ] ROI can be tracked
- [ ] Analytics display correctly
- [ ] A/B tests can be created
- [ ] Statistical significance calculated

### Performance
- [ ] Dashboard <2s load time
- [ ] Analytics query <1s
- [ ] Report generation <5s
- [ ] Framework builder responsive
- [ ] No UI lag with 1000+ frameworks

### Quality
- [ ] 100% TypeScript strict mode
- [ ] All components tested
- [ ] All APIs tested
- [ ] Error handling comprehensive
- [ ] Accessibility WCAG 2.1 AA

### Testing
- [ ] 25+ E2E tests passing
- [ ] 20+ integration tests passing
- [ ] 30+ unit tests passing
- [ ] Performance benchmarks met
- [ ] Security audit passed

---

## Risk Mitigation

### Technical Risks

**Risk**: Framework validation complexity
- **Mitigation**: Comprehensive validation library with test cases

**Risk**: Analytics query performance at scale
- **Mitigation**: Proper indexing and query optimization

**Risk**: Real-time dashboard updates
- **Mitigation**: Caching and batch updates

### Data Risks

**Risk**: Loss of custom frameworks
- **Mitigation**: Daily backups, version history

**Risk**: Incorrect ROI calculations
- **Mitigation**: Audit trail, validation checks

**Risk**: Analytics data corruption
- **Mitigation**: Transactional integrity, checksums

---

## Dependencies & Blockers

### Required
- Phase 3 deployment complete
- RLS policies for new tables
- API authentication working
- Component library updated

### Nice to Have
- Real-time collaboration
- Email notifications
- Webhooks integration
- API rate limiting

---

## Resource Requirements

### Development
- 2-3 developers
- QA engineer
- 4 weeks duration

### Infrastructure
- Additional database tables
- Extended API routes
- Analytics compute resources
- Storage for frameworks/templates

### Documentation
- User guides for framework builder
- API documentation
- Analytics interpretation guide
- ROI tracking setup guide

---

## Post-Phase 4 Work

### Phase 5: Automation & Intelligence
- Automated framework recommendations
- AI-powered content generation
- Smart metric predictions
- Anomaly detection

### Phase 6: Integrations
- Zapier/Make integration
- Slack bot
- Email reports
- Webhook support

### Phase 7: Enterprise Features
- Multi-workspace analytics
- Advanced RBAC
- Audit logging
- Compliance reporting

---

## Success Metrics

### User Adoption
- % of users creating custom frameworks
- % of users tracking ROI
- % of users viewing analytics
- Average frameworks per workspace

### Feature Usage
- Frameworks created per week
- Analytics dashboard views per week
- ROI tracking entries per month
- A/B tests created per month

### Business Impact
- Strategy implementation time reduction
- ROI visibility improvement
- Team collaboration increase
- Customer retention improvement

---

**Next Steps**:
1. Review and approve plan
2. Create migration scripts
3. Set up development environment
4. Begin Week 1 implementation
5. Weekly progress reviews

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-27
**Status**: Ready for Implementation
