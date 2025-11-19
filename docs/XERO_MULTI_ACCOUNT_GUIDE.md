# Xero Multi-Account Integration Guide

**Created**: 2025-11-19
**Status**: Ready for Testing
**Migration**: 052_multi_xero_accounts.sql

---

## Overview

Unite-Hub now supports connecting **multiple Xero accounts** to a single organization. This is perfect for:

- 🏢 **Companies with multiple subsidiaries** (each with own Xero account)
- 📊 **Holding companies** tracking costs across portfolio companies
- 🏪 **Franchise owners** managing multiple locations
- 🎯 **Agencies** tracking costs per client's Xero account
- 💼 **Businesses with separate entities** (e.g., Main Business + Property Company)

---

## Features

### ✅ What You Can Do

1. **Connect Multiple Xero Accounts**
   - Connect unlimited Xero organizations
   - Each has unique OAuth credentials
   - Independent token management

2. **Label Each Account**
   - Custom labels (e.g., "Main Business", "Subsidiary A", "Franchise Location 1")
   - Auto-labeled with Xero organization name by default
   - Easy identification in UI

3. **Primary Account**
   - One account marked as "primary"
   - Used by default for expense tracking
   - Can be changed anytime

4. **Per-Account Tracking**
   - Track expenses to specific accounts
   - View costs per Xero organization
   - Separate P&L for each business

5. **Independent Management**
   - Disconnect individual accounts
   - Update labels independently
   - Refresh tokens automatically

---

## Database Schema Changes

### Migration 052: Multi-Account Support

**New Columns in `xero_tokens`**:
```sql
account_label TEXT           -- Custom label (e.g., "Main Business")
is_primary BOOLEAN           -- True for default account
```

**New Columns in `operational_expenses`**:
```sql
xero_tenant_id TEXT          -- Which Xero account this expense belongs to
```

**New Columns in `client_invoices`**:
```sql
xero_tenant_id TEXT          -- Which Xero account the invoice was created in
```

**New View: `xero_accounts_summary`**:
```sql
SELECT
  organization_id,
  tenant_id,
  account_label,
  is_primary,
  xero_org_name,
  connected_at,
  total_expenses,
  total_cost,
  total_invoices,
  total_revenue
FROM xero_tokens
LEFT JOIN operational_expenses ...
LEFT JOIN client_invoices ...
GROUP BY tenant_id
```

---

## API Reference

### 1. Get All Connected Accounts

**Endpoint**: `GET /api/integrations/xero/status`

**Response**:
```json
{
  "connected": true,
  "accounts": [
    {
      "tenantId": "abc-123",
      "accountLabel": "Main Business",
      "organizationName": "Acme Corp",
      "isPrimary": true,
      "connectedAt": "2025-11-19T10:00:00Z",
      "lastUpdated": "2025-11-19T12:00:00Z",
      "tokenExpiresIn": "24 hours",
      "totalExpenses": 45,
      "totalCost": 127.50,
      "totalInvoices": 12,
      "totalRevenue": 10800.00
    },
    {
      "tenantId": "def-456",
      "accountLabel": "Subsidiary A",
      "organizationName": "Acme Subsidiary Pty Ltd",
      "isPrimary": false,
      "connectedAt": "2025-11-19T11:00:00Z",
      "lastUpdated": "2025-11-19T12:30:00Z",
      "tokenExpiresIn": "23 hours",
      "totalExpenses": 12,
      "totalCost": 34.20,
      "totalInvoices": 3,
      "totalRevenue": 2700.00
    }
  ],
  "accountCount": 2,
  "message": "2 Xero accounts connected"
}
```

---

### 2. Connect New Account

**Endpoint**: `POST /api/integrations/xero/connect`

**Flow**:
1. User clicks "Connect Another Xero Account"
2. Redirects to Xero OAuth
3. User authorizes the new account
4. Redirects back to integrations page
5. New account appears in list

**Auto-Behavior**:
- First account: Marked as primary automatically
- Additional accounts: Not primary by default
- Account labeled with Xero org name

---

