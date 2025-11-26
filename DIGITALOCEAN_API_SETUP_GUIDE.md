# DigitalOcean API Setup & MCP Configuration Guide

**Status**: Ready to Configure
**Purpose**: Enable automated DigitalOcean infrastructure management via MCP
**Time to Complete**: 10-15 minutes

---

## 📋 Overview

You now have:
- ✅ **DigitalOcean MCP Server** configured in `.claude/mcp.json`
- ✅ **Environment variables** added to `.env.example`
- ✅ **API token configuration** documented

This enables CLI and API automation for:
- Creating and managing Apps
- Deploying to App Platform
- Managing Droplets (VPS instances)
- Configuring databases
- Managing domains and DNS
- Setting up monitoring and alerts

---

## 🔑 Step 1: Get Your DigitalOcean API Token

### Generate API Token
1. Go to **https://cloud.digitalocean.com/account/api/tokens**
2. Click **"Generate New Token"** (top right)
3. Set details:
   - **Token Name**: `Synthex-API-Token` (or your preference)
   - **Scope**: Select **"Full access"** (for full functionality)
   - **Expiration**: Optional (longer is better for automation)
4. Click **"Generate Token"**
5. **⚠️ COPY THE TOKEN IMMEDIATELY** - You won't see it again!
   ```
   Your token will look like: dop_v1_[long-string-of-characters]
   ```

### Token Scopes Explained
- **Read**: Can only view resources (safe for monitoring)
- **Write**: Can create/modify resources (needed for automation)
- **Full access**: Read + Write (recommended for Synthex)

---

## 🔑 Step 2: Configure Your Environment

### Option A: Local Development (.env.local)
Create a file `.env.local` in your project root:

```bash
# DigitalOcean API Token
DIGITALOCEAN_API_TOKEN=dop_v1_your_token_here_dont_commit_this

# Optional settings
DIGITALOCEAN_APP_NAME=synthex-social
DIGITALOCEAN_REGION=nyc
```

**⚠️ IMPORTANT**: Never commit `.env.local` to git!
- Add to `.gitignore`: `echo ".env.local" >> .gitignore`

### Option B: Vercel Production
1. Go to **https://vercel.com/unite-group/unite-hub/settings/environment-variables**
2. Add new variable:
   - Name: `DIGITALOCEAN_API_TOKEN`
   - Value: `dop_v1_your_token_here`
   - Select environments: **Production** (optional: Preview)
3. Click **Save**

### Option C: GitHub Secrets (for Actions/Automation)
1. Go to **https://github.com/[your-repo]/settings/secrets/actions**
2. Click **"New repository secret"**
3. Set:
   - Name: `DIGITALOCEAN_API_TOKEN`
   - Value: `dop_v1_your_token_here`
4. Click **"Add secret"**

---

## 🚀 Step 3: Verify MCP Configuration

The DigitalOcean MCP server is configured in `.claude/mcp.json`:

```json
{
  "digitalocean": {
    "command": "npx",
    "args": ["@digitalocean/mcp@latest"],
    "env": {
      "DIGITALOCEAN_API_TOKEN": "${DIGITALOCEAN_API_TOKEN}"
    },
    "description": "DigitalOcean MCP - Manage apps, droplets, databases, domains, and infrastructure"
  }
}
```

**What this means**:
- Claude has access to DigitalOcean tools
- Commands available via MCP protocol
- Reads token from your environment variables
- Can automate infrastructure tasks

---

## 📚 Available DigitalOcean Tools (via MCP)

Once configured, you can use these DigitalOcean operations:

### Apps
```
- List all apps
- Get app details
- Create new app
- Update app configuration
- Delete app
- Get app deployment logs
- Deploy app
- Redeploy app
```

### Droplets (Virtual Machines)
```
- List all droplets
- Create new droplet
- Destroy droplet
- Reboot droplet
- Power on/off droplet
- Get droplet details
```

### Databases
```
- List database clusters
- Create database cluster
- Add database user
- Get database connection details
```

### Domains & DNS
```
- List domains
- Get domain records
- Create DNS record
- Delete DNS record
- Update domain nameservers
```

### App Platform Specific
```
- Get app specs (configuration)
- Update app spec
- Create deployment
- Get deployment status
- View logs
- Manage environment variables
```

---

## 🎯 Example: Create Synthex App (via MCP)

Once configured, you can ask Claude:

> "Create a new DigitalOcean app called 'synthex-social' with the following configuration..."

Claude will:
1. Use the MCP server to call DigitalOcean API
2. Create the app with your specified settings
3. Return app details (URL, credentials, etc.)
4. Show deployment progress

---

## 📝 Synthex-Specific Configuration

