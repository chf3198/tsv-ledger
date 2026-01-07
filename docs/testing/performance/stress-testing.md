# Stress Testing

## Overview

Stress testing pushes TSV Ledger beyond normal operational limits to identify breaking points, failure modes, and recovery capabilities. This testing ensures the system degrades gracefully under extreme conditions.

## Stress Test Scenarios

### Maximum User Load
```javascript
// tests/performance/stress-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Normal load warmup"
    - duration: 120
      arrivalRate: 100
      name: "High stress load"
    - duration: 60
      arrivalRate: 200
      name: "Extreme stress load"
    - duration: 30
      arrivalRate: 10
      name: "Recovery phase"

scenarios:
  - name: "Intensive user operations"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "stressuser{{ $randomInt }}@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - loop:
          - post:
              url: "/api/transactions"
              headers:
                Authorization: "Bearer {{ token }}"
              json:
                description: "Stress transaction {{ $loopCount }}"
                amount: "{{ $randomInt }}"
                date: "2023-12-01"
                category: "Stress Test"
                tags: ["stress", "load", "test"]
          - get:
              url: "/api/transactions?limit=1000"
              headers:
                Authorization: "Bearer {{ token }}"
          - get:
              url: "/api/reports/complex-analysis"
              headers:
                Authorization: "Bearer {{ token }}"
          - think: 0.5  # Minimal pause to maximize load
        count: 50

  - name: "Large data operations"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "admin@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - post:
          url: "/api/import/bulk-csv"
          headers:
            Authorization: "Bearer {{ token }}"
          formData:
            file: "test-data/massive-dataset.csv"
            options: '{"validateData": true, "createCategories": true}'
```

## Resource Exhaustion Testing

### Memory Stress Testing
```javascript
// tests/performance/memory-stress.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 300
      arrivalRate: 50
      name: "Memory stress test"

scenarios:
  - name: "Memory-intensive operations"
    flow:
      - post:
          url: "/api/auth/login"
          capture:
            json: "$.token"
            as: "token"
      - loop:
          - post:
              url: "/api/transactions/bulk"
              headers:
                Authorization: "Bearer {{ token }}"
              json:
                transactions: [
                  // Generate 100 transactions per request
                  {{{ generateLargeTransactionBatch }}}
                ]
          - get:
              url: "/api/transactions?limit=5000&page={{ $loopCount }}"
              headers:
                Authorization: "Bearer {{ token }}"
          - get:
              url: "/api/reports/memory-intensive-report"
              headers:
                Authorization: "Bearer {{ token }}"
        count: 20
```

### Database Connection Stress
```javascript
// tests/performance/db-connection-stress.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 180
      arrivalCount: 500
      name: "Database connection stress"

scenarios:
  - name: "Connection pool exhaustion"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "dbstress{{ $randomInt }}@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - loop:
          - post:
              url: "/api/transactions"
              headers:
                Authorization: "Bearer {{ token }}"
              json:
                description: "DB stress transaction"
                amount: "100.00"
                date: "2023-12-01"
                category: "Database Test"
          - get:
              url: "/api/transactions?sort=-createdAt"
              headers:
                Authorization: "Bearer {{ token }}"
          - think: 0.1  # Very short pause
        count: 100
```

## Network Stress Testing

### High Latency Simulation
```javascript
// Simulate network issues during stress
const networkStress = {
  beforeRequest: function(requestParams, context, ee, next) {
    // Randomly introduce network delays
    const delay = Math.random() * 5000; // Up to 5 second delay
    setTimeout(() => {
      next();
    }, delay);
  }
};
```

### Connection Dropping
```javascript
// Simulate intermittent connectivity
const connectionStress = {
  beforeRequest: function(requestParams, context, ee, next) {
    // Randomly drop connections
    if (Math.random() < 0.1) { // 10% chance
      ee.emit('error', new Error('Connection dropped'));
      return next();
    }
    next();
  }
};
```

## Data Volume Stress Testing

