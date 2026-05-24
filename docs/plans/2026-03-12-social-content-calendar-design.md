# Social Content Calendar — Design Document

**Date:** 12/03/2026
**Linear:** UNI-1517
**Phase:** 4 — Integration Layer

---

## Goal

Full content calendar for all 5 social platforms (Facebook, Instagram, LinkedIn, TikTok, YouTube) — OAuth connections, post scheduling, cross-posting, and per-platform analytics — accessible per business from `/founder/social`.

---

## Approach

Direct platform APIs (Approach A) — same OAuth pattern as Xero and Google already in the codebase. All tokens encrypted in `social_channels` table. No third-party aggregators. No ongoing costs.

---

## Architecture

### OAuth Flows (4 flows, 5 platforms)

| Flow | Platforms | Routes | Token Storage |
|------|-----------|--------|---------------|
| Meta Facebook Login | Facebook Pages + Instagram Business | `/api/auth/meta/authorize` + `/callback` | `social_channels` |
| LinkedIn OAuth 2.0 | LinkedIn company pages | `/api/auth/linkedin/authorize` + `/callback` | `social_channels` |
| TikTok OAuth 2.0 | TikTok creator accounts | `/api/auth/tiktok/authorize` + `/callback` | `social_channels` |
| Google (extend existing) | YouTube channels | Extend `/api/auth/google/` — add YouTube scopes | `credentials_vault` |

**Meta note:** Single OAuth for both Facebook and Instagram via Facebook Login. Two rows stored in `social_channels` (one per platform), sharing the same access token.

**YouTube note:** Piggybacks on existing Google OAuth. Add `youtube.readonly` + `youtube.upload` scopes to the existing authorize URL builder.

**TikTok note:** TikTok API only supports video content — text-only posts are not publishable via API.

### Database (migrated: `20260312000000_social_content_calendar.sql`)

**`social_channels`** (extended with new columns):
- `business_key` TEXT — maps to codebase business keys ('dr', 'synthex', etc.)
- `handle` TEXT — @username or page name
- `name` TEXT — display name
- `follower_count` INTEGER — synced periodically
- `profile_image_url` TEXT
- `last_synced_at` TIMESTAMPTZ

**`social_posts`** (new table):
- `founder_id` UUID — owner, RLS enforced
- `business_key` TEXT — which business this post belongs to
- `content` TEXT — post body
- `media_urls` TEXT[] — attached images/videos
- `platforms` TEXT[] — target platforms for this post (`['facebook', 'instagram']`)
- `status` TEXT — `draft | scheduled | publishing | published | failed`
- `scheduled_at` TIMESTAMPTZ — when to publish
- `platform_post_ids` JSONB — returned IDs after publish (`{"facebook": "123", "instagram": "456"}`)
- `error_message` TEXT — last publish error

### API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/auth/meta/authorize` | Meta OAuth initiation |
| GET | `/api/auth/meta/callback` | Meta token exchange + vault store |
| GET | `/api/auth/linkedin/authorize` | LinkedIn OAuth initiation |
| GET | `/api/auth/linkedin/callback` | LinkedIn token exchange + vault store |
| GET | `/api/auth/tiktok/authorize` | TikTok OAuth initiation |
| GET | `/api/auth/tiktok/callback` | TikTok token exchange + vault store |
| GET | `/api/social/channels` | List connected accounts (per business) |
| GET | `/api/social/posts` | List posts (filter: business, status, date range) |
| POST | `/api/social/posts` | Create draft or scheduled post |
| PATCH | `/api/social/posts/[id]` | Update post (reschedule, edit content) |
| DELETE | `/api/social/posts/[id]` | Delete draft |
| POST | `/api/social/publish/[id]` | Manually trigger publish |

### UI — `/founder/social`

Extended from existing stub (5 platform cards) to:

```
┌─────────────────────────────────────────────────┐
│ Connection Strip: [FB ✓] [IG ✓] [LI ✗] [TT ✗] [YT ✗] │
├─────────────────────────────────────────────────┤
│ Business Tabs: [All] [DR] [Synthex] [CARSI] ...  │
├─────────────────┬───────────────────────────────┤
│ [Calendar] [Posts] [Analytics]                   │
│                                                   │
│ Calendar View: Monthly grid                       │
│ — Post chips colour-coded by platform             │
│ — Click chip → edit post modal                    │
│                                                   │
│ Posts List: Drafts / Scheduled / Published        │
│ — Filter bar, status badges, quick actions        │
│                                                   │
│ Analytics: Per-platform follower counts           │
│ + recent engagement metrics                       │
└──────────────────────────────────── [+ New Post] ┘
```

**PostComposer modal:**
- Content textarea (character count per platform)
- Platform checkboxes (only shows connected platforms)
- Business selector
- Media upload (images/video)
- Schedule date + time picker
- Actions: Save Draft / Schedule / Post Now

---

## Integration Library Structure

```
src/lib/integrations/
├── social/
│   ├── meta.ts        — Facebook + Instagram Graph API client
│   ├── linkedin.ts    — LinkedIn Marketing API client
│   ├── tiktok.ts      — TikTok Content Posting API client
│   ├── youtube.ts     — YouTube Data API v3 client (extends google.ts)
│   └── index.ts       — Barrel + shared types (SocialPlatform, SocialPost)
```

---

## Token Refresh Strategy

| Platform | Token Lifetime | Refresh Strategy |
|----------|---------------|------------------|
| Meta (FB/IG) | 60 days (long-lived) | Exchange short → long-lived on callback; re-auth at 55 days |
| LinkedIn | 60 days | Refresh token (12 months) via standard OAuth refresh |
| TikTok | 24 hours | Refresh token (30 days) via standard OAuth refresh |
| YouTube | 1 hour | Extend existing `getValidToken()` in `google.ts` |

---

## Error Handling

- Failed publishes: update `status = 'failed'`, store `error_message`
- Token expiry mid-publish: attempt refresh once, then fail gracefully
- Partial cross-post success: store per-platform IDs in `platform_post_ids`, mark `status = 'published'` (platform-level errors in `error_message` JSON)
- Platform API rate limits: 429 responses → log error, do not retry automatically

---

## Testing

- Unit: OAuth URL builders, token encrypt/decrypt, platform API client mocks
- Integration: Supabase insert/select via test founder_id
- E2E: Connect flow (mock OAuth callback), create draft, schedule post, view in calendar

---

## Environment Variables Required

```bash
# Meta
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# YouTube (already have Google OAuth vars)
# GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET already set
```
