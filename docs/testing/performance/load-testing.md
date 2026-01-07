# Load Testing

## Overview

Load testing validates system performance under various load conditions, ensuring TSV Ledger can handle expected user traffic and data volumes. Performance must remain acceptable as load increases.

## Artillery Configuration

### Basic Load Test Setup
```javascript
// tests/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up phase"
    - duration: 120
      arrivalRate: 20
      name: "Load phase"
    - duration: 60
      arrivalRate: 5
      name: "Cool down phase"
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "User registration and login"
    weight: 20
    flow:
      - post:
          url: "/api/auth/register"
          json:
            name: "Load Test User {{ $randomInt }}"
            email: "loadtest{{ $randomInt }}@example.com"
            password: "password123"
      - post:
          url: "/api/auth/login"
          json:
            email: "loadtest{{ $randomInt }}@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - get:
          url: "/api/transactions"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Transaction operations"
    weight: 60
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "existinguser@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - post:
          url: "/api/transactions"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            description: "Load test transaction {{ $randomInt }}"
            amount: "{{ $randomInt }}"
            date: "2023-12-01"
            category: "Test"
      - get:
          url: "/api/transactions"
          headers:
            Authorization: "Bearer {{ token }}"
      - get:
          url: "/api/reports/summary"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Data import operations"
    weight: 20
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
          url: "/api/import/csv"
          headers:
            Authorization: "Bearer {{ token }}"
          formData:
            file: "test-data/large-transaction-set.csv"
```

## Load Test Scenarios

### User Registration Load
```javascript
// tests/performance/user-registration-load.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 30
      arrivalRate: 10
      name: "Gradual ramp up"
    - duration: 60
      arrivalRate: 50
      name: "High registration load"
    - duration: 30
      arrivalRate: 10
      name: "Cool down"

scenarios:
  - name: "Bulk user registration"
    flow:
      - post:
          url: "/api/auth/register"
          json:
            name: "Load User {{ $randomInt }}"
            email: "loaduser{{ $randomInt }}@example.com"
            password: "SecurePass{{ $randomInt }}!"
          expect:
            - statusCode: 201
```

### Transaction Processing Load
```javascript
// tests/performance/transaction-processing-load.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 20
      name: "Transaction load test"

scenarios:
  - name: "High-frequency transactions"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "testuser@example.com"
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
                description: "Load transaction {{ $loopCount }}"
                amount: "{{ $randomInt }}"
                date: "2023-{{ $randomInt % 12 + 1 }}-{{ $randomInt % 28 + 1 }}"
                category: "Load Test"
          - think: 1  # 1 second pause between transactions
        count: 10
```

### Concurrent User Sessions
```javascript
// tests/performance/concurrent-sessions.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 300
      arrivalCount: 100
      name: "100 concurrent users"

scenarios:
  - name: "Sustained user activity"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "user{{ $randomInt }}@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "token"
      - loop:
          - get:
              url: "/api/transactions"
              headers:
                Authorization: "Bearer {{ token }}"
          - think: 5
          - post:
              url: "/api/transactions"
              headers:
                Authorization: "Bearer {{ token }}"
              json:
                description: "Concurrent transaction {{ $loopCount }}"
                amount: "{{ $randomInt }}"
                date: "2023-12-01"
                category: "Concurrent Test"
          - think: 10
        count: 20
```

## Performance Metrics

### Response Time Monitoring
```javascript
// Custom metrics tracking
const artillery = require('artillery');

artillery.addReporter('custom-metrics', {
  start: function() {
    this.metrics = {
      responseTimes: [],
      errorCount: 0,
      successCount: 0
    };
  },

  request: function(req, res, userContext, events, done) {
    const responseTime = res.timings.phases.total;
    this.metrics.responseTimes.push(responseTime);

    if (res.statusCode >= 400) {
      this.metrics.errorCount++;
    } else {
      this.metrics.successCount++;
    }

    done();
  },

  end: function(done) {
    const avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
    const p95ResponseTime = this.metrics.responseTimes.sort((a, b) => a - b)[Math.floor(this.metrics.responseTimes.length * 0.95)];

    console.log(`Average Response Time: ${avgResponseTime}ms`);
    console.log(`95th Percentile Response Time: ${p95ResponseTime}ms`);
    console.log(`Error Rate: ${(this.metrics.errorCount / (this.metrics.errorCount + this.metrics.successCount)) * 100}%`);

    done();
  }
});
```

### Throughput Measurement
```javascript
// Throughput tracking
const trackThroughput = {
  start: function() {
    this.requestsPerSecond = 0;
    this.interval = setInterval(() => {
      console.log(`Requests/second: ${this.requestsPerSecond}`);
      this.requestsPerSecond = 0;
    }, 1000);
  },

  request: function() {
    this.requestsPerSecond++;
  },

  end: function() {
    clearInterval(this.interval);
  }
};
```

## Load Test Execution

### Running Load Tests
```bash
# Run basic load test
npx artillery run tests/performance/load-test.yml

# Run with custom reporters
npx artillery run tests/performance/load-test.yml --output report.json

# Run multiple scenarios
npx artillery run tests/performance/user-registration-load.yml
npx artillery run tests/performance/transaction-processing-load.yml

# Run with environment variables
TARGET_HOST=http://staging.example.com npx artillery run tests/performance/load-test.yml
```

