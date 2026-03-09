import { VaultEntry } from './VaultEntry'
import { BUSINESSES } from '@/lib/businesses'

const CREDENTIALS = [
  { id: '1', businessKey: 'dr',      label: 'Supabase API Key',   username: 'admin@dr.com.au',        secret: 'sbp_prod_placeholder_dr' },
  { id: '2', businessKey: 'dr',      label: 'Stripe Secret Key',  username: 'stripe_dr',              secret: 'sk_live_placeholder_dr' },
  { id: '3', businessKey: 'synthex', label: 'Stripe Secret Key',  username: 'stripe_synthex',         secret: 'sk_live_placeholder_synthex' },
  { id: '4', businessKey: 'synthex', label: 'OpenAI API Key',     username: 'synthex_ai',             secret: 'sk-placeholder-synthex' },
  { id: '5', businessKey: 'restore', label: 'Stripe Secret Key',  username: 'stripe_restore',         secret: 'sk_live_placeholder_restore' },
  { id: '6', businessKey: 'ccw',     label: 'Shopify Admin API',  username: 'admin@ccwonline.com.au', secret: 'shpat_placeholder_ccw' },
  { id: '7', businessKey: 'nrpg',    label: 'Mailgun API Key',    username: 'noreply@nrpg.com.au',    secret: 'key-placeholder-nrpg' },
] as const

const GROUPED = BUSINESSES.map(biz => ({
  business: biz,
  credentials: CREDENTIALS.filter(c => c.businessKey === biz.key),
})).filter(g => g.credentials.length > 0)

export function VaultGrid() {
  return (
    <div className="flex flex-col gap-6">
      {GROUPED.map(({ business, credentials }) => (
        <div key={business.key}>
          <div className="px-3 py-1 flex items-center gap-2">
            <span className="rounded-full" style={{ width: 6, height: 6, background: business.color }} />
            <span className="text-[10px] font-medium tracking-widest text-[#555] uppercase">
              {business.name}
            </span>
          </div>
          <div
            className="rounded-sm border overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {credentials.map(cred => (
              <VaultEntry
                key={cred.id}
                label={cred.label}
                username={cred.username}
                secret={cred.secret}
                businessColor={business.color}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
