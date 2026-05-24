---
name: claude-browser
description: >-
  Claude Chrome extension tools for personal browser automation in the user's
  actual browser. Use for logged-in sessions, form filling, and interactive tasks.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# Claude Browser — Chrome Extension Automation

Personal browser automation using Claude's Chrome extension MCP tools. Operates in the user's actual browser session with full access to logged-in state, cookies, and extensions.

## When to Apply

### Positive Triggers

- Personal browser automation (logged-in sessions)
- Form filling in authenticated web apps
- Reading content from pages requiring login
- Interactive demonstrations and walkthroughs
- GIF recording of browser workflows
- Tab management and multi-page navigation

### Negative Triggers (Do NOT Apply)

- CI/CD pipeline testing (use `playwright-browser` skill)
- Parallel test execution (Chrome extension is single-session)
- Headless browser operations
- Performance/load testing

## Core Principles

1. **Single-session** — one browser, one user, one context at a time
2. **User's actual browser** — leverages existing login state and cookies
3. **Personal context** — for tasks that require the user's authenticated session
4. **Always capture evidence** — use `gif_creator` or `upload_image` for visual records
5. **Tab-aware** — always call `tabs_context_mcp` at session start

## Navigation + Reading

| Tool | Purpose |
|------|---------|
| `navigate` | Navigate to URL in current tab |
| `read_page` | Read full page content (structured) |
| `get_page_text` | Get plain text content |
| `find` | Search for text/elements on page |

## Interaction

| Tool | Purpose |
|------|---------|
| `form_input` | Fill form fields |
| `computer` | Mouse/keyboard simulation |
| `javascript_tool` | Execute JavaScript in page |

## Tab Management

| Tool | Purpose |
|------|---------|
| `tabs_context_mcp` | Get current tab info (CALL FIRST) |
| `tabs_create_mcp` | Open new tab |
| `resize_window` | Resize browser window |
| `switch_browser` | Switch between browser profiles |

## Visual Capture

| Tool | Purpose |
|------|---------|
| `gif_creator` | Record multi-step interaction as GIF |
| `upload_image` | Capture and upload screenshot |

## Console + Network

| Tool | Purpose |
|------|---------|
| `read_console_messages` | Read browser console (use `pattern` param to filter) |
| `read_network_requests` | Inspect network activity |

## Shortcuts

| Tool | Purpose |
|------|---------|
| `shortcuts_list` | List available keyboard shortcuts |
| `shortcuts_execute` | Execute a keyboard shortcut |

## Plan Management

| Tool | Purpose |
|------|---------|
| `update_plan` | Update task plan visible in Chrome extension |

## Session Startup Protocol

1. Call `tabs_context_mcp` to discover current tabs
2. Only reuse a tab if the user explicitly asks to work with it
3. Otherwise create a new tab with `tabs_create_mcp`
4. If tab errors occur, call `tabs_context_mcp` to refresh

## Limitations

- **Single session**: Cannot run parallel browser instances
- **Requires `--chrome` flag**: Claude Code must be launched with Chrome integration
- **Not CI-suitable**: Requires a visible browser with user interaction
- **Dialog risk**: Avoid triggering `alert()`, `confirm()`, `prompt()` — they block the extension
- **Tab ID scope**: Never reuse tab IDs from a previous session

## GIF Recording Best Practices

- Capture extra frames before and after actions for smooth playback
- Name files descriptively: `login_flow.gif`, `form_submission.gif`
- Record the full workflow, not just the end state

## Anti-Patterns

- Using Claude Chrome for CI/CD testing — use Playwright instead
- Triggering JavaScript alerts — they block all further commands
- Reusing stale tab IDs from prior sessions
- Running without calling `tabs_context_mcp` first
- Attempting parallel operations in a single-session tool
