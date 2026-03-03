"""Performance benchmarks for domain memory system.

Tests performance characteristics and identifies bottlenecks.
Run with: pytest tests/performance/test_memory_performance.py -v -m performance -s
"""

import time
import pytest
from statistics import mean, median

from src.memory.models import MemoryDomain
from src.memory.store import MemoryStore


def calculate_percentile(values: list[float], percentile: float) -> float:
    """Calculate percentile from a list of values."""
    sorted_values = sorted(values)
    index = int(len(sorted_values) * (percentile / 100))
    return sorted_values[min(index, len(sorted_values) - 1)]


@pytest.mark.performance
class TestMemoryPerformance:
    """Performance benchmarks for memory operations."""

    @pytest.fixture
    async def memory_store(self):
        """Create initialized MemoryStore."""
        store = MemoryStore()
        await store.initialize()
        yield store

    @pytest.mark.asyncio
    async def test_create_memory_performance(self, memory_store):
        """Benchmark memory creation speed."""
        print("\n" + "=" * 70)
        print("BENCHMARK: Memory Creation Performance")
        print("=" * 70)

        iterations = 100
        times = []
        created_ids = []

        for i in range(iterations):
            start = time.time()
            entry = await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="perf_test",
                key=f"create_test_{i}",
                value={"test": "data", "index": i},
                generate_embedding=False,  # Skip embedding for pure CRUD perf
            )
            elapsed = time.time() - start
            times.append(elapsed)
            created_ids.append(entry.id)

        # Calculate statistics
        avg_time = mean(times)
        median_time = median(times)
        p95_time = calculate_percentile(times, 95)
        p99_time = calculate_percentile(times, 99)
        min_time = min(times)
        max_time = max(times)

        print(f"\nResults ({iterations} iterations):")
        print(f"  Average:  {avg_time*1000:>8.2f}ms")
        print(f"  Median:   {median_time*1000:>8.2f}ms")
        print(f"  P95:      {p95_time*1000:>8.2f}ms")
        print(f"  P99:      {p99_time*1000:>8.2f}ms")
        print(f"  Min:      {min_time*1000:>8.2f}ms")
        print(f"  Max:      {max_time*1000:>8.2f}ms")

        # Performance assertions (should be fast)
        assert p95_time < 0.1, f"P95 create time too slow: {p95_time*1000:.2f}ms"
        assert avg_time < 0.05, f"Average create time too slow: {avg_time*1000:.2f}ms"

        print(f"\n✅ Performance acceptable (P95: {p95_time*1000:.2f}ms < 100ms)")

        # Clean up
        for entry_id in created_ids:
            await memory_store.delete(entry_id)

    @pytest.mark.asyncio
    async def test_read_memory_performance(self, memory_store):
        """Benchmark memory retrieval speed."""
        print("\n" + "=" * 70)
        print("BENCHMARK: Memory Read Performance")
        print("=" * 70)

        # Create test data
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="perf_test",
            key="read_test",
            value={"test": "data"},
            generate_embedding=False,
        )

        iterations = 100
        times = []

        for _ in range(iterations):
            start = time.time()
            await memory_store.get(entry.id, increment_access=False)
            elapsed = time.time() - start
            times.append(elapsed)

        # Calculate statistics
        avg_time = mean(times)
        median_time = median(times)
        p95_time = calculate_percentile(times, 95)
        p99_time = calculate_percentile(times, 99)

        print(f"\nResults ({iterations} iterations):")
        print(f"  Average:  {avg_time*1000:>8.2f}ms")
        print(f"  Median:   {median_time*1000:>8.2f}ms")
        print(f"  P95:      {p95_time*1000:>8.2f}ms")
        print(f"  P99:      {p99_time*1000:>8.2f}ms")

        # Performance assertions
        assert p95_time < 0.05, f"P95 read time too slow: {p95_time*1000:.2f}ms"

        print(f"\n✅ Performance acceptable (P95: {p95_time*1000:.2f}ms < 50ms)")

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_update_memory_performance(self, memory_store):
        """Benchmark memory update speed."""
        print("\n" + "=" * 70)
        print("BENCHMARK: Memory Update Performance")
        print("=" * 70)

        # Create test data
        entry = await memory_store.create(
            domain=MemoryDomain.KNOWLEDGE,
            category="perf_test",
            key="update_test",
            value={"test": "data"},
            generate_embedding=False,
        )

        iterations = 50
        times = []

        for i in range(iterations):
            start = time.time()
            await memory_store.update(
                entry.id,
                {"value": {"test": "data", "updated": i}},
                regenerate_embedding=False,
            )
            elapsed = time.time() - start
            times.append(elapsed)

        # Calculate statistics
        avg_time = mean(times)
        p95_time = calculate_percentile(times, 95)

        print(f"\nResults ({iterations} iterations):")
        print(f"  Average:  {avg_time*1000:>8.2f}ms")
        print(f"  P95:      {p95_time*1000:>8.2f}ms")

        # Performance assertions
        assert p95_time < 0.1, f"P95 update time too slow: {p95_time*1000:.2f}ms"

        print(f"\n✅ Performance acceptable (P95: {p95_time*1000:.2f}ms < 100ms)")

        # Clean up
        await memory_store.delete(entry.id)

    @pytest.mark.asyncio
    async def test_query_performance(self, memory_store):
        """Benchmark memory query performance."""
        print("\n" + "=" * 70)
        print("BENCHMARK: Memory Query Performance")
        print("=" * 70)

        # Create test data
        created_ids = []
        for i in range(50):
            entry = await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="query_perf_test",
                key=f"query_test_{i}",
                value={"index": i},
                generate_embedding=False,
            )
            created_ids.append(entry.id)

        from src.memory.models import MemoryQuery

        iterations = 50
        times = []

        for _ in range(iterations):
            start = time.time()
            await memory_store.query(
                MemoryQuery(
                    domain=MemoryDomain.KNOWLEDGE,
                    category="query_perf_test",
                    limit=20,
                )
            )
            elapsed = time.time() - start
            times.append(elapsed)

        # Calculate statistics
        avg_time = mean(times)
        p95_time = calculate_percentile(times, 95)

        print(f"\nResults ({iterations} iterations, 50 entries):")
        print(f"  Average:  {avg_time*1000:>8.2f}ms")
        print(f"  P95:      {p95_time*1000:>8.2f}ms")

        # Performance assertions
        assert p95_time < 0.15, f"P95 query time too slow: {p95_time*1000:.2f}ms"

        print(f"\n✅ Performance acceptable (P95: {p95_time*1000:.2f}ms < 150ms)")

        # Clean up
        for entry_id in created_ids:
            await memory_store.delete(entry_id)

    @pytest.mark.asyncio
    async def test_vector_search_performance(self, memory_store):
        """Benchmark vector similarity search performance."""
        print("\n" + "=" * 70)
        print("BENCHMARK: Vector Search Performance")
        print("=" * 70)

        # Create test data with embeddings
        created_ids = []
        print("\nCreating 50 entries with embeddings...")
        for i in range(50):
            entry = await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="vector_perf_test",
                key=f"vector_test_{i}",
                value={"pattern": f"Test pattern {i}"},
                generate_embedding=True,  # Generate embeddings
            )
            created_ids.append(entry.id)
        print("Test data created.")

        iterations = 20
        times = []

        print(f"\nRunning {iterations} search iterations...")
        for i in range(iterations):
            start = time.time()
            results = await memory_store.find_similar(
                query_text=f"test pattern {i % 10}",
                domain=MemoryDomain.KNOWLEDGE,
                similarity_threshold=0.5,
                limit=10,
            )
            elapsed = time.time() - start
            times.append(elapsed)

        # Calculate statistics
        avg_time = mean(times)
        p95_time = calculate_percentile(times, 95)
        p99_time = calculate_percentile(times, 99)

        print(f"\nResults ({iterations} iterations, 50 entries with embeddings):")
        print(f"  Average:  {avg_time*1000:>8.2f}ms")
        print(f"  P95:      {p95_time*1000:>8.2f}ms")
        print(f"  P99:      {p99_time*1000:>8.2f}ms")

        # Performance assertions (vector search is slower)
        assert p95_time < 0.5, f"P95 vector search too slow: {p95_time*1000:.2f}ms"

        print(f"\n✅ Performance acceptable (P95: {p95_time*1000:.2f}ms < 500ms)")

        # Clean up
        for entry_id in created_ids:
            await memory_store.delete(entry_id)

    @pytest.mark.asyncio
    async def test_embedding_generation_performance(self, memory_store):
        """Benchmark embedding generation speed."""
        print("\n" + "=" * 70)
        print("BENCHMARK: Embedding Generation Performance")
        print("=" * 70)

        from src.memory.embeddings import get_embedding_provider

        provider = get_embedding_provider()
        provider_name = provider.__class__.__name__

        print(f"\nUsing: {provider_name}")

        iterations = 20
        times = []
        test_texts = [
            f"Test text for embedding generation iteration {i}" for i in range(iterations)
        ]

        for text in test_texts:
            start = time.time()
            await provider.get_embedding(text)
            elapsed = time.time() - start
            times.append(elapsed)

        # Calculate statistics
        avg_time = mean(times)
        p95_time = calculate_percentile(times, 95)

        print(f"\nResults ({iterations} iterations):")
        print(f"  Average:  {avg_time*1000:>8.2f}ms")
        print(f"  P95:      {p95_time*1000:>8.2f}ms")

        # Performance assertions (depends on provider)
        if provider_name == "OpenAIEmbeddingProvider":
            # OpenAI API call - expect < 500ms
            assert p95_time < 1.0, f"P95 embedding generation too slow: {p95_time*1000:.2f}ms"
            print(f"\n✅ Performance acceptable for OpenAI (P95: {p95_time*1000:.2f}ms < 1000ms)")
        else:
            # Simple provider - should be very fast
            assert p95_time < 0.05, f"P95 embedding generation too slow: {p95_time*1000:.2f}ms"
            print(f"\n✅ Performance acceptable for {provider_name} (P95: {p95_time*1000:.2f}ms < 50ms)")

    @pytest.mark.asyncio
    async def test_batch_operations_performance(self, memory_store):
        """Benchmark batch create/delete operations."""
        print("\n" + "=" * 70)
        print("BENCHMARK: Batch Operations Performance")
        print("=" * 70)

        batch_size = 100

        # Batch create
        print(f"\nCreating {batch_size} entries...")
        start_create = time.time()
        created_ids = []

        for i in range(batch_size):
            entry = await memory_store.create(
                domain=MemoryDomain.KNOWLEDGE,
                category="batch_test",
                key=f"batch_{i}",
                value={"index": i},
                generate_embedding=False,
            )
            created_ids.append(entry.id)

        create_time = time.time() - start_create
        avg_create = create_time / batch_size

        print(f"  Total time:  {create_time*1000:>10.2f}ms")
        print(f"  Per entry:   {avg_create*1000:>10.2f}ms")
        print(f"  Throughput:  {batch_size/create_time:>10.2f} entries/sec")

        # Batch delete
        print(f"\nDeleting {batch_size} entries...")
        start_delete = time.time()

        for entry_id in created_ids:
            await memory_store.delete(entry_id)

        delete_time = time.time() - start_delete
        avg_delete = delete_time / batch_size

        print(f"  Total time:  {delete_time*1000:>10.2f}ms")
        print(f"  Per entry:   {avg_delete*1000:>10.2f}ms")
        print(f"  Throughput:  {batch_size/delete_time:>10.2f} entries/sec")

        # Performance assertions
        assert avg_create < 0.1, f"Average create time too slow: {avg_create*1000:.2f}ms"
        assert avg_delete < 0.1, f"Average delete time too slow: {avg_delete*1000:.2f}ms"

        print(f"\n✅ Batch performance acceptable")


