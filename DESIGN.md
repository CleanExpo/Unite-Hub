# Design System — Unite-Hub Founder OS

## Product context
- What this is: Unite-Hub is the internal Founder OS and command centre for Unite-Group Nexus.
- Who it is for: Phill McGurk, Margot, Pi-CEO Board, Senior PMs, and AI/machine workers operating the group portfolio.
- Project type: authenticated internal command centre, execution cockpit, governance surface, and portfolio operating system.

## Aesthetic direction
- Direction: Industrial command room.
- Mood: calm, precise, senior, operational, evidence-led.
- Design thesis: Linear structure + Vercel restraint + shadcn component discipline + Retool discoverability.
- Avoid: generic SaaS dashboards, purple gradients, decorative blobs, emoji UI, 3-card feature grids, and fake integration polish.

## Core experience principles
1. Command-first, not page-first.
2. Status before raw data.
3. One selected object at a time.
4. Receipts and evidence are first-class UI.
5. AI agents and machines appear as operational actors.
6. Progressive disclosure beats overloaded dashboards.
7. External-facing or connected workflow surfaces must be honestly labelled: live, connected, draft, pending integration, or requires vault grant.

## Typography
- Display: Geist Sans, used with restraint for page titles and cockpit headers.
- Body/UI: Geist Sans for dense operational readability.
- Data/receipts/code: Geist Mono for IDs, receipts, timestamps, command snippets, and verification results.
- Numeric data: use tabular numbers where possible.
- Avoid: novelty fonts, soft startup display fonts, and decorative typography.

## Type scale
- Page title: 28-36px, semibold, tight line-height.
- Section title: 18-22px, semibold.
- Card title: 14-16px, semibold.
- Body: 14-16px.
- Metadata: 11-13px.
- Receipt IDs: 11-13px mono.

## Colour system
Use a dark graphite base. Colour is for operational meaning, not decoration.

Core surfaces:
- Canvas: #050505
- Sidebar: #0D0D0D
- Card: #111111
- Elevated: #161616
- Overlay: #1F1F1F
- Selected: #2A2A2A

Text:
- Primary: #F0F0F0
- Secondary: #A3A3A3
- Muted: #737373
- Disabled: #525252

Accent:
- Primary accent: #00F5FF
- Accent dim: rgba(0, 245, 255, 0.08)
- Accent border: rgba(0, 245, 255, 0.30)

Semantic:
- Success/completed/live: #22C55E
- Warning/approval/waiting: #F59E0B
- Danger/blocked/error: #EF4444
- Info/running/context: #38BDF8

## Spacing
- Base unit: 4px.
- Normal step: 8px.
- Dashboard density: compact but breathable.
- Use consistent spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.

## Layout
- Founder shell: sidebar + topbar + scrollable workspace.
- Command cockpit pages: prefer 3-column operational layout on desktop:
  1. queue/list/intake
  2. selected object/context
  3. control/evidence/right rail
- Mobile: collapse to stacked order: active status, queue, selected context, controls.
- Cards only when the card is an interaction, receipt, evidence container, or selected context panel.

## Component rules
### Status pills
Every task/run/approval should expose state with a labelled pill. Do not rely on colour alone.

### Receipts
Receipts should show:
- ID
- actor
- timestamp
- action
- evidence link if present
- verification status if present

### Approval gates
Approval UI should say who approves and what happens after approval.

### Machine assignment
Machine UI should show:
- device name
- role
- online/waiting state
- why it was selected

### Empty states
Empty states should be operational:
- current state
- why it is empty
- next useful action

## Motion
- Minimal-functional only.
- Use motion for state transitions, loading, and panel open/close.
- Avoid decorative motion.
- Respect reduced motion.

## Navigation rules
Reduce Founder navigation into mental groups:
- Today
- Command
- Approvals
- Portfolio
- Money
- Evidence
- Machines
- Vault
- Settings

Detailed tools remain accessible through search/command and grouped sections.

## AI-slop blacklist
Do not ship:
- purple/violet/indigo gradient backgrounds as the default look
- three-column feature grids with icon circles
- centered everything
- decorative blobs/waves/floating circles
- emoji as UI icons
- uniform bubbly radii everywhere
- generic hero copy
- cards that exist only to fill space
- fake dashboards showing unverified integrations

## Decisions log
| Date | Decision | Rationale |
|---|---|---|
| 2026-06-02 | Adopt industrial command room direction | Matches Founder OS, Pi-Dev-Ops, governance, machine routing, and evidence-led execution. |
| 2026-06-02 | Browser research baseline recorded | shadcn, Linear, Vercel, and Retool patterns inform command centre simplification. |
