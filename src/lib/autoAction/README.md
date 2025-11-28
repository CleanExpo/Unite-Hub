# Synthex Auto-Action Engine

Computer-use automation system powered by **Fara-7B** and **Qwen2.5-VL** for automated form filling, onboarding flows, and CRM operations.

## Overview

The Auto-Action Engine enables intelligent automation of repetitive browser-based tasks with built-in safety mechanisms:

- **Fara-7B**: Computer-use model for action planning (click, type, scroll, navigate)
- **Qwen2.5-VL**: Vision-language model for screen understanding and OCR
- **Critical Point Guard**: Safety gates for sensitive actions requiring human approval
- **Sandbox Manager**: Rate limiting, origin restrictions, and constraint enforcement
- **Session Logger**: Comprehensive audit trail for compliance and debugging

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Computer Use Orchestrator                     │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Fara-7B    │  │ Qwen2.5-VL  │  │   Critical Point Guard  │  │
│  │  (Actions)  │  │  (Vision)   │  │      (Safety Gates)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │    Sandbox Manager      │  │      Session Logger         │  │
│  │  (Constraints/Limits)   │  │     (Audit Trail)           │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Browser Interface│
                    │   (Playwright)   │
                    └─────────────────┘
```

## Quick Start

### 1. Configuration

Set environment variables:

```env
# Enable the engine
AUTO_ACTION_ENABLED=true

# Fara-7B (Computer-Use Model)
FARA7B_PROVIDER=local|foundry|huggingface|openrouter|custom
FARA7B_ENDPOINT=http://localhost:8080/v1
FARA7B_API_KEY=your-api-key
FARA7B_DEVICE_MODE=cpu|gpu|mps|remote

# Qwen2.5-VL (Vision Model)
QWEN_VL_PROVIDER=huggingface
QWEN_VL_ENDPOINT=https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-7B-Instruct
QWEN_VL_API_KEY=your-api-key

# Sandbox Settings
AUTO_ACTION_MAX_STEPS=50
AUTO_ACTION_RATE_LIMIT=30
AUTO_ACTION_ALLOWED_ORIGINS=localhost,synthex.social,unite-hub.com
```

### 2. Basic Usage

```typescript
import {
  getComputerUseOrchestrator,
  clientOnboardingFlow,
  flowToTask,
  validateFlowData
} from '@/lib/autoAction';

// Get orchestrator instance
const orchestrator = getComputerUseOrchestrator();

// Initialize with browser interface
orchestrator.initialize(browser, {
  onProgress: (progress) => console.log(`Progress: ${progress.progress}%`),
  onCriticalPoint: (cp) => console.log(`Approval needed: ${cp.description}`),
  onComplete: (result) => console.log(`Task completed: ${result.success}`),
});

// Validate data for flow
const data = {
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  clientCompany: 'ACME Corp',
};

const validation = validateFlowData(clientOnboardingFlow, data);
if (!validation.valid) {
  console.error('Missing fields:', validation.missingFields);
  return;
}

// Convert flow to task
const task = flowToTask(clientOnboardingFlow, data);

// Execute task
const result = await orchestrator.executeTask(task, userId, workspaceId);
console.log(`Completed ${result.stepsCompleted} steps in ${result.duration}ms`);
```

## Core Components

### Fara-7B Client

Determines the next action based on screen state:

```typescript
import { getFaraClient } from '@/lib/autoAction';

const fara = getFaraClient();

const response = await fara.determineAction({
  screenshot: base64Screenshot,
  task: 'Fill in the contact form with the provided data',
  context: 'User is on the new contact page',
  previousActions: [],
});

if (response.success && response.action) {
  console.log(`Next action: ${response.action.type}`);
  console.log(`Target: ${response.action.target}`);
  console.log(`Confidence: ${response.action.confidence}`);
}
```

### Qwen2.5-VL Client

Analyzes screenshots for UI understanding:

```typescript
import { getQwenVisionClient } from '@/lib/autoAction';

const qwen = getQwenVisionClient();

// Analyze UI structure
const analysis = await qwen.analyzeUI(screenshot);
console.log(`Page type: ${analysis.analysis?.pageType}`);

// Detect form fields
const forms = await qwen.extractFormFields(screenshot);
forms.forms?.forEach(field => {
  console.log(`Field: ${field.name} (${field.type})`);
});

