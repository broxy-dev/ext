// 应用主入口
import { CONFIG, migrateOldData } from './config.js';
import { isInIframe, isWorkerDomain, getWebId } from './utils/helpers.js';
import { initEndpoints, router, configManager } from './endpoints/index.js';
import { handleRequest } from './core/request-handler.js';
import { BridgeClient } from './core/bridge-client.js';
import { FloatButton } from './bridge/float-button.js';
import { BridgeHost } from './bridge/bridge-host.js';

// 全局单例锁
if (window.__BROXY_INITIALIZED__) {
  console.log('[Broxy] Already initialized, skipping...');
} else {
  window.__BROXY_INITIALIZED__ = true;

  function init() {
    console.log('[Broxy] Initializing...');

    // 迁移旧数据
    migrateOldData();

    // 环境检查
    if (isInIframe()) {
      console.log('[Broxy] Skipped: Running in iframe');
      return;
    }

    if (isWorkerDomain(CONFIG.WORKER_DOMAIN)) {
      console.log('[Broxy] Skipped: Running in worker domain');
      return;
    }

    // 初始化端点
    initEndpoints();

    // 获取 Web ID
    const webId = getWebId(CONFIG.WEB_ID_KEY);

    // 创建浮动按钮
    const floatButton = new FloatButton(() => {
      bridgeHost.toggle();
    });
    floatButton.create();

    // 创建 WebSocket 客户端
    const client = new BridgeClient(webId);

    // 创建 Bridge Host（管理 iframe 通信）
    const bridgeHost = new BridgeHost(client, router);

    // 设置面板切换回调（隐藏/显示浮动按钮）
    bridgeHost.onPanelToggle = (isOpen) => {
      floatButton.setPanelOpen(isOpen);
    };

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

    // 设置状态更新回调
    client.setStatusCallback((status) => {
      floatButton.updateStatus(status);
      bridgeHost.updateStatus(status);

      // 保存连接状态（仅在真正连接成功或断开时）
      if (status === 'connected') {
        localStorage.setItem(CONFIG.CONNECTION_STATE_KEY, 'connected');
      } else if (status === 'disconnected') {
        // 仅在非重连情况下保存断开状态
        if (!client.shouldConnect) {
          localStorage.setItem(CONFIG.CONNECTION_STATE_KEY, 'disconnected');
        }
      }
    });

    // 设置日志回调
    client.setLogCallback((type, action, message, details) => {
      bridgeHost.addSystemLog(type, action, message, details);
    });

    // 暴露全局接口
    window.broxy = {
      webId: webId,
      client: client,
      router: router,
      bridgeHost: bridgeHost,
      floatButton: floatButton,
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

    if (shouldAutoConnect) {
      client.connect();
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
