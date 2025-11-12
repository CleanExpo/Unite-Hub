# Unite-Hub CRM - Convex Backend

Complete backend implementation for Unite-Hub CRM system with AI-powered autonomous marketing automation.

## Architecture Overview

The backend is built on Convex (a reactive serverless database and API platform) with TypeScript. All functions are strongly typed with proper input validation, error handling, and tier-based access control.

## Directory Structure

```
convex/
├── lib/                    # Helper libraries
│   ├── validators.ts      # Input validation helpers
│   ├── permissions.ts     # Tier-based access control
│   └── utils.ts           # Common utilities
├── schema.ts              # Database schema definition
├── organizations.ts       # Organization CRUD
├── clients.ts             # Client management
├── emails.ts              # Email thread management
├── personas.ts            # AI persona generation & versioning
├── mindmaps.ts            # Auto-expanding mind maps
├── strategies.ts          # Marketing strategy generation
├── campaigns.ts           # Social media campaign management
├── hooks.ts               # Hooks & scripts library
├── images.ts              # DALL-E image concept management
├── assets.ts              # Client asset management
├── subscriptions.ts       # Stripe subscription management
└── usage.ts               # Usage tracking & limits
```

## Core Features

### 1. Organizations (`organizations.ts`)
- Create, read, update, delete organizations
- Search organizations by name/email
- Organization statistics and stats
- Validation for email uniqueness

**Key Functions:**
- `create` - Create new organization
- `get` - Get organization by ID
- `getByEmail` - Find by email
- `list` - List all organizations
- `update` - Update organization details
- `remove` - Delete organization (with dependency checks)
- `getStats` - Get org stats (clients, subscription info)
- `search` - Search by name or email

### 2. Clients (`clients.ts`)
- Full client lifecycle management
- Multi-email linking per client
- Portal URL generation (slugified)
- Client contact info tracking
- Client statistics and analytics

**Key Functions:**
- `create` - Create client with auto-generated portal URL
- `get` - Get client by ID
- `getByEmail` - Find client by any linked email
- `getByPortalUrl` - Find by portal slug
- `listByOrg` - List clients for organization
- `update` - Update client details
- `remove` - Delete client (cascades to emails, contact info)
- `linkEmail` - Link additional email to client
- `getEmails` - Get all linked emails
- `getStats` - Client statistics (emails, personas, campaigns, assets)
- `search` - Search clients by name/email/business

### 3. Emails (`emails.ts`)
- Email thread storage and management
- Gmail integration support (messageId, threadId)
- Auto-reply tracking
- Read/unread status
- Email search and filtering
- Attachment support

**Key Functions:**
- `create` - Store incoming email
- `get` - Get email by ID
- `getByGmailId` - Find by Gmail message ID
- `listByClient` - List emails for client
- `listBySender` - List by sender email
- `listRecent` - Recent emails
- `markAsRead` - Mark read/unread
- `markMultipleAsRead` - Bulk mark as read
- `updateAutoReply` - Update auto-reply status
- `search` - Full-text search in emails
- `getThread` - Get email thread by Gmail thread ID
- `getStats` - Email statistics
- `getWithAttachments` - Emails with attachments
- `getUnreadCount` - Count unread emails

### 4. Personas (`personas.ts`)
- AI-generated customer persona management
- Multi-persona support (Professional tier)
- Version history tracking
- Primary persona designation
- Demographics, psychographics, buying behavior

**Key Functions:**
- `create` - Create new persona (with tier validation)
- `get` - Get persona by ID
- `listByClient` - List all personas for client
- `getActive` - Get active personas only
- `getPrimary` - Get primary persona
- `update` - Update persona details
- `setPrimary` - Set as primary persona
- `createVersion` - Create new version from existing
- `getVersionHistory` - Version history
- `remove` - Delete persona
- `getStats` - Persona statistics

### 5. Mind Maps (`mindmaps.ts`)
- Auto-expanding mind map management
- Branch and node CRUD operations
- Email-driven auto-expansion
- Version control
- Category-based organization

**Key Functions:**
- `create` - Create new mind map
- `get` - Get mind map by ID
- `getLatest` - Get latest version for client
- `listByClient` - List all mind maps
- `addBranch` - Add new branch
- `addNode` - Add node to branch
- `updateNode` - Update node details
- `updateBranch` - Update branch
- `removeBranch` - Remove branch
- `removeNode` - Remove node
- `expandFromEmail` - Auto-expand from email insights
- `createVersion` - Create new version
- `getStats` - Mind map statistics

### 6. Marketing Strategies (`strategies.ts`)
- AI-generated marketing strategies
- Platform-specific strategies (FB, IG, TikTok, LinkedIn)
- Competitor analysis (Professional tier)
- Success metrics and KPIs
- Campaign calendar integration

**Key Functions:**
- `create` - Create strategy (with competitor analysis check)
- `get` - Get strategy by ID
- `getActive` - Get active strategy
- `listByClient` - List all strategies
- `update` - Update strategy
- `setActive` - Set as active strategy
- `getPlatformStrategy` - Get platform-specific strategy
- `remove` - Delete strategy
- `getStats` - Strategy statistics

