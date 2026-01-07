# Database Testing

## Overview

Database testing ensures data persistence, integrity, and proper handling of database operations. All database interactions must be tested with proper isolation and cleanup.

## Test Database Setup

### Database Isolation
```javascript
// tests/helpers/db.js
const { MongoClient } = require('mongodb');
const { setupTestDb, teardownTestDb } = require('./test-db-setup');

let testDb;

beforeAll(async () => {
  testDb = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(testDb);
});

beforeEach(async () => {
  // Clear all collections
  const collections = await testDb.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});
```

### Test Database Configuration
```javascript
// config/test.js
module.exports = {
  database: {
    url: process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test-db',
    name: 'tsv-ledger-test'
  }
};
```

## Model Testing

### CRUD Operations
```javascript
// tests/models/user.test.js
const User = require('../../src/models/User');

describe('User Model', () => {
  it('should create user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const user = await User.create(userData);

    expect(user).toHaveProperty('_id');
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
  });

  it('should find user by id', async () => {
    const createdUser = await User.create({
      name: 'Jane Doe',
      email: 'jane@example.com'
    });

    const foundUser = await User.findById(createdUser._id);

    expect(foundUser.name).toBe(createdUser.name);
  });

  it('should update user', async () => {
    const user = await User.create({
      name: 'Original Name',
      email: 'original@example.com'
    });

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { name: 'Updated Name' },
      { new: true }
    );

    expect(updatedUser.name).toBe('Updated Name');
  });

  it('should delete user', async () => {
    const user = await User.create({
      name: 'To Delete',
      email: 'delete@example.com'
    });

    await User.findByIdAndDelete(user._id);

    const deletedUser = await User.findById(user._id);
    expect(deletedUser).toBeNull();
  });
});
```

### Validation Testing
```javascript
describe('User Validation', () => {
  it('should require name', async () => {
    await expect(User.create({
      email: 'test@example.com'
    })).rejects.toThrow('Name is required');
  });

  it('should validate email format', async () => {
    await expect(User.create({
      name: 'Test User',
      email: 'invalid-email'
    })).rejects.toThrow('Invalid email format');
  });

  it('should enforce unique email', async () => {
    await User.create({
      name: 'User 1',
      email: 'duplicate@example.com'
    });

    await expect(User.create({
      name: 'User 2',
      email: 'duplicate@example.com'
    })).rejects.toThrow('Email already exists');
  });
});
```

## Query Testing

### Basic Queries
```javascript
describe('User Queries', () => {
  beforeEach(async () => {
    await User.create([
      { name: 'Alice', email: 'alice@example.com', active: true },
      { name: 'Bob', email: 'bob@example.com', active: false },
      { name: 'Charlie', email: 'charlie@example.com', active: true }
    ]);
  });

  it('should find all active users', async () => {
    const activeUsers = await User.find({ active: true });

    expect(activeUsers.length).toBe(2);
    expect(activeUsers.map(u => u.name)).toEqual(
      expect.arrayContaining(['Alice', 'Charlie'])
    );
  });

  it('should find user by email', async () => {
    const user = await User.findOne({ email: 'bob@example.com' });

    expect(user.name).toBe('Bob');
    expect(user.active).toBe(false);
  });
});
```

### Complex Queries
```javascript
describe('Complex Queries', () => {
  it('should support aggregation', async () => {
    const result = await User.aggregate([
      { $group: { _id: '$active', count: { $sum: 1 } } }
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        { _id: true, count: 2 },
        { _id: false, count: 1 }
      ])
    );
  });

  it('should support text search', async () => {
    const users = await User.find({
      $text: { $search: 'Alice' }
    });

    expect(users.length).toBe(1);
    expect(users[0].name).toBe('Alice');
  });
});
```

## Transaction Testing

