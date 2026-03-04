"""Setup verification script for domain memory system.

Verifies dependencies, configuration, and functionality.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


def print_header(text: str) -> None:
    """Print section header."""
    print(f"\n{'=' * 70}")
    print(f"  {text}")
    print(f"{'=' * 70}\n")


def print_check(message: str, success: bool, details: str = "") -> None:
    """Print check result."""
    icon = "✅" if success else "❌"
    print(f"{icon} {message}")
    if details:
        print(f"   {details}")


async def verify_setup() -> int:
    """Verify memory system setup.

    Returns:
        Exit code (0 = success, 1 = failure)
    """
    print_header("🔍 Domain Memory System Setup Verification")

    errors = []
    warnings = []

    # 1. Check environment variables
    print("1. Checking environment variables...\n")

    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    if not supabase_url:
        errors.append("NEXT_PUBLIC_SUPABASE_URL not set")
        print_check("Supabase URL", False, "Environment variable not set")
    else:
        print_check("Supabase URL", True, f"{supabase_url}")

    if not supabase_key:
        errors.append("SUPABASE_SERVICE_ROLE_KEY not set")
        print_check("Supabase service key", False, "Environment variable not set")
    else:
        print_check("Supabase service key", True, "Configured")

    # Check embedding providers
    if openai_key:
        print_check("OpenAI API key", True, "Configured (recommended for production)")
    elif anthropic_key:
        warnings.append("Using Anthropic key (embeddings not yet available)")
        print_check(
            "Anthropic API key", True, "Configured (embeddings placeholder only)"
        )
    else:
        warnings.append("No embedding API key (will use simple hash-based provider)")
        print_check(
            "Embedding provider",
            True,
            "Using SimpleEmbeddingProvider (dev only)",
        )

    # 2. Test database connection
    print("\n2. Testing database connection...\n")
    try:
        from src.state.supabase import SupabaseStateStore

        store = SupabaseStateStore()
        client = store.client

        # Try a simple query
        result = client.table("domain_memories").select("id").limit(0).execute()
        print_check("Database connection", True, "Successfully connected to Supabase")
        print_check(
            "domain_memories table", True, "Table exists and is accessible"
        )
    except Exception as e:
        errors.append(f"Database connection failed: {e}")
        print_check("Database connection", False, str(e))

    # 3. Test memory store initialization
    print("\n3. Testing MemoryStore initialization...\n")
    try:
        from src.memory.store import MemoryStore

        memory = MemoryStore()
        await memory.initialize()
        print_check("MemoryStore initialization", True, "Successfully initialized")

        # Check embedding provider is set
        if memory.embedding_provider:
            provider_name = memory.embedding_provider.__class__.__name__
            print_check("Embedding provider", True, f"Using {provider_name}")
        else:
            errors.append("Embedding provider not initialized")
            print_check("Embedding provider", False, "Not initialized")
    except Exception as e:
        errors.append(f"MemoryStore initialization failed: {e}")
        print_check("MemoryStore initialization", False, str(e))

    # 4. Test embedding generation
    print("\n4. Testing embedding generation...\n")
    try:
        from src.memory.embeddings import get_embedding_provider

        provider = get_embedding_provider()
        embedding = await provider.get_embedding("test")

        if len(embedding) == 1536:
            provider_name = provider.__class__.__name__
            print_check(
                "Embedding generation",
                True,
                f"{provider_name} generated {len(embedding)}-dim vector",
            )
        else:
            errors.append(f"Embedding dimension incorrect: {len(embedding)}")
            print_check(
                "Embedding generation",
                False,
                f"Expected 1536 dimensions, got {len(embedding)}",
            )
    except Exception as e:
        errors.append(f"Embedding generation failed: {e}")
        print_check("Embedding generation", False, str(e))

    # 5. Test CRUD operations (optional - only if database is accessible)
    print("\n5. Testing CRUD operations...\n")
    try:
        from src.memory.models import MemoryDomain
        from src.memory.store import MemoryStore

        memory_store = MemoryStore()
        await memory_store.initialize()

        # Create a test memory
        test_entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="setup_test",
            key="verification_test",
            value={"test": "data"},
            generate_embedding=False,  # Skip embedding for speed
        )
        print_check("Create memory", True, f"Created entry {test_entry.id}")

        # Retrieve it
        retrieved = await memory_store.get(test_entry.id)
        if retrieved and retrieved.key == "verification_test":
            print_check("Read memory", True, f"Retrieved entry {retrieved.id}")
        else:
            errors.append("Failed to retrieve created memory")
            print_check("Read memory", False, "Retrieval mismatch")

        # Update it
        updated = await memory_store.update(
            test_entry.id,
            {"value": {"test": "updated"}},
        )
        if updated and updated.value == {"test": "updated"}:
            print_check("Update memory", True, "Successfully updated")
        else:
            errors.append("Failed to update memory")
            print_check("Update memory", False, "Update failed")

        # Delete it
        deleted = await memory_store.delete(test_entry.id)
        if deleted:
            print_check("Delete memory", True, "Successfully deleted")
        else:
            errors.append("Failed to delete memory")
            print_check("Delete memory", False, "Delete failed")

    except Exception as e:
        warnings.append(f"CRUD test failed: {e}")
        print_check("CRUD operations", False, str(e))

    # 6. Test SupabaseStateStore memory methods
    print("\n6. Testing SupabaseStateStore memory integration...\n")
    try:
        from src.state.supabase import SupabaseStateStore

        store = SupabaseStateStore()

        # Test memory creation via SupabaseStateStore
        memory = await store.create_memory(
            domain="knowledge",
            category="setup_test",
            key="supabase_integration_test",
            value={"test": "supabase"},
        )
        print_check(
            "SupabaseStateStore.create_memory",
            True,
            f"Created memory {memory.get('id', 'unknown')}",
        )

        # Clean up
        if "id" in memory:
            await store.delete_memory(memory["id"])
            print_check("SupabaseStateStore.delete_memory", True, "Cleaned up test data")

    except Exception as e:
        warnings.append(f"SupabaseStateStore integration test failed: {e}")
        print_check("SupabaseStateStore integration", False, str(e))

    # Summary
    print_header("📊 Verification Summary")

    if errors:
        print("❌ Setup verification FAILED\n")
        print("Errors:")
        for error in errors:
            print(f"   - {error}")

        if warnings:
            print("\nWarnings:")
            for warning in warnings:
                print(f"   - {warning}")

        print("\n💡 Suggested fixes:")
        print("   1. Ensure Supabase is running: supabase start")
        print("   2. Apply migrations: supabase db reset")
        print("   3. Check .env file has required variables")
        print("   4. Re-run this script: uv run python scripts/setup-memory.py\n")

        return 1

    if warnings:
        print("⚠️  Setup verification passed with warnings\n")
        print("Warnings:")
        for warning in warnings:
            print(f"   - {warning}")
        print()

    print("✅ All checks passed! Domain memory system is ready.\n")
    print("💡 Next steps:")
    print("   1. Run tests: uv run pytest tests/test_memory*.py -v")
    print("   2. Run integration tests: uv run pytest tests/integration/ -v -m integration")
    print("   3. Start development: pnpm dev\n")

    return 0


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(verify_setup())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Verification interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error during verification: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
