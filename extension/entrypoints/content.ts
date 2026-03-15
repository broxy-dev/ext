import { CONFIG, migrateOldData } from '../../shared/config.js';
import { isInIframe, isWorkerDomain, getWebId } from '../../shared/utils/helpers.js';
import { initEndpoints, router, configManager } from '../../shared/endpoints/index.js';
import { handleRequest } from '../../shared/core/request-handler.js';
import { BridgeClient } from '../../shared/core/bridge-client.js';
import { FloatButton } from '../../shared/bridge/float-button.js';
import { BridgeHost } from '../../shared/bridge/bridge-host.js';

export default defineContentScript({
  matches: ['https://*/*', 'http://*/*'],
  runAt: 'document_end',
  world: 'MAIN',
  main() {
    if (window.__BROXY_INITIALIZED__) {
      console.log('[Broxy] Already initialized, skipping...');
      return;
    }
    window.__BROXY_INITIALIZED__ = true;

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

    const floatButton = new FloatButton(() => {
      bridgeHost.toggle();
    });
    floatButton.create();

    const client = new BridgeClient(webId);

    const bridgeHost = new BridgeHost(client, router);

    bridgeHost.onPanelToggle = (isOpen) => {
      floatButton.setPanelOpen(isOpen);
    };

    client.setRequestHandler(async (method, path, query, body, headers) => {
      const startTime = Date.now();
      const result = await handleRequest(method, path, query, body, headers);

      const duration = Date.now() - startTime;
      const isMCP = path.startsWith('/mcp/');
      bridgeHost.addLog(isMCP ? 'mcp' : 'api', method, path, query, body, headers, result, duration);

      return result;
    });

    client.setStatusCallback((status) => {
      floatButton.updateStatus(status);
      bridgeHost.updateStatus(status);

      if (status === 'connected') {
        localStorage.setItem(CONFIG.CONNECTION_STATE_KEY, 'connected');
      } else if (status === 'disconnected') {
        if (!client.shouldConnect) {
          localStorage.setItem(CONFIG.CONNECTION_STATE_KEY, 'disconnected');
        }
      }
    });

    client.setLogCallback((type, action, message, details) => {
      bridgeHost.addSystemLog(type, action, message, details);
    });

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

    window.browserBridge = window.broxy;

    const savedConnectionState = localStorage.getItem(CONFIG.CONNECTION_STATE_KEY);
    let shouldAutoConnect = false;

    if (savedConnectionState === 'connected') {
      shouldAutoConnect = true;
      console.log('[Broxy] Auto-connecting: user was previously connected');
    } else if (savedConnectionState === 'disconnected') {
      shouldAutoConnect = false;
      console.log('[Broxy] Skipping auto-connect: user was previously disconnected');
    } else {
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

    console.log('[Broxy] Extension initialized. WebId:', webId);
  },
});
