# alias-guard.test.ps1 — smoke tests for the PreToolUse hook
$hook = "D:\Unite-Hub\.portfolio\hooks\alias-guard.ps1"
$passed = 0
$failed = 0

function Test-Hook($desc, $event, $expectBlock) {
  $script:total = ($script:total + 1)
  $json = $event | ConvertTo-Json -Compress
  $result = $json | & powershell.exe -NoProfile -File $hook 2>&1
  $blocked = ($result -join " ") -match '"decision":"block"'
  if ($blocked -eq $expectBlock) {
    Write-Output "PASS $desc"
    $script:passed += 1
  } else {
    Write-Output "FAIL $desc (expected block=$expectBlock, got block=$blocked)"
    Write-Output "  output: $result"
    $script:failed += 1
  }
}

# Should BLOCK: cloning to a banned path
Test-Hook "clone to D:\Unite Group (blocked path)" @{
  tool_name = "Bash"
  tool_input = @{ command = "git clone https://github.com/CleanExpo/Unite-Hub 'D:\Unite Group'" }
} $true

# Should BLOCK: cloning Unite-Hub to non-canonical path
Test-Hook "clone Unite-Hub to D:\Foo (non-canonical)" @{
  tool_name = "Bash"
  tool_input = @{ command = "git clone https://github.com/CleanExpo/Unite-Hub D:\Foo" }
} $true

# Should BLOCK: creating banned directory (via the blocked-paths list)
Test-Hook "Write to D:\Unite Group Businesses" @{
  tool_name = "Write"
  tool_input = @{ file_path = "D:\Unite Group Businesses\foo.txt" }
} $true

# Should ALLOW: cloning to the canonical path
Test-Hook "clone Unite-Hub to canonical D:\Unite-Hub" @{
  tool_name = "Bash"
  tool_input = @{ command = "git clone https://github.com/CleanExpo/Unite-Hub D:\Unite-Hub" }
} $false

# Should ALLOW: unrelated bash command
Test-Hook "unrelated bash command" @{
  tool_name = "Bash"
  tool_input = @{ command = "ls D:\\" }
} $false

# Should ALLOW: write to canonical Authority-Site
Test-Hook "Write to D:\Authority-Site" @{
  tool_name = "Write"
  tool_input = @{ file_path = "D:\Authority-Site\foo.txt" }
} $false

# Should ALLOW: bypass env var
$env:PORTFOLIO_GUARD_BYPASS = "1"
Test-Hook "bypass env var allows blocked clone" @{
  tool_name = "Bash"
  tool_input = @{ command = "git clone https://github.com/CleanExpo/Unite-Hub 'D:\Unite Group'" }
} $false
Remove-Item env:PORTFOLIO_GUARD_BYPASS

Write-Output ""
Write-Output "Passed: $passed | Failed: $failed"
if ($failed -gt 0) { exit 1 } else { exit 0 }