### Distributed Load Testing
```javascript
// For high-scale testing, use Artillery Pro or distributed setup
const artillery = require('artillery');

artillery.run({
  config: 'tests/performance/distributed-config.yml',
  script: 'tests/performance/load-test.yml',
  options: {
    workers: 4,  // Number of worker processes
    maxVus: 1000 // Maximum virtual users
  }
});
```

## Performance Thresholds

### Response Time Requirements
```javascript
const performanceThresholds = {
  averageResponseTime: 500,    // ms
  p95ResponseTime: 1000,       // ms
  p99ResponseTime: 2000,       // ms
  errorRate: 0.01,             // 1%
  throughput: 100              // requests/second
};

function validatePerformance(results) {
  if (results.averageResponseTime > performanceThresholds.averageResponseTime) {
    throw new Error(`Average response time ${results.averageResponseTime}ms exceeds threshold`);
  }

  if (results.errorRate > performanceThresholds.errorRate) {
    throw new Error(`Error rate ${results.errorRate * 100}% exceeds threshold`);
  }

  console.log('Performance thresholds met ✓');
}
```

### Scalability Testing
```javascript
// Test system scaling capabilities
const scalabilityTest = {
  phases: [
    { duration: 60, arrivalRate: 10, name: "Baseline load" },
    { duration: 60, arrivalRate: 50, name: "2x load" },
    { duration: 60, arrivalRate: 100, name: "4x load" },
    { duration: 60, arrivalRate: 200, name: "8x load" }
  ]
};

// Monitor resource usage during scaling
function monitorResources() {
  // Track CPU, memory, database connections
  // Verify auto-scaling if applicable
}
```

## Database Load Testing

### Database Connection Pool Testing
```javascript
// tests/performance/database-load.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 120
      arrivalRate: 30
      name: "Database load test"

scenarios:
  - name: "Database-intensive operations"
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
                  {{{ generateBulkTransactions }}}
                ]
          - get:
              url: "/api/reports/complex-analysis"
              headers:
                Authorization: "Bearer {{ token }}"
          - think: 2
        count: 15
```

### Query Performance Under Load
```javascript
// Monitor slow queries during load
const queryMonitoring = {
  slowQueryThreshold: 1000, // ms

  trackQuery: function(query, executionTime) {
    if (executionTime > this.slowQueryThreshold) {
      console.warn(`Slow query detected: ${query} took ${executionTime}ms`);
    }
  }
};
```

## Memory and Resource Testing

### Memory Leak Detection
```javascript
// Monitor memory usage during extended load tests
const memoryMonitor = {
  start: function() {
    this.initialMemory = process.memoryUsage();
    this.checkInterval = setInterval(() => {
      const currentMemory = process.memoryUsage();
      const memoryIncrease = currentMemory.heapUsed - this.initialMemory.heapUsed;

      if (memoryIncrease > 50 * 1024 * 1024) { // 50MB increase
        console.warn(`Potential memory leak detected. Memory increase: ${memoryIncrease} bytes`);
      }
    }, 30000); // Check every 30 seconds
  },

  end: function() {
    clearInterval(this.checkInterval);
  }
};
```

### Connection Pool Monitoring
```javascript
// Monitor database connection pool usage
const connectionMonitor = {
  trackConnections: function() {
    // Monitor active connections
    // Alert if pool is exhausted
    // Track connection wait times
  }
};
```

## Load Test Reporting

### HTML Report Generation
```javascript
// Generate detailed HTML reports
const generateReport = async (results) => {
  const report = {
    summary: {
      totalRequests: results.requests,
      averageResponseTime: results.responseTime.average,
      errorRate: results.errors / results.requests,
      throughput: results.requests / results.duration
    },
    charts: {
      responseTimeDistribution: generateResponseTimeChart(results),
      throughputOverTime: generateThroughputChart(results),
      errorRateOverTime: generateErrorChart(results)
    },
    recommendations: generateRecommendations(results)
  };

  // Generate HTML report
  return generateHTMLReport(report);
};
```

### CI/CD Integration
```yaml
# .github/workflows/load-test.yml
name: Load Testing
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run start:test-server
      - run: npx artillery run tests/performance/load-test.yml --output results.json
      - run: node scripts/validate-performance.js results.json
      - uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

## Load Test Best Practices

### Test Environment Setup
- Use production-like environment
- Ensure sufficient infrastructure capacity
- Monitor system resources during tests
- Use realistic test data volumes

### Test Data Management
- Generate sufficient test data
- Use data that represents real usage patterns
- Clean up test data between runs
- Avoid test data interference

### Result Analysis
- Compare results against baselines
- Identify performance bottlenecks
- Monitor trends over time
- Set appropriate performance budgets

### Continuous Performance Monitoring
- Run load tests regularly
- Monitor performance in production
- Set up alerts for performance degradation
- Include performance checks in CI/CD pipeline

This comprehensive load testing approach ensures TSV Ledger can handle production workloads while maintaining acceptable performance levels.