### Large Dataset Processing
```javascript
// tests/performance/large-data-stress.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Large data import stress"

scenarios:
  - name: "Massive data import"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "datastress@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - post:
          url: "/api/import/large-csv"
          headers:
            Authorization: "Bearer {{ token }}"
          formData:
            file: "test-data/1million-transactions.csv"
            chunkSize: 10000
```

### Complex Query Stress
```javascript
// tests/performance/complex-query-stress.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 120
      arrivalRate: 30
      name: "Complex query stress"

scenarios:
  - name: "Complex analytical queries"
    flow:
      - post:
          url: "/api/auth/login"
          capture:
            json: "$.token"
            as: "token"
      - loop:
          - get:
              url: "/api/analytics/complex-report?dateRange=5years&groupBy=category,month&includeTrends=true&calculatePercentages=true"
              headers:
                Authorization: "Bearer {{ token }}"
          - get:
              url: "/api/search/advanced?query=complex+search+with+filters&filters[amount][gte]=100&filters[date][gte]=2020-01-01&sort=-amount&limit=1000"
              headers:
                Authorization: "Bearer {{ token }}"
          - think: 1
        count: 30
```

## Concurrent Operation Stress

### Race Condition Testing
```javascript
// tests/performance/race-condition-stress.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalCount: 100
      name: "Race condition stress"

scenarios:
  - name: "Concurrent modifications"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "racestress@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - loop:
          - post:
              url: "/api/transactions/{{ $randomInt }}"
              headers:
                Authorization: "Bearer {{ token }}"
              json:
                description: "Race condition test {{ $loopCount }}"
                amount: "{{ $randomInt }}"
                _version: 1  # Optimistic locking
          - think: 0.05  # Very short pause to increase concurrency
        count: 20
```

## System Resource Monitoring

### CPU Usage Monitoring
```javascript
const cpuMonitor = {
  start: function() {
    this.cpuSamples = [];
    this.monitorInterval = setInterval(() => {
      const cpuUsage = process.cpuUsage();
      this.cpuSamples.push({
        user: cpuUsage.user,
        system: cpuUsage.system,
        timestamp: Date.now()
      });

      // Alert if CPU usage is critically high
      const recentUsage = this.getRecentCpuUsage();
      if (recentUsage > 95) {
        console.error(`Critical CPU usage detected: ${recentUsage}%`);
      }
    }, 5000);
  },

  getRecentCpuUsage: function() {
    if (this.cpuSamples.length < 2) return 0;

    const recent = this.cpuSamples.slice(-2);
    const timeDiff = recent[1].timestamp - recent[0].timestamp;
    const cpuDiff = (recent[1].user - recent[0].user) + (recent[1].system - recent[0].system);
    const usagePercent = (cpuDiff / 1000 / timeDiff) * 100; // Convert to percentage

    return Math.min(usagePercent, 100);
  },

  end: function() {
    clearInterval(this.monitorInterval);
    console.log('CPU Usage Summary:', this.analyzeCpuUsage());
  },

  analyzeCpuUsage: function() {
    const avgUsage = this.cpuSamples.reduce((sum, sample) => sum + this.getRecentCpuUsage(), 0) / this.cpuSamples.length;
    const maxUsage = Math.max(...this.cpuSamples.map(() => this.getRecentCpuUsage()));

    return { average: avgUsage, maximum: maxUsage };
  }
};
```

### Memory Usage Tracking
```javascript
const memoryMonitor = {
  start: function() {
    this.memorySamples = [];
    this.monitorInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memorySamples.push({
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        timestamp: Date.now()
      });

      // Check for memory leaks
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn(`High memory usage detected: ${memUsage.heapUsed / 1024 / 1024}MB`);
      }
    }, 10000);
  },

  end: function() {
    clearInterval(this.monitorInterval);
    console.log('Memory Usage Summary:', this.analyzeMemoryUsage());
  },

  analyzeMemoryUsage: function() {
    const heapUsage = this.memorySamples.map(s => s.heapUsed);
    const avgHeapUsage = heapUsage.reduce((a, b) => a + b, 0) / heapUsage.length;
    const maxHeapUsage = Math.max(...heapUsage);
    const memoryGrowth = maxHeapUsage - Math.min(...heapUsage);

    return {
      averageHeapUsage: avgHeapUsage / 1024 / 1024,
      maxHeapUsage: maxHeapUsage / 1024 / 1024,
      memoryGrowth: memoryGrowth / 1024 / 1024
    };
  }
};
```

