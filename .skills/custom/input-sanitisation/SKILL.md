---
name: input-sanitisation
description: >-
  XSS, SQL injection, and command injection prevention patterns for
  the Next.js frontend and FastAPI backend. Covers output encoding,
  parameterised queries, and OWASP Top 10 input handling.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# Input Sanitisation - Injection Prevention Patterns

Defence-in-depth patterns preventing injection attacks across the full stack. Complements `data-validation` (which checks shape/type) by ensuring data is safe for its destination context (HTML, SQL, shell, URL).

## Description

Covers XSS, SQL injection, command injection, URL redirect, and SSRF prevention patterns for the Next.js frontend and FastAPI backend. Enforces output encoding, parameterised queries, and safe subprocess handling aligned with OWASP Top 10 guidelines.

## When to Apply

### Positive Triggers

- Rendering user-generated content in HTML
- Constructing database queries with user input
- Building shell commands or subprocess calls
- Handling URL parameters or redirect targets
- Reviewing code for OWASP Top 10 vulnerabilities
- User mentions: "XSS", "injection", "sanitise", "security", "escape", "OWASP"

### Negative Triggers

- Validating data shape or type (use `data-validation` instead)
- Classifying error responses (use `error-taxonomy` instead)
- Configuring authentication or RBAC (use auth patterns directly)
- Setting up CORS or rate limiting (already handled in middleware)

## Core Principle

**Validation checks what data IS. Sanitisation ensures data is SAFE for its destination.**

```
                          ┌─────────────┐
User Input ──► Validate ──► Sanitise ──► Use in Context
              (shape)      (safety)     (HTML/SQL/shell/URL)
```

---

## Attack Vector 1: Cross-Site Scripting (XSS)

### The Threat

Untrusted data rendered as HTML can execute arbitrary JavaScript in the user's browser.

### React's Built-In Protection

React escapes all JSX expressions by default. This is safe:

```tsx
// SAFE: React auto-escapes this
function UserComment({ text }: { text: string }) {
  return <p>{text}</p>;
}

// Input: <script>alert('XSS')</script>
// Output: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

### Dangerous Exceptions

These patterns bypass React's escaping and **require manual sanitisation**:

```tsx
// DANGEROUS: dangerouslySetInnerHTML
// Only use with sanitised content
import DOMPurify from 'dompurify';

function RichContent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// DANGEROUS: href with user input (javascript: protocol)
function UserLink({ url }: { url: string }) {
  // Validate protocol before rendering
  const safeUrl = /^https?:\/\//i.test(url) ? url : '#';
  return <a href={safeUrl}>{url}</a>;
}
```

### Content Security Policy (CSP)

Add CSP headers in `next.config.ts` to prevent inline script execution:

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'nonce-{random}'",
      "style-src 'self' 'unsafe-inline'",  // Required for Tailwind
      "img-src 'self' data: https:",
      "connect-src 'self' http://localhost:8000",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];
```

---

## Attack Vector 2: SQL Injection

### The Threat

Untrusted data interpolated into SQL queries can read, modify, or delete database content.

### SQLAlchemy Protection (Already in Use)

The project uses SQLAlchemy ORM which parameterises queries by default:

```python
# SAFE: SQLAlchemy ORM (parameterised automatically)
result = await session.execute(
    select(User).where(User.email == user_email)
)

# SAFE: SQLAlchemy text() with bound parameters
from sqlalchemy import text
result = await session.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": user_email}
)
```

### Dangerous Patterns (NEVER USE)

```python
# DANGEROUS: f-string interpolation in SQL
query = f"SELECT * FROM users WHERE email = '{user_email}'"

# DANGEROUS: .format() in SQL
query = "SELECT * FROM users WHERE email = '{}'".format(user_email)

# DANGEROUS: % formatting in SQL
query = "SELECT * FROM users WHERE email = '%s'" % user_email
```

### Detection Rule

Grep for SQL injection risks:

```bash
rg "f['\"].*SELECT|\.format\(.*SELECT|%.*SELECT" apps/backend/src/
```

Any matches are **Critical** security findings.

---

## Attack Vector 3: Command Injection

### The Threat

Untrusted data in shell commands can execute arbitrary system commands.

### Safe Subprocess Calls

```python
import subprocess
import shlex

# SAFE: List form (no shell interpretation)
subprocess.run(
    ["git", "log", "--oneline", "-n", str(count)],
    capture_output=True, text=True
)

# SAFE: shlex.quote for unavoidable string commands
filename = shlex.quote(user_filename)
subprocess.run(f"wc -l {filename}", shell=True)
```

### Dangerous Patterns (NEVER USE)

