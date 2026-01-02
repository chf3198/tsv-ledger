# Modular Refactoring Patterns

## Overview

This document captures proven patterns for breaking down large, monolithic files into smaller, focused modules. Based on the successful refactoring of `src/routes/import.js` from 646 lines to 243 lines.

## Core Principles

### 1. Single Responsibility Principle

Each module should have one clear purpose:

- **Status Management**: Handle import progress and state
- **Data Persistence**: Manage history and storage
- **Parsing Logic**: Convert raw data to structured objects
- **Orchestration**: Coordinate between modules

### 2. Functional Programming Patterns

- **Pure Functions**: No side effects, predictable outputs
- **Immutability**: Return new objects instead of mutating
- **Composition**: Build complex behavior from simple functions
- **Error Boundaries**: Isolate error handling at appropriate levels

### 3. Interface Design

- **Consistent APIs**: Use Promises for async operations
- **Callback Patterns**: Progress and error callbacks for long operations
- **Type Definitions**: JSDoc for complex objects
- **Default Parameters**: Sensible defaults for optional config

## Implementation Pattern

### Step 1: Identify Concerns

```javascript
// BEFORE: Monolithic file with mixed concerns
function handleImport(req, res) {
  // Parsing logic
  // Status updates
  // Database operations
  // Error handling
  // History tracking
}
```

### Step 2: Extract Pure Functions

```javascript
// AFTER: Separated concerns
const parser = require("./parser");
const statusTracker = require("./status-tracker");
const historyManager = require("./history-manager");

async function handleImport(req, res) {
  statusTracker.startImport();
  try {
    const data = await parser.parse(req.body);
    statusTracker.setProgress(50);
    await saveData(data);
    historyManager.recordSuccess();
    statusTracker.completeImport();
  } catch (error) {
    statusTracker.recordError(error);
    historyManager.recordFailure();
  }
}
```

### Step 3: Create Module Interfaces

```javascript
// status-tracker.js
function startImport() {
  /* pure */
}
function setProgress(percent) {
  /* pure */
}
function getStatus() {
  /* returns immutable copy */
}
function completeImport() {
  /* pure */
}

module.exports = { startImport, setProgress, getStatus, completeImport };
```

## Benefits Achieved

### Maintainability

- **Easier Testing**: Isolated functions are simpler to unit test
- **Clearer Dependencies**: Explicit imports show relationships
- **Focused Changes**: Modifications affect fewer files

### Readability

- **Descriptive Names**: Functions and modules have clear purposes
- **JSDoc Documentation**: Comprehensive API documentation
- **Logical Grouping**: Related functionality is co-located

### Scalability

- **Independent Evolution**: Modules can be updated without affecting others
- **Reusable Components**: Pure functions can be used across contexts
- **Parallel Development**: Teams can work on different modules

## File Size Guidelines

### Target Sizes

- **Routes/Controllers**: < 300 lines (API orchestration)
- **Business Logic**: < 200 lines per module
- **Utility Functions**: < 100 lines per file
- **Test Files**: < 400 lines (can be split by feature)

### When to Split

- File exceeds 300 lines
- Multiple responsibilities identified
- Complex conditional logic
- Long functions (>50 lines)

## Naming Conventions

### Module Names

- `*-parser.js`: Data transformation
- `*-handler.js`: Orchestration and coordination
- `*-manager.js`: State and persistence
- `*-tracker.js`: Monitoring and status
- `*-validator.js`: Input validation
- `*-formatter.js`: Output formatting

### Function Names

- `parseX()`: Convert input to structured data
- `validateX()`: Check data integrity
- `formatX()`: Prepare data for output
- `handleX()`: Coordinate operations
- `getX()`: Retrieve data (immutable)
- `setX()`: Update state (pure)

## Error Handling Patterns

### Isolated Error Handling

```javascript
// Good: Errors handled at appropriate level
async function processData(input) {
  try {
    const parsed = parser.parse(input); // May throw
    const validated = validator.validate(parsed); // May throw
    return await saver.save(validated); // May throw
  } catch (error) {
    logger.error("Data processing failed", error);
    throw new Error(`Processing failed: ${error.message}`);
  }
}
```

### Callback-Based Error Reporting

```javascript
// For long-running operations
function processLargeDataset(data, callbacks) {
  const { onProgress, onError, onComplete } = callbacks;

  // ... processing logic ...
  if (error) {
    onError(error);
    return;
  }

  onProgress(percent);
  // ... continue ...

  onComplete(result);
}
```

## Testing Implications

### Unit Testing

- Pure functions are easily testable
- Mock dependencies at module boundaries
- Test error conditions explicitly

### Integration Testing

- Test module interactions
- Verify data flow between components
- Ensure error propagation works

## Migration Strategy

### Gradual Refactoring

1. **Identify**: Find large files and mixed concerns
2. **Extract**: Create new modules with pure functions
3. **Test**: Ensure new modules work independently
4. **Integrate**: Update original file to use new modules
5. **Verify**: Run full test suite
6. **Commit**: Use conventional commit format

### Backward Compatibility

- Maintain existing API contracts
- Update imports gradually
- Keep error messages consistent
- Preserve logging and monitoring

## Success Metrics

### Code Quality

- Files under size limits
- Functions under complexity thresholds
- Test coverage maintained or improved

### Developer Experience

- Easier to understand and modify
- Faster to locate relevant code
- Reduced merge conflicts

### Performance

- No degradation in functionality
- Maintainable execution patterns
- Efficient resource usage

## Lessons from Import Refactoring

### What Worked Well

- Pure functions simplified testing
- JSDoc improved code understanding
- Modular structure enabled parallel work
- Error isolation prevented cascading failures

### Challenges Encountered

- Maintaining backward compatibility
- Coordinating state between modules
- Ensuring consistent error handling
- Updating all dependent code

### Future Improvements

- Consider using classes for stateful modules
- Implement more comprehensive validation
- Add performance monitoring hooks
- Create shared utility modules
