# Multi-Account Gmail Integration - Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "User Interface"
        UI[Settings/Integrations Page]
        ComposeUI[Email Compose UI]
    end

    subgraph "API Layer"
        ConnectAPI[POST /connect-multi]
        CallbackAPI[GET /callback-multi]
        ListAPI[GET /list]
        LabelAPI[POST /update-label]
        PrimaryAPI[POST /set-primary]
        SyncAPI[POST /sync-all]
        DisconnectAPI[POST /disconnect]
    end

    subgraph "Service Layer"
        GmailService[gmail-multi-account.ts]
        DBWrapper[db.ts]
    end

    subgraph "External Services"
        GoogleOAuth[Google OAuth 2.0]
        GmailAPI[Gmail API]
    end

    subgraph "Database - Supabase"
        EmailIntegrations[(email_integrations)]
        SentEmails[(sent_emails)]
        EmailOpens[(email_opens)]
        EmailClicks[(email_clicks)]
        Contacts[(contacts)]
        Emails[(emails)]
    end

    UI -->|Connect Account| ConnectAPI
    UI -->|Manage Accounts| ListAPI
    UI -->|Update Settings| LabelAPI
    UI -->|Update Settings| PrimaryAPI
    UI -->|Sync Emails| SyncAPI
    UI -->|Remove Account| DisconnectAPI

    ConnectAPI --> GmailService
    CallbackAPI --> GmailService
    ListAPI --> DBWrapper
    LabelAPI --> GmailService
    PrimaryAPI --> GmailService
    SyncAPI --> GmailService
    DisconnectAPI --> GmailService

    GmailService --> GoogleOAuth
    GmailService --> GmailAPI
    GmailService --> DBWrapper

    DBWrapper --> EmailIntegrations
    DBWrapper --> SentEmails
    DBWrapper --> EmailOpens
    DBWrapper --> EmailClicks
    DBWrapper --> Contacts
    DBWrapper --> Emails

    GoogleOAuth -->|Redirect with code| CallbackAPI
    ComposeUI -->|Send Email| GmailService
```

## Data Flow Diagrams

### OAuth Connection Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant Service
    participant Google
    participant DB

    User->>UI: Click "Connect Gmail"
    UI->>API: POST /connect-multi
    API->>Service: getGmailAuthUrl(state)
    Service->>API: OAuth URL
    API->>UI: { authUrl }
    UI->>Google: Redirect to OAuth (prompt=select_account)
    User->>Google: Select Google account
    Google->>API: Redirect with code & state
    API->>Service: handleGmailCallback(code, orgId, workspaceId)
    Service->>Google: Exchange code for tokens
    Google->>Service: { access_token, refresh_token }
    Service->>Google: Get Gmail profile
    Google->>Service: { emailAddress }
    Service->>DB: Check if email exists
    DB->>Service: existing integration or null
    alt Email already connected
        Service->>DB: Update tokens
    else New email
        Service->>DB: Create integration (is_primary if first)
    end
    Service->>API: integration
    API->>UI: Redirect to settings (success)
    UI->>User: Show success message
```

### Email Sync Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API
    participant Service
    participant Gmail
    participant DB

    User->>UI: Click "Sync All Accounts"
    UI->>API: POST /sync-all
    API->>Service: syncAllGmailAccounts(workspaceId)
    Service->>DB: Get all enabled integrations
    DB->>Service: integrations[]

    loop For each integration
        Service->>Service: Check if token expired
        alt Token expired
            Service->>Gmail: Refresh token
            Gmail->>Service: New access token
            Service->>DB: Update token
        end
        Service->>Gmail: List unread messages
        Gmail->>Service: messages[]
        loop For each message
            Service->>Gmail: Get full message
            Gmail->>Service: Message details
            Service->>DB: Check if contact exists
            alt Contact not found
                Service->>DB: Create contact
            end
            Service->>DB: Create email record
            Service->>Gmail: Mark as read
        end
        Service->>DB: Update last_sync_at
    end

    Service->>API: { totalImported, results }
    API->>UI: Sync results
    UI->>User: Show success (X emails imported)
```

### Send Email Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Service
    participant Gmail
    participant DB

    User->>UI: Compose email
    UI->>UI: Select sending account
    UI->>Service: sendEmailViaGmail(workspaceId, to, subject, body, { integrationId })

    alt Specific account requested
        Service->>DB: Get integration by ID
    else No account specified
        Service->>DB: Get primary account
    end

    DB->>Service: integration
    Service->>Service: Set OAuth credentials
    Service->>Gmail: Send message
    Gmail->>Service: { messageId, threadId }
    Service->>DB: Create sent_email record
    Service->>UI: { messageId, threadId, sentFrom }
    UI->>User: Email sent successfully
```

## Database Schema Diagram

