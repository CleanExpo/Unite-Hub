# Post-Edit Auto-Formatter for Claude Code
# Automatically formats files after Edit/Write operations
# Reads tool input from stdin (JSON)

param()

$ErrorActionPreference = "SilentlyContinue"

# Read JSON input from stdin
$inputJson = [Console]::In.ReadToEnd()

try {
    $input = $inputJson | ConvertFrom-Json
    $filePath = $input.tool_input.file_path

    if (-not $filePath -or -not (Test-Path $filePath)) {
        exit 0  # File doesn't exist, skip formatting
    }

    $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
    $fileName = [System.IO.Path]::GetFileName($filePath)

    # Skip certain files
    $skipPatterns = @(
        "*.min.js", "*.min.css", "*.lock", "*.lock.json",
        "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
        "*.map", "*.d.ts"
    )

    foreach ($pattern in $skipPatterns) {
        if ($fileName -like $pattern) {
            exit 0
        }
    }

    # Skip files in certain directories
    $skipDirs = @("node_modules", ".next", "dist", "build", ".git", "coverage")
    foreach ($dir in $skipDirs) {
        if ($filePath -match [regex]::Escape($dir)) {
            exit 0
        }
    }

    $formatted = $false
    $formatResult = ""

    switch ($extension) {
        # TypeScript/JavaScript - use Prettier
        { $_ -in @(".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs") } {
            $formatResult = npx prettier --write $filePath 2>&1
            $formatted = $true
        }

        # JSON - use Prettier
        ".json" {
            # Skip package-lock files
            if ($fileName -notmatch "lock") {
                $formatResult = npx prettier --write $filePath 2>&1
                $formatted = $true
            }
        }

        # Markdown - use Prettier
        { $_ -in @(".md", ".mdx") } {
            $formatResult = npx prettier --write $filePath 2>&1
            $formatted = $true
        }

        # CSS/SCSS - use Prettier
        { $_ -in @(".css", ".scss", ".sass", ".less") } {
            $formatResult = npx prettier --write $filePath 2>&1
            $formatted = $true
        }

        # YAML - use Prettier
        { $_ -in @(".yml", ".yaml") } {
            $formatResult = npx prettier --write $filePath 2>&1
            $formatted = $true
        }

        # Python - use Black or Ruff
        ".py" {
            # Try ruff first (faster), fall back to black
            $ruffAvailable = Get-Command ruff -ErrorAction SilentlyContinue
            if ($ruffAvailable) {
                $formatResult = ruff format $filePath 2>&1
            } else {
                $blackAvailable = Get-Command black -ErrorAction SilentlyContinue
                if ($blackAvailable) {
                    $formatResult = black $filePath 2>&1
                }
            }
            $formatted = $true
        }

        # HTML - use Prettier
        { $_ -in @(".html", ".htm") } {
            $formatResult = npx prettier --write $filePath 2>&1
            $formatted = $true
        }
    }

    if ($formatted -and $LASTEXITCODE -eq 0) {
        Write-Output "Formatted: $fileName"
    }

} catch {
    # Silently fail - formatting is not critical
    Write-Error "Format hook error: $_"
}

exit 0
