# Testing Protocols

## Overview

TSV Ledger implements a comprehensive testing strategy ensuring 100% error-free development. All code changes, features, and bug fixes must undergo complete testing before being considered complete.

## Testing Stack

### Unit Testing
- **Framework**: Jest
- **Coverage**: 90%+ required
- **Focus**: Individual functions and components

### Integration Testing
- **Framework**: Supertest + Jest
- **Focus**: Component interactions and API endpoints

### End-to-End Testing
- **Framework**: Playwright
- **Focus**: Complete user workflows
- **Browsers**: Chrome, Firefox, Safari, Edge

### Performance Testing
- **Framework**: Artillery
- **Focus**: Load testing and response times

### Accessibility Testing
- **Framework**: axe-playwright
- **Standards**: WCAG 2.1 Level AA compliance

### Visual Regression Testing
- **Framework**: Playwright screenshots + Chromatic
- **Focus**: UI consistency and visual bugs

## Development Testing Cycle (DDTRE)

1. **Discuss**: Requirements analysis and test scenario identification
2. **Design**: Test case planning and environment setup
3. **Develop**: Code implementation with continuous testing
4. **Test**: Comprehensive test execution and validation
5. **Revise**: Bug fixes and test updates
6. **Evolve**: Test suite maintenance and process improvement

## Testing Categories

### Unit Testing
- **[Unit Test Guidelines](testing/unit/guidelines.md)** - Best practices for unit test development
- **[Mocking Strategies](testing/unit/mocking.md)** - Effective mocking and stubbing techniques
- **[Coverage Analysis](testing/unit/coverage.md)** - Coverage reporting and improvement

### Integration Testing
- **[API Testing](testing/integration/api-testing.md)** - REST API validation and testing
- **[Database Testing](testing/integration/database-testing.md)** - Data persistence and integrity
- **[Module Integration](testing/integration/module-testing.md)** - Inter-module communication testing

### End-to-End Testing
- **[User Workflow Testing](testing/e2e/user-workflows.md)** - Complete user journey validation
- **[Cross-Browser Testing](testing/e2e/cross-browser.md)** - Browser compatibility assurance
- **[Mobile Testing](testing/e2e/mobile-testing.md)** - Responsive design validation

### Performance Testing
- **[Load Testing](testing/performance/load-testing.md)** - System capacity and scalability
- **[Stress Testing](testing/performance/stress-testing.md)** - System limits and failure points
- **[Monitoring](testing/performance/monitoring.md)** - Performance metrics and alerting

## Zero-Bug Policy

### Never Commit Code That:
- ❌ Fails any test in the pipeline
- ❌ Has console errors in external browser dev tools
- ❌ Breaks existing functionality
- ❌ Has accessibility violations
- ❌ Performs below performance thresholds
- ❌ Has visual regressions

### Always Verify Before Commit:
- ✅ All tests pass: `npm run test:all`
- ✅ No console errors in external browsers
- ✅ All user workflows complete successfully
- ✅ API responses are valid and timely
- ✅ Visual appearance matches design
- ✅ Accessibility standards met

## Testing Commands

### Full Test Suite
```bash
npm run test:all          # Complete testing pipeline (mandatory)
```

### Individual Test Categories
```bash
npm run test:unit         # Unit tests with coverage
npm run test:integration  # API integration tests
npm run test:e2e          # End-to-end user workflows
npm run test:performance  # Performance benchmarks
npm run test:accessibility # Accessibility compliance
npm run test:visual       # Visual regression tests
```

### Code Quality Commands
```bash
npm run lint              # ESLint code quality checks
npm run format            # Prettier code formatting
npm run test:coverage     # Combined coverage reporting
```

## Command Execution Guidelines

### Critical Requirements
- **Never run blocking commands** that freeze the chat interface
- **All server processes** must use `isBackground: true`
- **Long-running commands** require background execution

### Server Management Patterns
```bash
# ❌ NEVER DO - Blocks chat interface
node server.js

# ✅ ALWAYS DO - Background execution
timeout 10 node server.js  # For testing
# or
npm run dev               # Uses isBackground: true
```

## Browser Testing Requirements

### Critical Restrictions
- **NEVER use VS Code's Simple Browser** for testing
- **ALWAYS test in external browsers**: Chrome, Firefox, Safari, Edge

### Browser Testing Checklist
- [ ] Open app in external browser at `http://localhost:3000`
- [ ] Check browser console for JavaScript errors
- [ ] Verify UI renders correctly across browsers
- [ ] Test all user workflows end-to-end

## CI/CD Pipeline Requirements

### GitHub Actions Validation
- **All tests pass** on every PR and push
- **Coverage meets thresholds** (90%+)
- **No linting errors** detected
- **Performance within limits** established
- **Accessibility compliant** across all components
- **Visual tests pass** with no regressions

## Testing Evidence Requirements

### PR Template Checklist
- [ ] All tests pass locally
- [ ] Coverage report attached
- [ ] Screenshots/videos of functionality
- [ ] Performance benchmarks included
- [ ] Accessibility audit results attached
- [ ] Manual testing checklist completed

This comprehensive testing protocol ensures that all TSV Ledger development maintains the highest standards of quality, reliability, and user experience through rigorous, automated validation at every stage of development.