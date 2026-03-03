# Agent PRD System Architecture

## Overview

The **Agent PRD System** is an AI-powered requirements analysis and product specification generator that transforms high-level user requirements into comprehensive, actionable Product Requirement Documents (PRDs).

**Purpose**: Eliminate manual PRD writing, reduce planning time from days to minutes, and ensure consistent, comprehensive product specifications.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT                                │
│  "Build a chat app like Claude with streaming responses"    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              PRD ANALYSIS AGENT (Claude Opus)                │
│  - Parse requirements                                         │
│  - Identify stakeholders                                      │
│  - Extract constraints                                        │
│  - Determine scope                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            STRUCTURED PRD GENERATOR                          │
│  Sections:                                                    │
│  1. Executive Summary                                         │
│  2. Problem Statement                                         │
│  3. Target Users                                              │
│  4. Success Metrics                                           │
│  5. Functional Requirements                                   │
│  6. Non-Functional Requirements                               │
│  7. Constraints & Assumptions                                 │
│  8. Out of Scope                                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         FEATURE DECOMPOSITION ENGINE                         │
│  - Break down into epics                                      │
│  - Generate user stories                                      │
│  - Create acceptance criteria                                 │
│  - Identify dependencies                                      │
│  - Assign priorities (Critical/High/Medium/Low)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│       TECHNICAL SPECIFICATION GENERATOR                      │
│  - System architecture                                        │
│  - Database schema                                            │
│  - API endpoints                                              │
│  - Third-party integrations                                   │
│  - Security requirements                                      │
│  - Performance requirements                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           TEST SCENARIO GENERATOR                            │
│  - Unit test scenarios                                        │
│  - Integration test scenarios                                 │
│  - E2E test scenarios                                         │
│  - Edge cases                                                 │
│  - Error handling tests                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│        IMPLEMENTATION ROADMAP PLANNER                        │
│  - Sprint breakdown (2-week sprints)                          │
│  - Feature prioritization                                     │
│  - Dependency graph                                           │
│  - Estimated effort                                           │
│  - Risk assessment                                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  OUTPUT FILES                                 │
│  📄 prd.md           - Complete PRD document                  │
│  📄 user_stories.md  - All user stories                       │
│  📄 feature_list.json - Structured features (for agents)      │
│  📄 tech_spec.md     - Technical specifications               │
│  📄 test_plan.md     - Test scenarios                         │
│  📄 roadmap.md       - Implementation roadmap                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. PRDAnalysisAgent

**File**: `apps/backend/src/agents/prd/analysis_agent.py`

**Responsibilities**:
- Parse user requirements
- Extract key information (goals, users, constraints)
- Identify stakeholders
- Determine project scope
- Generate executive summary

**Input**:
```python
{
    "requirements": "Build a chat application...",
    "context": {
        "target_users": "Developers",
        "timeline": "3 months",
        "team_size": 2,
    }
}
```

**Output**:
```python
{
    "summary": "AI-powered chat application...",
    "problem_statement": "Users need...",
    "target_users": ["Developers", "Product Managers"],
    "success_metrics": ["Active users", "Response time"],
    "constraints": ["Budget: $10k", "Timeline: 3 months"],
    "assumptions": ["Users have modern browsers"],
}
```

---

### 2. FeatureDecompositionEngine

**File**: `apps/backend/src/agents/prd/feature_decomposer.py`

**Responsibilities**:
- Break requirements into epics
- Generate user stories
- Create acceptance criteria
- Identify dependencies
- Assign priorities

**User Story Format**:
```
As a [user type],
I want to [action],
So that [benefit].

Acceptance Criteria:
- [ ] Given [precondition], when [action], then [outcome]
- [ ] Given [precondition], when [action], then [outcome]

Priority: Critical
Estimated Effort: 3 story points
Dependencies: [feature-id-1, feature-id-2]
```

