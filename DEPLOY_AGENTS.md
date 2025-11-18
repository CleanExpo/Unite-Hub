# 🚀 Quick Agent Deployment Guide

## Prerequisites

1. ✅ Migration 043 deployed
2. Docker and Docker Compose installed
3. Environment variables in `.env.local`

## Deployment Steps

### 1. Create Docker Network

```bash
docker network create unite-hub-network
```

### 2. Start RabbitMQ

```bash
cd d:\Unite-Hub
docker-compose -f docker-compose.agents.yml up -d rabbitmq
```

Wait 30 seconds, then verify:
```bash
docker-compose -f docker-compose.agents.yml logs rabbitmq | grep "Server startup complete"
```

### 3. Build All Agents

```bash
docker-compose -f docker-compose.agents.yml build
```

### 4. Start All Agents

```bash
docker-compose -f docker-compose.agents.yml up -d
```

### 5. Verify Status

```bash
docker-compose -f docker-compose.agents.yml ps
```

Expected: 11 agents + RabbitMQ running

## Monitoring

### View Logs
```bash
docker-compose -f docker-compose.agents.yml logs -f
```

### Check RabbitMQ UI
- URL: http://localhost:15672
- User: `unite_hub`
- Pass: `unite_hub_pass`

### Query Task Logs
```sql
SELECT * FROM autonomous_tasks ORDER BY executed_at DESC LIMIT 10;
```

## Troubleshooting

### Restart Agent
```bash
docker-compose -f docker-compose.agents.yml restart orchestrator-agent
```

### View Specific Agent Logs
```bash
docker-compose -f docker-compose.agents.yml logs orchestrator-agent
```

### Stop All
```bash
docker-compose -f docker-compose.agents.yml down
```

---

**Status**: Ready to deploy
**Total Agents**: 11
**Queues**: 11 configured in RabbitMQ

