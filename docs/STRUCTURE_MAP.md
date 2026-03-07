# Unite-Group — Structure Map
Generated: 08/03/2026

## CORE modules
- src/app/founder/ — FounderOS executive control (100+ sub-pages)
- src/app/dashboard/ — CRM core (contacts, deals, campaigns, emails, tasks, analytics)
- src/app/(auth)/ — Authentication (Supabase PKCE)
- src/app/(staff)/ — Staff portal
- src/app/(client)/ — Client portal
- src/app/(unite-hub)/ — Kanban + staff-dashboard (route group)
- src/app/erp/ — ERP (invoicing, inventory, purchase orders)
- src/app/api/ — 150+ API routes
- src/app/founder/connections/ — Ecosystem connections manager
- src/app/founder/openclaw/ — OpenClaw control pathway
- src/app/founder/os/ — PhillOS executive interface (AI chat + dashboard + kanban)

## LEGACY / MARKETING (belongs in Synthex, not Unite-Group)
- src/app/resources/ — SEO landing pages (ai-crm-australia, ato-tax-guide)
- src/app/landing/ — Marketing landing pages
- src/app/regions/ — Regional landing pages
- src/app/brand-demo/ — Demo page
- src/app/inspiration/ — Inspiration page

## CONFLICT
- src/app/(unite-hub)/ — Route group named "unite-hub" but content is correct Unite-Group
- src/components/branding/Logo.tsx — Shows "Unite-Hub" text in JSX

## UNKNOWN / FUTURE
- src/app/console/ — Console sub-pages with cryptic names (aglbase, aire, etc.)
- src/app/portal/ — Portal dashboard
- src/app/demo/ — Demo pages
- src/app/demos/ — Demo pages

## Ecosystem Connections Required
- Disaster Recovery — connected via /founder/connections
- NRPG — connected via /founder/connections
- CARSI — connected via /founder/connections
- RestoreAssist — connected via /founder/connections
- Synthex — connected via /founder/connections
