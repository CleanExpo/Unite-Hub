# Vercel Deployment Troubleshooting Guide

## Issue: Deployments Not Triggering Automatically

### Steps to Verify and Fix:

1. **Check Vercel GitHub Integration**
   - Go to https://vercel.com/dashboard
   - Click on your project
   - Go to Settings → Git
   - Verify that:
     - GitHub repository is connected (CleanExpo/Unite-Group)
     - Production Branch is set to "main"
     - "Deploy Hooks" are enabled

2. **Check Recent Deployments**
   - In Vercel dashboard, go to your project
   - Click on "Deployments" tab
   - Check if recent commits show up
   - If not, the GitHub webhook might be broken

3. **Re-establish GitHub Connection**
   If deployments aren't triggering:
   - Go to Settings → Git in Vercel
   - Click "Disconnect" from GitHub
   - Click "Connect Git Repository"
   - Select GitHub
   - Choose the CleanExpo/Unite-Group repository
   - Ensure "main" branch is selected for production

4. **Manual Deployment Trigger**
   As a temporary solution:
   - In Vercel dashboard, click "Redeploy"
   - Or use Vercel CLI: `vercel --prod`

5. **Check GitHub Webhooks**
   - Go to https://github.com/CleanExpo/Unite-Group/settings/hooks
   - Look for Vercel webhook
   - Check if it's active and recent deliveries are successful

## Recent Changes Made:

1. **About Page Update** (Commit: 1a2fce3)
   - Changed team member name from "Usman" to "Rana"
   - Updated avatar initials from "US" to "RN"

2. **Navigation Update** (Commit: 287d7ef)
   - Added Services, Pricing, Contact, and About links to main navigation
   - These pages already exist and should be accessible from the header

## Expected Result:
Once deployment is working, the website should show:
- Updated team member name "Rana" on the About page
- Navigation header with links to Services, Pricing, Contact, and About pages

## Quick Check:
Visit https://www.unite-group.in to see if changes are live.
