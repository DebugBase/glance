<p align="center">
  <img src=".github/assets/glance-logo.svg" alt="Glance" width="80" />
</p>

<h1 align="center">Glance</h1>

<p align="center">
  <strong>AI-powered browser automation for Claude Code</strong><br/>
  <em>by <a href="https://debugbase.io">DebugBase</a></em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@debugbase/glance"><img src="https://img.shields.io/npm/v/@debugbase/glance?color=blue&label=npm" alt="npm" /></a>
  <a href="https://github.com/DebugBase/glance/blob/main/LICENSE"><img src="https://img.shields.io/github/license/DebugBase/glance" alt="License" /></a>
  <a href="https://github.com/DebugBase/glance/stargazers"><img src="https://img.shields.io/github/stars/DebugBase/glance?style=social" alt="Stars" /></a>
  <a href="https://discord.gg/RyGk6HP7Uy"><img src="https://img.shields.io/discord/1234567890?color=5865F2&label=Discord" alt="Discord" /></a>
</p>

<p align="center">
  Navigate, click, screenshot, test &mdash; all from your terminal.
</p>

---

## What is Glance?

Glance is an [MCP server](https://modelcontextprotocol.io) that gives Claude Code a real browser. Instead of guessing what your web app looks like, Claude can actually **see** it, **interact** with it, and **test** it.

```
You: "Test the login flow on localhost:3000"

Claude: *opens browser* *navigates* *fills form* *clicks submit*
        *takes screenshot* *verifies redirect* *checks for errors*
        "Login flow works. Found 1 console warning about..."
```

## Features

- **30 MCP tools** for complete browser control
- **Inline screenshots** — Claude sees what the browser sees
- **Accessibility snapshots** — full page structure as text
- **Test scenario runner** — define multi-step tests in JSON
- **12 assertion types** — exists, textContains, urlEquals, and more
- **Session recording** — record and replay browser sessions
- **Visual regression** — pixel-level screenshot comparison
- **Network & console monitoring** — catch errors and failed requests
- **Security controls** — URL allowlist/denylist, rate limiting, JS execution policies
- **Headed mode** — watch the browser in real-time

## Quick Start

### 1. Install

```bash
npm install -g @debugbase/glance
```

Or add directly to Claude Code:

```bash
claude mcp add glance -- npx @debugbase/glance
```

### 2. Configure

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "glance": {
      "command": "npx",
      "args": ["@debugbase/glance"],
      "env": {
        "BROWSER_HEADLESS": "false"
      }
    }
  }
}
```

### 3. Use

Just ask Claude to interact with your web app:

```
"Open localhost:3000 and take a screenshot"
"Test the signup flow with invalid email"
"Check if the pricing page has all three tiers"
"Run a visual regression test on the dashboard"
```

## Tools Reference

### Browser Control (19 tools)

| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate to a URL |
| `browser_click` | Click an element (CSS selector or text) |
| `browser_type` | Type into an input field |
| `browser_hover` | Hover over an element |
| `browser_drag` | Drag and drop between elements |
| `browser_select_option` | Select from a dropdown |
| `browser_press_key` | Press a keyboard key |
| `browser_scroll` | Scroll the page or to an element |
| `browser_screenshot` | Capture a screenshot (returned inline to Claude) |
| `browser_snapshot` | Get the accessibility tree as text |
| `browser_evaluate` | Execute JavaScript in the page |
| `browser_console_messages` | Read console logs and errors |
| `browser_network_requests` | Monitor network activity |
| `browser_go_back` | Navigate back |
| `browser_go_forward` | Navigate forward |
| `browser_tab_new` | Open a new tab |
| `browser_tab_list` | List all open tabs |
| `browser_tab_select` | Switch to a tab |
| `browser_close` | Close the browser |

### Test Automation (7 tools)

| Tool | Description |
|------|-------------|
| `test_scenario_run` | Run a multi-step test scenario |
| `test_scenario_status` | Check running scenario status |
| `test_assert` | Run a single assertion |
| `test_fill_form` | Auto-fill a form |
| `test_auth_flow` | Test a login/signup flow |
| `test_watch_events` | Watch for DOM/network events |
| `test_stop_watch` | Stop watching events |

### Session & Visual (4 tools)

| Tool | Description |
|------|-------------|
| `session_start` | Start recording a session |
| `session_end` | End and save a session |
| `session_list` | List recorded sessions |
| `visual_baseline` | Save a visual baseline |
| `visual_compare` | Compare against baseline |

## Test Scenarios

Define multi-step test scenarios in JSON:

```json
{
  "name": "Login Flow",
  "steps": [
    { "name": "Go to login", "action": "navigate", "url": "http://localhost:3000/login" },
    { "name": "Enter email", "action": "type", "selector": "input[type='email']", "value": "user@test.com" },
    { "name": "Enter password", "action": "type", "selector": "input[type='password']", "value": "password123" },
    { "name": "Click submit", "action": "click", "selector": "button[type='submit']" },
    { "name": "Wait for redirect", "action": "sleep", "ms": 2000 },
    { "name": "Verify dashboard", "action": "assert", "type": "urlContains", "expected": "/dashboard" },
    { "name": "Screenshot result", "action": "screenshot", "screenshotName": "post-login" }
  ]
}
```

### Assertion Types

| Type | Description |
|------|-------------|
| `exists` | Element exists in DOM |
| `notExists` | Element does not exist |
| `textContains` | Element text contains value |
| `textEquals` | Element text equals value |
| `hasAttribute` | Element has attribute with value |
| `hasClass` | Element has CSS class |
| `isVisible` | Element is visible |
| `isEnabled` | Element is enabled |
| `urlContains` | Current URL contains value |
| `urlEquals` | Current URL equals value |
| `countEquals` | Number of matching elements |
| `consoleNoErrors` | No console errors |

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BROWSER_HEADLESS` | `true` | Run browser in headed mode |
| `BROWSER_SESSIONS_DIR` | `.browser-sessions` | Directory for screenshots and sessions |
| `BROWSER_SECURITY_PROFILE` | `local-dev` | Security profile (`local-dev`, `restricted`, `open`) |
| `BROWSER_VIEWPORT_WIDTH` | `1280` | Browser viewport width |
| `BROWSER_VIEWPORT_HEIGHT` | `720` | Browser viewport height |
| `BROWSER_TIMEOUT` | `30000` | Default timeout in ms |
| `BROWSER_CHANNEL` | — | Browser channel (e.g., `chrome`, `msedge`) |