**Output**:
```json
{
  "epics": [
    {
      "id": "epic-auth",
      "name": "User Authentication",
      "description": "Complete user auth system",
      "features": ["user-login", "user-signup", "password-reset"]
    }
  ],
  "features": [
    {
      "id": "user-login",
      "epic_id": "epic-auth",
      "priority": "critical",
      "user_story": "As a user, I want to...",
      "acceptance_criteria": [...],
      "technical_notes": "Use Supabase Auth",
      "estimated_effort": 5,
      "dependencies": []
    }
  ]
}
```

---

### 3. TechnicalSpecGenerator

**File**: `apps/backend/src/agents/prd/tech_spec_generator.py`

**Responsibilities**:
- Generate system architecture
- Define database schema
- Specify API endpoints
- List third-party integrations
- Define security requirements
- Set performance requirements

**Output**:
```markdown
# Technical Specification

## System Architecture
- Frontend: Next.js 15 + React 19
- Backend: FastAPI + LangGraph
- Database: PostgreSQL (Supabase)
- Real-time: Supabase Realtime
- Hosting: Vercel (frontend) + Railway (backend)

## Database Schema

### users table
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| email | TEXT | UNIQUE, NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

## API Endpoints

### POST /api/auth/login
**Request**:
```json
{
  "email": "user@example.com",
  "password": "secure123"
}
```

**Response**:
```json
{
  "user": {...},
  "session": {...}
}
```

## Performance Requirements
- API response time: < 200ms (p95)
- Page load time: < 2s
- Concurrent users: 1000+

## Security Requirements
- HTTPS only
- JWT authentication
- CSRF protection
- Rate limiting: 100 req/min per IP
```

---

### 4. TestScenarioGenerator

**File**: `apps/backend/src/agents/prd/test_generator.py`

**Responsibilities**:
- Generate unit test scenarios
- Create integration test cases
- Define E2E test flows
- Identify edge cases
- Plan error handling tests

**Output**:
```markdown
# Test Plan

## Unit Tests

### UserAuthService
- `test_valid_login_returns_session`
- `test_invalid_password_throws_error`
- `test_nonexistent_email_throws_error`
- `test_expired_session_refreshes`

## Integration Tests

### Auth Flow
1. User signs up with valid email
2. Verification email sent
3. User clicks verification link
4. Account activated
5. User can log in

## E2E Tests

### Happy Path: New User Journey
1. Navigate to signup page
2. Enter email and password
3. Verify email received
4. Click verification link
5. Login with credentials
6. Access dashboard
7. Logout

### Edge Cases
- Signup with existing email
- Login with unverified account
- Password reset for non-existent email
- Session expiry during usage
```

---

### 5. RoadmapPlanner

**File**: `apps/backend/src/agents/prd/roadmap_planner.py`

**Responsibilities**:
- Create sprint breakdown
- Prioritize features
- Build dependency graph
- Estimate effort
- Identify risks

**Output**:
```markdown
# Implementation Roadmap

## Sprint 1 (2 weeks) - MVP Foundation
**Goal**: Basic auth + database setup

### Features
- [Critical] User signup (3 days)
- [Critical] User login (2 days)
- [Critical] Database schema (1 day)
- [High] Password reset (2 days)

**Deliverable**: Users can sign up and log in
**Risk**: Auth integration complexity (Medium)

## Sprint 2 (2 weeks) - Core Functionality
**Goal**: Main features working

### Features
- [Critical] Chat interface (3 days)
- [Critical] Message sending (2 days)
- [Critical] Real-time updates (2 days)
- [Medium] Chat history (1 day)

**Deliverable**: Working chat functionality
**Risk**: Real-time performance (High)

## Dependency Graph

```
user-signup → user-login → chat-interface
                          ↓
                    message-sending → real-time-updates
```

## Estimated Timeline: 6 weeks (3 sprints)
## Total Effort: ~180 story points
## Team Size Recommended: 2-3 developers
```

---

## File Structure

