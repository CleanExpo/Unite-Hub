// src/lib/integrations/xero.ts
// Barrel re-export — preserves all existing import paths
// Implementation lives in ./xero/client.ts and ./xero/types.ts

export type {
  StoredXeroTokens,
  XeroRevenueMTD,
  XeroReportRow,
  XeroBankTransaction,
  XeroBankTransactionLineItem,
  XeroBankTransactionOptions,
  XeroInvoice,
  XeroInvoiceOptions,
  XeroContact,
  XeroAccount,
  XeroTaxRate,
  XeroPaginatedResponse,
  XeroPagination,
} from './xero/types'

export {
  isXeroConfigured,
  getMockRevenueMTD,
  refreshXeroToken,
  getValidXeroToken,
  loadXeroTokens,
  saveXeroTokens,
  xeroApiFetch,
  parsePandLRevenue,
  fetchRevenueMTD,
  fetchBankTransactions,
  fetchInvoices,
  fetchContacts,
  fetchAccounts,
  fetchTaxRates,
  reconcileTransaction,
} from './xero/client'
