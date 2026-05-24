# Notification System

> Multi-channel notification orchestration with queue-backed delivery for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `notification-system`                                    |
| **Category**   | Communication & Reporting                                |
| **Complexity** | Medium                                                   |
| **Complements**| `queue-worker`, `email-template`, `webhook-handler`      |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies multi-channel notification patterns for NodeJS-Starter-V1: unified notification dispatch across email, in-app, and webhook channels, queue-backed delivery with the existing Redis infrastructure, user preference management, notification templates, delivery tracking, and real-time in-app notification streaming via the Status Command Centre.

---

## When to Apply

### Positive Triggers

- Sending notifications across multiple channels (email + in-app + webhook)
- Building a notification preference system for users
- Adding delivery tracking and retry for failed notifications
- Integrating notifications with the Status Command Centre
- Implementing notification templates for recurring events
- Queuing notifications for background delivery

### Negative Triggers

- Transactional email design and layout (use `email-template` skill)
- Webhook signature verification (use `webhook-handler` skill)
- Background job processing infrastructure (use `queue-worker` skill)
- Real-time dashboard data streaming (use `dashboard-patterns` skill)

---

## Core Principles

### The Three Laws of Notifications

1. **Respect User Preferences**: Every notification must check user preferences before delivery. Users can opt out of any non-critical channel.
2. **Queue Everything**: Never send notifications synchronously in the request path. Enqueue to Redis and deliver in background workers.
3. **Track Every Delivery**: Record delivery status (sent, delivered, failed, read) for every notification. Failed deliveries retry; permanent failures alert ops.

---

## Pattern 1: Notification Event Schema (Python)

### Typed Notification Model

```python
from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class NotificationChannel(str, Enum):
    EMAIL = "email"
    IN_APP = "in_app"
    WEBHOOK = "webhook"


class NotificationPriority(str, Enum):
    LOW = "low"        # Digest-eligible, can batch
    NORMAL = "normal"  # Send within minutes
    HIGH = "high"      # Send immediately
    CRITICAL = "critical"  # Bypass preferences, always deliver


class NotificationEvent(BaseModel):
    """A notification to be dispatched across channels."""

    id: str = Field(default_factory=lambda: str(__import__("uuid").uuid4()))
    event_type: str  # e.g., "task.completed", "agent.escalated"
    recipient_id: str
    channels: list[NotificationChannel]
    priority: NotificationPriority = NotificationPriority.NORMAL
    subject: str
    body: str
    data: dict[str, Any] = Field(default_factory=dict)
    template_id: str | None = None
```

---

## Pattern 2: Notification Dispatcher

### Channel Router with Preference Checking

```python
from src.utils import get_logger

logger = get_logger(__name__)


class NotificationDispatcher:
    """Routes notifications to appropriate channel handlers."""

    def __init__(self, preference_store, email_sender, in_app_store, webhook_sender) -> None:
        self.preferences = preference_store
        self.handlers = {
            NotificationChannel.EMAIL: email_sender,
            NotificationChannel.IN_APP: in_app_store,
            NotificationChannel.WEBHOOK: webhook_sender,
        }

    async def dispatch(self, event: NotificationEvent) -> dict:
        """Dispatch notification to all requested channels."""
        results = {}
        prefs = await self.preferences.get(event.recipient_id)

        for channel in event.channels:
            # Critical notifications bypass preferences
            if event.priority != NotificationPriority.CRITICAL:
                if not prefs.is_enabled(channel, event.event_type):
                    results[channel.value] = "skipped_preference"
                    continue

            handler = self.handlers.get(channel)
            if not handler:
                results[channel.value] = "no_handler"
                continue

            try:
                await handler.send(event)
                results[channel.value] = "sent"
            except Exception as e:
                logger.error("notification_failed", channel=channel.value, error=str(e))
                results[channel.value] = "failed"

        return results
```

---

## Pattern 3: User Preferences

### Preference Model and Storage

```python
class ChannelPreference(BaseModel):
    """Per-channel notification preferences."""

    enabled: bool = True
    muted_event_types: list[str] = Field(default_factory=list)
    quiet_hours_start: int | None = None  # Hour (0-23) in user's timezone
    quiet_hours_end: int | None = None


class UserNotificationPreferences(BaseModel):
    """User's notification preferences across all channels."""

    user_id: str
    email: ChannelPreference = Field(default_factory=ChannelPreference)
    in_app: ChannelPreference = Field(default_factory=ChannelPreference)
    webhook: ChannelPreference = Field(default_factory=ChannelPreference)

    def is_enabled(self, channel: NotificationChannel, event_type: str) -> bool:
        pref = getattr(self, channel.value, ChannelPreference())
        if not pref.enabled:
            return False
        if event_type in pref.muted_event_types:
            return False
        return True
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications/preferences` | Get current user's preferences |
| `PUT` | `/api/notifications/preferences` | Update preferences |
| `GET` | `/api/notifications` | List user's in-app notifications |
| `PATCH` | `/api/notifications/{id}/read` | Mark notification as read |
| `POST` | `/api/notifications/read-all` | Mark all as read |

