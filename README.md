# Streamline App

A modern task and project management application with PDF export capabilities and company branding customization.

## Features

- Project and task management
- User authentication and profiles
- Company branding customization
- PDF export with custom styling
- Database integration with Supabase

## Deployment

You can deploy this project to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fstreamline-app&project-name=streamline-app&repository-name=streamline-app)

**Important:** After deployment, you'll need to configure the required environment variables in your Vercel dashboard.

## Environment Variables

To run this project, you will need to add the following environment variables to your Vercel project:

### Required Environment Variables

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Supabase Dashboard → Settings → API |

### Setting up Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your deployed project
3. Navigate to Settings → Environment Variables
4. Add each variable with its corresponding value from your Supabase project

### Setting up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to find your project URL and keys
3. Run the database setup by visiting `/admin/setup-database` after deployment
4. Configure your database tables using the provided admin tools

## Getting Started

### Local Development

1. Clone the repository
\`\`\`bash
git clone <your-repo-url>
cd streamline-app
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
\`\`\`

4. Run the development server
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

After deployment, visit `/admin/setup-database` to:
- Create all necessary database tables
- Set up Row Level Security policies
- Add seed data for testing

## Admin Tools

The application includes several admin tools accessible at:
- `/admin/setup-database` - Database setup and migration
- `/admin/test-database` - Database connectivity testing
- `/admin/health-check` - System health monitoring

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **PDF Generation:** jsPDF with custom styling
- **Deployment:** Vercel

## License

This project is licensed under the MIT License.
