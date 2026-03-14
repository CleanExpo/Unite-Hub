import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

const envPath = join(process.cwd(), '.env.local')
if (existsSync(envPath)) config({ path: envPath })

const API_KEY = process.env.LINEAR_API_KEY || ''
if (!API_KEY) { console.log('LINEAR_API_KEY not set'); process.exit(0) }

const res = await fetch('https://api.linear.app/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
  body: JSON.stringify({ query: '{ teams { nodes { id key name } } }' })
})
const data = await res.json()
console.log(JSON.stringify(data, null, 2))
