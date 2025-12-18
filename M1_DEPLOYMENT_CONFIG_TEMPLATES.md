# M1 Deployment Configuration Templates

**Version**: v2.2.0
**Purpose**: Ready-to-use configuration templates for various deployment scenarios
**Last Updated**: 2025-12-18

---

## Quick Reference

- [Local Development](#local-development-setup)
- [Staging Environment](#staging-environment-setup)
- [Production Environment](#production-environment-setup)
- [High Availability Setup](#high-availability-setup)
- [Cost-Optimized Setup](#cost-optimized-setup)

---

## Local Development Setup

### Environment File (`.env.local`)

```bash
# M1 Agent Configuration - LOCAL DEVELOPMENT
NODE_ENV=development
LOG_LEVEL=debug

# JWT Configuration
M1_JWT_SECRET="local-development-secret-key-not-secure"
M1_JWT_ALGORITHM="HS256"
M1_APPROVAL_TOKEN_TTL_MINUTES=30

# Claude API
ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Convex Database (Local)
CONVEX_URL="http://localhost:3210"
NEXT_PUBLIC_CONVEX_URL="http://localhost:3210"

# Redis (Optional - use Docker)
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_TLS="false"

# Feature Flags
ENABLE_REDIS_CACHING="true"
ENABLE_DISTRIBUTED_CACHE="false"  # Disable in local dev
ENABLE_DASHBOARD_API="true"

# Monitoring
METRICS_EXPORT_INTERVAL_MS=60000
PROMETHEUS_METRICS_ENABLED="true"

# Cost Tracking
COST_TRACKING_ENABLED="true"
COST_ALERT_THRESHOLD="1000.00"

# Rate Limiting (Permissive for local)
RATE_LIMIT_REQUESTS_PER_MINUTE=10000
RATE_LIMIT_REQUESTS_PER_HOUR=100000
```

### Docker Compose (for local Redis)

```yaml
# docker-compose.local.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    environment:
      - REDIS_PASSWORD=""

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: m1_dev
      POSTGRES_USER: m1_dev
      POSTGRES_PASSWORD: dev_password_local_only
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

**Start Local Stack**:
```bash
docker-compose -f docker-compose.local.yml up -d
npm run dev
```

---

## Staging Environment Setup

### Environment File (`.env.staging`)

```bash
# M1 Agent Configuration - STAGING
NODE_ENV=staging
LOG_LEVEL=info

# JWT Configuration - Use strong secret
M1_JWT_SECRET="$(openssl rand -base64 32)"
M1_JWT_ALGORITHM="HS256"
M1_APPROVAL_TOKEN_TTL_MINUTES=10

# Claude API
ANTHROPIC_API_KEY="your-staging-api-key"

# Convex Database (Staging)
CONVEX_URL="https://staging-convex-url.convex.site"
NEXT_PUBLIC_CONVEX_URL="https://staging-convex-url.convex.site"

# Redis (Staging Tier)
REDIS_URL="redis://staging-redis.cache.amazonaws.com:6379"
REDIS_PASSWORD="staging-redis-password"
REDIS_TLS="true"
REDIS_MAX_RETRIES="3"
REDIS_RETRY_DELAY_MS="100"

# Feature Flags
ENABLE_REDIS_CACHING="true"
ENABLE_DISTRIBUTED_CACHE="true"
ENABLE_DASHBOARD_API="true"

# Monitoring
METRICS_EXPORT_INTERVAL_MS=30000
PROMETHEUS_METRICS_ENABLED="true"
LOG_LEVEL=info

# Cost Tracking
COST_TRACKING_ENABLED="true"
COST_ALERT_THRESHOLD="500.00"
COST_DAILY_ALERT_THRESHOLD="100.00"

# Rate Limiting (Moderate)
RATE_LIMIT_REQUESTS_PER_MINUTE=600
RATE_LIMIT_REQUESTS_PER_HOUR=30000

# Security
ALLOWED_ORIGINS="https://staging.your-domain.com,https://admin-staging.your-domain.com"
CORS_CREDENTIALS="true"

# Performance
CACHE_MAX_SIZE="500000000"  # 500MB
CACHE_MAX_ENTRIES="50000"
CACHE_TTL_SECONDS="3600"    # 1 hour
```

### Kubernetes Deployment (Staging)

```yaml
# k8s-staging.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: m1-staging

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: m1-config
  namespace: m1-staging
data:
  convex-url: "https://staging-convex-url.convex.site"
  redis-url: "redis://staging-redis:6379"
  log-level: "info"
  enable-redis-caching: "true"
  enable-distributed-cache: "true"

---
apiVersion: v1
kind: Secret
metadata:
  name: m1-secrets
  namespace: m1-staging
type: Opaque
stringData:
  jwt-secret: "$(openssl rand -base64 32)"
  anthropic-api-key: "your-staging-api-key"
  redis-password: "staging-redis-password"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m1-agent-staging
  namespace: m1-staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: m1-agent
      env: staging
  template:
    metadata:
      labels:
        app: m1-agent
        env: staging
    spec:
      containers:
      - name: m1-agent
        image: your-registry/m1-agent:v2.2.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000

        env:
        - name: NODE_ENV
          value: "staging"
        - name: M1_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: m1-secrets
              key: jwt-secret
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: m1-secrets
              key: anthropic-api-key
        - name: CONVEX_URL
          valueFrom:
            configMapKeyRef:
              name: m1-config
              key: convex-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: m1-config
              key: redis-url
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: m1-secrets
              key: redis-password
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: m1-config
              key: log-level

        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"

        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 30

        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: m1-agent-service
  namespace: m1-staging
spec:
  type: LoadBalancer
  selector:
    app: m1-agent
    env: staging
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

**Deploy to Staging**:
```bash
kubectl apply -f k8s-staging.yaml
kubectl wait --for=condition=available deployment/m1-agent-staging -n m1-staging
kubectl get svc -n m1-staging
```

---

## Production Environment Setup

### Environment File (`.env.production`)

```bash
# M1 Agent Configuration - PRODUCTION
NODE_ENV=production
LOG_LEVEL=warn

# JWT Configuration - Use AWS Secrets Manager or similar
# Never commit production secrets
M1_JWT_SECRET="${AWS_SECRET_M1_JWT_SECRET}"
M1_JWT_ALGORITHM="HS256"
M1_APPROVAL_TOKEN_TTL_MINUTES=5

# Claude API
ANTHROPIC_API_KEY="${AWS_SECRET_ANTHROPIC_API_KEY}"

# Convex Database (Production)
CONVEX_URL="https://production-convex-url.convex.site"
NEXT_PUBLIC_CONVEX_URL="https://production-convex-url.convex.site"

# Redis (Production - Managed Service)
REDIS_URL="redis://prod-redis-cluster.cache.amazonaws.com:6379"
REDIS_PASSWORD="${AWS_SECRET_REDIS_PASSWORD}"
REDIS_TLS="true"
REDIS_TLS_REJECT_UNAUTHORIZED="true"
REDIS_MAX_RETRIES="5"
REDIS_RETRY_DELAY_MS="200"
REDIS_CONNECT_TIMEOUT_MS="5000"
REDIS_COMMAND_TIMEOUT_MS="3000"

# Feature Flags - All enabled in production
ENABLE_REDIS_CACHING="true"
ENABLE_DISTRIBUTED_CACHE="true"
ENABLE_DASHBOARD_API="true"

# Monitoring & Logging
METRICS_EXPORT_INTERVAL_MS=30000
PROMETHEUS_METRICS_ENABLED="true"
LOG_LEVEL=warn
STRUCTURED_LOGGING_ENABLED="true"
LOG_RETENTION_DAYS=90

# Cost Tracking
COST_TRACKING_ENABLED="true"
COST_ALERT_THRESHOLD="1000.00"
COST_DAILY_ALERT_THRESHOLD="500.00"
COST_WEEKLY_ALERT_THRESHOLD="3500.00"

# Rate Limiting (Strict)
RATE_LIMIT_REQUESTS_PER_MINUTE=300
RATE_LIMIT_REQUESTS_PER_HOUR=15000

# Security
ALLOWED_ORIGINS="https://your-domain.com,https://api.your-domain.com"
CORS_CREDENTIALS="true"
CORS_MAX_AGE=86400

# Performance - Aggressive caching
CACHE_MAX_SIZE="2000000000"  # 2GB
CACHE_MAX_ENTRIES="500000"
CACHE_TTL_SECONDS="7200"     # 2 hours
CACHE_EVICTION_POLICY="lru"

# Alerts
ALERT_EMAIL_RECIPIENTS="ops-team@your-domain.com"
ALERT_SLACK_WEBHOOK="${AWS_SECRET_SLACK_WEBHOOK}"
ALERT_PAGERDUTY_INTEGRATION_KEY="${AWS_SECRET_PAGERDUTY_KEY}"

# SLA
AVAILABILITY_SLA_PERCENT=99.9
ERROR_RATE_THRESHOLD_PERCENT=0.5
LATENCY_P95_THRESHOLD_MS=500
```

### Kubernetes Deployment (Production HA)

```yaml
# k8s-production.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: m1-production

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: m1-agent-pdb
  namespace: m1-production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: m1-agent
      env: production

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: m1-config
  namespace: m1-production
data:
  convex-url: "https://production-convex-url.convex.site"
  redis-url: "redis://prod-redis-cluster.cache.amazonaws.com:6379"
  log-level: "warn"
  enable-redis-caching: "true"
  enable-distributed-cache: "true"
  cache-max-size: "2000000000"
  cache-max-entries: "500000"

---
apiVersion: v1
kind: Secret
metadata:
  name: m1-secrets
  namespace: m1-production
type: Opaque
stringData:
  jwt-secret: "$(aws secretsmanager get-secret-value --secret-id m1/jwt-secret --query SecretString --output text)"
  anthropic-api-key: "$(aws secretsmanager get-secret-value --secret-id m1/anthropic-api-key --query SecretString --output text)"
  redis-password: "$(aws secretsmanager get-secret-value --secret-id m1/redis-password --query SecretString --output text)"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m1-agent-production
  namespace: m1-production
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: m1-agent
      env: production
  template:
    metadata:
      labels:
        app: m1-agent
        env: production
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - m1-agent
              topologyKey: kubernetes.io/hostname

      containers:
      - name: m1-agent
        image: your-registry/m1-agent:v2.2.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 9090
          name: metrics

        env:
        - name: NODE_ENV
          value: "production"
        - name: M1_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: m1-secrets
              key: jwt-secret
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: m1-secrets
              key: anthropic-api-key
        - name: CONVEX_URL
          valueFrom:
            configMapKeyRef:
              name: m1-config
              key: convex-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: m1-config
              key: redis-url
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: m1-secrets
              key: redis-password
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: m1-config
              key: log-level

        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"

        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 20
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3

        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 2

        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL

---
apiVersion: v1
kind: Service
metadata:
  name: m1-agent-service
  namespace: m1-production
  labels:
    app: m1-agent
spec:
  type: LoadBalancer
  selector:
    app: m1-agent
    env: production
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 3000
  - name: metrics
    protocol: TCP
    port: 9090
    targetPort: 9090

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: m1-agent-hpa
  namespace: m1-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: m1-agent-production
  minReplicas: 5
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Deploy to Production**:
```bash
# Create secrets from AWS Secrets Manager
kubectl create secret generic m1-secrets \
  --from-literal=jwt-secret="$(aws secretsmanager get-secret-value --secret-id m1/jwt-secret --query SecretString --output text)" \
  --from-literal=anthropic-api-key="$(aws secretsmanager get-secret-value --secret-id m1/anthropic-api-key --query SecretString --output text)" \
  --from-literal=redis-password="$(aws secretsmanager get-secret-value --secret-id m1/redis-password --query SecretString --output text)" \
  -n m1-production

# Deploy
kubectl apply -f k8s-production.yaml

# Monitor rollout
kubectl rollout status deployment/m1-agent-production -n m1-production

# Verify
kubectl get pods -n m1-production
kubectl get svc -n m1-production
```

---

## High Availability Setup

This configuration provides maximum reliability and performance.

```yaml
# k8s-ha.yaml
---
# Multi-region Redis setup with Sentinel
apiVersion: v1
kind: ConfigMap
metadata:
  name: m1-ha-config
  namespace: m1-production
data:
  redis-sentinel-config: |
    port 26379
    sentinel monitor m1-redis 172.20.1.10 6379 2
    sentinel down-after-milliseconds m1-redis 5000
    sentinel parallel-syncs m1-redis 1
    sentinel failover-timeout m1-redis 10000

---
# Database backup and recovery configuration
apiVersion: batch/v1
kind: CronJob
metadata:
  name: m1-database-backup
  namespace: m1-production
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: your-registry/m1-backup:v1
            env:
            - name: CONVEX_URL
              valueFrom:
                configMapKeyRef:
                  name: m1-config
                  key: convex-url
            command:
            - /bin/sh
            - -c
            - |
              npx convex export > /backups/m1-backup-$(date +%Y%m%d).json
              aws s3 cp /backups/m1-backup-$(date +%Y%m%d).json s3://m1-backups/
          restartPolicy: OnFailure

---
# Network Policy for M1
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: m1-agent-policy
  namespace: m1-production
spec:
  podSelector:
    matchLabels:
      app: m1-agent
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ingress-controller
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443  # HTTPS
    - protocol: TCP
      port: 6379  # Redis
```

---

## Cost-Optimized Setup

This configuration minimizes costs while maintaining functionality.

```bash
# .env.cost-optimized
NODE_ENV=production
LOG_LEVEL=error  # Less verbose logging = smaller logs

# Use cheaper Claude model
AGENT_MODEL="claude-haiku-4"

# Reduce cache size to save memory
CACHE_MAX_SIZE="250000000"  # 250MB instead of 2GB
CACHE_MAX_ENTRIES="50000"

# Aggressive cache TTL to reduce Redis memory
CACHE_TTL_SECONDS="1800"  # 30 minutes

# Disable expensive features if not needed
ENABLE_DISTRIBUTED_CACHE="false"  # Use local cache only
COST_TRACKING_ENABLED="false"  # Less logging

# Scale down deployment
DEPLOYMENT_REPLICAS=2
CACHE_UPDATE_FREQUENCY_MS=300000  # Less frequent updates

# Use spot instances (if on cloud)
SPOT_INSTANCES_ENABLED="true"
```

**K8s Configuration**:
```yaml
spec:
  replicas: 2  # Minimal replicas
  template:
    spec:
      nodeSelector:
        karpenter.sh/capacity-type: spot  # Use cheaper spot instances
      tolerations:
      - key: spotInstance
        operator: Equal
        value: "true"
        effect: NoSchedule

      containers:
      - name: m1-agent
        resources:
          requests:
            memory: "128Mi"  # Minimal
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        env:
        - name: NODE_ENV
          value: "production"
        - name: AGENT_MODEL
          value: "claude-haiku-4"  # Cheaper model
```

---

## Configuration Checklist

Use this checklist to verify your configuration before deployment:

- [ ] All required environment variables set
- [ ] Secrets stored in secure vault (not in code)
- [ ] Database connectivity verified
- [ ] Redis connectivity verified (if enabled)
- [ ] API keys valid and rotated recently
- [ ] TLS/SSL certificates valid and not expiring soon
- [ ] Rate limiting configured appropriately
- [ ] CORS origins restricted to known domains
- [ ] Logging configured at appropriate level
- [ ] Monitoring alerts configured
- [ ] Backup and recovery procedures tested
- [ ] Rollback procedures tested
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Cost estimates reviewed and approved

---

*Last Updated: 2025-12-18*
*Version: 2.2.0 (m1-production-hardening-v9)*
