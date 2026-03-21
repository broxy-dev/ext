// 应用主入口
import { CONFIG, migrateOldData } from './config.js';
import { isInIframe, isWorkerDomain, getWebId } from './utils/helpers.js';
import { initEndpoints, router, configManager } from './endpoints/index.js';
import { handleRequest } from './core/request-handler.js';
import { BridgeClient } from './core/bridge-client.js';
import { FloatButton } from './bridge/float-button.js';
import { BridgeHost } from './bridge/bridge-host.js';
import { MiniPanel } from './bridge/mini-panel.js';

// 全局单例锁
if (window.__BROXY_INITIALIZED__) {
  console.log('[Broxy] Already initialized, skipping...');
} else {
  window.__BROXY_INITIALIZED__ = true;

  function init() {
    console.log('[Broxy] Initializing...');

    const params = new URLSearchParams(window.location.search);
    const devMode = params.get('broxy.dev') === '1';
    const autoOpen = params.get('broxy.open') === '1';
    const autoConnect = params.get('broxy.connect') === '1';

    if (devMode) {
      CONFIG.UI_IFRAME_URL = 'http://localhost:3000';
      console.log('[Broxy] Dev mode: using localhost:3000');
    }

    migrateOldData();

    if (isInIframe()) {
      console.log('[Broxy] Skipped: Running in iframe');
      return;
    }

    if (isWorkerDomain(CONFIG.WORKER_DOMAIN)) {
      console.log('[Broxy] Skipped: Running in worker domain');
      return;
    }

    initEndpoints();

    const webId = getWebId(CONFIG.WEB_ID_KEY);

    const floatButton = new FloatButton(() => {});

    const client = new BridgeClient(webId);

    const bridgeHost = new BridgeHost(client, router);

    const miniPanel = new MiniPanel({
      configManager: configManager,
      client: client,
      floatButton: floatButton,
    });

    floatButton.onClick = () => {
      miniPanel.toggle();
    };

    miniPanel.onDevMode = () => {
      bridgeHost.open();
    };

    bridgeHost.onClose = () => {
      miniPanel.show();
    };

    floatButton.create();

    // 设置请求处理器
    client.setRequestHandler(async (method, path, query, body, headers) => {
      const startTime = Date.now();
      const result = await handleRequest(method, path, query, body, headers);

      // 添加日志
      const duration = Date.now() - startTime;
      const isMCP = path.startsWith('/mcp/');
      bridgeHost.addLog(isMCP ? 'mcp' : 'api', method, path, query, body, headers, result, duration);

      return result;
    });

    client.setStatusCallback((status) => {
      floatButton.updateStatus(status);
      miniPanel.updateStatus(status);
      bridgeHost.updateStatus(status);

      if (status === 'connected') {
        localStorage.setItem(CONFIG.CONNECTION_STATE_KEY, 'connected');
      } else if (status === 'disconnected') {
        if (!client.shouldConnect) {
          localStorage.setItem(CONFIG.CONNECTION_STATE_KEY, 'disconnected');
        }
      }
    });

    // 设置日志回调
    client.setLogCallback((type, action, message, details) => {
      bridgeHost.addSystemLog(type, action, message, details);
    });

    window.broxy = {
      webId: webId,
      client: client,
      router: router,
      bridgeHost: bridgeHost,
      floatButton: floatButton,
      miniPanel: miniPanel,
      connect: () => {
        localStorage.setItem(CONFIG.CONNECTION_STATE_KEY, 'connected');
        client.connect();
      },
      disconnect: () => {
        localStorage.setItem(CONFIG.CONNECTION_STATE_KEY, 'disconnected');
        client.disconnect();
      },
    };

    // 兼容旧的全局变量名
    window.browserBridge = window.broxy;

    // 检查是否需要自动连接
    // 优先级：记忆状态 > 配置默认值
    const savedConnectionState = localStorage.getItem(CONFIG.CONNECTION_STATE_KEY);
    let shouldAutoConnect = false;

    if (savedConnectionState === 'connected') {
      // 用户之前手动连接过，自动重连
      shouldAutoConnect = true;
      console.log('[Broxy] Auto-connecting: user was previously connected');
    } else if (savedConnectionState === 'disconnected') {
      // 用户之前手动断开过，不自动连接
      shouldAutoConnect = false;
      console.log('[Broxy] Skipping auto-connect: user was previously disconnected');
    } else {
      // 没有记忆状态，使用配置默认值
      shouldAutoConnect = CONFIG.AUTO_CONNECT;
      console.log('[Broxy] No saved state, using config AUTO_CONNECT:', CONFIG.AUTO_CONNECT);
    }

    if (autoConnect) {
      client.connect();
      console.log('[Broxy] Auto-connect: broxy.connect=1');
    } else if (shouldAutoConnect) {
      client.connect();
    }

    if (autoOpen) {
      setTimeout(() => {
        bridgeHost.open();
        console.log('[Broxy] Auto-open panel: broxy.open=1');
      }, 500);
    }

    console.log('[Broxy] Script initialized. WebId:', webId);
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
