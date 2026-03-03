"""Supabase client shim — safe null replacement.

Supabase was removed in the JWT-only auth migration. This module
preserves the import interface so that existing code like:

    from src.utils.supabase_client import supabase

does not crash at import time. Actual attribute access raises with
a clear migration message.
"""


def get_supabase_client():
    """Raise with a clear migration message."""
    raise ValueError(
        "Supabase has been removed. "
        "Contractor/analytics features require PostgreSQL migration."
    )


def is_supabase_configured() -> bool:
    """Always returns False — Supabase is no longer configured."""
    return False


class _NullClient:
    """Raises on any attribute access with a migration message."""

    def __getattr__(self, name: str):
        raise AttributeError(
            f"Supabase client is not available (removed in JWT migration). "
            f"Attempted to access '.{name}'. "
            f"Migrate to PostgreSQL via SQLAlchemy."
        )


supabase = _NullClient()
