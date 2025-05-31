# Vercel Environment Variables Setup Guide
## Unite Group SaaS Platform

> **Critical**: These environment variables must be configured in Vercel for the application to function

---

## 🔧 **REQUIRED ENVIRONMENT VARIABLES**

### **1. Supabase Configuration**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **2. Stripe Configuration (Optional but Recommended)**
```bash
STRIPE_SECRET_KEY=sk_live_or_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### **3. Application Configuration**
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_CURRENCY=aud
NEXT_PUBLIC_CONSULTATION_PRICE=55000
```

### **4. Email Configuration (Optional)**
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
DEFAULT_FROM=no-reply@your-domain.com
ADMIN_EMAIL=admin@your-domain.com
```

---

## 📋 **STEP-BY-STEP SETUP INSTRUCTIONS**

### **Step 1: Access Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Navigate to your project: `unite-group-fresh`
3. Click **Settings** tab
4. Select **Environment Variables** from sidebar

### **Step 2: Get Supabase Credentials**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the required values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### **Step 3: Add Environment Variables to Vercel**
For each environment variable:

1. Click **Add New**
2. **Name**: Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. **Value**: Paste the corresponding value
4. **Environment**: Select **Production**, **Preview**, and **Development**
5. Click **Save**

### **Step 4: Redeploy Application**
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for deployment to complete

---

## ✅ **VERIFICATION CHECKLIST**

After adding environment variables and redeploying:

### **Environment Variables Set**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added to Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added to Vercel  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to Vercel
- [ ] Application redeployed successfully

### **Test Deployment Health**
```bash
# Test the health endpoint
curl https://your-deployment-url.vercel.app/api/health

# Expected response (when working):
{
  "status": "healthy",
  "database": "connected",
  "compliance": {
    "tables": {...},
    "ready": false
  },
  "environment": {
    "hasSupabaseUrl": true,
    "hasAnonKey": true, 
    "hasServiceKey": true
  }
}
```

### **Run Smoke Tests**
```bash
npm run test:smoke https://your-deployment-url.vercel.app
```

### **Setup Database Tables**
```bash
curl -X POST https://your-deployment-url.vercel.app/api/setup-database
```

---

## 🚨 **TROUBLESHOOTING**

### **Issue: Still Getting 401 Errors**
**Solution**: 
1. Verify environment variables are saved in Vercel
2. Ensure you selected all environments (Production, Preview, Development)
3. Redeploy the application
4. Check Supabase project is active

### **Issue: Database Connection Failed**
**Solution**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check Supabase project status
3. Ensure no extra spaces in environment variable values

### **Issue: CORS Errors**
**Solution**:
1. Check `NEXT_PUBLIC_SITE_URL` matches deployment URL
2. Verify Supabase RLS policies
3. Ensure anon key has proper permissions

---

## 📞 **SUPPORT ESCALATION**

If issues persist after following this guide:

1. **Level 1**: Check environment variable formatting
2. **Level 2**: Verify Supabase project configuration  
3. **Level 3**: Contact Vercel support
4. **Level 4**: Supabase support escalation

---

## 🔄 **AUTOMATED MONITORING**

Once environment variables are configured, the following monitoring is active:

- **Health checks**: `/api/health` endpoint
- **Smoke tests**: Automated via GitHub Actions
- **Error tracking**: Real-time monitoring
- **Performance monitoring**: Core Web Vitals

---

**Last Updated**: May 31, 2025  
**Next Review**: After environment variable configuration
