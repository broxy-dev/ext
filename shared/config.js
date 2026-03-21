export const THEME = {
  primary: {
    start: '#3FC1C9',
    end: '#1A868D',
  },
  status: {
    connected: { start: '#4caf50', end: '#2e7d32' },
    reconnecting: { start: '#ff9800', end: '#e65100' },
    error: { start: '#f44336', end: '#b71c1c' },
    failed: { start: '#f44336', end: '#b71c1c' },
    disconnected: { start: '#9e9e9e', end: '#616161' },
  },
  text: {
    primary: '#333',
    secondary: '#666',
    tertiary: '#888',
    light: '#e0e0e0',
  },
  background: {
    panel: 'rgba(255, 255, 255, 0.8)',
    panelDark: 'rgba(26, 26, 46, 0.8)',
    hover: '#e8e8e8',
    hoverDark: '#3a3a5a',
    hoverDarkAlt: '#4a4a6a',
    input: 'rgba(0, 0, 0, 0.04)',
    inputDark: 'rgba(42, 42, 74, 0.6)',
  },
  border: {
    light: 'rgba(0, 0, 0, 0.1)',
    section: 'rgba(0, 0, 0, 0.08)',
    primary: 'rgba(63, 193, 201, 0.25)',
    primaryLight: 'rgba(63, 193, 201, 0.15)',
    input: 'rgba(0, 0, 0, 0.12)',
    inputDark: 'rgba(63, 193, 201, 0.2)',
  },
  shadow: {
    panel: '0 8px 32px rgba(0, 0, 0, 0.15)',
    panelDark: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(63, 193, 201, 0.15)',
    btn: '0 2px 8px rgba(0, 0, 0, 0.15)',
    btnHover: '0 4px 12px rgba(63, 193, 201, 0.4)',
    btnConnected: '0 4px 12px rgba(76, 175, 80, 0.4)',
    inputFocus: '0 0 8px rgba(63, 193, 201, 0.3)',
  },
  toggle: {
    on: '#3FC1C9',
    off: '#ccc',
    offDark: '#3a3a5a',
    knobDark: '#888',
  },
};

export const CONFIG = {
  // Cloudflare Worker 域名配置
  WORKER_DOMAIN: 'v1.broxy.dev',

  // 是否自动连接
  AUTO_CONNECT: location.host.endsWith('broxy.dev'),

  // iframe UI 配置
  UI_IFRAME_URL: 'https://iframe-v1.broxy.dev',
  // dev
  //UI_IFRAME_URL: 'http://localhost:3000',
  UI_IFRAME_WIDTH: 850,
  UI_IFRAME_HEIGHT: 650,

  // 浮动按钮配置
  FLOAT_BUTTON: {
    size: 48,
    zIndex: 999999,
    defaultPosition: 'bottom-right',
    offset: 20,
  },

  MINI_PANEL: {
    width: 320,
    title: 'Broxy',
    projectUrl: 'https://broxy.dev',
  },

  // 本地存储 key（添加当前域名前缀，避免跨域冲突）
  WEB_ID_KEY: 'broxy_web_id',
  CONNECTION_KEY: 'broxy_connected',
  CONNECTION_STATE_KEY: 'broxy_connection_state',
  POSITION_KEY: 'broxy_position',
  FLOAT_BUTTON_POSITION_KEY: 'broxy_float_btn_pos',
  USER_DISCONNECTED_KEY: 'broxy_user_disconnected',
  ROUTES_KEY: 'broxy_routes',
  TOOLS_KEY: 'broxy_tools',
  PANEL_SIZE_KEY: 'broxy_panel_size',
  PANEL_POSITION_KEY: 'broxy_panel_position',

  // 重连配置
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT: 10,
};

// 自动生成 URL
export const WORKER_URL = `wss://${CONFIG.WORKER_DOMAIN}`;
export const HTTP_URL = `https://${CONFIG.WORKER_DOMAIN}`;

// 迁移旧的 localStorage 数据
export function migrateOldData() {
  const hostname = window.location.hostname;

  const migrations = [
    { from: `browser_bridge_web_id_${hostname}`, to: 'broxy_web_id' },
    { from: `browser_bridge_connected_${hostname}`, to: 'broxy_connected' },
    { from: `browser_bridge_connection_state_${hostname}`, to: 'broxy_connection_state' },
    { from: `browser_bridge_position_${hostname}`, to: 'broxy_position' },
    { from: `browser_bridge_float_btn_pos_${hostname}`, to: 'broxy_float_btn_pos' },
    { from: `browser_bridge_user_disconnected_${hostname}`, to: 'broxy_user_disconnected' },
    { from: `browser_bridge_routes_${hostname}`, to: 'broxy_routes' },
    { from: `browser_bridge_tools_${hostname}`, to: 'broxy_tools' },
    { from: `broxy_web_id_${hostname}`, to: 'broxy_web_id' },
    { from: `broxy_connected_${hostname}`, to: 'broxy_connected' },
    { from: `broxy_connection_state_${hostname}`, to: 'broxy_connection_state' },
    { from: `broxy_position_${hostname}`, to: 'broxy_position' },
    { from: `broxy_float_btn_pos_${hostname}`, to: 'broxy_float_btn_pos' },
    { from: `broxy_user_disconnected_${hostname}`, to: 'broxy_user_disconnected' },
    { from: `broxy_routes_${hostname}`, to: 'broxy_routes' },
    { from: `broxy_tools_${hostname}`, to: 'broxy_tools' },
  ];

  migrations.forEach(({ from, to }) => {
    const value = localStorage.getItem(from);
    if (value && !localStorage.getItem(to)) {
      localStorage.setItem(to, value);
      localStorage.removeItem(from);
    }
  });
}
