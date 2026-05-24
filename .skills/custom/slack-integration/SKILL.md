# Slack Integration

> Slack bot commands, webhook notifications, interactive messages, and team alerting patterns for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `slack-integration`                                      |
| **Category**   | Communication & Reporting                                |
| **Complexity** | Medium                                                   |
| **Complements**| `notification-system`, `webhook-handler`, `report-generator` |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies Slack integration patterns for NodeJS-Starter-V1: incoming webhooks for deployment and alert notifications, Slack bot slash commands, interactive message blocks with action handlers, team channel routing by severity, and Bolt framework setup for full bot capabilities.

---

## When to Apply

### Positive Triggers

- Sending deployment notifications to a team Slack channel
- Building Slack slash commands for operational tasks
- Routing alerts to different channels based on severity
- Creating interactive Slack messages with buttons and menus
- Integrating CI/CD pipeline status with Slack

### Negative Triggers

- Email notifications (use `email-template` skill)
- In-app notification system (use `notification-system` skill)
- Generic webhook sending (use `webhook-handler` skill)
- SMS or push notifications (use `notification-system` skill)

---

## Core Principles

### The Three Laws of Slack Integration

1. **Webhook for Output, Bot for Input**: Use incoming webhooks for one-way notifications (deployment alerts, error reports). Use Slack Bot (Bolt) only when you need to receive commands or interactions from users.
2. **Channel Routing by Severity**: Critical alerts go to `#alerts-critical`, warnings to `#alerts-warning`, informational to `#deployments`. Never send everything to one channel — alert fatigue kills responsiveness.
3. **Block Kit Always**: Never send plain text messages. Use Slack Block Kit for structured, scannable messages. Headers, sections, dividers, and context blocks make messages actionable.

---

## Pattern 1: Incoming Webhook Notifications (Python)

### Simple One-Way Alerts

```python
import httpx
from pydantic import BaseModel
from src.utils import get_logger

logger = get_logger(__name__)


class SlackMessage(BaseModel):
    channel: str
    text: str  # Fallback for notifications
    blocks: list[dict] | None = None
    thread_ts: str | None = None


class SlackWebhookClient:
    """Send messages to Slack via incoming webhooks."""

    def __init__(self, webhook_url: str) -> None:
        self.webhook_url = webhook_url
        self.client = httpx.AsyncClient(timeout=10.0)

    async def send(self, message: SlackMessage) -> bool:
        payload = {"text": message.text}
        if message.blocks:
            payload["blocks"] = message.blocks
        if message.thread_ts:
            payload["thread_ts"] = message.thread_ts

        try:
            response = await self.client.post(
                self.webhook_url,
                json=payload,
            )
            if response.status_code != 200:
                logger.error(
                    "slack_webhook_failed",
                    status=response.status_code,
                    body=response.text,
                )
                return False
            return True
        except httpx.HTTPError as exc:
            logger.error("slack_webhook_error", error=str(exc))
            return False
```

---

## Pattern 2: Block Kit Message Builder

### Structured Notification Messages

```python
class SlackBlockBuilder:
    """Build Slack Block Kit messages for structured notifications."""

    @staticmethod
    def deployment_notification(
        app_name: str,
        environment: str,
        version: str,
        status: str,
        deploy_url: str | None = None,
    ) -> list[dict]:
        status_emoji = {
            "success": ":white_check_mark:",
            "failed": ":x:",
            "in_progress": ":hourglass_flowing_sand:",
            "rolled_back": ":rewind:",
        }

        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"Deployment {status.title()}: {app_name}",
                },
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Environment:*\n{environment}"},
                    {"type": "mrkdwn", "text": f"*Version:*\n{version}"},
                    {"type": "mrkdwn", "text": f"*Status:*\n{status_emoji.get(status, ':grey_question:')} {status.title()}"},
                    {"type": "mrkdwn", "text": f"*Time:*\n<!date^{int(datetime.now().timestamp())}^{{date_short}} {{time}}|{datetime.now().isoformat()}>"},
                ],
            },
        ]

        if deploy_url:
            blocks.append({
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "View Deployment"},
                        "url": deploy_url,
                        "style": "primary",
                    },
                ],
            })

        blocks.append({"type": "divider"})
        return blocks

    @staticmethod
    def alert_notification(
        title: str,
        severity: str,
        description: str,
        source: str,
    ) -> list[dict]:
        severity_colours = {
            "critical": "#FF4444",
            "high": "#FFB800",
            "medium": "#00F5FF",
            "low": "#00FF88",
        }

        return [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"Alert: {title}"},
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Severity:* {severity.upper()}\n*Source:* {source}\n\n{description}",
                },
                "accessory": {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "Acknowledge"},
                    "action_id": f"alert_ack_{source}",
                    "style": "danger" if severity == "critical" else "primary",
                },
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Reported at <!date^{int(datetime.now().timestamp())}^{{date_short}} {{time}}|now> (AEST)",
                    },
                ],
            },
        ]
```

---

## Pattern 3: Channel Routing by Severity

### Severity-Based Channel Dispatch