### 7. Campaigns (`campaigns.ts`)
- Platform-specific social media campaigns
- Ad copy variations
- Visual requirements
- Audience targeting
- Content calendar management
- Campaign status tracking

**Key Functions:**
- `create` - Create new campaign
- `get` - Get campaign by ID
- `listByClient` - List campaigns (with filters)
- `listByPlatform` - Filter by platform
- `listByStatus` - Filter by status
- `update` - Update campaign
- `updateStatus` - Change campaign status
- `addContentToCalendar` - Add content item
- `updateContentCalendarItem` - Update calendar item
- `removeContentFromCalendar` - Remove calendar item
- `remove` - Delete campaign
- `getStats` - Campaign statistics

### 8. Hooks & Scripts (`hooks.ts`)
- Marketing hooks and scripts library
- Platform-specific content
- Category and type organization
- Effectiveness scoring (1-10)
- Usage tracking
- Favorites system
- Tag-based search

**Key Functions:**
- `create` - Create hook/script
- `get` - Get by ID
- `listByClient` - List with filters
- `listByPlatform` - Filter by platform
- `getFavorites` - Get favorite hooks
- `update` - Update hook
- `toggleFavorite` - Toggle favorite status
- `incrementUsage` - Track usage
- `search` - Full-text search
- `searchByTags` - Tag-based search
- `getTopPerforming` - Top hooks by effectiveness
- `remove` - Delete hook
- `getStats` - Hook statistics

### 9. Image Concepts (`images.ts`)
- DALL-E generated image management
- Alternative concept tracking
- Platform-specific requirements
- Color palette management
- Usage tracking
- Technical specifications

**Key Functions:**
- `create` - Create image concept
- `get` - Get by ID
- `listByClient` - List with filters
- `listByCampaign` - Filter by campaign
- `listByType` - Filter by concept type
- `listByPlatform` - Filter by platform
- `update` - Update image concept
- `markAsUsed` - Mark as used
- `addAlternative` - Add alternative concept
- `search` - Search by prompt/style
- `remove` - Delete image
- `getStats` - Image statistics

### 10. Assets (`assets.ts`)
- Client asset management (logos, photos, documents)
- File type categorization
- Storage usage tracking
- Tier-based limits enforcement
- Metadata support

**Key Functions:**
- `create` - Upload asset (with tier limit check)
- `get` - Get asset by ID
- `listByClient` - List with filters
- `listByType` - Filter by type
- `getLogos` - Get all logos
- `update` - Update asset metadata
- `remove` - Delete asset
- `search` - Search assets
- `getStats` - Asset statistics
- `getStorageUsage` - Storage usage info
- `removeBulk` - Bulk delete
- `getRecentUploads` - Recent uploads

### 11. Subscriptions (`subscriptions.ts`)
- Stripe subscription management
- Plan tier tracking (Starter/Professional)
- Subscription status management
- Period tracking
- Cancellation handling

**Key Functions:**
- `upsertSubscription` - Create or update subscription
- `getByOrganization` - Get org subscription
- `getByStripeSubscriptionId` - Find by Stripe ID
- `getByStripeCustomerId` - Find by customer ID
- `updateStatus` - Update status
- `updatePlanTier` - Upgrade/downgrade
- `updatePeriod` - Update billing period
- `cancelSubscription` - Cancel subscription
- `reactivateSubscription` - Reactivate
- `deleteSubscription` - Hard delete
- `listActive` - List active subscriptions
- `listExpiringSoon` - Expiring in 7 days

### 12. Usage Tracking (`usage.ts`)
- Tier-based usage limits
- Billing period tracking
- Usage metrics (emails, personas, campaigns, images, hooks, strategies)
- Automatic period reset
- Usage history

**Key Functions:**
- `getOrCreateUsageTracking` - Initialize tracking
- `incrementUsage` - Increment counter (with limit check)
- `getUsage` - Get current usage
- `getAllUsage` - Get all metrics for org
- `checkLimit` - Check if limit reached
- `resetUsage` - Reset for new billing period
- `getUsageHistory` - Historical usage data
- `getUsageSummary` - Complete usage summary
- `cleanupOldRecords` - Archive old data

## Helper Libraries

### `lib/validators.ts`
Reusable input validators:
- Email validation
- URL validation
- Phone number validation
- Slug validation
- Hex color validation
- Date range validation
- File size validation
- MIME type validation
- Search query validation
- Array validators

### `lib/permissions.ts`
Tier-based access control:
- Feature access checks
- Usage limit enforcement
- Subscription validation
- Upgrade messaging
- Feature gates and errors

**Tier Limits:**
```typescript
Starter:
- emails_analyzed: 50
- personasGenerated: 1 (single persona)
- campaignsCreated: 10
- imagesGenerated: 20
- hooksGenerated: 50
- strategiesGenerated: 5
- clientAssets: 50
- multiPersona: false
- competitorAnalysis: false

Professional:
- emails_analyzed: unlimited
- personasGenerated: unlimited
- campaignsCreated: unlimited
- imagesGenerated: 100
- hooksGenerated: unlimited
- strategiesGenerated: unlimited
- clientAssets: 200
- multiPersona: true
- competitorAnalysis: true
```

