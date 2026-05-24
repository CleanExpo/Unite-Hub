# i18n Patterns

> Internationalisation patterns with en-AU as the default locale for NodeJS-Starter-V1.

---

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| **Skill ID**   | `i18n-patterns`                                          |
| **Category**   | Document & Content                                       |
| **Complexity** | Medium                                                   |
| **Complements**| `data-validation`, `api-contract`, `email-template`      |
| **Version**    | 1.0.0                                                    |
| **Locale**     | en-AU                                                    |

---

## Description

Codifies internationalisation patterns for NodeJS-Starter-V1: next-intl integration for the Next.js frontend, Python locale formatting for the backend, date/time/currency formatters with en-AU defaults, translation file structure, locale-aware API responses, and timezone handling for AEST/AEDT.

---

## When to Apply

### Positive Triggers

- Displaying dates, times, or currency to users
- Adding multi-language support to the frontend
- Formatting numbers, percentages, or units for display
- Handling timezone conversions (AEST/AEDT)
- Making API responses locale-aware

### Negative Triggers

- Input validation and sanitisation (use `data-validation` skill)
- Email template localisation (use `email-template` skill)
- Database schema for multi-tenant locale support (use migrations)
- PDF locale formatting (use `pdf-generator` skill)

---

## Core Principles

### The Three Laws of i18n

1. **en-AU by Default**: Every formatter, date display, and currency output defaults to Australian English. Users must opt-in to other locales, not opt-out of en-AU.
2. **Format at the Edge**: Store data in ISO/UTC format. Convert to locale-specific display at the last possible moment — in the UI layer or API response serialiser.
3. **Never Concatenate Translations**: Use ICU message format with placeholders. String concatenation breaks in languages with different word order.

---

## Pattern 1: Next.js i18n Configuration

### next-intl Setup

```typescript
// apps/web/i18n/config.ts

export const defaultLocale = "en-AU";
export const locales = ["en-AU", "en-US", "en-GB"] as const;
export type Locale = (typeof locales)[number];

export const timeZone = "Australia/Sydney";

// Locale metadata
export const localeConfig: Record<Locale, {
  currency: string;
  dateFormat: string;
  timeFormat: string;
}> = {
  "en-AU": {
    currency: "AUD",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "h:mm a",
  },
  "en-US": {
    currency: "USD",
    dateFormat: "MM/dd/yyyy",
    timeFormat: "h:mm a",
  },
  "en-GB": {
    currency: "GBP",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm",
  },
};
```

### Translation Files

```
apps/web/i18n/
  messages/
    en-AU.json     # Default — always complete
    en-US.json     # Overrides only
    en-GB.json     # Overrides only
  config.ts
  request.ts
```

```json
// apps/web/i18n/messages/en-AU.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "Something went wrong"
  },
  "dashboard": {
    "title": "Dashboard",
    "agents": "{count, plural, one {# agent} other {# agents}}",
    "lastUpdated": "Last updated {date}"
  },
  "auth": {
    "login": "Log in",
    "logout": "Log out",
    "register": "Create account"
  }
}
```

---

## Pattern 2: Locale-Aware Formatters (TypeScript)

### Date, Currency, and Number Formatting

```typescript
const defaultLocale = "en-AU";

export function formatDate(
  date: Date | string,
  locale: string = defaultLocale,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatTime(
  date: Date | string,
  locale: string = defaultLocale,
  timeZone: string = "Australia/Sydney",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: locale !== "en-GB",
    timeZone,
    timeZoneName: "short",
  }).format(d);
}

export function formatCurrency(
  amount: number,
  currency: string = "AUD",
  locale: string = defaultLocale,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale: string = defaultLocale,
): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatRelativeTime(
  date: Date | string,
  locale: string = defaultLocale,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (seconds < 60) return rtf.format(-seconds, "second");
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), "hour");
  return rtf.format(-Math.floor(seconds / 86400), "day");
}
```

**Usage**: `formatDate("2026-02-13")` → `"13/02/2026"`, `formatCurrency(1500)` → `"$1,500.00"`.

---

## Pattern 3: Python Locale Formatting

