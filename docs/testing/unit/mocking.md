# Mocking Strategies

## Overview

Effective mocking is essential for unit testing to isolate code under test from external dependencies. This document covers comprehensive mocking strategies for various scenarios.

## Jest Mocking Fundamentals

### Basic Mocking
```javascript
// Mock a module
jest.mock('axios');
const axios = require('axios');

// Mock a function
const mockFunction = jest.fn();

// Mock an object method
const mockObject = {
  method: jest.fn()
};
```

### Mock Implementation
```javascript
// Return a specific value
mockFunction.mockReturnValue('mocked value');

// Return different values on subsequent calls
mockFunction.mockReturnValueOnce('first call')
           .mockReturnValueOnce('second call')
           .mockReturnValue('default');

// Implement custom logic
mockFunction.mockImplementation((param) => {
  return param * 2;
});
```

## Module Mocking

### ES6 Module Mocking
```javascript
// __mocks__/fs.js
module.exports = {
  readFile: jest.fn(),
  writeFile: jest.fn()
};

// Test file
jest.mock('fs');
const fs = require('fs');

it('should read file', () => {
  fs.readFile.mockResolvedValue('file content');
  // Test implementation
});
```

### Partial Module Mocking
```javascript
// Mock only specific exports
jest.mock('utilities', () => ({
  ...jest.requireActual('utilities'),
  calculateTax: jest.fn()
}));
```

## API Mocking

### HTTP Request Mocking
```javascript
// Mock axios instance
jest.mock('axios');
const axios = require('axios');

axios.get.mockResolvedValue({
  data: { users: [] },
  status: 200
});

// Test API call
const result = await apiService.getUsers();
expect(axios.get).toHaveBeenCalledWith('/api/users');
```

### GraphQL Mocking
```javascript
const mockGraphQLResponse = {
  data: {
    user: { id: 1, name: 'Test User' }
  }
};

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockGraphQLResponse)
  })
);
```

## Database Mocking

### Database Connection Mocking
```javascript
jest.mock('../database/connection', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  query: jest.fn()
}));

const db = require('../database/connection');
```

### ORM Mocking
```javascript
// Mock Sequelize model
jest.mock('../models/User', () => ({
  findAll: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn()
}));

const User = require('../models/User');
```

## File System Mocking

### fs Module Mocking
```javascript
const fs = require('fs');
jest.mock('fs');

fs.readFileSync.mockReturnValue('file content');
fs.existsSync.mockReturnValue(true);

it('should read configuration', () => {
  const config = loadConfig();
  expect(fs.readFileSync).toHaveBeenCalledWith('config.json');
});
```

### Path Module Mocking
```javascript
jest.mock('path');
const path = require('path');

path.join.mockImplementation((...args) => args.join('/'));
path.resolve.mockImplementation((...args) => '/absolute/' + args.join('/'));
```

## Timer Mocking

### setTimeout/setInterval
```javascript
jest.useFakeTimers();

it('should call callback after delay', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);

  // Fast-forward time
  jest.advanceTimersByTime(1000);

  expect(callback).toHaveBeenCalled();
});
```

### Date Mocking
```javascript
const mockDate = new Date('2023-01-01');
global.Date = jest.fn(() => mockDate);
global.Date.now = jest.fn(() => mockDate.getTime());
```

## Event Emitter Mocking

### Node.js Events
```javascript
const EventEmitter = require('events');
const emitter = new EventEmitter();

const mockListener = jest.fn();
emitter.on('event', mockListener);

emitter.emit('event', 'data');
expect(mockListener).toHaveBeenCalledWith('data');
```

### Custom Event Emitters
```javascript
class CustomEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    this.listeners[event] = callback;
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event](data);
    }
  }
}

// Mock the custom emitter
jest.mock('../CustomEmitter');
```

## React Component Mocking

### Component Mocking
```javascript
jest.mock('../components/Button', () => {
  return function MockButton({ children, onClick }) {
    return React.createElement('button', { onClick }, children);
  };
});
```

### Hook Mocking
```javascript
const mockUseState = jest.fn();
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: mockUseState
}));

mockUseState.mockReturnValue(['initial', jest.fn()]);
```

## Advanced Mocking Patterns

### Factory Functions
```javascript
const createMockService = (overrides = {}) => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  ...overrides
});

const mockApiService = createMockService({
  get: jest.fn().mockResolvedValue({ data: 'mocked' })
});
```

### Spy Pattern
```javascript
// Spy on existing object methods
const spy = jest.spyOn(object, 'method');

// Spy on prototype methods
const spy = jest.spyOn(Class.prototype, 'method');
```

### Mock Reset Patterns
```javascript
beforeEach(() => {
  jest.clearAllMocks(); // Reset call history
  jest.resetAllMocks(); // Reset implementations
  jest.restoreAllMocks(); // Restore original implementations
});
```

## Mock Verification

### Call Verification
```javascript
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFunction).toHaveBeenLastCalledWith('arg');
```

### Advanced Assertions
```javascript
// Check call order
expect(mockFunction.mock.invocationCallOrder[0]).toBe(1);

// Check return values
expect(mockFunction.mock.results[0].value).toBe('expected');

// Check thrown errors
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction.mock.results[0].type).toBe('throw');
```

## Best Practices

### Mock Organization
- **Centralized Mocks**: Keep mocks in `__mocks__` directory
- **Consistent Naming**: Use descriptive mock names
- **Mock Documentation**: Document mock behavior and usage

### Test Isolation
- **Mock Reset**: Reset mocks between tests
- **Clean State**: Ensure no mock leakage between tests
- **Minimal Mocking**: Mock only what's necessary

### Performance Considerations
- **Lazy Mocking**: Mock only when needed
- **Mock Reuse**: Reuse mocks across tests when appropriate
- **Cleanup**: Proper mock cleanup to avoid memory leaks

This comprehensive mocking strategy ensures reliable, fast, and maintainable unit tests across all TSV Ledger components.