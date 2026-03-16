// src/app/api/xero/debug/route.ts
// DEBUG: Temporary endpoint to test Xero API calls for CARSI bank feed debugging
// DELETE THIS FILE after debugging is complete
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import {
    loadXeroTokens,
    getValidXeroToken,
    saveXeroTokens,
    xeroApiFetch,
  } from '@/lib/integrations/xero/client'

export const dynamic = 'force-dynamic'

export async function GET() {
    const user = await getUser()
    if (!user) {
          return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
        }

    const results: Record<string, unknown> = {}

    try {
          // Load CARSI tokens
          const storedTokens = await loadXeroTokens(user.id, 'carsi')
          if (!storedTokens) {
                  return NextResponse.json({ error: 'No CARSI tokens found' })
                }

          const tokens = await getValidXeroToken(storedTokens, 'carsi')
          if (tokens.access_token !== storedTokens.access_token) {
                  await saveXeroTokens(user.id, 'carsi', tokens)
                }

          results.tenantId = tokens.tenant_id

          // Test 1: Fetch Organisation info
          try {
                  const org = await xeroApiFetch<{ Organisations: Array<{ Name: string; OrganisationID: string }> }>(
                            tokens, '/Organisation'
                          )
                  results.organisation = org.Organisations?.[0]?.Name
                  results.organisationId = org.Organisations?.[0]?.OrganisationID
                } catch (e) {
                  results.orgError = e instanceof Error ? e.message : String(e)
                }

          // Test 2: Fetch Bank Accounts
          try {
                  const accounts = await xeroApiFetch<{ Accounts: Array<{ AccountID: string; Name: string; Type: string; Code: string; BankAccountNumber?: string; Status?: string }> }>(
                            tokens, '/Accounts?where=Type=="BANK"'
                          )
                  results.bankAccounts = accounts.Accounts?.map(a => ({
                            id: a.AccountID,
                            name: a.Name,
                            code: a.Code,
                            number: a.BankAccountNumber,
                            status: a.Status,
                          }))
                } catch (e) {
                  results.bankAccountsError = e instanceof Error ? e.message : String(e)
                }

          // Test 3: Fetch BankTransactions (NO date filter)
          try {
                  const txns = await xeroApiFetch<{ BankTransactions: Array<{ BankTransactionID: string; Type: string; Total: number; Date: string; IsReconciled: boolean; Status: string }> }>(
                            tokens, '/BankTransactions?page=1'
                          )
                  results.bankTransactionsCount = txns.BankTransactions?.length ?? 0
                  results.bankTransactionsSample = txns.BankTransactions?.slice(0, 3).map(t => ({
                            id: t.BankTransactionID,
                            type: t.Type,
                            total: t.Total,
                            date: t.Date,
                            reconciled: t.IsReconciled,
                            status: t.Status,
                          }))
                } catch (e) {
                  results.bankTransactionsError = e instanceof Error ? e.message : String(e)
                }

          // Test 4: Fetch BankStatements (NO date filter)
          try {
                  const stmts = await xeroApiFetch<{ Statements?: unknown[]; BankStatements?: unknown[] }>(
                            tokens, '/BankStatements'
                          )
                  results.bankStatementsRaw = stmts
                } catch (e) {
                  results.bankStatementsError = e instanceof Error ? e.message : String(e)
                }

          // Test 5: Fetch Invoices (NO date filter)
          try {
                  const inv = await xeroApiFetch<{ Invoices: Array<{ InvoiceID: string; Type: string; Total: number; Status: string }> }>(
                            tokens, '/Invoices?page=1'
                          )
                  results.invoicesCount = inv.Invoices?.length ?? 0
                  results.invoicesSample = inv.Invoices?.slice(0, 3)
                } catch (e) {
                  results.invoicesError = e instanceof Error ? e.message : String(e)
                }

          // Test 6: Try fetching bank feed statements via different approach
          try {
                  const feeds = await xeroApiFetch<unknown>(tokens, '/BankTransactions?where=Status=="AUTHORISED"&&IsReconciled==false')
                  results.unreconciledBankTxns = feeds
                } catch (e) {
                  results.unreconciledBankTxnsError = e instanceof Error ? e.message : String(e)
                }

        } catch (e) {
          results.fatalError = e instanceof Error ? e.message : String(e)
        }

    return NextResponse.json(results)
  }
