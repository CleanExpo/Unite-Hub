# Codex Repo Skills (Unite-Hub)

This folder contains repo-scoped Codex skills.

## How to use

- Restart Codex after adding/updating skills.
- Invoke explicitly by mentioning `$<skill-name>` in your prompt (recommended).
- Codex may also choose a skill automatically when your prompt matches its `description`.

## Available skills

- `$workspace-isolation-audit`: audit/repair missing `workspace_id` filters
- `$fix-hardcoded-workspaceid-pages`: remove hardcoded workspace IDs in client pages
- `$docker-next-config-mounts`: ensure docker compose mounts `next.config.mjs` correctly
- `$codex-sdk-starter`: add docs/usage patterns for Codex SDK automation
- `$draft-commit-message`: draft a Conventional Commits message from a change summary

