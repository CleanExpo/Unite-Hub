# DigitalOcean API - Quick Start (5 Minutes)

**Goal**: Get API token and start automation
**Time**: 5 minutes

---

## Step 1: Generate API Token (2 minutes)

1. Go to: **https://cloud.digitalocean.com/account/api/tokens**
2. Click **"Generate New Token"** (top right)
3. Fill in:
   - **Token Name**: `Synthex-API-Token`
   - **Scope**: Select **"Full access"**
   - **Expiration**: Leave empty (or set to 1 year)
4. Click **"Generate Token"**
5. **Copy the token immediately** (shown only once!)
   - Format: `dop_v1_[long-string]`

---

## Step 2: Add to Your Environment (1 minute)

### For Local Development
Create file `.env.local` in project root:
```
DIGITALOCEAN_API_TOKEN=dop_v1_paste_your_token_here
DIGITALOCEAN_APP_NAME=synthex-social
DIGITALOCEAN_REGION=nyc
```

Save and you're done locally!

### For Vercel Production (if deploying)
1. Go to: **https://vercel.com/unite-group/unite-hub/settings/environment-variables**
2. Click **"Add New"**
3. Set:
   - Name: `DIGITALOCEAN_API_TOKEN`
   - Value: `dop_v1_paste_your_token_here`
   - Environments: Production (and Preview if you want)
4. Click **"Save"**
5. Redeploy: `vercel --prod --yes`

---

## Step 3: Test (2 minutes)

### Option A: Test with curl
```bash
curl -X GET "https://api.digitalocean.com/v2/account" \
  -H "Authorization: Bearer dop_v1_YOUR_TOKEN_HERE"
```

Should return your account info (JSON response).

### Option B: Test with Claude
Ask Claude: **"What DigitalOcean resources do I have?"**

Claude will use the MCP to list your apps, droplets, etc.

---

## Available Commands (Ask Claude)

Once configured, ask Claude:

**Apps**:
- "List my DigitalOcean apps"
- "Create a new app called synthex-social"
- "Deploy synthex to DigitalOcean"
- "Show me the deployment status"
- "Update my app configuration"

**Infrastructure**:
- "Create a database on DigitalOcean"
- "Set up a domain on DigitalOcean"
- "Configure DNS records"
- "Scale up my app"

---

## ⚠️ Security Notes

🔒 **NEVER**:
- Commit `.env.local` to git
- Share token in messages
- Use same token across projects

✅ **DO**:
- Store in `.env.local` (local) or Vercel secrets (production)
- Rotate token every 6 months
- Use "Full access" only for automation

---

## Regions (Choose One)

**Best for Synthex** (North America):
- `nyc3` - New York (most reliable)
- `sfo3` - San Francisco (good cost/speed)

**Other options**:
- Europe: `lon1` (London), `ams3` (Amsterdam), `fra1` (Frankfurt)
- Asia: `sgp1` (Singapore), `blr1` (India), `syd1` (Australia)

---

## What Happens Next

### Manual Deployment (Still Available)
- Follow: [DIGITALOCEAN_SETUP_GUIDE.md](DIGITALOCEAN_SETUP_GUIDE.md)
- Use web dashboard: https://cloud.digitalocean.com/apps
- Takes ~45 minutes

### Automated Deployment (New!)
- Ask Claude to deploy via MCP
- Faster and more reliable
- Can ask Claude to manage updates

---

## Example: Deploy Synthex Automatically

Once your token is set, say to Claude:

> "Deploy synthex-social to DigitalOcean using the MCP server. Set it up with:
> - App name: synthex-social
> - Region: nyc3
> - GitHub repo: unite-hub (main branch)
> - Environment variables: [list your vars]
> - Port: 3008"

Claude will:
1. Connect to DigitalOcean API
2. Create the app
3. Configure environment variables
4. Trigger the deployment
5. Return your live URL

---

## Troubleshooting

**Token not working?**
- Check format: `dop_v1_[string]`
- Verify it's in environment: `echo $DIGITALOCEAN_API_TOKEN`
- Generate new one at: https://cloud.digitalocean.com/account/api/tokens

**MCP not connecting?**
- Verify `.env.local` has the token
- Check `.claude/mcp.json` is valid JSON
- Restart your IDE/terminal

**Deployment failed?**
- Check logs in DigitalOcean dashboard
- Verify all environment variables are set
- Try redeploy: `vercel --prod --yes`

---

## Files You Now Have

| File | Purpose |
|------|---------|
| `.claude/mcp.json` | MCP server configuration |
| `.env.example` | Environment variable template |
| `.env.local` | Your local API token (create this) |
| `DIGITALOCEAN_API_SETUP_GUIDE.md` | Detailed setup guide (15 min read) |
| `DIGITALOCEAN_SETUP_GUIDE.md` | Manual dashboard guide (45 min) |
| `DIGITALOCEAN_API_QUICK_START.md` | This file (5 min) |

---

## Next Steps

1. ✅ Generate API token (you're here)
2. ✅ Add to `.env.local`
3. ✅ Test with curl or ask Claude
4. Deploy Synthex (manually or via Claude)

---

**You're 5 minutes away from automation-ready infrastructure! 🚀**

After this, you can ask Claude to:
- Create apps
- Deploy code
- Manage databases
- Update configurations
- Monitor applications

All via the MCP integration.

