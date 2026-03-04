# Enhanced Shopify Integration — Technical Content Brief — UNI-1236

**Platform**: Unite-Group CRM
**Purpose**: Shopify integration tailored for restoration industry clients
**Date**: 04/03/2026

---

## Overview

"Enhanced Shopify" extends the standard Shopify storefront into a restoration-industry tool. Generic Shopify stores handle retail products — clothing, electronics, consumables. Restoration companies need something different: equipment hire catalogues with daily rates, parts inventories tied to job sites, consumables reordering linked to project consumption, and real-time stock visibility across multiple warehouses.

The enhanced integration adds restoration-specific metafields to Shopify products, synchronises inventory levels bidirectionally between Shopify and the Unite-Group CRM, and processes webhook events so that stock changes in either system propagate instantly.

For Unite-Group clients, this means:
- **Equipment hire** is managed through Shopify's product catalogue with custom metafields for hire duration, daily rate, and certification requirements
- **Parts and consumables** sync with job-level inventory tracking in the CRM, so project managers see real-time availability without checking two systems
- **Automated reordering** triggers when stock levels hit thresholds defined per product, reducing downtime from stockouts on critical items like desiccant, antimicrobial agents, and filter media

---

## 5 Use Cases for Restoration Companies

### 1. Equipment Hire Catalogue
A restoration company maintains a fleet of commercial dehumidifiers, air movers, air scrubbers, and moisture meters. Each piece of equipment is listed as a Shopify product with metafields for hire duration (daily/weekly/monthly), daily rate, minimum hire period, and required IICRC certification level. Property managers and insurance assessors can browse availability and request hires directly. The CRM tracks which equipment is deployed to which job site and automatically marks items as unavailable in Shopify when dispatched.

### 2. Consumables and Parts Inventory
Restoration jobs consume antimicrobial agents, desiccant media, HEPA filters, containment sheeting, PPE, and cleaning chemicals at predictable rates. Each consumable is a Shopify product with metafields for unit size, hazmat classification, and reorder threshold. When a project manager logs material usage against a job in the CRM, stock levels decrement in Shopify automatically. When levels hit the reorder threshold, the system generates a purchase order or alerts the procurement team.

### 3. Internal Parts Ordering
Multi-branch restoration companies use the Shopify storefront as an internal ordering system. Branch managers browse the catalogue, add items to a cart, and "purchase" using internal cost-centre codes. The CRM allocates costs to the relevant job or branch P&L. This eliminates ad-hoc procurement via text messages and spreadsheets, creating an auditable ordering trail.

### 4. Client-Facing Equipment Sales
Some restoration companies sell decommissioned equipment, surplus consumables, or branded merchandise (workwear, PPE kits) to clients and subcontractors. The enhanced Shopify integration lets them maintain a public storefront alongside their internal catalogue. Product metafields distinguish between hire-only, internal-only, and public-sale items, and the CRM filters visibility accordingly.

### 5. Insurance-Linked Inventory Reporting
Insurers increasingly require itemised inventory reports showing what equipment and materials were deployed on a claim. The Shopify integration generates exportable reports from product metafields — equipment serial numbers, deployment dates, daily rates, and total hire costs — formatted for insurer submission. This reduces administrative overhead on claim documentation and accelerates settlement.

---

## Technical Brief: Metafields

### Product Metafields to Add

| Metafield Key | Namespace | Type | Description | Example Value |
|---------------|-----------|------|-------------|---------------|
| `product_type` | `restoration` | `single_line_text_field` | Categorises the product for CRM routing | `equipment_hire`, `consumable`, `part`, `sale_item` |
| `certification_required` | `restoration` | `single_line_text_field` | IICRC certification level required to operate/hire | `WRT`, `FSRT`, `AMRT`, `CCT`, `none` |
| `hire_duration_unit` | `restoration` | `single_line_text_field` | Unit of hire measurement | `daily`, `weekly`, `monthly` |
| `daily_rate_aud` | `restoration` | `number_decimal` | Hire rate per day in AUD (ex-GST) | `85.00` |
| `min_hire_days` | `restoration` | `number_integer` | Minimum hire period in days | `3` |
| `reorder_threshold` | `restoration` | `number_integer` | Stock level that triggers reorder alert | `10` |
| `hazmat_class` | `restoration` | `single_line_text_field` | Hazardous materials classification (if applicable) | `DG8`, `none` |
| `serial_number` | `restoration` | `single_line_text_field` | Equipment serial number (for hire items) | `DH-2024-0847` |
| `deployed_job_id` | `restoration` | `single_line_text_field` | CRM job ID where item is currently deployed | `JOB-20260304-001` |
| `last_calibration_date` | `restoration` | `date` | Last calibration/service date (for equipment) | `2026-01-15` |

### Metafield Registration

Metafields are registered via the Shopify Admin API `POST /admin/api/2024-10/metafield_definitions.json` endpoint, scoped to the `PRODUCT` owner type. Registration should occur during initial integration setup and be idempotent (check existence before creating).

---

## Webhook Events to Handle

### 1. `inventory_levels/update`
- **Trigger**: Stock level changes in Shopify (manual adjustment, sale, return)
- **Action**: CRM receives the webhook, maps the Shopify `inventory_item_id` to the CRM product record, and updates internal stock count. If stock falls below `reorder_threshold` metafield value, generate a reorder alert in the CRM.
- **Payload fields used**: `inventory_item_id`, `location_id`, `available`, `updated_at`

### 2. `products/update`
- **Trigger**: Product details change in Shopify (price, description, metafield values)
- **Action**: CRM syncs the updated product data including all `restoration` namespace metafields. If `deployed_job_id` metafield changes, update the CRM job record to reflect equipment assignment/return.
- **Payload fields used**: `id`, `title`, `variants[].price`, `metafields[]`

