Write-Host "📊 Exporting Vercel Project Data..." -ForegroundColor Cyan

# Create export directory
$exportDir = "vercel-export-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -Path $exportDir -ItemType Directory -Force

# Export all Vercel data
vercel inspect > "$exportDir/project-info.json"
vercel ls --output json > "$exportDir/deployments.json"
vercel env ls > "$exportDir/env-variables.txt"
vercel domains ls > "$exportDir/domains.txt"
vercel logs --output raw > "$exportDir/latest-logs.txt"

# Copy current source
Copy-Item -Path "src" -Destination "$exportDir/src" -Recurse
Copy-Item -Path "*.json" -Destination $exportDir
Copy-Item -Path "*.js" -Destination $exportDir -ErrorAction SilentlyContinue
Copy-Item -Path "*.ts" -Destination $exportDir -ErrorAction SilentlyContinue
Copy-Item -Path ".env.local" -Destination $exportDir -ErrorAction SilentlyContinue

# Create summary
@"
Vercel Project Export Summary
Generated: $(Get-Date)
Project: Unite Group
Export Location: $exportDir

Contents:
- Full source code
- Project configuration
- Deployment history
- Environment variables list
- Domain configuration
- Latest build logs
"@ > "$exportDir/README.txt"

Write-Host "✅ Export complete! Check folder: $exportDir" -ForegroundColor Green
