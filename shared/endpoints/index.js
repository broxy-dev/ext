// 端点注册中心
import { router } from '../core/router.js';
import { mcpTools } from './mcp-tools.js';
import { routes } from './routes.js';
import { ConfigManager } from '../utils/config-manager.js';
import { generateSkillContent } from '../utils/skill-generator.js';

// MCP 工具列表路由
const mcpToolsListRoute = {
  name: 'mcp_tools_list',
  pattern: '/mcp/tools/list',
  description: '返回所有MCP工具',
  handler: async () => {
    const tools = router.getMCPTools();
    console.log('[Broxy] Returning tools:', tools.length);
    return { tools };
  }
};

// MCP 配置路由
let configManagerInstance = null;
const mcpConfigRoute = {
  name: 'mcp_config',
  pattern: '/mcp/config',
  description: '返回 MCP 服务配置',
  handler: async () => {
    if (!configManagerInstance) {
      configManagerInstance = new ConfigManager();
    }
    return configManagerInstance.getMCPConfig();
  }
};

const skillMdRoute = {
  name: 'skill_md',
  pattern: '/SKILL.md',
  description: '返回 SKILL.md 文件内容',
  handler: async () => {
    if (!configManagerInstance) {
      configManagerInstance = new ConfigManager();
    }
    const skillConfig = configManagerInstance.getSkillConfig();
    const mcpConfig = configManagerInstance.getMCPConfig();
    const webId = window.broxy?.webId || '';
    const authEnabled = configManagerInstance.isAuthEnabled();
    const authToken = configManagerInstance.getAuthToken();

    const content = generateSkillContent(
      skillConfig, mcpConfig, webId, authEnabled, authToken
    );

    return {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      body: content
    };
  }
};

// 默认路由
const defaultRoute = {
  name: 'default',
  pattern: '*',
  description: '默认路由（所有未匹配的请求）',
  handler: async (method, path, query, body, headers) => {
    return {
      error: 'Route not found',
      path: path,
      method: method,
      availableRoutes: router.getAllRoutes()
    };
  }
};

let configManager = null;

// 初始化端点
export function initEndpoints() {
  configManager = new ConfigManager();
  configManagerInstance = configManager;

  mcpTools.forEach(tool => router.register(tool));
  routes.forEach(route => router.register(route));
  router.register(mcpToolsListRoute);
  router.register(mcpConfigRoute);
  router.register(skillMdRoute);
  router.register(defaultRoute);

  const dynamicRoutes = configManager.getAllRoutes().filter(r => r.enabled);
  const dynamicTools = configManager.getAllTools().filter(t => t.enabled);
  router.reloadRoutes(dynamicRoutes, dynamicTools);

  console.log('[Broxy] Endpoints initialized:',
    mcpTools.length + dynamicTools.length, 'MCP tools,',
    routes.length + dynamicRoutes.length, 'routes');
}

export { router, configManager };
