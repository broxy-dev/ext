import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'extension',
  manifest: {
    name: 'Broxy',
    version: '1.0.0',
    description: '将任意网页转换为 API 和 MCP 服务',
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
  },
});
