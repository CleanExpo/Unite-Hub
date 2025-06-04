# Vercel Environment Variables

Add these environment variables to your Vercel project settings:

## Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://hdfggelozqzdxvupbnbp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZmdnZWxvenF6ZHh2dXBibmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDAzNTgsImV4cCI6MjA2MzMxNjM1OH0.v5Msi3i2FN_v8n2slLpfBMNzxmtDpxwbE7RoM4VDOG8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZmdnZWxvenF6ZHh2dXBibmJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzc0MDM1OCwiZXhwIjoyMDYzMzE2MzU4fQ.aE0il-Juu64JasXyiKGBe7ax4VnJ--b-UyHC1eZAGCM
SUPABASE_JWT_SECRET=KqlvXNLme2eKpbioc+t9RVh5rW5W0coXK39MzCc9D9tKDk6iN0fYfxIf5mPynHTpJtQ/uH4VHwWMycaR3Xj0LA==
```

## Legacy Supabase Variables (for backward compatibility)
```
SUPABASE_URL=https://hdfggelozqzdxvupbnbp.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZmdnZWxvenF6ZHh2dXBibmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDAzNTgsImV4cCI6MjA2MzMxNjM1OH0.v5Msi3i2FN_v8n2slLpfBMNzxmtDpxwbE7RoM4VDOG8
```

## OpenAI Configuration
```
OPENAI_API_KEY=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
```

## Redis Configuration
```
REDIS_URL=redis://default:j4wfqXYGNtrf9mCxWwYmCYpwKIHOCQty@redis-14736.c337.australia-southeast1-1.gce.redns.redis-cloud.com:14736
REDIS_API_KEY=A2bn55k2ejn1h0kxjcbk10d4d61v4exp6rywmv6p43atnxdc8g5
```

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable one by one:
   - Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the value
   - Select which environments to apply to (Production, Preview, Development)
   - Click "Save"

## Important Notes

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` secret (server-side only)
- The Redis configuration enables caching features
- All these variables are already configured in your local `.env.local` file