### 3. Set Primary Account

**Endpoint**: `POST /api/integrations/xero/set-primary`

**Request Body**:
```json
{
  "tenantId": "def-456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Primary account updated successfully"
}
```

**Effect**:
- Sets `is_primary = true` for selected account
- Sets `is_primary = false` for all other accounts
- Future expenses default to this account

---

### 4. Update Account Label

**Endpoint**: `POST /api/integrations/xero/update-label`

**Request Body**:
```json
{
  "tenantId": "abc-123",
  "accountLabel": "Main Business - 2025"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Account label updated successfully"
}
```

---

### 5. Disconnect Account

**Endpoint**: `POST /api/integrations/xero/disconnect`

**Request Body (disconnect specific account)**:
```json
{
  "tenantId": "def-456"
}
```

**Request Body (disconnect ALL accounts)**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "message": "Xero account disconnected successfully"
}
```

---

## Cost Tracking with Multiple Accounts

### Default Behavior (Primary Account)

When tracking expenses **without** specifying `xero_tenant_id`:

```typescript
await CostTracker.trackExpense({
  organizationId,
  workspaceId,
  clientId,
  expenseType: 'openrouter',
  description: 'Claude 3.5 Sonnet - content generation',
  amount: 0.0245,
  tokensUsed: 1234,
  // xero_tenant_id omitted → goes to primary account
});
```

**Result**: Expense tracked to primary Xero account.

---

### Specific Account Tracking

When tracking expenses **to a specific account**:

```typescript
await CostTracker.trackExpense({
  organizationId,
  workspaceId,
  clientId,
  expenseType: 'openrouter',
  description: 'Claude 3.5 Sonnet - content generation',
  amount: 0.0245,
  tokensUsed: 1234,
  xero_tenant_id: 'def-456', // ← Specific account
});
```

**Result**: Expense tracked to "Subsidiary A" account.

---

### Use Cases

#### 1. Agency Tracking Per Client

```typescript
// Client A uses Main Business Xero account
await CostTracker.trackExpense({
  ...params,
  clientId: 'client-a-id',
  xero_tenant_id: 'main-business-tenant-id'
});

// Client B uses Subsidiary Xero account
await CostTracker.trackExpense({
  ...params,
  clientId: 'client-b-id',
  xero_tenant_id: 'subsidiary-tenant-id'
});
```

#### 2. Franchise Multi-Location Tracking

```typescript
// Location 1 expenses
await CostTracker.trackExpense({
  ...params,
  xero_tenant_id: 'franchise-location-1-tenant-id'
});

// Location 2 expenses
await CostTracker.trackExpense({
  ...params,
  xero_tenant_id: 'franchise-location-2-tenant-id'
});
```

#### 3. Holding Company Portfolio Tracking

```typescript
// Portfolio Company A
await CostTracker.trackExpense({
  ...params,
  xero_tenant_id: 'portfolio-company-a-tenant-id'
});

// Portfolio Company B
await CostTracker.trackExpense({
  ...params,
  xero_tenant_id: 'portfolio-company-b-tenant-id'
});
```

---

## UI Implementation (Future)

The settings/integrations page will be updated to show:

### Multiple Account List

```
┌─────────────────────────────────────────────────────┐
│ Xero Accounting                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Connected Accounts]                                │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Main Business                 [Primary]     │   │
│ │ Acme Corp                                   │   │
│ │ Connected: Nov 19, 2025                     │   │
│ │ Expenses: 45  Cost: $127.50                 │   │
│ │                                              │   │
│ │ [Edit Label] [Set Primary] [Disconnect]     │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Subsidiary A                                │   │
│ │ Acme Subsidiary Pty Ltd                     │   │
│ │ Connected: Nov 19, 2025                     │   │
│ │ Expenses: 12  Cost: $34.20                  │   │
│ │                                              │   │
│ │ [Edit Label] [Set Primary] [Disconnect]     │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [+ Connect Another Xero Account]                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Features

