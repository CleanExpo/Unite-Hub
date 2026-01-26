# Autonomous PR Creation Setup

## Generate GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Name: "Claude Code CLI Access"
3. Expiration: Your choice (90 days recommended)
4. Scopes needed:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)

5. Click "Generate token"
6. Copy the token (starts with `ghp_...`)

## Set Environment Variable

### Windows (PowerShell)
```powershell
# Temporary (current session only)
$env:GH_TOKEN = "ghp_your_token_here"

# Permanent (user level)
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_your_token_here', 'User')
```

### Windows (Command Prompt)
```cmd
setx GH_TOKEN "ghp_your_token_here"
```

## Verify Setup
```bash
gh auth status
```

## Then Claude Can Create PRs Autonomously
```bash
gh pr create --base main --head feature-branch --title "Title" --body "Description"
```

---

**Note**: Once `GH_TOKEN` is set in your environment, I'll be able to create PRs fully autonomously without any user interaction.
