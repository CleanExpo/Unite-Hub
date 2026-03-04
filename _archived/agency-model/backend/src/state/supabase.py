"""Legacy module — redirects to NullStateStore.

Supabase was removed in the JWT-only auth migration. This re-export
preserves the import path used by 12+ modules:

    from src.state.supabase import SupabaseStateStore
"""

from src.state.null_store import NullStateStore as SupabaseStateStore

__all__ = ["SupabaseStateStore"]
