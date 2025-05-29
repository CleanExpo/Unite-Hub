Write-Host "🎨 Restoring your complete v0 project..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Create all necessary directories
Write-Host "`n📁 Creating directory structure..." -ForegroundColor Yellow
$directories = @(
    "src/lib/supabase",
    "src/types",
    "src/app/login",
    "src/app/register",
    "src/app/dashboard",
    "src/app/forgot-password"
)

foreach ($dir in $directories) {
    New-Item -Path $dir -ItemType Directory -Force | Out-Null
    Write-Host "  ✓ $dir" -ForegroundColor Green
}

# File creation with progress tracking
$totalFiles = 11
$currentFile = 0

function Write-FileWithProgress($path, $content, $description) {
    $script:currentFile++
    Write-Host "`n[$currentFile/$totalFiles] Creating $description..." -ForegroundColor Yellow
    $content | Out-File -FilePath $path -Encoding UTF8 -NoNewline
    Write-Host "  ✓ Saved to: $path" -ForegroundColor Green
}

