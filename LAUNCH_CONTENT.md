# Glance Launch Content

## Twitter/X Thread (7 tweets)

### Tweet 1 (Hook)
Claude Code can now see your app.

Not guess. Not hallucinate. Actually see it.

We built Glance — an open-source MCP server that gives Claude a real browser.

30 tools. Inline screenshots. Test automation.

"Test the login flow on localhost:3000"
→ Opens browser → fills form → clicks submit → screenshots result → reports back

🧵

### Tweet 2 (What it does)
How it works:

Claude Code ↔ Glance (MCP/stdio) ↔ Playwright ↔ Chrome

You say: "Check if the pricing page has all three tiers"

Claude: navigates, takes a screenshot, reads the accessibility tree, and tells you what it found.

No copy-pasting HTML. No describing your UI. Claude literally looks at it.

### Tweet 3 (Tool categories)
30 tools across 3 categories:

Browser Control (19): navigate, click, type, hover, drag, screenshot, accessibility snapshots, console logs, network monitoring

Test Automation (7): scenario runner, 12 assertion types, form filling, auth flow testing

Session & Visual (4): record/replay sessions, visual regression with pixel-level diffing

### Tweet 4 (Test scenarios)
The test scenario runner is where it gets interesting.

Define multi-step tests in JSON — navigate, fill forms, click, assert, screenshot.

Or just tell Claude in plain English:
"Test signup with an invalid email, verify the error message shows, then test with a valid email and verify the redirect"

Claude writes and runs the scenario itself.

### Tweet 5 (vs Playwright MCP)
"How is this different from Playwright MCP?"

Key differences:
- Screenshots returned inline — Claude actually sees the page
- Built-in test scenario runner with 12 assertion types
- Visual regression (pixel-level baseline comparison)
- Session recording and replay
- Security profiles (URL allowlists, rate limiting, JS execution policies)
- Battle-tested: 200+ test steps across production apps

### Tweet 6 (Open source)
Fully open source. MIT license.

Built with:
- Anthropic's Model Context Protocol
- Playwright for browser automation
- pixelmatch for visual regression

One command to install:
npm install -g glance-mcp

Or add directly to Claude Code:
claude mcp add glance -- npx glance-mcp

### Tweet 7 (CTA)
Give Claude eyes. Ship faster.

GitHub: github.com/DebugBase/glance
npm: glance-mcp
Discord: discord.gg/RyGk6HP7Uy

Star it if you find it useful. Issues and PRs welcome.

Built by @debugbaseio

---

## Reddit r/ClaudeAI

**Title:** We built an open-source MCP server that gives Claude Code a real browser — 30 tools, inline screenshots, test automation

**Body:**

Hey r/ClaudeAI,

We've been using Claude Code daily and kept hitting the same wall: Claude can't see what your web app actually looks like. It reads your code, guesses the output, and sometimes hallucinates UI states that don't exist.

So we built **Glance** — an MCP server that gives Claude a real Chromium browser via Playwright.

**What it does:**

Claude Code connects to Glance over stdio. When you say "open localhost:3000 and check if the dashboard loads correctly," Claude actually:
1. Launches a browser
2. Navigates to the URL
3. Takes a screenshot (returned inline — Claude sees the pixels)
4. Reads the accessibility tree (full DOM structure as text)
5. Reports what it found

**30 tools in 3 categories:**

- **Browser Control (19):** navigate, click, type, hover, drag, select, keyboard, scroll, screenshot, accessibility snapshot, JS execution, console logs, network monitoring, tabs, back/forward
- **Test Automation (7):** multi-step scenario runner (define in JSON), 12 assertion types (exists, textContains, urlEquals, consoleNoErrors, etc.), form auto-fill, auth flow testing, DOM/network event watching
- **Session & Visual (4):** record and replay browser sessions, visual regression with pixel-level comparison via pixelmatch

**Setup is one line:**

```
claude mcp add glance -- npx glance-mcp
```

Set `BROWSER_HEADLESS=false` to watch the browser in real-time.

**Security:** Three profiles — `local-dev` (all HTTP/HTTPS, 60 req/min), `restricted` (localhost only, no JS exec), `open` (everything).

**Real-world numbers:** 200+ test steps, 96-97% pass rate across production apps.

MIT license. TypeScript, Playwright, MCP SDK.

GitHub: https://github.com/DebugBase/glance

Happy to answer any questions!

---

## LinkedIn Post

Claude Code is powerful, but it has a blind spot: it can't see your UI.

It reads your React components, infers layout from CSS, and guesses what the user sees. Sometimes it's right. Often it's not.

We built Glance to fix this.

Glance is an open-source MCP server that gives Claude Code a real browser. 30 tools for navigation, interaction, screenshots, and test automation — all powered by Playwright.

The difference is immediate. Instead of:
"Based on your code, the login form should render with..."

You get:
*Claude opens your app, takes a screenshot, reads the DOM, and tells you exactly what's there*

Three things that surprised us during development:

1. Inline screenshots changed everything. When Claude can literally see a broken layout, it fixes it in one pass instead of three.

2. The test scenario runner became our most-used feature. Define multi-step flows in JSON, or just describe them in English and let Claude generate and run them.

3. Visual regression caught bugs we missed. Pixel-level comparison against baselines — Claude flags what changed and where.

We open-sourced it because browser tooling for AI agents shouldn't be locked behind a paywall.

MIT license. One-line install. Works today.

GitHub: github.com/DebugBase/glance

#MCP #ClaudeCode #AIAgents #DeveloperTools #OpenSource #Playwright #BrowserAutomation

---

## Hacker News "Show HN"

**Title:** Show HN: Glance – Open-source MCP server that gives Claude Code a real browser (30 tools, Playwright)

**Text:**

Glance is an MCP (Model Context Protocol) server that gives Claude Code full browser control via Playwright. 30 tools for navigation, interaction, screenshots, and test automation.

The core idea: Claude shouldn't have to guess what your web app looks like. Screenshots are returned as base64 images inline, and accessibility snapshots give the full page structure as text.

Tool categories:
- Browser control (19 tools): navigate, click, type, hover, drag, select, keyboard, scroll, screenshot, a11y snapshots, JS exec, console/network monitoring, tabs
- Test automation (7 tools): JSON scenario runner, 12 assertion types, form filling, auth flow testing
- Session/visual (4 tools): session recording/replay, visual regression with pixelmatch

Security has three profiles controlling URL access, JS execution, and rate limits.

Tech: TypeScript, esbuild, Playwright, MCP SDK, pixelmatch, zod. MIT license.

Install: `npm install -g glance-mcp`

GitHub: https://github.com/DebugBase/glance

---

## Dev.to Article Outline

**Title:** "Claude Can Now See Your App: Building an MCP Browser Server with 30 Tools"

### Sections:
1. The Problem: AI That Can't See
2. What is Glance? (Architecture diagram)
3. Getting Started (Code Examples)
4. The 30 Tools, Explained
5. Test Automation That Actually Works (JSON scenario examples)
6. Visual Regression Testing
7. Security Model (Three profiles)
8. Real-World Use Cases (200+ steps, 96-97% pass rate)
9. How It Compares to Playwright MCP
10. Contributing & What's Next
