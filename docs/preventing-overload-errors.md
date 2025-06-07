# Preventing Overload Errors with Task Chunking

This guide explains how to use the task chunking utilities to prevent overload errors when processing large amounts of data or performing many operations.

## Overview

The task chunking system breaks down large operations into smaller, manageable chunks to prevent system overload. It includes:

1. **Task Chunker**: Core utility for chunking any async operations
2. **Service Repair Manager**: Specialized for repair operations
3. **React Hooks**: For using chunked operations in components
4. **CLI Tools**: For command-line repair operations

## Key Features

- **Concurrent Limiting**: Control how many operations run simultaneously
- **Batch Processing**: Group small tasks for efficiency
- **Rate Limiting**: Prevent API rate limit errors
- **Retry Logic**: Automatic retries with exponential backoff
- **Progress Tracking**: Real-time progress updates
- **Abort Support**: Cancel operations in progress

## Usage Examples

### 1. Basic Task Chunking

```typescript
import { TaskChunker } from '@/lib/utils/task-chunker';

// Create a chunker
const chunker = new TaskChunker({
  maxChunkSize: 5,        // Process 5 items per chunk
  maxConcurrent: 2,       // 2 concurrent operations
  delayBetweenChunks: 300, // 300ms delay between chunks
  retryAttempts: 3,       // Retry failed items 3 times
  progressCallback: (current, total) => {
    console.log(`Progress: ${current}/${total}`);
  }
});

// Add tasks
const items = Array.from({ length: 100 }, (_, i) => ({ id: i, data: `Item ${i}` }));
chunker.addTasks(items);

// Process with your async function
const processor = async (item) => {
  // Your async operation here
  const result = await fetchAPI(item);
  return result;
};

const { results, errors } = await chunker.processAll(processor);
```

### 2. React Component with Chunking

```typescript
import { useChunkedOperation } from '@/hooks/useChunkedOperation';

function MyComponent() {
  const { process, abort, reset, state } = useChunkedOperation(
    async (item) => {
      // Your async operation
      return await processItem(item);
    },
    {
      maxChunkSize: 10,
      maxConcurrent: 3,
      delayBetweenChunks: 200,
      onProgress: (current, total) => {
        console.log(`Processing ${current} of ${total}`);
      }
    }
  );

  const handleProcess = async () => {
    const items = getData(); // Your data source
    await process(items);
  };

  return (
    <div>
      <button onClick={handleProcess} disabled={state.isProcessing}>
        Process Items
      </button>
      {state.isProcessing && (
        <div>
          Progress: {state.completed}/{state.total}
          <button onClick={abort}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

### 3. Rate-Limited API Calls

```typescript
import { createRateLimitedProcessor } from '@/lib/utils/task-chunker';

// Create a rate-limited API processor
const rateLimitedAPI = createRateLimitedProcessor(
  async (data) => {
    return await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  {
    maxPerSecond: 5,  // Max 5 requests per second
    burstSize: 10     // Allow bursts up to 10 requests
  }
);

// Use with chunker
const chunker = new TaskChunker();
chunker.addTasks(dataArray);
await chunker.processAll(rateLimitedAPI);
```

### 4. Service Repair with Phases

```typescript
import { ServiceRepairManager, RepairPlan } from '@/lib/utils/service-repair';

// Create repair manager
const repairManager = new ServiceRepairManager({
  maxConcurrentRepairs: 2,
  repairBatchSize: 5,
  delayBetweenRepairs: 500,
  autoFixOnly: false,
  dryRun: true // Test mode first
});

// Scan for issues
const issues = await repairManager.scanForIssues(['src']);

// Create and execute repair plan
const repairPlan = new RepairPlan(issues);
await repairPlan.execute(repairManager, (phase, results) => {
  console.log(`Phase ${phase} completed:`, results);
});
```

### 5. CLI Usage

```typescript
import { RepairCLI } from '@/lib/utils/repair-cli';

// Create CLI instance
const cli = new RepairCLI({
  targetDirs: ['src'],
  excludeDirs: ['node_modules', 'dist'],
  filePatterns: ['**/*.ts', '**/*.tsx'],
  maxFileSize: 5, // Skip files larger than 5MB
  outputReport: true
});

// Run repairs
await cli.run({
  dryRun: true,      // Test first
  autoFixOnly: false // Fix all issues
});
```

## Configuration Options

### TaskChunker Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxChunkSize | number | 10 | Items per chunk |
| delayBetweenChunks | number | 100 | Milliseconds between chunks |
| maxConcurrent | number | 3 | Max concurrent operations |
| retryAttempts | number | 3 | Retry failed operations |
| progressCallback | function | - | Progress update callback |

### Repair Manager Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxConcurrentRepairs | number | 3 | Concurrent repair operations |
| repairBatchSize | number | 5 | Repairs per batch |
| delayBetweenRepairs | number | 200 | ms between repairs |
| autoFixOnly | boolean | false | Only auto-fixable issues |
| severityFilter | array | ['error', 'warning'] | Issue severities to process |
| dryRun | boolean | false | Test mode without changes |

## Best Practices

1. **Start Small**: Begin with small chunk sizes and increase gradually
2. **Monitor Progress**: Always implement progress callbacks
3. **Test First**: Use dry run mode before actual operations
4. **Handle Errors**: Implement proper error handling for failed chunks
5. **Respect Limits**: Set appropriate rate limits for external APIs
6. **Abort Support**: Provide users with cancel functionality
7. **Memory Management**: Clear completed tasks to free memory

## Troubleshooting

### Common Issues

1. **Still Getting Overload Errors**
   - Reduce `maxChunkSize` and `maxConcurrent`
   - Increase `delayBetweenChunks`
   - Filter out large files

2. **Slow Performance**
   - Increase `maxChunkSize` if system can handle it
   - Reduce `delayBetweenChunks` carefully
   - Use batch processing for small items

3. **Memory Issues**
   - Process in smaller batches
   - Clear results after processing
   - Use streaming for large files

4. **API Rate Limits**
   - Use `createRateLimitedProcessor`
   - Reduce `maxPerSecond`
   - Implement proper backoff

## Example: Complete Implementation

```typescript
// services/chunked-processor.ts
import { TaskChunker, createRateLimitedProcessor } from '@/lib/utils/task-chunker';

export class ChunkedProcessor {
  private chunker: TaskChunker<any>;

  constructor() {
    this.chunker = new TaskChunker({
      maxChunkSize: 5,
      maxConcurrent: 2,
      delayBetweenChunks: 300,
      retryAttempts: 3
    });
  }

  async processLargeDataset(data: any[], processor: (item: any) => Promise<any>) {
    // Add progress tracking
    this.chunker = new TaskChunker({
      ...this.chunker['options'],
      progressCallback: (current, total) => {
        const percentage = Math.round((current / total) * 100);
        console.log(`Progress: ${percentage}% (${current}/${total})`);
      }
    });

    // Rate limit if needed
    const rateLimited = createRateLimitedProcessor(processor, {
      maxPerSecond: 10,
      burstSize: 15
    });

    // Process data
    this.chunker.addTasks(data);
    const { results, errors } = await this.chunker.processAll(rateLimited);

    // Handle results
    if (errors.length > 0) {
      console.error(`Failed to process ${errors.length} items:`, errors);
    }

    return { results, errors };
  }
}
```

## Conclusion

The task chunking system provides a robust solution for preventing overload errors. By breaking down large operations into manageable chunks, implementing proper rate limiting, and providing progress tracking, you can handle large-scale operations reliably and efficiently.
