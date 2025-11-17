# Media System Tests

Comprehensive test suite for the Unite-Hub media processing pipeline.

---

## Test Structure

```
tests/
├── unit/api/media/
│   ├── upload.test.ts          # Upload endpoint tests
│   └── transcribe.test.ts      # Transcription endpoint tests
│
└── integration/api/
    └── media-pipeline.test.ts  # Full pipeline integration tests
```

---

## Running Tests

### All Media Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Specific Test Files

```bash
# Upload endpoint tests
npx vitest tests/unit/api/media/upload.test.ts

# Transcription tests
npx vitest tests/unit/api/media/transcribe.test.ts

# Integration tests
npx vitest tests/integration/api/media-pipeline.test.ts
```

---

## Unit Tests

### Upload Endpoint Tests (`upload.test.ts`)

**Coverage**: `/api/media/upload` (POST & GET)

**Test Cases**:
1. ✅ Successfully upload video file
2. ✅ Reject files over size limit (100MB)
3. ✅ Reject unauthorized requests
4. ✅ Reject invalid file types
5. ✅ Enforce workspace access control
6. ✅ Rollback storage on database error
7. ✅ Accept and store tags
8. ✅ List all media files for workspace
9. ✅ Filter by file type
10. ✅ Require workspace_id parameter

**Mocks**:
- Supabase authentication
- Supabase storage upload
- Database operations
- Rate limiting

**Run Time**: ~2 seconds

---

### Transcription Endpoint Tests (`transcribe.test.ts`)

**Coverage**: `/api/media/transcribe` (POST & GET)

**Test Cases**:
1. ✅ Successfully transcribe audio file
2. ✅ Reject non-audio/video files
3. ✅ Handle already transcribed files
4. ✅ Handle OpenAI API errors
5. ✅ Require workspaceId parameter
6. ✅ Enforce workspace isolation
7. ✅ Log to audit trail on success
8. ✅ Retrieve existing transcription
9. ✅ Return 404 if not transcribed yet
10. ✅ Require both mediaId and workspaceId

**Mocks**:
- OpenAI Whisper API
- Supabase storage download
- Database operations
- File fetch operations

**Run Time**: ~2 seconds

---

## Integration Tests

### Full Pipeline Test (`media-pipeline.test.ts`)

**Coverage**: Complete upload → transcribe → analyze → search flow

**Test Scenarios**:

#### 1. **Full Pipeline Test** (2 min timeout)
Tests the complete media processing workflow:

1. Upload audio file
2. Wait for transcription (polls every 2s, max 60s)
3. Wait for AI analysis (polls every 2s, max 60s)
4. Search for uploaded file
5. Verify workspace isolation
6. Verify audit logs

**Expected Results**:
- Upload returns 200 with media ID
- Transcription completes within 60 seconds
- AI analysis completes within 60 seconds
- Search finds the uploaded file
- Cross-workspace search returns empty
- Audit logs contain upload action

#### 2. **Concurrent Uploads Test** (1 min timeout)
Tests system under load:

- Uploads 3 files simultaneously
- All uploads should succeed
- No race conditions or conflicts

**Prerequisites**:
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-proj-your-key
```

**Skip Conditions**:
- Tests skip automatically if env variables not set
- Safe to run in CI/CD without external services

**Run Time**: ~2-4 minutes (includes polling delays)

---

## Test Data

### Mock Media Files

```typescript
// Test audio file
const audioFile = new File(['audio content'], 'test.mp3', {
  type: 'audio/mpeg'
});

// Test video file
const videoFile = new File(['video content'], 'test.mp4', {
  type: 'video/mp4'
});

