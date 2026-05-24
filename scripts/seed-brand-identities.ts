// scripts/seed-brand-identities.ts
// Run: npx tsx scripts/seed-brand-identities.ts
// Seeds brand identities for CARSI and RestoreAssist into the database.
import 'dotenv/config'
import { seedBrandIdentities } from '../src/lib/content/brand-identities'

const FOUNDER_ID = process.env.FOUNDER_USER_ID

async function main() {
  if (!FOUNDER_ID) {
    console.error('Missing FOUNDER_USER_ID in .env.local')
    process.exit(1)
  }

  console.log('Seeding brand identities for CARSI and RestoreAssist...')
  await seedBrandIdentities(FOUNDER_ID)
  console.log('Done!')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