### Recommended Settings for Synthex
```yaml
App Name: synthex-social
Region: nyc (New York) or your preference
Plan: Starter ($5-12/month)
Run Command: npm run start
Build Command: npm run build
Environment Variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - ANTHROPIC_API_KEY
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
Port: 3008
```

### Domains
```
Primary Domain: synthex.social (optional)
Alternative: Use DO-provided URL (synthex-social-xxxxx.ondigitalocean.app)
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Store API token in `.env.local` (never in git)
- Use token in Vercel/GitHub secrets
- Rotate token every 6 months
- Use "Full access" only for automation
- Review which token you're using

### ❌ DON'T:
- Commit `.env.local` to git
- Share token in emails or messages
- Use same token across multiple projects
- Leave expired tokens active
- Give API token to untrusted services

---

## 🧪 Test Your Configuration

### Verify Token Works
```bash
# If you have curl and your token set:
curl -X GET "https://api.digitalocean.com/v2/account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dop_v1_YOUR_TOKEN"

# Should return your account info
```

### Verify MCP is Loaded
Once you have the token set in your environment:

Ask Claude: "List my DigitalOcean apps"

Claude will use the MCP to retrieve your apps.

---

## 📊 Available DigitalOcean Regions

**North America**:
- `nyc1`, `nyc3` - New York
- `sfo1`, `sfo2`, `sfo3` - San Francisco
- `tor1` - Toronto

**Europe**:
- `lon1` - London
- `ams2`, `ams3` - Amsterdam
- `fra1` - Frankfurt

**Asia**:
- `blr1` - Bangalore
- `sgp1` - Singapore
- `syd1` - Sydney

**South America**:
- `sao1` - São Paulo

**Recommendation for Synthex**: Use `nyc3` (most reliable) or `sfo3` (cost-effective)

---

## 🛠️ Common Tasks

### Create App (Manual Steps, or Ask Claude)
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create Apps"
3. Select GitHub
4. Choose `unite-hub` repository
5. Configure environment variables
6. Deploy

### Update App Settings
Go to your app in DigitalOcean dashboard → Settings → Edit Configuration

### Monitor Deployments
Go to your app → Deployments tab → View logs

### Scale App
Settings → Instance Size → Choose larger size → Auto-redeploy

---

## 📖 References

**DigitalOcean Official Docs**:
- API Reference: https://docs.digitalocean.com/reference/
- App Platform: https://docs.digitalocean.com/products/app-platform/
- Droplets: https://docs.digitalocean.com/products/droplets/
- Databases: https://docs.digitalocean.com/products/databases/

**MCP Documentation**:
- Model Context Protocol: https://modelcontextprotocol.io/
- DigitalOcean MCP: https://github.com/digitalocean/mcp-server-digitalocean

---

## ✅ Checklist

- [ ] Created DigitalOcean account at https://cloud.digitalocean.com
- [ ] Generated API token at https://cloud.digitalocean.com/account/api/tokens
- [ ] Added `DIGITALOCEAN_API_TOKEN` to `.env.local`
- [ ] Added `DIGITALOCEAN_API_TOKEN` to Vercel (if deploying)
- [ ] Verified `.claude/mcp.json` has digitalocean configuration
- [ ] Tested token with: `curl -X GET "https://api.digitalocean.com/v2/account" -H "Authorization: Bearer [token]"`

---

## 🚀 Next Steps

Once configured:

1. **Create App Manually** (first time):
   - Use web dashboard: https://cloud.digitalocean.com/apps
   - Follow DIGITALOCEAN_SETUP_GUIDE.md steps

2. **Automate Future Deployments**:
   - Ask Claude: "Deploy to DigitalOcean using MCP"
   - Claude uses API to automate setup

3. **Monitor with API**:
   - Ask Claude: "Check my Synthex app status"
   - Gets real-time info via API

4. **Scale Automatically**:
   - Ask Claude: "Increase Synthex app to large tier"
   - MCP updates infrastructure

---

## 📞 Troubleshooting

### "API Token not found"
- Check `.env.local` exists
- Verify `DIGITALOCEAN_API_TOKEN=dop_v1_...`
- Restart your terminal/IDE

### "Unauthorized" (401 error)
- Token may be invalid or revoked
- Generate new token at https://cloud.digitalocean.com/account/api/tokens
- Update environment variable

### "Token expired"
- Check token expiration at https://cloud.digitalocean.com/account/api/tokens
- Generate new token if expired

### MCP not connecting
- Verify `@digitalocean/mcp@latest` is available
- Check `.claude/mcp.json` syntax
- Restart Claude

---

**Status**: ✅ **CONFIGURED & READY FOR AUTOMATION**

You now have both manual deployment (DIGITALOCEAN_SETUP_GUIDE.md) and automated API deployment (this guide) configured.

**Next**: Get your API token and you're ready to deploy!