1. **Primary Badge**: Shows which account is default
2. **Account Stats**: Shows expense count and total cost
3. **Edit Label**: Change custom label
4. **Set Primary**: Make this the default account
5. **Disconnect**: Remove specific account
6. **Connect Another**: Add additional Xero accounts

---

## XeroService API Updates

### Initialize with Specific Account

```typescript
// Initialize with primary account
await xeroService.initialize(organizationId);

// Initialize with specific account
await xeroService.initialize(organizationId, 'def-456');
```

### Get All Accounts

```typescript
const accounts = await xeroService.getAllAccounts(organizationId);
// Returns array of all connected accounts with stats
```

### Set Primary Account

```typescript
await xeroService.setPrimaryAccount(organizationId, 'def-456');
// Sets specified account as primary
```

### Update Account Label

```typescript
await xeroService.updateAccountLabel(organizationId, 'def-456', 'New Label');
// Updates custom label
```

### Disconnect Specific Account

```typescript
await xeroService.disconnect(organizationId, 'def-456');
// Disconnects only specified account
```

### Disconnect All Accounts

```typescript
await xeroService.disconnect(organizationId);
// Disconnects all accounts
```

---

## Testing Checklist

### Prerequisites
- [ ] Run migration 052 in Supabase
- [ ] Restart dev server (to load updated XeroService)

### Test Flow 1: Connect Multiple Accounts

1. ✅ Navigate to `/dashboard/settings/integrations`
2. ✅ Click "Connect Xero" (first account)
3. ✅ Authorize in Xero
4. ✅ Verify redirect back with success message
5. ✅ Verify account shows as "Primary"
6. ✅ Click "Connect Another Xero Account" (UI to be updated)
7. ✅ Authorize second Xero account
8. ✅ Verify two accounts appear in list
9. ✅ Verify second account NOT marked as primary

### Test Flow 2: Set Primary Account

1. ✅ Call `POST /api/integrations/xero/set-primary` with `tenantId`
2. ✅ Verify response: `{ success: true }`
3. ✅ Call `GET /api/integrations/xero/status`
4. ✅ Verify primary account changed
5. ✅ Verify only one account has `isPrimary: true`

### Test Flow 3: Update Account Label

1. ✅ Call `POST /api/integrations/xero/update-label`
2. ✅ Body: `{ tenantId: "abc-123", accountLabel: "Test Label" }`
3. ✅ Verify response: `{ success: true }`
4. ✅ Call `GET /api/integrations/xero/status`
5. ✅ Verify account label updated

### Test Flow 4: Cost Tracking

1. ✅ Track expense without `xero_tenant_id`
2. ✅ Query `operational_expenses` table
3. ✅ Verify `xero_tenant_id` is NULL (uses primary account)
4. ✅ Track expense with specific `xero_tenant_id`
5. ✅ Verify `xero_tenant_id` matches specified account

### Test Flow 5: Disconnect Specific Account

1. ✅ Call `POST /api/integrations/xero/disconnect` with `tenantId`
2. ✅ Verify only that account removed from database
3. ✅ Verify other accounts still connected
4. ✅ If primary account was disconnected, verify new primary set

### Test Flow 6: View Account Summary

1. ✅ Call `GET /api/integrations/xero/status`
2. ✅ Verify `accounts` array contains all connected accounts
3. ✅ Verify `totalExpenses`, `totalCost` accurate per account
4. ✅ Verify `accountCount` matches number of accounts

---

## SQL Queries for Manual Testing

### View All Connected Accounts

```sql
SELECT
  account_label,
  tenant_name,
  is_primary,
  connected_at,
  expires_at
FROM xero_tokens
WHERE organization_id = 'your-org-id'
ORDER BY is_primary DESC, connected_at ASC;
```

### View Account Summary (with stats)

```sql
SELECT * FROM xero_accounts_summary
WHERE organization_id = 'your-org-id'
ORDER BY is_primary DESC;
```

### View Expenses by Account

```sql
SELECT
  xero_tenant_id,
  COUNT(*) AS expense_count,
  SUM(amount) AS total_cost,
  MIN(created_at) AS first_expense,
  MAX(created_at) AS last_expense
FROM operational_expenses
WHERE organization_id = 'your-org-id'
GROUP BY xero_tenant_id
ORDER BY total_cost DESC;
```

