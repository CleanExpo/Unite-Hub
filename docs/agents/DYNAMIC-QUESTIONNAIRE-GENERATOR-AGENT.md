# DYNAMIC QUESTIONNAIRE GENERATOR AGENT SPECIFICATION

**Agent Name**: Dynamic Questionnaire Generator Agent
**Agent Type**: Tier 3 - Questionnaire & Strategy Agent
**Priority**: P2 - Important
**Status**: Active Development
**Version**: 1.0.0
**Last Updated**: 2025-11-18

---

## 1. AGENT OVERVIEW

### Primary Database Tables
- `dynamic_questionnaires` - Questionnaire metadata (NEW - create this)
- `questionnaire_responses` - User responses (NEW - create this)
- Knowledge gap data from Gap Analysis Agent (read-only)
- Comprehensive intelligence (read-only)

### Agent Purpose
Generates contextual, personalized questionnaires based on knowledge gaps, references specific client mentions, and adapts questions based on previous answers. Fills intelligence gaps efficiently.

---

## 2. CORE FUNCTIONS

### 2.1 generateQuestionnaire()
**Purpose**: Generate contextual questionnaire from knowledge gaps.

**Input**:
```typescript
interface GenerateQuestionnaireRequest {
  contact_id: string;
  workspace_id: string;
  gaps: Gap[];
  max_questions?: number; // Default: 10
}
```

**Output**:
```typescript
interface GenerateQuestionnaireResult {
  success: boolean;
  questionnaire_id: string;
  questionnaire: {
    title: string;
    description: string;
    questions: Question[];
    estimated_time_minutes: number;
  };
}

interface Question {
  id: string;
  category: string;
  question: string;
  question_type: 'text' | 'multiple_choice' | 'scale' | 'yes_no';
  options?: string[];
  importance: 'critical' | 'important' | 'nice-to-know';
  reasoning: string; // Why we're asking
  context_reference?: string; // "In your email from Aug 12..."
}
```

**Business Logic**:
1. **Fetch comprehensive intelligence**: Get client history
2. **Build Claude prompt**:
   ```typescript
   const prompt = `Generate a personalized questionnaire for this client.

   CLIENT CONTEXT:
   - Name: ${contact.name}
   - Company: ${contact.company}
   - Relationship Stage: ${intelligence.relationship_stage}
   - Previous Communications: ${emailCount} emails, ${callCount} calls

   KNOWLEDGE GAPS TO ADDRESS:
   ${gaps.map(g => `- ${g.category}: ${g.text} (${g.importance})`).join('\n')}

   THINGS CLIENT HAS MENTIONED:
   ${intelligence.all_ideas.map(i => i.text).join('\n')}

   GENERATE ${maxQuestions} QUESTIONS:
   1. Reference specific things they mentioned (e.g., "In your email from Aug 12, you mentioned wanting to increase awareness by 50%...")
   2. Ask about critical gaps first (budget, timeline, decision makers)
   3. Make questions conversational and contextual
   4. Explain WHY you're asking each question
   5. Mix question types (text, multiple choice, scale)

   Return as JSON array of Question objects.`;
   ```
3. **Call Claude API**: Generate questions
4. **Create questionnaire**: INSERT into dynamic_questionnaires
5. **Store questions**: Save questions in questionnaire
6. **Return questionnaire**: Return generated questionnaire

**Example Questions**:
```json
[
  {
    "question": "In your email from August 12, you mentioned wanting to increase brand awareness by 50% in Q4. What budget have you allocated for this campaign?",
    "question_type": "text",
    "importance": "critical",
    "reasoning": "Budget is essential for creating an accurate proposal and campaign plan",
    "context_reference": "Email from Aug 12: 'increase brand awareness by 50%'"
  },
  {
    "question": "You mentioned launching in Q4. What's your ideal timeline? When would you like to kick off the campaign?",
    "question_type": "multiple_choice",
    "options": ["Immediately (within 2 weeks)", "1 month", "2 months", "Q4 2025"],
    "importance": "critical",
    "reasoning": "Timeline determines resource allocation and campaign planning",
    "context_reference": "Call from Sept 5: 'Q4 launch'"
  }
]
```

**Performance**: < 8 seconds (Claude API call)

---

### 2.2 sendQuestionnaire()
**Purpose**: Send questionnaire to client via email.

**Input**:
```typescript
interface SendQuestionnaireRequest {
  questionnaire_id: string;
  contact_id: string;
  email_template?: 'professional' | 'casual'; // Default: 'professional'
}
```

**Output**:
```typescript
interface SendQuestionnaireResult {
  success: boolean;
  email_sent: boolean;
  questionnaire_url: string;
  error?: string;
}
```

