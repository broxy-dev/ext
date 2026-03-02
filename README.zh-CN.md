# Broxy Extension

[English](./README.md)

将任意网页转换为 API 和 MCP (Model Context Protocol) 服务。使用 Rollup 打包。

## 功能特性

- 将任意网页转换为 REST API 端点
- 为 AI 助手创建 MCP 工具
- 通过 WebSocket 桥接到 Cloudflare Worker
- 实时请求日志
- Monaco Editor 代码编辑器
- 数据导入/导出

## 目录结构

```
ext/
├── src/                      # 源代码
│   ├── config.js            # 配置文件
│   ├── main.js              # 应用入口
│   ├── endpoints/           # 端点定义
│   │   ├── index.js        # 端点注册中心
│   │   ├── mcp-tools.js    # MCP 工具
│   │   └── routes.js       # 普通路由
│   ├── core/                # 核心功能
│   │   ├── router.js       # 路由系统
│   │   └── bridge-client.js # WebSocket 客户端
│   ├── bridge/              # UI 组件
│   │   ├── float-button.js # 浮动按钮
│   │   └── bridge-host.js  # iframe 管理
│   └── utils/               # 工具函数
│       ├── helpers.js      # 辅助函数
│       ├── logger.js       # 日志管理
│       └── config-manager.js # 配置管理
├── dist/                    # 打包输出
│   └── broxy.js            # 最终脚本
├── scripts/                 # 构建脚本
│   ├── generate-loader.js  # 生成油猴脚本
│   └── tampermonkey-template.js # 油猴模板
├── data.json               # 默认配置（可选）
├── tampermonkey-loader.js  # 油猴加载脚本
├── package.json
└── rollup.config.js
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置（可选）

编辑 `src/config.js`，修改 `WORKER_DOMAIN`：

```javascript
WORKER_DOMAIN: 'your-worker-domain.workers.dev'
```

### 3. 默认数据（可选）

创建 `data.json` 设置初始配置：

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

### 4. 打包

```bash
npm run build
```

输出文件：
- `dist/broxy.js` - 核心代码
- `tampermonkey-loader.js` - 油猴脚本（可直接安装）

### 5. 安装到油猴

将 `tampermonkey-loader.js` 内容复制到 Tampermonkey 新建脚本中。

## UI 面板

面板包含 5 个标签页：

1. **基本信息** - 连接状态、Web ID、API/MCP/Swagger 地址
2. **执行日志** - 请求历史记录
3. **路由管理** - 添加/编辑/删除路由
4. **工具管理** - 添加/编辑/删除 MCP 工具
5. **设置** - MCP 配置、数据导入导出

### 路由管理

- 支持：固定路径、正则表达式、通配符匹配
- HTTP 方法：GET/POST/PUT/DELETE/ALL
- 使用 Monaco Editor 编辑处理函数
- 启用/禁用开关

### 工具管理

- 工具名称：仅支持字母、数字、下划线
- 自动生成 pattern：`/mcp/{toolName}`
- 参数配置：名称、类型、描述、是否必填
- 使用 Monaco Editor 编辑处理函数

### 数据导入导出

- **导出**：下载 JSON 文件，包含所有配置
- **文件导入**：选择 JSON 文件导入
- **文本导入**：粘贴 JSON 数据导入
- 合并策略：相同 ID 覆盖，新数据追加

### 初始数据

- `data.json` 在构建时注入到脚本
- localStorage 无数据时自动使用
- localStorage 有数据时忽略初始数据

## 开发模式

```bash
npm run dev
```

监听文件变化自动重新打包。

## 技术栈

| 组件 | 技术 |
|------|------|
| 打包工具 | Rollup |
| UI 框架 | layui 2.13.3 |
| 代码编辑 | Monaco Editor 0.45.0 |
| 通信协议 | WebSocket + JSON-RPC |

## 架构图

```
┌─────────────────┐      WebSocket      ┌──────────────────┐
│   浏览器        │◄──────────────────►│  Cloudflare      │
│   (Broxy)       │                     │  Worker          │
│                 │                     │                  │
│  ┌───────────┐  │                     │  - 代理 API      │
│  │ 路由器    │  │                     │  - MCP 协议      │
│  │ 处理器    │  │                     │  - 认证          │
│  └───────────┘  │                     └──────────────────┘
└─────────────────┘                             │
                                                ▼
                                        ┌──────────────────┐
                                        │  外部应用        │
                                        └──────────────────┘
```

## 许可证

MIT
