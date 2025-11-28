# Synthex Auto-Action Engine

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2025-11-28

---

## Overview

The Synthex Auto-Action Engine is a computer-use automation system that combines:

- **Fara-7B** (based on Aria-UI): Computer-use model for action planning
- **Qwen2.5-VL**: Vision-language model for screen understanding and OCR
- **Critical Point Guard**: Safety system requiring human approval for sensitive actions
- **Sandbox Manager**: Rate limiting and constraint enforcement
- **Session Logger**: Comprehensive audit trail

The system automates repetitive browser-based tasks while maintaining strict safety boundaries.

---

## Architecture

```
                        ┌───────────────────────────────────────┐
                        │      Computer Use Orchestrator        │
                        │                                       │
                        │  ┌─────────┐        ┌─────────────┐  │
                        │  │ Fara-7B │◄──────►│ Qwen2.5-VL  │  │
                        │  │ Client  │        │   Client    │  │
                        │  └────┬────┘        └──────┬──────┘  │
                        │       │                    │         │
                        │       ▼                    ▼         │
                        │  ┌─────────────────────────────────┐ │
                        │  │     Critical Point Guard       │ │
                        │  │    (Safety Gate System)        │ │
                        │  └───────────────┬─────────────────┘ │
                        │                  │                   │
                        │       ┌──────────┴──────────┐       │
                        │       ▼                     ▼       │
                        │  ┌──────────┐        ┌───────────┐  │
                        │  │ Sandbox  │        │  Session  │  │
                        │  │ Manager  │        │  Logger   │  │
                        │  └──────────┘        └───────────┘  │
                        └───────────────────────────────────────┘
                                        │
                                        ▼
                            ┌─────────────────────┐
                            │  Browser Interface  │
                            │    (Playwright)     │
                            └─────────────────────┘
```

---

## Components

### 1. Fara-7B Client (`src/lib/autoAction/faraClient.ts`)

Action planning model that determines what to do next based on:
- Current screenshot
- Task description
- Previous actions taken
- Constraints

**Methods**:
- `determineAction()` - Single action determination
- `planActions()` - Multi-step action planning
- `verifyTaskCompletion()` - Check if task is done

### 2. Qwen2.5-VL Client (`src/lib/autoAction/qwenVisionClient.ts`)

Vision-language model for screen understanding:
- UI element detection
- Form field extraction
- OCR (Optical Character Recognition)
- Element location finding

**Methods**:
- `analyzeUI()` - Full screen analysis
- `detectElements()` - Find all UI elements
- `extractFormFields()` - Get form structure
- `performOCR()` - Text extraction
- `findElement()` - Locate specific element

### 3. Critical Point Guard (`src/lib/autoAction/criticalPointGuard.ts`)

Safety system that gates sensitive actions:

**Categories**:
- `financial_information` - Credit cards, bank accounts
- `identity_documents` - Passports, licenses, SSN
- `passwords_and_security_answers` - Credentials
- `final_submission_or_purchase` - Orders, payments
- `irreversible_changes` - Email/password changes
- `destructive_actions` - Account deletion

**Methods**:
- `detectCriticalPoint()` - Check if action is critical
- `createCriticalPoint()` - Register for approval
- `waitForApproval()` - Block until response
- `submitApproval()` - Human response

### 4. Sandbox Manager (`src/lib/autoAction/sandboxConfig.ts`)

Constraint enforcement:
- Maximum steps per session
- Rate limiting (actions per minute)
- Session timeouts
- Allowed origins
- Blocked action types

### 5. Session Logger (`src/lib/autoAction/sessionLogger.ts`)

Comprehensive audit trail:
- Session start/end
- Actions planned/executed
- Critical points detected
- Approvals received
- Errors and violations

---

## Configuration

### Environment Variables

