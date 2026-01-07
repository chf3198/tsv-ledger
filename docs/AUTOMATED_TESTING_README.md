# Automated Testing System for TSV Ledger

This document describes the comprehensive automated testing system implemented for TSV Ledger, which provides continuous testing during development without manual intervention.

## Overview

The automated testing system consists of multiple components that work together to:

1. **Automatically start/stop the server** during testing
2. **Run tests continuously** when code changes
3. **Provide comprehensive test coverage** across all layers
4. **Generate detailed reports** and feedback

## Components

### 1. Global Setup/Teardown (`tests/shared/global-setup.js`, `tests/shared/global-teardown.js`)

These Jest hooks automatically manage the server lifecycle:

- **Global Setup**: Starts the server before any tests run
- **Global Teardown**: Stops the server after all tests complete
- **Automatic Detection**: Waits for server readiness before proceeding

### 2. Automated Test Runner (`auto-test.js`)

A Node.js script that provides command-line testing with server management:

```bash
# Run all tests automatically
npm run test:auto

# Run specific test types
npm run test:auto:unit
npm run test:auto:integration
npm run test:auto:e2e
```

### 3. Continuous Development Testing (`dev-test.js`)

Provides real-time testing during development:

```bash
# Start continuous testing mode
npm run dev:test
```

**Features:**
- Watches for file changes in source code and tests
- Automatically runs relevant tests when files change
- Provides immediate feedback on test results
- Runs different test types based on changed files

### 4. Comprehensive Test Workflow (`test-workflow.sh`)

A bash script for CI/CD and comprehensive testing:

```bash
# Run complete test workflow
npm run test:workflow

# Run specific test types
./test-workflow.sh unit
./test-workflow.sh integration
./test-workflow.sh e2e
./test-workflow.sh all
```

## Test Types

### Unit Tests
- **Location**: `tests/unit/`
- **Coverage**: Backend logic, utilities, data processing
- **Command**: `npm run test:auto:unit`

### Integration Tests
- **Location**: `tests/integration/`
- **Coverage**: API endpoints, database operations, component interactions
- **Command**: `npm run test:auto:integration`

### End-to-End Tests
- **Location**: `tests/e2e/`
- **Coverage**: Full user workflows, browser interactions
- **Command**: `npm run test:auto:e2e`

### Additional Test Suites
- **API Tests**: Postman collections via Newman
- **Performance Tests**: Load testing via Artillery
- **Accessibility Tests**: WCAG compliance via Playwright
- **Visual Regression Tests**: UI consistency via Chromatic

## Usage Examples

### Development Workflow

```bash
# Start development with continuous testing
npm run dev:test

# The system will:
# 1. Start the server automatically
# 2. Run initial test suite
# 3. Watch for file changes
# 4. Run relevant tests when files change
# 5. Provide real-time feedback
```

### Automated Testing

```bash
# Run all tests with server management
npm run test:auto

# Run specific test suites
npm run test:auto:unit        # Only unit tests
npm run test:auto:integration # Only integration tests
npm run test:auto:e2e         # Only E2E tests
```

### CI/CD Workflow

```bash
# Complete test workflow for CI/CD
npm run test:workflow

# This runs:
# - Unit tests with coverage
# - Integration tests with coverage
# - E2E tests (if Playwright available)
# - API tests (if Newman available)
# - Performance tests (if Artillery available)
# - Generates comprehensive reports
```

## Configuration

### Jest Configuration (`jest.config.js`)

The Jest configuration includes:
- Global setup/teardown for server management
- Coverage thresholds (85% target)
- Multiple reporters (console, JUnit, HTML)
- Module mapping for clean imports

### Environment Variables

- `NODE_ENV=test`: Enables test mode
- `PORT=3000`: Server port (default)
- `CI=true`: Enables CI-specific behavior

## File Watching Rules

The continuous testing system watches these directories:

- `src/`: Backend source code
- `public/js/`: Frontend JavaScript
- `public/components/`: HTML components
- `tests/unit/`: Unit tests
- `tests/integration/`: Integration tests
- `tests/e2e/`: E2E tests
- `server.js`: Main server file

When files change, the system automatically runs the appropriate tests.

## Reports and Output

### Coverage Reports
- **Location**: `coverage/`
- **Formats**: HTML, JSON, LCOV, text
- **Combined**: `coverage/combined/`

### Test Reports
- **Location**: `tests/reports/`
- **Formats**: JUnit XML, JSON summaries
- **Summary**: `tests/reports/summary.txt`

### Logs
- **Server Logs**: `server.log`
- **Test Output**: Console with colored output
- **Error Details**: Comprehensive error reporting

## Troubleshooting

### Server Won't Start
- Check port 3000 availability
- Review `server.log` for errors
- Ensure dependencies are installed

### Tests Timeout
- Increase timeout in Jest config
- Check server responsiveness
- Review test logic for infinite loops

### File Watching Issues
- Ensure file permissions allow watching
- Check available disk space
- Restart the development server

### Coverage Issues
- Run `npm run test:coverage` for full coverage
- Check coverage thresholds in `jest.config.js`
- Review excluded files in coverage configuration

## Integration with Development

### VS Code Integration
Add these to your VS Code workspace settings:

```json
{
  "npm.scripts.showStartNotification": true,
  "jest.autoRun": {
    "watch": true,
    "onSave": "test-src-file"
  }
}
```

### Git Hooks
Consider adding pre-commit hooks:

```bash
#!/bin/sh
npm run test:auto:unit
```

### CI/CD Integration
Example GitHub Actions workflow:

```yaml
- name: Run Tests
  run: npm run test:workflow
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/combined/lcov.info
```

## Benefits

1. **Zero Manual Testing**: Tests run automatically during development
2. **Immediate Feedback**: Know instantly when code breaks
3. **Comprehensive Coverage**: All test types run consistently
4. **Server Management**: No need to manually start/stop server
5. **CI/CD Ready**: Works in automated pipelines
6. **Detailed Reporting**: Rich feedback and coverage data

## Architecture

The system uses a layered approach:

```
┌─────────────────┐
│   User Commands │
│  (npm scripts)  │
└─────────┬───────┘
          │
┌─────────▼────────┐
│ Test Orchestrators │
│ auto-test.js      │
│ dev-test.js       │
│ test-workflow.sh  │
└─────────┬────────┘
          │
┌─────────▼────────┐
│  Test Frameworks  │
│ Jest + Playwright │
└─────────┬────────┘
          │
┌─────────▼────────┐
│ Server Management │
│ global-setup.js   │
│ global-teardown.js│
└───────────────────┘
```

This architecture ensures reliable, automated testing at every level of development.