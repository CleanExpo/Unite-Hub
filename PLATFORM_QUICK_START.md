# Unite Group Platform - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Stripe account (for payments)
- Google account (for OAuth)

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd unite-group
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # Push Notifications
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Google Analytics
   NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
   ```

4. **Run database migrations**
   In Supabase SQL editor, run each migration file in order:
   - `20250107_blog_schema.sql`
   - `20250107_resources_schema.sql`
   - `20250107_case_studies_schema.sql`
   - `20250107_chat_schema.sql`
   - `20250107_search_schema.sql`
   - `20250107_dashboard_enhancements.sql`
   - `20250107_ab_testing_schema.sql`
   - `20250107_push_notifications_schema.sql`

5. **Start development server**
   ```bash
   npm run dev
   ```

   Visit http://localhost:3000

## 📱 Key Features

### Content Management
- **Blog**: `/blog` - Create and manage blog posts
- **Resources**: `/resources` - Upload and manage downloadable resources
- **Case Studies**: `/case-studies` - Showcase project success stories

### Services
- **Service Pages**: `/services/[service-name]` - Individual service details
- **Service Comparison**: `/services` - Compare different services
- **Service Quiz**: `/services` - AI-powered recommendation quiz

### User Features
- **Dashboard**: `/dashboard` - User dashboard with activity timeline
- **Chat Support**: Available on all pages via chat widget
- **Search**: Global search available in navigation

### PWA Features
- **Install App**: Click install prompt when available
- **Offline Mode**: Basic functionality available offline
- **Push Notifications**: Enable in dashboard settings

### A/B Testing
- **Experiments Dashboard**: `/dashboard/experiments` - Manage A/B tests
- **Variant Testing**: Use `<Variant>` component for testing

## 🛠️ Development

### Project Structure
```
src/
├── app/              # Next.js app router
├── components/       # React components
├── lib/             # Utilities and services
├── types/           # TypeScript types
└── hooks/           # Custom React hooks
```

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript
```

### Testing Features

1. **Test Blog System**
   - Create a new blog post
   - Add categories and tags
   - Preview SEO metadata

2. **Test Chat**
   - Open chat widget
   - Send a message
   - Check real-time updates

3. **Test PWA**
   - Install the app
   - Go offline and test
   - Enable push notifications

4. **Test A/B Testing**
   - Create an experiment
   - View different variants
   - Check analytics

## 🔧 Configuration

### Supabase Setup
1. Create a new project
2. Enable Google OAuth
3. Set up RLS policies
4. Configure email templates

### Stripe Setup
1. Create products and prices
2. Set up webhooks
3. Configure payment methods
4. Test with Stripe CLI

### Push Notifications
1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Add to environment variables
3. Test on supported browsers

## 📊 Monitoring

### Performance
- Check Web Vitals in console
- Monitor bundle sizes
- Review Lighthouse scores

### Analytics
- Google Analytics dashboard
- Supabase dashboard
- Vercel analytics

### Errors
- Check browser console
- Review server logs
- Monitor Supabase logs

## 🚨 Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check Supabase credentials
   - Verify RLS policies
   - Check migration status

2. **Build errors**
   - Clear `.next` folder
   - Check TypeScript errors
   - Verify environment variables

3. **PWA not installing**
   - Check HTTPS
   - Verify manifest.json
   - Test service worker

4. **Push notifications not working**
   - Check VAPID keys
   - Verify permissions
   - Test browser support

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Support

For issues or questions:
1. Check the documentation
2. Review error logs
3. Contact the development team

---

**Version**: 2.0  
**Last Updated**: January 8, 2025  
**Status**: Production Ready