### Find Expenses Without Account Assignment

```sql
SELECT
  id,
  expense_type,
  description,
  amount,
  created_at
FROM operational_expenses
WHERE organization_id = 'your-org-id'
  AND xero_tenant_id IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

## Backward Compatibility

### Existing Single-Account Setups

**Migration 052 automatically**:
1. Sets `is_primary = true` for existing single accounts
2. Sets `account_label` to Xero organization name
3. Preserves all existing expense data

**No action required** for existing users.

### Existing Expense Records

**All existing expenses remain valid**:
- `xero_tenant_id` will be NULL (tracked to primary account)
- Future expenses can specify `xero_tenant_id`
- Mixing NULL and specific tenant IDs is supported

---

## Troubleshooting

### Issue: "No primary account found"

**Cause**: All accounts have `is_primary = false`

**Fix**:
```sql
UPDATE xero_tokens
SET is_primary = true
WHERE organization_id = 'your-org-id'
  AND tenant_id = 'your-preferred-tenant-id';
```

### Issue: Multiple accounts marked as primary

**Cause**: Data inconsistency

**Fix**:
```sql
-- Set all to non-primary
UPDATE xero_tokens
SET is_primary = false
WHERE organization_id = 'your-org-id';

-- Set one as primary
UPDATE xero_tokens
SET is_primary = true
WHERE organization_id = 'your-org-id'
  AND tenant_id = 'your-preferred-tenant-id';
```

### Issue: Expenses not appearing in account summary

**Cause**: `xero_tenant_id` doesn't match any connected account

**Fix**: Check tenant IDs match:
```sql
SELECT DISTINCT xero_tenant_id
FROM operational_expenses
WHERE organization_id = 'your-org-id'
  AND xero_tenant_id NOT IN (
    SELECT tenant_id FROM xero_tokens WHERE organization_id = 'your-org-id'
  );
```

---

## Next Steps

### Phase 2.5: UI Updates (In Progress)

- [ ] Update settings/integrations page to show multiple accounts
- [ ] Add "Connect Another Account" button
- [ ] Add "Set Primary" button per account
- [ ] Add "Edit Label" functionality
- [ ] Add "Disconnect" button per account
- [ ] Show account stats (expenses, cost, invoices, revenue)

### Phase 3: Automated Invoicing (Future)

- [ ] Create invoices in specific Xero accounts
- [ ] Sync expenses to specific Xero accounts
- [ ] Support multi-account invoice workflows

### Phase 4: Financial Dashboard (Future)

- [ ] P&L breakdown per Xero account
- [ ] Consolidated vs per-account views
- [ ] Account-level profitability reports

---

## Files Modified

### Created
- `supabase/migrations/052_multi_xero_accounts.sql` - Database schema
- `src/app/api/integrations/xero/set-primary/route.ts` - Set primary endpoint
- `src/app/api/integrations/xero/update-label/route.ts` - Update label endpoint
- `docs/XERO_MULTI_ACCOUNT_GUIDE.md` - This file

### Modified
- `src/lib/accounting/xero-client.ts` - Multi-account support
  - Updated `initialize()` to accept optional `tenantId`
  - Updated `saveTokenSet()` to save `account_label` and `is_primary`
  - Added `getAllAccounts()` method
  - Added `setPrimaryAccount()` method
  - Added `updateAccountLabel()` method
  - Updated `disconnect()` to support per-account disconnection
- `src/app/api/integrations/xero/status/route.ts` - Returns all accounts
- `src/app/api/integrations/xero/disconnect/route.ts` - Supports per-account disconnect

---

**Status**: ✅ Backend Complete - Ready for UI Implementation
**Last Updated**: 2025-11-19
**Next**: Run migration 052 → Update UI → Test multi-account flow

---

**Your specific use case is now supported!** 🚀

You can connect all your Xero accounts (one per business) and track expenses to the appropriate account automatically.