## Error and Failure Analysis

### Error Rate Monitoring
```javascript
const errorMonitor = {
  start: function() {
    this.errors = [];
    this.errorTypes = new Map();
  },

  recordError: function(error, context) {
    this.errors.push({
      error: error.message,
      statusCode: error.statusCode,
      url: context.url,
      timestamp: Date.now(),
      userId: context.userId
    });

    // Track error types
    const errorType = error.statusCode || 'unknown';
    this.errorTypes.set(errorType, (this.errorTypes.get(errorType) || 0) + 1);

    // Alert on high error rates
    if (this.errors.length > 100) {
      console.error('High error rate detected during stress test');
    }
  },

  end: function() {
    console.log('Error Analysis:', this.analyzeErrors());
  },

  analyzeErrors: function() {
    const errorRate = this.errors.length / this.totalRequests;
    const topErrors = Array.from(this.errorTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalErrors: this.errors.length,
      errorRate: errorRate,
      topErrorTypes: topErrors,
      errorTimeline: this.errors.map(e => ({ time: e.timestamp, type: e.statusCode }))
    };
  }
};
```

## Recovery Testing

### System Recovery After Stress
```javascript
// tests/performance/recovery-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 200
      name: "Extreme stress phase"
    - duration: 10
      arrivalRate: 0
      name: "System recovery pause"
    - duration: 60
      arrivalRate: 20
      name: "Recovery validation phase"

scenarios:
  - name: "Post-stress recovery validation"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "recovery@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - get:
          url: "/api/health"
          expect:
            - statusCode: 200
      - get:
          url: "/api/transactions"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
      - post:
          url: "/api/transactions"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            description: "Recovery test transaction"
            amount: "10.00"
            date: "2023-12-01"
            category: "Recovery Test"
          expect:
            - statusCode: 201
```

## Stress Test Reporting

### Comprehensive Stress Report
```javascript
const generateStressReport = (results, monitoring) => {
  const report = {
    testDuration: results.duration,
    totalRequests: results.requests,
    averageResponseTime: results.responseTime.average,
    errorRate: results.errors / results.requests,
    throughput: results.requests / results.duration,

    systemMetrics: {
      cpuUsage: monitoring.cpuMonitor.analyzeCpuUsage(),
      memoryUsage: monitoring.memoryMonitor.analyzeMemoryUsage(),
      errorAnalysis: monitoring.errorMonitor.analyzeErrors()
    },

    failurePoints: identifyFailurePoints(results, monitoring),

    recommendations: generateStressRecommendations(results, monitoring)
  };

  return report;
};

function identifyFailurePoints(results, monitoring) {
  const failures = [];

  if (results.responseTime.average > 5000) {
    failures.push('Response times degraded significantly under stress');
  }

  if (results.errors / results.requests > 0.5) {
    failures.push('High error rate indicates system instability');
  }

  if (monitoring.memoryMonitor.analyzeMemoryUsage().memoryGrowth > 200) {
    failures.push('Memory leak detected during stress testing');
  }

  return failures;
}
```

## Stress Test Best Practices

### Test Environment Preparation
- Use isolated stress testing environment
- Ensure sufficient infrastructure capacity
- Configure monitoring and logging
- Prepare test data and cleanup procedures

### Gradual Load Increase
- Start with normal load and gradually increase
- Monitor system behavior at each level
- Identify performance degradation points
- Allow recovery time between stress levels

### Failure Mode Analysis
- Document how system fails under stress
- Identify bottlenecks and resource limits
- Test recovery mechanisms
- Validate graceful degradation

### Continuous Stress Monitoring
- Monitor all system resources during tests
- Track error rates and response times
- Log system behavior for analysis
- Set up alerts for critical failures

This comprehensive stress testing approach ensures TSV Ledger can handle extreme conditions and provides insights into system limits and failure modes.