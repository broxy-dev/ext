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

## 安装

### 浏览器扩展（推荐）

从 Edge 扩展商店安装：[Broxy](https://microsoftedge.microsoft.com/addons/detail/broxy/kbbobefcojhkfldidakefeeggjgldbjf)

> 同时兼容 Chrome 及其他基于 Chromium 的浏览器。

### 油猴脚本

从源码构建并手动安装：

```bash
npm install
npm run build
```

然后将 `tampermonkey-loader.js` 内容复制到 Tampermonkey 新建脚本中。

## 目录结构

```
broxy-ext/
├── shared/                 # 共享核心代码（双构建共用）
│   ├── core/               # router.js, bridge-client.js, request-handler.js
│   ├── bridge/             # float-button.js, bridge-host.js
│   ├── endpoints/          # routes.js, mcp-tools.js, index.js
│   ├── utils/              # helpers.js, logger.js, config-manager.js, swagger.js
│   ├── config.js           # 配置常量
│   └── main.js             # 主入口
├── userscript/             # 油猴脚本构建
│   ├── scripts/            # generate-loader.js, tampermonkey-template.js
│   ├── data.json           # 默认配置数据
│   └── rollup.config.js    # Rollup 配置
├── extension/              # Chrome 扩展构建
│   ├── entrypoints/        # Content Script 入口
│   ├── public/icon/        # 扩展图标
│   └── wxt.config.ts       # WXT 配置
├── dist/                   # 构建中间文件
│   └── broxy.js            # 打包核心代码
├── .output/                # 扩展构建输出
│   └── chrome-mv3/         # Chrome 扩展可直接加载
├── tampermonkey-loader.js  # 油猴脚本输出
└── package.json
```

## 快速开始

### 普通用户

从 [Edge 扩展商店](https://microsoftedge.microsoft.com/addons/detail/broxy/kbbobefcojhkfldidakefeeggjgldbjf)安装即可使用。

### 开发者

```bash
# 安装依赖
npm install

# 构建全部（油猴脚本 + 扩展）
npm run build

# 仅构建油猴脚本
npm run build:us

# 仅构建 Chrome 扩展
npm run build:ext

# 开发模式（扩展 HMR）
npm run dev
```

### 构建产物

| 产物 | 输出路径 | 用途 |
|------|----------|------|
| 油猴脚本 | `tampermonkey-loader.js` | 安装到 Tampermonkey |
| Chrome 扩展 | `.output/chrome-mv3/` | Chrome 加载已解压的扩展 |

### 默认数据（可选）

创建 `userscript/data.json` 设置初始配置：

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
