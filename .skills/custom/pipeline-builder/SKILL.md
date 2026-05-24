# Pipeline Builder

> Composable data and task pipeline construction with typed stages, error handling, and parallel execution for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `pipeline-builder`                                       |
| **Category**   | Orchestration & Workflow                                 |
| **Complexity** | Medium                                                   |
| **Complements**| `data-transform`, `queue-worker`, `state-machine`        |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies composable pipeline patterns for NodeJS-Starter-V1: typed stage-based pipelines for data and task processing, parallel stage execution, conditional branching, error recovery stages, pipeline composition, and integration with the existing workflow builder infrastructure.

---

## When to Apply

### Positive Triggers

- Building multi-stage data processing workflows
- Composing reusable processing stages into pipelines
- Adding parallel execution for independent pipeline stages
- Creating ETL-style import/export pipelines
- Orchestrating agent task sequences with conditional logic

### Negative Triggers

- Simple data mapping between two types (use `data-transform` skill)
- Distributed transactions with compensation (use `saga-pattern` skill)
- State machine transitions (use `state-machine` skill)
- Cron-scheduled job execution (use `cron-scheduler` skill)

---

## Core Principles

### The Three Laws of Pipelines

1. **Typed Stages**: Every stage declares its input type and output type. Connecting stages with mismatched types is a compile-time error, not a runtime surprise.
2. **Composable Over Configurable**: Build complex pipelines by composing simple stages, not by configuring a monolithic processor. `A | B | C` is clearer than `Processor(steps=[a, b, c])`.
3. **Fail Fast, Recover Explicitly**: A stage failure stops the pipeline by default. Recovery must be an explicit `on_error` handler, not silent swallowing.

---

## Pattern 1: Typed Pipeline (Python)

### Stage-Based Pipeline with Type Safety

```python
from typing import Callable, Generic, TypeVar
from dataclasses import dataclass, field

T = TypeVar("T")
U = TypeVar("U")


@dataclass
class Stage(Generic[T, U]):
    name: str
    process: Callable[[T], U]
    on_error: Callable[[Exception, T], U] | None = None


class Pipeline:
    """Composable pipeline with named stages."""

    def __init__(self, name: str) -> None:
        self.name = name
        self.stages: list[Stage] = []

    def pipe(self, name: str, fn: Callable, on_error: Callable | None = None) -> "Pipeline":
        self.stages.append(Stage(name=name, process=fn, on_error=on_error))
        return self

    def execute(self, data):
        result = data
        for stage in self.stages:
            try:
                result = stage.process(result)
            except Exception as e:
                if stage.on_error:
                    result = stage.on_error(e, result)
                else:
                    raise PipelineError(
                        f"Pipeline '{self.name}' failed at stage '{stage.name}'",
                        stage=stage.name,
                        original_error=e,
                    ) from e
        return result


class PipelineError(Exception):
    def __init__(self, message: str, stage: str, original_error: Exception):
        super().__init__(message)
        self.stage = stage
        self.original_error = original_error
```

### Usage

```python
import_pipeline = (
    Pipeline("csv-import")
    .pipe("read", lambda path: read_csv(path))
    .pipe("validate", lambda rows: [validate_row(r) for r in rows])
    .pipe("transform", lambda rows: [to_camel_case(r) for r in rows])
    .pipe("load", lambda rows: bulk_insert(rows))
)

result = import_pipeline.execute("data/users.csv")
```

---

## Pattern 2: Async Pipeline with Parallel Stages

### Concurrent Stage Execution

```python
import asyncio


class AsyncPipeline:
    """Pipeline with async stages and parallel execution support."""

    def __init__(self, name: str) -> None:
        self.name = name
        self.stages: list[tuple[str, Callable, bool]] = []  # name, fn, parallel

    def pipe(self, name: str, fn: Callable) -> "AsyncPipeline":
        self.stages.append((name, fn, False))
        return self

    def parallel(self, name: str, fns: list[Callable]) -> "AsyncPipeline":
        """Run multiple functions in parallel on the same input."""
        async def run_parallel(data):
            results = await asyncio.gather(*[fn(data) for fn in fns])
            return results
        self.stages.append((name, run_parallel, True))
        return self

    async def execute(self, data):
        result = data
        for name, fn, _is_parallel in self.stages:
            result = await fn(result)
        return result


# Usage
enrichment_pipeline = (
    AsyncPipeline("document-enrichment")
    .pipe("fetch", fetch_document)
    .parallel("enrich", [
        generate_embeddings,
        extract_keywords,
        compute_summary,
    ])
    .pipe("merge", merge_enrichment_results)
    .pipe("store", save_enriched_document)
)
```

