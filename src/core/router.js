// 路由匹配系统
class Router {
  constructor() {
    this.routes = [];
  }

  // 注册路由
  register(route) {
    this.routes.push(route);
  }

  // 删除路由
  unregister(routeName) {
    const index = this.routes.findIndex(r => r.name === routeName);
    if (index !== -1) {
      this.routes.splice(index, 1);
    }
  }

  // 重新加载动态路由
  reloadRoutes(routes, tools) {
    console.log('[Router] Reloading, current routes count:', this.routes.length);
    console.log('[Router] Removing dynamic routes (routes with id)');
    this.routes = this.routes.filter(r => !r.id);
    console.log('[Router] After removal, routes count:', this.routes.length);

    console.log('[Router] Adding dynamic routes:', routes.length);
    routes.forEach(route => {
      if (!route.enabled) return;
      try {
        const handlerFn = new Function('return ' + route.handler)();
        const newRoute = {
          name: route.name,
          pattern: route.pattern,
          method: route.method || 'all',
          description: route.description,
          handler: handlerFn,
          id: route.id
        };
        this.routes.push(newRoute);
        console.log('[Router] Loaded route:', route.name, route.pattern, 'method:', route.method, 'with id:', route.id);
      } catch (error) {
        console.error('[Router] Failed to load route:', route.name, error);
      }
    });

    console.log('[Router] Adding dynamic tools:', tools.length);
    tools.forEach(tool => {
      if (!tool.enabled) return;
      try {
        const handlerFn = new Function('return ' + tool.handler)();
        const newTool = {
          name: tool.name,
          pattern: tool.pattern,
          description: tool.description,
          handler: handlerFn,
          inputSchema: tool.inputSchema,
          id: tool.id
        };
        this.routes.push(newTool);
        console.log('[Router] Loaded tool:', tool.name, tool.pattern, 'with id:', tool.id);
      } catch (error) {
        console.error('[Router] Failed to load tool:', tool.name, error);
      }
    });

    console.log('[Router] Final routes count:', this.routes.length);
  }

  // 批量注册路由
  registerAll(routes) {
    routes.forEach(route => this.register(route));
  }

  // 匹配路由
  match(path, method = null) {
    console.log('[Router] Matching path:', path, 'method:', method, 'with', this.routes.length, 'routes');
    for (const route of this.routes) {
      // 默认路由
      if (route.pattern === '*') {
        console.log('[Router] Checking default route (will be used if no other matches)');
        continue;
      }

      // 检查 method 是否匹配
      if (method && route.method && route.method !== 'all' && route.method.toLowerCase() !== method.toLowerCase()) {
        continue;
      }

      // 字符串匹配（固定值或通配符）
      if (typeof route.pattern === 'string') {
        if (route.pattern.includes('*')) {
          // 通配符匹配
          const regexPattern = '^' + route.pattern.replace(/\*/g, '.*') + '$';
          const regex = new RegExp(regexPattern);
          const matches = path.match(regex);
          if (matches) {
            console.log('[Router] Matched wildcard route:', route.name, route.pattern);
            return { route, matches };
          }
        } else {
          // 固定值匹配
          if (route.pattern === path) {
            console.log('[Router] Matched exact route:', route.name, route.pattern);
            return { route, matches: null };
          } else {
            if (path.length < 50) {
              console.log('[Router] No match for route:', route.name, 'pattern:', route.pattern, '!=', path);
            }
          }
        }
      }
      // 正则表达式匹配
      else if (route.pattern instanceof RegExp) {
        const matches = path.match(route.pattern);
        if (matches) {
          console.log('[Router] Matched regex route:', route.name, route.pattern);
          return { route, matches: null };
        }
      }
    }

    console.log('[Router] No match found, returning default route');
    // 默认路由作为回退
    const defaultRoute = this.routes.find(r => r.pattern === '*');
    if (defaultRoute) {
      return { route: defaultRoute, matches: null };
    }
    return null;
  }

  // 获取所有 MCP 工具（用于 tools/list 接口）
  getMCPTools() {
    return this.routes
      .filter(route =>
        typeof route.pattern === 'string' &&
        route.pattern.startsWith('/mcp/') &&
        route.name !== 'mcp_tools_list' &&
        route.name !== 'mcp_config' &&
        route.inputSchema
      )
      .map(route => ({
        name: route.name,
        description: route.description,
        inputSchema: route.inputSchema,
      }));
  }

  // 获取所有路由信息（排除 MCP 工具）
  getAllRoutes() {
    return this.routes
      .filter(r => 
        r.name !== 'default' && 
        !(typeof r.pattern === 'string' && r.pattern.startsWith('/mcp/'))
      )
      .map(r => ({
        name: r.name,
        pattern: r.pattern.toString(),
        description: r.description
      }));
  }

  // 获取所有路由详细信息（排除 MCP 工具，用于 swagger 生成）
  getAllRoutesDetailed() {
    return this.routes
      .filter(r => 
        r.name !== 'default' && 
        !(typeof r.pattern === 'string' && r.pattern.startsWith('/mcp/'))
      );
  }
}

export const router = new Router();
