# Performance Optimization

Strategies for efficient processing of Amazon data files with optimal resource utilization and response times.

## Streaming Processing

Handle large Amazon ZIP files without loading entire contents into memory:

```javascript
// src/amazon-integration/streamProcessor.js
const fs = require('fs');
const csv = require('csv-parser');
const { Transform } = require('stream');

class StreamingAmazonProcessor {
  constructor() {
    this.processedCount = 0;
    this.errorCount = 0;
    this.batchSize = 1000; // Process in batches
  }

  async processLargeFile(filePath, onBatchProcessed) {
    return new Promise((resolve, reject) => {
      const batches = [];
      let currentBatch = [];

      const processor = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          try {
            // Process each row
            const processedRow = this.processRow(chunk);
            currentBatch.push(processedRow);

            // Process batch when it reaches the limit
            if (currentBatch.length >= this.batchSize) {
              batches.push([...currentBatch]);
              currentBatch = [];

              // Call batch processor
              if (onBatchProcessed) {
                onBatchProcessed(currentBatch);
              }
            }

            callback();
          } catch (error) {
            this.errorCount++;
            callback(error);
          }
        },

        flush(callback) {
          // Process remaining batch
          if (currentBatch.length > 0) {
            batches.push(currentBatch);
            if (onBatchProcessed) {
              onBatchProcessed(currentBatch);
            }
          }
          callback();
        }
      });

      fs.createReadStream(filePath)
        .pipe(csv())
        .pipe(processor)
        .on('finish', () => {
          resolve({
            totalBatches: batches.length,
            totalProcessed: this.processedCount,
            totalErrors: this.errorCount
          });
        })
        .on('error', reject);
    });
  }

  processRow(row) {
    // Row processing logic
    this.processedCount++;
    return {
      orderId: row['Order ID'],
      amount: parseFloat(row['Total Charged'].replace('$', '')),
      date: row['Order Date'],
      processed: true
    };
  }
}
```

## Batch Processing

Process data in optimized chunks to prevent timeouts and manage memory usage:

```javascript
// src/amazon-integration/batchProcessor.js
class BatchAmazonProcessor {
  constructor(batchSize = 500) {
    this.batchSize = batchSize;
    this.batches = [];
    this.currentBatch = [];
  }

  addItem(item) {
    this.currentBatch.push(item);

    if (this.currentBatch.length >= this.batchSize) {
      this.batches.push(this.currentBatch);
      this.currentBatch = [];
    }
  }

  async processBatches(processFunction) {
    const results = [];

    for (const batch of this.batches) {
      try {
        const batchResult = await processFunction(batch);
        results.push(batchResult);
      } catch (error) {
        console.error('Batch processing failed:', error);
        // Continue with other batches
      }
    }

    // Process remaining items
    if (this.currentBatch.length > 0) {
      try {
        const finalResult = await processFunction(this.currentBatch);
        results.push(finalResult);
      } catch (error) {
        console.error('Final batch processing failed:', error);
      }
    }

    return results;
  }

  finalize() {
    if (this.currentBatch.length > 0) {
      this.batches.push(this.currentBatch);
      this.currentBatch = [];
    }

    return this.batches;
  }
}
```

## Caching Strategies

Cache frequently accessed data to improve performance:

```javascript
// src/amazon-integration/cache.js
const NodeCache = require('node-cache');

class AmazonDataCache {
  constructor(ttlSeconds = 3600) { // 1 hour default
    this.cache = new NodeCache({ stdTTL: ttlSeconds });
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (cached) {
      cached.accessCount++;
      return cached.data;
    }
    return null;
  }

  getStats() {
    return {
      keys: this.cache.keys(),
      stats: this.cache.getStats()
    };
  }

  invalidate(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));

    matchingKeys.forEach(key => this.cache.del(key));
    return matchingKeys.length;
  }
}
```