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
npx tsc --noEmit         # Type check (no build)
```

## Build Outputs

| Product | Output Path | Usage |
|---------|-------------|-------|
| Userscript | `tampermonkey-loader.js` | Install to Tampermonkey |
| Chrome Extension | `.output/chrome-mv3/` | Chrome load unpacked |
| Intermediate | `dist/broxy.js` | Bundled core code (IIFE) |

## Testing

No test framework configured. Consider Vitest or Node's built-in test runner.

## Directory Structure

```
broxy-ext/
├── shared/                 # Shared core code (used by both builds)
│   ├── core/               # router.js, bridge-client.js, request-handler.js
│   ├── bridge/             # float-button.js, bridge-host.js
│   ├── endpoints/          # routes.js, mcp-tools.js, index.js
│   ├── utils/              # helpers.js, logger.js, config-manager.js, swagger.js
│   ├── config.js           # Configuration constants
│   └── main.js             # Main entry logic
├── userscript/             # Tampermonkey userscript build
├── extension/              # Chrome Extension build (WXT format)
├── dist/                   # Build intermediate files
└── .output/                # Extension build output
```

## Code Style Guidelines

### Module System

- Use **ES Modules** (ESM) only (`"type": "module"` in package.json)
- Always include `.js` extension in imports: `import { foo } from './bar.js';`
- Content script uses `defineContentScript()` from WXT

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `Router`, `BridgeClient`, `FloatButton` |
| Functions | camelCase | `handleRequest`, `getWebId`, `isInIframe` |
| Constants | UPPER_SNAKE_CASE | `WORKER_URL`, `HTTP_URL`, `AUTO_CONNECT` |
| Config objects | UPPER_SNAKE_CASE | `CONFIG`, `FLOAT_BUTTON` |
| localStorage keys | snake_case with prefix | `broxy_web_id`, `broxy_routes` |
| Event types | lowercase with dots | `bb/event`, `bb/action`, `bb/response` |
| CSS classes | kebab-case with prefix | `bb-dragging`, `bb-maximized` |

### Error Handling

```javascript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('[Broxy] Operation failed:', error);
  return { error: error.message };
}
```

### Console Logging

Always use bracket prefixes for log messages:
```javascript
console.log('[Broxy] Initializing...');
console.log('[Router] Matched route:', route.name);
console.error('[BridgeHost] Failed:', error);
```

### Configuration Objects

```javascript
export const CONFIG = {
  WORKER_DOMAIN: 'v1.broxy.dev',
  AUTO_CONNECT: location.host.endsWith('broxy.dev'),
  FLOAT_BUTTON: {
    size: 48,
    zIndex: 999999,
  },
};
```

### Route/Tool Definitions

```javascript
// Route
{
  id: 'route-1',
  name: 'getUserInfo',
  pattern: '/api/user',
  method: 'get',
  handler: 'async () => { return { name: "test" }; }',
  enabled: true
}

// MCP Tool
{
  id: 'tool-1',
  name: 'clickElement',
  pattern: '/mcp/clickElement',
  inputSchema: { type: 'object', properties: { selector: { type: 'string' } } },
  handler: 'async ({ selector }) => { document.querySelector(selector)?.click(); return { success: true }; }',
  enabled: true
}
```

### Handler Execution

Handlers are stored as strings and executed via `new Function()`:
```javascript
const handlerFn = new Function('return ' + route.handler)();
const result = await handlerFn(method, path, query, body, headers);
```

### PostMessage Communication

```javascript
// Event to iframe
window.postMessage({ type: 'bb/event', event: 'statusChange', data: {...} }, '*');
// Response to iframe
window.postMessage({ type: 'bb/response', id: 'req-1', result: {...} }, '*');
// Action from iframe
window.postMessage({ type: 'bb/action', id: 'req-1', action: 'saveRoute', data: {...} }, '*');
```

### DOM Manipulation

```javascript
Object.assign(element.style, { position: 'fixed', width: '48px', zIndex: '999999' });
element.classList.add('bb-dragging');
const button = document.createElement('div');
button.id = 'broxy-float-btn';
```

### Content Script (WXT)

```typescript
export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document_end',
  world: 'MAIN',  // Run in MAIN world to bypass CSP restrictions
  main() {
    if (window.__BROXY_INITIALIZED__) return;
    window.__BROXY_INITIALIZED__ = true;
    // ... initialization code
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
8. **MAIN World** - Content script runs in MAIN world to bypass CSP restrictions.
9. **No Auto Git Commit/Push** - Do NOT automatically run `git commit` or `git push`.

## Dynamic Action Registration

ext provides `registerAction` capability for hot-updating action handlers:

```javascript
// Register
await sendAction('registerAction', {
  name: 'myAction',
  handler: `async function(data) {
    // 'this' refers to BridgeHost instance
    return { success: true, result: this.configManager.getSkillConfig() };
  }`
});

// Call
const result = await sendAction('myAction', { param: 'value' });

// Unregister
await sendAction('unregisterAction', { name: 'myAction' });
```

Available context in handler (`this`): `configManager`, `client`, `router`, `logger`, `iframe`, `sendToIframe()`, `addLog()`, `addSystemLog()`.
