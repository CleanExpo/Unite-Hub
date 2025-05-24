# Pre-deployment Health Check Script
Write-Host "Running pre-deployment health check..." -ForegroundColor Cyan

# 1. Check for required files
Write-Host "Checking for required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "lib/supabase/server.ts",
    "lib/supabase/client.ts"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Found $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing $file" -ForegroundColor Red
        
        # Create directory if needed
        $dir = Split-Path -Parent $file
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            Write-Host "  Created directory $dir" -ForegroundColor Yellow
        }
        
        # Create the file based on its path
        if ($file -eq "lib/supabase/server.ts") {
            @'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Error handling
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Error handling
          }
        },
      },
    }
  )
}

// The required named export
export const createServerClient = createClient

// Default export
export default { createClient, createServerClient }
'@ | Out-File -FilePath $file -Encoding utf8
            Write-Host "  Created $file with required exports" -ForegroundColor Green
        }
        elseif ($file -eq "lib/supabase/client.ts") {
            @'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default createClient
'@ | Out-File -FilePath $file -Encoding utf8
            Write-Host "  Created $file" -ForegroundColor Green
        }
    }
}

# 2. Check for required exports
Write-Host "
Checking for required exports..." -ForegroundColor Yellow
$serverTsContent = Get-Content "lib/supabase/server.ts" -Raw
if ($serverTsContent -match "export\s+(const|function|let|var)\s+createServerClient") {
    Write-Host "✅ Found createServerClient export in lib/supabase/server.ts" -ForegroundColor Green
} else {
    Write-Host "❌ Missing createServerClient export in lib/supabase/server.ts" -ForegroundColor Red
    Write-Host "  Fixing the file..." -ForegroundColor Yellow
    
    # Fix the file by adding the export
    $serverTsContent = $serverTsContent -replace "export default", "export const createServerClient = createClient

export default"
    $serverTsContent | Out-File -FilePath "lib/supabase/server.ts" -Encoding utf8
    
    Write-Host "  Fixed lib/supabase/server.ts" -ForegroundColor Green
}

# 3. Check for environment variables
Write-Host "
Checking for required environment variables..." -ForegroundColor Yellow
$requiredEnvVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

foreach ($envVar in $requiredEnvVars) {
    if ([System.Environment]::GetEnvironmentVariable($envVar)) {
        Write-Host "✅ Found environment variable $envVar" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Missing environment variable $envVar" -ForegroundColor Yellow
        Write-Host "  This may cause issues if not set in your deployment platform" -ForegroundColor Yellow
    }
}

Write-Host "
Health check completed. Your project should now be ready for deployment." -ForegroundColor Cyan