```python
from enum import Enum


class SlackChannel(str, Enum):
    DEPLOYMENTS = "#deployments"
    ALERTS_CRITICAL = "#alerts-critical"
    ALERTS_WARNING = "#alerts-warning"
    GENERAL = "#dev-notifications"


class ChannelRouter:
    """Route messages to appropriate Slack channels by severity."""

    SEVERITY_MAP: dict[str, SlackChannel] = {
        "critical": SlackChannel.ALERTS_CRITICAL,
        "high": SlackChannel.ALERTS_CRITICAL,
        "medium": SlackChannel.ALERTS_WARNING,
        "low": SlackChannel.GENERAL,
        "info": SlackChannel.GENERAL,
    }

    @classmethod
    def route(cls, severity: str) -> SlackChannel:
        return cls.SEVERITY_MAP.get(severity, SlackChannel.GENERAL)


# Usage
async def send_alert(
    title: str,
    severity: str,
    description: str,
    source: str,
) -> None:
    channel = ChannelRouter.route(severity)
    blocks = SlackBlockBuilder.alert_notification(
        title=title,
        severity=severity,
        description=description,
        source=source,
    )
    message = SlackMessage(
        channel=channel.value,
        text=f"[{severity.upper()}] {title}",
        blocks=blocks,
    )
    await slack_client.send(message)
```

---

## Pattern 4: Slack Bot with Bolt (TypeScript)

### Slash Commands and Interactions

```typescript
import { App } from "@slack/bolt";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Slash command: /status
app.command("/status", async ({ command, ack, respond }) => {
  await ack();

  const healthRes = await fetch(
    `${process.env.BACKEND_URL}/api/health/deep`,
  );
  const health = await healthRes.json();

  await respond({
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "System Status" },
      },
      {
        type: "section",
        fields: health.dependencies.map(
          (dep: { name: string; status: string; latency_ms: number }) => ({
            type: "mrkdwn",
            text: `*${dep.name}:* ${dep.status === "healthy" ? ":white_check_mark:" : ":x:"} (${dep.latency_ms}ms)`,
          }),
        ),
      },
    ],
  });
});

// Interactive action: alert acknowledgement
app.action(/^alert_ack_/, async ({ action, ack, respond, body }) => {
  await ack();

  const userId = body.user.id;
  await respond({
    replace_original: false,
    text: `Alert acknowledged by <@${userId}>`,
  });
});
```

---

## Pattern 5: CI/CD Pipeline Notifications

### GitHub Actions to Slack

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Notify start
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": ":rocket: *Deployment started*\nBranch: `${{ github.ref_name }}`\nCommit: `${{ github.sha }}`"
                  }
                }
              ]
            }

      - name: Deploy
        run: pnpm deploy

      - name: Notify result
        if: always()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "${{ job.status == 'success' && ':white_check_mark: Deployment succeeded' || ':x: Deployment failed' }}\nDuration: ${{ github.event.head_commit.timestamp }}"
                  }
                }
              ]
            }
```

**Complements**: `ci-cd-patterns` skill — Slack notifications integrate into the GitHub Actions pipeline. `notification-system` skill — Slack is one delivery channel in the multi-channel notification dispatch.

---

## Pattern 6: Environment Configuration

### Slack Credentials and Channel Setup

```python
from pydantic_settings import BaseSettings


class SlackSettings(BaseSettings):
    slack_webhook_url: str = ""
    slack_bot_token: str = ""
    slack_signing_secret: str = ""
    slack_deploy_channel: str = "#deployments"
    slack_alert_channel: str = "#alerts-critical"

    model_config = {"env_prefix": ""}


# Usage
settings = SlackSettings()

if settings.slack_webhook_url:
    slack_client = SlackWebhookClient(settings.slack_webhook_url)
else:
    # Graceful fallback — log instead of sending to Slack
    logger.info("slack_disabled", reason="No webhook URL configured")
```

**Rule**: Slack integration must be optional. If `SLACK_WEBHOOK_URL` is not set, fall back to logging. The project's zero-barriers principle means local development works without Slack credentials.

**Complements**: `secret-management` skill — Slack tokens stored as environment variables with `sensitive = true` validation.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Plain text messages | Hard to scan, no structure | Block Kit with headers and sections |
| All alerts to one channel | Alert fatigue, missed critical alerts | Severity-based channel routing |
| Bot for one-way notifications | Unnecessary complexity and permissions | Incoming webhooks for output-only |
| Hardcoded webhook URLs | Leaked secrets, cannot rotate | Environment variables |
| No fallback when Slack is down | Application errors on notification failure | Graceful degradation to logging |

---

## Checklist

Before merging slack-integration changes:

- [ ] `SlackWebhookClient` with async message sending
- [ ] `SlackBlockBuilder` with deployment and alert templates
- [ ] `ChannelRouter` with severity-based channel dispatch
- [ ] Bolt framework setup for slash commands (if bot needed)
- [ ] CI/CD pipeline Slack notifications via GitHub Actions
- [ ] Environment configuration with graceful fallback
- [ ] Slack credentials never committed to source control

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### Slack Integration Implementation

**Approach**: [webhook only / bot + webhook]
**Framework**: [Bolt / raw API / GitHub Action]
**Messages**: [Block Kit / plain text]
**Channel Routing**: [severity-based / single channel]
**CI/CD**: [GitHub Actions / manual]
**Fallback**: [logging / queue / none]
```