```mermaid
erDiagram
    WORKSPACES ||--o{ EMAIL_INTEGRATIONS : "has many"
    ORGANIZATIONS ||--o{ EMAIL_INTEGRATIONS : "has many"
    EMAIL_INTEGRATIONS ||--o{ SENT_EMAILS : "sends via"
    EMAIL_INTEGRATIONS ||--o{ EMAILS : "receives via"
    WORKSPACES ||--o{ CONTACTS : "has many"
    CONTACTS ||--o{ SENT_EMAILS : "receives"
    CONTACTS ||--o{ EMAILS : "sends"
    SENT_EMAILS ||--o{ EMAIL_OPENS : "tracked by"
    SENT_EMAILS ||--o{ EMAIL_CLICKS : "tracked by"

    EMAIL_INTEGRATIONS {
        uuid id PK
        uuid workspace_id FK
        uuid org_id FK
        text provider
        text email_address
        text account_label
        boolean is_primary
        boolean sync_enabled
        boolean is_active
        text access_token
        text refresh_token
        timestamp token_expires_at
        timestamp last_sync_at
        text sync_error
    }

    SENT_EMAILS {
        uuid id PK
        uuid workspace_id FK
        uuid contact_id FK
        uuid integration_id FK
        text to_email
        text from_email
        text subject
        text body
        int opens
        int clicks
        timestamp first_open_at
        timestamp first_click_at
        text gmail_message_id
        text gmail_thread_id
    }

    EMAIL_OPENS {
        uuid id PK
        uuid sent_email_id FK
        text ip_address
        text user_agent
        text country
        text city
        timestamp opened_at
    }

    EMAIL_CLICKS {
        uuid id PK
        uuid sent_email_id FK
        text link_url
        text ip_address
        text user_agent
        text country
        text city
        timestamp clicked_at
    }

    EMAILS {
        uuid id PK
        uuid workspace_id FK
        uuid contact_id FK
        uuid integration_id FK
        text from_email
        text to_email
        text subject
        text body
        boolean is_processed
        timestamp received_at
    }

    CONTACTS {
        uuid id PK
        uuid workspace_id FK
        text name
        text email
        text company
        text job_title
        decimal ai_score
        text status
    }

    WORKSPACES {
        uuid id PK
        uuid org_id FK
        text name
    }

    ORGANIZATIONS {
        uuid id PK
        text name
        text plan
    }
```

## Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        IntegrationsPage[IntegrationsPage.tsx]
        AccountCard[Account Card]
        EditDialog[Edit Label Dialog]
        SyncButton[Sync All Button]
        ConnectButton[Connect Button]
    end

    subgraph "State Management"
        IntegrationsState[integrations[]]
        LoadingState[loading]
        EditingState[editingLabel]
    end

    subgraph "UI Actions"
        LoadAction[loadIntegrations]
        ConnectAction[connectGmail]
        SyncAction[syncAllAccounts]
        LabelAction[updateLabel]
        PrimaryAction[setPrimary]
        ToggleAction[toggleSync]
        DisconnectAction[disconnectAccount]
    end

    IntegrationsPage --> AccountCard
    IntegrationsPage --> EditDialog
    IntegrationsPage --> SyncButton
    IntegrationsPage --> ConnectButton

    AccountCard --> IntegrationsState
    EditDialog --> EditingState

    ConnectButton --> ConnectAction
    SyncButton --> SyncAction
    AccountCard --> LabelAction
    AccountCard --> PrimaryAction
    AccountCard --> ToggleAction
    AccountCard --> DisconnectAction

    LoadAction --> IntegrationsState
    SyncAction --> LoadingState
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        Auth[NextAuth Session]
        RLS[Row Level Security]
        TokenEncrypt[Token Encryption]
        WorkspaceIsolation[Workspace Isolation]
    end

    subgraph "API Routes"
        APIRoute[API Endpoints]
    end

    subgraph "Database"
        DB[(Supabase)]
    end

    subgraph "External"
        Google[Google OAuth]
    end

    User[User Request] --> Auth
    Auth -->|Authenticated| APIRoute
    Auth -->|Unauthorized| Reject[401 Unauthorized]

    APIRoute --> WorkspaceIsolation
    WorkspaceIsolation -->|Valid workspace| RLS
    WorkspaceIsolation -->|Invalid workspace| Reject2[403 Forbidden]

    RLS -->|Authorized| DB
    RLS -->|Unauthorized| Reject3[403 Forbidden]

    DB --> TokenEncrypt
    TokenEncrypt -->|Encrypted| Storage[(Storage)]

    Google -->|OAuth tokens| TokenEncrypt
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Loading: Component Mount
    Loading --> Empty: No accounts found
    Loading --> Loaded: Accounts found
    Loading --> Error: Load failed

    Empty --> Connecting: Click "Connect"
    Connecting --> OAuthFlow: Redirect to Google
    OAuthFlow --> Callback: User authorizes
    Callback --> Loading: Reload accounts

    Loaded --> Editing: Click "Edit Label"
    Editing --> Saving: Save label
    Saving --> Loading: Reload accounts

    Loaded --> Syncing: Click "Sync All"
    Syncing --> Loading: Sync complete

    Loaded --> SettingPrimary: Click star icon
    SettingPrimary --> Loading: Primary set

    Loaded --> Disconnecting: Click disconnect
    Disconnecting --> Loading: Account removed

    Error --> Loading: Retry
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Vercel Edge"
        NextApp[Next.js App]
        APIRoutes[API Routes]
    end

    subgraph "Supabase"
        PostgreSQL[(PostgreSQL)]
        Auth[Supabase Auth]
        RLS[RLS Policies]
    end

    subgraph "Google Cloud"
        OAuth[OAuth 2.0]
        Gmail[Gmail API]
    end

    subgraph "Client"
        Browser[User Browser]
    end

    Browser --> NextApp
    NextApp --> APIRoutes
    APIRoutes --> PostgreSQL
    APIRoutes --> OAuth
    APIRoutes --> Gmail

    PostgreSQL --> RLS
    RLS --> Auth

    OAuth -->|Callback| APIRoutes
