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

## Installation

### Browser Extension (Recommended)

Install from Edge Add-ons: [Broxy](https://microsoftedge.microsoft.com/addons/detail/broxy/kbbobefcojhkfldidakefeeggjgldbjf)

> Also compatible with Chrome and other Chromium-based browsers.

### Userscript (Tampermonkey)

Build from source and manually install:

```bash
npm install
npm run build
```

Then copy `tampermonkey-loader.js` content to a new Tampermonkey script.

## Directory Structure

```
broxy-ext/
├── shared/                 # Shared core code (used by both builds)
│   ├── core/               # router.js, bridge-client.js, request-handler.js
│   ├── bridge/             # float-button.js, bridge-host.js
│   ├── endpoints/          # routes.js, mcp-tools.js, index.js
│   ├── utils/              # helpers.js, logger.js, config-manager.js, swagger.js
│   ├── config.js           # Configuration constants
│   └── main.js             # Main entry
├── userscript/             # Tampermonkey userscript build
│   ├── scripts/            # generate-loader.js, tampermonkey-template.js
│   ├── data.json           # Default config data
│   └── rollup.config.js    # Rollup configuration
├── extension/              # Chrome Extension build
│   ├── entrypoints/        # Content script (WXT format)
│   ├── public/icon/        # Extension icons
│   └── wxt.config.ts       # WXT configuration
├── dist/                   # Build intermediate files
│   └── broxy.js            # Bundled core code
├── .output/                # Extension build output
│   └── chrome-mv3/         # Chrome Extension ready to load
├── tampermonkey-loader.js  # Userscript output
└── package.json
```

## Quick Start

### For Users

Install from [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/broxy/kbbobefcojhkfldidakefeeggjgldbjf) and start using immediately.

### For Developers

```bash
# Install dependencies
npm install

# Build all (userscript + extension)
npm run build

# Build userscript only
npm run build:us

# Build Chrome Extension only
npm run build:ext

# Development mode (Extension with HMR)
npm run dev
```

### Build Outputs

| Product | Output Path | Usage |
|---------|-------------|-------|
| Userscript | `tampermonkey-loader.js` | Install to Tampermonkey |
| Chrome Extension | `.output/chrome-mv3/` | Chrome load unpacked |

### Default Data (Optional)

Create `userscript/data.json` for initial configuration:

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