### Transaction Operations
```javascript
describe('Database Transactions', () => {
  it('should commit transaction on success', async () => {
    const session = await User.startSession();

    try {
      await session.withTransaction(async () => {
        await User.create([{
          name: 'Transaction User 1',
          email: 'transaction1@example.com'
        }, {
          name: 'Transaction User 2',
          email: 'transaction2@example.com'
        }], { session });
      });

      const count = await User.countDocuments();
      expect(count).toBeGreaterThanOrEqual(2);
    } finally {
      await session.endSession();
    }
  });

  it('should rollback transaction on error', async () => {
    const initialCount = await User.countDocuments();
    const session = await User.startSession();

    try {
      await session.withTransaction(async () => {
        await User.create([{
          name: 'Should Rollback',
          email: 'rollback@example.com'
        }], { session });

        // Force an error
        throw new Error('Transaction failed');
      });
    } catch (error) {
      // Expected error
    } finally {
      await session.endSession();
    }

    const finalCount = await User.countDocuments();
    expect(finalCount).toBe(initialCount);
  });
});
```

## Index Testing

### Index Performance
```javascript
describe('Database Indexes', () => {
  it('should use email index', async () => {
    // Create many users
    const users = Array.from({ length: 1000 }, (_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`
    }));

    await User.insertMany(users);

    // Query should use index
    const start = Date.now();
    const user = await User.findOne({ email: 'user500@example.com' });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // Should be fast with index
    expect(user.name).toBe('User 500');
  });
});
```

## Migration Testing

### Schema Migration Testing
```javascript
describe('Schema Migrations', () => {
  it('should handle schema changes', async () => {
    // Test data from old schema
    await testDb.collection('users').insertOne({
      name: 'Legacy User',
      email: 'legacy@example.com'
      // Missing new required field
    });

    // Run migration
    await runMigration('add-status-field');

    // Verify migration
    const user = await User.findOne({ email: 'legacy@example.com' });
    expect(user).toHaveProperty('status', 'active'); // Default value added
  });
});
```

## Connection Testing

### Connection Pool Testing
```javascript
describe('Database Connections', () => {
  it('should handle connection failures gracefully', async () => {
    // Mock connection failure
    const originalConnect = MongoClient.connect;
    MongoClient.connect = jest.fn().mockRejectedValue(
      new Error('Connection failed')
    );

    await expect(User.find({})).rejects.toThrow('Connection failed');

    // Restore connection
    MongoClient.connect = originalConnect;
  });

  it('should reconnect after connection loss', async () => {
    // Simulate connection drop and recovery
    // Test reconnection logic
  });
});
```

## Performance Testing

### Query Performance
```javascript
describe('Query Performance', () => {
  it('should execute queries within time limits', async () => {
    const start = Date.now();

    await User.find({}).limit(100);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500); // 500ms limit
  });

  it('should handle concurrent operations', async () => {
    const promises = Array.from({ length: 10 }, () =>
      User.create({
        name: `Concurrent User ${Math.random()}`,
        email: `concurrent${Math.random()}@example.com`
      })
    );

    await Promise.all(promises);

    const count = await User.countDocuments();
    expect(count).toBe(10);
  });
});
```

## Data Integrity Testing

### Constraint Testing
```javascript
describe('Data Integrity', () => {
  it('should maintain referential integrity', async () => {
    const user = await User.create({
      name: 'Parent User',
      email: 'parent@example.com'
    });

    // Create related records
    await Post.create({
      title: 'Test Post',
      author: user._id
    });

    // Attempt to delete user with references
    await expect(User.findByIdAndDelete(user._id))
      .rejects.toThrow('Cannot delete user with existing posts');
  });

  it('should validate data consistency', async () => {
    // Test cascade deletes, triggers, etc.
  });
});
```

## Backup and Recovery Testing

### Backup Testing
```javascript
describe('Backup Operations', () => {
  it('should create consistent backups', async () => {
    // Insert test data
    await User.create({
      name: 'Backup Test',
      email: 'backup@example.com'
    });

    // Trigger backup
    await createBackup();

    // Verify backup contains data
    const backupData = await readBackup();
    expect(backupData.users.length).toBeGreaterThan(0);
  });

  it('should restore from backup', async () => {
    // Clear database
    await User.deleteMany({});

    // Restore from backup
    await restoreFromBackup();

    // Verify data restored
    const count = await User.countDocuments();
    expect(count).toBeGreaterThan(0);
  });
});
```

This comprehensive database testing approach ensures data reliability, performance, and integrity across all TSV Ledger operations.