```
apps/backend/src/agents/prd/
├── __init__.py
├── analysis_agent.py        # PRD analysis
├── feature_decomposer.py    # Feature breakdown
├── tech_spec_generator.py   # Technical specs
├── test_generator.py        # Test scenarios
├── roadmap_planner.py       # Implementation planning
├── prd_orchestrator.py      # Main orchestrator
├── templates/               # PRD templates
│   ├── prd_template.md
│   ├── user_story_template.md
│   ├── tech_spec_template.md
│   └── test_plan_template.md
└── prompts/                 # LLM prompts
    ├── analysis_prompt.txt
    ├── feature_decomposition_prompt.txt
    ├── tech_spec_prompt.txt
    └── test_gen_prompt.txt
```

---

## API Endpoints

### POST /api/prd/generate
**Generate complete PRD from requirements**

**Request**:
```json
{
  "requirements": "Build a chat app with AI responses",
  "context": {
    "target_users": "Developers",
    "timeline": "3 months",
    "team_size": 2,
    "tech_stack": "Next.js + FastAPI"
  }
}
```

**Response**:
```json
{
  "prd_id": "prd_abc123",
  "status": "generating",
  "estimated_time": "30s"
}
```

### GET /api/prd/{prd_id}
**Get generated PRD**

**Response**:
```json
{
  "prd_id": "prd_abc123",
  "status": "completed",
  "files": {
    "prd": "https://.../prd.md",
    "user_stories": "https://.../user_stories.md",
    "feature_list": {...},
    "tech_spec": "https://.../tech_spec.md",
    "test_plan": "https://.../test_plan.md",
    "roadmap": "https://.../roadmap.md"
  },
  "summary": {
    "total_features": 24,
    "critical_features": 8,
    "estimated_timeline": "6 weeks",
    "estimated_effort": 180
  }
}
```

### POST /api/prd/{prd_id}/refine
**Refine PRD with additional context**

**Request**:
```json
{
  "refinements": "Add OAuth login with Google",
  "affected_features": ["user-login", "user-signup"]
}
```

---

## Frontend Components

### PRD Generator Page
**File**: `apps/web/app/prd/generate/page.tsx`

**Features**:
- Textarea for requirements input
- Context fields (users, timeline, team size)
- Real-time generation progress
- Preview of generated sections
- Download all documents
- Share PRD link

### PRD Viewer
**File**: `apps/web/app/prd/[id]/page.tsx`

**Features**:
- Tabbed interface (PRD, User Stories, Tech Spec, Tests, Roadmap)
- Markdown rendering
- Export to PDF
- Collaboration (comments, suggestions)
- Version history
- Edit and regenerate sections

---

## Database Schema

### prds table
```sql
CREATE TABLE prds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),

  -- Input
  requirements TEXT NOT NULL,
  context JSONB DEFAULT '{}',

  -- Generated content
  prd_document TEXT,
  user_stories JSONB,
  feature_list JSONB,
  tech_spec TEXT,
  test_plan TEXT,
  roadmap TEXT,

  -- Metadata
  status TEXT DEFAULT 'pending', -- pending, generating, completed, failed
  error TEXT,
  generation_time_seconds INT,

  -- Analytics
  total_features INT,
  critical_features INT,
  estimated_timeline_weeks INT,
  estimated_effort_points INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prds_user_id ON prds(user_id);
CREATE INDEX idx_prds_status ON prds(status);
```

---

## LLM Prompts

### Analysis Prompt
```
You are a senior product manager analyzing requirements.

User requirements:
{{requirements}}

Context:
- Target users: {{target_users}}
- Timeline: {{timeline}}
- Team size: {{team_size}}

Analyze and provide:
1. Executive summary (2-3 sentences)
2. Problem statement (what user pain are we solving?)
3. Target user personas (3-5 types)
4. Success metrics (quantifiable)
5. Key constraints and assumptions
6. Scope boundaries (what's in and out)

Format as structured JSON.
```

### Feature Decomposition Prompt
```
You are an expert at breaking down product requirements into user stories.

PRD Summary:
{{prd_summary}}

Generate comprehensive user stories following this format:
- As a [user type], I want to [action], so that [benefit]
- Acceptance criteria (Given-When-Then format)
- Priority (Critical/High/Medium/Low)
- Estimated effort (story points 1-13)
- Dependencies (other feature IDs)

Organize into epics. Ensure EVERY feature is testable and has clear acceptance criteria.
```

