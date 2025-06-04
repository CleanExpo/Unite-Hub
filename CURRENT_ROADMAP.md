# AUTONOMOUS EXECUTION DIRECTIVE
This roadmap represents ONE COMPLETE TASK.
Do NOT stop or ask for permission between subtasks.
Execute ALL tasks continuously until 100% complete.

# CLINE Roadmap Execution Framework

## Ultimate Comprehensive Command

```
Please proceed with the roadmap implementation in D:\Unite Group using these permanent instructions:

EXECUTION RULES:
- Use ; instead of && for all command chaining (Windows compatibility)
- No permission requests between roadmap tasks
- Auto-apply fixes for known issues (ESLint, Redis, cookies, dependencies)
- Reference active roadmap: ACTIVE_ROADMAP.md
- Update progress markers automatically

TECHNICAL STANDARDS:
- Follow DEVELOPMENT_STANDARDS.md strictly
- Apply service abstraction patterns for all external connections
- Ensure build-time safety for all implementations
- Lock all dependency versions (no ^ or ~)

WORKFLOW:
1. Read current roadmap status
2. Identify next uncompleted task
3. Implement with full error handling
4. Validate implementation
5. Update progress
6. Move to next task
7. Repeat until roadmap complete

Begin execution from current checkpoint.
```

## Enhanced Roadmap Structure Template

```markdown
# [PROJECT_NAME] Roadmap - Version [X.X]
Last Updated: [DATE]
Status: [Active/Complete/Paused]

## 🎯 Roadmap Overview
Brief description of what this roadmap accomplishes

## 📊 Progress Summary
- Total Tasks: 10
- Completed: 3 (30%)
- In Progress: 1 (10%)
- Remaining: 6 (60%)

## 🚦 Current Checkpoint
```yaml
Current Task: Task 4
Phase: Implementation
Started: 2025-01-06 11:30 AM
Last Activity: 2025-01-06 11:35 AM
Next Action: Implement service abstraction layer
```

## 📋 Task List

### ✅ Phase 1: Foundation Setup
- [x] Task 1: Lock all dependencies
  ```yaml
  Status: Complete
  Completed: 2025-01-06 10:00 AM
  Validation: npm run validate
  Output: All dependencies locked in package-lock.json
  ```

- [x] Task 2: Create DEVELOPMENT_STANDARDS.md
  ```yaml
  Status: Complete
  Completed: 2025-01-06 10:30 AM
  Validation: File exists and contains all sections
  Output: DEVELOPMENT_STANDARDS.md created
  ```

- [x] Task 3: Setup build validation scripts
  ```yaml
  Status: Complete
  Completed: 2025-01-06 11:00 AM
  Validation: npm run build:validate
  Commands: 
    - cd D:\Unite Group
    - npm run build:validate
  Output: Validation script working
  ```

### 🔄 Phase 2: Service Abstraction Layer
- [ ] Task 4: Create ServiceFactory base class
  ```yaml
  Status: In Progress
  Started: 2025-01-06 11:30 AM
  Dependencies: Task 3
  Files to Create:
    - src/lib/services/base/ServiceFactory.ts
    - src/lib/services/base/RuntimeService.ts
  Validation: npm run test:services
  Known Issues: None
  ```

- [ ] Task 5: Implement Redis service abstraction
  ```yaml
  Status: Not Started
  Dependencies: Task 4
  Files to Create:
    - src/lib/services/redis/RedisService.ts
    - src/lib/services/redis/index.ts
  Validation: Redis connection optional during build
  Known Issues: 
    - Redis ECONNREFUSED during build
    - Fix: Apply abstraction pattern from Task 4
  ```

## 🔧 Known Issues & Auto-Fixes

### ESLint Configuration Error
```yaml
Error: "ESLint: Invalid Options: - Unknown options: useEslintrc, extensions"
Auto-Fix: 
  - Remove useEslintrc from next.config.mjs
  - Update to flat config format
  - File: eslint.config.mjs
