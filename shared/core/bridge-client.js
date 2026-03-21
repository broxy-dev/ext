// WebSocket 连接管理
import { CONFIG, WORKER_URL } from '../config.js';
import { setConnectionState } from '../utils/helpers.js';

export class BridgeClient {
  constructor(webId) {
    this.webId = webId;
    this.ws = null;
    this.reconnectCount = 0;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.shouldConnect = false;
    this.requestHandler = null;
    this.statusCallback = null;
    this.logCallback = null;
    this.connectedAt = null;
    this.status = 'disconnected';
  }

  setRequestHandler(handler) {
    this.requestHandler = handler;
  }

  setStatusCallback(callback) {
    this.statusCallback = callback;
  }

  setLogCallback(callback) {
    this.logCallback = callback;
  }

  connect() {
    if (this.isConnected) {
      console.log('[Broxy] Already connected');
      return;
    }

    // 清除用户手动断开的标记
    localStorage.setItem(CONFIG.USER_DISCONNECTED_KEY, 'false');
    console.log('[Broxy] Cleared user disconnected flag');

    const wsUrl = `${WORKER_URL}/connect?id=${this.webId}`;
    console.log('[Broxy] Connecting to:', wsUrl);

    if (this.logCallback) {
      this.logCallback('connection', 'connecting', 'Connecting to server...');
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Broxy] Connected successfully');
        this.isConnected = true;
        this.reconnectCount = 0;
        this.shouldConnect = true;
        this.connectedAt = Date.now();
        this.status = 'connected';
        setConnectionState(CONFIG.CONNECTION_KEY, true);
        if (this.logCallback) {
          this.logCallback('connection', 'connected', 'WebSocket connected successfully');
        }
        if (this.statusCallback) {
          this.statusCallback('connected');
        }
        this.executeInitScript();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[Broxy] Failed to parse message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[Broxy] Connection closed', event.code, event.reason);
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.status = wasConnected ? 'disconnected' : 'error';

        if (this.logCallback) {
          this.logCallback('connection', 'disconnected', `Connection closed (code: ${event.code})`, { code: event.code, reason: event.reason });
        }

        if (this.statusCallback) {
          this.statusCallback(wasConnected ? 'disconnected' : 'error');
        }

        // 自动重连逻辑
        if (this.shouldConnect && event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect();
        } else {
          setConnectionState(CONFIG.CONNECTION_KEY, false);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Broxy] WebSocket error:', error);
        this.status = 'error';
        if (this.logCallback) {
          this.logCallback('connection', 'error', 'WebSocket connection error');
        }
        if (this.statusCallback) {
          this.statusCallback('error');
        }
      };
    } catch (error) {
      console.error('[Broxy] Failed to create WebSocket:', error);
      if (this.logCallback) {
        this.logCallback('connection', 'error', `Failed to create WebSocket: ${error.message}`);
      }
      if (this.statusCallback) {
        this.statusCallback('error');
      }
    }
  }

  disconnect() {
    this.shouldConnect = false;
    this.connectedAt = null;
    this.status = 'disconnected';
    setConnectionState(CONFIG.CONNECTION_KEY, false);

    // 标记用户主动断开
    localStorage.setItem(CONFIG.USER_DISCONNECTED_KEY, 'true');
    console.log('[Broxy] Set user disconnected flag');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectCount = 0;
    if (this.statusCallback) {
      this.statusCallback('disconnected');
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        console.log('[Broxy] Server confirmed connection:', message.connectionId);
        break;

      case 'request':
        this.handleRequest(message.requestId, message.data);
        break;

      default:
        console.log('[Broxy] Unknown message type:', message.type);
    }
  }

  async handleRequest(requestId, data) {
    console.log('[Broxy] Received request:', data);

    // Token 验证
    const authEnabled = localStorage.getItem('broxy_auth_enabled') === 'true';
    if (authEnabled) {
      const expectedToken = localStorage.getItem('broxy_auth_token') || '';
      const authHeader = data.headers?.authorization || data.headers?.Authorization || '';
      const providedToken = authHeader.replace(/^Bearer\s+/i, '');

      if (providedToken !== expectedToken) {
        console.log('[Broxy] Unauthorized request');
        if (this.logCallback) {
          this.logCallback('auth', 'failed', `Authentication failed for ${data.path}`, {
            path: data.path,
            method: data.method,
            providedToken: providedToken ? '(invalid)' : '(missing)'
          });
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'response',
            requestId,
            result: {
              error: 'Unauthorized',
              status: 401,
              message: 'Invalid or missing authentication token'
            }
          }));
        }
        return;
      }
    }

    try {
      const result = await this.requestHandler(
        data.method,
        data.path,
        data.query,
        data.body,
        data.headers
      );

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'response',
          requestId,
          result
        }));
      }
    } catch (error) {
      console.error('[Broxy] Request handling error:', error);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'response',
          requestId,
          result: {
            error: error.message,
            stack: error.stack
          }
        }));
      }
    }
  }

  executeInitScript() {
    const initScriptKey = 'broxy_init_script';
    const initScript = localStorage.getItem(initScriptKey);
    if (!initScript || !initScript.trim()) return;

    console.log('[Broxy] Executing init script...');
    if (this.logCallback) {
      this.logCallback('initScript', 'executing', 'Executing initialization script');
    }
    try {
      new Function(initScript)();
      console.log('[Broxy] Init script executed successfully');
      if (this.logCallback) {
        this.logCallback('initScript', 'success', 'Init script executed successfully');
      }
    } catch (error) {
      console.error('[Broxy] Init script execution failed:', error);
      if (this.logCallback) {
        this.logCallback('initScript', 'failed', `Init script execution failed: ${error.message}`, {
          error: error.message,
          stack: error.stack
        });
      }
    }
  }

  attemptReconnect() {
    if (this.reconnectCount >= CONFIG.MAX_RECONNECT) {
      console.error('[Broxy] Max reconnect attempts reached');
      this.shouldConnect = false;
      this.status = 'failed';
      setConnectionState(CONFIG.CONNECTION_KEY, false);
      if (this.logCallback) {
        this.logCallback('connection', 'failed', 'Max reconnect attempts reached');
      }
      if (this.statusCallback) {
        this.statusCallback('failed');
      }
      return;
    }

    this.reconnectCount++;
    this.status = 'reconnecting';
    console.log(`[Broxy] Reconnecting... (attempt ${this.reconnectCount})`);
    if (this.logCallback) {
      this.logCallback('connection', 'reconnecting', `Reconnecting... (attempt ${this.reconnectCount}/${CONFIG.MAX_RECONNECT})`);
    }
    if (this.statusCallback) {
      this.statusCallback('reconnecting');
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, CONFIG.RECONNECT_INTERVAL);
  }
}