### Backend Date and Currency Helpers

```python
from datetime import datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

AEST = ZoneInfo("Australia/Sydney")


def format_date_au(dt: datetime) -> str:
    """Format datetime as DD/MM/YYYY in AEST."""
    local = dt.astimezone(AEST)
    return local.strftime("%d/%m/%Y")


def format_time_au(dt: datetime) -> str:
    """Format datetime as H:MM am/pm AEST."""
    local = dt.astimezone(AEST)
    return local.strftime("%-I:%M %p AEST").lower()


def format_currency_au(amount: Decimal | float) -> str:
    """Format as Australian dollars."""
    return f"${amount:,.2f}"


def format_number_au(value: int | float) -> str:
    """Format number with Australian conventions."""
    return f"{value:,}"
```

**Project Reference**: The backend stores all timestamps in UTC (`DateTime(timezone=True)` in SQLAlchemy). These helpers convert to AEST/AEDT for display in API responses and email templates.

---

## Pattern 4: Locale-Aware API Responses

### Accept-Language Header Processing

```python
from fastapi import Request


def get_request_locale(request: Request) -> str:
    """Extract locale from Accept-Language header, default to en-AU."""
    accept = request.headers.get("accept-language", "en-AU")
    # Parse quality values: en-AU,en;q=0.9,en-US;q=0.8
    locales = []
    for part in accept.split(","):
        parts = part.strip().split(";q=")
        locale = parts[0].strip()
        quality = float(parts[1]) if len(parts) > 1 else 1.0
        locales.append((locale, quality))

    locales.sort(key=lambda x: x[1], reverse=True)

    supported = {"en-AU", "en-US", "en-GB"}
    for locale, _ in locales:
        if locale in supported:
            return locale
        # Match language without region
        lang = locale.split("-")[0]
        match = next((s for s in supported if s.startswith(lang)), None)
        if match:
            return match

    return "en-AU"
```

---

## Pattern 5: Timezone Handling

### AEST/AEDT Awareness

```typescript
export function toAEST(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(
    d.toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
  );
}

export function isAEDT(date: Date = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    timeZoneName: "short",
  });
  return formatter.format(date).includes("AEDT");
}

export function getAustralianTimezone(): string {
  return isAEDT() ? "AEDT" : "AEST";
}
```

**Rule**: Always display timezone abbreviation (AEST or AEDT) alongside times. Users must know whether daylight saving is in effect.

---

## Anti-Patterns

| Pattern | Problem | Correct Approach |
|---------|---------|-----------------:|
| Hardcoded date format strings | Breaks for non-AU locales | `Intl.DateTimeFormat` with locale |
| Storing display-formatted dates | Cannot re-format for other locales | Store ISO/UTC, format at edge |
| `new Date().toLocaleDateString()` | Uses server/browser locale, not user's | Explicit locale parameter |
| String concatenation for translations | Breaks with different word orders | ICU message format |
| Ignoring daylight saving | Times off by 1 hour half the year | `Australia/Sydney` timezone (handles DST) |
| US defaults (MM/DD, USD) | Wrong for Australian users | en-AU defaults everywhere |

---

## Checklist

Before merging i18n-patterns changes:

- [ ] `en-AU` as default locale throughout the application
- [ ] `Intl.DateTimeFormat` for dates (DD/MM/YYYY) and times (h:mm a)
- [ ] `Intl.NumberFormat` for currency (AUD) and numbers
- [ ] Python formatters with `Australia/Sydney` timezone
- [ ] `Accept-Language` header parsing in API layer
- [ ] Translation file structure with en-AU as base
- [ ] AEST/AEDT timezone detection and display

---

## Response Format

When applying this skill, structure implementation as:

```markdown
### i18n Implementation

**Default Locale**: [en-AU]
**Supported Locales**: [en-AU, en-US, en-GB / single locale]
**Date Format**: [DD/MM/YYYY via Intl]
**Currency**: [AUD via Intl.NumberFormat]
**Timezone**: [Australia/Sydney with DST]
**Translation Library**: [next-intl / react-intl / none]
**Backend Locale**: [Accept-Language / fixed en-AU]
```
