# API Testing

## Overview

API testing validates REST endpoints, request/response handling, and integration with external services. All API endpoints must be thoroughly tested with comprehensive coverage.

## Testing Frameworks

### Supertest Integration
```javascript
const request = require('supertest');
const app = require('../app');

describe('API Endpoints', () => {
  it('should return user data', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('id', 1);
  });
});
```

### Test Setup
```javascript
// tests/setup.js
const { setupTestDb, teardownTestDb } = require('./helpers/db');

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});
```

## HTTP Method Testing

### GET Requests
```javascript
describe('GET /api/users', () => {
  it('should return all users', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should return user by id', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .expect(200);

    expect(response.body.id).toBe(1);
  });

  it('should return 404 for non-existent user', async () => {
    await request(app)
      .get('/api/users/999')
      .expect(404);
  });
});
```

### POST Requests
```javascript
describe('POST /api/users', () => {
  it('should create new user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(userData.name);
  });

  it('should validate required fields', async () => {
    await request(app)
      .post('/api/users')
      .send({})
      .expect(400);
  });
});
```

### PUT/PATCH Requests
```javascript
describe('PUT /api/users/:id', () => {
  it('should update user', async () => {
    const updateData = { name: 'Updated Name' };

    const response = await request(app)
      .put('/api/users/1')
      .send(updateData)
      .expect(200);

    expect(response.body.name).toBe(updateData.name);
  });

  it('should return 404 for non-existent user', async () => {
    await request(app)
      .put('/api/users/999')
      .send({ name: 'Test' })
      .expect(404);
  });
});
```

### DELETE Requests
```javascript
describe('DELETE /api/users/:id', () => {
  it('should delete user', async () => {
    await request(app)
      .delete('/api/users/1')
      .expect(204);
  });

  it('should return 404 for non-existent user', async () => {
    await request(app)
      .delete('/api/users/999')
      .expect(404);
  });
});
```

## Authentication Testing

### Token-Based Auth
```javascript
describe('Protected Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password' });

    authToken = loginResponse.body.token;
  });

  it('should require authentication', async () => {
    await request(app)
      .get('/api/protected')
      .expect(401);
  });

  it('should accept valid token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
```

### Session-Based Auth
```javascript
describe('Session Authentication', () => {
  const agent = request.agent(app);

  it('should handle login session', async () => {
    await agent
      .post('/login')
      .send({ username: 'user', password: 'pass' })
      .expect(302); // Redirect after login

    // Subsequent requests use same session
    const response = await agent
      .get('/dashboard')
      .expect(200);
  });
});
```

## Request Validation Testing

### Input Validation
```javascript
describe('Input Validation', () => {
  it('should validate email format', async () => {
    await request(app)
      .post('/api/users')
      .send({ email: 'invalid-email' })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toContain('Invalid email format');
      });
  });

  it('should validate required fields', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: '' })
      .expect(400);
  });

  it('should validate data types', async () => {
    await request(app)
      .post('/api/users')
      .send({ age: 'not-a-number' })
      .expect(400);
  });
});
```

### File Upload Testing
```javascript
describe('File Upload', () => {
  it('should accept file uploads', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', 'tests/fixtures/test-file.txt')
      .expect(200);

    expect(response.body).toHaveProperty('fileId');
  });

  it('should validate file types', async () => {
    await request(app)
      .post('/api/upload')
      .attach('file', 'tests/fixtures/invalid.exe')
      .expect(400);
  });
});
```

## Response Testing

### Response Format
```javascript
describe('Response Format', () => {
  it('should return JSON', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect('Content-Type', /json/);

    expect(response.body).toBeInstanceOf(Array);
  });

  it('should include required fields', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('email');
  });
});
```

### Pagination Testing
```javascript
describe('Pagination', () => {
  it('should support pagination', async () => {
    const response = await request(app)
      .get('/api/users?page=1&limit=10')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should return correct page size', async () => {
    const response = await request(app)
      .get('/api/users?limit=5')
      .expect(200);

    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });
});
```

## Error Handling Testing

### Error Responses
```javascript
describe('Error Handling', () => {
  it('should return proper error for invalid id', async () => {
    const response = await request(app)
      .get('/api/users/invalid-id')
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/invalid/i);
  });

  it('should handle server errors gracefully', async () => {
    // Mock a server error scenario
    const response = await request(app)
      .get('/api/failing-endpoint')
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });
});
```

### Rate Limiting
```javascript
describe('Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    // Make multiple requests quickly
    for (let i = 0; i < 10; i++) {
      await request(app).get('/api/users');
    }

    // Next request should be rate limited
    await request(app)
      .get('/api/users')
      .expect(429);
  });
});
```

## Middleware Testing

### Custom Middleware
```javascript
describe('Custom Middleware', () => {
  it('should apply logging middleware', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await request(app)
      .get('/api/users')
      .expect(200);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('GET /api/users')
    );

    consoleSpy.mockRestore();
  });

  it('should handle CORS headers', async () => {
    const response = await request(app)
      .options('/api/users')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});
```

## Performance Testing

### Response Time Testing
```javascript
describe('Performance', () => {
  it('should respond within acceptable time', async () => {
    const start = Date.now();

    await request(app)
      .get('/api/users')
      .expect(200);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // 1 second
  });
});
```

## Database Integration Testing

### Transaction Testing
```javascript
describe('Database Transactions', () => {
  it('should rollback on error', async () => {
    const initialCount = await getUserCount();

    // Attempt operation that should fail
    await request(app)
      .post('/api/users')
      .send({ invalid: 'data' })
      .expect(400);

    // Verify no data was persisted
    const finalCount = await getUserCount();
    expect(finalCount).toBe(initialCount);
  });
});
```

This comprehensive API testing approach ensures all endpoints are thoroughly validated and maintain high reliability standards.