// OpenAPI/Swagger 生成器

const HTTP_URL = `https://${window.BROXY_CONFIG?.WORKER_DOMAIN || 'v1.broxy.dev'}`;

export function generateSwaggerJson(routes, webId) {
  const swagger = {
    openapi: '3.0.0',
    info: {
      title: 'Broxy',
      description: '将任意网页转换为 API 和 MCP 服务',
      version: '1.0.0',
      contact: {
        name: 'Broxy',
        url: 'https://broxy.dev'
      }
    },
    servers: [
      {
        url: `${HTTP_URL}/api/{webId}`,
        description: 'Worker API 代理端点',
        variables: {
          webId: {
            description: '浏览器实例 ID',
            default: webId || 'your_web_id'
          }
        }
      }
    ],
    paths: {},
    tags: [
      { name: 'routes', description: 'API 路由' }
    ]
  };

  for (const route of routes) {
    if (route.name === 'default' || route.name === 'mcp_tools_list' || route.name === 'swagger') {
      continue;
    }

    const pattern = route.pattern;
    const isRegex = pattern instanceof RegExp;
    const isWildcard = typeof pattern === 'string' && pattern.includes('*');

    if (!isRegex && !isWildcard) {
      swagger.paths[pattern] = generateRouteOpenAPI(route);
    } else if (isRegex) {
      const pathName = pattern.toString().replace(/^\//, '').replace(/\/$/, '');
      swagger.paths[`[regex]${pathName}`] = generateRegexRouteOpenAPI(route);
    } else if (isWildcard) {
      swagger.paths[pattern] = generateWildcardRouteOpenAPI(route);
    }
  }

  return swagger;
}

function generateRouteOpenAPI(route) {
  const method = (route.method || 'all').toLowerCase();
  const pathItem = {};

  const operation = {
    tags: ['routes'],
    summary: route.description || route.name,
    operationId: route.name,
    responses: {
      '200': {
        description: '成功响应',
        content: {
          'application/json': {
            schema: {
              type: 'object'
            }
          }
        }
      }
    }
  };

  if (method === 'all') {
    pathItem.get = { ...operation, operationId: `${route.name}_get` };
    pathItem.post = { ...operation, operationId: `${route.name}_post` };
    pathItem.put = { ...operation, operationId: `${route.name}_put` };
    pathItem.delete = { ...operation, operationId: `${route.name}_delete` };
  } else {
    pathItem[method] = operation;
  }

  return pathItem;
}

function generateRegexRouteOpenAPI(route) {
  const method = (route.method || 'all').toLowerCase();
  const pathItem = {};

  const operation = {
    tags: ['routes'],
    summary: `[正则路由] ${route.description || route.name}`,
    description: `匹配模式: ${route.pattern.toString()}`,
    operationId: route.name,
    responses: {
      '200': {
        description: '成功响应',
        content: {
          'application/json': {
            schema: {
              type: 'object'
            }
          }
        }
      }
    }
  };

  if (method === 'all') {
    pathItem.get = { ...operation, operationId: `${route.name}_get` };
  } else {
    pathItem[method] = operation;
  }

  return pathItem;
}

function generateWildcardRouteOpenAPI(route) {
  const method = (route.method || 'all').toLowerCase();
  const pathItem = {};

  const operation = {
    tags: ['routes'],
    summary: `[通配符路由] ${route.description || route.name}`,
    description: `匹配模式: ${route.pattern}`,
    operationId: route.name,
    responses: {
      '200': {
        description: '成功响应',
        content: {
          'application/json': {
            schema: {
              type: 'object'
            }
          }
        }
      }
    }
  };

  if (method === 'all') {
    pathItem.get = { ...operation, operationId: `${route.name}_get` };
  } else {
    pathItem[method] = operation;
  }

  return pathItem;
}
