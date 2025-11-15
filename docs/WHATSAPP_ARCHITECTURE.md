# WhatsApp Integration - System Architecture

Visual diagrams of the WhatsApp Business integration architecture.

## High-Level Architecture

```mermaid
graph TB
    User[Customer WhatsApp] -->|Sends Message| Meta[WhatsApp Cloud API]
    Meta -->|Webhook Event| Webhook[/api/webhooks/whatsapp]

    Webhook -->|Store| DB[(Supabase PostgreSQL)]
    Webhook -->|Trigger| AI[Claude AI Processing]

    AI -->|Analysis| DB
    AI -->|Update| Contacts[Contact Intelligence]

    Contacts -->|Update Score| DB
    Contacts -->|Add Tags| DB

    DB -->|Query| UI[WhatsApp Dashboard UI]
    UI -->|Display| UserBrowser[User Browser]

    UserBrowser -->|Send Reply| SendAPI[/api/whatsapp/send]
    SendAPI -->|Request| Meta
    SendAPI -->|Store| DB

    Meta -->|Deliver| User

    style Meta fill:#25D366
    style AI fill:#8B5CF6
    style DB fill:#3ECF8E
    style UI fill:#3B82F6
```

## Data Flow - Incoming Message

```mermaid
sequenceDiagram
    participant Customer
    participant WhatsApp as WhatsApp Cloud API
    participant Webhook as Webhook Endpoint
    participant DB as Database
    participant AI as Claude AI
    participant Contact as Contact Intelligence
    participant UI as Dashboard UI

    Customer->>WhatsApp: Sends WhatsApp message
    WhatsApp->>Webhook: POST webhook event

    Webhook->>Webhook: Verify signature
    Webhook->>DB: Store webhook log
    Webhook->>DB: Store message
    Webhook->>DB: Create/update conversation
    Webhook->>WhatsApp: Mark as read
    Webhook-->>WhatsApp: Return 200 OK

    Note over Webhook,AI: Async Processing
    Webhook->>AI: Analyze message
    AI->>AI: Extract sentiment
    AI->>AI: Detect intent
    AI->>AI: Generate summary
    AI->>AI: Suggest response
    AI->>DB: Update message with AI data

    AI->>Contact: Update intelligence
    Contact->>Contact: Calculate new score
    Contact->>Contact: Suggest tags
    Contact->>DB: Update contact

    UI->>DB: Poll for new messages
    DB->>UI: Return messages with AI insights
    UI->>Customer: Display in dashboard
```

## Data Flow - Outgoing Message

```mermaid
sequenceDiagram
    participant User
    participant UI as Dashboard UI
    participant API as Send API
    participant Service as WhatsApp Service
    participant WhatsApp as WhatsApp Cloud API
    participant DB as Database
    participant Customer

    User->>UI: Types message and clicks Send
    UI->>API: POST /api/whatsapp/send

    API->>API: Validate request
    API->>Service: sendTextMessage()
    Service->>WhatsApp: POST /messages
    WhatsApp-->>Service: Message ID
    Service-->>API: Success

    API->>DB: Store message (outbound)
    API->>DB: Update conversation
    API->>DB: Log to audit
    API-->>UI: Success response

    UI->>UI: Optimistic update
    UI->>User: Show sent message

    WhatsApp->>Customer: Deliver message

    Note over WhatsApp,DB: Status Updates
    WhatsApp->>API: Webhook: delivered
    API->>DB: Update status

    Customer->>WhatsApp: Reads message
    WhatsApp->>API: Webhook: read
    API->>DB: Update status

    UI->>DB: Poll for updates
    DB->>UI: Message status
    UI->>User: Show read receipt ✓✓
```

## Database Schema Relationships

```mermaid
erDiagram
    workspaces ||--o{ whatsapp_conversations : has
    workspaces ||--o{ whatsapp_messages : has
    workspaces ||--o{ whatsapp_templates : has
    workspaces ||--o{ whatsapp_webhooks : logs

    contacts ||--o{ whatsapp_messages : receives
    contacts ||--o{ whatsapp_conversations : participates

    whatsapp_conversations ||--o{ whatsapp_messages : contains

    users ||--o{ whatsapp_conversations : assigned_to

    whatsapp_conversations {
        uuid id PK
        uuid workspace_id FK
        uuid contact_id FK
        uuid assigned_to FK
        text phone_number
        text status
        timestamp last_message_at
        int unread_count
    }

    whatsapp_messages {
        uuid id PK
        uuid workspace_id FK
        uuid contact_id FK
        text phone_number
        text direction
        text message_type
        text content
        text status
        text ai_summary
        text sentiment
        text intent
    }

    whatsapp_templates {
        uuid id PK
        uuid workspace_id FK
        text template_name
        text category
        text language
        text body_content
        text status
    }

    whatsapp_webhooks {
        uuid id PK
        uuid workspace_id FK
        text event_type
        jsonb payload
        boolean processed
    }
```

