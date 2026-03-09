// src/lib/integrations/xero.ts
// Xero OAuth integration — stub until XERO_CLIENT_ID/SECRET are configured

export function isXeroConfigured(): boolean {
  return Boolean(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET)
}

export interface XeroSummary {
  businessKey: string
  totalRevenue: number    // AUD cents, current financial year
  totalExpenses: number
  gstOwed: number
  lastBASDate: string | null
  connected: boolean
}

export function getMockXeroSummary(businessKey: string): XeroSummary {
  return {
    businessKey,
    totalRevenue: 0,
    totalExpenses: 0,
    gstOwed: 0,
    lastBASDate: null,
    connected: false,
  }
}
