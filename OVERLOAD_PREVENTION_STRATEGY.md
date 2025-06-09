# Context Window Overload Prevention Strategy

## Problem Analysis - SOLVED
- **Error**: `too many total text bytes: 14080919 > 9000000`
- **Root Cause**: 25,198 TypeScript files totaling 109.21MB
- **Trigger**: Operations processing multiple TS files simultaneously

## File Size Analysis
- ✅ **Markdown files**: 224 files, 1.16MB (Safe)
- ✅ **SQL files**: 12 files, 0.11MB (Safe)  
- ⚠️ **TypeScript files**: 25,198 files, 109.21MB (DANGER ZONE)

## Immediate Solution: Micro-Task Workflow

### Rule #1: File Limitation
- **Maximum 3-5 files** open simultaneously
- **Single component focus** only
- **Avoid batch operations** on multiple TypeScript files

### Rule #2: Close Unnecessary Tabs
**Current Problem: 34 open tabs**
**Solution: Keep only 5 essential tabs:**
1. Current working component
2. Related API route
3. Specific test file
4. This strategy guide
5. One reference file (if needed)

### Rule #3: Targeted Operations
**AVOID:** Operations that scan/process multiple directories
**USE:** Specific file targeting with exact paths

## Safe Task Patterns

### ✅ SAFE: Single Component Focus
```
OPEN FILES (3):
- src/components/crm/clients/AddClientModal.tsx
- src/app/api/crm/clients/route.ts  
- tests/feature-tests/client-modal-test.ts

GOAL: Complete client modal functionality
TIME: 20 minutes max
```

### ✅ SAFE: Single API Endpoint
```
OPEN FILES (2):
- src/app/api/crm/tasks/route.ts
- tests/feature-tests/tasks-api-test.ts

GOAL: Complete tasks API endpoint
TIME: 15 minutes max
```

### ⚠️ RISKY: Multiple Components
```
AVOID: Opening 5+ component files simultaneously
AVOID: Batch processing across directories
AVOID: Comprehensive test suites with many files
```

### 🚫 DANGEROUS: Large Operations
```
NEVER: Process entire src/ directory
NEVER: Batch operations on 10+ files
NEVER: Recursive directory scanning
NEVER: Comprehensive codebase analysis
```

## Emergency Protocol

If overload error occurs:
1. **STOP** immediately
2. **CLOSE** all tabs except 2-3 essential files
3. **SELECT** one micro-task from approved list
4. **FOCUS** on single objective
5. **TEST** before expanding scope

## Approved Micro-Tasks (Choose ONE)

### Task A: Client Modal (20 min)
- Files: AddClientModal.tsx + clients/route.ts + test
- Goal: Working client creation
- Validation: Create test client successfully

### Task B: Deal Pipeline (25 min)  
- Files: DealPipelineBoard.tsx + deals/route.ts + test
- Goal: Working deal management
- Validation: Move deals between stages

### Task C: Task Management (20 min)
- Files: TaskManagementBoard.tsx + tasks/route.ts + test  
- Goal: Working task system
- Validation: Create and complete tasks

### Task D: Invoice System (25 min)
- Files: InvoiceListPage.tsx + invoices/route.ts + test
- Goal: Working invoice management
- Validation: Generate test invoice

## Success Metrics
- Zero context overload errors
- Consistent task completion within time limits
- Clear progress tracking
- Maintained development velocity

## Implementation NOW
1. **Close 29 of 34 open tabs** (keep only 5)
2. **Select ONE micro-task** from approved list
3. **Set 20-minute timer**
4. **Focus completely** on selected task
5. **Test and validate** before moving on

This approach ensures you stay well under the 9MB limit while maintaining productivity.
