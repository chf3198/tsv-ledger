# JavaScript Module System

## Overview

TSV Ledger uses a modular JavaScript architecture with clear separation of concerns. All JavaScript files are organized in `public/js/modules/[feature]/[module].js` and maintain the 300-line limit.

## Module Organization

JavaScript is organized in `public/js/modules/[feature]/[module].js` with clear responsibilities.

```
public/js/modules/
├── api/
│   ├── client.js
│   └── endpoints.js
├── ui/
│   ├── notifications.js
│   ├── modal.js
│   └── forms.js
├── utils/
│   ├── date.js
│   ├── currency.js
│   └── validation.js
├── charts/
│   ├── chart.js
│   └── analytics.js
└── components/
    ├── base.js
    └── loader.js
```

## API Client Module

Centralized API communication with error handling and caching.

### Implementation

```javascript
// public/js/modules/api/client.js
class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async get(endpoint, options = {}) {
    const cacheKey = `GET:${endpoint}`;
    const cached = this.cache.get(cacheKey);

    if (cached && !this.isExpired(cached.timestamp)) {
      return cached.data;
    }

    return this.request('GET', endpoint, null, options);
  }

  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestKey = `${method}:${url}`;

    // Prevent duplicate requests
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const requestPromise = this.makeRequest(method, url, data, options);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  async makeRequest(method, url, data, options) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Cache GET requests
      if (method === 'GET') {
        this.cache.set(`${method}:${url}`, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  isExpired(timestamp, maxAge = 5 * 60 * 1000) { // 5 minutes
    return Date.now() - timestamp > maxAge;
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Global instance
window.apiClient = new ApiClient();
```

## UI Components Module

Reusable UI components with consistent behavior.

### Notifications System

```javascript
// public/js/modules/ui/notifications.js
class NotificationManager {
  constructor() {
    this.container = this.createContainer();
    this.notifications = new Map();
  }

  createContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', duration = 5000) {
    const id = Date.now().toString();
    const notification = this.createNotification(id, message, type);

    this.notifications.set(id, notification);
    this.container.appendChild(notification.element);

    if (duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }

    return id;
  }

  createNotification(id, message, type) {
    const element = document.createElement('div');
    element.className = `alert alert-${this.getBootstrapClass(type)} alert-dismissible fade show`;
    element.innerHTML = `
      ${message}
      <button type="button" class="btn-close" onclick="notificationManager.hide('${id}')"></button>
    `;

    return { element, type, timestamp: Date.now() };
  }

  getBootstrapClass(type) {
    const classes = {
      success: 'success',
      error: 'danger',
      warning: 'warning',
      info: 'info'
    };
    return classes[type] || 'info';
  }

  hide(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.element.classList.remove('show');
      setTimeout(() => {
        if (notification.element.parentNode) {
          notification.element.parentNode.removeChild(notification.element);
        }
        this.notifications.delete(id);
      }, 150);
    }
  }

  clear() {
    for (const id of this.notifications.keys()) {
      this.hide(id);
    }
  }
}

// Global instance
window.notificationManager = new NotificationManager();
```

## Utility Modules

Common utility functions organized by domain.

### Date Utilities

```javascript
// public/js/modules/utils/date.js
class DateUtils {
  static format(date, format = 'MM/DD/YYYY') {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      default:
        return date.toLocaleDateString();
    }
  }

  static parse(dateString) {
    if (!dateString) return null;

    // Try different formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // MM/DD/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/  // DD.MM.YYYY
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const [, a, b, c] = match;
        if (format === formats[0]) { // MM/DD/YYYY
          return new Date(c, a - 1, b);
        } else if (format === formats[1]) { // YYYY-MM-DD
          return new Date(a, b - 1, c);
        } else { // DD.MM.YYYY
          return new Date(c, b - 1, a);
        }
      }
    }

    // Fallback to native parsing
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  static isValid(date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static diffInDays(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  }
}
```

## Module Loading Strategy

### Dynamic Imports
Modules are loaded on-demand to improve initial page load performance.

```javascript
// Dynamic module loading
class ModuleLoader {
  static async load(moduleName) {
    try {
      const module = await import(`./modules/${moduleName}.js`);
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load module: ${moduleName}`, error);
      throw error;
    }
  }

  static async loadMultiple(moduleNames) {
    const promises = moduleNames.map(name => this.load(name));
    return Promise.all(promises);
  }
}

// Usage
document.addEventListener('DOMContentLoaded', async () => {
  // Load essential modules
  const [ApiClient, NotificationManager] = await ModuleLoader.loadMultiple([
    'api/client',
    'ui/notifications'
  ]);

  // Initialize application
  window.apiClient = new ApiClient();
  window.notificationManager = new NotificationManager();
});
```

## Best Practices

### Module Design
- Keep modules focused on single responsibilities
- Use clear, descriptive naming conventions
- Export classes or functions, not implementations

### Error Handling
- Implement comprehensive error handling
- Provide meaningful error messages
- Log errors for debugging

### Performance
- Use dynamic imports for large modules
- Implement caching where appropriate
- Minimize DOM manipulation

### Testing
- Write unit tests for all modules
- Mock external dependencies
- Test error conditions thoroughly