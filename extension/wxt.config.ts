import { defineConfig } from 'wxt';
import pkg from '../package.json';

export default defineConfig({
  srcDir: 'extension',
  manifest: {
    name: '__MSG_extName__',
    version: pkg.version,
    description: '__MSG_extDescription__',
    default_locale: 'en',
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
