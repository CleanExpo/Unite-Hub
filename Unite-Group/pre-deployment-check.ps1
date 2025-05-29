# Pre-deployment Health Check Script for UNITE Group
# Updated to check Version 3.0 features
Write-Host "Running pre-deployment health check..." -ForegroundColor Cyan

# 1. Check for required files
Write-Host "Checking for required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "lib/supabase/server.ts",
    "lib/supabase/client.ts",
    "lib/email/sendEmail.ts"
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

export const supabaseClient = createClient()

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
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "DEFAULT_FROM",
    "ADMIN_EMAIL"
)

foreach ($envVar in $requiredEnvVars) {
    if ([System.Environment]::GetEnvironmentVariable($envVar)) {
        Write-Host "✅ Found environment variable $envVar" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Missing environment variable $envVar" -ForegroundColor Yellow
        Write-Host "  This may cause issues if not set in your deployment platform" -ForegroundColor Yellow
    }
}

# 4. Design Preservation Checks
Write-Host "
Checking for design preservation..." -ForegroundColor Yellow

# 4.1 Check for modifications to key design files
$designFiles = @(
    "tailwind.config.ts",
    "styles/globals.css",
    "components/ui/button.tsx",
    "components/ui/card.tsx",
    "components/theme-provider.tsx"
)

if (Test-Path ".git") {
    foreach ($file in $designFiles) {
        if (Test-Path $file) {
            $gitStatus = git diff --name-only $file
            if ($gitStatus) {
                Write-Host "⚠️ Design file $file has been modified" -ForegroundColor Yellow
                Write-Host "  Please ensure changes comply with design preservation guidelines" -ForegroundColor Yellow
                Write-Host "  Run 'git diff $file' to review changes" -ForegroundColor Yellow
            } else {
                Write-Host "✅ Design file $file is unchanged" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Design file $file not found" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠️ Git repository not found, cannot check for design file modifications" -ForegroundColor Yellow
}

# 4.2 Check Tailwind configuration for design-breaking changes
if (Test-Path "tailwind.config.ts") {
    $tailwindContent = Get-Content "tailwind.config.ts" -Raw
    if ($tailwindContent -match "slate-900") {
        Write-Host "✅ Tailwind configuration contains required slate-900 theme color" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Tailwind configuration may be missing required slate-900 theme color" -ForegroundColor Yellow
        Write-Host "  Please ensure dark theme uses slate-900 as primary background" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Tailwind configuration file not found" -ForegroundColor Red
}

# 4.3 Check shadcn version consistency
if (Test-Path "components.json") {
    $componentsJson = Get-Content "components.json" -Raw | ConvertFrom-Json
    if ($componentsJson.tailwind.config -eq "tailwind.config.ts") {
        Write-Host "✅ shadcn/ui components configured correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️ shadcn/ui components may have incorrect configuration" -ForegroundColor Yellow
        Write-Host "  Please ensure components.json references the correct tailwind.config.ts file" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ shadcn/ui components.json configuration file not found" -ForegroundColor Red
}

# 4.4 Check for ShadCN-context.md updates
if (Test-Path "ShadCN-context.md") {
    $lastModified = (Get-Item "ShadCN-context.md").LastWriteTime
    $daysOld = (Get-Date) - $lastModified
    
    if ($daysOld.Days -gt 7) {
        Write-Host "⚠️ ShadCN-context.md is $($daysOld.Days) days old" -ForegroundColor Yellow
        Write-Host "  Please ensure it reflects all currently used components" -ForegroundColor Yellow
    } else {
        Write-Host "✅ ShadCN-context.md is up to date (last modified $($lastModified))" -ForegroundColor Green
    }
} else {
    Write-Host "❌ ShadCN-context.md not found" -ForegroundColor Red
}

# 5. Version 3.0 Feature Checks
Write-Host "
Checking Version 3.0 features..." -ForegroundColor Yellow

# 5.1 Authentication Components
$authPages = @(
    "src/app/login/page.tsx",
    "src/app/register/page.tsx",
    "src/app/reset-password/page.tsx",
    "src/app/update-password/page.tsx"
)

foreach ($file in $authPages) {
    if (Test-Path $file) {
        Write-Host "✅ Found authentication page: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing authentication page: $file" -ForegroundColor Red
    }
}

# 5.2 Legal Pages
$legalPages = @(
    "src/app/terms/page.tsx",
    "src/app/privacy/page.tsx"
)

foreach ($file in $legalPages) {
    if (Test-Path $file) {
        Write-Host "✅ Found legal page: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing legal page: $file" -ForegroundColor Red
    }
}

# 5.3 Content Pages
$contentPages = @(
    "src/app/case-studies/page.tsx",
    "src/app/blog/page.tsx"
)

foreach ($file in $contentPages) {
    if (Test-Path $file) {
        Write-Host "✅ Found content page: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing content page: $file" -ForegroundColor Red
    }
}

# 5.4 Consultation System
$consultationComponents = @(
    "src/app/book-consultation/page.tsx",
    "src/app/api/consultations/route.ts",
    "database/consultations.sql"
)

foreach ($file in $consultationComponents) {
    if (Test-Path $file) {
        Write-Host "✅ Found consultation component: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing consultation component: $file" -ForegroundColor Red
    }
}

# 5.5 Contact Form Integration
$contactComponents = @(
    "src/app/contact/page.tsx",
    "src/app/api/contact/route.ts"
)

foreach ($file in $contactComponents) {
    if (Test-Path $file) {
        Write-Host "✅ Found contact form component: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing contact form component: $file" -ForegroundColor Red
    }
}

# 5.6 Dashboard
if (Test-Path "src/app/dashboard/page.tsx") {
    Write-Host "✅ Found dashboard page" -ForegroundColor Green
} else {
    Write-Host "⚠️ Dashboard page not found" -ForegroundColor Yellow
    Write-Host "  This is part of Version 4.0 but recommended for client portal" -ForegroundColor Yellow
}

# 5.7 Environment configuration
if (Test-Path ".env.local.example") {
    Write-Host "✅ Found environment template file" -ForegroundColor Green
} else {
    Write-Host "❌ Missing .env.local.example file" -ForegroundColor Red
    Write-Host "  Required for deployment configuration" -ForegroundColor Red
}

# 4.5 Design Preservation Reminder
Write-Host "
🔍 Design Preservation Guidelines:" -ForegroundColor Cyan
Write-Host "  • Maintain current design aesthetic and layout" -ForegroundColor White
Write-Host "  • Add features without altering established design elements" -ForegroundColor White
Write-Host "  • Extend existing components rather than replacing them" -ForegroundColor White
Write-Host "  • Run visual comparison tests before deployment" -ForegroundColor White
Write-Host "  • Update documentation with any approved design changes" -ForegroundColor White

# Version 3.0 Reminder
Write-Host "
🚀 Version 3.0 Deployment Checklist:" -ForegroundColor Cyan
Write-Host "  • All placeholder content has been replaced with real content" -ForegroundColor White
Write-Host "  • Authentication flow works end-to-end" -ForegroundColor White
Write-Host "  • Contact forms successfully submit to the database" -ForegroundColor White
Write-Host "  • Consultation booking system is fully functional" -ForegroundColor White
Write-Host "  • Email notifications are properly configured" -ForegroundColor White
Write-Host "  • Legal pages contain accurate information" -ForegroundColor White
Write-Host "  • All API endpoints are properly secured" -ForegroundColor White

Write-Host "
Health check completed. Your project should now be ready for deployment." -ForegroundColor Cyan