```

## Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        React[React 19]
        Next[Next.js 16]
        Tailwind[Tailwind CSS]
        Shadcn[shadcn/ui]
    end

    subgraph "Backend"
        NextAPI[Next.js API Routes]
        TypeScript[TypeScript]
    end

    subgraph "Database"
        Supabase[(Supabase)]
        PostgreSQL[(PostgreSQL)]
    end

    subgraph "External APIs"
        GoogleAPIs[Google APIs]
        GmailSDK[Gmail API]
        OAuthSDK[OAuth 2.0]
    end

    React --> Next
    Next --> Tailwind
    Next --> Shadcn
    Next --> NextAPI
    NextAPI --> TypeScript
    TypeScript --> Supabase
    Supabase --> PostgreSQL
    NextAPI --> GoogleAPIs
    GoogleAPIs --> GmailSDK
    GoogleAPIs --> OAuthSDK
```

## Key Design Patterns

### 1. Repository Pattern
```typescript
// Database abstraction
db.emailIntegrations.getByWorkspace(workspaceId)
db.emailIntegrations.getPrimary(workspaceId)
db.sentEmails.create(data)
```

### 2. Service Layer Pattern
```typescript
// Business logic in service layer
await syncAllGmailAccounts(workspaceId)
await sendEmailViaGmail(workspaceId, to, subject, body)
```

### 3. Single Responsibility Principle
- **Database Layer:** Data access only
- **Service Layer:** Business logic only
- **API Layer:** HTTP handling only
- **UI Layer:** Presentation only

### 4. Dependency Injection
```typescript
// Service depends on abstractions
import { db } from "@/lib/db";
// Not on concrete implementations
```

### 5. Error Handling Pattern
```typescript
try {
  await operation();
  toast({ title: "Success" });
} catch (error) {
  console.error(error);
  toast({ title: "Error", variant: "destructive" });
}
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API routes (scales on Vercel Edge)
- Database connection pooling (Supabase)
- No in-memory state

### Performance Optimization
- Database indexes on all foreign keys
- Lazy loading of account list
- Batch operations for multi-account sync
- Token refresh only when needed

### Rate Limiting
- Gmail API: 250 quota units/user/second
- Can sync ~50 emails/second/account
- Consider implementing queue for bulk operations

## Monitoring & Observability

```mermaid
graph TB
    App[Application] --> Logs[Console Logs]
    App --> DB[Database]
    DB --> SyncError[sync_error field]
    DB --> LastSync[last_sync_at field]
    App --> Toast[Toast Notifications]

    Logs --> Debug[Debug Console]
    SyncError --> UI[Error Display]
    LastSync --> UI
    Toast --> User[User Feedback]
```

## Future Architecture Extensions

### Real-time Sync
```mermaid
graph LR
    Gmail[Gmail Push API] -->|Webhook| Vercel[Vercel Function]
    Vercel --> Queue[Message Queue]
    Queue --> Worker[Background Worker]
    Worker --> DB[(Database)]
    DB --> Socket[WebSocket]
    Socket --> UI[Real-time UI Update]
```

### Multi-Provider Support
```mermaid
graph TB
    UI[UI] --> Router[Provider Router]
    Router --> Gmail[Gmail Service]
    Router --> Outlook[Outlook Service]
    Router --> IMAP[IMAP Service]

    Gmail --> DB[(email_integrations)]
    Outlook --> DB
    IMAP --> DB
```

### Microservices (Future)
```mermaid
graph LR
    Gateway[API Gateway] --> Auth[Auth Service]
    Gateway --> Email[Email Service]
    Gateway --> Sync[Sync Service]
    Gateway --> Analytics[Analytics Service]

    Email --> DB1[(Email DB)]
    Sync --> Queue[Message Queue]
    Analytics --> DB2[(Analytics DB)]
```

---

**Architecture Status:** Production-ready for MVP
**Last Updated:** 2025-11-15
**Version:** 1.0.0
