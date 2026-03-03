# Optional Services & Upgrades

This guide covers optional services you can add to NodeJS-Starter-V1 after it's working locally.

**Important**: The template works completely without any of these services. Only add them when you need specific features.

---

## 🚀 Deployment Options

### Frontend Deployment

The Next.js frontend can be deployed to various platforms:

#### Vercel (Recommended)

**Why Vercel:**
- Built by Next.js creators
- Zero-config deployment
- Automatic preview deployments
- Edge functions support
- Free tier available

**Setup:**

1. **Install Vercel CLI:**
```bash
pnpm add -g vercel
```

2. **Login and Deploy:**
```bash
vercel login
vercel
```

3. **Configure Environment Variables:**
```bash
# In Vercel dashboard, add:
NEXT_PUBLIC_API_URL=https://your-backend.com
```

4. **Auto-Deploy (Optional):**
- Connect GitHub repository in Vercel dashboard
- Auto-deploys on push to main branch

**Example Workflow:**
See `.github/workflows/examples/deploy-frontend.yml.example`

**Cost:**
- Hobby: Free (personal projects)
- Pro: $20/month (team features)

---

#### Netlify

**Why Netlify:**
- Simple setup
- Built-in CDN
- Form handling
- Split testing
- Free tier available

**Setup:**

1. **Install Netlify CLI:**
```bash
pnpm add -g netlify-cli
```

2. **Login and Deploy:**
```bash
netlify login
netlify init
netlify deploy --prod
```

3. **Configure Build:**
Create `netlify.toml`:
```toml
[build]
  command = "pnpm build --filter=web"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Cost:**
- Starter: Free
- Pro: $19/month

---

#### Cloudflare Pages

**Why Cloudflare:**
- Global CDN (fastest)
- Unlimited bandwidth
- Workers integration
- Free tier generous

**Setup:**

1. **Connect Repository:**
- Go to Cloudflare Pages dashboard
- Connect GitHub repository
- Select `NodeJS-Starter-V1` repo

2. **Configure Build:**
```
Build command: cd apps/web && pnpm build
Build output: apps/web/.next
Root directory: /
```

3. **Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://your-backend.com
NODE_VERSION=20
```

**Cost:**
- Free: Unlimited (500 builds/month)
- Pro: $20/month (unlimited builds)

---

#### AWS Amplify

**Why AWS:**
- Deep AWS integration
- Custom domain SSL
- Preview environments
- CI/CD built-in

**Setup:**

1. **Install Amplify CLI:**
```bash
npm install -g @aws-amplify/cli
amplify configure
```

2. **Initialize:**
```bash
amplify init
amplify add hosting
amplify publish
```

3. **Configure:**
Create `amplify.yml`:
```yaml
version: 1
frontend:
  phases:
    build:
      commands:
        - cd apps/web
        - pnpm install
        - pnpm build
  artifacts:
    baseDirectory: apps/web/.next
    files:
      - '**/*'
```

**Cost:**
- Free tier: 1000 build minutes/month
- After: $0.01 per build minute

---

### Backend Deployment

The FastAPI backend can be deployed to various platforms:

#### DigitalOcean App Platform (Recommended)

**Why DigitalOcean:**
- Simple pricing
- Managed PostgreSQL
- Auto-scaling
- Free tier available

**Setup:**

1. **Create App:**
```bash
# Via DigitalOcean dashboard
# Or use doctl CLI
doctl apps create --spec .do/app.yaml
```

2. **App Spec (`.do/app.yaml`):**
```yaml
name: nodejs-starter-backend
services:
  - name: api
    source:
      repo: https://github.com/yourusername/NodeJS-Starter-V1
      branch: main
    dockerfile_path: apps/backend/Dockerfile
    http_port: 8000
    instance_count: 1
    instance_size_slug: basic-xxs

    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}
      - key: JWT_SECRET_KEY
        scope: RUN_TIME
        type: SECRET

databases:
  - name: db
    engine: PG
    version: "15"
```

