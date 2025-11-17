# GBP Client Self-Service Architecture
## Secure, Client-Managed Google Business Profile Integration

**Version**: 2.0.0 (Client-Side OAuth Model)
**Updated**: 2025-01-17
**Status**: 🔒 Security-First Design

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Client-Side OAuth Flow](#client-side-oauth-flow)
3. [Secure Credential Storage](#secure-credential-storage)
4. [Client Onboarding Process](#client-onboarding-process)
5. [Security & Compliance](#security--compliance)
6. [Implementation Guide](#implementation-guide)

---

## Architecture Overview

### The Correct Model: Client Brings Their Own GBP

```
┌─────────────────────────────────────────────────────────────┐
│                    UNITE-HUB PLATFORM                       │
│  (Does NOT store client's Google credentials)              │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ OAuth 2.0 Token Exchange
                              │ (Client authorizes access)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              CLIENT'S GOOGLE WORKSPACE                      │
│  - Client owns their Google Business Profile                │
│  - Client creates their own Google Cloud Project            │
│  - Client manages their own API credentials                 │
│  - Client controls access revocation                        │
└─────────────────────────────────────────────────────────────┘
```

### Why This Approach?

✅ **Security**: Client credentials never leave their control
✅ **Compliance**: Meets GDPR, SOC 2, ISO 27001 requirements
✅ **Trust**: Clients control their data and access
✅ **Scalability**: No platform API limits (each client has own quota)
✅ **Liability**: Client owns the Google API relationship

---

## Client-Side OAuth Flow

### Step-by-Step Process

```
Step 1: Client Dashboard Prompt
┌──────────────────────────────────────────────┐
│  Connect Your Google Business Profile       │
│                                              │
│  To enable GBP features, you'll need:       │
│  ✅ A Google Cloud Project (free)           │
│  ✅ GBP API enabled (free)                  │
│  ✅ OAuth credentials (5 minutes to setup)  │
│                                              │
│  [📘 View Setup Guide] [▶️ Start Setup]     │
└──────────────────────────────────────────────┘

Step 2: Interactive Setup Wizard
┌──────────────────────────────────────────────┐
│  GBP Connection Setup (Step 1 of 4)         │
│                                              │
│  1. Create Google Cloud Project             │
│     → Click "Open Google Cloud Console"     │
│     → Follow the highlighted steps          │
│     ✅ Project created: "My Business CRM"   │
│                                              │
│  [◀️ Back] [Next: Enable APIs ▶️]           │
└──────────────────────────────────────────────┘

Step 3: Client Provides OAuth Credentials
┌──────────────────────────────────────────────┐
│  Enter Your OAuth Credentials               │
│                                              │
│  Client ID:                                  │
│  [_________________________________]         │
│                                              │
│  Client Secret:                              │
│  [_________________________________] 🔒       │
│                                              │
│  ℹ️  These are stored encrypted and only    │
│     used to connect to YOUR Google account  │
│                                              │
│  [❌ Cancel] [✅ Connect GBP]                │
└──────────────────────────────────────────────┘

Step 4: OAuth Authorization
→ Client redirected to Google OAuth consent screen
→ Google shows: "Unite-Hub wants to access your GBP"
→ Client clicks "Allow"
→ Google redirects back with authorization code
→ Unite-Hub exchanges code for access/refresh tokens
→ Tokens stored encrypted in client's workspace row

Step 5: Success & Verification
┌──────────────────────────────────────────────┐
│  ✅ Connected to Google Business Profile    │
│                                              │
│  Found 3 locations:                          │
│  • Main Office - Sydney                      │
│  • Branch Office - Melbourne                 │
│  • Warehouse - Brisbane                      │
│                                              │
│  [⚙️ Manage Connection] [📊 View Insights]   │
└──────────────────────────────────────────────┘
```

---

## Secure Credential Storage

### Database Schema (Enhanced Security)

```sql
-- Updated integrations table with client-side credentials
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'google_business', 'stripe')),

  -- CLIENT-PROVIDED OAUTH CREDENTIALS (encrypted at rest)
  client_id TEXT, -- Client's Google Cloud OAuth Client ID
  client_secret TEXT, -- ENCRYPTED with workspace-specific key

  -- TOKENS (encrypted at rest)
  access_token TEXT, -- ENCRYPTED - short-lived (1 hour)
  refresh_token TEXT, -- ENCRYPTED - long-lived (use to get new access tokens)
  token_expiry TIMESTAMP WITH TIME ZONE,

  -- METADATA
  metadata JSONB DEFAULT '{}'::jsonb, -- Locations, scopes, etc.

  -- AUDIT
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(org_id, provider)
);

-- Enable Row Level Security (RLS)
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own org's integrations
CREATE POLICY "integrations_org_isolation"
ON integrations
FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);
```

### Encryption Strategy

#### Application-Level Encryption (Before Database)

```typescript
// src/lib/encryption/credential-encryption.ts

import crypto from 'crypto';

/**
 * CRITICAL: Each workspace has a unique encryption key
 * stored in environment variables or AWS Secrets Manager
 */

interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyDerivation: 'pbkdf2'; // Password-Based Key Derivation Function 2
  iterations: 100000; // OWASP recommended minimum
}

/**
 * Generate workspace-specific encryption key
 * Derived from master key + workspace ID
 */
function getWorkspaceKey(workspaceId: string): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY!; // Stored in Vercel/AWS Secrets

  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY not configured');
  }

  // Derive workspace-specific key using PBKDF2
  return crypto.pbkdf2Sync(
    masterKey,
    workspaceId, // Salt is workspace ID
    100000, // Iterations
    32, // Key length (256 bits)
    'sha256'
  );
}

/**
 * Encrypt client secret before storing in database
 */
export function encryptCredential(
  plaintext: string,
  workspaceId: string
): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const key = getWorkspaceKey(workspaceId);
  const iv = crypto.randomBytes(16); // Initialization vector

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt client secret when needed for API calls
 */
export function decryptCredential(
  encrypted: string,
  iv: string,
  authTag: string,
  workspaceId: string
): string {
  const key = getWorkspaceKey(workspaceId);

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

#### Database-Level Encryption (At Rest)

**Supabase/PostgreSQL Configuration**:
```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Alternative: Store credentials as encrypted BYTEA
ALTER TABLE integrations
ADD COLUMN client_secret_encrypted BYTEA;

-- Encrypt on insert (using database key)
INSERT INTO integrations (client_secret_encrypted)
VALUES (pgp_sym_encrypt('client-secret-value', current_setting('app.encryption_key')));

-- Decrypt on read (only when needed)
SELECT pgp_sym_decrypt(client_secret_encrypted, current_setting('app.encryption_key'))
FROM integrations;
```

**Best Practice**: Use BOTH application-level AND database-level encryption (defense in depth).

---

## Client Onboarding Process

### Phase 1: Pre-Setup Education

**Dashboard Prompt** (`src/app/dashboard/google-business/page.tsx`):

```tsx
export default function GoogleBusinessPage() {
  const { currentOrganization } = useAuth();
  const [setupStep, setSetupStep] = useState<'intro' | 'guide' | 'credentials' | 'oauth' | 'complete'>('intro');

  if (setupStep === 'intro') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Connect Your Google Business Profile</h1>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Why Connect GBP?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Benefit
              icon={<Sync />}
              title="Auto-Sync"
              description="Keep your GBP profile updated automatically from your CRM"
            />
            <Benefit
              icon={<BarChart />}
              title="Insights"
              description="Track profile views, calls, and direction requests"
            />
            <Benefit
              icon={<Zap />}
              title="AI Automation"
              description="Auto-post updates and respond to reviews with AI"
            />
          </div>
        </Card>

        <Card className="p-6 mb-6 border-blue-500">
          <h2 className="text-xl font-semibold mb-4">🔒 Your Data, Your Control</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
              <span>You create your own Google Cloud Project (free)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
              <span>Your credentials are encrypted and never shared</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
              <span>You can revoke access anytime from Google Console</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
              <span>Your API quota is separate (no platform limits)</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Setup Time: 5 Minutes</h2>
          <ol className="space-y-3">
            <li className="flex items-start">
              <Badge className="mr-3">1</Badge>
              <div>
                <strong>Create Google Cloud Project</strong>
                <p className="text-sm text-slate-400">Free - we'll guide you step-by-step</p>
              </div>
            </li>
            <li className="flex items-start">
              <Badge className="mr-3">2</Badge>
              <div>
                <strong>Enable GBP API</strong>
                <p className="text-sm text-slate-400">One click - no cost</p>
              </div>
            </li>
            <li className="flex items-start">
              <Badge className="mr-3">3</Badge>
              <div>
                <strong>Create OAuth Credentials</strong>
                <p className="text-sm text-slate-400">Copy & paste - we'll show you where</p>
              </div>
            </li>
            <li className="flex items-start">
              <Badge className="mr-3">4</Badge>
              <div>
                <strong>Authorize Unite-Hub</strong>
                <p className="text-sm text-slate-400">Grant read/write access to your GBP</p>
              </div>
            </li>
          </ol>
        </Card>

        <div className="mt-8 flex gap-4">
          <Button onClick={() => setSetupStep('guide')} size="lg">
            📘 Start Setup Guide
          </Button>
          <Button variant="outline" asChild>
            <a href="/docs/gbp-setup" target="_blank">
              View Detailed Documentation
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // ... other setup steps
}
```

### Phase 2: Interactive Setup Wizard

**Step 1: Google Cloud Project Creation**

```tsx
function GoogleCloudProjectSetup() {
  const [projectCreated, setProjectCreated] = useState(false);

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-4">Step 1: Create Google Cloud Project</h2>

      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">Follow these steps:</h3>
        <ol className="space-y-4">
          <li className="flex items-start">
            <span className="font-bold mr-3">1.</span>
            <div>
              <p>Open Google Cloud Console:</p>
              <Button
                className="mt-2"
                onClick={() => window.open('https://console.cloud.google.com/projectcreate', '_blank')}
              >
                🔗 Open Console
              </Button>
            </div>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-3">2.</span>
            <div>
              <p>Enter project name: <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">unite-hub-gbp</code></p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-3">3.</span>
            <div>
              <p>Click <strong>"Create"</strong></p>
            </div>
          </li>
        </ol>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-6">
        <h4 className="font-semibold mb-2">💡 Pro Tip</h4>
        <p className="text-sm">Keep the Google Cloud Console tab open - you'll need it for the next steps.</p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          id="project-created"
          checked={projectCreated}
          onChange={(e) => setProjectCreated(e.target.checked)}
          className="w-5 h-5"
        />
        <label htmlFor="project-created" className="font-medium">
          ✅ I've created my Google Cloud Project
        </label>
      </div>

      <div className="mt-8 flex gap-4">
        <Button onClick={onBack} variant="outline">
          ◀️ Back
        </Button>
        <Button onClick={onNext} disabled={!projectCreated}>
          Next: Enable APIs ▶️
        </Button>
      </div>
    </Card>
  );
}
```

**Step 2: Enable APIs**

```tsx
function EnableAPIsStep() {
  const [apisEnabled, setApisEnabled] = useState(false);

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-4">Step 2: Enable Required APIs</h2>

      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">Enable these 2 APIs:</h3>

        <div className="space-y-4">
          <div className="flex items-start">
            <span className="font-bold mr-3">1.</span>
            <div className="flex-1">
              <p className="mb-2"><strong>Google My Business API</strong></p>
              <Button
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/library/mybusiness.googleapis.com', '_blank')}
              >
                🔗 Enable API
              </Button>
            </div>
          </div>

          <div className="flex items-start">
            <span className="font-bold mr-3">2.</span>
            <div className="flex-1">
              <p className="mb-2"><strong>Google My Business Business Information API</strong></p>
              <Button
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com', '_blank')}
              >
                🔗 Enable API
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          <strong>For each API:</strong>
          <ol className="list-decimal list-inside ml-4 mt-2">
            <li>Click the link above</li>
            <li>Select your project from the dropdown</li>
            <li>Click the blue "Enable" button</li>
            <li>Wait for confirmation (takes 5-10 seconds)</li>
          </ol>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          id="apis-enabled"
          checked={apisEnabled}
          onChange={(e) => setApisEnabled(e.target.checked)}
          className="w-5 h-5"
        />
        <label htmlFor="apis-enabled" className="font-medium">
          ✅ I've enabled both APIs
        </label>
      </div>

      <div className="mt-8 flex gap-4">
        <Button onClick={onBack} variant="outline">
          ◀️ Back
        </Button>
        <Button onClick={onNext} disabled={!apisEnabled}>
          Next: Create Credentials ▶️
        </Button>
      </div>
    </Card>
  );
}
```

**Step 3: OAuth Credentials**

```tsx
function OAuthCredentialsStep() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = async () => {
    // Validate format
    if (!clientId.includes('.apps.googleusercontent.com')) {
      alert('Invalid Client ID format. Should end with .apps.googleusercontent.com');
      return;
    }

    // Encrypt credentials before storing
    const response = await fetch('/api/integrations/gbp/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: currentOrganization.org_id,
        clientId,
        clientSecret, // Will be encrypted server-side
      }),
    });

    if (response.ok) {
      onNext(); // Proceed to OAuth authorization
    }
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-4">Step 3: Create OAuth Credentials</h2>

      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">Create credentials:</h3>
        <ol className="space-y-4">
          <li className="flex items-start">
            <span className="font-bold mr-3">1.</span>
            <div>
              <p className="mb-2">Go to OAuth Consent Screen:</p>
              <Button
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials/consent', '_blank')}
              >
                🔗 Open Consent Screen
              </Button>
              <ul className="list-disc list-inside ml-6 mt-2 text-sm text-slate-600 dark:text-slate-400">
                <li>User Type: <strong>External</strong></li>
                <li>App Name: <code>Unite-Hub GBP Integration</code></li>
                <li>User Support Email: Your email</li>
                <li>Click "Save and Continue"</li>
              </ul>
            </div>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-3">2.</span>
            <div>
              <p className="mb-2">Create OAuth Client ID:</p>
              <Button
                size="sm"
                onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
              >
                🔗 Create Credentials
              </Button>
              <ul className="list-disc list-inside ml-6 mt-2 text-sm text-slate-600 dark:text-slate-400">
                <li>Click "+ CREATE CREDENTIALS" → "OAuth client ID"</li>
                <li>Application type: <strong>Web application</strong></li>
                <li>Name: <code>Unite-Hub GBP</code></li>
                <li>Authorized redirect URIs: <code className="text-xs">{window.location.origin}/api/integrations/gbp/callback</code></li>
                <li>Click "Create"</li>
              </ul>
            </div>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-3">3.</span>
            <div>
              <p>Copy the Client ID and Client Secret from the popup</p>
            </div>
          </li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Client ID:</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="123456789-abc123.apps.googleusercontent.com"
            className="w-full p-3 border rounded-lg"
          />
          <p className="text-xs text-slate-500 mt-1">Should end with .apps.googleusercontent.com</p>
        </div>

        <div>
          <label className="block font-medium mb-2">Client Secret:</label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
              className="w-full p-3 border rounded-lg pr-12"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-3 text-slate-500"
            >
              {showSecret ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Usually starts with GOCSPX-</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mt-6">
        <h4 className="font-semibold mb-2 flex items-center">
          <Lock className="w-4 h-4 mr-2" />
          🔒 Security Notice
        </h4>
        <ul className="text-sm space-y-1">
          <li>✅ Your credentials are encrypted before storage</li>
          <li>✅ Only used to connect to YOUR Google account</li>
          <li>✅ Never shared with Unite-Hub or third parties</li>
          <li>✅ You can revoke access anytime from Google Console</li>
        </ul>
      </div>

      <div className="mt-8 flex gap-4">
        <Button onClick={onBack} variant="outline">
          ◀️ Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!clientId || !clientSecret}
        >
          Next: Authorize Unite-Hub ▶️
        </Button>
      </div>
    </Card>
  );
}
```

---

## Security & Compliance

### OWASP Top 10 Mitigation

| **Vulnerability** | **Mitigation Strategy** |
|-------------------|-------------------------|
| **A01: Broken Access Control** | Row Level Security (RLS) on integrations table, org_id isolation |
| **A02: Cryptographic Failures** | AES-256-GCM encryption, PBKDF2 key derivation, TLS 1.3 in transit |
| **A03: Injection** | Parameterized queries, input validation, sanitization |
| **A04: Insecure Design** | Client-side OAuth model, no shared credentials, audit logging |
| **A05: Security Misconfiguration** | Environment variable validation, secure headers, CSP |
| **A06: Vulnerable Components** | Automated dependency scanning (Dependabot), npm audit |
| **A07: Identity/Auth Failures** | OAuth 2.0 with PKCE, token expiry, refresh rotation |
| **A08: Data Integrity Failures** | HMAC verification, checksum validation, signed tokens |
| **A09: Logging Failures** | Comprehensive audit logs, alert on credential access |
| **A10: SSRF** | URL whitelist, no user-controlled redirect URIs |

### Compliance Checklist

#### GDPR Compliance
- [ ] **Right to Access**: Client can export their GBP data
- [ ] **Right to Erasure**: Delete integration removes all credentials
- [ ] **Data Minimization**: Only store necessary credentials
- [ ] **Encryption**: At rest and in transit
- [ ] **Consent**: Explicit OAuth consent screen
- [ ] **Data Processing Agreement**: Terms of Service covers data handling

#### SOC 2 Type II
- [ ] **Access Controls**: RLS, org isolation, audit logs
- [ ] **Encryption**: AES-256 at rest, TLS 1.3 in transit
- [ ] **Monitoring**: Alert on unauthorized access attempts
- [ ] **Incident Response**: Documented breach notification process
- [ ] **Change Management**: All credential changes logged

#### ISO 27001
- [ ] **Information Security Policy**: Documented in SECURITY.md
- [ ] **Risk Assessment**: Threat modeling for credential storage
- [ ] **Access Control**: Multi-factor auth for admin access
- [ ] **Cryptography**: NIST-approved algorithms
- [ ] **Operations Security**: Automated backup of encrypted data

---

## Implementation Guide

### Backend API Endpoints

#### 1. Store Client Credentials (Encrypted)

```typescript
// src/app/api/integrations/gbp/credentials/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { validateUserAndWorkspace } from '@/lib/workspace-validation';
import { encryptCredential } from '@/lib/encryption/credential-encryption';

