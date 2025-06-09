# Environment Configuration Guide
## Unite Group Production Deployment

**Last Updated**: May 27, 2025  
**Version**: 14.0  

---

## 🔧 **CRITICAL ENVIRONMENT VARIABLES REQUIRED**

### **1. Supabase Database Configuration** 🚨 **CRITICAL**
```bash
# Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to Get:**
1. Go to [supabase.com](https://supabase.com)
2. Create new project or use existing
3. Go to Settings → API
4. Copy Project URL and API keys

**Required Database Schemas:**
- Execute `database/consultations.sql`
- Execute `database/projects.sql`
- Execute `database/mfa.sql`
- Execute `database/privacy_compliance.sql`
- Execute `database/rbac.sql`
- Execute `database/soc2_compliance.sql`

### **2. Email/SMTP Configuration** 🚨 **CRITICAL**
```bash
# Production email service (Gmail, SendGrid, AWS SES, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEFAULT_FROM=no-reply@unite-group.com
ADMIN_EMAIL=admin@unite-group.com
```

**Popular SMTP Providers:**
- **Gmail**: `smtp.gmail.com:587` (Use App Password)
- **SendGrid**: `smtp.sendgrid.net:587`
- **AWS SES**: `email-smtp.region.amazonaws.com:587`
- **Outlook**: `smtp-mail.outlook.com:587`

### **3. Payment Processing (Stripe)** 🚨 **CRITICAL**
```bash
# Get from Stripe Dashboard → Developers → API Keys
STRIPE_SECRET_KEY=sk_live_51Abcd...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Abcd...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...

# Payment Configuration
NEXT_PUBLIC_CURRENCY=aud
NEXT_PUBLIC_CONSULTATION_PRICE=55000  # $550.00 in cents
```

**Setup Steps:**
1. Create [Stripe account](https://stripe.com)
2. Get live API keys (not test keys)
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Configure webhook events: `payment_intent.succeeded`

### **4. Application Configuration** ✅ **REQUIRED**
```bash
# Your production domain
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Application version (optional but recommended)
NEXT_PUBLIC_APP_VERSION=14.0
```

### **5. CDN Configuration** ⚙️ **OPTIONAL**
```bash
# CDN settings (Vercel handles this automatically)
NEXT_PUBLIC_CDN_ENABLED=true
NEXT_PUBLIC_CDN_PROVIDER=vercel
NEXT_PUBLIC_CDN_BASE_URL=https://your-domain.com
ENABLE_CDN_REDIRECT=false
```

---

## 🔐 **SECURITY CONSIDERATIONS**

### **Environment Variable Security:**
- ❌ **NEVER** commit `.env.local` to version control
- ✅ Use deployment platform environment variable settings
- ✅ Rotate API keys regularly
- ✅ Use different keys for staging/production

### **Database Security:**
- ✅ Enable Row Level Security (RLS) in Supabase
- ✅ Configure proper authentication policies
- ✅ Set up database backups
- ✅ Monitor database access logs

---

## 🚀 **DEPLOYMENT PLATFORM SETUP**

### **Vercel (Recommended)**
1. **Connect Repository**:
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables
   - Set environment to "Production"

3. **Configure Custom Domain**:
   - Go to Domains section
   - Add your custom domain
   - Configure DNS records as instructed

### **Alternative Platforms**

#### **Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.next
```

#### **Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway deploy
```

#### **DigitalOcean App Platform**
- Use App Spec configuration
- Set environment variables in control panel

---

## 📋 **STEP-BY-STEP SETUP CHECKLIST**

### **Phase 1: Database Setup**
- [ ] 1. Create Supabase project
- [ ] 2. Execute database/consultations.sql
- [ ] 3. Execute database/projects.sql
- [ ] 4. Execute database/mfa.sql
- [ ] 5. Execute database/privacy_compliance.sql
- [ ] 6. Execute database/rbac.sql
- [ ] 7. Execute database/soc2_compliance.sql
- [ ] 8. Enable Row Level Security
- [ ] 9. Copy API keys

### **Phase 2: Email Setup**
- [ ] 1. Choose SMTP provider
- [ ] 2. Create email account or API key
- [ ] 3. Configure SMTP settings
- [ ] 4. Test email sending

### **Phase 3: Payment Setup**
- [ ] 1. Create Stripe account
- [ ] 2. Get live API keys
- [ ] 3. Set up webhook endpoint
- [ ] 4. Test payment processing

### **Phase 4: Domain & Deployment**
- [ ] 1. Purchase domain name
- [ ] 2. Set up deployment platform
- [ ] 3. Configure environment variables
- [ ] 4. Deploy application
- [ ] 5. Configure custom domain
- [ ] 6. Set up SSL certificate

### **Phase 5: Testing & Monitoring**
- [ ] 1. Test user registration/login
- [ ] 2. Test consultation booking
- [ ] 3. Test payment processing
- [ ] 4. Test email notifications
- [ ] 5. Set up monitoring/analytics

---

## ⚠️ **COMMON SETUP ISSUES**

### **Supabase Connection Issues**
```bash
# Check if URL and keys are correct
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co  # Must include https://
```

### **Email Not Sending**
```bash
# For Gmail, use App Password, not regular password
# Enable "Less secure app access" or use App Password
SMTP_PASSWORD=your-16-character-app-password
```

### **Stripe Webhook Issues**
```bash
# Webhook endpoint must be accessible
# URL: https://yourdomain.com/api/webhooks/stripe
# Events: payment_intent.succeeded, payment_intent.payment_failed
```

### **Domain/SSL Issues**
- Ensure DNS records point to deployment platform
- Wait 24-48 hours for DNS propagation
- Check SSL certificate is properly configured

---

## 🔍 **TESTING YOUR CONFIGURATION**

### **Environment Variable Test**
```javascript
// Test in browser console on your deployed site
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
// Should show your Supabase URL, not "placeholder"
```

### **Database Test**
- Try registering a new user
- Check if user appears in Supabase dashboard

### **Email Test**
- Submit contact form
- Check if email arrives at admin email

### **Payment Test**
- Try booking consultation
- Use Stripe test card: 4242 4242 4242 4242

---

## 📞 **GETTING HELP**

### **If You Need Assistance:**
1. **Supabase Issues**: [Supabase Documentation](https://supabase.com/docs)
2. **Stripe Issues**: [Stripe Documentation](https://stripe.com/docs)
3. **Vercel Issues**: [Vercel Documentation](https://vercel.com/docs)
4. **Email Issues**: Check your email provider's SMTP documentation

### **Emergency Checklist:**
- [ ] All environment variables set correctly
- [ ] Database schemas executed
- [ ] Domain DNS pointing to deployment platform
- [ ] SSL certificate active
- [ ] All third-party services configured

---

**🎯 GOAL**: Once all environment variables are configured with real production values, your deployment readiness score will increase from 85/100 to 100/100, making the application fully ready for production deployment.**
