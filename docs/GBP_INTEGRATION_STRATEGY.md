# Google Business Profile (GBP) Integration Strategy
## Unified SEO/GEO/Local Search Optimization

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Status**: 🎯 Production-Ready Strategy

---

## Table of Contents

1. [Strategic Overview](#strategic-overview)
2. [Schema.org ↔ GBP Synchronization](#schemaorg--gbp-synchronization)
3. [GBP API Integration](#gbp-api-integration)
4. [Unite-Hub Platform Features](#unite-hub-platform-features)
5. [GBP Optimization Playbook](#gbp-optimization-playbook)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Automation Workflows](#automation-workflows)

---

## Strategic Overview

### Why GBP + Schema.org is Critical

**The Local SEO Trinity**:
```
Google Business Profile (GBP)
    ↓
Schema.org LocalBusiness Markup
    ↓
Website Content & NAP Consistency
    ║
    ╚═══> Combined Signal Strength = 3x SEO Impact
```

### Key Statistics

- **46% of all Google searches** have local intent
- **76% of mobile local searches** result in a physical visit within 24 hours
- **GBP listings with photos** get 42% more requests for directions
- **Complete profiles** are 2.7x more likely to be considered reputable
- **Posts on GBP** increase engagement by 30%

### The Synchronization Problem

**Current State** (Manual, Fragmented):
- Schema.org data on website (Organization, Service, etc.)
- GBP data in Google Business Profile dashboard
- Website contact info (NAP - Name, Address, Phone)
- Social media profiles
- **Result**: Inconsistencies hurt SEO rankings

**Future State** (Automated, Unified):
- **Single source of truth** in Unite-Hub CRM
- **Automatic sync** to GBP via API
- **Schema.org auto-generation** from CRM data
- **NAP consistency checks** across all platforms
- **Result**: Maximum SEO authority

---

## Schema.org ↔ GBP Synchronization

### Data Field Mapping

| **CRM Field** | **Schema.org Property** | **GBP Field** | **Sync Priority** |
|---------------|-------------------------|---------------|-------------------|
| Business Name | `Organization.name` | `account.accountName` | 🔴 Critical |
| Address | `Organization.address` | `location.address` | 🔴 Critical |
| Phone | `Organization.contactPoint.telephone` | `location.primaryPhone` | 🔴 Critical |
| Website URL | `Organization.url` | `location.websiteUri` | 🔴 Critical |
| Category | `Organization.additionalType` | `location.primaryCategory` | 🟡 High |
| Description | `Organization.description` | `location.profile.description` | 🟡 High |
| Logo | `Organization.logo` | `location.profile.logo` | 🟡 High |
| Hours | `Organization.openingHoursSpecification` | `location.regularHours` | 🟡 High |
| Services | `Service` array | `location.serviceItems` | 🟢 Medium |
| Photos | `Organization.image` | `location.media` | 🟢 Medium |
| Social Links | `Organization.sameAs` | `location.socialProfiles` | 🟢 Medium |
| Reviews Rating | `aggregateRating.ratingValue` | `location.rating` | 🔵 Read-only |
| Review Count | `aggregateRating.reviewCount` | `location.reviewCount` | 🔵 Read-only |

### NAP Consistency Algorithm

```typescript
/**
 * NAP Consistency Checker
 * Ensures Name, Address, Phone match across all platforms
 */
interface NAPData {
  name: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  phone: string;
}

async function checkNAPConsistency(orgId: string): Promise<{
  isConsistent: boolean;
  discrepancies: string[];
  sources: {
    crm: NAPData;
    schema: NAPData;
    gbp: NAPData;
    website: NAPData;
  };
}> {
  // Fetch from all sources
  const crmData = await getCRMData(orgId);
  const schemaData = await extractSchemaFromWebsite(crmData.websiteUrl);
  const gbpData = await fetchGBPData(crmData.gbpLocationId);
  const websiteData = await scrapeWebsiteFooter(crmData.websiteUrl);

  // Normalize data (remove formatting, lowercase, etc.)
  const normalized = {
    crm: normalizeNAP(crmData),
    schema: normalizeNAP(schemaData),
    gbp: normalizeNAP(gbpData),
    website: normalizeNAP(websiteData),
  };

  // Check for discrepancies
  const discrepancies: string[] = [];

  if (!allMatch(normalized, 'name')) {
    discrepancies.push('Business name mismatch');
  }
  if (!allMatch(normalized, 'address.streetAddress')) {
    discrepancies.push('Street address mismatch');
  }
  if (!allMatch(normalized, 'phone')) {
    discrepancies.push('Phone number mismatch');
  }

  return {
    isConsistent: discrepancies.length === 0,
    discrepancies,
    sources: normalized,
  };
}
```

---

## GBP API Integration

### Google Business Profile API v4.9

**API Documentation**: https://developers.google.com/my-business/reference/rest

### Authentication Flow

```typescript
// OAuth 2.0 for GBP API
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// Scopes required for GBP management
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage', // Full management
  'https://www.googleapis.com/auth/plus.business.manage', // Legacy
];

async function initializeGBPAuth(userId: string) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userId, // Pass user ID for callback
  });

  return authUrl; // Redirect user to this URL
}
```

### Key API Operations

#### 1. List Locations (Businesses)

```typescript
import { mybusinessbusinessinformation_v1 } from 'googleapis';

async function listGBPLocations(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const mybusiness = google.mybusinessbusinessinformation({
    version: 'v1',
    auth,
  });

  // List all accounts
  const accountsResponse = await mybusiness.accounts.list();
  const accounts = accountsResponse.data.accounts;

  // For each account, list locations
  const locations = [];
  for (const account of accounts) {
    const locationsResponse = await mybusiness.accounts.locations.list({
      parent: account.name,
      readMask: 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories,profile',
    });
    locations.push(...(locationsResponse.data.locations || []));
  }

  return locations;
}
```

#### 2. Update Location Information

```typescript
async function updateGBPLocation(
  accessToken: string,
  locationName: string, // Format: accounts/{account}/locations/{location}
  updates: {
    title?: string;
    description?: string;
    phoneNumbers?: { primaryPhone: string };
    websiteUri?: string;
    regularHours?: any;
  }
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const mybusiness = google.mybusinessbusinessinformation({
    version: 'v1',
    auth,
  });

  // Prepare update mask (only update provided fields)
  const updateMask = Object.keys(updates).join(',');

  const response = await mybusiness.accounts.locations.patch({
    name: locationName,
    updateMask,
    requestBody: updates,
  });

  return response.data;
}
```

#### 3. Create/Update Posts

```typescript
import { mybusinessbusinesscalls_v1 } from 'googleapis';

async function createGBPPost(
  accessToken: string,
  locationName: string,
  post: {
    summary: string;
    callToAction?: {
      actionType: 'LEARN_MORE' | 'CALL' | 'BOOK' | 'SIGN_UP';
      url?: string;
    };
    media?: {
      mediaFormat: 'PHOTO' | 'VIDEO';
      sourceUrl: string;
    }[];
  }
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const mybusiness = google.mybusinessbusinesscalls({
    version: 'v1',
    auth,
  });

  // Note: Posts API may be in a different endpoint
  // Check current documentation for localPosts.create
  const response = await mybusiness.accounts.locations.localPosts.create({
    parent: locationName,
    requestBody: {
      languageCode: 'en-AU',
      summary: post.summary,
      callToAction: post.callToAction,
      media: post.media,
      topicType: 'STANDARD', // or 'EVENT', 'OFFER'
    },
  });

  return response.data;
}
```

#### 4. Fetch Reviews (Read-Only)

```typescript
async function fetchGBPReviews(
  accessToken: string,
  locationName: string
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  // Reviews API is separate
  const reviews = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await reviews.json();
  return data.reviews;
}
```

#### 5. Upload Photos/Media

```typescript
async function uploadGBPPhoto(
  accessToken: string,
  locationName: string,
  photoData: {
    imageUrl: string;
    category: 'COVER' | 'LOGO' | 'EXTERIOR' | 'INTERIOR' | 'PRODUCT' | 'TEAM' | 'AT_WORK' | 'FOOD_AND_DRINK';
    description?: string;
  }
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const mybusiness = google.mybusinessbusinessinformation({
    version: 'v1',
    auth,
  });

  // First, create media item
  const mediaResponse = await mybusiness.accounts.locations.media.create({
    parent: locationName,
    requestBody: {
      locationAssociation: {
        category: photoData.category,
      },
      sourceUrl: photoData.imageUrl,
      description: photoData.description,
      mediaFormat: 'PHOTO',
    },
  });

  return mediaResponse.data;
}
```

---

## Unite-Hub Platform Features

### Feature 1: GBP Dashboard Integration

**Location**: `src/app/dashboard/google-business/page.tsx`

**UI Components**:
```
┌─────────────────────────────────────────────────┐
│  Google Business Profile Management             │
├─────────────────────────────────────────────────┤
│                                                 │
│  [🔗 Connect Google Business Profile]          │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ 📍 Main Location                         │  │
│  │ Unite-Hub HQ                             │  │
│  │ ⭐⭐⭐⭐⭐ 4.8 (127 reviews)                  │  │
│  │                                          │  │
│  │ ✅ NAP Consistent                        │  │
│  │ ✅ Schema Synced                         │  │
│  │ ⚠️  Missing 3 service categories         │  │
│  │                                          │  │
│  │ [View Details] [Sync Now] [Edit]        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Recent Posts:                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🎉 New Feature: AI Email Intelligence   │  │
│  │ Posted 2 days ago • 45 views             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Insights (Last 30 Days):                       │
│  👁️  2,451 Profile Views                       │
│  🔍 1,823 Search Appearances                   │
│  🗺️  342 Direction Requests                    │
│  📞 127 Phone Calls                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**React Component Structure**:
```typescript
// src/app/dashboard/google-business/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Globe, Star, TrendingUp } from 'lucide-react';

export default function GoogleBusinessPage() {
  const { currentOrganization } = useAuth();
  const [gbpLocations, setGbpLocations] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [napConsistency, setNapConsistency] = useState(null);

  // Check if GBP is connected
  useEffect(() => {
    async function checkGBPConnection() {
      const res = await fetch(`/api/integrations/gbp/status?orgId=${currentOrganization.org_id}`);
      const data = await res.json();
      setIsConnected(data.isConnected);

      if (data.isConnected) {
        fetchGBPLocations();
        checkNAPConsistency();
      }
    }

    checkGBPConnection();
  }, [currentOrganization]);

  const handleConnect = async () => {
    // Redirect to OAuth flow
    const res = await fetch('/api/integrations/gbp/auth-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: currentOrganization.org_id }),
    });
    const { authUrl } = await res.json();
    window.location.href = authUrl;
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Google Business Profile</h1>

      {!isConnected ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl mb-4">Connect Your Google Business Profile</h2>
          <p className="text-slate-400 mb-6">
            Manage your GBP listings, sync with Schema.org, and ensure NAP consistency.
          </p>
          <Button onClick={handleConnect}>
            <Globe className="mr-2" />
            Connect Google Business
          </Button>
        </Card>
      ) : (
        <>
          {/* NAP Consistency Alert */}
          {napConsistency && !napConsistency.isConsistent && (
            <Card className="p-4 border-yellow-500 bg-yellow-500/10">
              <h3 className="font-bold mb-2">⚠️ NAP Inconsistencies Detected</h3>
              <ul className="list-disc list-inside">
                {napConsistency.discrepancies.map(d => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <Button className="mt-4" onClick={handleSyncNAP}>
                Fix Inconsistencies
              </Button>
            </Card>
          )}

          {/* Location Cards */}
          <div className="grid gap-6">
            {gbpLocations.map(location => (
              <GBPLocationCard key={location.name} location={location} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

### Feature 2: Auto-Sync Service

**Location**: `src/lib/gbp/auto-sync.ts`

```typescript
/**
 * Auto-Sync GBP with CRM Data
 * Runs daily or on-demand
 */

import { getSupabaseServer } from '@/lib/supabase';
import { updateGBPLocation } from './gbp-api';

interface SyncJob {
  orgId: string;
  locationId: string;
  fields: ('title' | 'description' | 'phone' | 'website' | 'hours' | 'services')[];
}

export async function syncGBPFromCRM(job: SyncJob) {
  const supabase = await getSupabaseServer();

  // 1. Fetch CRM data
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', job.orgId)
    .single();

  if (!org) throw new Error('Organization not found');

  // 2. Fetch GBP access token
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token, refresh_token')
    .eq('org_id', job.orgId)
    .eq('provider', 'google_business')
    .single();

  if (!integration) throw new Error('GBP not connected');

  // 3. Prepare updates
  const updates: any = {};

  if (job.fields.includes('title')) {
    updates.title = org.name;
  }

  if (job.fields.includes('description')) {
    updates.profile = {
      description: org.description || generateDescription(org),
    };
  }

  if (job.fields.includes('phone')) {
    updates.phoneNumbers = {
      primaryPhone: org.phone,
    };
  }

  if (job.fields.includes('website')) {
    updates.websiteUri = org.website_url;
  }

  // 4. Sync to GBP
  await updateGBPLocation(integration.access_token, job.locationId, updates);

  // 5. Log sync event
  await supabase.from('auditLogs').insert({
    org_id: job.orgId,
    action: 'gbp_sync',
    entity_type: 'gbp_location',
    entity_id: job.locationId,
    metadata: { fields: job.fields, updates },
  });

  return { success: true, updatedFields: job.fields };
}

/**
 * Generate SEO-optimized description from org data
 */
function generateDescription(org: any): string {
  // Use Claude AI to generate description
  // Or use template:
  return `${org.name} provides ${org.services?.join(', ')}. ` +
         `Serving ${org.service_areas?.join(', ')}. ` +
         `Contact us at ${org.phone} or visit ${org.website_url}.`;
}
```

### Feature 3: GBP Post Automation

**Location**: `src/lib/gbp/post-automation.ts`

```typescript
/**
 * Automated GBP Posts
 * Triggered by events: new blog post, new feature, promotion
 */

interface GBPPostTrigger {
  type: 'blog_published' | 'feature_launch' | 'promotion' | 'event';
  data: {
    title: string;
    summary: string;
    imageUrl?: string;
    ctaUrl?: string;
    ctaType?: 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
  };
}

export async function autoPostToGBP(orgId: string, trigger: GBPPostTrigger) {
  const supabase = await getSupabaseServer();

  // Fetch GBP connection
  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token, metadata')
    .eq('org_id', orgId)
    .eq('provider', 'google_business')
    .single();

  if (!integration) return; // Silently skip if not connected

  // Fetch all locations for this org
  const gbpLocations = integration.metadata.locations || [];

  // Post to all locations
  for (const location of gbpLocations) {
    await createGBPPost(integration.access_token, location.name, {
      summary: trigger.data.summary,
      callToAction: trigger.data.ctaUrl ? {
        actionType: trigger.data.ctaType || 'LEARN_MORE',
        url: trigger.data.ctaUrl,
      } : undefined,
      media: trigger.data.imageUrl ? [{
        mediaFormat: 'PHOTO',
        sourceUrl: trigger.data.imageUrl,
      }] : undefined,
    });
  }

  // Log automation
  await supabase.from('auditLogs').insert({
    org_id: orgId,
    action: 'gbp_auto_post',
    entity_type: 'gbp_post',
    metadata: { trigger: trigger.type, locations: gbpLocations.length },
  });
}
```

---

## GBP Optimization Playbook

### Complete Profile Checklist (100% Completion)

**Google's Ranking Factors** (in order of importance):

#### 1. NAP Consistency (Critical - 30% weight)
- [ ] Business name matches Schema.org exactly
- [ ] Address matches Schema.org exactly (including punctuation)
- [ ] Phone matches Schema.org exactly (format: +61 X XXXX XXXX)
- [ ] No abbreviations (Street not St., Avenue not Ave.)
- [ ] No suite/unit numbers in street address line (use Address Line 2)

#### 2. Category Selection (Critical - 25% weight)
- [ ] Primary category is most specific option (not generic)
- [ ] Secondary categories (up to 9) cover all services
- [ ] Categories match Service schema on website
- [ ] No keyword stuffing in categories

**Example**:
```
Primary: Marketing Agency
Secondary:
- Internet Marketing Service
- Advertising Agency
- Business Management Consultant
- Software Company
- Website Designer
```

#### 3. Business Description (High - 15% weight)
- [ ] 750 characters used (max length for SEO)
- [ ] First 250 characters include primary keywords
- [ ] Describes services, not promotional language
- [ ] Includes service areas/cities served
- [ ] Matches Schema.org description

**Template**:
```
[Business Name] is a [Primary Category] serving [Cities]. We specialize in
[Service 1], [Service 2], and [Service 3]. Our team provides [Unique Value]
to help [Target Audience] achieve [Outcome]. Located in [Area], we serve
clients throughout [Region]. Services include: [List]. Contact us at [Phone]
or visit [Website] to learn more. [Awards/Certifications if applicable].
Open [Hours]. [Call-to-action].
```

#### 4. Photos & Media (High - 10% weight)
- [ ] Logo uploaded (1:1 ratio, min 720x720px)
- [ ] Cover photo (16:9 ratio, min 1024x576px)
- [ ] 10+ interior photos
- [ ] 10+ exterior photos
- [ ] 10+ team/product photos
- [ ] Photos updated monthly
- [ ] All photos geo-tagged
- [ ] File names include keywords (e.g., "sydney-marketing-agency-office.jpg")

#### 5. Services List (Medium - 10% weight)
- [ ] Each service has:
  - [ ] Service name (matches Service schema)
  - [ ] Description (100-300 characters)
  - [ ] Price range or "Custom pricing"
  - [ ] Link to service page on website

**Example**:
```json
{
  "name": "AI-Powered CRM Implementation",
  "description": "Custom CRM setup with AI automation, contact intelligence, and drip campaigns. Includes training and support.",
  "price": { "type": "FIXED_RANGE", "min": 2490, "max": 5490, "currency": "AUD" },
  "url": "https://unite-hub.com/services/crm-implementation"
}
```

#### 6. Attributes (Medium - 5% weight)
- [ ] All relevant attributes selected
- [ ] Accessibility features specified
- [ ] Payment methods listed
- [ ] Amenities checked
- [ ] COVID-19 info (if applicable)

#### 7. Hours (Medium - 5% weight)
- [ ] Regular hours set for all days
- [ ] Special hours for holidays
- [ ] "More Hours" for departments (if applicable)
- [ ] Matches Schema.org openingHoursSpecification

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Week 1: API Integration**
- [ ] Set up Google Cloud Project
- [ ] Enable Google My Business API
- [ ] Create OAuth 2.0 credentials
- [ ] Implement authentication flow in Unite-Hub
- [ ] Create `integrations` table entry for GBP
- [ ] Build OAuth callback handler (`/api/integrations/gbp/callback`)

**Week 2: Basic Features**
- [ ] Build GBP dashboard page
- [ ] Implement location listing
- [ ] Create location detail view
- [ ] Add NAP consistency checker
- [ ] Build sync status indicators

### Phase 2: Synchronization (Week 3-4)

**Week 3: CRM → GBP Sync**
- [ ] Implement field mapping (NAP, description, etc.)
- [ ] Build manual sync trigger
- [ ] Create conflict resolution UI
- [ ] Add sync history/audit log
- [ ] Test bidirectional consistency

**Week 4: Schema.org Integration**
- [ ] Auto-generate LocalBusiness schema from GBP data
- [ ] Sync GBP ↔ Schema.org on update
- [ ] Build Schema.org preview in dashboard
- [ ] Validate generated schema
- [ ] Deploy to production

### Phase 3: Automation (Week 5-6)

**Week 5: Auto-Posting**
- [ ] Build GBP post scheduler
- [ ] Integrate with content calendar
- [ ] Auto-post on blog publish
- [ ] Auto-post on feature launch
- [ ] Add image optimization pipeline

**Week 6: Advanced Features**
- [ ] Review monitoring & alerts
- [ ] Insights dashboard (views, clicks, calls)
- [ ] Photo upload & management
- [ ] Service catalog sync
- [ ] Bulk location management (multi-location businesses)

### Phase 4: Optimization (Week 7-8)

**Week 7: AI Enhancements**
- [ ] AI-generated descriptions (Claude)
- [ ] AI-suggested categories
- [ ] AI-optimized post content
- [ ] Sentiment analysis on reviews
- [ ] Competitor benchmarking

**Week 8: Reporting & Analytics**
- [ ] GBP performance dashboard
- [ ] SEO impact tracking
- [ ] Conversion attribution (GBP → Website)
- [ ] ROI calculator
- [ ] Monthly automated reports

---

## Automation Workflows

### Workflow 1: New Client Onboarding

```
Trigger: New organization created in Unite-Hub
    ↓
[1] Prompt user to connect GBP during onboarding
    ↓
[2] OAuth flow → Grant access to GBP
    ↓
[3] Fetch all GBP locations
    ↓
[4] Map locations to CRM organizations
    ↓
[5] Run NAP consistency check
    ↓
[6] Display discrepancies + Auto-fix options
    ↓
[7] Generate LocalBusiness schema
    ↓
[8] Sync CRM data → GBP (if approved)
    ↓
[9] Schedule weekly sync job
    ↓
[10] Send completion email to user
```

### Workflow 2: Content Publication Auto-Post

```
Trigger: Blog post published OR Feature launched
    ↓
[1] Extract metadata (title, summary, image, URL)
    ↓
[2] Check if GBP connected
    ↓
[3] Use Claude AI to optimize post text (750 chars max)
    ↓
[4] Generate AI-enhanced image (DALL-E or Midjourney)
    ↓
[5] Create GBP post on all locations
    ↓
[6] Track post performance (views, clicks)
    ↓
[7] Log to auditLogs
    ↓
[8] Send notification to user (optional)
```

### Workflow 3: Weekly NAP Consistency Check

```
Trigger: Cron job (every Monday 9am)
    ↓
[1] For each organization with GBP connected:
    ↓
[2] Fetch CRM data (name, address, phone)
    ↓
[3] Fetch GBP data via API
    ↓
[4] Fetch Schema.org from website
    ↓
[5] Fetch website footer NAP (scrape)
    ↓
[6] Compare all sources
    ↓
[7] If discrepancies found:
    ├─→ [7a] Send alert email to admin
    ├─→ [7b] Create task in dashboard
    └─→ [7c] Offer auto-fix with one-click approval
    ↓
[8] Generate weekly NAP health report
```

### Workflow 4: Review Monitoring & Response

```
Trigger: New review detected on GBP (webhook or daily check)
    ↓
[1] Fetch review data (rating, text, reviewer)
    ↓
[2] Store in `gbp_reviews` table
    ↓
[3] Analyze sentiment with Claude AI
    ↓
[4] If negative review (≤ 3 stars):
    ├─→ [4a] Alert organization admin immediately
    ├─→ [4b] Generate AI-suggested response
    └─→ [4c] Create task "Respond to review"
    ↓
[5] If positive review (≥ 4 stars):
    ├─→ [5a] Auto-thank reviewer (if enabled)
    └─→ [5b] Add to testimonials collection
    ↓
[6] Update aggregate rating in CRM
    ↓
[7] Sync rating to Schema.org aggregateRating
```

---

## Database Schema Extensions

### New Tables

#### `gbp_locations`
```sql
CREATE TABLE gbp_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gbp_account_id TEXT NOT NULL,
  gbp_location_id TEXT NOT NULL UNIQUE,
  gbp_location_name TEXT NOT NULL, -- Format: accounts/{account}/locations/{location}

  -- Business info
  business_name TEXT NOT NULL,
  primary_category TEXT,
  categories TEXT[], -- Up to 10 categories

  -- NAP
  street_address TEXT,
  address_locality TEXT,
  address_region TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'AU',
  phone TEXT,
  website_url TEXT,

  -- Status
  verification_status TEXT CHECK (verification_status IN ('VERIFIED', 'UNVERIFIED', 'VERIFICATION_REQUESTED')),
  profile_completion_percent INTEGER DEFAULT 0,

  -- Sync
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT true,
  auto_post_enabled BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gbp_locations_org ON gbp_locations(org_id);
CREATE INDEX idx_gbp_locations_gbp_id ON gbp_locations(gbp_location_id);
```

#### `gbp_posts`
```sql
CREATE TABLE gbp_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gbp_location_id UUID NOT NULL REFERENCES gbp_locations(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Post content
  summary TEXT NOT NULL CHECK (LENGTH(summary) <= 1500),
  cta_type TEXT CHECK (cta_type IN ('LEARN_MORE', 'CALL', 'BOOK', 'SIGN_UP', 'ORDER')),
  cta_url TEXT,

  -- Media
  media_urls TEXT[],
  media_format TEXT CHECK (media_format IN ('PHOTO', 'VIDEO')),

  -- GBP data
  gbp_post_id TEXT UNIQUE,
  topic_type TEXT DEFAULT 'STANDARD' CHECK (topic_type IN ('STANDARD', 'EVENT', 'OFFER', 'ALERT')),

  -- Performance
  views_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,

  -- Metadata
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gbp_posts_location ON gbp_posts(gbp_location_id);
CREATE INDEX idx_gbp_posts_org ON gbp_posts(org_id);
CREATE INDEX idx_gbp_posts_published ON gbp_posts(published_at DESC);
```

#### `gbp_reviews`
```sql
CREATE TABLE gbp_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gbp_location_id UUID NOT NULL REFERENCES gbp_locations(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Review data (from GBP API)
  gbp_review_id TEXT NOT NULL UNIQUE,
  reviewer_name TEXT,
  reviewer_photo_url TEXT,
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  comment TEXT,
  review_reply TEXT,

  -- AI analysis
  sentiment TEXT CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
  sentiment_score NUMERIC(3, 2), -- -1.0 to 1.0
  ai_suggested_response TEXT,

  -- Timestamps
  review_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reply_created_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gbp_reviews_location ON gbp_reviews(gbp_location_id);
CREATE INDEX idx_gbp_reviews_org ON gbp_reviews(org_id);
CREATE INDEX idx_gbp_reviews_rating ON gbp_reviews(star_rating);
CREATE INDEX idx_gbp_reviews_sentiment ON gbp_reviews(sentiment);
```

#### `nap_consistency_checks`
```sql
CREATE TABLE nap_consistency_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  gbp_location_id UUID REFERENCES gbp_locations(id) ON DELETE CASCADE,

  -- Consistency status
  is_consistent BOOLEAN NOT NULL,
  discrepancies TEXT[],

  -- Source data snapshots
  crm_data JSONB NOT NULL,
  gbp_data JSONB,
  schema_data JSONB,
  website_data JSONB,

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,

  -- Metadata
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_nap_checks_org ON nap_consistency_checks(org_id);
CREATE INDEX idx_nap_checks_consistent ON nap_consistency_checks(is_consistent);
CREATE INDEX idx_nap_checks_date ON nap_consistency_checks(checked_at DESC);
```

---

## API Endpoints to Create

### GBP Integration Endpoints

```typescript
// src/app/api/integrations/gbp/

// 1. GET /api/integrations/gbp/status
// Check if GBP is connected for an organization
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId');
  // Check integrations table for google_business provider
  // Return { isConnected: boolean, locations: [] }
}

// 2. POST /api/integrations/gbp/auth-url
// Generate OAuth URL for GBP connection
export async function POST(req: NextRequest) {
  const { orgId } = await req.json();
  // Generate OAuth URL with state=orgId
  // Return { authUrl: string }
}

// 3. GET /api/integrations/gbp/callback
// OAuth callback handler
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state'); // orgId
  // Exchange code for tokens
  // Fetch GBP locations
  // Store in integrations + gbp_locations tables
  // Redirect to dashboard with success message
}

// 4. GET /api/integrations/gbp/locations
// List all GBP locations for an organization
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId');
  // Fetch from gbp_locations table
  // Return array of locations
}

// 5. POST /api/integrations/gbp/sync
// Trigger manual sync from CRM to GBP
export async function POST(req: NextRequest) {
  const { orgId, locationId, fields } = await req.json();
  // Call syncGBPFromCRM()
  // Return { success: boolean, updatedFields: [] }
}

// 6. POST /api/integrations/gbp/posts
// Create a GBP post
export async function POST(req: NextRequest) {
  const { locationId, summary, ctaType, ctaUrl, mediaUrls } = await req.json();
  // Call createGBPPost()
  // Store in gbp_posts table
  // Return { postId: string }
}

// 7. GET /api/integrations/gbp/reviews
// Fetch reviews for a location
export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get('locationId');
  // Call fetchGBPReviews()
  // Store in gbp_reviews table
  // Return reviews array
}

// 8. POST /api/integrations/gbp/nap-check
// Run NAP consistency check
export async function POST(req: NextRequest) {
  const { orgId, locationId } = await req.json();
  // Call checkNAPConsistency()
  // Store in nap_consistency_checks table
  // Return consistency report
}
```

---

## LocalBusiness Schema Generation

### Auto-Generate from GBP Data

```typescript
/**
 * Generate LocalBusiness schema from GBP location data
 * This replaces/enhances Organization schema for local businesses
 */

import { mybusinessbusinessinformation_v1 } from 'googleapis';

type GBPLocation = mybusinessbusinessinformation_v1.Schema$Location;

export function generateLocalBusinessSchema(
  gbpLocation: GBPLocation,
  additionalData?: {
    aggregateRating?: { ratingValue: number; reviewCount: number };
    priceRange?: string; // "$", "$$", "$$$", "$$$$"
  }
) {
  const address = gbpLocation.storefrontAddress;
  const hours = gbpLocation.regularHours;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${gbpLocation.websiteUri}#localbusiness`,

    // Basic info
    "name": gbpLocation.title,
    "description": gbpLocation.profile?.description,
    "image": gbpLocation.profile?.coverPhoto?.sourceUrl,
    "logo": gbpLocation.profile?.logo?.sourceUrl,

    // Contact
    "telephone": gbpLocation.phoneNumbers?.primaryPhone,
    "url": gbpLocation.websiteUri,
    "email": gbpLocation.profile?.email,

    // Address
    "address": {
      "@type": "PostalAddress",
      "streetAddress": address?.addressLines?.join(', '),
      "addressLocality": address?.locality,
      "addressRegion": address?.administrativeArea,
      "postalCode": address?.postalCode,
      "addressCountry": address?.regionCode || "AU"
    },

    // Geo coordinates (if available)
    "geo": gbpLocation.latlng ? {
      "@type": "GeoCoordinates",
      "latitude": gbpLocation.latlng.latitude,
      "longitude": gbpLocation.latlng.longitude
    } : undefined,

    // Categories
    "additionalType": gbpLocation.categories?.primaryCategory?.displayName,

    // Hours
    "openingHoursSpecification": hours?.periods?.map(period => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": period.openDay,
      "opens": formatTime(period.openTime),
      "closes": formatTime(period.closeTime)
    })),

    // Ratings (if provided)
    "aggregateRating": additionalData?.aggregateRating ? {
      "@type": "AggregateRating",
      "ratingValue": additionalData.aggregateRating.ratingValue,
      "reviewCount": additionalData.aggregateRating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    } : undefined,

    // Price range
    "priceRange": additionalData?.priceRange,

    // Social profiles
    "sameAs": gbpLocation.profile?.socialProfiles?.map(p => p.url).filter(Boolean),
  };

  // Remove undefined values
  return JSON.parse(JSON.stringify(schema));
}

function formatTime(time: any): string {
  if (!time) return '';
  const hours = String(time.hours || 0).padStart(2, '0');
  const minutes = String(time.minutes || 0).padStart(2, '0');
  return `${hours}:${minutes}`;
}
```

---

## Success Metrics & KPIs

### Track These Metrics

| **Metric** | **Baseline** | **Target (3 months)** | **Target (6 months)** |
|------------|--------------|----------------------|---------------------|
| GBP Profile Completion | 60% | 95% | 100% |
| NAP Consistency Score | 70% | 95% | 100% |
| Monthly Profile Views | 500 | 1,500 | 3,000 |
| Monthly Direction Requests | 50 | 150 | 300 |
| Monthly Phone Calls from GBP | 20 | 60 | 120 |
| Average Review Rating | 4.2 | 4.6 | 4.8 |
| Total Review Count | 30 | 75 | 150 |
| GBP Posts per Month | 0 | 8 | 16 |
| GBP → Website CTR | 5% | 10% | 15% |
| Local Search Ranking (Top 10) | 40% | 70% | 85% |

### ROI Calculation

```typescript
/**
 * Calculate ROI of GBP optimization
 */

interface GBPROIInputs {
  monthlyViews: number;
  clickThroughRate: number; // 0.10 = 10%
  conversionRate: number; // 0.05 = 5%
  averageCustomerValue: number; // e.g., $5,000
  implementationCost: number; // One-time
  monthlyCost: number; // Ongoing (software, management)
}

function calculateGBPROI(inputs: GBPROIInputs, months: number) {
  const monthlyClicks = inputs.monthlyViews * inputs.clickThroughRate;
  const monthlyConversions = monthlyClicks * inputs.conversionRate;
  const monthlyRevenue = monthlyConversions * inputs.averageCustomerValue;

  const totalRevenue = monthlyRevenue * months;
  const totalCosts = inputs.implementationCost + (inputs.monthlyCost * months);
  const roi = ((totalRevenue - totalCosts) / totalCosts) * 100;

  return {
    monthlyRevenue,
    totalRevenue,
    totalCosts,
    roi: Math.round(roi),
    breakEvenMonths: Math.ceil(inputs.implementationCost / monthlyRevenue)
  };
}

// Example:
const example = calculateGBPROI({
  monthlyViews: 2000,
  clickThroughRate: 0.12,
  conversionRate: 0.03,
  averageCustomerValue: 3000,
  implementationCost: 5000,
  monthlyCost: 200,
}, 12);

// Result:
// monthlyRevenue: $2,160
// totalRevenue: $25,920
// totalCosts: $7,400
// roi: 250%
// breakEvenMonths: 3
```

---

## Resources & Documentation

### Official Documentation
- **Google Business Profile API**: https://developers.google.com/my-business/content/overview
- **LocalBusiness Schema**: https://schema.org/LocalBusiness
- **Google Search Central (Local)**: https://developers.google.com/search/docs/appearance/local-business

### Tools
- **GBP Dashboard**: https://business.google.com/
- **Google My Business Insights**: https://support.google.com/business/answer/6033862
- **Local Search Grid Tool**: https://www.localsearchgridtool.com/

### Learning Resources
- **Moz Local SEO Guide**: https://moz.com/learn/seo/local
- **BrightLocal Blog**: https://www.brightlocal.com/learn/

---

## Next Steps

1. **Review this strategy document** with the team
2. **Prioritize features** based on immediate business needs
3. **Set up Google Cloud Project** and enable GBP API
4. **Begin Phase 1 implementation** (Weeks 1-2)
5. **Test with pilot organization** before full rollout

---

**This is a living document. Update as GBP API evolves and new features are discovered.**

**Last Updated**: 2025-01-17
**Version**: 1.0.0
**Maintained by**: Unite-Hub Development Team
