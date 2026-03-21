import { CONFIG, HTTP_URL } from '../config.js';

export class ConfigManager {
  constructor() {
    this.routes = [];
    this.tools = [];
    this.load();
  }

  ROUTES_KEY = 'broxy_routes';

  TOOLS_KEY = 'broxy_tools';

  MCP_CONFIG_KEY = 'broxy_mcp_config';

  INIT_SCRIPT_KEY = 'broxy_init_script';

  AUTH_TOKEN_KEY = 'broxy_auth_token';

  AUTH_ENABLED_KEY = 'broxy_auth_enabled';

  SKILL_CONFIG_KEY = 'broxy_skill_config';

  THEME_KEY = 'broxy_theme';

  LANGUAGE_KEY = 'broxy_language';

  WEB_ID_KEY = 'broxy_web_id';

  load() {
    const routes = localStorage.getItem(this.ROUTES_KEY);
    const tools = localStorage.getItem(this.TOOLS_KEY);
    const mcpConfig = localStorage.getItem(this.MCP_CONFIG_KEY);
    const initScript = localStorage.getItem(this.INIT_SCRIPT_KEY);

    const hasStoredData = routes || tools || mcpConfig || initScript;

    if (!hasStoredData && window.__BROXY_INIT_DATA__) {
      console.log('[Broxy] Using initial data from data.json');
      const initData = window.__BROXY_INIT_DATA__;
      if (initData.data) {
        this.routes = initData.data.routes || [];
        this.tools = initData.data.tools || [];
        if (initData.data.mcpConfig) {
          this.setMCPConfig(initData.data.mcpConfig);
        }
        if (initData.data.initScript) {
          this.setInitScript(initData.data.initScript);
        }
        this.saveRoutes();
        this.saveTools();
      }
    } else {
      this.routes = routes ? JSON.parse(routes) : [];
      this.tools = tools ? JSON.parse(tools) : [];
    }
  }

  getAllRoutes() {
    return this.routes;
  }

  getAllTools() {
    return this.tools;
  }

  getEnabledRoutes() {
    return this.routes.filter(r => r.enabled);
  }

  getEnabledTools() {
    return this.tools.filter(t => t.enabled);
  }

  getWebId() {
    let webId = localStorage.getItem(this.WEB_ID_KEY);
    if (!webId) {
      webId = crypto.randomUUID();
      localStorage.setItem(this.WEB_ID_KEY, webId);
    }
    return webId;
  }

  getApiUrl() {
    return `${HTTP_URL}/api/${this.getWebId()}`;
  }

  getMcpUrl() {
    return `${HTTP_URL}/mcp/${this.getWebId()}`;
  }

  saveRoutes() {
    localStorage.setItem(this.ROUTES_KEY, JSON.stringify(this.routes));
  }

  saveTools() {
    localStorage.setItem(this.TOOLS_KEY, JSON.stringify(this.tools));
  }

  addRoute(route) {
    this.routes.push(route);
    this.saveRoutes();
  }

  updateRoute(id, route) {
    const index = this.routes.findIndex(r => r.id === id);
    if (index !== -1) {
      this.routes[index] = route;
      this.saveRoutes();
    }
  }

  deleteRoute(id) {
    this.routes = this.routes.filter(r => r.id !== id);
    this.saveRoutes();
  }

  addTool(tool) {
    this.tools.push(tool);
    this.saveTools();
  }

  updateTool(id, tool) {
    const index = this.tools.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tools[index] = tool;
      this.saveTools();
    }
  }

  deleteTool(id) {
    this.tools = this.tools.filter(t => t.id !== id);
    this.saveTools();
  }

  getMCPConfig() {
    const config = localStorage.getItem(this.MCP_CONFIG_KEY);
    return config ? JSON.parse(config) : {
      name: 'WEB MCP Server',
      version: '1.0.0',
    };
  }

  setMCPConfig(config) {
    localStorage.setItem(this.MCP_CONFIG_KEY, JSON.stringify(config));
  }

  getInitScript() {
    return localStorage.getItem(this.INIT_SCRIPT_KEY) || '';
  }

  setInitScript(code) {
    localStorage.setItem(this.INIT_SCRIPT_KEY, code);
  }

  getAuthToken() {
    return localStorage.getItem(this.AUTH_TOKEN_KEY) || '';
  }

  setAuthToken(token) {
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
  }

  isAuthEnabled() {
    return localStorage.getItem(this.AUTH_ENABLED_KEY) === 'true';
  }

  setAuthEnabled(enabled) {
    localStorage.setItem(this.AUTH_ENABLED_KEY, String(enabled));
  }

  getSkillConfig() {
    const config = localStorage.getItem(this.SKILL_CONFIG_KEY);
    return config ? JSON.parse(config) : {
      name: '',
      description: '',
      usageNotes: '',
    };
  }

  setSkillConfig(config) {
    localStorage.setItem(this.SKILL_CONFIG_KEY, JSON.stringify(config));
  }

  getTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'system';
  }

  setTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  getLanguage() {
    return localStorage.getItem(this.LANGUAGE_KEY) || '';
  }

  setLanguage(lang) {
    localStorage.setItem(this.LANGUAGE_KEY, lang);
  }

  generateToken() {
    return crypto.randomUUID();
  }

  exportAllData() {
    return {
      version: '1.0',
      exportTime: new Date().toISOString(),
      source: 'broxy.dev',
      data: {
        routes: this.routes,
        tools: this.tools,
        mcpConfig: this.getMCPConfig(),
        initScript: this.getInitScript(),
        authToken: this.getAuthToken(),
        authEnabled: this.isAuthEnabled(),
        skillConfig: this.getSkillConfig(),
        theme: this.getTheme(),
        language: this.getLanguage(),
      },
    };
  }

  importAllData(jsonData) {
    const { data } = jsonData;
    if (data.routes) {
      this.routes = this.mergeData(this.routes, data.routes);
      this.saveRoutes();
    }
    if (data.tools) {
      this.tools = this.mergeData(this.tools, data.tools);
      this.saveTools();
    }
    if (data.mcpConfig) {
      this.setMCPConfig(data.mcpConfig);
    }
    if (data.initScript !== undefined) {
      this.setInitScript(data.initScript);
    }
    if (data.authToken !== undefined) {
      this.setAuthToken(data.authToken);
    }
    if (data.authEnabled !== undefined) {
      this.setAuthEnabled(data.authEnabled);
    }
    if (data.skillConfig !== undefined) {
      this.setSkillConfig(data.skillConfig);
    }
    if (data.theme !== undefined) {
      this.setTheme(data.theme);
    }
    if (data.language !== undefined) {
      this.setLanguage(data.language);
    }
  }

  mergeData(existingData, importedData) {
    const result = [...existingData];
    for (const importedItem of importedData) {
      const existingIndex = result.findIndex(item => item.id === importedItem.id);
      if (existingIndex >= 0) {
        result[existingIndex] = importedItem;
      } else {
        result.push(importedItem);
      }
    }
    return result;
  }
}
