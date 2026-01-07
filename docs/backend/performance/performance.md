# Performance Optimization

## Database Query Optimization

Optimize database operations for better performance and scalability.

### Indexing Strategy
```javascript
// src/database/indexes.js
const indexes = [
  // Single field indexes
  { field: 'date', order: -1 }, // Most recent first
  { field: 'category' },
  { field: 'amount' },

  // Compound indexes
  { fields: ['category', 'date'], order: [-1, -1] },
  { fields: ['userId', 'date'], order: [1, -1] },

  // Text indexes for search
  { field: 'description', type: 'text' }
];

class DatabaseOptimizer {
  async createIndexes() {
    for (const index of indexes) {
      try {
        if (index.type === 'text') {
          await this.collection.createIndex({ [index.field]: 'text' });
        } else if (index.fields) {
          const indexSpec = {};
          index.fields.forEach(field => {
            indexSpec[field] = index.order[index.fields.indexOf(field)] || 1;
          });
          await this.collection.createIndex(indexSpec);
        } else {
          await this.collection.createIndex({ [index.field]: index.order || 1 });
        }
      } catch (error) {
        console.warn(`Failed to create index for ${index.field}:`, error);
      }
    }
  }

  async analyzeQuery(query) {
    const explanation = await this.collection.find(query).explain('executionStats');
    return {
      executionTime: explanation.executionStats.executionTimeMillis,
      documentsExamined: explanation.executionStats.totalDocsExamined,
      documentsReturned: explanation.executionStats.totalDocsReturned,
      indexUsed: explanation.executionStats.winningPlan?.inputStage?.indexName
    };
  }
}
```

### Caching Implementation
```javascript
// src/cache/cache.js
const NodeCache = require('node-cache');

class Cache {
  constructor(ttlSeconds = 300) { // 5 minutes default
    this.cache = new NodeCache({ stdTTL: ttlSeconds });
  }

  async get(key, fetchFunction) {
    let value = this.cache.get(key);

    if (value === undefined) {
      value = await fetchFunction();
      this.cache.set(key, value);
    }

    return value;
  }

  set(key, value, ttl) {
    return this.cache.set(key, value, ttl);
  }

  del(key) {
    return this.cache.del(key);
  }

  flushAll() {
    return this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }
}

// Usage in service
class ExpenseService {
  constructor() {
    this.cache = new Cache();
  }

  async getExpenses(filters = {}) {
    const cacheKey = `expenses_${JSON.stringify(filters)}`;

    return this.cache.get(cacheKey, async () => {
      return this.db.getExpenses(filters);
    });
  }

  async createExpense(expenseData) {
    // Invalidate cache when data changes
    this.cache.flushAll();
    return this.db.addExpense(expenseData);
  }
}
```

### Batch Operations
```javascript
// src/services/batchService.js
class BatchService {
  constructor() {
    this.batchSize = 100;
    this.batches = [];
  }

  addOperation(operation) {
    if (this.batches.length === 0 ||
        this.batches[this.batches.length - 1].length >= this.batchSize) {
      this.batches.push([]);
    }

    this.batches[this.batches.length - 1].push(operation);
  }

  async executeAll() {
    const results = [];

    for (const batch of this.batches) {
      try {
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
      } catch (error) {
        console.error('Batch operation failed:', error);
        // Continue with other batches or implement retry logic
      }
    }

    return results;
  }

  clear() {
    this.batches = [];
  }
}
```

## Memory Management

### Stream Processing
```javascript
// src/utils/streamProcessor.js
const fs = require('fs');
const csv = require('csv-parser');

class StreamProcessor {
  constructor(filePath) {
    this.filePath = filePath;
    this.processedCount = 0;
    this.errors = [];
  }

  async processLargeFile(processFunction) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = fs.createReadStream(this.filePath)
        .pipe(csv())
        .on('data', async (row) => {
          try {
            // Pause stream while processing
            stream.pause();

            const result = await processFunction(row);
            if (result) results.push(result);

            this.processedCount++;

            // Resume stream
            stream.resume();
          } catch (error) {
            this.errors.push({ row, error: error.message });
            stream.resume();
          }
        })
        .on('end', () => {
          resolve({
            results,
            processedCount: this.processedCount,
            errors: this.errors
          });
        })
        .on('error', reject);
    });
  }

  async processWithBackpressure(processFunction, concurrency = 10) {
    const semaphore = new Semaphore(concurrency);
    const results = [];

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(this.filePath)
        .pipe(csv())
        .on('data', async (row) => {
          await semaphore.acquire();

          try {
            const result = await processFunction(row);
            if (result) results.push(result);
            this.processedCount++;
          } catch (error) {
            this.errors.push({ row, error: error.message });
          } finally {
            semaphore.release();
          }
        })
        .on('end', () => resolve({
          results,
          processedCount: this.processedCount,
          errors: this.errors
        }))
        .on('error', reject);
    });
  }
}

// Semaphore for concurrency control
class Semaphore {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.waiting = [];
  }

  async acquire() {
    if (this.current < this.max) {
      this.current++;
      return;
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve);