---

## Pattern 3: TypeScript Pipeline

### Frontend Data Processing Pipeline

```typescript
type StageFunction<T, U> = (input: T) => U | Promise<U>;

class TypedPipeline<TInput, TOutput> {
  private stages: { name: string; fn: StageFunction<unknown, unknown> }[] = [];

  constructor(private name: string) {}

  pipe<TNext>(
    name: string,
    fn: StageFunction<TOutput, TNext>,
  ): TypedPipeline<TInput, TNext> {
    this.stages.push({ name, fn: fn as StageFunction<unknown, unknown> });
    return this as unknown as TypedPipeline<TInput, TNext>;
  }

  async execute(input: TInput): Promise<TOutput> {
    let result: unknown = input;
    for (const stage of this.stages) {
      result = await stage.fn(result);
    }
    return result as TOutput;
  }
}

// Usage
const reportPipeline = new TypedPipeline<string, ReportOutput>("report")
  .pipe("fetch", (id: string) => apiClient.get(`/reports/${id}`))
  .pipe("transform", (data) => transformReportData(data))
  .pipe("format", (data) => formatForDisplay(data));
```

---

## Pattern 4: Conditional Branching

### Pipeline Forks Based on Data

```python
class ConditionalPipeline(Pipeline):
    """Pipeline with conditional stage execution."""

    def when(
        self,
        name: str,
        condition: Callable,
        if_true: Callable,
        if_false: Callable | None = None,
    ) -> "ConditionalPipeline":
        def conditional_stage(data):
            if condition(data):
                return if_true(data)
            return if_false(data) if if_false else data

        self.stages.append(Stage(name=name, process=conditional_stage))
        return self


# Usage
export_pipeline = (
    ConditionalPipeline("export")
    .pipe("fetch", fetch_data)
    .when("format",
        condition=lambda data: data["format"] == "csv",
        if_true=to_csv,
        if_false=to_json,
    )
    .pipe("compress", gzip_compress)
)
```

---

## Pattern 5: Pipeline Composition

### Combining Pipelines

```python
def compose(*pipelines: Pipeline) -> Pipeline:
    """Compose multiple pipelines into one."""
    composed = Pipeline(
        name=" | ".join(p.name for p in pipelines),
    )
    for pipeline in pipelines:
        composed.stages.extend(pipeline.stages)
    return composed


# Reusable sub-pipelines
validation = Pipeline("validate").pipe("schema", validate_schema).pipe("sanitise", sanitise_input)
transform = Pipeline("transform").pipe("normalise", normalise_data).pipe("enrich", enrich_data)
load = Pipeline("load").pipe("insert", bulk_insert).pipe("index", update_search_index)

# Compose into full ETL
etl = compose(validation, transform, load)
result = etl.execute(raw_data)
```

**Complements**: `data-transform` skill — pipeline stages use typed mappers from the data-transform skill. `queue-worker` skill — heavy pipelines run as background jobs.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Nested function calls `c(b(a(x)))` | Unreadable, no error attribution | Named stages in pipeline |
| Silent error swallowing | Bugs hidden, data corruption | Explicit `on_error` or fail fast |
| Untyped stage connections | Runtime type errors | Typed input/output per stage |
| Monolithic processor class | Cannot reuse individual stages | Composable stage functions |
| Sequential when parallelisable | Wasted time on independent work | `parallel()` for independent stages |

---

## Checklist

Before merging pipeline-builder changes:

- [ ] `Pipeline` class with named stages and `pipe()` method
- [ ] `PipelineError` with stage name and original error
- [ ] Async pipeline with `parallel()` for concurrent stages
- [ ] Conditional branching with `when()` method
- [ ] Pipeline composition via `compose()`
- [ ] TypeScript pipeline with type-safe stage chaining

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Pipeline Implementation

**Language**: [Python / TypeScript / both]
**Execution**: [sync / async / parallel]
**Error Handling**: [fail fast / on_error recovery]
**Composition**: [compose() / inline]
**Integration**: [workflow builder / standalone]
```
