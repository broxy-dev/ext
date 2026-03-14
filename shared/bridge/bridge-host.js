// Bridge Host - postMessage 通信主机
// 运行在用户页面，负责与 iframe UI 通信

import { CONFIG } from '../config.js';
import { ConfigManager } from '../utils/config-manager.js';
import { Logger } from '../utils/logger.js';
import { resetWebId } from '../utils/helpers.js';

export class BridgeHost {
  constructor(client, router) {
    this.client = client;
    this.router = router;
    this.configManager = new ConfigManager();
    this.logger = new Logger(100);
    this.iframe = null;
    this.iframeContainer = null;
    this.pendingRequests = new Map();
    this.messageOrigin = null;
    this.isOpen = false;
    this.initialized = false;
    this.isMaximized = false;
    this.onPanelToggle = null;
    this.boundHandleMessage = this.handleMessage.bind(this);
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.isPanelDragging = false;
    this.panelDragStartX = 0;
    this.panelDragStartY = 0;
    this.panelStartX = 0;
    this.panelStartY = 0;
    this.dragOverlay = null;
  }

  // 设置允许的 iframe 来源
  setAllowedOrigin(origin) {
    this.messageOrigin = origin;
  }

  // 初始化 iframe（只执行一次）
  initIframe() {
    if (this.initialized) return;

    const { UI_IFRAME_URL, UI_IFRAME_WIDTH, UI_IFRAME_HEIGHT } = CONFIG;

    this.messageOrigin = new URL(UI_IFRAME_URL).origin;

    this.iframeContainer = document.createElement('div');
    this.iframeContainer.id = 'broxy-panel';
    this.iframeContainer.style.display = 'none';
    this.iframeContainer.innerHTML = `
      <div class="bb-panel-wrapper">
        <iframe src="${UI_IFRAME_URL}" allow="clipboard-write; clipboard-read"></iframe>
      </div>
    `;

    this.applyContainerStyles();
    document.body.appendChild(this.iframeContainer);

    this.iframe = this.iframeContainer.querySelector('iframe');
    this.iframe.addEventListener('load', () => {
      if (this.isOpen) {
        this.sendInitialState();
      }
    });

    window.addEventListener('message', this.boundHandleMessage);
    document.addEventListener('keydown', this.boundHandleKeydown);

    this.initialized = true;
    console.log('[BridgeHost] iframe initialized');
  }

  // 打开 iframe 面板
  open() {
    if (this.isOpen) return;

    // 确保 iframe 已初始化
    this.initIframe();

    this.iframeContainer.style.display = 'flex';
    this.isOpen = true;

    // 通知浮动按钮隐藏
    if (this.onPanelToggle) {
      this.onPanelToggle(true);
    }

    // 每次打开时发送最新状态
    setTimeout(() => {
      this.sendInitialState();
    }, 100);

    console.log('[BridgeHost] Panel opened');
  }

  // 关闭 iframe 面板（隐藏而非销毁）
  close() {
    if (!this.isOpen) return;

    if (this.iframeContainer) {
      this.iframeContainer.style.display = 'none';
    }

    this.isOpen = false;

    // 通知浮动按钮显示
    if (this.onPanelToggle) {
      this.onPanelToggle(false);
    }

    console.log('[BridgeHost] Panel closed (hidden)');
  }

