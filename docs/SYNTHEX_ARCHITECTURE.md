# Synthex CLI - Architecture Diagrams

**Version**: 1.0.0
**Last Updated**: 2026-01-15
**Format**: Mermaid diagrams

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Integration Architecture](#integration-architecture)
5. [Authentication Flow](#authentication-flow)
6. [Monitoring Architecture](#monitoring-architecture)
7. [Deployment Architecture](#deployment-architecture)

---

## System Overview

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[Synthex CLI]
        WebUI[Web Dashboard]
    end

    subgraph "Application Layer"
        API[API Routes]
        Services[Service Layer]
        Agents[AI Agents]
    end

    subgraph "Integration Layer"
        Shopify[Shopify API]
        GMC[Google Merchant API]
        GCP[Google Cloud Platform]
    end

    subgraph "Data Layer"
        DB[(Supabase PostgreSQL)]
        Secrets[Secret Manager]
        Cache[(Redis Cache)]
    end

    CLI --> API
    WebUI --> API
    API --> Services
    Services --> Agents
    Services --> Shopify
    Services --> GMC
    Services --> GCP
    Services --> DB
    Services --> Secrets
    Services --> Cache
```

---

## Component Architecture

### Service Layer Components

```mermaid
graph LR
    subgraph "Tenant Management"
        TS[TenantService]
        CS[CredentialService]
    end

    subgraph "Integrations"
        SS[ShopifyService]
        GMS[GoogleMerchantService]
    end

    subgraph "Advanced Features"
        BOS[BatchOperationsService]
        TTS[TenantTemplateService]
    end

    subgraph "Monitoring"
        UAS[UsageAnalyticsService]
        CAS[CredentialAlertService]
        HMS[HealthMonitorService]
        NS[NotificationService]
    end

    TS --> DB[(Database)]
    CS --> Secrets[Secret Manager]
    SS --> Shopify[Shopify API]
    GMS --> GMC[GMC API]
    BOS --> TS
    TTS --> TS
    UAS --> DB
    CAS --> CS
    CAS --> NS
    HMS --> DB
    HMS --> SS
    HMS --> GMS
    NS --> Email[Email Service]
    NS --> Slack[Slack Webhooks]
```

### CLI Command Structure

```mermaid
graph TD
    CLI[synthex]

    CLI --> Init[init]
    CLI --> Auth[auth]
    CLI --> Tenant[tenant]
    CLI --> Shopify[shopify]
    CLI --> GMC[google-merchant]
    CLI --> Batch[batch]
    CLI --> Templates[templates]
    CLI --> Analytics[analytics]
    CLI --> Alerts[alerts]
    CLI --> Health[health]
    CLI --> Check[check]

    Tenant --> TenantTenants[tenants]
    Tenant --> TenantCreds[credentials]
    Tenant --> TenantWS[workspace]

    TenantTenants --> Create[create]
    TenantTenants --> List[list]
    TenantTenants --> Show[show]
    TenantTenants --> Update[update]
    TenantTenants --> Delete[delete]

    Shopify --> ShopifySync[sync]
    Shopify --> ShopifyProducts[products]
    Shopify --> ShopifyOrders[orders]

    GMC --> GMCSync[sync]
    GMC --> GMCProducts[products]
    GMC --> GMCStatus[status]
```

---

## Data Flow Diagrams

### Tenant Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant TenantService
    participant Database
    participant Audit

    User->>CLI: synthex tenant create
    CLI->>TenantService: create(tenantData)

    TenantService->>Database: Check tenant exists
    Database-->>TenantService: Not exists

    TenantService->>Database: INSERT INTO tenants
    Database-->>TenantService: Tenant created

    TenantService->>Database: INSERT INTO tenant_settings
    Database-->>TenantService: Settings created

    TenantService->>Audit: Log tenant.created event
    Audit-->>TenantService: Event logged

    TenantService-->>CLI: Return tenant
    CLI-->>User: ✓ Tenant created successfully
```

### Shopify Product Sync Flow

```mermaid
sequenceDiagram
    participant CLI
    participant ShopifyService
    participant CredentialService
    participant SecretManager
    participant ShopifyAPI
    participant Database

    CLI->>ShopifyService: syncProducts(tenantId)

    ShopifyService->>CredentialService: getCredentials(tenantId, 'shopify')
    CredentialService->>SecretManager: getSecret(secretName)
    SecretManager-->>CredentialService: credentials
    CredentialService-->>ShopifyService: OAuth token

    ShopifyService->>ShopifyAPI: GET /admin/api/2024-01/products.json
    ShopifyAPI-->>ShopifyService: products[]

    loop For each product
        ShopifyService->>Database: UPSERT shopify_products
        Database-->>ShopifyService: Product saved
    end

    ShopifyService-->>CLI: SyncResult{totalSynced, created, updated}
```

### Credential Expiry Alert Flow

```mermaid
sequenceDiagram
    participant Cron
    participant AlertService
    participant Database
    participant NotificationService
    participant Email
    participant Slack

    Cron->>AlertService: checkAndSendAlerts()

    AlertService->>Database: SELECT credentials WHERE expires_at < NOW() + 30d
    Database-->>AlertService: expiring credentials[]

    loop For each credential
        AlertService->>Database: Check existing alert (24h window)
        Database-->>AlertService: No existing alert

        AlertService->>Database: INSERT INTO alerts
        Database-->>AlertService: Alert created

        AlertService->>NotificationService: send(alert)

        par Multi-channel delivery
            NotificationService->>Email: sendEmail()
            NotificationService->>Slack: sendSlackMessage()
        end

        NotificationService-->>AlertService: Delivery status
    end

    AlertService-->>Cron: alerts[] generated
```

---

## Integration Architecture

### Shopify Integration

```mermaid
graph TB
    subgraph "Synthex"
        ShopifyService[Shopify Service]
        DB[(Database)]
        Credentials[Credential Service]
    end

    subgraph "Shopify Platform"
        ShopifyAPI[Shopify Admin API]
        ShopifyOAuth[OAuth 2.0]
        ShopifyWebhooks[Webhooks]
    end

    ShopifyService -->|Authenticate| ShopifyOAuth
    ShopifyOAuth -->|Access Token| Credentials
    Credentials -->|Retrieve Token| ShopifyService

    ShopifyService -->|GET /products| ShopifyAPI
    ShopifyService -->|GET /orders| ShopifyAPI
    ShopifyAPI -->|Products JSON| ShopifyService
    ShopifyAPI -->|Orders JSON| ShopifyService

    ShopifyService -->|Store Products| DB
    ShopifyService -->|Store Orders| DB

    ShopifyWebhooks -.->|products/create| WebhookHandler
    ShopifyWebhooks -.->|orders/paid| WebhookHandler
    WebhookHandler -.->|Trigger Sync| ShopifyService
```

### Google Merchant Center Integration

```mermaid
graph TB
    subgraph "Synthex"
        GMCService[GMC Service]
        DB[(Database)]
        Credentials[Credential Service]
    end

    subgraph "Google Cloud Platform"
        GMCAPI[Content API v2.1]
        OAuth[OAuth 2.0]
        SecretManager[Secret Manager]
    end

    GMCService -->|Authenticate| OAuth
    OAuth -->|Refresh Token| SecretManager
    SecretManager -->|Access Token| Credentials
    Credentials -->|Retrieve Token| GMCService

    GMCService -->|POST /products| GMCAPI
    GMCService -->|GET /products/{id}/status| GMCAPI
    GMCAPI -->|Product Status| GMCService
    GMCAPI -->|Validation Errors| GMCService

    GMCService -->|Store Products| DB
    GMCService -->|Store Feed Status| DB
```

---

## Authentication Flow

### OAuth 2.0 Flow (Shopify & GMC)

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant AuthService
    participant OAuth[OAuth Provider]
    participant SecretManager
    participant Database

    User->>CLI: synthex auth login --service shopify
    CLI->>AuthService: initiateOAuth()

    AuthService->>OAuth: Generate auth URL
    AuthService-->>CLI: Authorization URL
    CLI-->>User: Open browser to authorize

    User->>OAuth: Grant permissions
    OAuth-->>User: Redirect with auth code

    User->>CLI: Provide auth code
    CLI->>AuthService: exchangeCode(code)

    AuthService->>OAuth: POST /oauth/token
    OAuth-->>AuthService: {access_token, refresh_token, expires_at}

    AuthService->>SecretManager: storeSecret(credentials)
    SecretManager-->>AuthService: Secret stored

    AuthService->>Database: INSERT INTO credentials
    Database-->>AuthService: Credential record created

    AuthService-->>CLI: Authentication successful
    CLI-->>User: ✓ Authenticated with Shopify
```

### Session Management

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated

    Unauthenticated --> Authenticating: synthex auth login
    Authenticating --> Authenticated: Success
    Authenticating --> Unauthenticated: Failure

    Authenticated --> Active: Token valid
    Active --> Refreshing: Token near expiry
    Refreshing --> Active: Refresh success
    Refreshing --> Expired: Refresh failure

    Active --> Expired: Token expires
    Expired --> Authenticating: Re-authenticate

    Authenticated --> Revoked: Revoke credentials
    Revoked --> Unauthenticated
```

---

## Monitoring Architecture

### Health Check System

```mermaid
graph TB
    subgraph "Health Monitor Service"
        HMS[Health Monitor]
        DBCheck[Database Check]
        APICheck[API Check]
        DiskCheck[Disk Check]
        MemCheck[Memory Check]
        CredCheck[Credential Check]
    end

    subgraph "Targets"
        DB[(Database)]
        ShopifyAPI[Shopify API]
        GMCAPI[GMC API]
        Disk[Disk System]
        Memory[Memory System]
        Credentials[(Credentials)]
    end

    subgraph "Reporting"
        Console[Console Output]
        JSON[JSON Export]
        Alerts[Alert System]
    end

    HMS --> DBCheck
    HMS --> APICheck
    HMS --> DiskCheck
    HMS --> MemCheck
    HMS --> CredCheck

    DBCheck --> DB
    APICheck --> ShopifyAPI
    APICheck --> GMCAPI
    DiskCheck --> Disk
    MemCheck --> Memory
    CredCheck --> Credentials

    HMS --> Console
    HMS --> JSON
    HMS --> Alerts
```

### Alert Pipeline

```mermaid
graph LR
    subgraph "Detection"
        CredMonitor[Credential Monitor]
        HealthMonitor[Health Monitor]
        UsageMonitor[Usage Monitor]
    end

    subgraph "Processing"
        AlertService[Alert Service]
        RulesEngine[Rules Engine]
    end

    subgraph "Delivery"
        Email[Email]
        Slack[Slack]
        Webhook[Custom Webhook]
        PagerDuty[PagerDuty]
    end

    CredMonitor --> AlertService
    HealthMonitor --> AlertService
    UsageMonitor --> AlertService

    AlertService --> RulesEngine
    RulesEngine --> Email
    RulesEngine --> Slack
    RulesEngine --> Webhook
    RulesEngine --> PagerDuty
```

---

## Deployment Architecture

### Production Deployment

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]

        subgraph "Application Servers"
            App1[App Server 1]
            App2[App Server 2]
            App3[App Server 3]
        end

        subgraph "Data Layer"
            DBPrimary[(Primary DB)]
            DBReplica1[(Replica DB 1)]
            DBReplica2[(Replica DB 2)]
            Redis[(Redis Cache)]
        end

        subgraph "External Services"
            Supabase[Supabase]
            GCP[Google Cloud Platform]
            Shopify[Shopify]
            GMC[Google Merchant]
        end
    end

    LB --> App1
    LB --> App2
    LB --> App3

    App1 --> DBPrimary
    App2 --> DBPrimary
    App3 --> DBPrimary

    DBPrimary -.->|Replication| DBReplica1
    DBPrimary -.->|Replication| DBReplica2

    App1 --> Redis
    App2 --> Redis
    App3 --> Redis

    App1 --> Supabase
    App1 --> GCP
    App1 --> Shopify
    App1 --> GMC
```

### CI/CD Pipeline

```mermaid
graph LR
    subgraph "Development"
        Dev[Developer]
        Git[Git Repository]
    end

    subgraph "CI Pipeline"
        Build[Build & Test]
        Lint[Lint & Type Check]
        UnitTest[Unit Tests]
        IntTest[Integration Tests]
    end

    subgraph "CD Pipeline"
        StagingDeploy[Deploy to Staging]
        StagingTest[E2E Tests]
        ProdDeploy[Deploy to Production]
        Rollback[Rollback Plan]
    end

    subgraph "Environments"
        Staging[Staging]
        Production[Production]
    end

    Dev --> Git
    Git --> Build
    Build --> Lint
    Lint --> UnitTest
    UnitTest --> IntTest

    IntTest --> StagingDeploy
    StagingDeploy --> Staging
    Staging --> StagingTest

    StagingTest -->|Pass| ProdDeploy
    StagingTest -->|Fail| Rollback

    ProdDeploy --> Production
    Rollback --> Staging
```

### Multi-Region Architecture

```mermaid
graph TB
    subgraph "ANZ Region (AU-SE1)"
        ANZ_LB[Load Balancer]
        ANZ_App1[App Server]
        ANZ_App2[App Server]
        ANZ_DB[(Primary DB)]
    end

    subgraph "US Region (US-EA1)"
        US_LB[Load Balancer]
        US_App1[App Server]
        US_App2[App Server]
        US_DB[(Primary DB)]
    end

    subgraph "UK Region (EU-WE1)"
        UK_LB[Load Balancer]
        UK_App1[App Server]
        UK_App2[App Server]
        UK_DB[(Primary DB)]
    end

    subgraph "Global Services"
        DNS[Global DNS]
        CDN[CDN]
        SecretManager[Secret Manager]
    end

    DNS --> ANZ_LB
    DNS --> US_LB
    DNS --> UK_LB

    CDN --> ANZ_LB
    CDN --> US_LB
    CDN --> UK_LB

    ANZ_App1 --> SecretManager
    US_App1 --> SecretManager
    UK_App1 --> SecretManager
```

---

## Database Schema Relationships

```mermaid
erDiagram
    workspaces ||--o{ tenants : contains
    workspaces ||--o{ usage_metrics : tracks
    workspaces ||--o{ alerts : generates
    workspaces ||--o{ alert_rules : configures

    tenants ||--o{ credentials : has
    tenants ||--|| tenant_settings : configures
    tenants ||--o{ shopify_products : syncs
    tenants ||--o{ shopify_orders : receives
    tenants ||--o{ gmc_products : publishes
    tenants ||--o{ gmc_feeds : manages

    credentials ||--o{ alerts : triggers

    alert_rules ||--o{ notifications : routes
```

---

## Batch Operations Flow

```mermaid
graph TD
    Start[CSV File] --> Validate[Validate Format]
    Validate -->|Valid| Parse[Parse CSV]
    Validate -->|Invalid| Error1[Return Validation Errors]

    Parse --> Batch[Split into Batches]
    Batch --> Process{Process Batch}

    Process -->|Success| DB[(Database)]
    Process -->|Failure| Retry[Retry Logic]

    Retry -->|Success| DB
    Retry -->|Max Retries| ErrorLog[Log Error]

    DB --> NextBatch{More Batches?}
    NextBatch -->|Yes| Process
    NextBatch -->|No| Report[Generate Report]

    ErrorLog --> NextBatch
    Report --> End[Return Results]
```

---

**Next Steps**:
- Review [Getting Started Guide](SYNTHEX_GETTING_STARTED.md) for setup instructions
- See [API Reference](SYNTHEX_API_REFERENCE.md) for service APIs
- Check [Database Schema Reference](SYNTHEX_DATABASE_SCHEMA.md) for data models
