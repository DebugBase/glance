---
name: glance-test
description: Run E2E browser tests on any web application using Glance MCP. Use when the user says "test this page," "check this URL," "run E2E tests," "browser test," "test the login flow," "check if the site works," "visual regression," or "screenshot this page." Also use for post-deploy verification and smoke tests.
metadata:
  version: 1.0.0
---

# Glance E2E Browser Test

You run end-to-end browser tests using Glance MCP tools. You have a real Chromium browser at your disposal.

## Prerequisites

Glance MCP must be configured. If `mcp__browser__browser_navigate` is not available, tell the user:

```
claude mcp add glance -- npx glance-mcp
```

## Workflow

### 1. Get the target

Ask for the URL if not provided. Accept:
- Full URL: `https://example.com`
- Local: `localhost:3000`
- Relative paths (prepend the known base URL)

### 2. Start session and navigate

```
mcp__browser__session_start — name: "e2e-{domain}"
mcp__browser__browser_navigate — url
```

### 3. Initial assessment

```
mcp__browser__browser_screenshot — see the page
mcp__browser__browser_snapshot — get DOM structure
mcp__browser__browser_console_messages — check for JS errors
```

### 4. Smart page discovery

From the snapshot, identify:
- Navigation links (sidebar, header, footer)
- Forms (login, register, contact, search)
- CTAs (buttons, links)
- Interactive elements (dropdowns, modals, tabs)

### 5. Test each page

For every discoverable page, run:

```
navigate → screenshot → assert key elements → check console → check network
```

Use `test_scenario_run` for multi-step flows:

```json
{
  "name": "Page: /login",
  "steps": [
    {"name": "Navigate", "action": "navigate", "url": "URL"},
    {"name": "Page loaded", "action": "assert", "type": "exists", "selector": "h1"},
    {"name": "Screenshot", "action": "screenshot", "screenshotName": "page-name"},
    {"name": "No console errors", "action": "assert", "type": "consoleNoErrors"}
  ]
}
```

### 6. Test forms and auth

If login/register forms exist:
- Test with invalid data (expect error message)
- Test with valid data if credentials provided
- Verify redirects and session persistence

### 7. Generate report

Output a markdown table:

```
| Page | Steps | Pass | Fail | Issues |
|------|-------|------|------|--------|
| /    | 5     | 5    | 0    | None   |
| /login | 8  | 7    | 1    | Console error: ... |
```

Include:
- Total pages tested
- Total steps: X pass, Y fail
- Screenshots of failures
- Console errors found
- Network failures
- Bugs discovered with severity

### 8. End session

```
mcp__browser__session_end
```

## Assertion Quick Reference

| Type | Use for |
|------|---------|
| `exists` | Element present |
| `notExists` | Element absent |
| `textContains` | Partial text match |
| `textEquals` | Exact text |
| `urlContains` | URL check after navigation |
| `isVisible` | Visibility check |
| `isEnabled` | Button/input enabled |
| `consoleNoErrors` | Zero JS errors |

## Tips

- `browser_click` accepts plain text: `"Sign in"`, `"Submit"`, `"Next"`
- Always screenshot before and after form submissions
- Check `browser_network_requests` after login to verify API calls
- Use `visual_baseline` + `visual_compare` for regression testing
- Set `BROWSER_HEADLESS=false` for the user to watch live
