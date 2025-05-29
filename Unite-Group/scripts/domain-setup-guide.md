# Domain Transfer Guide: unite-group.in

## Current Status
- **Domain**: unite-group.in
- **Target Project**: unite-group-fresh (this repository)
- **GitHub**: https://github.com/CleanExpo/Unite-Group

## Step-by-Step Transfer Process

### 1. Remove from Old Project
1. Go to https://vercel.com/dashboard
2. Find the old project with unite-group.in
3. Go to Project → Settings → Domains
4. Remove unite-group.in from the old project

### 2. Add to New Project
1. Go to your new Vercel project dashboard
2. Navigate to Settings → Domains
3. Click "Add Domain"
4. Enter: `unite-group.in`
5. Click "Add"

### 3. DNS Configuration
Vercel will provide one of these options:

**Option A: Vercel Nameservers (Recommended)**
- Point your domain's nameservers to Vercel
- Vercel manages all DNS automatically

**Option B: Custom DNS**
- Add A record: `76.76.19.61` (or current Vercel IP)
- Add CNAME for www: `cname.vercel-dns.com`

### 4. SSL Certificate
- Vercel automatically provisions SSL certificates
- May take 5-10 minutes to activate
- Check status in Domains section

### 5. Verification Commands
After setup, verify with:
```bash
# Check DNS resolution
nslookup unite-group.in

# Check SSL certificate
curl -I https://unite-group.in

# Test website
curl https://unite-group.in
```

## Environment Variables Update
After domain transfer, update these if needed:
- `NEXTAUTH_URL=https://unite-group.in` (in Vercel environment variables)
- Any callback URLs in Google OAuth, Stripe, etc.

## Troubleshooting
- **DNS propagation**: Can take up to 48 hours globally
- **SSL issues**: Wait 10-15 minutes, then contact Vercel support
- **404 errors**: Check project deployment status

## Post-Transfer Checklist
- [ ] Domain resolves to new project
- [ ] SSL certificate active
- [ ] All pages load correctly
- [ ] Contact forms work
- [ ] Authentication flows work
- [ ] Payment processing works (if applicable)

## Support
If you encounter issues:
1. Check Vercel project logs
2. Verify DNS settings
3. Contact Vercel support if needed
