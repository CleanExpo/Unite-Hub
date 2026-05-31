# Entity Register — McGurk Family Trust Group

> **Purpose:** Accountant-ready register of the business structure under Phill McGurk's login.
> Prepared for handover to a registered Australian tax agent / accountant.
> **Prepared:** 31/05/2026 | **Locale:** en-AU | **Currency:** AUD
> **Status:** DRAFT — legal/tax fields marked `‹CONFIRM›` require your records or your accountant.

---

## ⚠️ Read first — what this document is and is not

This register is **data preparation**, not tax or legal advice. It organises what the CRM/portfolio
currently knows so your accountant has a clean starting point. The actual structuring decisions —
trust deed, corporate trustee, ABN/ACN/TFN/GST registrations, trust distributions, Div 7A,
asset protection — are **regulated work for your registered tax agent**. Nothing here should be
treated as a completed registration or as advice.

**Central issue the accountant must resolve:** the systems currently track **software products**,
not **legal entities**. A product (e.g. "Synthex") is not automatically a separate company or trust.
The first job is to decide which of the items below are *separate legal entities* and which are
*trading names / product lines operating under one entity*.

---

## 1. Intended structure (as described by Phill — `‹CONFIRM›` with accountant)

```
            ┌─────────────────────────────────┐
            │   McGurk Family Trust           │   ← Holder / owner  ‹CONFIRM trust deed, date, TFN›
            │   (discretionary family trust)  │
            └────────────────┬────────────────┘
                             │ owns / is beneficiary of
            ┌────────────────▼────────────────┐
            │   Unite-Group Nexus Pty Ltd     │   ← Head entity / umbrella  ‹CONFIRM ACN, ABN, role›
            │   (corporate trustee OR holding │      Is this the corporate trustee of the trust,
            │    company — to confirm)        │      a holding company it owns, or both?
            └────────────────┬────────────────┘
                             │ operates / owns
   ┌──────────────┬──────────┴───────┬──────────────┬─────────────┐
   ▼              ▼                  ▼              ▼             ▼
 (operating entities OR trading divisions — see register §2; each needs an ABN/GST decision)
```

**Open structural questions for the accountant (`‹CONFIRM›`):**
1. Is **Unite-Group Nexus Pty Ltd** the **corporate trustee** of the McGurk Family Trust, a **holding company** beneath it, or both?
2. Are the businesses in §2 **separate registered companies**, or **trading names** under one operating entity?
3. Which entity holds the **bank accounts / contracts / IP** for each product?
4. GST registration threshold ($75k turnover) — which entities are/should be registered?

---

## 2. Business register (verified from live CRM + portfolio data)

Source: `businesses` table (Supabase `lksfwktwtmyznckodsau`, founder-scoped) + `.portfolio/PORTFOLIO.yaml`.
The first 7 rows exist in the CRM; the last 4 exist in the portfolio registry but **not** in the CRM (gap flagged in §3).

| # | Product / business | CRM status | ARR (AUD) | GitHub repo | Legal entity name `‹CONFIRM›` | ABN `‹CONFIRM›` | ACN `‹CONFIRM›` | GST reg? `‹CONFIRM›` | Separate entity or trading name? `‹CONFIRM›` |
|---|--------------------|-----------|-----------|-------------|-------------------------------|-----------------|-----------------|----------------------|----------------------------------------------|
| 1 | Unite-Group Nexus (head) | — | — | — | Unite-Group Nexus Pty Ltd | ‹ › | ‹ › | ‹ › | Head entity |
| 2 | CCW-ERP/CRM | active | 33,000 | — | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 3 | Disaster Recovery | active | 0 | — | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 4 | NRPG | active | 0 | — | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 5 | RestoreAssist | active | 0 | — | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 6 | Synthex | active | 0 | CleanExpo/Synthex | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 7 | CARSI | active | 0 | CleanExpo/CARSI | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 8 | ATO Tax Optimizer | planning | 0 | — | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 9 | Unite-Hub (this CRM) | not in CRM tbl | — | CleanExpo/Unite-Hub | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 10 | Authority-Site | not in CRM tbl | — | CleanExpo/Unite-Group | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 11 | Pi-Dev-Ops | not in CRM tbl | — | CleanExpo/Pi-Dev-Ops | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |
| 12 | Hermes | not in CRM tbl | — | — | ‹ › | ‹ › | ‹ › | ‹ › | ‹ › |

> ARR shown is what the CRM records today (only CCW carries a figure: $33,000). All others read $0 — `‹CONFIRM›` actual FY revenue per entity with your accountant from bank/Xero data, not from this field.

---

## 3. Data hygiene gaps found (the "messy" part — fixable in the CRM once structure is confirmed)

| Gap | Detail | Fix path |
|-----|--------|----------|
| **Products ≠ entities** | CRM models software products; no legal-entity layer exists | Add entity fields once §1/§2 confirmed (schema change — gated, see §4) |
| **CRM ↔ portfolio mismatch** | 7 businesses in CRM vs 12 products in `PORTFOLIO.yaml`; Unite-Hub/Authority-Site/Pi-Dev-Ops/Hermes missing from CRM | Reconcile after entity decision (don't add blind) |
| **No legal fields populated** | `legal_entity`, `abn`, `holder` all empty on every row | Populate from accountant-confirmed register |
| **Naming drift** | CRM "NRPG" = portfolio "DR-NRPG"; CRM "ATO Tax Optimizer" = portfolio "ATO-APP"; CRM "CCW-ERP/CRM" = portfolio "CCW-CRM" | Normalise to one canonical name per entity |

---

## 4. What I can do in the CRM once you confirm the structure (gated on your facts)

These are **data changes** I can make — none replace accountant work:

1. **Add an entity-structure layer** to the `businesses` table (holder, parent entity, entity type, ABN, ACN, GST status) — this is a schema migration on the shared prod DB, so it's **HIGH RISK / approval-gated** and only worth doing once §1 answers are known.
2. **Reconcile CRM ↔ portfolio** so there's one row per real entity with a canonical name.
3. **Populate the register** above from your accountant-confirmed values.
4. **Export** this register as a clean PDF/spreadsheet for accountant handover.

---

## 5. Hand-to-accountant checklist (facts only you / your records hold)

For each entity in §2, your accountant will need:
- [ ] Legal entity name + entity type (Pty Ltd / trust / sole trader / partnership)
- [ ] ABN, ACN (if company), TFN
- [ ] GST registration status + date
- [ ] Financial-year-end and which years have been lodged
- [ ] Trust deed (for McGurk Family Trust) — date, trustee, appointor, beneficiaries
- [ ] Whether Unite-Group Nexus Pty Ltd is the corporate trustee or a holding company
- [ ] Bank accounts / contracts / IP ownership per entity
- [ ] Xero (or other) file per entity — note: vault holds Xero tokens for `dr` and `carsi` already

---

*This register is generated data preparation. It is not financial, tax, or legal advice. Confirm all `‹CONFIRM›` fields with a registered Australian tax agent before relying on them.*
