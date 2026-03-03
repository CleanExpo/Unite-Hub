# Notification Alert Hook for Claude Code
# Shows Windows toast notifications when Claude needs attention
# Reads notification data from stdin (JSON)

param()

$ErrorActionPreference = "SilentlyContinue"

# Read JSON input from stdin
$inputJson = [Console]::In.ReadToEnd()

try {
    $input = $inputJson | ConvertFrom-Json
    $message = $input.message
    $notificationType = $input.notification_type

    if (-not $message) {
        exit 0
    }

    # Determine notification title based on type
    $title = switch ($notificationType) {
        "permission_prompt" { "Claude Code - Permission Required" }
        "idle_prompt" { "Claude Code - Waiting for Input" }
        "auth_success" { "Claude Code - Authentication" }
        default { "Claude Code" }
    }

    # Use Windows Toast Notification (PowerShell 5.1+)
    # This works on Windows 10/11 without additional modules

    # Method 1: BurntToast module (if installed)
    $burntToast = Get-Module -ListAvailable -Name BurntToast
    if ($burntToast) {
        Import-Module BurntToast
        New-BurntToastNotification -Text $title, $message -Sound "Default"
        exit 0
    }

    # Method 2: Native Windows notification via PowerShell
    # Create a balloon notification using Windows Forms
    Add-Type -AssemblyName System.Windows.Forms

    # Check if we can show notifications
    $global:balloon = New-Object System.Windows.Forms.NotifyIcon
    $balloon.Icon = [System.Drawing.SystemIcons]::Information
    $balloon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
    $balloon.BalloonTipTitle = $title
    $balloon.BalloonTipText = $message
    $balloon.Visible = $true
    $balloon.ShowBalloonTip(5000)  # Show for 5 seconds

    # Play a sound for permission prompts
    if ($notificationType -eq "permission_prompt") {
        [System.Media.SystemSounds]::Exclamation.Play()
    }

    # Clean up after a delay (in background)
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 6
        if ($using:balloon) {
            $using:balloon.Dispose()
        }
    } | Out-Null

} catch {
    # Silently fail - notifications are not critical
    # Could log to a file for debugging if needed
}

exit 0
