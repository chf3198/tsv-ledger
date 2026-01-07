# Frontend Development Guide

## Overview

TSV Ledger uses a componentized frontend architecture with Bootstrap 5 for styling and vanilla JavaScript for functionality. All HTML files are broken into reusable components under 300 lines each, with modular JavaScript organized by feature.

## Architecture Components

### Component Architecture
- **[Component Architecture](components/component-architecture.md)** - Component structure, templates, and lifecycle management

### JavaScript Modules
- **[JavaScript Modules](javascript/javascript-modules.md)** - Modular JavaScript organization and API client implementation

### Styling Guidelines
- **[Bootstrap Integration](styling/bootstrap-integration.md)** - Bootstrap 5 usage patterns and customization
- **[Responsive Design](styling/responsive-design.md)** - Mobile-first responsive design principles

### Accessibility
- **[Accessibility Standards](accessibility/accessibility-standards.md)** - WCAG compliance and accessibility implementation

## Development Workflow

### Component Development
1. Create component directory in `public/components/[feature]/`
2. Implement HTML template with semantic structure
3. Add component-specific styles
4. Implement JavaScript class with event handling
5. Test component integration

### Module Development
1. Create module in `public/js/modules/[feature]/[module].js`
2. Implement class or functions with clear API
3. Add comprehensive error handling
4. Write unit tests
5. Document module usage

### Quality Assurance
1. Ensure files stay under 300 lines
2. Test component responsiveness
3. Verify accessibility compliance
4. Run cross-browser testing
5. Validate performance metrics

## Best Practices

### Code Organization
- Keep components focused on single responsibilities
- Use consistent naming conventions
- Separate concerns between HTML, CSS, and JavaScript
- Document component APIs and usage

### Performance
- Lazy load components when possible
- Minimize DOM manipulation
- Use efficient CSS selectors
- Optimize images and assets

### Maintainability
- Write self-documenting code
- Use consistent patterns across components
- Keep dependencies minimal
- Regular code reviews and updates

## File Size Standards

All frontend files must maintain the 300-line limit:

- **Component HTML**: < 300 lines
- **Component CSS**: < 300 lines
- **JavaScript Modules**: < 300 lines
- **Utility Functions**: < 300 lines

Files exceeding this limit must be componentized into smaller, focused modules.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All components must be tested across these browsers before release.
