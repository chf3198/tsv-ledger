# Performance Monitoring

## Overview

Performance monitoring provides continuous tracking of TSV Ledger's operational metrics, ensuring optimal performance and early detection of issues. This system monitors key performance indicators across all system components.

## Application Performance Monitoring (APM)

### Response Time Tracking
```javascript
// src/middleware/performance-monitor.js
const responseTime = require('response-time');

const performanceMonitor = responseTime((req, res, time) => {
  const metrics = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: time,
    timestamp: Date.now(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };

  // Log to monitoring system
  logPerformanceMetric('http_response_time', metrics);

  // Alert on slow responses
  if (time > 1000) { // 1 second threshold
    alertSlowResponse(metrics);
  }
});

function logPerformanceMetric(metricName, data) {
  // Send to monitoring service (DataDog, New Relic, etc.)
  monitoringService.gauge(metricName, data.responseTime, {
    method: data.method,
    status_code: data.statusCode,
    endpoint: data.url
  });
}

function alertSlowResponse(metrics) {
  notificationService.alert('Slow Response Detected', {
    endpoint: `${metrics.method} ${metrics.url}`,
    responseTime: `${metrics.responseTime}ms`,
    statusCode: metrics.statusCode,
    timestamp: new Date(metrics.timestamp).toISOString()
  });
}

module.exports = performanceMonitor;
```

### Error Rate Monitoring
```javascript
// src/middleware/error-monitor.js
const errorMonitor = (err, req, res, next) => {
  const errorMetrics = {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    timestamp: Date.now(),
    userId: req.user?.id,
    ip: req.ip
  };

  // Log error
  logErrorMetric('application_error', errorMetrics);

  // Track error rates
  incrementErrorCounter(errorMetrics);

  // Alert on high error rates
  checkErrorRateThresholds();

  next(err);
};

function incrementErrorCounter(metrics) {
  // Increment error counters by endpoint, status code, etc.
  monitoringService.increment('errors_total', {
    endpoint: metrics.url,
    status_code: metrics.statusCode,
    error_type: getErrorType(metrics.error)
  });
}

function checkErrorRateThresholds() {
  // Check error rates over time windows
  const errorRate5m = getErrorRateLast5Minutes();
  const errorRate1h = getErrorRateLastHour();

  if (errorRate5m > 0.05) { // 5% error rate in 5 minutes
    alertHighErrorRate('5m', errorRate5m);
  }

  if (errorRate1h > 0.02) { // 2% error rate in 1 hour
    alertHighErrorRate('1h', errorRate1h);
  }
}
```

## Database Performance Monitoring

### Query Performance Tracking
```javascript
// src/database/performance-monitor.js
const originalQuery = database.query;

database.query = function(sql, params, callback) {
  const startTime = Date.now();

  return originalQuery.call(this, sql, params, (err, result) => {
    const queryTime = Date.now() - startTime;

    const queryMetrics = {
      sql: sql.substring(0, 1000), // Truncate long queries
      executionTime: queryTime,
      timestamp: Date.now(),
      success: !err,
      resultCount: result ? result.rowCount : 0
    };

    logQueryMetric('database_query', queryMetrics);

    // Alert on slow queries
    if (queryTime > 1000) { // 1 second threshold
      alertSlowQuery(queryMetrics);
    }

    callback(err, result);
  });
};

function logQueryMetric(metricName, data) {
  monitoringService.histogram(metricName, data.executionTime, {
    success: data.success,
    slow_query: data.executionTime > 1000
  });
}
```

### Connection Pool Monitoring
```javascript
// src/database/connection-monitor.js
class ConnectionPoolMonitor {
  constructor(pool) {
    this.pool = pool;
    this.monitorInterval = setInterval(() => {
      this.collectPoolMetrics();
    }, 30000); // Every 30 seconds
  }

  collectPoolMetrics() {
    const metrics = {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      timestamp: Date.now()
    };

    monitoringService.gauge('db_connection_pool_total', metrics.totalConnections);
    monitoringService.gauge('db_connection_pool_idle', metrics.idleConnections);
    monitoringService.gauge('db_connection_pool_waiting', metrics.waitingClients);

    // Alert on connection pool issues
    if (metrics.waitingClients > 10) {
      alertConnectionPoolIssue('High wait queue', metrics);
    }

    if (metrics.idleConnections === 0) {
      alertConnectionPoolIssue('No idle connections', metrics);
    }
  }

  destroy() {
    clearInterval(this.monitorInterval);
  }
}
```

## System Resource Monitoring

