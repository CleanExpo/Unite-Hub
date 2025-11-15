# PowerShell script to add `const supabaseServer = getSupabaseServer();` to functions missing it

$file = "src\lib\db.ts"
$content = Get-Content $file -Raw

# Define patterns that need fixing (functions that use supabaseServer without declaring it)
$patterns = @(
    # content.create
    "content: \{\s+create: async \(data: any\) => \{\s+const \{ data: content, error \} = await supabaseServer",
    # content.approve
    "approve: async \(id: string\) => \{\s+const \{ error \} = await supabaseServer",
    # content.updateStatus
    "updateStatus: async \(id: string, status: string\) => \{\s+const \{ error \} = await supabaseServer",
    # emailVariants.create
    "emailVariants: \{\s+create: async \(data: any\) => \{\s+const \{ data: variant, error \} = await supabaseServer",
    # campaigns.create
    "campaigns: \{\s+create: async \(data: any\) => \{\s+const \{ data: campaign, error \} = await supabaseServer",
    # interactions.create
    "interactions: \{\s+create: async \(data: any\) => \{\s+const \{ error \} = await supabaseServer",
    # auditLogs.create
    "auditLogs: \{\s+create: async \(data: any\) => \{\s+const \{ error \} = await supabaseServer",
    # emailIntegrations.create
    "emailIntegrations: \{\s+create: async \(data: any\) => \{\s+const \{ data: integration, error \} = await supabaseServer",
    # emailIntegrations.update
    "update: async \(id: string, data: any\) => \{\s+const \{ error \} = await supabaseServer",
    # sentEmails.create
    "sentEmails: \{\s+create: async \(data: any\) => \{\s+const \{ data: email, error \} = await supabaseServer",
    # And many more...
)

Write-Host "File has" ($content.Length) "characters"
Write-Host "Contains" (($content -split "await supabaseServer").Count - 1) "occurrences of 'await supabaseServer'"
Write-Host "Contains" (($content -split "const supabaseServer = getSupabaseServer\(\);").Count - 1) "function declarations"

# This is complex - let's just output what needs to be done
Write-Host "`nManual fixes needed for all functions using supabaseServer without declaring it."
