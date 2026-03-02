// ==UserScript==
// @name         Broxy
// @namespace    https://broxy.dev/
// @version      1.0.2
// @description  将任意网页转换为 API 和 MCP 服务
// @author       broxy-dev
// @icon         https://broxy.dev/assets/logo.png
// @updateURL    https://broxy.dev/assets/broxy-v1.user.js
// @match        https://*/*
// @match        http://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  async function init() {
    // 早期退出：避免在 iframe 中执行
    try {
      if (window.self !== window.top) {
        return;
      }
    } catch (e) {
      return;
    }

    // 早期退出：避免重复执行
    if (window.__BROXY_INITIALIZED__) {
      return;
    }

    console.log('[Broxy] Initializing...');

    try {
      // =====================================================
      // 初始配置数据（由 data.json 注入）
      // 仅在 localStorage 无数据时使用
      // =====================================================
      if (!window.__BROXY_INIT_DATA__) window.__BROXY_INIT_DATA__ = {{INIT_DATA}};

      // =====================================================
      // Broxy Core Code
      // 由 npm run build 自动生成
      // 打包来源: ext/src/main.js
      // 生成时间: {{BUILD_TIME}}
      // =====================================================
      {{CORE_CODE}}

    } catch (error) {
      console.error('[Broxy] Failed to initialize:', error);
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