---

## Pattern 4: Queue-Backed Delivery

### Redis Queue Integration

```python
async def enqueue_notification(redis, event: NotificationEvent) -> str:
    """Enqueue notification for background delivery."""
    import json

    queue_key = "notifications:queue"
    if event.priority == NotificationPriority.HIGH:
        queue_key = "notifications:priority"
    elif event.priority == NotificationPriority.CRITICAL:
        queue_key = "notifications:critical"

    await redis.lpush(queue_key, json.dumps(event.model_dump()))
    return event.id
```

### Worker Processing

```python
async def process_notification_queue(redis, dispatcher: NotificationDispatcher) -> None:
    """Background worker that processes notification queue."""
    queues = ["notifications:critical", "notifications:priority", "notifications:queue"]

    for queue in queues:
        while True:
            raw = await redis.rpop(queue)
            if not raw:
                break
            event = NotificationEvent(**__import__("json").loads(raw))
            result = await dispatcher.dispatch(event)
            await store_delivery_result(redis, event.id, result)
```

**Complements**: `queue-worker` skill — use the arq worker infrastructure for production. The notification worker is a specialised instance of the generic queue worker pattern with priority queues.

**Project Reference**: `docker-compose.yml:23-34` — Redis 7-alpine on port 6380/6379. Use the same instance for notification queues alongside rate limiting and idempotency.

---

## Pattern 5: In-App Notifications (TypeScript)

### Real-Time Stream Integration

```typescript
interface InAppNotification {
  id: string;
  eventType: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial notifications
    apiClient.get<InAppNotification[]>("/api/notifications").then(setNotifications);

    // Subscribe to real-time updates (Supabase Realtime or SSE)
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new as InAppNotification, ...prev]);
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markRead = async (id: string) => {
    await apiClient.patch(`/api/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return { notifications, unreadCount, markRead };
}
```

**Project Reference**: `apps/web/components/status-command-centre/components/NotificationStream.tsx` — the existing component renders a notification timeline with spectral colours and Framer Motion. The `useNotifications` hook provides the data layer that feeds into this component.

---

## Pattern 6: Notification Templates

### Event-to-Template Mapping

```python
NOTIFICATION_TEMPLATES: dict[str, dict[str, str]] = {
    "task.completed": {
        "subject": "Task completed: {task_name}",
        "body": "The task '{task_name}' has been completed by {agent_name}.",
        "email_template_id": "task-completed",
    },
    "agent.escalated": {
        "subject": "Escalation required: {task_name}",
        "body": "Agent {agent_name} has escalated '{task_name}'. Human review required.",
        "email_template_id": "agent-escalated",
    },
    "verification.failed": {
        "subject": "Verification failed: {task_name}",
        "body": "Independent verification failed for '{task_name}'. Review the output.",
        "email_template_id": "verification-failed",
    },
}


def render_notification(event_type: str, data: dict) -> tuple[str, str]:
    """Render subject and body from template and data."""
    template = NOTIFICATION_TEMPLATES.get(event_type, {})
    subject = template.get("subject", event_type).format(**data)
    body = template.get("body", "").format(**data)
    return subject, body
```

**Complements**: `email-template` skill — the `email_template_id` maps to React Email templates from that skill. The notification system handles dispatch; the email-template skill handles rendering.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Sending email in request handler | Blocks response, provider timeout = 500 | Enqueue to Redis, process in worker |
| No user preferences | Users receive unwanted notifications | Preference model with per-channel opt-out |
| Same queue for all priorities | Critical alerts delayed by batch digests | Separate priority queues with ordered processing |
| No delivery tracking | Failed notifications silently lost | Store delivery status, retry on failure |
| Hardcoded notification text | No template reuse, hard to update | Template registry with variable interpolation |
| Ignoring quiet hours | Notifications at 3 AM | Check timezone-aware quiet hours before delivery |

---

## Checklist

Before merging notification-system changes:

- [ ] `NotificationEvent` Pydantic model with channels, priority, and template support
- [ ] `NotificationDispatcher` routes to email, in-app, and webhook handlers
- [ ] User preferences stored and checked before each delivery
- [ ] Critical notifications bypass preferences
- [ ] Queue-backed delivery with priority separation
- [ ] In-app notifications with real-time streaming
- [ ] `useNotifications` hook feeds `NotificationStream` component
- [ ] Notification templates for recurring event types
- [ ] Delivery tracking with retry for failed sends

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Notification System Implementation

**Channels**: [email / in_app / webhook / push]
**Queue**: [Redis priority queues / inline]
**Preferences**: [per-channel opt-out / global / none]
**Templates**: [event-mapped / inline]
**Real-Time**: [Supabase Realtime / SSE / polling]
**Delivery Tracking**: [enabled / disabled]
**Priority Levels**: [critical, high, normal, low]
```
