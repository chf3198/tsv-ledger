# AI Agent Instruction Documentation System

## Overview

This documentation system provides comprehensive guidance for AI agents working on the TSV Ledger project. The system is organized into modular components for easy navigation and maintenance.

## Documentation Structure

### Core Instructions
- **[Project Overview](project-overview.md)** - Tech stack, architecture, and key components
- **[Development Standards](development-standards.md)** - File size limits, componentization, and quality requirements
- **[Testing Protocols](testing-protocols.md)** - Comprehensive testing workflow and requirements
- **[Code Quality](code-quality.md)** - Best practices, organization, and maintenance guidelines
- **[Version Control](version-control.md)** - Git practices, conventional commits, and branching strategy

### Specialized Guides
- **[Frontend Development](frontend-development.md)** - Component architecture and HTML/JS patterns
- **[Backend Development](backend-development.md)** - API design, database operations, and server management
- **[AI Analysis Integration](ai-analysis-integration.md)** - Machine learning components and data processing
- **[Amazon Integration](amazon-integration.md)** - ZIP processing, data extraction, and API endpoints

### Training Materials
- **[User Training Materials](user-training-materials.md)** - Comprehensive training for different skill levels
- **[Interactive Tutorials](interactive-tutorials.md)** - Hands-on learning experiences with real-time feedback
- **[Video Walkthroughs](video-walkthroughs.md)** - Professional video content for visual learning
- **[Knowledge Assessment Systems](knowledge-assessment-systems.md)** - Certification and skill validation framework

### Operational Procedures
- **[Deployment Process](deployment-process.md)** - CI/CD pipeline, testing requirements, and release procedures
- **[Troubleshooting](troubleshooting.md)** - Common issues, debugging techniques, and error resolution
- **[Performance Optimization](performance-optimization.md)** - Monitoring, benchmarking, and improvement strategies

## Quick Reference

### Critical Requirements
- **All files must be under 300 lines**
- **100% testing coverage required**
- **Componentization mandatory for files > 500 lines**
- **Conventional commits only**
- **Zero console errors in production**

### Command Reference
```bash
# Testing
npm run test:all              # Full test suite
npm run test:unit            # Unit tests only
npm run test:e2e             # End-to-end tests
npm run test:performance     # Performance benchmarks

# Code Quality
npm run lint                 # ESLint checking
npm run format               # Prettier formatting

# Development
npm run dev                  # Start development server
```

### File Organization Standards
```
src/                    # Backend source code
├── routes/            # API endpoints
├── amazon-integration/# Amazon data processing
└── ai-analysis-engine.js

public/                 # Frontend assets
├── components/        # HTML components (< 300 lines each)
└── js/modules/        # JavaScript modules (< 300 lines each)

tests/                  # Test files
docs/                   # Documentation
data/                   # JSON data storage
```

## Best Practices Checklist

### Before Starting Work
- [ ] Review project overview and architecture
- [ ] Check file size limits for target files
- [ ] Run full test suite to establish baseline
- [ ] Verify development environment setup

### During Development
- [ ] Keep all files under 300 lines
- [ ] Run relevant tests continuously
- [ ] Use conventional commit messages
- [ ] Document all public APIs and functions
- [ ] Follow componentization requirements

### Before Committing
- [ ] All tests pass (npm run test:all)
- [ ] No console errors in external browsers
- [ ] Code follows linting standards
- [ ] Documentation updated
- [ ] File sizes within limits

## Emergency Procedures

### If Tests Fail
1. Identify failing component
2. Check for syntax errors
3. Verify dependencies
4. Run isolated component tests
5. Check for integration issues

### If File Size Exceeds Limit
1. Identify componentization opportunities
2. Break into smaller, focused modules
3. Update imports and dependencies
4. Test component integration
5. Update documentation

### If Performance Regresses
1. Run performance benchmarks
2. Identify bottlenecks
3. Optimize algorithms
4. Test in external browsers
5. Verify accessibility compliance

## Support and Resources

### Internal Resources
- **Knowledge Transfer Test (KTS)**: `KnowledgeTransferTest/` - Lessons and patterns
- **Best Practices**: `BestPractices/` - Project-specific guidelines
- **API Documentation**: `docs/API_DOCUMENTATION.md`

### External Tools
- **ESLint**: Code quality and style enforcement
- **Prettier**: Code formatting
- **Jest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Artillery**: Performance testing

## Maintenance

This documentation system should be updated whenever:
- New best practices are established
- Project architecture changes
- New tools or processes are introduced
- Lessons learned from development cycles

**Last Updated**: January 6, 2026
**Version**: 1.0.0