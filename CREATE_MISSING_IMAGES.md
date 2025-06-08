# Missing Images Issue

## Problem
The following team member images are referenced in `/about-us` but don't exist:
- `/images/team-claire-booth.png`
- `/images/team-yasir-sarfraz.png`
- `/images/team-afifa.png`

## Current Images in public/images:
- handshake-gear.png
- logo-192.png
- logo-512.png
- team-phill-mcgurk.png ✓ (exists)
- unite-logo.png
- united-group-logo.png

## Temporary Solution
Since we don't have the actual images, the code already has a fallback that shows initials when images are missing. However, the Image component is still trying to load non-existent images.

## Recommended Actions
1. Upload the missing team member images to `/public/images/`
2. Or update the team data to remove image references for missing images
3. Ensure all image paths are correct throughout the site
