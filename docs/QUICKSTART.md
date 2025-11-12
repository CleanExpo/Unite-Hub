# ⚡ Quickstart Guide - Unite Hub

## 5-Minute Setup

### 1. Clone & Install
```bash
git clone https://github.com/your-org/unite-hub.git
cd unite-hub
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local

# Edit .env.local with:
NEXTAUTH_URL=http://localhost:3008
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
ANTHROPIC_API_KEY=your-claude-key
GOOGLE_CLIENT_ID=your-google-id
```

### 3. Start Server
```bash
npm run dev
```

Visit: `http://localhost:3008`

### 4. First Steps

**A. Sign In**
```
Click "Sign In with Google"
Use test Google account
```

**B. Add Contacts**
```
Dashboard → Contacts
Click "+ Add Contact"
Enter name, email, company, job title
```

**C. Analyze Contacts**
```
npm run analyze-contacts
```

**D. Generate Content**
```
npm run generate-content
```

**E. Create Campaign**
```
Dashboard → Campaigns → Drip
Click "+ New Campaign"
Add email steps
Set delays between emails
Save & Activate
```

**F. Process Campaigns**
```
npm run process-campaigns
```

## Common Commands
```bash
# Development
npm run dev                  # Start dev server
npm run build                # Build for production
npm run start                # Start production server

# Database
npm run db:push              # Push schema to database
npm run db:seed              # Seed sample data

# Automation
npm run analyze-contacts     # AI contact analysis
npm run generate-content     # Generate emails
npm run process-campaigns    # Execute campaigns

# Testing
npm run test                 # Run tests
npm run lint                 # Linting
npm run format               # Code formatting
```

## File Structure
```
unite-hub/
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   └── dashboard/       # UI pages
│   ├── components/          # React components
│   ├── lib/
│   │   ├── agents/          # AI agents
│   │   ├── integrations/    # Gmail, etc
│   │   ├── services/        # Business logic
│   │   └── db.ts            # Database utils
│   └── styles/              # CSS
├── scripts/                 # CLI automation
├── docs/                    # Documentation
├── .env.local               # Environment variables
├── next.config.js           # Next.js config
└── package.json             # Dependencies
```

## Troubleshooting

### Port Already In Use
```bash
# Kill process using port 3008
lsof -ti:3008 | xargs kill -9

# Or use different port
npm run dev -- -p 3009
```

### Database Connection Error
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Test database connection
curl http://localhost:3008/api/test/db
```

### Claude API Error
```bash
# Verify API key
echo $ANTHROPIC_API_KEY

# Check API key format
# Should start with: sk-ant-
```

### Gmail OAuth Error
```bash
# Verify callback URL matches
# Supabase setting: exactly matches env var

# Clear browser cookies
# Try sign-in again
```

## Next Steps

1. Read [Architecture](./ARCHITECTURE.md)
2. Explore [API Docs](./API.md)
3. Check [Deployment Guide](./DEPLOYMENT.md)
4. Join [Community](#)
