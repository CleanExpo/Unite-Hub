# Vercel System Environment Variables

Vercel automatically provides many system environment variables during build and runtime. This document explains how we use these variables in our application.

## Available System Variables

### Build Information
- `VERCEL_ENV` - The environment (production, preview, development)
- `VERCEL_URL` - The URL of the deployment
- `VERCEL_REGION` - The region where the deployment is running
- `VERCEL_DEPLOYMENT_ID` - Unique identifier for the deployment

### Git Information
- `VERCEL_GIT_PROVIDER` - The Git provider (github, gitlab, etc.)
- `VERCEL_GIT_REPO_SLUG` - The repository name
- `VERCEL_GIT_REPO_OWNER` - The repository owner
- `VERCEL_GIT_COMMIT_REF` - The branch or tag name
- `VERCEL_GIT_COMMIT_SHA` - The commit hash
- `VERCEL_GIT_COMMIT_MESSAGE` - The commit message
- `VERCEL_GIT_COMMIT_AUTHOR_NAME` - The commit author's name
- `VERCEL_GIT_COMMIT_AUTHOR_LOGIN` - The commit author's username

## How We Use These Variables

### In Our Application
- **Health Check API**: Uses deployment and Git information to provide detailed health status
- **Build Status Component**: Displays current deployment information in the admin dashboard
- **Error Tracking**: Includes deployment context in error reports
- **Environment Badge**: Shows the current environment (production/preview/development)

### Exposed to the Client
We expose a limited subset of these variables to the client via `next.config.mjs`:
- `NEXT_PUBLIC_VERCEL_ENV` - The current environment
- `NEXT_PUBLIC_VERCEL_URL` - The deployment URL
- `NEXT_PUBLIC_DEPLOYMENT_ID` - The deployment ID
- `NEXT_PUBLIC_GIT_COMMIT_SHA` - The commit hash

## Benefits

1. **No Manual Configuration**: These variables are automatically available in all Vercel deployments
2. **Deployment Context**: Provides valuable context for debugging and monitoring
3. **Environment Awareness**: Allows the application to behave differently based on the environment
4. **Build Traceability**: Links each deployment back to its source code

## Usage Examples

### In Server Components/API Routes
\`\`\`typescript
// Access directly from process.env
const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
const gitCommit = process.env.VERCEL_GIT_COMMIT_SHA;
const environment = process.env.VERCEL_ENV;
\`\`\`

### In Client Components
\`\`\`typescript
// Access via NEXT_PUBLIC_ prefixed variables
const environment = process.env.NEXT_PUBLIC_VERCEL_ENV;
const deploymentUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
\`\`\`

## Additional Resources
- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel System Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables)