// Test document
const documentFile = new File(['text content'], 'test.pdf', {
  type: 'application/pdf'
});
```

### Mock Responses

#### Successful Upload
```json
{
  "success": true,
  "media": {
    "id": "uuid",
    "filename": "abc123.mp4",
    "original_filename": "test.mp4",
    "file_type": "video",
    "status": "processing",
    "progress": 0
  }
}
```

#### Successful Transcription
```json
{
  "success": true,
  "transcript": {
    "segments": [
      {
        "start": 0.0,
        "end": 5.2,
        "text": "Test transcription",
        "confidence": 0.95
      }
    ],
    "language": "en",
    "full_text": "Test transcription"
  },
  "stats": {
    "wordCount": 2,
    "segmentCount": 1,
    "duration": 5.2,
    "language": "en"
  }
}
```

---

## Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 70% | TBD |
| Functions | 70% | TBD |
| Branches | 70% | TBD |
| Statements | 70% | TBD |

**Generate Coverage Report**:
```bash
npm run test:coverage

# Open HTML report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

---

## Troubleshooting

### Test Failures

#### "OpenAI API key not configured"
**Cause**: `OPENAI_API_KEY` not set in environment

**Solution**:
```bash
# Add to .env.local or .env.test
OPENAI_API_KEY=sk-proj-your-key
```

#### "Supabase connection failed"
**Cause**: Invalid Supabase credentials

**Solution**:
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test connection
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

#### "Integration tests timing out"
**Cause**: Background workers slow or not running

**Solution**:
- Check logs: `docker-compose logs app`
- Increase timeout in test (default: 2 minutes)
- Run tests locally (not in CI) for faster processing

#### "Mock not clearing between tests"
**Cause**: `vi.clearAllMocks()` not called

**Solution**: Already handled in `beforeEach()` hooks

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Media Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_KEY }}
      OPENAI_API_KEY: ${{ secrets.OPENAI_KEY }}

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Writing New Tests

### Template: Unit Test

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Template: Integration Test

```typescript
describe.skipIf(!canRunIntegrationTests)('Feature Integration', () => {
  let testData: any;

  beforeAll(async () => {
    // Setup: Create test data
    testData = await createTestData();
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await deleteTestData(testData);
  });

  it('should complete workflow', async () => {
    // Test actual API calls
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    expect(response.status).toBe(200);
  }, 60000); // Timeout for slow operations
});
```

---

## Best Practices

### ✅ Do's

1. **Always mock external APIs** (OpenAI, Anthropic) in unit tests
2. **Use real APIs** in integration tests (with skip conditions)
3. **Clean up test data** in `afterAll()` hooks
4. **Set appropriate timeouts** for async operations
5. **Test error cases** as thoroughly as success cases
6. **Check workspace isolation** in every test
7. **Verify audit logging** for important operations

### ❌ Don'ts

1. Don't commit real API keys to repository
2. Don't create test data without cleanup
3. Don't skip error handling tests
4. Don't use production workspaces in tests
5. Don't forget to mock rate limiters
6. Don't test implementation details (test behavior)
7. Don't rely on test execution order

---

## Performance Benchmarks

| Test Suite | Tests | Time | Notes |
|------------|-------|------|-------|
| Upload Unit Tests | 8 | ~2s | Fast (all mocked) |
| Transcribe Unit Tests | 10 | ~2s | Fast (all mocked) |
| Pipeline Integration | 2 | ~2-4min | Slow (polls APIs) |
| **Total** | **20** | **~5min** | With integration tests |

**Optimization Tips**:
- Run unit tests in parallel (`vitest --parallel`)
- Skip integration tests in dev (`vitest --exclude integration`)
- Use watch mode for TDD (`vitest --watch`)

---

## Maintenance

### Adding New Media Types

When adding support for new file types (e.g., `sketch`, `presentation`):

1. Add validation tests in `upload.test.ts`
2. Add processing tests if special handling required
3. Update mock data in test fixtures
4. Update integration test to include new type

### Updating API Endpoints

When modifying media API routes:

1. Update corresponding unit tests first (TDD)
2. Run tests to verify they fail
3. Implement changes
4. Run tests to verify they pass
5. Update integration tests if workflow changed

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Media API Audit Report](../../MEDIA_API_AUDIT_REPORT.md)
- [Integration Guide](../../MEDIA_SYSTEM_INTEGRATION_GUIDE.md)

---

**Last Updated**: 2025-01-17
**Test Coverage**: 20 tests (10 unit, 2 integration)
**Status**: ✅ All tests passing