### CPU and Memory Monitoring
```javascript
// src/monitoring/system-monitor.js
const os = require('os');

class SystemMonitor {
  constructor() {
    this.metrics = [];
    this.monitorInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Every minute
  }

  collectSystemMetrics() {
    const metrics = {
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      loadAverage: os.loadavg(),
      timestamp: Date.now()
    };

    this.metrics.push(metrics);

    // Log to monitoring service
    monitoringService.gauge('system_cpu_usage', metrics.cpuUsage);
    monitoringService.gauge('system_memory_usage', metrics.memoryUsage);
    monitoringService.gauge('system_load_1m', metrics.loadAverage[0]);
    monitoringService.gauge('system_load_5m', metrics.loadAverage[1]);
    monitoringService.gauge('system_load_15m', metrics.loadAverage[2]);

    // Alert on high resource usage
    this.checkResourceThresholds(metrics);
  }

  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - ~~(100 * totalIdle / totalTick);
  }

  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return (usedMemory / totalMemory) * 100;
  }

  checkResourceThresholds(metrics) {
    if (metrics.cpuUsage > 90) {
      alertHighResourceUsage('CPU', metrics.cpuUsage);
    }

    if (metrics.memoryUsage > 85) {
      alertHighResourceUsage('Memory', metrics.memoryUsage);
    }

    if (metrics.loadAverage[0] > os.cpus().length * 2) {
      alertHighResourceUsage('Load Average', metrics.loadAverage[0]);
    }
  }

  destroy() {
    clearInterval(this.monitorInterval);
  }
}
```

## User Experience Monitoring

### Frontend Performance Monitoring
```javascript
// public/js/performance-monitor.js
class FrontendPerformanceMonitor {
  constructor() {
    this.initPerformanceObserver();
    this.trackPageLoadMetrics();
    this.trackUserInteractions();
  }

  initPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.trackMetric('long_task', {
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Monitor layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.value > 0) {
            this.trackMetric('layout_shift', {
              value: entry.value,
              hadRecentInput: entry.hadRecentInput
            });
          }
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  trackPageLoadMetrics() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      this.trackMetric('page_load', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
      });
    });
  }

  trackUserInteractions() {
    // Track button clicks and form submissions
    document.addEventListener('click', (event) => {
      if (event.target.matches('button, [role="button"]')) {
        this.trackMetric('user_interaction', {
          type: 'click',
          element: event.target.tagName,
          timestamp: Date.now()
        });
      }
    });

    document.addEventListener('submit', (event) => {
      this.trackMetric('user_interaction', {
        type: 'form_submit',
        formId: event.target.id,
        timestamp: Date.now()
      });
    });
  }

  trackMetric(name, data) {
    // Send to monitoring service
    if (window.monitoringService) {
      window.monitoringService.track(name, data);
    }

    // Also send to backend for server-side aggregation
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data, timestamp: Date.now() })
    });
  }
}

// Initialize monitoring
new FrontendPerformanceMonitor();
```

### Real User Monitoring (RUM)
```javascript
// public/js/rum-monitor.js
class RUMMonitor {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.trackPageViews();
    this.trackErrors();
    this.trackAjaxRequests();
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  trackPageViews() {
    // Track initial page load
    this.trackEvent('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });

    // Track navigation changes
    window.addEventListener('popstate', () => {
      this.trackEvent('page_view', {
        url: window.location.href,
        navigationType: 'browser_back_forward'
      });
    });
  }

  trackErrors() {
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('promise_rejection', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack
      });
    });
  }

  trackAjaxRequests() {
    const originalFetch = window.fetch;

    window.fetch = function(...args) {
      const startTime = Date.now();
      const url = args[0];

      return originalFetch.apply(this, args)
        .then(response => {
          const duration = Date.now() - startTime;
          this.trackEvent('ajax_request', {
            url: url,
            method: args[1]?.method || 'GET',
            status: response.status,
            duration: duration,
            success: response.ok
          });
          return response;
        })
        .catch(error => {
          const duration = Date.now() - startTime;
          this.trackEvent('ajax_request', {
            url: url,
            method: args[1]?.method || 'GET',
            error: error.message,
            duration: duration,
            success: false
          });
          throw error;
        });
    }.bind(this);
  }

  trackEvent(eventType, data) {
    const eventData = {
      sessionId: this.sessionId,
      eventType,
      timestamp: Date.now(),
      url: window.location.href,
      userId: window.currentUser?.id,
      ...data
    };

    // Send to monitoring endpoint
    fetch('/api/rum-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
      keepalive: true // Ensure delivery even on page unload
    });
  }
}

// Initialize RUM monitoring
new RUMMonitor();
```

## Custom Metrics and Alerts

