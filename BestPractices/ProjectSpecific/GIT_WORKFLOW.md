# Git Workflow & Best Practices

> **Project:** TSV Ledger v2.2.1  
> **Repository:** Local development with conventional commits  
> **Workflow:** Feature-driven development with semantic versioning

## Git Workflow Overview

The TSV Ledger project follows industry-standard git practices with conventional commits and semantic versioning to ensure clean, trackable, and professional version control.

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples
```bash
feat: add Amazon order editing functionality
fix: resolve data path issues after organization
docs: create comprehensive API documentation
refactor: organize codebase into logical directories
test: add comprehensive unit testing framework
chore: update package.json dependencies
```

## Recent Git History

### Version 2.2.1 Commits
```
379bf7b (HEAD -> master) fix: update data paths and add directory README files
35504f4 refactor: complete file organization with final cleanup
5fa3745 refactor: organize demo, test, and utility files
6fe9ed4 docs: add comprehensive organization completion summary
47b2495 docs: finalize codebase organization and documentation
d4353e3 feat: enhance codebase organization and documentation
2a0a739 refactor: organize codebase into logical directories
bd63c1d refactor: move test files to tests directory
0ab65bc feat: start codebase organization - improve .gitignore and update changelog
0e4b9db docs: Complete Premium Integration Report v2.2.1
```

## Branching Strategy

### Current Strategy
- **Master Branch**: Main development and production-ready code
- **Feature Development**: Direct commits to master with conventional commit messages
- **Version Tags**: Semantic version tags for releases (v2.2.1, v2.1.0, etc.)

### Recommended for Team Development
```bash
# Feature branch workflow
git checkout -b feat/new-feature
git commit -m "feat: implement new feature"
git checkout master
git merge feat/new-feature
git tag v2.3.0
```

## Semantic Versioning

Following [SemVer](https://semver.org/) specification:

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** (2.x.x): Incompatible API changes
- **MINOR** (x.2.x): New functionality in backwards-compatible manner
- **PATCH** (x.x.1): Backwards-compatible bug fixes

### Current Version History
- **v2.2.1**: Complete codebase organization with enhanced documentation
- **v2.1.0**: Enhanced Subscribe & Save detection and testing framework
- **v2.0.x**: Major features and business intelligence capabilities
- **v1.x.x**: Initial development and core features

## Release Process

### 1. Pre-Release Checklist
- [ ] All tests passing (`npm test`)
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped in `package.json`
- [ ] Code review completed

### 2. Version Bump Commands
```bash
# Patch release (bug fixes)
npm version patch
git push && git push --tags

# Minor release (new features)
npm version minor
git push && git push --tags

# Major release (breaking changes)
npm version major
git push && git push --tags
```

### 3. Release Documentation
- Update `CHANGELOG.md` with new version details
- Update `README.md` with new features
- Tag release with semantic version
- Create release notes if applicable

## Git Best Practices

### Do's ✅
- Use conventional commit messages
- Commit frequently with logical chunks
- Write descriptive commit messages
- Keep commits atomic (one logical change per commit)
- Update documentation with code changes
- Test before committing

### Don'ts ❌
- Don't commit broken code
- Don't use generic commit messages like "fixes"
- Don't commit large binary files
- Don't force push to shared branches
- Don't commit sensitive information

## Git Configuration

### Recommended Settings
```bash
# Set up user information
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Set up conventional commit template
git config commit.template .gitmessage

# Set up automatic line ending handling
git config core.autocrlf true  # Windows
git config core.autocrlf input # macOS/Linux
```

### .gitignore Best Practices
Current `.gitignore` includes:
- Node.js dependencies (`node_modules/`)
- Environment files (`.env`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Log files (`*.log`)
- Temporary files (`tmp/`, `temp/`)

## Code Review Guidelines

### Before Committing
1. **Test Your Changes**: Run `npm test` to ensure all tests pass
2. **Check Code Style**: Ensure consistent formatting and commenting
3. **Update Documentation**: Update relevant documentation files
4. **Verify Paths**: Ensure all file paths work with new organization
5. **Review Diff**: Use `git diff` to review changes before committing

### Commit Preparation
```bash
# Stage changes selectively
git add src/new-feature.js
git add tests/test-new-feature.js
git add docs/API_DOCUMENTATION.md

# Review staged changes
git diff --cached

# Commit with conventional message
git commit -m "feat: add new feature with comprehensive tests and documentation"
```

## Collaboration Workflow

### For New Contributors
1. Clone the repository
2. Read `HANDOFF_GUIDE.md` for project understanding
3. Follow conventional commit format
4. Ensure tests pass before committing
5. Update documentation for any changes

### For Handoff to New Teams
- Complete project documentation in `docs/HANDOFF_GUIDE.md`
- Clean git history with meaningful commit messages
- All dependencies and paths properly documented
- Version history clearly tracked in `CHANGELOG.md`

## Emergency Procedures

### Rollback Process
```bash
# Rollback to previous version
git log --oneline -10  # Find commit hash
git reset --hard <commit-hash>

# Or revert specific commit
git revert <commit-hash>
```

### Hotfix Process
```bash
# Quick fix for critical issues
git checkout -b hotfix/critical-fix
# Make fix
git commit -m "fix: resolve critical production issue"
git checkout master
git merge hotfix/critical-fix
npm version patch
```

---

**This git workflow ensures professional version control practices and seamless collaboration.**