### Security Profiles

| Profile | URL Access | JS Execution | Rate Limit |
|---------|-----------|--------------|------------|
| `local-dev` | All HTTP/HTTPS | Always | 60/min |
| `restricted` | localhost only | Disabled | 30/min |
| `open` | Everything | Always | 120/min |

## How It Works

```
┌─────────────┐     MCP (stdio)     ┌──────────┐     Playwright     ┌─────────┐
│ Claude Code │ ◄──────────────────► │  Glance  │ ◄────────────────► │ Browser │
│   (Agent)   │   tools & results   │  Server  │   automation API   │ (Chrome) │
└─────────────┘                     └──────────┘                    └─────────┘
```

1. Claude Code connects to Glance via MCP (stdio transport)
2. Claude calls tools like `browser_navigate`, `browser_screenshot`
3. Glance translates these into Playwright commands
4. Screenshots are returned as base64 images — Claude literally sees the page
5. Accessibility snapshots give Claude the full DOM structure as text

## Real-World Usage

Glance has been battle-tested on production apps:

- **DebugBase** (debugbase.io) — 12 scenarios, 104 test steps, 97% pass rate
- **GitScribe AI** — 16 scenarios, 196 test steps, 96% pass rate

## Requirements

- Node.js 18+
- Playwright-compatible browser (auto-installed)

## Development

```bash
git clone https://github.com/DebugBase/glance.git
cd glance
npm install
npx playwright install chromium
npm run build
npm start
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — built by [DebugBase](https://debugbase.io)
