# Unite-Hub Command Center UI/UX Brief

## Purpose
Unite-Hub is the Founder OS command centre for Unite-Group Nexus. It should simplify executive control, not become a decorative dashboard.

The interface must help Phill see, in seconds:
- what needs attention
- what is running
- what is blocked
- what has evidence
- who/what owns the next action
- which machine is assigned
- what governance path applies
- what labour/receipt trail exists

## Browser research inputs
Reviewed through browser/visual inspection:
- shadcn/ui dashboard blocks: disciplined primitives, sidebar, command search, metric/table patterns.
- Linear: agent-as-teammate, task context, activity feed, side-panel detail, status-first work tracking.
- Vercel: restrained monochrome system, thin-grid segmentation, high-confidence status/action hierarchy.
- Retool: operational IA, search/filter first, standardised launcher cards, progressive disclosure.

## Design thesis
Linear structure + Vercel restraint + shadcn component discipline + Retool discoverability.

Unite-Hub should feel like a premium operations room: calm, dense, precise, evidence-led.

## Command center simplification rules
1. Command-first, not page-first.
   - Global command/search is primary.
   - Navigation is grouped and secondary.

2. Status before data.
   - Every task/run/card must expose status: queued, approval, waiting, running, blocked, completed.

3. One selected object at a time.
   - Lists stay left; selected context appears center/right.
   - Avoid forcing every detail into equal dashboard cards.

4. Receipts are first-class UI.
   - Evidence, commits, test loops, approvals, blockers, and labour should be displayed as operational receipts.

5. AI agents are team members.
   - Margot, Pi-CEO Board, Senior PM, Pi-Dev-Ops, and machine workers should appear as owners/actors, not hidden logs.

6. Progressive disclosure.
   - Show outcome/status first.
   - Let technical evidence and logs expand/drill down.

7. No fake integration surface.
   - External workflows must be labelled live, connected, draft, pending integration, or requires vault grant.

## Recommended information architecture
Primary rail:
- Today
- Command
- Approvals
- Portfolio
- Money
- Evidence
- Machines
- Vault
- Settings

Operational groups:
- Command Queue
- Pi-Dev-Ops
- Boardroom
- Workspace
- Contacts
- Campaigns
- Bookkeeper/Xero
- Notes/Calendar

Governance actors:
- Margot intake
- Pi-CEO Board decision
- Senior PM delivery
- Pi-Dev-Ops execution
- Machine assignment

## Pi cockpit target layout
Three-column command layout:

1. Queue column
   - queue summary
   - task list
   - status pills
   - route/new command intake

2. Selected run column
   - task packet
   - risk/lane/type
   - machine assignment
   - next action
   - context summary

3. Control/evidence column
   - approve/start/block/complete
   - required evidence input
   - latest receipt
   - approvals/blockers/evidence links

## Visual rules
- Dark graphite base.
- Thin borders and clear grid lines.
- Very limited accent colour.
- Semantic colours only for state.
- No decorative card grids.
- No purple SaaS gradients.
- No emoji-as-UI.
- No all-centered dashboard sections.
- Cards only when the card is an interaction, receipt, or evidence container.

## Implementation sequence
1. DESIGN.md design constitution.
2. Founder OS command primitives.
3. /founder/pi cockpit redesign.
4. /founder/dashboard attention/in-motion/blocked/evidence/money redesign.
5. Navigation consolidation.
6. Browser QA + responsive + console + test/type-check loops.

## Verification rule
For every UI lane:
- targeted tests where behavior changes
- pnpm type-check
- browser render check
- console error check
- responsive screenshot pass
- 3 clean loops before commit
