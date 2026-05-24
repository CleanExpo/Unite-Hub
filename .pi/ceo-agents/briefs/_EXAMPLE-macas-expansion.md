# Brief: Should We Expand MACAS to Include Tax Filing Recommendations?

**Date Submitted:** 24/03/2026
**Submitted By:** Phill McGurk
**Decision Needed By:** 07/04/2026
**Board Topic:** Strategic
**Affects Businesses:** All 7 (via MACAS advisory system)

---

> **⚠️ GOLDEN EXAMPLE BRIEF**
> This is a reference example showing how to structure a CEO Board brief for Unite-Group.
> It demonstrates the level of detail, format, and question quality that produces good deliberations.
> Copy `_TEMPLATE.md` for real briefs — do not overwrite this file.

---

## Situation

MACAS currently provides competitive accounting advisory through 4 parallel AI firm personas — each analysing financial scenarios from their own methodology and debating to produce higher-quality recommendations. The system handles P&L analysis, cash flow modelling, and business health scoring.

An opportunity has emerged: two of the 7 businesses have asked whether MACAS could extend into tax filing recommendations — specifically BAS (Business Activity Statements) and income tax timing advice. This is a significant capability expansion, moving MACAS from advisory into near-compliance territory.

The ATO has published its AI guidance framework (March 2026), which permits AI-assisted tax advice provided a licensed tax agent reviews and signs off all submissions. This creates a viable compliance pathway.

## Stakes

**Downside if we choose poorly:**
- Compliance liability: if MACAS produces incorrect tax advice and it's relied upon without review, there is potential ATO penalty exposure
- Reputational risk: tax advice errors are high-visibility failures that damage trust across all 7 businesses
- Over-engineering: building tax filing capability dilutes focus from the core MACAS advisory advantage

**Upside if we choose well:**
- MACAS becomes a genuine end-to-end financial management tool — significantly higher value
- Reduces reliance on external accountants for routine BAS preparation (cost saving in AUD)
- Creates a differentiator: no other AUS SME tool combines 4-firm competitive advisory + tax filing
- Data flywheel: tax filing data improves financial modelling accuracy for all 7 businesses

---

## Constraints

- Constraint 1: Must comply with ATO's AI guidance framework — licensed tax agent sign-off required for any output used in actual filings
- Constraint 2: Solo operator (Phill) — implementation complexity must be manageable without additional team
- Constraint 3: Supabase/Vercel stack — no separate backend allowed; tax logic must live in Next.js service layer
- Constraint 4: Privacy Act 1988 — tax file numbers (TFNs) require enhanced data handling; pgsodium vault already exists but scope must extend
- Constraint 5: Budget constraint: no new paid SaaS subscriptions without clear ROI in AUD

---

## Key Questions for the Board

1. **Risk tolerance** — Given the ATO compliance pathway exists, does the tax filing extension create acceptable risk for a solo operator?
2. **Build vs. integrate** — Should we build native BAS logic in MACAS or integrate with an existing ATO-compliant tool via API?
3. **Sequencing** — If we proceed, what's the minimum viable first step? (e.g., BAS calculation only, not lodgement)
4. **Data handling** — What additional security controls are required for TFN data beyond the existing pgsodium vault?

---

## Background & Supporting Context

- MACAS current state: 4 firms running in parallel via `Promise.allSettled`, minimum 2 required, Zod validation on all outputs (ADR-R07)
- ATO AI guidance: Published March 2026 — allows AI-assisted advice with licensed agent sign-off
- Current tax workflow: Phill uses an external accountant for BAS and income tax; cost ~$X/month AUD
- Nexus CRM pgsodium vault: Already handles Xero encryption (ADR-006); TFN storage would extend this pattern
- Reference: `.pi/ceo-agents/memos/` (no prior memos — this is the inaugural deliberation)

---

## Proposed Options

### Option A: Native BAS Calculation (Build)
Build BAS calculation logic directly into MACAS. Output: calculated BAS figures with 4-firm cross-check. Human signs off and lodges via MyGov Business Portal.
- **Pros:** Full control; leverages MACAS competitive structure; no external API dependency
- **Cons:** Complex GST logic; requires ongoing ATO rule updates; accountant still needed for sign-off

### Option B: ATO API Integration
Integrate with ATO's Business Portal API for direct lodgement. MACAS prepares the data; API lodges.
- **Pros:** Direct lodgement; reduces manual steps
- **Cons:** ATO API approval process (months); complexity; still requires licensed agent sign-off per ATO guidance

### Option C: Defer — Focus on Core Advisory First
Do not extend into tax filing. Keep MACAS focused on advisory (P&L, cash flow, health scoring). Revisit in 12 months once all 7 businesses are fully onboarded.
- **Pros:** Reduces scope; no compliance risk; preserves focus
- **Cons:** Misses the window while ATO AI guidance is fresh; external accountant cost continues

---

**End of Brief**

---

> **How to use this example:**
> Notice the level of specificity in the Situation and Stakes sections. The board deliberates better when:
> - Concrete constraints are named (Privacy Act, ATO framework)
> - Financial implications use AUD
> - Technical constraints reference actual ADRs
> - Options are genuinely distinct (not just "do it" vs "don't do it")
> - Key Questions are genuine dilemmas, not leading questions