  // 切换面板
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
    return this.isOpen;
  }

  // 切换最大化
  toggleMaximize(isMaximized) {
    this.isMaximized = isMaximized !== undefined ? isMaximized : !this.isMaximized;
    
    if (this.iframeContainer) {
      const wrapper = this.iframeContainer.querySelector('.bb-panel-wrapper');
      if (wrapper) {
        if (this.isMaximized) {
          wrapper.classList.add('bb-maximized');
          wrapper.style.left = '';
          wrapper.style.top = '';
          wrapper.style.transform = '';
        } else {
          wrapper.classList.remove('bb-maximized');
          wrapper.style.left = '';
          wrapper.style.top = '';
          wrapper.style.transform = 'translate(-50%, -50%)';
        }
      }
    }
  }

  applyContainerStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #broxy-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: ${CONFIG.FLOAT_BUTTON.zIndex - 1};
        pointer-events: none;
      }
      #broxy-panel.bb-visible {
        animation: bb-fadeIn 0.2s ease;
      }
      #broxy-panel .bb-panel-wrapper {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${CONFIG.UI_IFRAME_WIDTH}px;
        height: ${CONFIG.UI_IFRAME_HEIGHT}px;
        max-width: 95vw;
        max-height: 90vh;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        background: #fff;
        border: 1px solid rgba(60, 60, 60, 0.2);
        pointer-events: auto;
      }
      #broxy-panel .bb-panel-wrapper.bb-dragging {
        transition: none;
      }
      #broxy-panel .bb-panel-wrapper.bb-maximized {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        transform: none;
        border-radius: 0;
        border: none;
      }
      #broxy-panel iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
      @keyframes bb-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    if (!document.querySelector('#broxy-panel-styles')) {
      style.id = 'broxy-panel-styles';
      document.head.appendChild(style);
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  startPanelDrag(screenX, screenY) {
    if (this.isMaximized) return;
    
    const wrapper = this.iframeContainer?.querySelector('.bb-panel-wrapper');
    if (!wrapper) return;

    this.isPanelDragging = true;
    this.panelDragStartX = screenX;
    this.panelDragStartY = screenY;

    const rect = wrapper.getBoundingClientRect();
    this.panelStartX = rect.left;
    this.panelStartY = rect.top;

    wrapper.classList.add('bb-dragging');
    wrapper.style.transform = 'none';
    wrapper.style.left = `${this.panelStartX}px`;
    wrapper.style.top = `${this.panelStartY}px`;

    this.dragOverlay = document.createElement('div');
    this.dragOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: ${CONFIG.FLOAT_BUTTON.zIndex + 1};
      cursor: move;
    `;
    this.dragOverlay.addEventListener('mousemove', (e) => this.updatePanelPosition(e.screenX, e.screenY));
    this.dragOverlay.addEventListener('mouseup', () => this.endPanelDrag());
    this.dragOverlay.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.updatePanelPosition(e.touches[0].screenX, e.touches[0].screenY);
    }, { passive: false });
    this.dragOverlay.addEventListener('touchend', () => this.endPanelDrag());
    document.body.appendChild(this.dragOverlay);
  }

  updatePanelPosition(screenX, screenY) {
    if (!this.isPanelDragging) return;

    const wrapper = this.iframeContainer?.querySelector('.bb-panel-wrapper');
    if (!wrapper) return;

    const deltaX = screenX - this.panelDragStartX;
    const deltaY = screenY - this.panelDragStartY;

    const width = wrapper.offsetWidth;
    const height = wrapper.offsetHeight;
    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - height;

    let newX = this.panelStartX + deltaX;
    let newY = this.panelStartY + deltaY;

    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));

    wrapper.style.left = `${newX}px`;
    wrapper.style.top = `${newY}px`;
  }

  endPanelDrag() {
    if (!this.isPanelDragging) return;

    const wrapper = this.iframeContainer?.querySelector('.bb-panel-wrapper');
    if (wrapper) {
      wrapper.classList.remove('bb-dragging');
    }

    this.isPanelDragging = false;

    if (this.dragOverlay) {
      this.dragOverlay.remove();
      this.dragOverlay = null;
    }
  }

  // 发送初始状态到 iframe
  sendInitialState() {
    const state = this.getState();
    this.sendToIframe('init', state);
  }

  // 获取当前状态
  getState() {
    return {
      webId: this.client?.webId || '',
      status: this.client?.isConnected ? 'connected' : 'disconnected',
      routes: this.configManager.getAllRoutes(),
      tools: this.configManager.getAllTools(),
      logs: this.logger.logs,
      mcpConfig: this.configManager.getMCPConfig(),
      initScript: this.configManager.getInitScript(),
      workerDomain: CONFIG.WORKER_DOMAIN,
      authToken: this.configManager.getAuthToken(),
      authEnabled: this.configManager.isAuthEnabled(),
      connectedAt: this.client?.connectedAt || null,
      skillConfig: this.configManager.getSkillConfig(),
      theme: this.configManager.getTheme(),
      language: this.configManager.getLanguage(),
    };
  }

  // 发送消息到 iframe
  sendToIframe(event, data) {
    if (!this.iframe || !this.iframe.contentWindow) return;

    this.iframe.contentWindow.postMessage(
      {
        type: 'bb/event',
        event,
        data,
      },
      this.messageOrigin
    );
  }

  // 发送响应到 iframe
  sendResponse(id, result, error = null) {
    if (!this.iframe || !this.iframe.contentWindow) return;

    this.iframe.contentWindow.postMessage(
      {
        type: 'bb/response',
        id,
        result,
        error,
      },
      this.messageOrigin
    );
  }

  // 处理来自 iframe 的消息
  async handleMessage(event) {
    if (this.messageOrigin && event.origin !== this.messageOrigin) {
      return;
    }

    const { type, id, action, data } = event.data || {};

    if (type !== 'bb/action' || !action) return;

    console.log('[BridgeHost] Received action:', action, data);

    try {
      const result = await this.handleAction(action, data);
      this.sendResponse(id, result);
    } catch (error) {
      console.error('[BridgeHost] Action error:', error);
      this.sendResponse(id, null, error.message);
    }
  }

  // 处理操作
  async handleAction(action, data) {
    switch (action) {
      case 'getStatus':
        return {
          status: this.client?.isConnected ? 'connected' : 'disconnected',
          webId: this.client?.webId,
        };

      case 'connect':
        if (this.client) {
          this.client.connect();
        }
        return { success: true };

      case 'disconnect':
        if (this.client) {
          this.client.disconnect();
        }
        return { success: true };

      case 'closePanel':
        this.close();
        return { success: true };

      case 'toggleMaximize':
        this.toggleMaximize(data?.isMaximized);
        return { success: true };

      case 'getRoutes':
        return this.configManager.getAllRoutes();

      case 'saveRoute': {
        const { id, route } = data;
        if (id) {
          this.configManager.updateRoute(id, route);
        } else {
          this.configManager.addRoute(route);
        }
        this.reloadRoutes();
        this.sendToIframe('routesChange', this.configManager.getAllRoutes());
        return { success: true };
      }

      case 'deleteRoute': {
        this.configManager.deleteRoute(data.id);
        this.reloadRoutes();
        this.sendToIframe('routesChange', this.configManager.getAllRoutes());
        return { success: true };
      }

      case 'getTools':
        return this.configManager.getAllTools();

      case 'saveTool': {
        const { id, tool } = data;
        if (id) {
          this.configManager.updateTool(id, tool);
        } else {
          this.configManager.addTool(tool);
        }
        this.reloadRoutes();
        this.sendToIframe('toolsChange', this.configManager.getAllTools());
        return { success: true };
      }

      case 'deleteTool': {
        this.configManager.deleteTool(data.id);
        this.reloadRoutes();
        this.sendToIframe('toolsChange', this.configManager.getAllTools());
        return { success: true };
      }

      case 'getLogs':
        return this.logger.logs;

      case 'clearLogs':
        this.logger.clear();
        this.sendToIframe('logsChange', []);
        return { success: true };

      case 'getConfig':
        return {
          mcpConfig: this.configManager.getMCPConfig(),
          initScript: this.configManager.getInitScript(),
          authToken: this.configManager.getAuthToken(),
          authEnabled: this.configManager.isAuthEnabled(),
        };

      case 'saveConfig': {
        if (data.mcpConfig) {
          this.configManager.setMCPConfig(data.mcpConfig);
        }
        if (data.initScript !== undefined) {
          this.configManager.setInitScript(data.initScript);
          // 首次设置或编辑保存后执行
          if (data.initScript.trim()) {
            this.client.executeInitScript();
          }
        }
        this.sendToIframe('configChange', {
          mcpConfig: this.configManager.getMCPConfig(),
          initScript: this.configManager.getInitScript(),
        });
        return { success: true };
      }

      case 'saveAuth': {
        if (data.authToken !== undefined) {
          this.configManager.setAuthToken(data.authToken);
        }
        if (data.authEnabled !== undefined) {
          this.configManager.setAuthEnabled(data.authEnabled);
        }
        this.sendToIframe('authChange', {
          authToken: this.configManager.getAuthToken(),
          authEnabled: this.configManager.isAuthEnabled(),
        });
        return { success: true };
      }

      case 'saveSkillConfig': {
        if (data.skillConfig !== undefined) {
          this.configManager.setSkillConfig(data.skillConfig);
        }
        this.sendToIframe('skillConfigChange', {
          skillConfig: this.configManager.getSkillConfig(),
        });
        return { success: true };
      }

      case 'saveTheme': {
        if (data.theme !== undefined) {
          this.configManager.setTheme(data.theme);
        }
        this.sendToIframe('themeChange', {
          theme: this.configManager.getTheme(),
        });
        return { success: true };
      }

      case 'saveLanguage': {
        if (data.language !== undefined) {
          this.configManager.setLanguage(data.language);
        }
        this.sendToIframe('languageChange', {
          language: this.configManager.getLanguage(),
        });
        return { success: true };
      }

      case 'exportData':
        return this.configManager.exportAllData();

      case 'importData':
        this.configManager.importAllData(data);
        this.reloadRoutes();
        this.sendToIframe('routesChange', this.configManager.getAllRoutes());
        this.sendToIframe('toolsChange', this.configManager.getAllTools());
        this.sendToIframe('authChange', {
          authToken: this.configManager.getAuthToken(),
          authEnabled: this.configManager.isAuthEnabled(),
        });
        this.sendToIframe('configChange', {
          mcpConfig: this.configManager.getMCPConfig(),
          initScript: this.configManager.getInitScript(),
        });
        this.sendToIframe('skillConfigChange', {
          skillConfig: this.configManager.getSkillConfig(),
        });
        this.sendToIframe('themeChange', {
          theme: this.configManager.getTheme(),
        });
        this.sendToIframe('languageChange', {
          language: this.configManager.getLanguage(),
        });
        const importedInitScript = this.configManager.getInitScript();
        if (importedInitScript && importedInitScript.trim()) {
          this.client.executeInitScript();
        }
        return { success: true };

      case 'executeHandler': {
        const { handler, args, isTool } = data;
        return await this.executeHandler(handler, args, isTool);
      }

      case 'executeInitScript': {
        const initScript = this.configManager.getInitScript();
        if (initScript) {
          try {
            new Function(initScript)();
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
        return { success: true };
      }

      case 'resetWebId': {
        const wasConnected = this.client?.isConnected || false;
        
        // 断开当前连接
        if (this.client) {
          this.client.disconnect();
          this.client.shouldConnect = false;
        }
        
        // 重置 WebID
        const newWebId = resetWebId(CONFIG.WEB_ID_KEY);
        
        // 更新客户端的 webId
        if (this.client) {
          this.client.webId = newWebId;
        }
        
        // 更新全局接口
        if (window.broxy) {
          window.broxy.webId = newWebId;
        }
        
        // 通知 UI 更新
        this.sendToIframe('webIdChange', { webId: newWebId });
        
        // 如果之前是连接状态，自动重连
        if (wasConnected && this.client) {
          setTimeout(() => {
            this.client.connect();
          }, 100);
        }
        
        return { success: true, webId: newWebId };
      }

      case 'dragStart':
        this.startPanelDrag(data?.x, data?.y);
        return { success: true };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // 执行 handler 代码
  async executeHandler(handlerCode, args, isTool = false) {
    try {
      let handler;
      if (isTool) {
        handler = new Function('return ' + handlerCode)();
      } else {
        handler = new Function('return ' + handlerCode)();
      }

      const result = await handler(args);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message, stack: error.stack };
    }
  }

  // 重新加载动态路由
  reloadRoutes() {
    const allRoutes = this.configManager.getAllRoutes();
    const allTools = this.configManager.getAllTools();

    const dynamicRoutes = allRoutes.filter((r) => r.enabled);
    const dynamicTools = allTools.filter((t) => t.enabled);

    if (this.router) {
      this.router.reloadRoutes(dynamicRoutes, dynamicTools);
      console.log('[BridgeHost] Routes reloaded:', dynamicRoutes.length, 'routes,', dynamicTools.length, 'tools');
    }
  }

  // 添加日志
  addLog(type, method, path, query, body, headers, result, duration) {
    const log = this.logger.addLog(type, method, path, query, body, headers, result, duration);
    if (this.isOpen) {
      this.sendToIframe('log', log);
    }
    return log;
  }

  // 添加系统日志（连接、初始化脚本、认证等）
  addSystemLog(type, action, message, details = null) {
    const log = this.logger.addSystemLog(type, action, message, details);
    if (this.isOpen) {
      this.sendToIframe('log', log);
    }
    return log;
  }

  // 更新连接状态
  updateStatus(status) {
    if (this.isOpen || this.initialized) {
      this.sendToIframe('statusChange', { status });
    }
  }

  // 销毁
  destroy() {
    window.removeEventListener('message', this.boundHandleMessage);
    document.removeEventListener('keydown', this.boundHandleKeydown);
    if (this.iframeContainer) {
      this.iframeContainer.remove();
      this.iframeContainer = null;
      this.iframe = null;
    }
    this.initialized = false;
  }
}
