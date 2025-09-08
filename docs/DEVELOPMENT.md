# Development Workflow Guide

## 📋 **Documentation & Version Control Standards**

This guide establishes the development workflow for TSV Ledger to ensure proper documentation, version control, and seamless AI-to-AI handoffs.

## 🔄 **Development Workflow**

### 1. **Before Starting Development**
```bash
# Check current status
git status
npm test                    # Run full test suite
node quick-test.js all      # Quick validation
```

### 2. **Feature Development Process**
1. **Update Documentation First**
   - Update `AI_CONTEXT.md` with planned features
   - Add TODO comments in code
   - Document expected behavior changes

2. **Implement Features**
   - Write code with JSDoc comments
   - Add unit tests for new functionality
   - Test with `npm test` and `npm run test-quick`

3. **Validate Changes**
   ```bash
   npm test                     # Full automated testing
   node quick-test.js ss        # Test Subscribe & Save
   node quick-test.js categories # Test categorization
   node quick-test.js interactive # Interactive testing
   ```

### 3. **Documentation Requirements** ⚠️ **CRITICAL**

#### **For Every Change:**
- [ ] Update `AI_CONTEXT.md` with new features
- [ ] Add JSDoc comments to new functions
- [ ] Update performance metrics if applicable
- [ ] Test new functionality thoroughly

#### **For Major Releases:**
- [ ] Update `README.md` with new features
- [ ] Update `CHANGELOG.md` with detailed changes
- [ ] Bump version in `package.json`
- [ ] Create comprehensive git commit messages
- [ ] Tag release with semantic versioning

### 4. **Git Commit Standards**

#### **Commit Message Format:**
```
type: Brief description (50 chars max)

🚀 CATEGORY: Detailed explanation
✅ Feature 1: Description
✅ Feature 2: Description
⚡ Performance: Improvement details
🔧 Technical: Technical changes
📚 Documentation: Doc updates

Current Status: Status description
Next Priority: Next development focus

Breaking Changes: None/Description
Migration: No action required/Steps
```

#### **Commit Types:**
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `perf:` Performance improvements
- `refactor:` Code refactoring
- `test:` Testing improvements
- `chore:` Maintenance tasks

### 5. **Version Control Strategy**

#### **Semantic Versioning (semver.org):**
- **MAJOR (x.0.0)**: Breaking changes, API changes
- **MINOR (x.y.0)**: New features, enhancements
- **PATCH (x.y.z)**: Bug fixes, minor improvements

#### **Release Process:**
```bash
# 1. Update version
npm version minor           # or major/patch

# 2. Update documentation
# Edit AI_CONTEXT.md, README.md, CHANGELOG.md

# 3. Commit changes
git add .
git commit -m "feat: Version x.y.z - Feature Description"

# 4. Tag release
git tag -a vx.y.z -m "Release vx.y.z: Description"

# 5. Validate
npm test
```

## 🧪 **Testing Strategy**

### **Test Types:**
1. **Unit Tests**: `npm test` - Full automated suite
2. **Quick Tests**: `npm run test-quick` - Rapid validation
3. **Focused Tests**: `npm run test-ss` - Specific algorithm testing
4. **Interactive Tests**: `npm run test-interactive` - Manual validation

### **Before Each Commit:**
```bash
npm test                    # Must pass all tests
node quick-test.js all      # Quick validation
```

### **Performance Benchmarks to Maintain:**
- Processing Speed: >15,000 orders/second
- Data Completeness: >95%
- Algorithm Confidence: >75%
- Test Success Rate: >90%

## 📚 **Documentation Files to Maintain**

### **Primary Files:**
1. **`AI_CONTEXT.md`** ⭐ **MOST CRITICAL**
   - Complete project context for AI handoffs
   - Feature documentation and development priorities
   - Technical specifications and performance metrics

2. **`README.md`**
   - User-facing documentation
   - Setup instructions and testing commands
   - Current performance metrics

3. **`CHANGELOG.md`**
   - Detailed version history
   - Breaking changes and migration guides
   - Development timeline

### **Code Documentation:**
- JSDoc comments for all functions
- Inline comments for complex algorithms
- TODO comments for planned improvements
- Performance notes for optimized code

## 🎯 **Current Status Tracking**

### **Version 2.1.0 Metrics:**
- ✅ 598 Amazon orders processed
- ✅ 156 Subscribe & Save orders detected (26% rate)
- ✅ 19,290 orders/second processing speed
- ✅ 90.9% unit test success rate
- ⚠️ Target: Improve S&S detection to 35%+

### **Next Development Priorities:**
1. Enhance Subscribe & Save detection algorithms
2. Add visual charts and graphs (Chart.js)
3. Implement export functionality (PDF/Excel)
4. Mobile optimization improvements
5. Advanced AI features (predictive analysis)

## 🚨 **Critical Reminders**

### **For Future AI Assistants:**
1. **ALWAYS read `AI_CONTEXT.md` first**
2. **Update documentation with every change**
3. **Run tests before committing**
4. **Maintain semantic versioning**
5. **Use descriptive commit messages**

### **Documentation Maintenance:**
- Update `AI_CONTEXT.md` after every session
- Keep performance metrics current
- Document any breaking changes
- Maintain development priorities

---

**Remember**: Proper documentation and version control are essential for seamless AI-to-AI handoffs and project maintainability. Always prioritize documentation updates alongside code changes.
