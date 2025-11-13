# Client Management System Documentation

## Overview

Production-ready client management system for Unite-Hub CRM with full demo mode support.

## Architecture

### Database Schema

#### Organizations Table
- Top-level entity representing companies
- Fields: name, email, websiteUrl, businessDescription, tier
- Index: `by_email` for email lookups

#### Clients Table
- Individual clients within organizations
- Fields: orgId, clientName, businessName, businessDescription, packageTier, status, primaryEmail, phoneNumbers, websiteUrl, portalUrl
- Indexes: `by_org`, `by_email`, `by_portal_url`
- Status: active | onboarding | inactive
- Package Tiers: starter | professional

#### Related Tables
- `clientEmails` - Multiple email addresses per client
- `clientContactInfo` - Extended contact information
- `clientAssets` - Uploaded files and documents

## API Endpoints

### Convex Mutations

#### `clients.create`
Create a new client
```typescript
await ctx.runMutation("clients:create", {
  orgId: Id<"organizations">,
  clientName: string,
  businessName: string,
  businessDescription: string,
  packageTier: "starter" | "professional",
  primaryEmail: string,
  phoneNumbers: string[],
  websiteUrl?: string,
  portalUrl?: string,
});
```

#### `clients.createDemoClient`
Create demo client (idempotent - won't duplicate)
```typescript
const clientId = await ctx.runMutation("clients:createDemoClient", {
  orgId: Id<"organizations">,
});
```

#### `clients.update`
Update client information
```typescript
await ctx.runMutation("clients:update", {
  clientId: Id<"clients">,
  clientName?: string,
  businessDescription?: string,
  packageTier?: "starter" | "professional",
  status?: "active" | "onboarding" | "inactive",
});
```

### Convex Queries

#### `clients.listByOrg`
List all clients for an organization
```typescript
const clients = await ctx.runQuery("clients:listByOrg", {
  orgId: Id<"organizations">,
  status?: "active" | "onboarding" | "inactive",
  limit?: number,
});
```

#### `clients.getById`
Get single client by ID
```typescript
const client = await ctx.runQuery("clients:getById", {
  id: Id<"clients">,
});
```

#### `clients.get`
Get client with full details
```typescript
const client = await ctx.runQuery("clients:get", {
  clientId: Id<"clients">,
});
```

#### `clients.getStats`
Get client statistics
```typescript
const stats = await ctx.runQuery("clients:getStats", {
  clientId: Id<"clients">,
});
```

### Organizations

#### `organizations.createDemoOrg`
Create demo organization (idempotent)
```typescript
const orgId = await ctx.runMutation("organizations:createDemoOrg", {});
```

#### `organizations.create`
Create new organization
```typescript
const orgId = await ctx.runMutation("organizations:create", {
  name: string,
  email: string,
  websiteUrl?: string,
  businessDescription?: string,
});
```

#### `organizations.getByEmail`
Find organization by email
```typescript
const org = await ctx.runQuery("organizations:getByEmail", {
  email: string,
});
```

## Demo Data Seeding

### Demo Persona
```typescript
const personaId = await ctx.runMutation("demo/seedData:seedPersona", {
  clientId: Id<"clients">,
});
```

Creates "Tea Enthusiast Emma" - a detailed customer persona for the tea business with:
- Demographics (age 28-45, professional)
- Psychographics (wellness-focused, sustainability values)
- Pain points (finding quality tea, lack of knowledge)
- Goals (discover varieties, learn preparation)
- Buying behavior (quality-focused, research-driven)

### Demo Strategy
```typescript
const strategyId = await ctx.runMutation("demo/seedData:seedStrategy", {
  clientId: Id<"clients">,
  personaId: Id<"personas">,
});
```

Creates comprehensive marketing strategy with:
- Executive summary
- Market analysis
- Target audience definition
- Unique selling proposition
- Content pillars (Tea Education, Wellness, Sustainability, Community)
- Platform-specific strategies (Instagram, Facebook, LinkedIn)
- Success metrics
- Budget guidance

### Demo Calendar Posts
```typescript
const postIds = await ctx.runMutation("demo/seedData:seedCalendarPosts", {
  clientId: Id<"clients">,
  strategyId: Id<"marketingStrategies">,
});
```

Creates 7 sample calendar posts across platforms:
1. Instagram - Educational (tea brewing temperatures)
2. Facebook - Brand story (ethical sourcing)
3. Instagram - Engagement (tea + books)
4. LinkedIn - B2B promotional (workplace wellness)
5. Instagram - Product launch (limited edition tea)
6. Facebook - Community poll (tea time preferences)
7. Instagram - Wellness education (sleep teas)

## REST API Routes

### POST /api/demo/initialize
Initialize complete demo environment

**Request:**
```bash
curl -X POST http://localhost:3000/api/demo/initialize
```

**Response:**
```json
{
  "success": true,
  "message": "Demo environment initialized successfully",
  "data": {
    "orgId": "...",
    "clientId": "...",
    "personaId": "...",
    "strategyId": "...",
    "postIds": ["...", "..."],
    "postCount": 7
  },
  "demo": {
    "organizationName": "Demo Organization",
    "clientName": "Duncan's Tea House",
    "personaName": "Tea Enthusiast Emma",
    "strategyTitle": "Premium Tea Education & Community Building Strategy",
    "calendarPostsGenerated": 7
  }
}
```

### GET /api/demo/initialize
Check demo status

**Response:**
```json
{
  "initialized": true,
  "demo": {
    "orgId": "...",
    "orgName": "Demo Organization",
    "clientId": "...",
    "clientName": "Duncan's Tea House",
    "personasCount": 1,
    "strategiesCount": 1,
    "calendarPostsCount": 7
  },
  "message": "Demo environment is fully initialized"
}
```

## Validation Utilities

### `validateClientAccess`
Validate client exists and belongs to organization
```typescript
import { validateClientAccess } from "./lib/clientValidation";

const client = await validateClientAccess(ctx, clientId, orgId);
```

### `validateActiveClient`
Validate client exists and is active
```typescript
import { validateActiveClient } from "./lib/clientValidation";

const client = await validateActiveClient(ctx, clientId);
```

### `validateClientTier`
Validate client has required package tier
```typescript
import { validateClientTier } from "./lib/clientValidation";

const client = await validateClientTier(ctx, clientId, "professional");
```

### `isClientEmailAvailable`
Check if email is available for use
```typescript
import { isClientEmailAvailable } from "./lib/clientValidation";

const available = await isClientEmailAvailable(
  ctx,
  "email@example.com",
  orgId,
  excludeClientId // optional
);
```

## Usage Examples

### Create New Client
```typescript
const clientId = await convex.mutation(api.clients.create, {
  orgId: myOrgId,
  clientName: "John Smith",
  businessName: "Smith's Coffee Shop",
  businessDescription: "Artisan coffee and pastries",
  packageTier: "starter",
  primaryEmail: "john@smithscoffee.com",
  phoneNumbers: ["+1-555-0199"],
  websiteUrl: "https://smithscoffee.com",
});
```

### List Organization Clients
```typescript
const activeClients = await convex.query(api.clients.listByOrg, {
  orgId: myOrgId,
  status: "active",
  limit: 50,
});
```

### Update Client Status
```typescript
await convex.mutation(api.clients.update, {
  clientId: myClientId,
  status: "active",
});
```

### Get Client Statistics
```typescript
const stats = await convex.query(api.clients.getStats, {
  clientId: myClientId,
});

console.log({
  totalEmails: stats.stats.totalEmails,
  activePersonas: stats.stats.activePersonas,
  activeCampaigns: stats.stats.activeCampaigns,
  totalAssets: stats.stats.totalAssets,
});
```

### Initialize Demo for Testing
```typescript
// Using API endpoint
const response = await fetch("/api/demo/initialize", {
  method: "POST",
});
const demo = await response.json();

// Using Convex directly
const orgId = await convex.mutation(api.organizations.createDemoOrg, {});
const clientId = await convex.mutation(api.clients.createDemoClient, { orgId });
const personaId = await convex.mutation(api.demo.seedData.seedPersona, { clientId });
const strategyId = await convex.mutation(api.demo.seedData.seedStrategy, {
  clientId,
  personaId,
});
const postIds = await convex.mutation(api.demo.seedData.seedCalendarPosts, {
  clientId,
  strategyId,
});
```

## Demo Client Details

**Duncan's Tea House**
- Owner: Duncan MacDonald
- Business: Premium loose-leaf tea retailer
- Focus: Organic teas, tasting experiences, tea education
- Package: Professional tier
- Status: Active

**Sample Data Included:**
- 1 Customer persona (Tea Enthusiast Emma)
- 1 Marketing strategy (Premium Tea Education & Community Building)
- 7 Content calendar posts (Instagram, Facebook, LinkedIn)
- Complete contact information
- Verified email address

## Testing

### Run Demo Test
```bash
node scripts/test-demo-init.js
```

### Verify Demo Integrity (Convex)
```typescript
const verification = await convex.query(
  api.demo.testDemo.verifyDemoIntegrity,
  {}
);

console.log(verification.passed); // true/false
console.log(verification.checks); // detailed check results
```

### Get Demo Stats
```typescript
const stats = await convex.query(api.demo.testDemo.getDemoStats, {});

console.log({
  exists: stats.exists,
  clientName: stats.demo?.client.name,
  personasCount: stats.demo?.counts.personas,
  strategiesCount: stats.demo?.counts.strategies,
  calendarPostsCount: stats.demo?.counts.calendarPosts,
});
```

## Error Handling

All mutations and queries include proper error handling:

```typescript
try {
  const clientId = await convex.mutation(api.clients.create, {...});
} catch (error) {
  if (error.message.includes("Organization not found")) {
    // Handle missing organization
  } else if (error.message.includes("Invalid email")) {
    // Handle validation error
  }
}
```

Common errors:
- "Organization not found" - Invalid orgId
- "Client not found" - Invalid clientId
- "Invalid email address" - Email validation failed
- "Portal URL in use" - Duplicate portal URL
- "Access denied" - Client doesn't belong to organization
- "Multiple personas not available" - Starter plan limitation

## Features

### Idempotent Demo Creation
All demo mutations are idempotent - they check for existing data and return existing IDs instead of creating duplicates.

### Complete Data Seeding
Demo initialization creates a full working environment:
- Organization with professional tier
- Active client with verified contact info
- Detailed customer persona
- Comprehensive marketing strategy
- 7 sample calendar posts across platforms

### Production-Ready
- Input validation on all mutations
- Proper error messages
- Type-safe with TypeScript
- Index optimization for queries
- No duplicate data creation
- Comprehensive testing utilities

## Support

For issues or questions:
1. Check the verification endpoint: `GET /api/demo/initialize`
2. Run integrity check: `api.demo.testDemo.verifyDemoIntegrity`
3. Review error messages in responses
4. Check Convex dashboard logs
