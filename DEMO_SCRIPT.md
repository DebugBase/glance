# Glance Demo Video Script

## Format
- Terminal recording (asciinema or screen capture)
- Split screen: Claude Code terminal (left) + Browser window (right)
- Duration: 60-90 seconds
- No voiceover, text captions only

## Setup
```bash
# Headed mode so browser is visible
export BROWSER_HEADLESS=false
claude mcp add glance -- npx glance-mcp
```

## Scene 1: The Hook (0-10s)
**Caption:** "Claude Code can now see your app."

```
$ claude "Open debugbase.io and check if everything works"
```

Browser opens, navigates to debugbase.io. Screenshot appears inline in terminal.

## Scene 2: Navigation (10-25s)
**Caption:** "Navigate, screenshot, read the DOM"

Claude navigates to /questions, takes screenshot, reads accessibility snapshot.
Terminal shows: `browser_navigate → debugbase.io/questions`
Terminal shows: `browser_screenshot → [inline image]`
Browser visibly moves to questions page.

## Scene 3: Testing (25-50s)
**Caption:** "Test login flows end-to-end"

```
"Test the login flow with invalid credentials"
```

Claude:
1. Navigates to /login
2. Types email into input
3. Types password
4. Clicks "Sign in"
5. Screenshots the error message
6. Reports: "Invalid credentials error shown correctly"

Browser shows form filling in real-time.

## Scene 4: Assertions (50-65s)
**Caption:** "12 assertion types, zero config"

Claude runs test_scenario_run with multiple steps.
Terminal shows:
```
[PASS] Navigate to homepage
[PASS] Hero heading exists
[PASS] CTA button visible
[PASS] Stats section: "50K+" present
[PASS] No console errors
```

## Scene 5: Results (65-80s)
**Caption:** "300+ test steps. 97% pass rate."

Quick montage of screenshots from different pages.
Final terminal output:
```
12 scenarios, 104 steps
101 passed, 3 failed, 0 skipped
```

## Scene 6: CTA (80-90s)
**Caption:**
```
npm install -g glance-mcp
github.com/DebugBase/glance
```

Logo appears. "Glance by DebugBase"

## Recording Commands

To record with headed browser:
```bash
# Start recording
asciinema rec demo.cast

# Run the demo
claude "Open debugbase.io, navigate to questions, login, tags, agents. Take screenshots of each. Run assertions on the landing page."

# Stop recording
# Ctrl+D
```

## DebugBase Test Commands (actual commands for the demo)

```
"Navigate to debugbase.io and screenshot the landing page"
"Go to the questions page and verify it shows 'All Questions'"
"Test the login page - try signing in with test@example.com and wrong password, verify the error message"
"Check the tags page, agents page, and findings page - screenshot each one"
"Run a full test scenario: navigate to homepage, verify hero text, check stats, verify CTA buttons exist, check for console errors"
```
