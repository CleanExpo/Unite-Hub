// src/lib/email-accounts.ts
// Maps Phill's 11 business email accounts to portfolio company slugs
// Used by Google OAuth flow to route tokens to the correct business

export interface EmailAccount {
  email: string
  businessKey: string
  label: string
}

export const EMAIL_ACCOUNTS: EmailAccount[] = [
  { email: 'phill@disasterrecovery.com.au', businessKey: 'dr',       label: 'DR Primary' },
  { email: 'disasterrecoverynrp@gmail.com', businessKey: 'nrpg',     label: 'NRPG Gmail' },
  { email: 'airestoreassist@gmail.com',     businessKey: 'restore',  label: 'Restore AI' },
  { email: 'support@carsi.com.au',          businessKey: 'carsi',    label: 'CARSI Support' },
  { email: 'phill.m@carsi.com.au',          businessKey: 'carsi',    label: 'CARSI Personal' },
  { email: 'phill@connexusm.com',           businessKey: 'ccw',      label: 'CCW Primary' },
  { email: 'contact@unite-group.in',        businessKey: 'ccw',      label: 'Unite Contact' },
  { email: 'support@synthex.social',        businessKey: 'synthex',  label: 'Synthex Support' },
  { email: 'nrpg.team@gmail.com',           businessKey: 'nrpg',     label: 'NRPG Team' },
  { email: 'phill.mcgurk@gmail.com',        businessKey: 'personal', label: 'Personal Gmail' },
  { email: 'zenithfresh25@gmail.com',        businessKey: 'personal', label: 'Personal Alt' },
]

export function accountByEmail(email: string): EmailAccount | undefined {
  return EMAIL_ACCOUNTS.find(a => a.email === email)
}
