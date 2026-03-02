# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Project Overview

Broxy Extension - A browser userscript that converts any webpage into API and MCP services via WebSocket bridge to Cloudflare Worker.

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Build (rollup + generate loader)
npm run dev          # Development mode (watch for changes)
npm run generate-loader  # Generate tampermonkey loader only
```

## Build Output

- `dist/broxy.js` - Bundled core code (IIFE format)
- `tampermonkey-loader.js` - Final userscript for Tampermonkey

## Testing

No test framework configured. Consider Vitest or Node's built-in test runner.

## Linting/Type Checking

No linter or type checker configured. Consider adding ESLint with `@eslint/js`.

## Code Style Guidelines

### Module System

- Use **ES Modules** (ESM) only (`"type": "module"` in package.json)
- Always include `.js` extension in imports: `import { foo } from './bar.js';`

### File Headers

Each file starts with a brief comment: `// 路由匹配系统`

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

## Directory Structure

```
src/
├── config.js           # Configuration constants
├── main.js             # Entry point
├── core/               # router.js, bridge-client.js, request-handler.js
├── endpoints/          # index.js, routes.js, mcp-tools.js
├── bridge/             # float-button.js, bridge-host.js
└── utils/              # helpers.js, logger.js, config-manager.js, swagger.js
```

## Important Notes

1. **No TypeScript** - Plain JavaScript only. No type annotations.
2. **Browser Environment** - Use `window`, `document`, `localStorage`, `WebSocket`, `crypto.randomUUID()`.
3. **No Comments** - Do not add comments unless explicitly requested.
4. **IIFE Bundle** - Final output is IIFE for Tampermonkey. Entry: `src/main.js`.
5. **No Runtime Dependencies** - Only build-time devDependencies. No npm packages.
6. **Handler Strings** - Handlers stored as strings, executed via `new Function()`.
