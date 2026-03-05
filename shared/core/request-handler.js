// 请求处理器
import { router } from './router.js';

export async function handleRequest(method, path, query, body, headers) {
  const formattedPath = path.replace(/^\/(https?:\/\/)/, '$1');

  console.log('[Broxy] Request:', method, formattedPath, query);

  const matched = router.match(formattedPath, method);
  if (!matched) {
    return {
      error: 'No route matched',
      path: formattedPath,
      method: method
    };
  }

  const { route, matches } = matched;
  console.log('[Broxy] Matched route:', route.name);

  try {
    const isMCPTool = typeof route.pattern === 'string' &&
      route.pattern.startsWith('/mcp/') &&
      route.name !== 'mcp_tools_list';

    let result;
    if (isMCPTool) {
      result = await route.handler(body);
    } else {
      result = await route.handler(method, formattedPath, query, body, headers, matches);
    }

    return result;
  } catch (error) {
    console.error('[Broxy] Route handler error:', error);

    return {
      error: error.message,
      route: route.name,
      stack: error.stack
    };
  }
}
