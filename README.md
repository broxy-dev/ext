# Broxy Extension

[中文文档](./README.zh-CN.md)

Convert any webpage into API and MCP (Model Context Protocol) services. Bundled with Rollup.

## Features

- Transform any webpage into REST API endpoints
- Create MCP tools for AI assistants
- WebSocket bridge to Cloudflare Worker
- Real-time request logging
- Monaco Editor for handler code editing
- Data import/export

## Directory Structure

```
ext/
├── src/                      # Source code
│   ├── config.js            # Configuration
│   ├── main.js              # Entry point
│   ├── endpoints/           # API endpoints
│   │   ├── index.js        # Endpoint registry
│   │   ├── mcp-tools.js    # MCP tools
│   │   └── routes.js       # HTTP routes
│   ├── core/                # Core functionality
│   │   ├── router.js       # Route system
│   │   └── bridge-client.js # WebSocket client
│   ├── bridge/              # UI components
│   │   ├── float-button.js # Floating button
│   │   └── bridge-host.js  # iframe management
│   └── utils/               # Utilities
│       ├── helpers.js      # Helper functions
│       ├── logger.js       # Logging
│       └── config-manager.js # Config persistence
├── dist/                    # Build output
│   └── broxy.js            # Bundled script
├── scripts/                 # Build scripts
│   ├── generate-loader.js  # Generate userscript
│   └── tampermonkey-template.js # Userscript template
├── data.json               # Default config (optional)
├── tampermonkey-loader.js  # Tampermonkey userscript
├── package.json
└── rollup.config.js
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure (Optional)

Edit `src/config.js` to modify `WORKER_DOMAIN`:

```javascript
WORKER_DOMAIN: 'your-worker-domain.workers.dev'
```

### 3. Default Data (Optional)

Create `data.json` for initial configuration:

```json
{
  "version": "1.0",
  "data": {
    "routes": [
      {
        "id": "route-1",
        "name": "hello",
        "pattern": "/hello",
        "method": "get",
        "description": "Hello API",
        "handler": "async () => { return { message: 'Hello!' }; }",
        "enabled": true
      }
    ],
    "tools": [
      {
        "id": "tool-1",
        "name": "echo",
        "pattern": "/mcp/echo",
        "description": "Echo tool",
        "inputSchema": {
          "type": "object",
          "properties": {
            "text": { "type": "string", "description": "Text to echo" }
          },
          "required": []
        },
        "handler": "async ({ text }) => { return { echo: text }; }",
        "enabled": true
      }
    ],
    "mcpConfig": {
      "name": "My MCP Server",
      "version": "1.0.0"
    }
  }
}
```

### 4. Build

```bash
npm run build
```

Output files:
- `dist/broxy.js` - Core bundle
- `tampermonkey-loader.js` - Ready-to-install userscript

### 5. Install to Tampermonkey

Copy `tampermonkey-loader.js` content to a new Tampermonkey script.

## UI Panel

The panel contains 5 tabs:

1. **Info** - Connection status, Web ID, API/MCP/Swagger URLs
2. **Logs** - Request history
3. **Routes** - Add/Edit/Delete HTTP routes
4. **Tools** - Add/Edit/Delete MCP tools
5. **Settings** - MCP config, data import/export

### Route Management

- Support: fixed path, regex, wildcard matching
- HTTP methods: GET/POST/PUT/DELETE/ALL
- Monaco Editor for handler code
- Enable/Disable toggle

### Tool Management

- Tool names: letters, numbers, underscores only
- Auto-generated pattern: `/mcp/{toolName}`
- Parameter config: name, type, description, required
- Monaco Editor for handler code

### Data Import/Export

- **Export**: Download JSON file with all configurations
- **File Import**: Select JSON file to import
- **Text Import**: Paste JSON data
- Merge strategy: same ID overwrites, new data appends

### Initial Data

- `data.json` injected at build time
- Auto-used when localStorage is empty
- Ignored when localStorage has data

## Development

```bash
npm run dev
```

Watch for file changes and auto-rebuild.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Bundler | Rollup |
| UI Framework | layui 2.13.3 |
| Code Editor | Monaco Editor 0.45.0 |
| Protocol | WebSocket + JSON-RPC |

## Architecture

```
┌─────────────────┐      WebSocket      ┌──────────────────┐
│   Browser       │◄──────────────────►│  Cloudflare      │
│   (Broxy)       │                     │  Worker          │
│                 │                     │                  │
│  ┌───────────┐  │                     │  - Proxy API     │
│  │ Router    │  │                     │  - MCP Protocol  │
│  │ Handlers  │  │                     │  - Auth          │
│  └───────────┘  │                     └──────────────────┘
└─────────────────┘                             │
                                                ▼
                                        ┌──────────────────┐
                                        │  External        │
                                        │  Applications    │
                                        └──────────────────┘
```

## License

MIT