### 3. `orders/create`
- **Trigger**: New order placed (external customer or internal branch order)
- **Action**: CRM creates a linked transaction record. If order contains hire items (`product_type` = `equipment_hire`), set `deployed_job_id` metafield and mark item as unavailable. Decrement consumable stock counts.
- **Payload fields used**: `id`, `line_items[]`, `customer`, `created_at`, `note`

### 4. `orders/fulfilled`
- **Trigger**: Order marked as fulfilled in Shopify
- **Action**: CRM updates the transaction status. For hire items, start the hire-period clock for billing. For consumables, confirm stock decrement is final.
- **Payload fields used**: `id`, `fulfillment_status`, `fulfillments[].tracking_number`

---

## API Endpoints

### `POST /api/integrations/shopify/metafields/sync`

**Purpose**: Synchronise restoration-specific metafields from the CRM to Shopify products. Called when product data is updated in the CRM and needs to propagate to the Shopify storefront.

**Request body**:
```json
{
  "shopify_product_id": "8234567890123",
  "metafields": [
    {
      "namespace": "restoration",
      "key": "product_type",
      "value": "equipment_hire",
      "type": "single_line_text_field"
    },
    {
      "namespace": "restoration",
      "key": "daily_rate_aud",
      "value": "85.00",
      "type": "number_decimal"
    },
    {
      "namespace": "restoration",
      "key": "deployed_job_id",
      "value": "JOB-20260304-001",
      "type": "single_line_text_field"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "synced_count": 3,
  "shopify_product_id": "8234567890123",
  "errors": []
}
```

**Error cases**: Invalid product ID (404), invalid metafield type (422), Shopify rate limit (429).

---

### `POST /api/integrations/shopify/inventory/webhook`

**Purpose**: Receive and process Shopify inventory webhook events. Registered as the webhook endpoint in Shopify Admin for `inventory_levels/update`, `products/update`, `orders/create`, and `orders/fulfilled` topics.

**Request headers**:
- `X-Shopify-Topic`: Webhook topic (e.g., `inventory_levels/update`)
- `X-Shopify-Hmac-Sha256`: HMAC signature for request verification
- `X-Shopify-Shop-Domain`: Originating shop domain

**Request body**: Raw Shopify webhook payload (varies by topic — see Shopify Webhook API documentation).

**Processing flow**:
1. Verify HMAC signature against shared secret
2. Parse `X-Shopify-Topic` header to determine event type
3. Route to appropriate handler (inventory update, product update, order create, order fulfilled)
4. Process synchronously for critical events (stock alerts), asynchronously (queue) for non-critical (product metadata sync)
5. Return `200 OK` immediately to Shopify (process in background to avoid timeout)

**Response**: `200 OK` (empty body — Shopify requires 2xx within 5 seconds or retries).

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UNITE-GROUP CRM                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │  Job Manager  │    │  Inventory   │    │   Reorder Engine      │  │
│  │              │    │   Tracker    │    │                       │  │
│  │ - Deploy equip│───▶│ - Stock lvls │───▶│ - Threshold check     │  │
│  │ - Log usage   │    │ - Location   │    │ - PO generation       │  │
│  │ - Return equip│    │ - History    │    │ - Alert dispatch      │  │
│  └──────┬───────┘    └──────┬───────┘    └───────────────────────┘  │
│         │                   │                                       │
│         ▼                   ▼                                       │
│  ┌─────────────────────────────────────┐                            │
│  │     Shopify Integration Service     │                            │
│  │                                     │                            │
│  │  POST /metafields/sync       ──────────────────┐                 │
│  │  POST /inventory/webhook     ◀─────────────────┼────────┐       │
│  └─────────────────────────────────────┘           │        │       │
└────────────────────────────────────────────────────┼────────┼───────┘
                                                     │        │
                        CRM ──▶ Shopify              │        │  Shopify ──▶ CRM
                        (metafield sync)             │        │  (webhooks)
                                                     │        │
┌────────────────────────────────────────────────────┼────────┼───────┐
│                       SHOPIFY                      │        │       │
│                                                    ▼        │       │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────┐ │       │
│  │   Product     │    │  Inventory   │    │   Webhook      │ │       │
│  │   Catalogue   │    │   Levels     │    │   Dispatcher   │─┘       │
│  │              │    │              │    │                │         │
│  │ - Metafields  │    │ - Available  │    │ - inventory/   │         │
│  │ - Variants    │    │ - Committed  │    │   update       │         │
│  │ - Images      │    │ - Locations  │    │ - products/    │         │
│  └──────────────┘    └──────────────┘    │   update       │         │
│                                          │ - orders/      │         │
│  ┌──────────────┐    ┌──────────────┐    │   create       │         │
│  │   Orders      │    │  Storefront  │    │ - orders/      │         │
│  │              │    │   (Public)   │    │   fulfilled    │         │
│  │ - Hire orders │    │              │    └────────────────┘         │
│  │ - Internal    │    │ - Browse     │                               │
│  │ - Consumables │    │ - Cart       │                               │
│  └──────────────┘    │ - Checkout   │                               │
│                      └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘

Data Flow Summary:
─────────────────
1. CRM ──▶ Shopify:  Metafield sync (product type, rates, job assignments)
2. Shopify ──▶ CRM:  Webhooks (stock changes, orders, fulfilments)
3. CRM internal:     Reorder engine monitors thresholds, generates alerts/POs
4. Shopify internal:  Storefront serves catalogue, processes orders
```
