// 配置模块
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

  // 本地存储 key（添加当前域名前缀，避免跨域冲突）
  get WEB_ID_KEY() {
    return `broxy_web_id_${window.location.hostname}`;
  },
  get CONNECTION_KEY() {
    return `broxy_connected_${window.location.hostname}`;
  },
  get CONNECTION_STATE_KEY() {
    return `broxy_connection_state_${window.location.hostname}`;
  },
  get POSITION_KEY() {
    return `broxy_position_${window.location.hostname}`;
  },
  get FLOAT_BUTTON_POSITION_KEY() {
    return `broxy_float_btn_pos_${window.location.hostname}`;
  },
  get USER_DISCONNECTED_KEY() {
    return `broxy_user_disconnected_${window.location.hostname}`;
  },
  get ROUTES_GLOBAL_KEY() {
    return `broxy_routes_global`;
  },
  get ROUTES_DOMAIN_KEY() {
    return `broxy_routes_${window.location.hostname}`;
  },
  get TOOLS_GLOBAL_KEY() {
    return `broxy_tools_global`;
  },
  get TOOLS_DOMAIN_KEY() {
    return `broxy_tools_${window.location.hostname}`;
  },

  // 重连配置
  RECONNECT_INTERVAL: 5000,
  MAX_RECONNECT: 10,
};

// 自动生成 URL
export const WORKER_URL = `wss://${CONFIG.WORKER_DOMAIN}`;
export const HTTP_URL = `https://${CONFIG.WORKER_DOMAIN}`;

// 迁移旧的 localStorage 数据
export function migrateOldData() {
  const keys = [
    { old: 'browser_bridge_web_id_', new: 'broxy_web_id_' },
    { old: 'browser_bridge_connected_', new: 'broxy_connected_' },
    { old: 'browser_bridge_connection_state_', new: 'broxy_connection_state_' },
    { old: 'browser_bridge_position_', new: 'broxy_position_' },
    { old: 'browser_bridge_float_btn_pos_', new: 'broxy_float_btn_pos_' },
    { old: 'browser_bridge_user_disconnected_', new: 'broxy_user_disconnected_' },
    { old: 'browser_bridge_routes_global', new: 'broxy_routes_global', noSuffix: true },
    { old: 'browser_bridge_routes_', new: 'broxy_routes_' },
    { old: 'browser_bridge_tools_global', new: 'broxy_tools_global', noSuffix: true },
    { old: 'browser_bridge_tools_', new: 'broxy_tools_' },
  ];

  const hostname = window.location.hostname;

  keys.forEach(({ old, new: newKey, noSuffix }) => {
    const oldKey = noSuffix ? old : `${old}${hostname}`;
    const newKeyFull = noSuffix ? newKey : `${newKey}${hostname}`;
    const oldValue = localStorage.getItem(oldKey);
    if (oldValue && !localStorage.getItem(newKeyFull)) {
      localStorage.setItem(newKeyFull, oldValue);
      localStorage.removeItem(oldKey);
    }
  });
}
