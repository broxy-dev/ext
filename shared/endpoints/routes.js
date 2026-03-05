// 普通路由模块
import { generateSwaggerJson } from '../utils/swagger.js';
import { router } from '../core/router.js';

export const routes = [
  // OpenAPI/Swagger 文档
  {
    name: 'swagger',
    pattern: '/swagger.json',
    description: '返回 OpenAPI/Swagger 格式的 API 文档',
    handler: async () => {
      const allRoutes = router.getAllRoutesDetailed();
      const webId = window.browserBridge?.webId || '';
      return generateSwaggerJson(allRoutes, webId);
    }
  }
];
