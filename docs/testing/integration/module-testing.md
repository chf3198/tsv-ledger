# Module Integration Testing

## Overview

Module integration testing validates how different components work together, ensuring proper data flow and communication between modules. This testing focuses on component interactions rather than isolated unit behavior.

## Integration Test Structure

### Test Organization
```javascript
// tests/integration/user-management.test.js
const { createUser, updateUser, deleteUser } = require('../../src/services/userService');
const { sendWelcomeEmail } = require('../../src/services/emailService');
const { logActivity } = require('../../src/services/loggingService');

describe('User Management Integration', () => {
  beforeEach(async () => {
    // Setup test data and mocks
    await setupTestEnvironment();
  });

  afterEach(async () => {
    // Cleanup
    await cleanupTestEnvironment();
  });
});
```

### Service Integration
```javascript
describe('User Registration Flow', () => {
  it('should create user and send welcome email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    // Mock email service
    const emailMock = jest.spyOn(emailService, 'sendWelcomeEmail')
      .mockResolvedValue(true);

    // Execute registration
    const result = await userService.registerUser(userData);

    // Verify user creation
    expect(result.user).toHaveProperty('id');
    expect(result.user.email).toBe(userData.email);

    // Verify email was sent
    expect(emailMock).toHaveBeenCalledWith(
      userData.email,
      expect.stringContaining('Welcome')
    );
  });
});
```

## Component Communication Testing

### Event-Driven Integration
```javascript
describe('Event-Driven Components', () => {
  it('should handle user creation events', async () => {
    const eventHandler = jest.fn();

    // Subscribe to user creation events
    eventEmitter.on('user:created', eventHandler);

    // Create user (triggers event)
    await userService.createUser({
      name: 'Event Test',
      email: 'event@example.com'
    });

    // Verify event was emitted
    expect(eventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'user:created',
        userId: expect.any(String)
      })
    );
  });

  it('should cascade events through multiple services', async () => {
    const auditLog = jest.spyOn(auditService, 'logEvent');
    const notificationSent = jest.spyOn(notificationService, 'sendNotification');

    // Trigger complex workflow
    await orderService.createOrder({
      userId: 'user123',
      items: [{ productId: 'prod1', quantity: 2 }]
    });

    // Verify audit logging
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'order_created' })
    );

    // Verify notification sent
    expect(notificationSent).toHaveBeenCalledWith(
      'user123',
      'Order confirmation'
    );
  });
});
```

### API Integration Testing
```javascript
describe('API Service Integration', () => {
  it('should integrate with payment gateway', async () => {
    // Mock payment gateway
    const paymentMock = jest.spyOn(paymentGateway, 'processPayment')
      .mockResolvedValue({ transactionId: 'txn_123', status: 'success' });

    const orderData = {
      amount: 99.99,
      currency: 'USD',
      paymentMethod: 'card'
    };

    const result = await paymentService.processOrderPayment(orderData);

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('txn_123');
    expect(paymentMock).toHaveBeenCalledWith(orderData);
  });

  it('should handle payment gateway failures', async () => {
    // Mock payment failure
    const paymentMock = jest.spyOn(paymentGateway, 'processPayment')
      .mockRejectedValue(new Error('Payment declined'));

    await expect(paymentService.processOrderPayment({
      amount: 99.99,
      currency: 'USD'
    })).rejects.toThrow('Payment declined');
  });
});
```

## Data Flow Testing

### Pipeline Integration
```javascript
describe('Data Processing Pipeline', () => {
  it('should process data through multiple stages', async () => {
    const rawData = {
      source: 'upload',
      content: 'raw,csv,data\n1,2,3'
    };

    // Process through pipeline
    const result = await dataPipeline.process(rawData);

    // Verify each stage
    expect(result.parsed).toBeDefined();
    expect(result.validated).toBe(true);
    expect(result.transformed).toBeDefined();
    expect(result.stored).toBe(true);
  });

  it('should handle pipeline errors gracefully', async () => {
    const invalidData = { source: 'upload', content: 'invalid data' };

    await expect(dataPipeline.process(invalidData))
      .rejects.toThrow('Data validation failed');
  });
});
```

### Database and Cache Integration
```javascript
describe('Database and Cache Integration', () => {
  it('should use cache for frequently accessed data', async () => {
    const userId = 'user123';

    // First call should hit database
    const user1 = await userService.getUser(userId);
    expect(user1).toHaveProperty('name');

    // Second call should use cache
    const user2 = await userService.getUser(userId);
    expect(user2).toEqual(user1);

    // Verify database was called only once
    expect(databaseSpy).toHaveBeenCalledTimes(1);
  });

  it('should invalidate cache on data updates', async () => {
    const userId = 'user123';

    // Load user (caches data)
    await userService.getUser(userId);

    // Update user (should invalidate cache)
    await userService.updateUser(userId, { name: 'Updated Name' });

    // Next get should fetch fresh data
    const updatedUser = await userService.getUser(userId);
    expect(updatedUser.name).toBe('Updated Name');
  });
});
```

## External Service Integration

### Third-Party API Integration
```javascript
describe('Third-Party Service Integration', () => {
  it('should integrate with shipping service', async () => {
    const shippingMock = jest.spyOn(shippingService, 'calculateRate')
      .mockResolvedValue({ cost: 15.99, estimatedDays: 3 });

    const shipment = {
      origin: '12345',
      destination: '67890',
      weight: 5.5
    };

    const rate = await shippingService.calculateRate(shipment);

    expect(rate.cost).toBe(15.99);
    expect(rate.estimatedDays).toBe(3);
    expect(shippingMock).toHaveBeenCalledWith(shipment);
  });

  it('should handle external service timeouts', async () => {
    jest.spyOn(shippingService, 'calculateRate')
      .mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve({ cost: 10.00 }), 35000); // 35 seconds
      }));

    await expect(shippingService.calculateRate({}))
      .rejects.toThrow('Service timeout');
  });
});
```

