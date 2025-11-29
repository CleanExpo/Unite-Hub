# API Contracts - OpenAPI 3.1 Specification

**Phase 2 Task 2.2**: Define API contracts using OpenAPI 3.1 specification
**Date**: 2025-11-29
**Status**: APPROVED FOR IMPLEMENTATION

---

## Overview

This document defines the API contracts for Unite-Hub and Synthex platforms using OpenAPI 3.1 specification patterns. All routes enforce:
- **Authentication**: Bearer token via `Authorization` header
- **Workspace Isolation**: `workspace_id` parameter or header
- **Rate Limiting**: Per-route limits based on category
- **Audit Logging**: All requests logged

---

## Common Components

### Security Schemes

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: Supabase PKCE session token

    WebhookSignature:
      type: apiKey
      in: header
      name: X-Webhook-Signature
      description: HMAC signature for webhook verification
```

### Common Parameters

```yaml
components:
  parameters:
    WorkspaceId:
      name: workspace_id
      in: query
      required: true
      schema:
        type: string
        format: uuid
      description: Workspace ID for data isolation

    Pagination:
      name: page
      in: query
      required: false
      schema:
        type: integer
        minimum: 1
        default: 1
      description: Page number for pagination

    PageSize:
      name: limit
      in: query
      required: false
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
      description: Items per page
```

### Common Response Schemas

```yaml
components:
  schemas:
    Error:
      type: object
      required:
        - error
        - code
      properties:
        error:
          type: string
          description: Human-readable error message
        code:
          type: string
          description: Machine-readable error code
        details:
          type: object
          description: Additional error context

    PaginatedResponse:
      type: object
      required:
        - data
        - meta
      properties:
        data:
          type: array
          items: {}
        meta:
          type: object
          properties:
            page:
              type: integer
            limit:
              type: integer
            total:
              type: integer
            totalPages:
              type: integer

    SuccessResponse:
      type: object
      required:
        - success
      properties:
        success:
          type: boolean
        message:
          type: string
        data:
          type: object
```

---

## Unite-Hub API (Staff Only)

### Base Path: `/api/v1/unite-hub`

### Contacts Endpoints

```yaml
/api/v1/unite-hub/contacts:
  get:
    summary: List contacts
    tags: [Contacts]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
      - $ref: '#/components/parameters/Pagination'
      - $ref: '#/components/parameters/PageSize'
      - name: status
        in: query
        schema:
          type: string
          enum: [lead, prospect, customer, churned]
      - name: min_score
        in: query
        schema:
          type: integer
          minimum: 0
          maximum: 100
    responses:
      200:
        description: List of contacts
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - properties:
                    data:
                      type: array
                      items:
                        $ref: '#/components/schemas/Contact'
      401:
        description: Unauthorized
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      403:
        description: Forbidden - Not a staff member
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'

  post:
    summary: Create contact
    tags: [Contacts]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ContactCreate'
    responses:
      201:
        description: Contact created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Contact'
      400:
        description: Validation error
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
      401:
        description: Unauthorized

/api/v1/unite-hub/contacts/{id}:
  get:
    summary: Get contact by ID
    tags: [Contacts]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      200:
        description: Contact details
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Contact'
      404:
        description: Contact not found

  patch:
    summary: Update contact
    tags: [Contacts]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ContactUpdate'
    responses:
      200:
        description: Contact updated

  delete:
    summary: Delete contact
    tags: [Contacts]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      204:
        description: Contact deleted
```

### Contact Schema

```yaml
components:
  schemas:
    Contact:
      type: object
      required:
        - id
        - workspace_id
        - email
        - created_at
      properties:
        id:
          type: string
          format: uuid
        workspace_id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        full_name:
          type: string
        company:
          type: string
        job_title:
          type: string
        phone:
          type: string
        status:
          type: string
          enum: [lead, prospect, customer, churned]
        ai_score:
          type: integer
          minimum: 0
          maximum: 100
        tags:
          type: array
          items:
            type: string
        metadata:
          type: object
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    ContactCreate:
      type: object
      required:
        - email
      properties:
        email:
          type: string
          format: email
        full_name:
          type: string
        company:
          type: string
        job_title:
          type: string
        phone:
          type: string
        status:
          type: string
          enum: [lead, prospect, customer, churned]
          default: lead
        tags:
          type: array
          items:
            type: string
        metadata:
          type: object

    ContactUpdate:
      type: object
      properties:
        email:
          type: string
          format: email
        full_name:
          type: string
        company:
          type: string
        job_title:
          type: string
        phone:
          type: string
        status:
          type: string
          enum: [lead, prospect, customer, churned]
        tags:
          type: array
          items:
            type: string
        metadata:
          type: object
