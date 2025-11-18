# 🤖 Unite-Hub Multi-Agent System Guide

## Overview

Unite-Hub uses a **Docker-based multi-agent architecture** where specialized AI agents run in separate containers, communicating via RabbitMQ message queues.

### Architecture

```
┌─────────────────┐
│  Orchestrator   │ ← Routes tasks to specialized agents
└────────┬────────┘
         │
    ┌────▼─────┐
    │ RabbitMQ │ ← Message broker (async communication)
    └────┬─────┘
         │
   ┌─────┴──────────────────┐
   │                        │
┌──▼───────┐        ┌──────▼────┐
│  Email   │        │  Content  │
│  Agent   │        │   Agent   │
│  (x2)    │        │   (x1)    │
└──────────┘        └───────────┘
┌──────────┐        ┌───────────┐
│ Campaign │        │ Strategy  │
│  Agent   │        │   Agent   │
│  (x2)    │        │   (x1)    │
└──────────┘        └───────────┘
┌──────────────────────────────┐
│ Continuous Intelligence Agent│
│  (Background Monitor)         │
└───────────────────────────────┘
```

---

## Quick Start

### 1. Prerequisites

- ✅ Docker & Docker Compose installed
- ✅ `.env.local` file with Supabase credentials
- ✅ Run SQL migration 100 (in Supabase Dashboard)

### 2. Start Multi-Agent System

**Windows:**
```bash
.\start-agents.bat
```

**Linux/Mac:**
```bash
chmod +x start-agents.sh
./start-agents.sh
```

### 3. Verify Agents Running

```bash
docker-compose -f docker-compose.agents.yml ps
```

Expected output:
```
NAME                           STATUS              PORTS
unite-hub-rabbitmq             Up (healthy)        5672, 15672
unite-hub-orchestrator         Up
unite-hub-email-agent-1        Up
unite-hub-email-agent-2        Up
unite-hub-content-agent        Up
unite-hub-campaign-agent-1     Up
unite-hub-campaign-agent-2     Up
unite-hub-strategy-agent       Up
unite-hub-continuous-intelligence Up
```

---

## Agent Specifications

### 1. **Orchestrator Agent**
- **Purpose**: Routes tasks to specialized worker agents
- **Queue**: `orchestrator_queue`
- **Replicas**: 1
- **Concurrency**: 5 tasks simultaneously

### 2. **Email Intelligence Agent**
- **Purpose**: Extract intelligence from emails, score contacts
- **Queue**: `email_intelligence_queue`
- **Replicas**: 2 (load balanced)
- **Concurrency**: 3 per replica
- **Model**: Claude Haiku (cost-optimized)

### 3. **Content Generation Agent**
- **Purpose**: Generate personalized marketing content
- **Queue**: `content_generation_queue`
- **Replicas**: 1 (Extended Thinking is expensive)
- **Concurrency**: 2
- **Model**: Claude Opus 4 with Extended Thinking (7500 tokens)

### 4. **Campaign Optimization Agent**
- **Purpose**: Analyze campaigns and provide optimization recommendations
- **Queue**: `campaign_optimization_queue`
- **Replicas**: 2
- **Concurrency**: 3 per replica
- **Model**: Claude Sonnet (balanced)

### 5. **Strategy Generation Agent**
- **Purpose**: Create comprehensive 90-day marketing strategies
- **Queue**: `strategy_generation_queue`
- **Replicas**: 1
- **Concurrency**: 1 (Extended Thinking)
- **Model**: Claude Opus 4 with Extended Thinking (10,000 tokens)

### 6. **Continuous Intelligence Agent**
- **Purpose**: Monitor new emails/media, trigger automatic analysis
- **Queue**: `continuous_monitoring_queue`
- **Replicas**: 1 (background worker)
- **Check Interval**: 5 minutes

---

## Creating Tasks

### Via API (from Next.js app)

```typescript
// Create a task
const { data: task } = await supabase
  .from('agent_tasks')
  .insert({
    task_type: 'email_intelligence',
    payload: {
      email_id: 'uuid-here',
      contact_id: 'uuid-here'
    },
    workspace_id: 'workspace-uuid',
    priority: 7, // 1-10 (10 = highest)
    status: 'pending'
  })
  .select()
  .single();

// Send to orchestrator
await channel.sendToQueue(
  'orchestrator_queue',
  Buffer.from(JSON.stringify(task)),
  { persistent: true, priority: task.priority }
);
```

### Supported Task Types

| Task Type | Description | Handled By |
|-----------|-------------|------------|
| `email_intelligence` | Extract intelligence from email | Email Agent |
| `contact_scoring` | Calculate lead score (0-100) | Email Agent |
| `content_generation` | Generate personalized content | Content Agent |
| `campaign_optimization` | Analyze campaign performance | Campaign Agent |
| `strategy_generation` | Create 90-day marketing strategy | Strategy Agent |

---

## Monitoring

### 1. RabbitMQ Management UI

Access: **http://localhost:15672**