**Business Logic**:
1. **Generate questionnaire URL**: Create unique link (e.g., /questionnaire/{uuid})
2. **Build email content**:
   ```
   Subject: Quick questions about your ${project_name} project

   Hi ${client_name},

   Thanks for all the great information you've shared about ${project_description}.

   To help us create the perfect strategy for your Q4 campaign, I've put together
   a quick questionnaire (should take about ${estimated_time} minutes).

   The questions are based on our conversations - I've referenced specific things
   you mentioned so they're directly relevant to your goals.

   [Complete Questionnaire] → ${questionnaire_url}

   Looking forward to your responses!

   Best,
   ${team_member_name}
   ```
3. **Send email**: Call Email Agent's sendEmail()
4. **Update questionnaire status**: Set status='sent'
5. **Return result**: Return questionnaire URL

---

### 2.3 recordResponse()
**Purpose**: Record client's answer to a question.

**Input**:
```typescript
interface RecordResponseRequest {
  questionnaire_id: string;
  question_id: string;
  answer: string | string[] | number;
}
```

**Output**:
```typescript
interface RecordResponseResult {
  success: boolean;
  response_id: string;
  next_question?: Question; // Adaptive questioning
}
```

**Business Logic**:
1. **Validate answer**: Check answer type matches question type
2. **Store response**: INSERT into questionnaire_responses
3. **Check for adaptive questions**:
   ```typescript
   // If budget answer is "Under $10k", skip high-budget questions
   if (question.id === 'budget' && answer === 'Under $10k') {
     skipQuestions(['premium_package', 'enterprise_features']);
   }
   ```
4. **Return next question**: Return next unanswered question

---

### 2.4 checkCompletion()
**Purpose**: Check if questionnaire is complete.

**Output**:
```typescript
interface CompletionStatus {
  is_complete: boolean;
  answered: number;
  total: number;
  unanswered_critical: string[];
}
```

---

## 3. API ENDPOINTS

### POST /api/questionnaires/generate
**Request**:
```json
{
  "contact_id": "660e8400-e29b-41d4-a716-446655440000",
  "workspace_id": "770e8400-e29b-41d4-a716-446655440000",
  "gaps": [...],
  "max_questions": 10
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "questionnaire_id": "cc0e8400-e29b-41d4-a716-446655440000",
  "questionnaire": {
    "title": "Quick Questions About Your Q4 Campaign",
    "description": "Help us create the perfect strategy",
    "questions": [10 contextual questions],
    "estimated_time_minutes": 8
  }
}
```

### POST /api/questionnaires/:id/send
**Response**:
```json
{
  "success": true,
  "email_sent": true,
  "questionnaire_url": "https://unite-hub.com/q/cc0e8400-e29b-41d4-a716-446655440000"
}
```

### POST /api/questionnaires/:id/responses
**Request**:
```json
{
  "question_id": "q1",
  "answer": "$50,000 - $75,000"
}
```

**Response**:
```json
{
  "success": true,
  "response_id": "dd0e8400-e29b-41d4-a716-446655440000",
  "next_question": {
    "id": "q2",
    "question": "Great! With that budget, when would you like to kick off?"
  }
}
```

---

## 4. DATABASE SCHEMA

### dynamic_questionnaires Table (CREATE THIS)
```sql
CREATE TABLE dynamic_questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'in_progress', 'completed')),
  created_from TEXT DEFAULT 'ai_analysis',
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questionnaires_contact ON dynamic_questionnaires(contact_id);
CREATE INDEX idx_questionnaires_status ON dynamic_questionnaires(status);
```

### questionnaire_responses Table (CREATE THIS)
```sql
CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID REFERENCES dynamic_questionnaires(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  answer TEXT,
  answer_data JSONB,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_questionnaire ON questionnaire_responses(questionnaire_id);
```

---

## 5. BUSINESS RULES

### Question Generation Rules
1. **Critical questions first**: Budget, Timeline, Decision Makers
2. **Reference client history**: "In your email from..." builds trust
3. **Explain reasoning**: "We're asking because..." shows value
4. **Conversational tone**: Sound human, not robotic
5. **Adaptive questioning**: Skip irrelevant questions based on answers

### Question Types
- **Text**: Open-ended (budget amount, timeline description)
- **Multiple Choice**: Predefined options (timeline options, package selection)
- **Scale**: 1-10 rating (priority, urgency)
- **Yes/No**: Binary decisions (existing marketing, team availability)

---

## 6. ERROR CODES

| Code | Description |
|------|-------------|
| QUEST_001 | Contact not found |
| QUEST_002 | No gaps to address |
| QUEST_003 | Question generation failed |
| QUEST_004 | Questionnaire not found |
| QUEST_005 | Invalid answer type |

---

## 7. FUTURE ENHANCEMENTS

### Phase 2
1. **Multi-language questionnaires**: Auto-translate to client's language
2. **Video responses**: Allow clients to record video answers
3. **Smart skip logic**: Complex branching based on multiple answers
4. **Anonymous questionnaires**: Collect feedback without requiring login

---

**END OF DYNAMIC QUESTIONNAIRE GENERATOR AGENT SPECIFICATION**
