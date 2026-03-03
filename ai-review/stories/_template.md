---
name: Story Name
url: http://localhost:3000
priority: high
---

## Preconditions
- Application running on localhost:3000
- Default admin user exists (admin@local.dev / admin123)

## Steps
1. Navigate to /login
2. Enter email "admin@local.dev"
3. Enter password "admin123"
4. Click "Sign In" button
5. Wait for page load

## Expected
- Redirect to /dashboard within 3 seconds
- Dashboard heading is visible
- No console errors