## AI Processing Pipeline

```mermaid
graph LR
    Input[Incoming Message] --> Extract[Extract Context]
    Extract --> History[Get Conversation History]
    History --> Claude[Claude AI Analysis]

    Claude --> Sentiment[Sentiment Analysis]
    Claude --> Intent[Intent Recognition]
    Claude --> Summary[Summarization]
    Claude --> Response[Response Generation]
    Claude --> Priority[Priority Detection]

    Sentiment --> Update[Update Message]
    Intent --> Update
    Summary --> Update
    Response --> Update
    Priority --> Update

    Update --> CheckConv{3+ Messages?}
    CheckConv -->|Yes| ConvAnalysis[Analyze Conversation]
    CheckConv -->|No| Done[Done]

    ConvAnalysis --> Score[Update AI Score]
    ConvAnalysis --> Tags[Add Tags]
    ConvAnalysis --> Status[Update Status]
    ConvAnalysis --> Tasks[Create Tasks]

    Score --> Done
    Tags --> Done
    Status --> Done
    Tasks --> Done

    style Claude fill:#8B5CF6
    style Update fill:#3ECF8E
    style Done fill:#10B981
```

## Component Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        Page[WhatsApp Page<br/>dashboard/messages/whatsapp]
        Chat[WhatsAppChat Component]
        UI[shadcn/ui Components]
    end

    subgraph "API Layer"
        Webhook[Webhook Endpoint]
        SendAPI[Send API]
        ConvAPI[Conversations API]
        MsgAPI[Messages API]
        TmplAPI[Templates API]
    end

    subgraph "Service Layer"
        WhatsAppSvc[WhatsApp Service<br/>Meta Cloud API Client]
        AISvc[AI Intelligence<br/>Claude Integration]
    end

    subgraph "Data Layer"
        DB[Database Methods]
        Supabase[(Supabase PostgreSQL)]
    end

    Page --> Chat
    Chat --> UI
    Page --> ConvAPI
    Chat --> MsgAPI
    Chat --> SendAPI

    SendAPI --> WhatsAppSvc
    Webhook --> WhatsAppSvc
    Webhook --> AISvc
    SendAPI --> DB
    ConvAPI --> DB
    MsgAPI --> DB
    TmplAPI --> DB

    AISvc --> DB
    DB --> Supabase

    style Page fill:#3B82F6
    style Chat fill:#3B82F6
    style WhatsAppSvc fill:#25D366
    style AISvc fill:#8B5CF6
    style Supabase fill:#3ECF8E
```

## Security Architecture

```mermaid
graph TB
    Request[Incoming Request] --> HTTPS{HTTPS?}
    HTTPS -->|No| Reject[Reject Request]
    HTTPS -->|Yes| Webhook{Webhook?}

    Webhook -->|Yes| Verify[Verify Signature]
    Webhook -->|No| Auth[Check Authentication]

    Verify -->|Invalid| Reject
    Verify -->|Valid| Process[Process Webhook]

    Auth -->|Fail| Reject
    Auth -->|Pass| RLS[Check RLS Policy]

    RLS -->|Deny| Reject
    RLS -->|Allow| Workspace{Workspace Access?}

    Workspace -->|No| Reject
    Workspace -->|Yes| Sanitize[Sanitize Input]

    Sanitize --> Validate[Validate Data]
    Validate -->|Invalid| Reject
    Validate -->|Valid| Execute[Execute Request]

    Process --> Store[Store in Database]
    Execute --> Store

    Store --> Audit[Log to Audit]
    Audit --> Success[Return Success]

    style HTTPS fill:#10B981
    style Verify fill:#3B82F6
    style Auth fill:#8B5CF6
    style RLS fill:#F59E0B
    style Reject fill:#EF4444
    style Success fill:#10B981
