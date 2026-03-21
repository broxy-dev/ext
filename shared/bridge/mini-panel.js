import { CONFIG, THEME } from '../config.js';

export class MiniPanel {
  constructor(options) {
    this.configManager = options.configManager;
    this.client = options.client;
    this.floatButton = options.floatButton;
    this.panel = null;
    this.isVisible = false;
    this.status = 'disconnected';
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.panelStartX = 0;
    this.panelStartY = 0;
    this.position = null;
    this.isConnecting = false;
    this.onDevMode = null;
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  create() {
    if (this.panel) return;

    this.panel = document.createElement('div');
    this.panel.id = 'broxy-mini-panel';
    this.panel.innerHTML = this.getPanelContent();
    this.applyStyles();
    this.applyTheme();

    document.body.appendChild(this.panel);
    this.bindEvents();
    this.updateData();
    this.watchTheme();

    document.addEventListener('keydown', this.boundHandleKeydown);

    console.log('[MiniPanel] Created');
  }

  getPanelContent() {
    const mcpConfig = this.configManager.getMCPConfig();
    const apiUrl = this.configManager.getApiUrl();
    const mcpUrl = this.configManager.getMcpUrl();
    const routesCount = this.configManager.getEnabledRoutes().length;
    const toolsCount = this.configManager.getEnabledTools().length;
    const authToken = this.configManager.getAuthToken();
    const authEnabled = this.configManager.isAuthEnabled();
    const { title, projectUrl } = CONFIG.MINI_PANEL;

    return `
      <div class="bb-mini-panel-header">
        <a class="bb-mini-header-link" href="${projectUrl}" target="_blank" rel="noopener">
          <span class="bb-mini-panel-title">${title}</span>
        </a>
        <button class="bb-mini-panel-close" id="bb-mini-close-btn">×</button>
      </div>
      <div class="bb-mini-panel-body">
        <div class="bb-mini-section bb-mini-service-section">
          <div class="bb-mini-service-info">
            <div class="bb-mini-row">
              <span class="bb-mini-label">服务</span>
              <span class="bb-mini-value">${mcpConfig.name}</span>
            </div>
            <div class="bb-mini-row">
              <span class="bb-mini-label">版本</span>
              <span class="bb-mini-value">${mcpConfig.version}</span>
            </div>
            <div class="bb-mini-row">
              <span class="bb-mini-label">状态</span>
              <span class="bb-mini-value">
                <span class="bb-mini-status-dot" id="bb-mini-status-dot"></span>
                <span id="bb-mini-status-text">未连接</span>
              </span>
            </div>
          </div>
          <button class="bb-mini-circle-btn" id="bb-mini-connect-btn">
            <span class="bb-mini-btn-text">启动</span>
            <span class="bb-mini-btn-spinner"></span>
          </button>
        </div>
        <div class="bb-mini-section">
          <div class="bb-mini-row">
            <span class="bb-mini-label">API 地址</span>
            <span class="bb-mini-badge" id="bb-mini-routes-badge">${routesCount}</span>
          </div>
          <div class="bb-mini-row">
            <input type="text" class="bb-mini-input bb-mini-url-input" id="bb-mini-api-url" value="${apiUrl}" readonly>
            <button class="bb-mini-btn bb-mini-btn-sm bb-mini-copy-btn" data-url="${apiUrl}">复制</button>
          </div>
          <div class="bb-mini-row">
            <span class="bb-mini-label">MCP 地址</span>
            <span class="bb-mini-badge" id="bb-mini-tools-badge">${toolsCount}</span>
          </div>
          <div class="bb-mini-row">
            <input type="text" class="bb-mini-input bb-mini-url-input" id="bb-mini-mcp-url" value="${mcpUrl}" readonly>
            <button class="bb-mini-btn bb-mini-btn-sm bb-mini-copy-btn" data-url="${mcpUrl}">复制</button>
          </div>
        </div>
        <div class="bb-mini-section">
          <div class="bb-mini-row">
            <span class="bb-mini-label">认证令牌</span>
            <label class="bb-mini-toggle bb-mini-toggle-sm" title="开启后连接时携带认证令牌">
              <input type="checkbox" id="bb-mini-auth-toggle" ${authEnabled ? 'checked' : ''}>
              <span class="bb-mini-toggle-slider"></span>
            </label>
          </div>
          <div class="bb-mini-row">
            <input type="text" class="bb-mini-input" id="bb-mini-token-input" 
                   value="${authToken}" placeholder="输入认证令牌">
            <button class="bb-mini-btn bb-mini-btn-sm" id="bb-mini-gen-token-btn">生成</button>
          </div>
        </div>
        <div class="bb-mini-section bb-mini-dev-section">
          <button class="bb-mini-btn bb-mini-btn-dev" id="bb-mini-dev-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            开发模式
          </button>
        </div>
      </div>
    `;
  }

  applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #broxy-mini-panel {
        position: fixed;
        width: ${CONFIG.MINI_PANEL.width}px;
        background: ${THEME.background.panel};
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 12px;
        border: 1px solid ${THEME.border.light};
        box-shadow: ${THEME.shadow.panel}, inset 0 1px 0 rgba(255, 255, 255, 0.8);
        z-index: ${CONFIG.FLOAT_BUTTON.zIndex - 1};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        color: ${THEME.text.primary};
        overflow: hidden;
        display: none;
        cursor: auto;
      }
      #broxy-mini-panel.bb-mini-visible {
        display: block;
      }
      #broxy-mini-panel.bb-mini-dark {
        background: ${THEME.background.panelDark};
        border-color: ${THEME.border.primary};
        box-shadow: ${THEME.shadow.panelDark}, inset 0 1px 0 rgba(255, 255, 255, 0.05);
        color: ${THEME.text.light};
      }
      .bb-mini-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, ${THEME.primary.start}, ${THEME.primary.end});
        color: white;
        cursor: move;
        user-select: none;
      }
      .bb-mini-header-link {
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: white;
        cursor: pointer;
      }
      .bb-mini-header-link:hover {
        opacity: 0.9;
      }
      .bb-mini-panel-title {
        font-weight: 600;
        font-size: 14px;
      }
      .bb-mini-panel-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
      }
      .bb-mini-panel-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }
      .bb-mini-panel-body {
        padding: 12px 16px;
        cursor: auto;
      }
      .bb-mini-section {
        padding: 10px 0;
        border-bottom: 1px solid ${THEME.border.section};
        cursor: auto;
      }
      .bb-mini-dark .bb-mini-section {
        border-bottom-color: ${THEME.border.primaryLight};
      }
      .bb-mini-section:last-child {
        border-bottom: none;
      }
      .bb-mini-service-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .bb-mini-service-info {
        flex: 1;
        min-width: 0;
      }
      .bb-mini-circle-btn {
        width: 60px;
        height: 60px;
        min-width: 60px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, ${THEME.primary.start}, ${THEME.primary.end});
        color: white;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        box-shadow: ${THEME.shadow.btn};
        position: relative;
      }
      .bb-mini-circle-btn:hover {
        transform: scale(1.08);
        box-shadow: ${THEME.shadow.btnHover};
      }
      .bb-mini-circle-btn.bb-mini-connected {
        background: linear-gradient(135deg, ${THEME.status.connected.start}, ${THEME.status.connected.end});
      }
      .bb-mini-circle-btn.bb-mini-connected:hover {
        box-shadow: ${THEME.shadow.btnConnected};
      }
      .bb-mini-btn-spinner {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 3px solid transparent;
        border-top-color: white;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }
      .bb-mini-circle-btn.bb-mini-btn-loading {
        pointer-events: none;
      }
      .bb-mini-circle-btn.bb-mini-btn-loading .bb-mini-btn-spinner {
        opacity: 1;
        animation: bb-mini-spin 0.8s linear infinite;
      }
      .bb-mini-row {
        display: flex;
        align-items: center;
        margin: 6px 0;
        gap: 8px;
      }
      .bb-mini-label {
        color: ${THEME.text.secondary};
        min-width: 60px;
      }
      .bb-mini-dark .bb-mini-label {
        color: ${THEME.text.tertiary};
      }
      .bb-mini-value {
        color: ${THEME.text.primary};
        word-break: break-all;
      }
      .bb-mini-dark .bb-mini-value {
        color: ${THEME.text.light};
      }
      .bb-mini-url-input {
        flex: 1;
        min-width: 0;
      }
      .bb-mini-badge {
        display: inline-block;
        min-width: 18px;
        height: 18px;
        line-height: 18px;
        padding: 0 5px;
        margin-left: auto;
        background: linear-gradient(135deg, ${THEME.primary.start}, ${THEME.primary.end});
        color: white;
        font-size: 11px;
        font-weight: 600;
        border-radius: 9px;
        text-align: center;
        vertical-align: middle;
      }
      .bb-mini-status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        background: ${THEME.status.disconnected.start};
      }
      .bb-mini-status-dot.connected { background: ${THEME.status.connected.start}; }
      .bb-mini-status-dot.reconnecting { background: ${THEME.status.reconnecting.start}; animation: bb-mini-blink 1s infinite; }
      .bb-mini-status-dot.error { background: ${THEME.status.error.start}; }
      .bb-mini-status-dot.failed { background: ${THEME.status.failed.start}; }
      @keyframes bb-mini-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .bb-mini-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
        position: relative;
      }
      .bb-mini-btn-sm {
        padding: 6px 12px;
        font-size: 12px;
        background: ${THEME.background.hover};
        color: ${THEME.primary.start};
        flex-shrink: 0;
      }
      .bb-mini-btn-sm:hover {
        background: #d8d8d8;
      }
      .bb-mini-dark .bb-mini-btn-sm {
        background: ${THEME.background.hoverDark};
        color: ${THEME.primary.start};
      }
      .bb-mini-dark .bb-mini-btn-sm:hover {
        background: ${THEME.background.hoverDarkAlt};
      }
      .bb-mini-input {
        flex: 1;
        background: ${THEME.background.input};
        border: 1px solid ${THEME.border.input};
        color: ${THEME.text.primary};
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-family: monospace;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        cursor: text;
      }
      .bb-mini-input:focus {
        border-color: ${THEME.primary.start};
        box-shadow: ${THEME.shadow.inputFocus};
      }
      .bb-mini-dark .bb-mini-input {
        background: ${THEME.background.inputDark};
        border-color: ${THEME.border.inputDark};
        color: ${THEME.text.light};
      }
      .bb-mini-toggle {
        position: relative;
        width: 44px;
        height: 24px;
        margin-left: auto;
      }
      .bb-mini-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .bb-mini-toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: ${THEME.toggle.off};
        border-radius: 24px;
        transition: 0.3s;
      }
      .bb-mini-toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        border-radius: 50%;
        transition: 0.3s;
      }
      .bb-mini-toggle input:checked + .bb-mini-toggle-slider {
        background-color: ${THEME.toggle.on};
      }
      .bb-mini-toggle input:checked + .bb-mini-toggle-slider:before {
        transform: translateX(20px);
        background-color: white;
      }
      .bb-mini-toggle-sm {
        width: 32px;
        height: 18px;
      }
      .bb-mini-toggle-sm .bb-mini-toggle-slider:before {
        height: 12px;
        width: 12px;
        left: 3px;
        bottom: 3px;
      }
      .bb-mini-toggle-sm input:checked + .bb-mini-toggle-slider:before {
        transform: translateX(14px);
      }
      .bb-mini-dark .bb-mini-toggle-slider {
        background-color: ${THEME.toggle.offDark};
      }
      .bb-mini-dark .bb-mini-toggle-slider:before {
        background-color: ${THEME.toggle.knobDark};
      }
      .bb-mini-dev-section {
        padding-top: 12px;
      }
      .bb-mini-btn-dev {
        width: 100%;
        padding: 10px 16px;
        background: linear-gradient(135deg, #364F6B, #4a6a8a);
        color: white;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
      }
      .bb-mini-btn-dev:hover {
        background: linear-gradient(135deg, #4a6a8a, #5a7a9a);
        transform: translateY(-1px);
      }
      .bb-mini-btn-dev svg {
        flex-shrink: 0;
      }
      @keyframes bb-mini-spin {
        to { transform: rotate(360deg); }
      }
    `;
    if (!document.querySelector('#broxy-mini-panel-styles')) {
      style.id = 'broxy-mini-panel-styles';
      document.head.appendChild(style);
    }
  }

  watchTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => this.applyTheme());

    const observer = new MutationObserver(() => this.applyTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
    
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'data-theme']
      });
    }
  }

  detectTheme() {
    const html = document.documentElement;
    
    const dataTheme = html.getAttribute('data-theme');
    if (dataTheme === 'light') return 'light';
    if (dataTheme === 'dark') return 'dark';
    
    if (html.classList.contains('dark')) return 'dark';
    if (html.classList.contains('light')) return 'light';
    
    const bodyTheme = document.body?.getAttribute('data-theme');
    if (bodyTheme === 'light') return 'light';
    if (bodyTheme === 'dark') return 'dark';
    
    const colorScheme = document.querySelector('meta[name="color-scheme"]');
    if (colorScheme) {
      const content = colorScheme.getAttribute('content') || '';
      if (content.includes('light') && !content.includes('dark')) return 'light';
      if (content.includes('dark') && !content.includes('light')) return 'dark';
    }
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    
    return 'light';
  }

  applyTheme() {
    if (!this.panel) return;
    const theme = this.detectTheme();
    if (theme === 'dark') {
      this.panel.classList.add('bb-mini-dark');
    } else {
      this.panel.classList.remove('bb-mini-dark');
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  }

  bindEvents() {
    const closeBtn = this.panel.querySelector('#bb-mini-close-btn');
    const connectBtn = this.panel.querySelector('#bb-mini-connect-btn');
    const devBtn = this.panel.querySelector('#bb-mini-dev-btn');
    const tokenInput = this.panel.querySelector('#bb-mini-token-input');
    const genTokenBtn = this.panel.querySelector('#bb-mini-gen-token-btn');
    const authToggle = this.panel.querySelector('#bb-mini-auth-toggle');
    const copyBtns = this.panel.querySelectorAll('.bb-mini-copy-btn');

    closeBtn.addEventListener('click', () => this.hide());

    connectBtn.addEventListener('click', () => {
      if (this.isConnecting) return;
      
      this.isConnecting = true;
      this.setButtonLoading(true);
      
      if (this.status === 'connected' || this.status === 'reconnecting') {
        this.client.disconnect();
      } else {
        this.client.connect();
      }
    });

    devBtn.addEventListener('click', () => {
      if (this.onDevMode) {
        this.hide();
        this.onDevMode();
      }
    });

    tokenInput.addEventListener('change', (e) => {
      this.configManager.setAuthToken(e.target.value);
    });

    genTokenBtn.addEventListener('click', () => {
      const newToken = this.configManager.generateToken();
      tokenInput.value = newToken;
      this.configManager.setAuthToken(newToken);
    });

    authToggle.addEventListener('change', (e) => {
      this.configManager.setAuthEnabled(e.target.checked);
    });

    copyBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.dataset.url;
        try {
          await navigator.clipboard.writeText(url);
          const originalText = btn.textContent;
          btn.textContent = '已复制';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 1500);
        } catch (err) {
          console.error('[MiniPanel] Copy failed:', err);
        }
      });
    });

    const header = this.panel.querySelector('.bb-mini-panel-header');
    header.addEventListener('mousedown', this.onDragStart.bind(this));
    document.addEventListener('mousemove', this.onDragMove.bind(this));
    document.addEventListener('mouseup', this.onDragEnd.bind(this));
    header.addEventListener('touchstart', this.onDragStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onDragEnd.bind(this));
  }

  onDragStart(e) {
    if (e.target.closest('.bb-mini-panel-close')) return;
    if (e.target.closest('.bb-mini-header-link')) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    this.dragStartX = clientX;
    this.dragStartY = clientY;

    const rect = this.panel.getBoundingClientRect();
    this.panelStartX = rect.left;
    this.panelStartY = rect.top;

    this.isDragging = true;
  }

  onDragMove(e) {
    if (!this.isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - this.dragStartX;
    const deltaY = clientY - this.dragStartY;

    e.preventDefault();

    const panelWidth = this.panel.offsetWidth;
    const panelHeight = this.panel.offsetHeight;
    const margin = 10;
    const maxX = window.innerWidth - panelWidth - margin;
    const maxY = window.innerHeight - panelHeight - margin;

    let newX = this.panelStartX + deltaX;
    let newY = this.panelStartY + deltaY;

    newX = Math.max(margin, Math.min(maxX, newX));
    newY = Math.max(margin, Math.min(maxY, newY));

    this.panel.style.left = `${newX}px`;
    this.panel.style.top = `${newY}px`;
    this.panel.style.right = 'auto';
    this.panel.style.bottom = 'auto';
    this.position = { x: newX, y: newY };
  }

  onDragEnd(e) {
    this.isDragging = false;
  }

  updatePosition() {
    if (!this.panel) return;

    if (this.position) {
      this.panel.style.left = `${this.position.x}px`;
      this.panel.style.top = `${this.position.y}px`;
      return;
    }

    const floatBtn = document.getElementById('broxy-float-btn');
    if (!floatBtn) return;

    const rect = floatBtn.getBoundingClientRect();
    const panelWidth = CONFIG.MINI_PANEL.width;
    const panelHeight = this.panel.offsetHeight || 400;
    const margin = 10;

    let left = rect.right - panelWidth;
    let top = rect.top - panelHeight - margin;

    if (left < margin) {
      left = margin;
    }
    if (left + panelWidth > window.innerWidth - margin) {
      left = window.innerWidth - panelWidth - margin;
    }
    if (top < margin) {
      top = rect.bottom + margin;
    }
    if (top + panelHeight > window.innerHeight - margin) {
      top = window.innerHeight - panelHeight - margin;
    }

    this.panel.style.left = `${Math.max(margin, left)}px`;
    this.panel.style.top = `${Math.max(margin, top)}px`;
  }

  updateData() {
    if (!this.panel) return;

    const routesCount = this.configManager.getEnabledRoutes().length;
    const toolsCount = this.configManager.getEnabledTools().length;
    const apiUrl = this.configManager.getApiUrl();
    const mcpUrl = this.configManager.getMcpUrl();
    const authToken = this.configManager.getAuthToken();
    const authEnabled = this.configManager.isAuthEnabled();

    const routesBadge = this.panel.querySelector('#bb-mini-routes-badge');
    const toolsBadge = this.panel.querySelector('#bb-mini-tools-badge');
    const apiUrlEl = this.panel.querySelector('#bb-mini-api-url');
    const mcpUrlEl = this.panel.querySelector('#bb-mini-mcp-url');
    const tokenInput = this.panel.querySelector('#bb-mini-token-input');
    const authToggle = this.panel.querySelector('#bb-mini-auth-toggle');
    const copyBtns = this.panel.querySelectorAll('.bb-mini-btn-sm[data-url]');

    if (routesBadge) routesBadge.textContent = routesCount;
    if (toolsBadge) toolsBadge.textContent = toolsCount;
    if (apiUrlEl) apiUrlEl.value = apiUrl;
    if (mcpUrlEl) mcpUrlEl.value = mcpUrl;
    if (tokenInput) tokenInput.value = authToken;
    if (authToggle) authToggle.checked = authEnabled;

    if (copyBtns[0]) copyBtns[0].dataset.url = apiUrl;
    if (copyBtns[1]) copyBtns[1].dataset.url = mcpUrl;
  }

  updateStatus(status) {
    this.status = status;
    if (!this.panel) return;

    this.setButtonLoading(false);

    const statusDot = this.panel.querySelector('#bb-mini-status-dot');
    const statusText = this.panel.querySelector('#bb-mini-status-text');
    const connectBtn = this.panel.querySelector('#bb-mini-connect-btn');
    const btnTextEl = connectBtn.querySelector('.bb-mini-btn-text');

    const statusMap = {
      connected: { text: '已启动', dotClass: 'connected', btnText: '停止', btnClass: 'bb-mini-connected bb-mini-stop' },
      reconnecting: { text: '重启服务中...', dotClass: 'reconnecting', btnText: '停止', btnClass: 'bb-mini-connected bb-mini-stop' },
      error: { text: '连接错误', dotClass: 'error', btnText: '启动', btnClass: '' },
      failed: { text: '连接失败', dotClass: 'failed', btnText: '启动', btnClass: '' },
      disconnected: { text: '未启动', dotClass: '', btnText: '启动', btnClass: '' },
    };

    const info = statusMap[status] || statusMap.disconnected;

    statusDot.className = `bb-mini-status-dot ${info.dotClass}`;
    statusText.textContent = info.text;
    if (btnTextEl) {
      btnTextEl.textContent = info.btnText;
    }
    connectBtn.className = `bb-mini-circle-btn ${info.btnClass}`;
  }

  setButtonLoading(loading) {
    if (!this.panel) return;
    
    const connectBtn = this.panel.querySelector('#bb-mini-connect-btn');
    const btnTextEl = connectBtn?.querySelector('.bb-mini-btn-text');
    if (!connectBtn) return;
    
    if (loading) {
      connectBtn.classList.add('bb-mini-btn-loading');
      connectBtn.disabled = true;
      if (btnTextEl) {
        btnTextEl.textContent = this.status === 'connected' || this.status === 'reconnecting' ? '停止中' : '启动中';
      }
    } else {
      connectBtn.classList.remove('bb-mini-btn-loading');
      connectBtn.disabled = false;
      this.isConnecting = false;
    }
  }

  show() {
    if (!this.panel) this.create();
    this.updatePosition();
    this.updateData();
    this.applyTheme();
    if (this.status) {
      this.updateStatus(this.status);
    }
    this.panel.classList.add('bb-mini-visible');
    this.isVisible = true;
    if (this.floatButton && this.floatButton.button) {
      this.floatButton.button.style.display = 'none';
    }
  }

  hide() {
    if (this.panel) {
      this.panel.classList.remove('bb-mini-visible');
      this.isVisible = false;
    }
    if (this.floatButton && this.floatButton.button) {
      this.floatButton.button.style.display = 'flex';
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  destroy() {
    document.removeEventListener('keydown', this.boundHandleKeydown);
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