### Message Queue Integration
```javascript
describe('Message Queue Integration', () => {
  it('should publish and consume messages', async () => {
    const message = { type: 'order_processed', orderId: '123' };
    const consumerMock = jest.fn();

    // Subscribe to queue
    messageQueue.subscribe('order_events', consumerMock);

    // Publish message
    await messageQueue.publish('order_events', message);

    // Allow async processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify message consumed
    expect(consumerMock).toHaveBeenCalledWith(message);
  });

  it('should handle message processing failures', async () => {
    const failingConsumer = jest.fn().mockRejectedValue(new Error('Processing failed'));

    messageQueue.subscribe('failing_queue', failingConsumer);

    // Publish message that will fail
    await messageQueue.publish('failing_queue', { data: 'test' });

    // Verify error handling (dead letter queue, retry logic, etc.)
    await expect(messageQueue.getFailedMessages()).resolves.toHaveLength(1);
  });
});
```

## Cross-Module Dependencies

### Circular Dependency Testing
```javascript
describe('Cross-Module Dependencies', () => {
  it('should handle circular dependencies correctly', async () => {
    // Module A depends on Module B
    // Module B depends on Module A
    // Test that initialization and method calls work correctly

    const moduleA = require('../../src/moduleA');
    const moduleB = require('../../src/moduleB');

    // Verify both modules can be initialized
    expect(moduleA).toBeDefined();
    expect(moduleB).toBeDefined();

    // Test interdependent functionality
    const result = await moduleA.callModuleBMethod();
    expect(result).toBeDefined();
  });
});
```

### Shared Resource Management
```javascript
describe('Shared Resource Management', () => {
  it('should manage shared database connections', async () => {
    const connection1 = await databaseService.getConnection();
    const connection2 = await databaseService.getConnection();

    // Verify connection pooling
    expect(connection1).not.toBe(connection2);

    // Test concurrent operations
    const [result1, result2] = await Promise.all([
      databaseService.query('SELECT 1', connection1),
      databaseService.query('SELECT 2', connection2)
    ]);

    expect(result1).toBe(1);
    expect(result2).toBe(2);
  });

  it('should handle resource cleanup', async () => {
    const connection = await databaseService.getConnection();

    // Use connection
    await databaseService.query('SELECT 1', connection);

    // Release connection
    await databaseService.releaseConnection(connection);

    // Verify connection is returned to pool
    expect(connectionPool.availableConnections).toBeGreaterThan(0);
  });
});
```

## Performance Integration Testing

### Load Testing Integration
```javascript
describe('Integration Load Testing', () => {
  it('should handle concurrent user operations', async () => {
    const userOperations = Array.from({ length: 50 }, (_, i) =>
      userService.createUser({
        name: `Load User ${i}`,
        email: `load${i}@example.com`
      })
    );

    const start = Date.now();
    const results = await Promise.all(userOperations);
    const duration = Date.now() - start;

    // Verify all operations succeeded
    expect(results).toHaveLength(50);
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Verify reasonable performance
    expect(duration).toBeLessThan(5000); // 5 seconds for 50 operations
  });

  it('should maintain data consistency under load', async () => {
    // Test that concurrent operations don't cause data corruption
    const counterOperations = Array.from({ length: 100 }, () =>
      counterService.increment('test_counter')
    );

    await Promise.all(counterOperations);

    const finalValue = await counterService.getValue('test_counter');
    expect(finalValue).toBe(100);
  });
});
```

## Error Propagation Testing

### Error Handling Across Modules
```javascript
describe('Error Propagation', () => {
  it('should propagate errors through service layers', async () => {
    // Mock low-level service failure
    jest.spyOn(dataAccessLayer, 'saveData')
      .mockRejectedValue(new Error('Database connection failed'));

    // Test that error bubbles up through business logic
    await expect(businessService.saveEntity({ data: 'test' }))
      .rejects.toThrow('Database connection failed');
  });

  it('should handle partial failures gracefully', async () => {
    // Mock one service succeeding, another failing
    jest.spyOn(emailService, 'sendEmail').mockRejectedValue(new Error('SMTP error'));
    jest.spyOn(databaseService, 'saveRecord').mockResolvedValue({ id: 123 });

    const result = await userService.createUserWithNotification({
      name: 'Test User',
      email: 'test@example.com'
    });

    // User should still be created even if email fails
    expect(result.user).toHaveProperty('id');
    expect(result.emailSent).toBe(false);
  });
});
```

## Configuration Integration Testing

### Environment-Specific Integration
```javascript
describe('Configuration Integration', () => {
  it('should use correct configuration for environment', async () => {
    // Test production configuration
    process.env.NODE_ENV = 'production';

    const config = await configService.loadConfig();
    expect(config.database.host).toBe('prod-db.example.com');

    // Test development configuration
    process.env.NODE_ENV = 'development';

    const devConfig = await configService.loadConfig();
    expect(devConfig.database.host).toBe('localhost');
  });

  it('should handle configuration changes at runtime', async () => {
    // Load initial config
    let config = await configService.getConfig();
    expect(config.cache.enabled).toBe(true);

    // Update configuration
    await configService.updateConfig({ cache: { enabled: false } });

    // Verify config change applied
    config = await configService.getConfig();
    expect(config.cache.enabled).toBe(false);
  });
});
```

This comprehensive module integration testing ensures all components work together reliably and maintain system integrity across complex workflows.