@pytest.mark.performance
class TestScalabilityBenchmarks:
    """Test scalability with increasing data sizes."""

    @pytest.fixture
    async def memory_store(self):
        """Create initialized MemoryStore."""
        store = MemoryStore()
        await store.initialize()
        yield store

    @pytest.mark.asyncio
    async def test_query_scalability(self, memory_store):
        """Test query performance with increasing dataset size."""
        print("\n" + "=" * 70)
        print("BENCHMARK: Query Scalability Test")
        print("=" * 70)

        from src.memory.models import MemoryQuery

        dataset_sizes = [10, 50, 100, 200]
        results = []

        for size in dataset_sizes:
            # Create dataset
            print(f"\nTesting with {size} entries...")
            created_ids = []
            for i in range(size):
                entry = await memory_store.create(
                    domain=MemoryDomain.KNOWLEDGE,
                    category="scalability_test",
                    key=f"scale_test_{size}_{i}",
                    value={"size": size, "index": i},
                    generate_embedding=False,
                )
                created_ids.append(entry.id)

            # Measure query time
            times = []
            for _ in range(10):
                start = time.time()
                await memory_store.query(
                    MemoryQuery(
                        domain=MemoryDomain.KNOWLEDGE,
                        category="scalability_test",
                        limit=20,
                    )
                )
                elapsed = time.time() - start
                times.append(elapsed)

            avg_time = mean(times)
            results.append((size, avg_time))

            print(f"  Average query time: {avg_time*1000:.2f}ms")

            # Clean up
            for entry_id in created_ids:
                await memory_store.delete(entry_id)

        # Print summary
        print("\n" + "-" * 70)
        print("Scalability Summary:")
        print("-" * 70)
        print(f"{'Dataset Size':<15} {'Avg Query Time':<20} {'Entries/ms':<15}")
        print("-" * 70)
        for size, avg_time in results:
            throughput = size / (avg_time * 1000)
            print(f"{size:<15} {avg_time*1000:<20.2f} {throughput:<15.2f}")

        print("\n✅ Scalability test complete")
