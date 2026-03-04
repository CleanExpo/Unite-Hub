# Current State
> Updated by PreCompact hook and agents after key decisions.

## Active Task
<!-- Agent: update this field when starting a task -->
Founder Credential Vault — COMPLETED (04/03/2026)

## Recent Architectural Choices
<!-- Agent: append brief notes on significant decisions made this session -->
- Used pgsodium `vault.secrets` via SECURITY DEFINER RPCs (create/get/update/delete_vault_secret)
- Metadata stored in `founder_vault_items`, secrets never touch metadata table
- Dual-layer ownership check: RLS policy + explicit `owner_id` filter in service layer
- Reveal endpoint returns 30-second unix expiry; UI auto-masks via interval countdown
- Admin client (`supabaseAdmin`) used for audit log inserts to avoid RLS blocking audit writes
- Framer Motion for modal + card entry + reveal panel animations (no CSS transitions)

## In-Progress Work
<!-- Agent: list files being modified and why -->
None — all files committed

## Next Steps
<!-- Agent: list what remains after this session -->
- Apply migration 500_founder_vault.sql to Supabase (requires dashboard or CLI)
- Set SUPABASE_SERVICE_ROLE_KEY env var if not already present
- Mark Linear task #4 (Founder Credential Vault) as Done — Linear MCP was unauthenticated this session

## Last Updated
04/03/2026
