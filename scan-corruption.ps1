Write-Host "Scanning for corrupted TypeScript/JavaScript files..." -ForegroundColor Yellow

$corruptedFiles = @()
$markdownPattern = "```(typescript|javascript|ts|js)"

# Find all TypeScript and JavaScript files
Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" | ForEach-Object {
    try {
        $content = Get-Content $_.FullName -Raw -ErrorAction Stop
        
        # Check for markdown code blocks
        if ($content -match $markdownPattern) {
            $corruptedFiles += [PSCustomObject]@{
                File = $_.FullName
                Issue = "Contains markdown code block"
                FirstLine = ($content -split "`n")[0]
            }
        }
        
        # Check for other corruption patterns
        elseif ($content -match "^@`"" -or $content -match "^# Fix") {
            $corruptedFiles += [PSCustomObject]@{
                File = $_.FullName
                Issue = "Contains PowerShell script content"
                FirstLine = ($content -split "`n")[0]
            }
        }
        
        # Check if file is empty
        elseif ($content.Trim().Length -eq 0) {
            $corruptedFiles += [PSCustomObject]@{
                File = $_.FullName
                Issue = "Empty file"
                FirstLine = ""
            }
        }
        
        # Check for invalid syntax patterns
        elseif ($content -match "^Error:" -or $content -match "^Parsing error:") {
            $corruptedFiles += [PSCustomObject]@{
                File = $_.FullName
                Issue = "Contains error messages"
                FirstLine = ($content -split "`n")[0]
            }
        }
    }
    catch {
        $corruptedFiles += [PSCustomObject]@{
            File = $_.FullName
            Issue = "Cannot read file"
            FirstLine = "Error: $($_.Exception.Message)"
        }
    }
}

if ($corruptedFiles.Count -eq 0) {
    Write-Host "No corrupted files found!" -ForegroundColor Green
} else {
    Write-Host "Found $($corruptedFiles.Count) corrupted files:" -ForegroundColor Red
    $corruptedFiles | Format-Table -AutoSize
    
    # Save the list to a file for reference
    $corruptedFiles | Export-Csv -Path "corrupted-files.csv" -NoTypeInformation
    Write-Host "Corrupted files list saved to corrupted-files.csv" -ForegroundColor Yellow
}