// Find specific element
const element = await qwen.findElement(screenshot, 'Submit button');
if (element.targetLocation) {
  console.log(`Found at: ${element.targetLocation.x}, ${element.targetLocation.y}`);
}
```

### Critical Point Guard

Manages safety approvals:

```typescript
import { getCriticalPointGuard } from '@/lib/autoAction';

const guard = getCriticalPointGuard();

// Check if action is critical
const detection = guard.detectCriticalPoint(action, pageContent);

if (detection.isCritical) {
  console.log(`Critical: ${detection.category} (${detection.risk} risk)`);

  // Create approval request
  const cp = await guard.createCriticalPoint(sessionId, action, context, detection);

  // Wait for human approval
  const approval = await guard.waitForApproval(cp.id);

  if (!approval.approved) {
    console.log('Action rejected');
    return;
  }
}
```

### Sandbox Manager

Enforces execution constraints:

```typescript
import { getSandboxManager } from '@/lib/autoAction';

const sandbox = getSandboxManager();

// Create session
const session = sandbox.createSession(sessionId, userId);

// Validate before each action
const validation = sandbox.validateAction(sessionId, 'click', currentUrl);

if (!validation.allowed) {
  console.log(`Blocked: ${validation.violation?.message}`);
  return;
}

// Record action
sandbox.recordAction(sessionId);

// End session
sandbox.endSession(sessionId);
```

## Pre-defined Flows

### Client Onboarding
- Fill contact details
- Company information
- Industry selection
- Submit with approval gate

### Staff Onboarding
- Personal information
- Role and department
- Manager assignment
- Start date
- Submit with approval gate

### CRM Auto-fill
- Contact creation
- Deal creation
- Activity logging

## Critical Point Categories

Actions requiring human approval:

1. **Financial Information** - Credit cards, bank accounts, payment
2. **Identity Documents** - Passports, licenses, SSN
3. **Passwords & Security** - Passwords, 2FA, security questions
4. **Final Submissions** - Order placement, purchases, agreements
5. **Irreversible Changes** - Email changes, ownership transfers
6. **Destructive Actions** - Account deletion, data erasure

## Sandbox Constraints

Default limits (configurable via env):

- **Max Steps**: 50 actions per session
- **Rate Limit**: 30 actions per minute
- **Session Timeout**: 10 minutes
- **Approval Timeout**: 5 minutes

## API Endpoints

```
POST /api/auto-action/session      # Start new session
POST /api/auto-action/approve      # Submit approval
GET  /api/auto-action/logs         # Get session logs
GET  /api/auto-action/logs/:id     # Get specific session log
```

## Security Considerations

1. **Blocked Actions**: Certain dangerous actions are always blocked:
   - `deleteAccount`
   - `formatDisk`
   - `installSoftware`
   - `modifySystemSettings`
   - `accessTerminal`
   - `runShellCommands`

2. **Origin Restrictions**: Only allowed domains can be automated

3. **Rate Limiting**: Prevents runaway automation

4. **Audit Logging**: All actions are logged for compliance

5. **Timeout Protection**: Sessions auto-terminate after inactivity

## File Structure

```
src/lib/autoAction/
├── index.ts                    # Main exports
├── faraClient.ts              # Fara-7B computer-use client
├── qwenVisionClient.ts        # Qwen2.5-VL vision client
├── criticalPointGuard.ts      # Safety approval system
├── sandboxConfig.ts           # Constraint enforcement
├── sessionLogger.ts           # Audit trail logging
├── computerUseOrchestrator.ts # Main orchestrator
├── onboardingFlows.ts         # Pre-defined flow templates
└── README.md                  # This file
```

## Testing

```bash
# Run auto-action tests
npm run test:auto-action

# Test specific component
npm run test -- --grep "CriticalPointGuard"
```

## Troubleshooting

### "Auto-action engine is disabled"
Set `AUTO_ACTION_ENABLED=true` in environment

### "Origin not allowed"
Add the domain to `AUTO_ACTION_ALLOWED_ORIGINS`

### "Rate limit exceeded"
Increase `AUTO_ACTION_RATE_LIMIT` or wait for cooldown

### "Approval timeout"
Increase `CRITICAL_POINT_TIMEOUT` (default 5 minutes)

## License

Internal use only. Part of the Synthex platform.