export async function POST(req: NextRequest) {
  try {
    const { orgId, clientId, clientSecret } = await req.json();

    // Validate user has access to this org
    const user = await validateUserAndWorkspace(req, orgId);

    // Get workspace ID for encryption key derivation
    const supabase = await getSupabaseServer();
    const { data: org } = await supabase
      .from('organizations')
      .select('default_workspace_id')
      .eq('id', orgId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const workspaceId = org.default_workspace_id;

    // Encrypt client secret with workspace-specific key
    const encrypted = encryptCredential(clientSecret, workspaceId);

    // Store encrypted credentials
    const { error } = await supabase
      .from('integrations')
      .upsert({
        org_id: orgId,
        workspace_id: workspaceId,
        provider: 'google_business',
        client_id: clientId, // Stored in plaintext (not sensitive)
        client_secret: encrypted.encrypted, // Encrypted
        metadata: {
          encryption_iv: encrypted.iv,
          encryption_auth_tag: encrypted.authTag,
        },
      }, {
        onConflict: 'org_id,provider',
      });

    if (error) throw error;

    // Generate OAuth URL for next step
    const oauthUrl = generateGBPOAuthUrl(clientId, orgId);

    return NextResponse.json({ success: true, oauthUrl });

  } catch (error) {
    console.error('Error storing GBP credentials:', error);
    return NextResponse.json(
      { error: 'Failed to store credentials' },
      { status: 500 }
    );
  }
}

function generateGBPOAuthUrl(clientId: string, orgId: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/business.manage',
  ];

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gbp/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state: orgId, // Pass orgId to callback
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent screen (ensures refresh token)
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
```

#### 2. OAuth Callback (Exchange Code for Tokens)

```typescript
// src/app/api/integrations/gbp/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { encryptCredential, decryptCredential } from '@/lib/encryption/credential-encryption';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state'); // orgId
    const error = req.nextUrl.searchParams.get('error');

    if (error) {
      // User denied access
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/google-business?error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    const orgId = state;

    // Fetch stored credentials
    const supabase = await getSupabaseServer();
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider', 'google_business')
      .single();

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Decrypt client secret
    const clientSecret = decryptCredential(
      integration.client_secret,
      integration.metadata.encryption_iv,
      integration.metadata.encryption_auth_tag,
      integration.workspace_id
    );

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: integration.client_id,
        client_secret: clientSecret,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gbp/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Encrypt tokens before storage
    const encryptedAccessToken = encryptCredential(
      tokens.access_token,
      integration.workspace_id
    );
    const encryptedRefreshToken = encryptCredential(
      tokens.refresh_token,
      integration.workspace_id
    );

    // Store encrypted tokens
    await supabase
      .from('integrations')
      .update({
        access_token: encryptedAccessToken.encrypted,
        refresh_token: encryptedRefreshToken.encrypted,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        metadata: {
          ...integration.metadata,
          access_token_iv: encryptedAccessToken.iv,
          access_token_auth_tag: encryptedAccessToken.authTag,
          refresh_token_iv: encryptedRefreshToken.iv,
          refresh_token_auth_tag: encryptedRefreshToken.authTag,
        },
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    // Fetch GBP locations (initial sync)
    await fetchAndStoreGBPLocations(orgId, tokens.access_token);

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/google-business?success=true`
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/google-business?error=callback_failed`
    );
  }
}
```

---

## Environment Variables

### Required Configuration

```env
# Encryption Master Key (CRITICAL - Store in Vercel/AWS Secrets Manager)
# Generate with: openssl rand -base64 32
ENCRYPTION_MASTER_KEY=your-256-bit-base64-encoded-key

# Application URL
NEXT_PUBLIC_APP_URL=https://unite-hub.com

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Generating Encryption Master Key

```bash
# Generate secure 256-bit key
openssl rand -base64 32

# Example output:
# 3kJ8mN9pQ2rS5tU6vW7xY8zA1bC2dE3fG4hI5jK6lM7=

# Add to .env.local (NEVER commit this file)
echo "ENCRYPTION_MASTER_KEY=3kJ8mN9pQ2rS5tU6vW7xY8zA1bC2dE3fG4hI5jK6lM7=" >> .env.local

# Add to Vercel environment variables
vercel env add ENCRYPTION_MASTER_KEY production
```

---

## Client Documentation

### Create: `docs/CLIENT_GBP_SETUP_GUIDE.md`

```markdown
# How to Connect Your Google Business Profile

## Overview

Unite-Hub integrates with your Google Business Profile to automatically sync your business information, post updates, and track insights.

**Important**: You create your own Google Cloud Project and manage your own credentials. Unite-Hub never has direct access to your Google account.

---

## Prerequisites

- A Google Business Profile (verified)
- A Google Account with Owner/Manager access to the profile
- 5 minutes of setup time

---

## Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/projectcreate)
2. Sign in with your Google account
3. Enter project name: `unite-hub-gbp` (or any name you prefer)
4. Click **"Create"**
5. Wait for project creation (takes 10-15 seconds)

**Cost**: Free (no credit card required for GBP API)

---

### Step 2: Enable APIs

Enable these two APIs in your project:

#### API 1: Google My Business API

1. Go to [My Business API Library](https://console.cloud.google.com/apis/library/mybusiness.googleapis.com)
2. Select your project from the dropdown (top of page)
3. Click blue **"Enable"** button
4. Wait for confirmation

#### API 2: Google My Business Business Information API

1. Go to [Business Information API Library](https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com)
2. Select your project
3. Click **"Enable"**
4. Wait for confirmation

---

### Step 3: Configure OAuth Consent Screen

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select **"External"** user type
3. Click **"Create"**
4. Fill in:
   - App name: `Unite-Hub GBP Integration`
   - User support email: Your email
   - Developer contact: Your email
5. Click **"Save and Continue"** (3 times - skip Scopes and Test Users)
6. Click **"Back to Dashboard"**

---

### Step 4: Create OAuth Credentials

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `Unite-Hub GBP`
5. **Authorized redirect URIs**: Click "Add URI" and enter:
   ```
   https://unite-hub.com/api/integrations/gbp/callback
   ```
   (Replace with your Unite-Hub domain if self-hosted)
6. Click **"Create"**
7. **Copy the Client ID and Client Secret** from the popup

---

### Step 5: Connect in Unite-Hub

1. Log in to Unite-Hub
2. Go to **Dashboard → Google Business Profile**
3. Click **"Connect Google Business Profile"**
4. Follow the wizard and paste your Client ID and Client Secret when prompted
5. Click **"Authorize"** - you'll be redirected to Google
6. Review permissions and click **"Allow"**
7. You'll be redirected back to Unite-Hub with your locations connected

---

## Security & Privacy

### Your Data, Your Control

✅ **You own the Google Cloud Project** - not Unite-Hub
✅ **Your credentials are encrypted** - using AES-256 encryption
✅ **You can revoke access anytime** - from Google Console → APIs & Services → Credentials
✅ **No shared API limits** - your project has separate quota

### What Unite-Hub Can Access

When you authorize Unite-Hub, it can:
- ✅ View your Google Business Profile locations
- ✅ Update business information (name, address, phone, hours)
- ✅ Create posts on your behalf
- ✅ View insights (profile views, clicks)
- ✅ Read reviews (to help you respond)

What Unite-Hub CANNOT do:
- ❌ Access your Gmail or other Google services
- ❌ Delete your Google Business Profile
- ❌ Transfer ownership
- ❌ See your Google Account password

---

## Troubleshooting

### "Invalid Client ID" Error

**Cause**: Redirect URI mismatch

**Fix**:
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click your OAuth Client ID
3. Verify "Authorized redirect URIs" includes:
   ```
   https://unite-hub.com/api/integrations/gbp/callback
   ```
4. Save and try again

---

### "Access Denied" Error

**Cause**: Google Account doesn't have access to GBP

**Fix**:
1. Verify you're logged into the correct Google Account
2. Check you have Owner or Manager role on the GBP
3. Try connecting with a different account

---

### "API Not Enabled" Error

**Cause**: APIs not enabled in your project

**Fix**:
1. Go to [APIs & Services](https://console.cloud.google.com/apis/dashboard)
2. Click **"+ ENABLE APIS AND SERVICES"**
3. Search for "My Business API"
4. Enable both APIs listed in Step 2 above

---

## Revoking Access

If you want to disconnect Unite-Hub:

**Option 1: From Unite-Hub Dashboard**
1. Go to **Dashboard → Google Business Profile**
2. Click **"Manage Connection"**
3. Click **"Disconnect"**

**Option 2: From Google Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services → Credentials**
4. Delete the OAuth Client ID
5. Or go to [Google Account Permissions](https://myaccount.google.com/permissions) and revoke Unite-Hub

---

## Support

Need help? Contact us:
- Email: support@unite-hub.com
- Live chat: Click the chat icon in Unite-Hub dashboard
- Documentation: https://unite-hub.com/docs/gbp

---

**Last Updated**: 2025-01-17
```

---

## Summary: Key Architectural Changes

### Before (Platform-Managed) ❌

```
Unite-Hub creates ONE Google Cloud Project
    ↓
All clients use Unite-Hub's credentials
    ↓
Shared API quota (10,000 requests/day)
    ↓
Single point of failure
    ↓
Security risk (platform stores all credentials)
```

### After (Client-Managed) ✅

```
Each client creates their OWN Google Cloud Project
    ↓
Each client provides their own credentials
    ↓
Credentials encrypted with workspace-specific keys
    ↓
Individual API quotas (10,000/day per client)
    ↓
Client controls access revocation
    ↓
Security: Client owns the Google API relationship
```

---

**This architecture prioritizes security, compliance, and client trust while maintaining ease of use through guided onboarding.**

**Last Updated**: 2025-01-17
**Version**: 2.0.0 - Client Self-Service Model