```python
# DANGEROUS: Unquoted user input in shell
subprocess.run(f"cat {user_input}", shell=True)

# DANGEROUS: os.system with user input
import os
os.system(f"rm {filename}")
```

### Detection Rule

```bash
rg "os\.system\(|shell=True" apps/backend/src/
```

---

## Attack Vector 4: URL/Redirect Injection

### The Threat

Open redirects allow attackers to redirect users to malicious sites after login.

### Safe Redirect Pattern

```typescript
// Whitelist allowed redirect destinations
const ALLOWED_HOSTS = ['localhost:3000', 'yourdomain.com.au'];

function safeRedirect(url: string, fallback = '/'): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (ALLOWED_HOSTS.includes(parsed.host)) {
      return parsed.pathname + parsed.search;
    }
  } catch {
    // Invalid URL — fall through to fallback
  }
  return fallback;
}
```

### Backend Redirect Validation

```python
from urllib.parse import urlparse

ALLOWED_HOSTS = {"localhost", "yourdomain.com.au"}


def validate_redirect(url: str, default: str = "/") -> str:
    """Validate redirect URL against whitelist."""
    try:
        parsed = urlparse(url)
        if parsed.hostname in ALLOWED_HOSTS or not parsed.hostname:
            return url
    except ValueError:
        pass
    return default
```

---

## Attack Vector 5: Server-Side Request Forgery (SSRF)

### The Threat

User-controlled URLs in server-side requests can access internal services.

### Safe URL Fetching

```python
import ipaddress
from urllib.parse import urlparse

BLOCKED_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
]


def is_safe_url(url: str) -> bool:
    """Reject URLs pointing to internal/private networks."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    try:
        ip = ipaddress.ip_address(parsed.hostname)
        return not any(ip in net for net in BLOCKED_RANGES)
    except ValueError:
        # Hostname, not IP — allow (DNS resolution happens later)
        return True
```

---

## Sanitisation Checklist

When reviewing code for injection risks:

- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] No `javascript:` or `data:` URLs in `href`/`src` attributes
- [ ] No f-string/format SQL — all queries use ORM or bound parameters
- [ ] No `shell=True` with user input — use list form or `shlex.quote`
- [ ] No open redirects — all redirect targets validated against whitelist
- [ ] No user-controlled URLs in server-side `fetch`/`requests` without SSRF check
- [ ] CSP headers configured in Next.js

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|------------------|
| String concatenation in SQL (`f"SELECT ... WHERE id = '{user_id}'"`) | SQL injection vulnerability | Use SQLAlchemy ORM or bound parameters with `text()` |
| `innerHTML` or `dangerouslySetInnerHTML` for user content without sanitisation | XSS attack vector | Sanitise with DOMPurify before rendering |
| No output encoding for context (HTML, URL, shell) | Injection in the destination context | Encode output appropriate to context: HTML-escape, URL-encode, `shlex.quote` |
| Trusting client-side validation as the only defence | Attackers bypass the browser entirely | Always re-validate and sanitise on the server side |
| `shell=True` with user-controlled arguments | Command injection vulnerability | Use list-form subprocess calls or `shlex.quote` |

## Checklist

- [ ] All SQL queries use parameterised queries (ORM or bound parameters)
- [ ] XSS output encoding applied (DOMPurify for rich HTML, React auto-escaping elsewhere)
- [ ] Command injection prevention verified (no `shell=True` with user input)
- [ ] OWASP Top 10 input handling coverage reviewed
- [ ] Redirect URLs validated against an allow-list
- [ ] CSP headers configured in `next.config.ts`

## Response Format

```
[AGENT_ACTIVATED]: Input Sanitisation
[PHASE]: {Audit | Implementation | Review}
[STATUS]: {in_progress | complete}

{security analysis or implementation guidance}

[NEXT_ACTION]: {what to do next}
```

## Integration Points

### Data Validation

`data-validation` runs first (checks shape), then `input-sanitisation` ensures safety:

```
Input → data-validation (is it valid?) → input-sanitisation (is it safe?) → Use
```

### Error Taxonomy

Sanitisation failures should use `AUTH_PERMISSION_*` or `DATA_VALIDATION_*` error codes. Never reveal internal details in error messages to untrusted clients.

### Council of Logic (Turing Check)

Sanitisation functions must be O(n) — no recursive regex or backtracking patterns that could cause ReDoS (Regular Expression Denial of Service).

## Australian Localisation (en-AU)

- **Spelling**: sanitisation, authorisation, defence, analyse, centre, colour
- **Compliance**: Privacy Act 1988, Australian Cyber Security Centre (ACSC) guidelines
- **Tone**: Direct, security-conscious — state risks clearly