```

## Message State Machine

```mermaid
stateDiagram-v2
    [*] --> Queued: User sends message
    Queued --> Sent: WhatsApp accepts
    Sent --> Delivered: Customer receives
    Delivered --> Read: Customer opens

    Queued --> Failed: WhatsApp rejects
    Sent --> Failed: Delivery fails

    Read --> [*]
    Failed --> [*]

    note right of Sent
        Status webhook:
        sent
    end note

    note right of Delivered
        Status webhook:
        delivered
    end note

    note right of Read
        Status webhook:
        read
    end note
```

## Conversation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Open: First message received
    Open --> Open: Messages exchanged
    Open --> Archived: User archives
    Open --> Blocked: User blocks contact

    Archived --> Open: User reopens
    Archived --> [*]: Deleted

    Blocked --> Open: User unblocks
    Blocked --> [*]: Deleted

    note right of Open
        Active conversation
        Unread count tracked
        AI processing enabled
    end note

    note right of Archived
        Inactive conversation
        No notifications
        Searchable
    end note

    note right of Blocked
        No incoming messages
        No AI processing
        Contact flagged
    end note
```

## Template Approval Flow

```mermaid
graph LR
    Create[Create Template] --> Pending[Status: Pending]
    Pending --> Submit[Submit to Meta]
    Submit --> Review[Meta Review]

    Review -->|Approved| Approved[Status: Approved]
    Review -->|Rejected| Rejected[Status: Rejected]

    Approved --> Use[Available for Use]
    Rejected --> Edit[Edit Template]
    Edit --> Pending

    Use --> Track[Track Usage Count]
    Track --> Analytics[Usage Analytics]

    style Create fill:#3B82F6
    style Approved fill:#10B981
    style Rejected fill:#EF4444
    style Use fill:#8B5CF6
```

## Scalability Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX / Vercel Edge]
    end

    subgraph "Application Servers"
        App1[Next.js Instance 1]
        App2[Next.js Instance 2]
        App3[Next.js Instance N]
    end

    subgraph "Processing Queue"
        Queue[Message Queue<br/>Redis / Bull]
        Worker1[AI Worker 1]
        Worker2[AI Worker 2]
    end

    subgraph "Database"
        Primary[(Supabase Primary)]
        Replica[(Read Replica)]
    end

    subgraph "Cache Layer"
        Cache[Redis Cache<br/>Conversations<br/>Templates]
    end

    subgraph "External Services"
        WhatsApp[WhatsApp Cloud API]
        Claude[Claude AI API]
    end

    LB --> App1
    LB --> App2
    LB --> App3

    App1 --> Cache
    App2 --> Cache
    App3 --> Cache

    App1 --> Queue
    App2 --> Queue
    App3 --> Queue

    Queue --> Worker1
    Queue --> Worker2

    Worker1 --> Claude
    Worker2 --> Claude

    App1 --> Primary
    App1 --> Replica
    Worker1 --> Primary

    App1 --> WhatsApp
    WhatsApp --> App1

    style LB fill:#3B82F6
    style Queue fill:#F59E0B
    style Primary fill:#10B981
    style Cache fill:#8B5CF6
```

## Monitoring & Observability

```mermaid
graph TB
    subgraph "Application"
        App[WhatsApp Integration]
    end

    subgraph "Metrics"
        Metrics[Message Rate<br/>Response Time<br/>AI Processing Time<br/>Error Rate]
    end

    subgraph "Logs"
        Logs[Webhook Events<br/>AI Analysis<br/>Errors<br/>Audit Trail]
    end

    subgraph "Traces"
        Traces[Request Spans<br/>Database Queries<br/>External API Calls]
    end

    subgraph "Alerts"
        Alerts[Error Threshold<br/>Response Time SLA<br/>Queue Depth<br/>AI Failures]
    end

    App --> Metrics
    App --> Logs
    App --> Traces

    Metrics --> Alerts
    Logs --> Alerts
    Traces --> Alerts

    style App fill:#3B82F6
    style Metrics fill:#10B981
    style Logs fill:#F59E0B
    style Traces fill:#8B5CF6
    style Alerts fill:#EF4444
```

---

## Diagram Usage

These diagrams can be:
- Viewed in GitHub (auto-renders Mermaid)
- Exported to PNG/SVG using Mermaid Live Editor
- Included in presentations
- Used for onboarding new developers
- Updated as architecture evolves

## Tools

- **Mermaid Live Editor**: https://mermaid.live/
- **GitHub**: Native Mermaid support in markdown
- **VS Code**: Markdown Preview Mermaid extension
- **Export**: Use Mermaid CLI or online tools

---

**Last Updated**: 2025-11-15