3. **Deploy:**
```bash
doctl apps create-deployment <app-id>
```

**Cost:**
- Basic: $5/month (512MB RAM)
- Professional: $12/month (1GB RAM)
- Database: $15/month (managed PostgreSQL)

**Example Workflow:**
See `.github/workflows/examples/deploy-backend.yml.example`

---

#### Railway

**Why Railway:**
- Zero-config deployments
- PostgreSQL included
- Redis included
- Simple pricing

**Setup:**

1. **Install Railway CLI:**
```bash
npm i -g @railway/cli
```

2. **Login and Deploy:**
```bash
railway login
railway init
railway up
```

3. **Add Services:**
```bash
railway add postgresql
railway add redis
```

4. **Environment Variables:**
Railway auto-configures DATABASE_URL, REDIS_URL

**Cost:**
- Hobby: $5/month credit
- Developer: $10/month
- Team: $20/month

---

#### Fly.io

**Why Fly.io:**
- Global deployment
- Runs Docker containers
- PostgreSQL included
- Free tier available

**Setup:**

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login and Launch:**
```bash
fly auth login
fly launch
```

3. **Configure (`fly.toml`):**
```toml
app = "nodejs-starter-backend"

[build]
  dockerfile = "apps/backend/Dockerfile"

[env]
  PORT = "8000"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

4. **Add PostgreSQL:**
```bash
fly postgres create
fly postgres attach <postgres-app-name>
```

**Cost:**
- Free tier: 3 shared-cpu VMs
- Paid: $0.0000022/sec (≈$5.70/month)

---

#### Render

**Why Render:**
- Zero-config SSL
- Automatic deploys
- Background workers
- Free tier available

**Setup:**

1. **Create Blueprint (`render.yaml`):**
```yaml
services:
  - type: web
    name: nodejs-starter-api
    env: python
    buildCommand: "cd apps/backend && uv sync"
    startCommand: "cd apps/backend && uv run uvicorn src.api.main:app --host 0.0.0.0 --port $PORT"

    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: nodejs-starter-db
          property: connectionString
      - key: JWT_SECRET_KEY
        generateValue: true

databases:
  - name: nodejs-starter-db
    databaseName: starter_db
    user: starter_user
```

2. **Deploy:**
- Connect GitHub repo in Render dashboard
- Auto-deploys on push

**Cost:**
- Free tier: 750 hours/month
- Starter: $7/month
- Database: $7/month

---

### Database Deployment

#### Keep Docker (Recommended for Small Apps)

**Pros:**
- No additional cost
- Full control
- Simple backup/restore

**Cons:**
- Manual scaling
- Self-managed backups
- No automatic failover

**Setup:**
```bash
# Deploy Docker Compose on your server
docker compose up -d postgres redis

# Setup automated backups
0 2 * * * docker exec nodejs-starter-postgres pg_dump -U starter_user starter_db > /backups/db-$(date +\%Y\%m\%d).sql
```

---

#### Supabase (Managed PostgreSQL)

**Why Supabase:**
- Managed PostgreSQL
- Built-in pgvector
- Auto backups
- Free tier available

**Setup:**

1. **Create Project:**
- Go to supabase.com
- Create new project

2. **Update Environment:**
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

3. **Migrate Schema:**
```bash
cd apps/backend
uv run alembic upgrade head
```

**Cost:**
- Free: 500MB database
- Pro: $25/month (8GB database)

---

#### Neon

**Why Neon:**
- Serverless PostgreSQL
- Branch databases
- Auto-scaling
- Free tier generous

**Setup:**

1. **Create Database:**
- Go to neon.tech
- Create new project

2. **Get Connection String:**
```env
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```

**Cost:**
- Free: 0.5GB storage
- Pro: $19/month (10GB storage)

---

## 🔐 Optional External Services

### Codecov (Coverage Tracking)

**Purpose:** Track test coverage over time

**Setup:**

1. **Get Token:**
- Go to codecov.io
- Connect GitHub repository
- Copy CODECOV_TOKEN

2. **Add Secret:**
```bash
# GitHub repository → Settings → Secrets
CODECOV_TOKEN=xxx
```

3. **Update CI Workflow:**

Uncomment in `.github/workflows/ci.yml`:
```yaml
# Backend coverage
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./apps/backend/coverage.xml
    flags: backend