```env
# Enable the engine
AUTO_ACTION_ENABLED=true

# Fara-7B Configuration
FARA7B_PROVIDER=local|foundry|huggingface|openrouter|custom
FARA7B_ENDPOINT=http://localhost:8080/v1
FARA7B_API_KEY=your-api-key
FARA7B_DEVICE_MODE=cpu|gpu|mps|remote
FARA7B_MODEL_ID=rhymes-ai/Aria-UI
FARA7B_MAX_TOKENS=4096
FARA7B_TEMPERATURE=0.1

# Qwen2.5-VL Configuration
QWEN_VL_PROVIDER=huggingface
QWEN_VL_ENDPOINT=https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-7B-Instruct
QWEN_VL_API_KEY=your-api-key
QWEN_VL_MODEL_ID=Qwen/Qwen2.5-VL-7B-Instruct
QWEN_VL_MAX_TOKENS=2048

# Sandbox Settings
AUTO_ACTION_MAX_STEPS=50
AUTO_ACTION_STEP_TIMEOUT=30000
AUTO_ACTION_SESSION_TIMEOUT=600000
AUTO_ACTION_RATE_LIMIT=30
AUTO_ACTION_SESSIONS_PER_HOUR=10
AUTO_ACTION_ALLOWED_ORIGINS=localhost,synthex.social,unite-hub.com

# Critical Point Settings
CRITICAL_POINT_TIMEOUT=300000

# Logging
AUTO_ACTION_LOG_LEVEL=info
AUTO_ACTION_INCLUDE_SCREENSHOTS=false
AUTO_ACTION_LOG_RETENTION_DAYS=30

# Feature Flags
AUTO_ACTION_CLIENT_ONBOARDING=true
AUTO_ACTION_STAFF_ONBOARDING=true
AUTO_ACTION_CRM_AUTOFILL=true
AUTO_ACTION_DOCUMENT_UPLOAD=true
```

---

## Pre-defined Flows

### Client Onboarding (`client_onboarding_standard`)

Automates client registration:
1. Navigate to onboarding form
2. Fill contact details (name, email, phone)
3. Add company information
4. Select industry
5. Review and submit

### Staff Onboarding (`staff_onboarding_standard`)

Automates staff member setup:
1. Navigate to HR form
2. Fill personal information
3. Set role and department
4. Assign manager
5. Set start date
6. Review and submit

### CRM Contact Auto-fill (`crm_contact_autofill`)

Populates CRM records:
1. Navigate to contact form
2. Fill contact details
3. Save record

### CRM Deal Auto-fill (`crm_deal_autofill`)

Creates deal records:
1. Navigate to deal form
2. Fill deal title and value
3. Select pipeline stage
4. Link contact
5. Save deal

---

## API Endpoints

### Session Management

```
POST /api/auto-action/session
```
Start a new auto-action session.

**Request**:
```json
{
  "flowId": "client_onboarding_standard",
  "workspaceId": "workspace-uuid",
  "data": {
    "clientName": "John Doe",
    "clientEmail": "john@example.com"
  }
}
```

**Response**:
```json
{
  "success": true,
  "task": {
    "id": "task_123",
    "type": "client_onboarding",
    "name": "Client Onboarding - Standard"
  }
}
```

```
GET /api/auto-action/session
```
Get current session status.

```
DELETE /api/auto-action/session
```
Stop the current session.

### Approval Management

```
POST /api/auto-action/approve
```
Submit approval for a critical point.

**Request**:
```json
{
  "criticalPointId": "cp_123",
  "approved": true,
  "note": "Verified by manager"
}
```

```
GET /api/auto-action/approve
```
Get pending approvals.

### Logs

```
GET /api/auto-action/logs
```
Get session logs with filtering.

**Query Parameters**:
- `sessionId` - Specific session
- `workspaceId` - Filter by workspace
- `flowType` - Filter by flow type
- `startDate` / `endDate` - Date range
- `includeEntries` - Include log entries

---

## Frontend Pages

### Client Onboarding Assistant
**Path**: `/client/onboarding-assistant`

Features:
- Start/pause/stop controls
- Real-time progress tracking
- Action log viewer
- Critical point approval interface

### Staff Onboarding Assistant
**Path**: `/staff/onboarding-assistant`

Features:
- Flow type selector (standard/CRM)
- Progress statistics
- Step checklist
- Recent activity

---

## UI Components

### StatusBadge
Displays session status with appropriate styling.

```tsx
<StatusBadge status="running" />
<StatusBadge status="waiting_approval" showDot={true} />
```

### CriticalPointBanner
Shows approval request with countdown timer.

```tsx
<CriticalPointBanner
  criticalPoint={criticalPoint}
  onApprove={handleApprove}
  onReject={handleReject}
  timeoutSeconds={300}
/>
```

### ActionLogViewer
Scrollable log of session actions.

```tsx
<ActionLogViewer
  entries={logEntries}
  maxHeight={400}
  autoScroll={true}
/>
```

### OnboardingAssistantPanel
Main control panel for the assistant.

```tsx
<OnboardingAssistantPanel
  flowType="client"
  workspaceId={workspaceId}
  onSessionStart={() => {}}
  onSessionEnd={() => {}}
/>
```

---

## Safety Mechanisms

### 1. Critical Point Detection

Automatically detects sensitive actions:
- Pattern matching on page content
- Form label analysis
- Button text inference

### 2. Approval Workflow

