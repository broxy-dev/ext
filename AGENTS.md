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

No linter configured. TypeScript checking available via `tsconfig.json`.

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
│   ├── scripts/            # generate-loader.js, tampermonkey-template.js
│   ├── data.json           # Default config data
│   └── rollup.config.js    # Rollup configuration
├── extension/              # Chrome Extension build
│   ├── entrypoints/
│   │   └── content.ts      # Content script entry (WXT format)
│   ├── public/icon/        # Extension icons (16/32/48/128.png)
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

Each file starts with a brief comment describing the module:
```javascript
// 路由匹配系统
// 浮动按钮组件
// 工具函数模块
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `Router`, `BridgeClient`, `FloatButton` |
| Functions | camelCase | `handleRequest`, `getWebId`, `isInIframe` |
| Constants | UPPER_SNAKE_CASE | `WORKER_URL`, `HTTP_URL`, `AUTO_CONNECT` |
| Config objects | UPPER_SNAKE_CASE | `CONFIG`, `FLOAT_BUTTON` |
| localStorage keys | snake_case with prefix | `broxy_web_id_`, `broxy_routes_` |
| Event types | lowercase with dots | `bb/event`, `bb/action`, `bb/response` |
| CSS classes | kebab-case with prefix | `bb-dragging`, `bb-reconnecting` |

### Class Structure

```javascript
export class ClassName {
  constructor(param) {
    this.property = param;
    this.state = 'initial';
  }

  publicMethod() {
    return this.privateHelper();
  }

  privateHelper() {
    return 'result';
  }
}
```

### Error Handling

```javascript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('[Broxy] Operation failed:', error);
  return { error: error.message };
}

// Return error objects for route handlers
if (!matched) {
  return { error: 'No route matched', path: formattedPath };
}
```

### Console Logging

Always use bracket prefixes for log messages:
```javascript
console.log('[Broxy] Initializing...');
console.log('[Router] Matched route:', route.name);
console.error('[FloatButton] Failed to create:', error);
```

### Configuration Objects

```javascript
export const CONFIG = {
  WORKER_DOMAIN: 'v1.broxy.dev',
  
  // Use getters for dynamic keys based on hostname
  get WEB_ID_KEY() {
    return `broxy_web_id_${window.location.hostname}`;
  },
  
  FLOAT_BUTTON: {
    size: 48,
    zIndex: 999999,
    defaultPosition: 'bottom-right',
    offset: 20,
  },
};
```

### Route/Tool Definitions

```javascript
// Route structure
{
  id: 'route-1',           // Unique identifier
  name: 'getUserInfo',     // Route name
  pattern: '/api/user',    // URL pattern (string or RegExp)
  method: 'get',           // HTTP method (optional, default: 'all')
  description: 'Get user info',
  handler: 'async () => { return { name: "test" }; }',  // Handler as string
  enabled: true
}

// MCP Tool structure
{
  id: 'tool-1',
  name: 'clickElement',
  pattern: '/mcp/clickElement',
  description: 'Click an element',
  inputSchema: {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector' }
    },
    required: ['selector']
  },
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
// Event from iframe
window.postMessage({ type: 'bb/event', event: 'statusChange', data: {...} }, '*');

// Response to iframe
window.postMessage({ type: 'bb/response', id: 'req-1', result: {...} }, '*');

// Action from iframe
window.postMessage({ type: 'bb/action', id: 'req-1', action: 'saveRoute', data: {...} }, '*');
```

### DOM Manipulation

```javascript
// Use Object.assign for multiple styles
Object.assign(element.style, {
  position: 'fixed',
  width: '48px',
  zIndex: '999999'
});

// Use classList for classes
element.classList.add('bb-dragging');
element.classList.remove('bb-dragging');

// Create elements with properties
const button = document.createElement('div');
button.id = 'broxy-float-btn';
button.title = 'Broxy';
```

### Content Script (WXT)

```typescript
export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document_end',
  world: 'MAIN',  // Run in MAIN world to bypass CSP restrictions
  main() {
    // Import from shared/ and execute
    if (window.__BROXY_INITIALIZED__) return;
    window.__BROXY_INITIALIZED__ = true;
    
    // ... initialization code
  },
});
```

### Version Management

Version is unified in `package.json`. Both userscript and extension read from it at build time:
- `extension/wxt.config.ts` imports `pkg.version`
- `userscript/scripts/generate-loader.js` injects `pkg.version` into template

## Important Notes

1. **Shared Code** - All core logic lives in `shared/`. Both builds import from here.
2. **Browser Environment** - Use `window`, `document`, `localStorage`, `WebSocket`, `crypto.randomUUID()`.
3. **No Comments** - Do not add comments unless explicitly requested.
4. **No Runtime Dependencies** - Only build-time devDependencies (rollup, wxt).
5. **Handler Strings** - Handlers stored as strings, executed via `new Function()`.
6. **Dual Build** - Code must work in both Tampermonkey and Chrome Extension contexts.
7. **localStorage** - Using localStorage (not chrome.storage) for simplicity and compatibility.
8. **MAIN World** - Content script runs in MAIN world to bypass CSP restrictions (same as Tampermonkey).
9. **No Auto Git Commit/Push** - Do NOT automatically run `git commit` or `git push`. User needs to manually review code before committing.