# Frontend coverage
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./apps/web/coverage/lcov.info
    flags: frontend
```

**Cost:**
- Open source: Free
- Private: $10/month (5 users)

---

### Snyk (Security Scanning)

**Purpose:** Automated vulnerability scanning

**Setup:**

1. **Get Token:**
- Go to snyk.io
- Create account
- Get API token from settings

2. **Add Secret:**
```bash
# GitHub repository → Settings → Secrets
SNYK_TOKEN=xxx
```

3. **Workflow:**
Already configured in `.github/workflows/security.yml`
- Only runs if SNYK_TOKEN exists
- Scans both frontend and backend

**Cost:**
- Free: 200 tests/month
- Team: $52/month (unlimited tests)

---

### Sentry (Error Tracking)

**Purpose:** Real-time error tracking and monitoring

**Setup:**

1. **Create Project:**
- Go to sentry.io
- Create Python project (backend)
- Create Next.js project (frontend)

2. **Install SDK:**
```bash
# Backend
cd apps/backend
uv add sentry-sdk[fastapi]

# Frontend
cd apps/web
pnpm add @sentry/nextjs
```

3. **Configure Backend (`apps/backend/src/api/main.py`):**
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

4. **Configure Frontend:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Environment:**
```env
# Backend
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Frontend
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Cost:**
- Developer: Free (5k errors/month)
- Team: $26/month (50k errors/month)

---

### PostHog (Analytics)

**Purpose:** Product analytics and feature flags

**Setup:**

1. **Create Project:**
- Go to posthog.com (or self-host)
- Get API key

2. **Install:**
```bash
cd apps/web
pnpm add posthog-js
```

3. **Configure (`apps/web/lib/analytics.ts`):**
```typescript
import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  })
}

export default posthog
```

4. **Environment:**
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Cost:**
- Free: 1M events/month
- Paid: $0.000225/event after free tier

---

### Resend (Email Service)

**Purpose:** Transactional emails

**Setup:**

1. **Get API Key:**
- Go to resend.com
- Get API key

2. **Install:**
```bash
cd apps/backend
uv add resend
```

3. **Configure (`apps/backend/src/services/email.py`):**
```python
from resend import Resend

resend = Resend(api_key=os.getenv("RESEND_API_KEY"))

async def send_email(to: str, subject: str, html: str):
    return resend.emails.send({
        "from": "noreply@yourdomain.com",
        "to": to,
        "subject": subject,
        "html": html,
    })
```

4. **Environment:**
```env
RESEND_API_KEY=re_xxx
```

**Cost:**
- Free: 3,000 emails/month
- Paid: $20/month (50,000 emails)

---

### Stripe (Payments)

**Purpose:** Payment processing

**Setup:**

1. **Get Keys:**
- Go to stripe.com
- Get publishable and secret keys

2. **Install:**
```bash
# Backend
cd apps/backend
uv add stripe

# Frontend
cd apps/web
pnpm add @stripe/stripe-js
```

3. **Configure Backend (`apps/backend/src/services/payments.py`):**
```python
import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

async def create_checkout_session(price_id: str, success_url: str, cancel_url: str):
    return stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
    )
```

4. **Configure Frontend:**
```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

5. **Environment:**
```env
# Backend
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Cost:**
- 2.9% + $0.30 per transaction

---

## 🤖 AI Service Upgrades

### Upgrade to Claude API

**When to Upgrade:**
- Need better quality responses
- Tool use is required
- Need 200K context window
- Have budget for API costs

