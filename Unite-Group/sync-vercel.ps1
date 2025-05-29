Write-Host "🔄 Syncing Vercel Project to Local..." -ForegroundColor Cyan

# 1. Pull environment variables
Write-Host "`n📥 Pulling environment variables..." -ForegroundColor Yellow
vercel env pull .env.local

# 2. Pull project settings
Write-Host "`n📥 Pulling project configuration..." -ForegroundColor Yellow
vercel pull

# 3. Get project info and save
Write-Host "`n📊 Saving project information..." -ForegroundColor Yellow
vercel inspect > vercel-project-info.json
vercel ls > vercel-deployments.txt

# 4. Pull from Git if connected
if (git remote -v) {
    Write-Host "`n🔄 Pulling latest code from Git..." -ForegroundColor Yellow
    git fetch origin
    git pull origin main
} else {
    Write-Host "`n⚠️  No Git remote found. Connect to GitHub through Vercel dashboard." -ForegroundColor Red
}

# 5. Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# 6. Create backup of current state
Write-Host "`n💾 Creating backup..." -ForegroundColor Yellow
$date = Get-Date -Format "yyyy-MM-dd-HHmm"
$backupDir = "backups/backup-$date"
New-Item -Path $backupDir -ItemType Directory -Force
Copy-Item -Path "src" -Destination $backupDir -Recurse
Copy-Item -Path ".env.local" -Destination $backupDir -ErrorAction SilentlyContinue

Write-Host "`n✅ Sync complete!" -ForegroundColor Green
Write-Host "📁 Backup saved to: $backupDir" -ForegroundColor Gray
