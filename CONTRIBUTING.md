# Contributing to Glance

Thanks for your interest in contributing to Glance! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/DebugBase/glance.git
cd glance
npm install
npx playwright install chromium
npm run build
```

## Project Structure

```
glance/
├── src/
│   ├── index.ts            # MCP server entry point
│   ├── browser/
│   │   ├── manager.ts      # Browser lifecycle management
│   │   ├── actions.ts      # Click, type, scroll, navigate
│   │   ├── snapshot.ts     # Accessibility tree capture
│   │   └── devtools.ts     # Console & network monitoring
│   ├── tools/
│   │   ├── navigation.ts   # Navigate, back, forward tools
│   │   ├── interaction.ts  # Click, type, hover, drag tools
│   │   ├── observation.ts  # Screenshot, snapshot, evaluate tools
│   │   └── tabs.ts         # Tab management tools
│   ├── testing/
│   │   ├── scenarioRunner.ts  # Multi-step test runner
│   │   ├── assertions.ts     # 12 assertion types
│   │   └── formFiller.ts     # Auto form filling
│   ├── session/
│   │   └── recorder.ts    # Session recording & replay
│   ├── visual/
│   │   └── compare.ts     # Pixel-level visual comparison
│   ├── security/
│   │   ├── urlFilter.ts   # URL allowlist/denylist
│   │   └── jsPolicy.ts    # JS execution policy
│   ├── config.ts           # Configuration & security profiles
│   └── types.ts            # TypeScript type definitions
├── esbuild.config.js       # Build configuration
├── tsconfig.json
└── package.json
```

## Adding a New Tool

1. Create your tool function in the appropriate `src/tools/` file
2. Register it with `server.tool()` using Zod schema for parameters
3. Return MCP-compatible content (text and/or image)
4. Update README.md with the new tool

Example:

```typescript
server.tool(
  'browser_my_tool',
  {
    param: z.string().describe('What this parameter does'),
  },
  async ({ param }) => {
    const page = await getActivePage();
    // ... your logic ...
    return {
      content: [{ type: 'text', text: `Result: ${result}` }],
    };
  }
);
```

## Guidelines

- Keep tools focused — one tool, one action
- Always include error handling with descriptive messages
- Use `getActivePage()` to access the current browser page
- Return `isError: true` for user-facing errors
- Screenshots should be returned as base64 `image` content type

## Commit Messages

Use conventional commits:

- `feat: add new browser_drag tool`
- `fix: resolve URL filter matching for paths`
- `docs: update tool reference table`
- `refactor: simplify click text detection`

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run build` passes
4. Test with Claude Code or another MCP client
5. Open a PR with the template filled in

## Questions?

- Open a [Discussion](https://github.com/DebugBase/glance/discussions)
- Join our [Discord](https://discord.gg/RyGk6HP7Uy)