### Business Metrics Monitoring
```javascript
// src/monitoring/business-metrics.js
class BusinessMetricsMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = new Map();
  }

  trackBusinessMetric(name, value, tags = {}) {
    // Store metric with timestamp
    const metric = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push(metric);

    // Send to monitoring service
    monitoringService.gauge(`business_${name}`, value, tags);

    // Check business-specific thresholds
    this.checkBusinessThresholds(name, value, tags);
  }

  checkBusinessThresholds(name, value, tags) {
    const thresholds = {
      daily_active_users: { warning: 1000, critical: 500 },
      transaction_volume: { warning: 10000, critical: 5000 },
      conversion_rate: { warning: 0.02, critical: 0.01 }
    };

    const threshold = thresholds[name];
    if (threshold) {
      if (value < threshold.critical) {
        this.alertBusinessMetric(name, 'critical', value, tags);
      } else if (value < threshold.warning) {
        this.alertBusinessMetric(name, 'warning', value, tags);
      }
    }
  }

  alertBusinessMetric(name, severity, value, tags) {
    const alertKey = `${name}_${severity}`;
    const now = Date.now();

    // Prevent alert spam (only alert once per hour per metric)
    if (this.alerts.get(alertKey) > now - 3600000) {
      return;
    }

    this.alerts.set(alertKey, now);

    notificationService.alert(`Business Metric Alert: ${name}`, {
      severity,
      metric: name,
      value,
      tags,
      timestamp: new Date(now).toISOString()
    });
  }

  // Business-specific metric tracking methods
  trackUserRegistration(userData) {
    this.trackBusinessMetric('user_registrations', 1, {
      source: userData.source,
      plan: userData.plan
    });
  }

  trackTransaction(transactionData) {
    this.trackBusinessMetric('transaction_volume', transactionData.amount, {
      currency: transactionData.currency,
      category: transactionData.category
    });
  }

  trackFeatureUsage(featureName, userId) {
    this.trackBusinessMetric('feature_usage', 1, {
      feature: featureName,
      user_id: userId
    });
  }
}
```

## Monitoring Dashboard

### Real-time Metrics Dashboard
```javascript
// src/routes/monitoring.js
const express = require('express');
const router = express.Router();

// Get current system metrics
router.get('/metrics/current', (req, res) => {
  const metrics = {
    system: getSystemMetrics(),
    application: getApplicationMetrics(),
    database: getDatabaseMetrics(),
    business: getBusinessMetrics()
  };

  res.json(metrics);
});

// Get historical metrics
router.get('/metrics/history', (req, res) => {
  const { metric, startDate, endDate } = req.query;

  const history = getMetricHistory(metric, startDate, endDate);

  res.json(history);
});

// Get alerts
router.get('/alerts', (req, res) => {
  const alerts = getRecentAlerts();

  res.json(alerts);
});

// Health check endpoint
router.get('/health', (req, res) => {
  const health = performHealthCheck();

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

function performHealthCheck() {
  const checks = {
    database: checkDatabaseHealth(),
    cache: checkCacheHealth(),
    externalServices: checkExternalServicesHealth()
  };

  const allHealthy = Object.values(checks).every(check => check.healthy);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  };
}
```

## Alert Management

### Alert Configuration
```javascript
// config/alerts.js
const alertRules = {
  response_time: {
    condition: 'avg > 2000',
    duration: '5m',
    severity: 'warning',
    channels: ['email', 'slack']
  },

  error_rate: {
    condition: 'rate > 0.05',
    duration: '5m',
    severity: 'critical',
    channels: ['email', 'slack', 'sms']
  },

  cpu_usage: {
    condition: 'avg > 90',
    duration: '10m',
    severity: 'warning',
    channels: ['email']
  },

  memory_usage: {
    condition: 'avg > 85',
    duration: '5m',
    severity: 'critical',
    channels: ['email', 'slack']
  },

  db_connection_pool: {
    condition: 'waiting > 20',
    duration: '2m',
    severity: 'warning',
    channels: ['email']
  }
};
```

### Alert Notification System
```javascript
// src/services/notification-service.js
class NotificationService {
  async alert(title, details, channels = ['email']) {
    const alert = {
      title,
      details,
      timestamp: new Date().toISOString(),
      channels
    };

    for (const channel of channels) {
      await this.sendNotification(channel, alert);
    }

    // Log alert
    await this.logAlert(alert);
  }

  async sendNotification(channel, alert) {
    switch (channel) {
      case 'email':
        await this.sendEmailAlert(alert);
        break;
      case 'slack':
        await this.sendSlackAlert(alert);
        break;
      case 'sms':
        await this.sendSMSAlert(alert);
        break;
    }
  }

  async sendEmailAlert(alert) {
    // Send email notification
    await emailService.send({
      to: process.env.ALERT_EMAIL_RECIPIENTS,
      subject: `🚨 Alert: ${alert.title}`,
      template: 'alert-notification',
      data: alert
    });
  }

  async sendSlackAlert(alert) {
    // Send Slack notification
    await slackService.postMessage({
      channel: process.env.SLACK_ALERT_CHANNEL,
      text: `🚨 *${alert.title}*\n${JSON.stringify(alert.details, null, 2)}`,
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: Object.entries(alert.details).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        }))
      }]
    });
  }

  async logAlert(alert) {
    // Store alert in database for historical tracking
    await database.collection('alerts').insertOne({
      ...alert,
      resolved: false,
      createdAt: new Date()
    });
  }
}
```

This comprehensive performance monitoring system ensures TSV Ledger maintains optimal performance and provides early detection of issues across all system components.