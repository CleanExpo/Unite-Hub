# Synthex Services - DEPRECATED

> **Migration Status**: In Progress
> **Migration Date**: 2026-01-24
> **Target Removal**: After Synthex V1 Launch

## Overview

These services are being migrated to the standalone Synthex repository at:
**https://github.com/CleanExpo/Synthex**

Unite-Hub will communicate with Synthex via webhooks after migration is complete.
See `/src/app/api/external/synthex/route.ts` for the webhook bridge.

## Deprecated Services

| Unite-Hub File | New Synthex Location | Status |
|----------------|---------------------|--------|
| `projectsService.ts` | `lib/services/projects/projectsService.ts` | ✅ Extracted |
| `campaignService.ts` | `lib/services/campaigns/campaignService.ts` | ✅ Extracted |
| `billingService.ts` | `lib/services/billing/billingService.ts` | ✅ Extracted |
| `templateService.ts` | `lib/services/templates/templateService.ts` | ✅ Extracted |
| `analyticsEngine.ts` | `lib/services/analytics/analyticsEngine.ts` | ✅ Extracted |
| `attributionService.ts` | `lib/services/attribution/attributionService.ts` | ✅ Extracted |
| `audienceService.ts` | `lib/services/audience/audienceService.ts` | ✅ Extracted |
| `automationService.ts` | `lib/services/automation/automationService.ts` | ✅ Extracted |
| `leadEngineService.ts` | `lib/services/leads/leadEngineService.ts` | ✅ Extracted |
| `contentService.ts` | `lib/services/content/contentService.ts` | ✅ Extracted |

## Tier 2 Services (Pending Extraction)

These require abstraction before extraction:

- `deliveryEngine.ts` - Email/SMS delivery
- `brandService.ts` - Brand management
- `seoService.ts` - SEO intelligence
- `socialService.ts` - Social media management
- `revenueService.ts` - Revenue tracking
- `experimentService.ts` - A/B testing

## Tier 3 Services (Tightly Coupled)

These are deeply integrated with Unite-Hub and will remain:

- `agentOrchestrator.ts` - Uses Founder OS agents
- `knowledgeGraphService.ts` - Shared knowledge graph

## Migration Guidelines

1. **DO NOT** add new features to deprecated services
2. All new Synthex development happens in the Synthex repo
3. Existing Unite-Hub consumers should migrate to webhook integration
4. After V1 launch, these files will be removed

## Webhook Bridge

Unite-Hub → Synthex communication:
```typescript
import { sendToSynthex } from '@/lib/webhooks/synthex-bridge';

// Send event to Synthex
await sendToSynthex('contact.created', { contactId, email }, workspaceId);
```

Synthex → Unite-Hub communication:
```
POST /api/external/synthex
Headers: X-Synthex-Signature: <HMAC-SHA256>
```

## Contact

Questions about migration: Review `.claude/plans/DECOUPLING-SPEC.md`
