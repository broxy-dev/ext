import { defineConfig } from 'wxt';
import pkg from '../package.json';

export default defineConfig({
  srcDir: 'extension',
  manifest: {
    name: 'Broxy',
    version: pkg.version,
    description: '将任意网页转换为 API 和 MCP 服务',
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
    icons: {
      16: '/icon/16.png',
      32: '/icon/32.png',
      48: '/icon/48.png',
      128: '/icon/128.png',
    },
  },
});