---

## Success Metrics

### Quality Metrics
- Generated PRDs should score >8/10 on completeness (human review)
- 90%+ of generated features should be actionable
- Technical specs should include all necessary endpoints/schemas

### Performance Metrics
- PRD generation time: <60 seconds
- Feature decomposition: <30 seconds
- Total end-to-end: <2 minutes

### Usage Metrics
- PRDs generated per month
- Average features per PRD
- Regeneration rate (indicates quality)
- User satisfaction (NPS score)

---

## Implementation Phases

### Phase 1: Core PRD Generation (Week 1)
- [x] PRDAnalysisAgent
- [x] FeatureDecomposer
- [x] Basic PRD document generation
- [x] API endpoints
- [x] Database schema

### Phase 2: Enhanced Specifications (Week 1)
- [x] TechnicalSpecGenerator
- [x] TestScenarioGenerator
- [x] RoadmapPlanner
- [x] Template system

### Phase 3: Frontend Interface (Week 2)
- [ ] PRD generator page
- [ ] PRD viewer
- [ ] Real-time generation tracking
- [ ] Export functionality

### Phase 4: Advanced Features (Week 2+)
- [ ] Iterative refinement
- [ ] Collaboration features
- [ ] Version history
- [ ] Templates for common app types

---

## Example Flow

### User Input:
```
"Build a SaaS app for project management with:
- Team collaboration
- Task tracking
- Time tracking
- Gantt charts
- Real-time updates
Target: Small businesses (10-50 employees)"
```

### Generated Output:

**1. PRD Document** (`prd.md`)
- Executive summary
- Problem statement
- Target users (3 personas)
- Success metrics
- 45 functional requirements
- 12 non-functional requirements

**2. User Stories** (`user_stories.md`)
- 5 epics
- 38 user stories
- Each with acceptance criteria
- Prioritized and estimated

**3. Feature List** (`feature_list.json`)
- 38 features in structured JSON
- Ready for InitializerAgent
- Dependencies mapped

**4. Technical Spec** (`tech_spec.md`)
- System architecture
- 12 database tables with schemas
- 24 API endpoints
- Performance requirements
- Security requirements

**5. Test Plan** (`test_plan.md`)
- 120 unit test scenarios
- 24 integration tests
- 8 E2E test flows
- Edge cases identified

**6. Roadmap** (`roadmap.md`)
- 6 sprints (12 weeks)
- Features per sprint
- Dependency graph
- Risk assessment

**Total generation time**: 45 seconds

---

## Integration with Existing Systems

### With InitializerAgent
```python
# After PRD generation, use feature_list.json
prd_result = await prd_orchestrator.generate(requirements)
features = prd_result["feature_list"]["features"]

# Pass to InitializerAgent
initializer = InitializerAgent()
await initializer.execute(
    task_description=requirements,
    context={
        "project_path": "./my-project",
        "project_name": "my-saas-app",
        "features": features,  # From PRD
    }
)
```

### With LongRunningAgentHarness
```python
# PRD → Features → Multi-session implementation
prd = await generate_prd("Build project management tool")
harness = LongRunningAgentHarness(
    project_path="./my-project",
    project_name="pm-tool",
    specification=prd["prd_document"],
)

# Features automatically loaded from feature_list.json
await harness.run_until_complete()
```

---

## Future Enhancements

1. **Multi-stakeholder Input**: Gather requirements from multiple stakeholders
2. **Market Research Integration**: Auto-fetch competitor analysis
3. **Cost Estimation**: Estimate development costs based on features
4. **Design Mockups**: Generate UI mockups from requirements
5. **Code Scaffolding**: Auto-generate boilerplate from tech spec
6. **Agile Board Integration**: Push user stories to Jira/Linear
7. **Smart Templates**: Pre-built PRDs for common app types (SaaS, e-commerce, etc.)

---

## Conclusion

The Agent PRD System transforms vague requirements into comprehensive, actionable specifications in under 2 minutes. This is the foundation that makes the entire startup stack truly AI-powered.

**Next**: Implement each component following the phased approach.