Login:
- Username: `unite_hub` (from .env.local)
- Password: `unite_hub_pass`

Features:
- View queue depths
- Monitor message rates
- Track consumer activity
- View connections

### 2. Agent Logs

**View all agent logs:**
```bash
docker-compose -f docker-compose.agents.yml logs -f
```

**View specific agent:**
```bash
docker-compose -f docker-compose.agents.yml logs -f email-agent
```

### 3. Database Monitoring

**Check agent health:**
```sql
SELECT * FROM agent_health ORDER BY last_heartbeat_at DESC;
```

**View pending tasks:**
```sql
SELECT * FROM agent_tasks WHERE status = 'pending' ORDER BY priority DESC, created_at ASC;
```

**Check execution history:**
```sql
SELECT
  agent_name,
  status,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration_ms
FROM agent_executions
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY agent_name, status;
```

**View agent metrics:**
```sql
SELECT * FROM agent_metrics
WHERE metric_date = CURRENT_DATE
ORDER BY agent_name, metric_hour DESC;
```

---

## Troubleshooting

### Agent Not Starting

**Check logs:**
```bash
docker-compose -f docker-compose.agents.yml logs orchestrator-agent
```

**Common issues:**
- Missing environment variables
- RabbitMQ connection failed
- Supabase credentials invalid

### Tasks Not Processing

1. **Check if agents are running:**
   ```bash
   docker-compose -f docker-compose.agents.yml ps
   ```

2. **Check RabbitMQ queues:**
   - Go to http://localhost:15672
   - Click "Queues" tab
   - Verify messages are being consumed

3. **Check database tasks:**
   ```sql
   SELECT status, COUNT(*) FROM agent_tasks GROUP BY status;
   ```

### High Memory Usage

**Limit agent resources:**
Edit `docker-compose.agents.yml`:
```yaml
email-agent:
  deploy:
    resources:
      limits:
        memory: 512M
      reservations:
        memory: 256M
```

### Restart Specific Agent

```bash
docker-compose -f docker-compose.agents.yml restart email-agent
```

---

## Scaling

### Increase Agent Replicas

Edit `docker-compose.agents.yml`:
```yaml
email-agent:
  deploy:
    replicas: 4  # Increase from 2 to 4
```

Restart:
```bash
docker-compose -f docker-compose.agents.yml up -d --scale email-agent=4
```

### Add New Specialized Agent

1. **Create Dockerfile**: `docker/agents/Dockerfile.new-agent`
2. **Create entrypoint**: `docker/agents/entrypoints/new-agent.mjs`
3. **Add to `docker-compose.agents.yml`**
4. **Update orchestrator routing**: `orchestrator.mjs`

---

## Environment Variables

### Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key

# OpenRouter (optional, for cost optimization)
OPENROUTER_API_KEY_2=sk-or-v1-your-key
```

### Optional

```env
# RabbitMQ
RABBITMQ_USER=unite_hub
RABBITMQ_PASSWORD=unite_hub_pass

# Agent Configuration
ORCHESTRATOR_CONCURRENCY=5
EMAIL_AGENT_CONCURRENCY=3
CONTENT_AGENT_CONCURRENCY=2
CAMPAIGN_AGENT_CONCURRENCY=3
STRATEGY_AGENT_CONCURRENCY=1

# Continuous Intelligence
MONITOR_INTERVAL_SECONDS=300
LOOKBACK_MINUTES=5
```

---

## Cost Optimization

### Model Router

All agents use the model router (`src/lib/agents/model-router.ts`) for cost optimization:

- **Ultra-cheap tasks** (intent, tags) → Gemini Flash Lite ($0.00002/call)
- **Budget tasks** (email intel, scoring) → Claude Haiku ($0.002/call)
- **Standard tasks** (personas, strategies) → Claude Sonnet ($0.02/call)
- **Premium tasks** (content, strategies) → Claude Opus with Extended Thinking ($10/call)

### Monitoring Costs

```sql
SELECT
  agent_name,
  SUM(cost_estimate_usd) as total_cost,
  COUNT(*) as execution_count
FROM agent_executions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY agent_name
ORDER BY total_cost DESC;
```

---

## Production Deployment

### Recommended Configuration

- **Orchestrator**: 1 replica, 5 concurrency
- **Email Agent**: 3-5 replicas, 3 concurrency each
- **Content Agent**: 1-2 replicas, 2 concurrency each
- **Campaign Agent**: 2-3 replicas, 3 concurrency each
- **Strategy Agent**: 1 replica, 1 concurrency
- **Continuous Intelligence**: 1 replica

### Security

1. **Change RabbitMQ credentials** in production
2. **Use strong passwords** for RabbitMQ
3. **Enable TLS** for RabbitMQ connections
4. **Restrict RabbitMQ management UI** access

---

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.agents.yml logs`
- View agent health: `SELECT * FROM agent_health;`
- RabbitMQ UI: http://localhost:15672

---

**Last Updated**: 2025-01-18
**Version**: 1.0.0