```

### Redis Connection Error
```yaml
Error: "Redis connection error: Error: connect ECONNREFUSED 127.0.0.1:6379"
Auto-Fix:
  - Implement lazy connection in RedisService
  - Make Redis optional during build
  - Pattern: src/lib/services/redis/RedisService.ts
```

### Cookie Context Error
```yaml
Error: "cookies was called outside a request scope"
Auto-Fix:
  - Wrap cookie access in runtime checks
  - Use dynamic imports for cookie-dependent modules
  - Pattern: Check if (typeof window === 'undefined')
```

## 🛠️ Command Patterns

### Windows PowerShell Commands
```powershell
# Build and validate
cd D:\Unite Group; npm run build:validate

# Run tests
cd D:\Unite Group; npm test

# Deploy
cd D:\Unite Group; npm run deploy
```

### Service Initialization Pattern
```typescript
// Always use this pattern for external services
export class ServiceName {
  private static instance: ServiceName | null = null;
  
  static async getInstance() {
    if (!this.instance && typeof window === 'undefined') {
      // Only initialize on server at runtime
      this.instance = new ServiceName();
    }
    return this.instance;
  }
}
```

## 📝 Implementation Notes

### Critical Rules
1. NEVER use && in commands - always use ;
2. NEVER access external services during build
3. NEVER use floating versions (^ or ~) in package.json
4. ALWAYS validate before committing

### Progress Tracking
After completing each task:
1. Mark task as complete with [x]
2. Update Status to "Complete"
3. Add completion timestamp
4. Document any deviations or issues
5. Update Progress Summary percentages

## 🚀 Deployment Checklist
- [ ] All tasks complete
- [ ] No build warnings
- [ ] All tests passing
- [ ] DEVELOPMENT_STANDARDS.md followed
- [ ] Production environment variables set
- [ ] Deployment validation passed

---
End of Roadmap
```

This updated version of CURRENT_ROADMAP.md now includes the autonomous execution directives at the top and maintains all the previously added content. The file has been updated successfully.

Now, I'll create the new AUTONOMOUS_EXECUTION_GUIDE.md:

<write_to_file>
<path>d:/Unite Group/AUTONOMOUS_EXECUTION_GUIDE.md</path>
<content>
# AUTONOMOUS EXECUTION FRAMEWORK

## Ultimate Comprehensive Command

```
@CLINE: Execute COMPLETE roadmap in D:\Unite Group with FULL AUTONOMY:

AUTONOMOUS EXECUTION MODE:
- Treat the entire roadmap as ONE SINGLE TASK
- NO attempt_completion until ALL tasks are done
- NO stopping between tasks
- NO asking for permission
- Update CURRENT_ROADMAP.md progress after each task
- Only use attempt_completion when 100% complete

CONTINUOUS WORKFLOW:
1. Read CURRENT_ROADMAP.md
2. Execute ALL uncompleted tasks sequentially
3. Update progress markers in the file
4. Continue until chain complete
5. ONLY THEN use attempt_completion

ERROR HANDLING:
- Auto-fix all known issues per the roadmap
- Log errors but continue execution
- Skip blocked tasks and continue with next

Execute NOW with full autonomy until roadmap complete.
```

## Key Improvements for Autonomous Execution

1. **Single Task Mode**
   - All tasks treated as part of one continuous process
   - No stopping between tasks
   - Automatic progress tracking within the roadmap

2. **Error Continuation**
   - Graceful error handling
   - Resume execution after partial failures
   - Only stop if all tasks are truly complete

3. **No Permission Requests**
   - Execute all tasks without user confirmation
   - Follow instructions from the roadmap file
   - Update progress markers automatically

4. **Roadmap Integration**
   - Update progress within the existing roadmap
   - No need for separate completion reports
   - Only use attempt_completion at the very end

This guide ensures that CLINE executes the entire roadmap autonomously without interruptions or permission requests.
