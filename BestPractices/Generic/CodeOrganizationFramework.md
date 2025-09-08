# Generic Code Organization Framework

> **Framework-Agnostic Best Practices for Professional Code Organization**

## Universal Directory Structure Principles

### Core Organizational Philosophy
Every professional codebase should follow these universal principles regardless of technology stack:

1. **Separation of Concerns** - Logical grouping by function
2. **Scalability** - Structure that grows with the project
3. **Discoverability** - Intuitive file and folder naming
4. **Maintainability** - Clear ownership and responsibility

### Standard Directory Template

```
project-root/
├── src/                    # Core business logic
│   ├── components/         # Reusable components
│   ├── services/          # Business services
│   ├── utils/             # Utility functions
│   └── README.md          # Module documentation
├── tests/                 # Testing framework
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/               # End-to-end tests
│   └── README.md          # Testing documentation
├── docs/                  # Documentation hub
│   ├── api/               # API documentation
│   ├── guides/            # User/developer guides
│   ├── architecture/      # System design docs
│   └── README.md          # Documentation index
├── data/                  # Data files and schemas
├── scripts/               # Automation scripts
├── config/                # Configuration files
└── README.md              # Main project documentation
```

## Organization Process (Technology Agnostic)

### Phase 1: Assessment
1. **Inventory all files** in current structure
2. **Categorize by function** (logic, tests, docs, data, etc.)
3. **Identify dependencies** between files
4. **Plan migration strategy** with minimal disruption

### Phase 2: Structure Creation
1. **Create directory hierarchy** based on function
2. **Establish naming conventions** for consistency
3. **Create README files** for each major directory
4. **Document the new structure** before migration

### Phase 3: Migration
1. **Move files systematically** in small batches
2. **Update all references** and import paths
3. **Test functionality** after each migration batch
4. **Commit changes incrementally** with clear messages

### Phase 4: Documentation
1. **Update all documentation** to reflect new structure
2. **Create migration guides** for team members
3. **Establish maintenance practices** for the new structure
4. **Document lessons learned** for future projects

## Universal File Naming Conventions

### Files
- **Descriptive names**: `user-authentication.js` not `auth.js`
- **Consistent casing**: Choose kebab-case, camelCase, or snake_case consistently
- **Clear extensions**: Use appropriate file extensions
- **Version indication**: Include version in critical files when needed

### Directories
- **Plural nouns**: `components/`, `services/`, `utils/`
- **Clear purpose**: Directory name should indicate contents
- **Hierarchical**: Subdirectories for complex modules
- **No deep nesting**: Maximum 3-4 levels deep

## Documentation Standards

### README Files
Every directory should have a README.md with:
```markdown
# Directory Name

## Purpose
Brief description of directory contents and responsibility.

## Contents
- file1.js - Description of purpose
- file2.js - Description of purpose

## Usage
Basic usage examples or import patterns.

## Dependencies
Any special requirements or dependencies.
```

### Code Documentation
1. **File headers** with purpose, author, version
2. **Function documentation** with parameters and return values
3. **Inline comments** for complex logic
4. **API documentation** for all public interfaces

## Testing Organization

### Test Structure Mirrors Source
```
src/
├── components/
│   └── user-profile.js
└── services/
    └── data-service.js

tests/
├── unit/
│   ├── components/
│   │   └── user-profile.test.js
│   └── services/
│       └── data-service.test.js
└── integration/
    └── user-workflow.test.js
```

### Test Naming Conventions
- **Mirror source structure** in test directories
- **Clear test names**: `should_return_user_when_valid_id_provided`
- **Group related tests** in describe blocks
- **One assertion focus** per test

## Version Control Best Practices

### Commit Organization During Restructure
1. **Atomic commits** - One logical change per commit
2. **Clear messages** - Conventional commit format
3. **Incremental changes** - Small, reviewable commits
4. **Documentation updates** - Include docs in relevant commits

### Migration Commit Strategy
```
refactor: create new directory structure
refactor: move core business logic to src/
refactor: organize test files in tests/ directory
docs: update all documentation for new structure
fix: update import paths after reorganization
```

## Language-Agnostic Principles

### JavaScript/Node.js
- `src/` for modules, `tests/` for testing
- `package.json` scripts updated for new paths
- Relative imports updated consistently

### Python
- `src/` or project name folder for modules
- `tests/` with pytest structure
- `setup.py` or `pyproject.toml` updated

### Java
- Standard Maven/Gradle structure
- `src/main/java` and `src/test/java`
- Package structure follows directory hierarchy

### Any Language
- Configuration files in dedicated directory
- Data files separated from logic
- Documentation follows same patterns
- Testing mirrors source structure

## Success Metrics

### Immediate Metrics
- **All functionality preserved** after reorganization
- **All tests passing** with new structure
- **Documentation complete** and accurate
- **Team understanding** of new structure

### Long-term Metrics
- **Faster onboarding** for new team members
- **Easier maintenance** and debugging
- **Improved code quality** through clear ownership
- **Better collaboration** through standardization

## Common Anti-Patterns to Avoid

### Structural Anti-Patterns
- **Everything in root** - No organization
- **Inconsistent naming** - Mixed conventions
- **Deep nesting** - More than 4 levels
- **Unclear purpose** - Ambiguous directory names

### Process Anti-Patterns
- **Big bang migration** - Moving everything at once
- **No testing** - Not verifying functionality during moves
- **Missing documentation** - Not updating docs during reorganization
- **Breaking changes** - Disrupting team workflow unnecessarily

## Reusable Templates

### Directory README Template
```markdown
# [Directory Name]

## Purpose
[What this directory contains and why]

## Structure
- `file1.ext` - [Purpose]
- `subdirectory/` - [Contains what]

## Usage
[How to use contents of this directory]

## Dependencies
[Any special requirements]
```

### Project README Template
```markdown
# [Project Name]

## Overview
[Brief project description]

## Quick Start
[How to get started quickly]

## Architecture
[Link to architecture documentation]

## Development
[How to set up development environment]

## Testing
[How to run tests]

## Deployment
[How to deploy]

## Contributing
[How to contribute to the project]
```

---

**This framework can be applied to any technology stack or project type for professional code organization.**
