// 工具函数模块

// 检查是否在 iframe 中
export function isInIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// 检查是否在 Worker 域名下
export function isWorkerDomain(domain) {
  return window.location.hostname === domain;
}

// Web ID 管理
export function getWebId(storageKey) {
  let webId = localStorage.getItem(storageKey);
  if (!webId) {
    webId = crypto.randomUUID();
    localStorage.setItem(storageKey, webId);
    console.log('[Broxy] Generated new webId:', webId);
  }
  return webId;
}

// 重置 Web ID
export function resetWebId(storageKey) {
  const newWebId = crypto.randomUUID();
  localStorage.setItem(storageKey, newWebId);
  console.log('[Broxy] Reset webId to:', newWebId);
  return newWebId;
}

// 连接状态管理
export function getConnectionState(storageKey) {
  return localStorage.getItem(storageKey) === 'true';
}

export function setConnectionState(storageKey, connected) {
  localStorage.setItem(storageKey, connected ? 'true' : 'false');
}

export function getSavedPosition(storageKey, defaultPosition) {
  return localStorage.getItem(storageKey) || defaultPosition;
}

export function savePosition(storageKey, position) {
  localStorage.setItem(storageKey, position);
}

// 复制到剪贴板
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('[Broxy] Copy failed:', err);
    return false;
  }
}
