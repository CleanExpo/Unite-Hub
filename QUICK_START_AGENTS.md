# 🚀 Quick Start: Multi-Agent System

**Status**: ✅ **RabbitMQ Running & Tested**

---

## ✅ What's Done

1. ✅ **RabbitMQ**: Running on localhost:5672
2. ✅ **Management UI**: http://localhost:15672 (unite_hub/unite_hub_pass)
3. ✅ **Connection**: Tested successfully
4. ✅ **Dependencies**: amqplib installed
5. ✅ **Configuration**: RabbitMQ config files created
6. ✅ **Agent Code**: 6 specialized agents ready

---

## 🎯 Next Steps

### Step 1: Run SQL Migration (Required)

The agents need 4 database tables to function. Run this once:

1. Open: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/editor/sql
2. Click **"New Query"**
3. Copy/paste contents of: `d:\Unite-Hub\supabase\migrations\100_multi_agent_system.sql`
4. Click **"Run"** ▶️

**Tables created:**
- `agent_tasks` - Task queue
- `agent_executions` - Execution history
- `agent_health` - Health monitoring
- `agent_metrics` - Analytics

### Step 2: Test a Simple Agent Locally

Before running in Docker, test locally:

```bash
# Set environment variables
$env:RABBITMQ_URL="amqp://unite_hub:unite_hub_pass@localhost:5672"
$env:NEXT_PUBLIC_SUPABASE_URL="https://lksfwktwtmyznckodsau.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-key-from-env-local"
$env:ANTHROPIC_API_KEY="your-key-from-env-local"

# Test email agent (simplest one)
node docker/agents/entrypoints/email-agent.mjs
```

**Expected output:**
```
🚀 Starting email-agent...
✅ email-agent connected to RabbitMQ
📥 Listening on queue: email_intelligence_queue
⚙️  Concurrency: 3
✅ email-agent is running
```

Press `Ctrl+C` to stop.

### Step 3: Send a Test Task

While the agent is running, in another terminal:

```javascript
// test-send-task.mjs
import amqplib from 'amqplib';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create task in database
const { data: task } = await supabase
  .from('agent_tasks')
  .insert({
    task_type: 'contact_scoring',
    payload: { contact_id: 'some-uuid' },
    workspace_id: 'your-workspace-id',
    priority: 5,
    status: 'pending'
  })
  .select()
  .single();

// Send to queue
const connection = await amqplib.connect('amqp://unite_hub:unite_hub_pass@localhost:5672');
const channel = await connection.createChannel();
channel.sendToQueue(
  'email_intelligence_queue',
  Buffer.from(JSON.stringify(task)),
  { persistent: true }
);

console.log('✅ Task sent!');
await channel.close();
await connection.close();
```

Run: `node test-send-task.mjs`

---

## 🐳 Option: Run Agents in Docker

**Note**: The Docker setup has a dependency issue with Redis. For now, run agents locally.

To fix Docker setup later:
1. Edit `docker-compose.agents.yml`
2. Remove `depends_on: redis` from orchestrator
3. OR: Start Redis from main docker-compose

---

## 📊 Monitoring

### RabbitMQ Management UI

**URL**: http://localhost:15672
**Login**: unite_hub / unite_hub_pass

**What to check:**
- **Connections**: Should see agents connected
- **Queues**: Should see 6 queues created
- **Overview**: Message rates, consumer activity

### Database Queries

```sql
-- Check agent health
SELECT * FROM agent_health ORDER BY last_heartbeat_at DESC;

-- View pending tasks
SELECT * FROM agent_tasks WHERE status = 'pending' ORDER BY priority DESC;

-- Check execution history
SELECT
  agent_name,
  status,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration
FROM agent_executions
GROUP BY agent_name, status;
```

---

## 🧪 Full Test Flow

### 1. Create Test Email

```sql
INSERT INTO client_emails (
  workspace_id,
  org_id,
  from_email,
  subject,
  snippet,
  received_at,
  direction,
  provider_message_id,
  intelligence_analyzed
) VALUES (
  'your-workspace-id',
  'your-org-id',
  'test@example.com',
  'Increase Revenue by 50%',
  'We need help with our marketing strategy to increase revenue by 50% in the next quarter.',
  NOW(),
  'inbound',
  'test-msg-' || gen_random_uuid(),
  false
);
```

### 2. Continuous Intelligence Agent Detects It

The continuous intelligence agent (if running) will:
1. Detect unanalyzed email every 5 minutes
2. Create a task in `agent_tasks`
3. Send task to orchestrator queue
4. Orchestrator routes to email agent
5. Email agent extracts intelligence
6. Intelligence saved to `email_intelligence` table

### 3. Verify Results

```sql
-- Check task was created
SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT 1;

-- Check execution
SELECT * FROM agent_executions ORDER BY created_at DESC LIMIT 1;

-- Check intelligence extracted
SELECT * FROM email_intelligence ORDER BY analyzed_at DESC LIMIT 1;
```

---

## 🎯 Current Status

✅ **RabbitMQ**: Running perfectly
✅ **Test Connection**: Successful
✅ **Agent Code**: Ready
✅ **Dependencies**: Installed
⏳ **SQL Migration**: Awaiting user
⏳ **Docker Setup**: Has Redis dependency issue (use local for now)

---

## 💡 Recommendations

**For immediate testing:**
1. ✅ Run SQL migration in Supabase Dashboard
2. ✅ Test one agent locally (email-agent)
3. ✅ Send a test task
4. ✅ Verify processing in RabbitMQ UI

**For production:**
1. Fix Docker compose dependencies
2. Add Redis to docker-compose.agents.yml
3. Add monitoring dashboards
4. Set up log aggregation

---

## 📚 Full Documentation

- **Complete Guide**: [MULTI_AGENT_SYSTEM_GUIDE.md](MULTI_AGENT_SYSTEM_GUIDE.md)
- **Implementation Summary**: [AGENTS_IMPLEMENTATION_SUMMARY.md](AGENTS_IMPLEMENTATION_SUMMARY.md)
- **Model Router**: [INTEGRATION_GUIDE_MODEL_ROUTER.md](INTEGRATION_GUIDE_MODEL_ROUTER.md)

---

## 🆘 Troubleshooting

**Agent won't start:**
- Check RabbitMQ is running: `docker ps | findstr rabbitmq`
- Check environment variables are set
- Check Supabase credentials

**Can't connect to RabbitMQ:**
```bash
node test-rabbitmq.mjs
```

**View RabbitMQ logs:**
```bash
docker logs unite-hub-rabbitmq
```

**Stop RabbitMQ:**
```bash
docker stop unite-hub-rabbitmq
docker rm unite-hub-rabbitmq
```

**Restart fresh:**
```bash
docker stop unite-hub-rabbitmq && docker rm unite-hub-rabbitmq
docker run -d --name unite-hub-rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=unite_hub -e RABBITMQ_DEFAULT_PASS=unite_hub_pass rabbitmq:3-management-alpine
```

---

**Last Updated**: 2025-01-18
**Status**: ✅ **Ready for SQL Migration → Local Testing**