**Setup:**

1. **Get API Key:**
- Go to console.anthropic.com
- Create account (requires email + phone)
- Create API key (starts with `sk-ant-`)

2. **Update Environment:**
```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
```

3. **Restart Backend:**
```bash
pnpm dev
```

The provider layer automatically switches from Ollama to Claude.

**Cost Comparison:**
- Ollama: FREE (local)
- Claude Haiku: $0.88/month (1000 requests)
- Claude Sonnet: $10.50/month (1000 requests)
- Claude Opus: $52.50/month (1000 requests)

See `AI_PROVIDERS.md` for detailed comparison.

---

### Add OpenAI Support (Optional)

**Setup:**

1. **Install SDK:**
```bash
cd apps/backend
uv add openai
```

2. **Create Provider (`apps/backend/src/models/openai_provider.py`):**
```python
from openai import AsyncOpenAI
from .base_provider import BaseLLMProvider

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def complete(self, prompt: str, system: str | None = None, **kwargs) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            **kwargs
        )
        return response.choices[0].message.content

    @property
    def provider_name(self) -> str:
        return "openai"
```

3. **Update Selector (`apps/backend/src/models/selector.py`):**
```python
case "openai":
    return OpenAIProvider(
        api_key=settings.openai_api_key,
        model="gpt-4"
    )
```

4. **Environment:**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
```

---

## 🏗️ Self-Hosting

### Docker Compose (Full Stack)

**Use Case:** Deploy entire stack on your own server

**Setup:**

1. **Update `docker-compose.yml` for Production:**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

2. **Create Dockerfiles:**

**Backend (`apps/backend/Dockerfile`):**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY apps/backend/pyproject.toml apps/backend/uv.lock ./
RUN uv sync --frozen

COPY apps/backend/ ./

CMD ["uv", "run", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend (`apps/web/Dockerfile`):**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/web/ ./apps/web/

RUN pnpm build --filter=web

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

RUN npm install -g pnpm && pnpm install --prod

CMD ["pnpm", "start", "--filter=web"]
```

3. **Deploy:**
```bash
# On your server
git clone https://github.com/yourusername/NodeJS-Starter-V1.git
cd NodeJS-Starter-V1

# Copy production environment
cp .env.example .env.production
# Edit .env.production with production values

# Build and start
docker compose --env-file .env.production up -d --build
```

---

### Kubernetes (Advanced)

**Use Case:** Large-scale production deployment

**Setup:**

Create Kubernetes manifests in `k8s/`:

**`k8s/postgres.yaml`:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: database
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

**Deploy:**
```bash
kubectl apply -f k8s/
```

---

## 📊 Monitoring & Observability

### Grafana + Prometheus

**Purpose:** Metrics and monitoring

**Setup:**

1. **Add to `docker-compose.yml`:**
```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

2. **Configure Prometheus (`prometheus.yml`):**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
```

3. **Add Metrics to Backend:**
```bash
cd apps/backend
uv add prometheus-client
```

```python
from prometheus_client import Counter, Histogram, make_asgi_app

request_count = Counter('http_requests_total', 'Total HTTP requests')
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

# Mount metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

---

## 🔒 Security Enhancements

### Let's Encrypt SSL (Free SSL Certificates)

**Setup with Certbot:**

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

### Fail2Ban (Brute Force Protection)

**Setup:**

```bash
# Install
sudo apt-get install fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit jail.local
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

---

## 📚 Additional Resources

- **Vercel Deployment:** https://vercel.com/docs
- **Railway Guide:** https://docs.railway.app
- **Fly.io Handbook:** https://fly.io/docs
- **DigitalOcean Tutorials:** https://docs.digitalocean.com
- **Docker Best Practices:** https://docs.docker.com/develop/dev-best-practices/
- **Kubernetes Documentation:** https://kubernetes.io/docs/

---

**Questions?** Check the main README or create an issue on GitHub.
