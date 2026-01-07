# Monitoring and Logging

Comprehensive monitoring system for Amazon integration operations.

## Processing Metrics

Track file processing performance and success rates:

```javascript
// src/amazon-integration/monitoring.js
class AmazonIntegrationMonitor {
  constructor() {
    this.metrics = {
      filesProcessed: 0,
      totalProcessingTime: 0,
      averageFileSize: 0,
      successRate: 0,
      errorBreakdown: {},
      performanceMetrics: []
    };
  }

  recordProcessingStart(fileSize) {
    this.currentProcessing = {
      startTime: Date.now(),
      fileSize,
      steps: []
    };
  }

  recordStep(stepName, duration) {
    if (this.currentProcessing) {
      this.currentProcessing.steps.push({
        name: stepName,
        duration,
        timestamp: Date.now()
      });
    }
  }

  recordProcessingComplete(success, errorType = null) {
    if (this.currentProcessing) {
      const duration = Date.now() - this.currentProcessing.startTime;

      this.metrics.filesProcessed++;
      this.metrics.totalProcessingTime += duration;
      this.metrics.averageFileSize =
        (this.metrics.averageFileSize * (this.metrics.filesProcessed - 1) + this.currentProcessing.fileSize)
        / this.metrics.filesProcessed;

      if (success) {
        this.metrics.successRate =
          (this.metrics.successRate * (this.metrics.filesProcessed - 1) + 1) / this.metrics.filesProcessed;
      } else {
        this.metrics.successRate =
          (this.metrics.successRate * (this.metrics.filesProcessed - 1)) / this.metrics.filesProcessed;

        if (errorType) {
          this.metrics.errorBreakdown[errorType] = (this.metrics.errorBreakdown[errorType] || 0) + 1;
        }
      }

      this.metrics.performanceMetrics.push({
        duration,
        fileSize: this.currentProcessing.fileSize,
        steps: this.currentProcessing.steps,
        success
      });

      // Keep only last 1000 metrics
      if (this.metrics.performanceMetrics.length > 1000) {
        this.metrics.performanceMetrics.shift();
      }

      this.currentProcessing = null;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageProcessingTime: this.metrics.totalProcessingTime / Math.max(this.metrics.filesProcessed, 1)
    };
  }

  getHealthStatus() {
    const metrics = this.getMetrics();

    return {
      status: metrics.successRate > 0.95 ? 'healthy' : metrics.successRate > 0.80 ? 'warning' : 'critical',
      metrics,
      timestamp: new Date().toISOString()
    };
  }
}
```

## Error Tracking

Comprehensive error logging and categorization:

```javascript
// src/amazon-integration/errorTracker.js
const winston = require('winston');

class AmazonErrorTracker {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/amazon-integration-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/amazon-integration.log' })
      ]
    });
  }

  logError(error, context = {}) {
    this.logger.error('Amazon Integration Error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: context.userAgent || 'unknown',
        ipAddress: context.ipAddress || 'unknown'
      }
    });
  }

  logProcessingEvent(eventType, details) {
    this.logger.info('Amazon Processing Event', {
      eventType,
      details,
      timestamp: new Date().toISOString()
    });
  }

  getErrorSummary(timeRange = 24 * 60 * 60 * 1000) { // 24 hours
    // Implementation would query log files for error summary
    // This is a simplified version
    return {
      totalErrors: 0,
      errorTypes: {},
      timeRange: `${timeRange / (60 * 60 * 1000)} hours`
    };
  }
}
```