# Development Standards

## File Size Standards

### Mandatory Requirements
**ALL FILES MUST BE UNDER 300 LINES** - This is a hard requirement for AI optimization and maintainability.

#### File Type Limits
- **Backend JS Files**: `src/**/*.js` < 300 lines each
- **Frontend JS Files**: `public/js/**/*.js` < 300 lines each
- **HTML Component Files**: `public/components/**/*.html` < 300 lines each
- **Test Files**: `tests/**/*.js` < 300 lines each
- **Documentation Files**: `docs/**/*.md` < 300 lines each

#### Enforcement
- **Pre-commit hooks**: Automatic validation before commits
- **CI/CD checks**: GitHub Actions validation on all PRs
- **IDE integration**: Real-time warnings for oversized files

### Componentization Strategy

#### HTML Files > 500 Lines
**MUST BE COMPONENTIZED** into smaller, focused components:
- Break into `public/components/[feature]/[component].html` files
- Each component < 300 lines with single responsibility
- Use server-side includes or JavaScript imports for composition

#### JavaScript Files > 300 Lines
**MUST BE MODULARIZED** into focused modules:
- Break into `public/js/modules/[feature]/[module].js` files
- Each module < 300 lines with specific functionality
- Use ES6 imports/exports for composition

## Code Quality Standards

### Functional Programming
- Prefer pure functions over side effects
- Use immutability patterns
- Avoid global state when possible
- Implement proper error handling

### Documentation Requirements
- **JSDoc comments** for all public functions and classes
- **Inline comments** for complex logic
- **README updates** for architectural changes
- **API documentation** for all endpoints

### Naming Conventions
- **Functions**: camelCase, descriptive names
- **Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case, descriptive names

### Error Handling
- Use try-catch blocks for external operations
- Provide meaningful error messages
- Log errors appropriately
- Fail fast for invalid inputs

## Testing Standards

### Coverage Requirements
- **Unit Tests**: 90%+ coverage required
- **Integration Tests**: All API routes tested
- **E2E Tests**: All user workflows validated
- **Performance Tests**: Benchmarks established and monitored

### Testing Categories
- **Unit Tests**: Individual function/component testing
- **Integration Tests**: Component interaction validation
- **E2E Tests**: Complete user workflow testing
- **Performance Tests**: Load and response time validation
- **Accessibility Tests**: WCAG compliance verification

### Test Organization
- Tests mirror source code structure
- Descriptive test names and assertions
- Mock external dependencies
- Clean up after test execution

## Version Control Standards

### Commit Conventions
Use conventional commits format: `<type>[scope]: <description>`

#### Commit Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Testing changes
- `chore`: Maintenance tasks

#### Examples
```
feat: add Amazon ZIP import functionality
fix: resolve memory leak in data processing
docs: update API documentation for new endpoints
refactor: componentize large HTML files
```

### Branching Strategy
- **Main Branch**: Production-ready code
- **Feature Branches**: `feature/amazon-integration`
- **Bug Fix Branches**: `fix/memory-leak-issue`
- **PR Required**: All changes via pull requests

### Pull Request Requirements
- **Testing Evidence**: All tests pass locally
- **Coverage Reports**: Attached to PR
- **Screenshots/Videos**: For UI changes
- **Performance Benchmarks**: For performance-impacting changes
- **Accessibility Audits**: For UI modifications

## Code Review Standards

### Review Checklist
- [ ] Code follows established patterns
- [ ] Tests are comprehensive and passing
- [ ] Documentation is updated
- [ ] File sizes within limits
- [ ] Security considerations addressed
- [ ] Performance impact assessed

### Automated Checks
- **ESLint**: Code quality and style
- **Prettier**: Code formatting consistency
- **Jest**: Test execution and coverage
- **Playwright**: E2E workflow validation

## Performance Standards

### Response Time Requirements
- **API Endpoints**: < 500ms average response time
- **Page Loads**: < 3 seconds initial load
- **User Interactions**: < 100ms response time
- **Data Processing**: Efficient algorithms, no blocking operations

### Resource Usage
- **Memory**: Monitor for leaks, optimize large data processing
- **CPU**: Efficient algorithms, avoid unnecessary computations
- **Network**: Minimize requests, optimize data transfer
- **Storage**: Efficient JSON operations, proper file handling

## Security Standards

### Input Validation
- Validate all user inputs
- Sanitize data before processing
- Use parameterized queries (when applicable)
- Implement proper error messages (no data leakage)

### Data Protection
- No sensitive data in logs
- Secure file operations
- Proper error handling (no stack traces to users)
- Environment-specific configuration

### Access Control
- API endpoint protection
- File upload restrictions
- Rate limiting considerations
- CORS policy implementation

## Accessibility Standards

### WCAG Compliance
- **Level AA** compliance required
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements
- Focus management

### Testing Requirements
- Automated accessibility testing with axe-playwright
- Manual testing with screen readers
- Cross-browser validation
- Mobile accessibility verification

## Browser Compatibility

### Supported Browsers
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Testing Requirements
- **External Browser Testing**: Never use VS Code's Simple Browser
- **Cross-browser Validation**: All user workflows tested
- **Responsive Design**: Mobile and desktop verification
- **Console Error Free**: Zero errors in production

## Maintenance Standards

### Code Health
- Regular dependency updates
- Security vulnerability monitoring
- Performance regression detection
- Code duplication elimination

### Documentation Updates
- API documentation kept current
- README files updated for changes
- Troubleshooting guides maintained
- Knowledge base expansion

### Monitoring and Alerting
- Automated test pipelines
- Performance monitoring
- Error tracking and alerting
- User feedback integration