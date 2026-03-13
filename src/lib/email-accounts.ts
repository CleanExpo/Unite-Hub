// src/lib/email-accounts.ts
// Maps Phill's business email accounts to portfolio company slugs
// Used by Google OAuth flow to route tokens to the correct business
// Note: contact@unite-group.in and support@synthex.social are Vercel forwarding
// addresses with no real inbox — excluded.

export type EmailProvider = 'google' | 'microsoft' | 'siteground'

export interface EmailAccount {
  email: string
  businessKey: string
  label: string
  provider: EmailProvider
}

export const EMAIL_ACCOUNTS: EmailAccount[] = [
  { email: 'phill@disasterrecovery.com.au', businessKey: 'dr',       label: 'DR Primary',      provider: 'microsoft' },
  { email: 'disasterrecoverynrp@gmail.com', businessKey: 'nrpg',     label: 'NRPG Gmail',      provider: 'google' },
  { email: 'airestoreassist@gmail.com',     businessKey: 'restore',  label: 'Restore AI',      provider: 'google' },
  { email: 'support@carsi.com.au',          businessKey: 'carsi',    label: 'CARSI Support',   provider: 'siteground' },
  { email: 'phill.m@carsi.com.au',          businessKey: 'carsi',    label: 'CARSI Personal',  provider: 'siteground' },
  { email: 'phill@connexusm.com',           businessKey: 'ccw',      label: 'CCW Primary',     provider: 'google' },
  { email: 'nrpg.team@gmail.com',           businessKey: 'nrpg',     label: 'NRPG Team',       provider: 'google' },
  { email: 'phill.mcgurk@gmail.com',        businessKey: 'personal', label: 'Personal Gmail',  provider: 'google' },
  { email: 'zenithfresh25@gmail.com',        businessKey: 'personal', label: 'Personal Alt',    provider: 'google' },
]

export function accountByEmail(email: string): EmailAccount | undefined {
  return EMAIL_ACCOUNTS.find(a => a.email === email)
}