### `lib/utils.ts`
Common utilities:
- Date utilities (timestamps, billing periods)
- String utilities (truncate, capitalize, sanitize HTML)
- Array utilities (unique, chunk, shuffle)
- Pagination utilities
- Sorting utilities
- Search utilities
- Color utilities
- Version management
- Error handling
- File utilities
- Platform utilities
- Metrics utilities
- Retry utilities with exponential backoff

## Database Schema

Comprehensive schema defined in `schema.ts` with proper indexes for:
- Organizations
- Subscriptions
- Clients
- Client Emails
- Client Contact Info
- Client Assets
- Email Threads
- Auto Replies
- Personas
- Mind Maps
- Marketing Strategies
- Social Campaigns
- Hooks & Scripts
- Image Concepts
- Usage Tracking

All tables include:
- Proper indexing for fast queries
- Timestamps (createdAt, updatedAt)
- Foreign key relationships
- Optional fields where appropriate

## Error Handling

All functions include:
- Input validation
- Existence checks
- Permission validation
- Tier limit enforcement
- Descriptive error messages
- Type safety with TypeScript

## Type Safety

Full TypeScript implementation with:
- Strongly typed arguments
- Return type inference
- Convex validators (v.*)
- Doc<> types for database records
- Partial<> types for updates

## Best Practices Implemented

1. **Input Validation**: All user inputs validated before processing
2. **Error Messages**: Clear, actionable error messages
3. **Tier Enforcement**: Automatic feature gating based on subscription
4. **Cascading Deletes**: Related data cleaned up on deletion
5. **Atomic Operations**: Database operations are atomic
6. **Indexing**: Proper indexes for query performance
7. **Pagination**: Support for large datasets
8. **Search**: Full-text search where needed
9. **Versioning**: Version control for evolving data (personas, mind maps, strategies)
10. **Statistics**: Aggregated stats for analytics

## Usage Examples

### Create Organization and Client
```typescript
// Create organization
const orgId = await ctx.mutation(api.organizations.create, {
  name: "Acme Corp",
  email: "admin@acme.com",
  websiteUrl: "https://acme.com",
  businessDescription: "Leading tech company"
});

// Create client
const clientId = await ctx.mutation(api.clients.create, {
  orgId,
  clientName: "John Doe",
  businessName: "Doe Enterprises",
  businessDescription: "Consulting firm",
  packageTier: "professional",
  primaryEmail: "john@doe.com",
  phoneNumbers: ["+1234567890"],
});
```

### Track Email and Create Persona
```typescript
// Store email
const emailId = await ctx.mutation(api.emails.create, {
  clientId,
  senderEmail: "john@doe.com",
  subject: "Project inquiry",
  messageBody: "<p>I need help with...</p>",
  attachments: [],
});

// Create persona from email insights
const personaId = await ctx.mutation(api.personas.create, {
  clientId,
  personaName: "Tech-Savvy Entrepreneur",
  demographics: {
    ageRange: "35-45",
    location: "San Francisco",
    occupation: "Founder"
  },
  psychographics: {
    values: ["Innovation", "Efficiency"],
    interests: ["Technology", "Business"]
  },
  painPoints: ["Time management", "Scaling challenges"],
  goals: ["Grow business", "Automate processes"],
  buyingBehavior: {
    motivations: ["ROI", "Quality"],
    barriers: ["Budget", "Implementation time"],
    decisionFactors: ["Reputation", "Support"]
  },
  communicationPreferences: ["Email", "Video calls"],
  generatedFromEmails: [emailId]
});
```

### Create Campaign with Content
```typescript
const campaignId = await ctx.mutation(api.campaigns.create, {
  clientId,
  platform: "instagram",
  campaignName: "Q4 Product Launch",
  campaignThemes: ["Innovation", "Sustainability"],
  adCopyVariations: [
    {
      variant: "A",
      copy: "Revolutionize your workflow",
      cta: "Learn More"
    }
  ],
  visualRequirements: {
    imageSpecs: "1080x1080 square format",
    styleGuidelines: "Modern, clean aesthetic"
  },
  timeline: {
    milestones: [
      {
        date: Date.now() + 7 * 86400000,
        description: "Launch kickoff"
      }
    ]
  },
  contentCalendar: []
});
```

## Production Ready

This backend is production-ready with:
- Proper error handling
- Input validation
- Type safety
- Access control
- Usage limits
- Performance optimization
- Scalability
- Maintainability

## Next Steps

To integrate with frontend:
1. Import Convex functions via generated API
2. Use `useQuery` for reactive queries
3. Use `useMutation` for mutations
4. Handle loading and error states
5. Implement authentication/authorization layer
6. Connect Stripe webhooks to subscriptions
7. Integrate Gmail API with email functions
8. Connect AI services (Claude, DALL-E) to actions

## Support

For questions or issues with the backend implementation, refer to:
- Convex documentation: https://docs.convex.dev
- Schema file: `schema.ts`
- Individual function files for detailed implementations