1. Critical point detected
2. Session pauses
3. User notified
4. Countdown timer starts (5 minutes default)
5. User approves or rejects
6. Session resumes or action skipped

### 3. Sandbox Constraints

- **Max Steps**: 50 per session
- **Rate Limit**: 30 actions/minute
- **Session Timeout**: 10 minutes
- **Blocked Actions**: deleteAccount, formatDisk, etc.

### 4. Origin Restrictions

Only allowed domains can be automated:
- localhost
- synthex.social
- unite-hub.com

### 5. Audit Trail

All actions logged with:
- Timestamp
- Action type
- Success/failure
- Screenshots (optional)
- Error details

---

## Integration with Orchestrator

The Auto-Action Engine integrates with the main orchestrator router:

```typescript
// Orchestrator detects auto-action intent
const { intent } = classifyIntent("Help me auto-fill the client onboarding form");
// intent = 'auto_action'

// Generates plan with auto-action steps
const plan = await generatePlan(request);
// steps: [prepare_session, validate_flow, execute_flow]

// Executes through the auto-action executor
const result = await orchestrate(request);
```

**Intent Patterns**:
- "automate", "auto-fill", "computer use"
- "onboard", "onboarding", "form fill"
- "browser", "click", "type", "scroll"
- "CRM auto-fill", "contact populate"

---

## File Structure

```
config/
└── autoAction.config.ts          # Central configuration

src/lib/autoAction/
├── index.ts                      # Main exports
├── faraClient.ts                 # Fara-7B client
├── qwenVisionClient.ts           # Qwen2.5-VL client
├── criticalPointGuard.ts         # Safety system
├── sandboxConfig.ts              # Sandbox manager
├── sessionLogger.ts              # Audit logging
├── computerUseOrchestrator.ts    # Main orchestrator
├── onboardingFlows.ts            # Flow templates
└── README.md                     # Module docs

src/app/api/auto-action/
├── session/route.ts              # Session API
├── approve/route.ts              # Approval API
└── logs/route.ts                 # Logs API

src/app/(client)/client/
└── onboarding-assistant/page.tsx # Client page

src/app/(staff)/staff/
└── onboarding-assistant/page.tsx # Staff page

src/components/auto-action/
├── index.ts                      # Component exports
├── StatusBadge.tsx               # Status indicator
├── CriticalPointBanner.tsx       # Approval UI
├── ActionLogViewer.tsx           # Log display
└── OnboardingAssistantPanel.tsx  # Main panel

docs/agentic/
├── SYNTHEX_AUTO_ACTION_ENGINE.md # This file
├── FARA7B_QWEN_INTEGRATION.md    # Model integration
├── ONBOARDING_AUTOMATION_FLOWS.md # Flow details
└── AUTO_ACTION_SAFETY_AND_SANDBOXING.md # Safety docs
```

---

## Best Practices

### 1. Always Start with Validation

```typescript
const validation = validateFlowData(flow, data);
if (!validation.valid) {
  console.error('Missing:', validation.missingFields);
  return;
}
```

### 2. Handle Critical Points Gracefully

```typescript
orchestrator.initialize(browser, {
  onCriticalPoint: (cp) => {
    showApprovalDialog(cp);
  },
});
```

### 3. Monitor Session Progress

```typescript
orchestrator.initialize(browser, {
  onProgress: (progress) => {
    updateProgressBar(progress.progress);
  },
});
```

### 4. Log Errors for Debugging

```typescript
orchestrator.initialize(browser, {
  onError: (error) => {
    logError('Auto-action error', error);
  },
});
```

---

## Troubleshooting

### "Auto-action engine is not configured"

Ensure `AUTO_ACTION_ENABLED=true` and model endpoints are set.

### "Origin not allowed"

Add the domain to `AUTO_ACTION_ALLOWED_ORIGINS`.

### "Rate limit exceeded"

Wait for the rate limit window to reset or increase the limit.

### "Critical point timeout"

User didn't respond in time. Increase `CRITICAL_POINT_TIMEOUT`.

### "Session timeout"

Task took too long. Increase `AUTO_ACTION_SESSION_TIMEOUT`.

---

## Security Considerations

1. **API Keys**: Never expose model API keys in frontend code
2. **Critical Points**: Always require approval for sensitive actions
3. **Audit Trail**: Maintain logs for compliance
4. **Rate Limiting**: Prevent abuse with strict limits
5. **Origin Control**: Only automate trusted domains

---

## Future Enhancements

- [ ] WebSocket for real-time updates
- [ ] Multi-browser support (Firefox, Safari)
- [ ] Recording/playback for custom flows
- [ ] Machine learning for action prediction
- [ ] Integration with more LLM providers
