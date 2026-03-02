export class Logger {
  constructor(maxLogs = 50) {
    this.logs = [];
    this.maxLogs = maxLogs;
    this.idCounter = 0;
  }

  generateId() {
    return `${Date.now()}-${++this.idCounter}`;
  }

  addLog(type, method, path, query, body, headers, result, duration) {
    const log = {
      id: this.generateId(),
      timestamp: new Date().toLocaleTimeString(),
      type: type,
      method,
      path,
      query,
      body,
      headers,
      result,
      duration,
      status: result?.error ? 'error' : 'success'
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return log;
  }

  addSystemLog(type, action, message, details = null) {
    const log = {
      id: this.generateId(),
      timestamp: new Date().toLocaleTimeString(),
      type: type,
      action: action,
      message: message,
      details: details,
      status: action === 'failed' || action === 'error' ? 'error' : 'success'
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return log;
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  clear() {
    this.logs = [];
  }
}
