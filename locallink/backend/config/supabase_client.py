# config/supabase_client.py
# ────────────────────────────────────────────────────────────────
# STUB – Supabase has been removed from this project.
# This file exists only so that any lingering imports don't crash.
# All authentication now goes through PostgreSQL + bcrypt + JWT.
# ────────────────────────────────────────────────────────────────

class _NullClient:
    """Raises a clear error if anything tries to use Supabase."""
    def __getattr__(self, name):
        raise RuntimeError(
            "Supabase has been removed from this project. "
            "Use config.database.get_db() for all database access."
        )

def get_supabase():
    raise RuntimeError(
        "Supabase has been removed. Use config.database.get_db() instead."
    )

def init_supabase():
    raise RuntimeError(
        "Supabase has been removed. Use config.database.get_db() instead."
    )