```

### Campaigns Endpoints

```yaml
/api/v1/unite-hub/campaigns:
  get:
    summary: List campaigns
    tags: [Campaigns]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
      - $ref: '#/components/parameters/Pagination'
      - name: status
        in: query
        schema:
          type: string
          enum: [draft, active, paused, completed]
    responses:
      200:
        description: List of campaigns
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - properties:
                    data:
                      type: array
                      items:
                        $ref: '#/components/schemas/Campaign'

  post:
    summary: Create campaign
    tags: [Campaigns]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CampaignCreate'
    responses:
      201:
        description: Campaign created
```

### Founder Intelligence OS Endpoints

```yaml
/api/v1/unite-hub/founder-os/businesses:
  get:
    summary: List founder businesses
    tags: [Founder OS]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
    responses:
      200:
        description: List of businesses
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/FounderBusiness'

/api/v1/unite-hub/founder-os/cognitive-twin/scores:
  get:
    summary: Get cognitive twin health scores
    tags: [Founder OS, Cognitive Twin]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
      - name: domain
        in: query
        schema:
          type: string
          enum: [cash, clients, operations, marketing, sales, product, team, finance, legal, tech, growth, vision, network]
    responses:
      200:
        description: Health scores by domain
        content:
          application/json:
            schema:
              type: object
              properties:
                scores:
                  type: array
                  items:
                    $ref: '#/components/schemas/CognitiveTwinScore'
                overall_health:
                  type: number
                  minimum: 0
                  maximum: 100

/api/v1/unite-hub/founder-os/ai-phill/insights:
  get:
    summary: Get AI Phill strategic insights
    tags: [Founder OS, AI Phill]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
      - name: category
        in: query
        schema:
          type: string
          enum: [strategic, operational, financial, risk, opportunity]
    responses:
      200:
        description: Strategic insights
        content:
          application/json:
            schema:
              type: object
              properties:
                insights:
                  type: array
                  items:
                    $ref: '#/components/schemas/Insight'

  post:
    summary: Ask AI Phill a question
    tags: [Founder OS, AI Phill]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - question
            properties:
              question:
                type: string
                minLength: 10
                maxLength: 2000
              context:
                type: object
                properties:
                  business_id:
                    type: string
                    format: uuid
                  domain:
                    type: string
    responses:
      200:
        description: AI Phill response
        content:
          application/json:
            schema:
              type: object
              properties:
                response:
                  type: string
                thinking:
                  type: string
                  description: Extended thinking process (if enabled)
                recommendations:
                  type: array
                  items:
                    type: string
                follow_up_questions:
                  type: array
                  items:
                    type: string
```

---

## Synthex API (Client Portal)

### Base Path: `/api/v1/synthex`

### Client Dashboard

```yaml
/api/v1/synthex/dashboard:
  get:
    summary: Get client dashboard overview
    tags: [Synthex, Dashboard]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
    responses:
      200:
        description: Dashboard overview
        content:
          application/json:
            schema:
              type: object
              properties:
                subscription:
                  $ref: '#/components/schemas/Subscription'
                metrics:
                  type: object
                  properties:
                    campaigns_active:
                      type: integer
                    emails_sent_month:
                      type: integer
                    open_rate:
                      type: number
                    click_rate:
                      type: number
                recent_activity:
                  type: array
                  items:
                    $ref: '#/components/schemas/Activity'
