# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Project Overview

Broxy Extension - A dual-build browser extension that converts any webpage into API and MCP services via WebSocket bridge to Cloudflare Worker. Supports both Tampermonkey userscript and Chrome Extension (Manifest V3) outputs.

## Build Commands

```bash
npm install              # Install dependencies
npm run build            # Build all (userscript + extension)
npm run build:us         # Build Tampermonkey userscript only
npm run build:ext        # Build Chrome Extension only
npm run build:ext:firefox # Build Firefox Extension
npm run dev              # Extension dev mode with HMR
```

## Build Outputs

| Product | Output Path | Usage |
|---------|-------------|-------|
| Userscript | `tampermonkey-loader.js` | Install to Tampermonkey |
| Chrome Extension | `.output/chrome-mv3/` | Chrome load unpacked |
| Intermediate | `dist/broxy.js` | Bundled core code (IIFE) |

## Testing

No test framework configured. Consider Vitest or Node's built-in test runner.

## Linting/Type Checking

No linter or type checker configured. Consider adding ESLint with `@eslint/js`.

## Directory Structure

```
broxy-ext/
├── shared/                 # Shared core code (used by both builds)
│   ├── core/               # router.js, bridge-client.js, request-handler.js
│   ├── bridge/             # float-button.js, bridge-host.js
│   ├── endpoints/          # index.js, routes.js, mcp-tools.js
│   ├── utils/              # helpers.js, logger.js, config-manager.js, swagger.js
│   ├── config.js           # Configuration constants
│   └── main.js             # Main entry logic
├── userscript/             # Tampermonkey userscript build
│   ├── scripts/            # Build scripts (generate-loader.js, template)
│   ├── data.json           # Default config data
│   └── rollup.config.js    # Rollup configuration
├── extension/              # Chrome Extension build
│   ├── entrypoints/
│   │   └── content.ts      # Content script entry (WXT format)
│   └── wxt.config.ts       # WXT configuration
├── dist/                   # Build intermediate files
└── .output/                # Extension build output
```

## Code Style Guidelines

### Module System

- Use **ES Modules** (ESM) only (`"type": "module"` in package.json)
- Always include `.js` extension in imports: `import { foo } from './bar.js';`
- Content script uses `defineContentScript()` from WXT

### File Headers

Each file starts with a brief comment: `// WebSocket 连接管理`

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `Router`, `BridgeClient` |
| Functions | camelCase | `handleRequest`, `getWebId` |
| Constants | UPPER_SNAKE_CASE | `WORKER_URL`, `HTTP_URL` |
| Config objects | UPPER_SNAKE_CASE | `CONFIG`, `FLOAT_BUTTON` |
| localStorage keys | snake_case with prefix | `broxy_web_id_`, `broxy_routes_` |
| Event types | lowercase with dots | `bb/event`, `bb/action`, `bb/response` |

### Classes

```javascript
class Router {
  constructor() {
    this.routes = [];
  }
  register(route) {
    this.routes.push(route);
  }
}
export const router = new Router();
```

### Error Handling

```javascript
try {
  const result = await handler(data);
  return result;
} catch (error) {
  console.error('[Broxy] Request handling error:', error);
  return { error: error.message, stack: error.stack };
}

if (!matched) {
  return { error: 'No route matched', path: formattedPath };
}
```

### Console Logging

Use bracket prefixes: `console.log('[Broxy] Initializing...');`

### Configuration Objects

```javascript
export const CONFIG = {
  WORKER_DOMAIN: 'v1.broxy.dev',
  get WEB_ID_KEY() {
    return `broxy_web_id_${window.location.hostname}`;
  },
  FLOAT_BUTTON: { size: 48, zIndex: 999999 }
};
```

### Route/Tool Definitions

```javascript
// Route: { id, name, pattern, method, description, handler, enabled }
// Tool: { id, name, pattern, inputSchema, handler, enabled }
// Handlers are strings executed via new Function()
```

### PostMessage Communication

```javascript
// Event: { type: 'bb/event', event: 'statusChange', data: {...} }
// Response: { type: 'bb/response', id, result, error }
// Action: { type: 'bb/action', id, action: 'saveRoute', data: {...} }
```

### DOM Manipulation

```javascript
Object.assign(element.style, { position: 'fixed', width: '48px' });
element.classList.add('bb-dragging');
```

### Content Script (WXT)

```typescript
export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document_end',
  main() {
    // Import from shared/ and execute
  },
});
```

## Important Notes

1. **Shared Code** - All core logic lives in `shared/`. Both builds import from here.
2. **Browser Environment** - Use `window`, `document`, `localStorage`, `WebSocket`, `crypto.randomUUID()`.
3. **No Comments** - Do not add comments unless explicitly requested.
4. **No Runtime Dependencies** - Only build-time devDependencies (rollup, wxt).
5. **Handler Strings** - Handlers stored as strings, executed via `new Function()`.
6. **Dual Build** - Code must work in both Tampermonkey and Chrome Extension contexts.
7. **localStorage** - Using localStorage (not chrome.storage) for simplicity and compatibility.
