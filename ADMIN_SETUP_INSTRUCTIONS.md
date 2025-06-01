# Admin Setup Instructions

## Production URL
https://unite-group-fresh-owos411nq-admin-cleanexpo247s-projects.vercel.app

## Step 1: Create Admin User

Use the following curl command or Postman to create an admin user:

```bash
curl -X POST "https://unite-group-fresh-owos411nq-admin-cleanexpo247s-projects.vercel.app/api/setup-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phill.m@carsi.com.au",
    "password": "7WaEo$Mc8ZtwyCq!",
    "firstName": "Phill",
    "lastName": "McGurk"
  }'
```

Or using PowerShell:
```powershell
$body = @{
    email = "phill.m@carsi.com.au"
    password = "7WaEo$Mc8ZtwyCq!"
    firstName = "Phill"
    lastName = "McGurk"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://unite-group-fresh-owos411nq-admin-cleanexpo247s-projects.vercel.app/api/setup-admin" -Method POST -Body $body -ContentType "application/json"
```

## Step 2: Login

Once the admin user is created successfully, go to:
https://unite-group-fresh-owos411nq-admin-cleanexpo247s-projects.vercel.app/en/login

**Login Credentials:**
- Email: `phill.m@carsi.com.au`
- Password: `7WaEo$Mc8ZtwyCq!`

## Expected Response from Setup API

Success response:
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "id": "user-uuid-here",
    "email": "phill.m@carsi.com.au",
    "firstName": "Phill",
    "lastName": "McGurk"
  }
}
```

## Troubleshooting

### If the API call fails:
1. Check that the deployment has completed successfully
2. Verify all environment variables are set correctly in Vercel
3. Check the Vercel function logs for any errors

### If login fails after user creation:
1. Make sure you're using the exact email and password from the setup
2. Try the registration page to create a user manually if needed
3. Check browser console for any JavaScript errors

### Environment Variables Check
Make sure these are set in Vercel production:
- `NEXT_PUBLIC_SUPABASE_URL`: https://hdfggelozqzdxvupbnbp.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- `SUPABASE_SERVICE_ROLE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- `ALLOW_ADMIN_SETUP`: (your service role key was used instead of "true")

## Security Note

After creating your admin user, you may want to remove the `ALLOW_ADMIN_SETUP` environment variable or set it to `false` for security.

## Alternative: Manual Registration

If the setup API doesn't work, you can also:
1. Go to: https://unite-group-fresh-owos411nq-admin-cleanexpo247s-projects.vercel.app/en/register
2. Create a new account manually
3. The user will be created with "user" role by default
4. You can then update the role to "admin" directly in Supabase if needed