```

### SEO Reports (Tier-gated)

```yaml
/api/v1/synthex/seo/reports:
  get:
    summary: Get SEO reports
    description: |
      Access depends on subscription tier:
      - starter: Basic reports only
      - professional: Full reports
      - elite: Full reports + competitor analysis
    tags: [Synthex, SEO]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
      - name: type
        in: query
        schema:
          type: string
          enum: [technical, content, backlinks, competitors]
    responses:
      200:
        description: SEO report
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SEOReport'
      403:
        description: Feature not available in current tier
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
                required_tier:
                  type: string
                  enum: [starter, professional, elite]
                upgrade_url:
                  type: string
```

---

## Agent API (Internal)

### Base Path: `/api/v1/agents`

```yaml
/api/v1/agents/orchestrator:
  post:
    summary: Execute orchestrator workflow
    tags: [Agents]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - workflow
            properties:
              workflow:
                type: string
                enum: [email-pipeline, content-generation, contact-scoring, full-analysis]
              targets:
                type: array
                items:
                  type: string
                  format: uuid
              options:
                type: object
    responses:
      200:
        description: Workflow execution result
        content:
          application/json:
            schema:
              type: object
              properties:
                job_id:
                  type: string
                  format: uuid
                status:
                  type: string
                  enum: [queued, running, completed, failed]
                results:
                  type: object

/api/v1/agents/contact-intelligence:
  post:
    summary: Run contact intelligence analysis
    tags: [Agents]
    security:
      - BearerAuth: []
    parameters:
      - $ref: '#/components/parameters/WorkspaceId'
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              contact_ids:
                type: array
                items:
                  type: string
                  format: uuid
              full_analysis:
                type: boolean
                default: false
    responses:
      200:
        description: Contact intelligence results
        content:
          application/json:
            schema:
              type: object
              properties:
                contacts:
                  type: array
                  items:
                    type: object
                    properties:
                      contact_id:
                        type: string
                        format: uuid
                      ai_score:
                        type: integer
                        minimum: 0
                        maximum: 100
                      insights:
                        type: array
                        items:
                          type: string
                      recommended_actions:
                        type: array
                        items:
                          type: string
```

---

## Webhook API (Public with Signature)

### Base Path: `/api/webhooks`

```yaml
/api/webhooks/stripe:
  post:
    summary: Handle Stripe webhook events
    tags: [Webhooks]
    security:
      - WebhookSignature: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
    responses:
      200:
        description: Webhook processed
      400:
        description: Invalid webhook payload
      401:
        description: Invalid signature

/api/webhooks/gmail:
  post:
    summary: Handle Gmail push notifications
    tags: [Webhooks]
    security:
      - WebhookSignature: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              message:
                type: object
              subscription:
                type: string
    responses:
      200:
        description: Notification processed
```

---

## Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Unite-Hub Staff | 100 requests | 1 minute |
| Synthex Client | 50 requests | 1 minute |
| Agent Internal | 200 requests | 1 minute |
| Webhooks | 1000 requests | 1 minute |
| Public Health | 10 requests | 1 minute |

Rate limit headers returned:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_INVALID` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `TIER_REQUIRED` | 403 | Feature requires higher tier |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `WORKSPACE_REQUIRED` | 400 | Workspace ID required |
| `WORKSPACE_MISMATCH` | 403 | Resource in different workspace |
| `INTERNAL_ERROR` | 500 | Internal server error |

---

## Implementation Notes

### TypeScript Types Generation

```bash
# Generate TypeScript types from OpenAPI spec
npx openapi-typescript ./docs/rebuild/architecture/openapi.yaml -o ./src/types/api.ts
```

### Middleware Implementation

Each endpoint category uses the middleware stack from `MODULE_STRUCTURE.md`:

```typescript
// Unite-Hub routes
export const GET = protectedRoute(
  requireStaff(async ({ user, workspace, supabase }) => {
    // Automatically authenticated + workspace scoped
  })
);

// Synthex routes
export const GET = protectedRoute(
  requireClient(async ({ user, workspace, supabase }) => {
    // Automatically authenticated + tier checked
  })
);
```

---

**Document Status**: COMPLETE
**Date**: 2025-11-29
