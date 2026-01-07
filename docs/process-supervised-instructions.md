# Process-Supervised AI Agent Instructions for TSV Ledger

## Phase 1: Foundation - Process Supervision Conversion

### 1.1 File Size Management (Process-Supervised)

**OUTCOME REQUIREMENT**: All files must be under 300 lines for AI optimization and maintainability.

**PROCESS STEPS**:
1. **Pre-Creation Assessment**: Before creating any file, check existing file sizes in the target directory using `list_dir` and `read_file` to understand current patterns.
2. **Size Estimation**: Estimate the new file's line count based on similar existing files. If estimated > 250 lines, plan componentization strategy.
3. **Creation with Monitoring**: Create the file and immediately validate line count using `run_in_terminal` with `wc -l <filename>`.
4. **Componentization Trigger**: If file exceeds 250 lines during development, immediately break into components under 300 lines each.
5. **Post-Creation Validation**: Run `npm run lint` and check for any size violations before committing.
6. **Documentation Update**: Update `CODEBASE_ARCHITECTURE.md` with new file structure and size metrics.

**VALIDATION CHECKLIST**:
- [ ] File created with estimated size < 250 lines
- [ ] `wc -l` validation shows < 300 lines
- [ ] Componentization applied if > 250 lines during development
- [ ] Linting passes without size warnings
- [ ] Architecture documentation updated

**ERROR HANDLING**:
- If file exceeds 300 lines: Immediately componentize into `public/components/[feature]/[component].html` or `src/modules/[feature]/[module].js`
- If componentization not possible: Break into multiple focused files with clear responsibilities
- Always verify with `grep_search` for similar patterns in codebase

### 1.2 Testing Workflow (Process-Supervised)

**OUTCOME REQUIREMENT**: Every code change must undergo complete testing with zero errors.

**PROCESS STEPS**:
1. **Baseline Establishment**: Run `npm run test:all` before any code changes to establish baseline.
2. **Unit Test Development**: For each function/method, write corresponding unit test in `tests/` before implementation.
3. **Continuous Testing**: Run relevant unit tests after each code change using `runTests` tool.
4. **Integration Testing**: Test API endpoints with `curl` commands and validate responses.
5. **E2E Testing**: Use Playwright to test complete user workflows in external browsers.
6. **Performance Validation**: Run performance benchmarks and compare against baseline.
7. **Accessibility Audit**: Use axe-playwright for accessibility compliance.
8. **Visual Regression**: Compare screenshots across browsers (Chrome, Firefox, Safari, Edge).
9. **Final Validation**: Run complete `npm run test:all` pipeline before commit.

**VALIDATION CHECKLIST**:
- [ ] Baseline tests pass before changes
- [ ] Unit tests written for all new functions
- [ ] Integration tests pass for API changes
- [ ] E2E tests complete successfully in external browsers
- [ ] Performance within acceptable thresholds
- [ ] Accessibility violations resolved
- [ ] Visual regressions addressed
- [ ] All tests pass in final pipeline

**ERROR HANDLING**:
- Any test failure: Stop development, fix issue, re-run failed tests
- Performance regression: Optimize code or revert changes
- Accessibility violation: Implement fixes before proceeding
- Visual regression: Update baseline or fix UI issues

### 1.3 Command Execution (Process-Supervised)

**OUTCOME REQUIREMENT**: Commands must not block chat interface, servers must run in background.

**PROCESS STEPS**:
1. **Command Classification**: Determine if command is quick (< 5 seconds) or long-running.
2. **Background Assessment**: For server processes, always set `isBackground: true`.
3. **Timeout Application**: For testing server startup, use `timeout 10 node server.js`.
4. **Health Check**: Use `curl -s http://localhost:3000/health` for non-blocking server readiness.
5. **Process Management**: Use `pkill` to stop background processes before restarting.
6. **Output Validation**: Check command output for errors before proceeding.

**VALIDATION CHECKLIST**:
- [ ] Server commands use `isBackground: true`
- [ ] Testing commands use appropriate timeouts
- [ ] Health endpoints return success before API testing
- [ ] Background processes properly managed
- [ ] No blocking commands in chat interface

**ERROR HANDLING**:
- Blocking command detected: Cancel and re-run with `isBackground: true`
- Server startup failure: Check logs and fix configuration
- Health check failure: Troubleshoot server issues before proceeding

### 1.4 Browser Testing (Process-Supervised)

**OUTCOME REQUIREMENT**: All UX testing must use external browsers, never Simple Browser.

**PROCESS STEPS**:
1. **Browser Selection**: Choose external browser (Chrome, Firefox, Safari, Edge) for testing.
2. **Server Readiness**: Ensure development server is running with `isBackground: true`.
3. **Manual Navigation**: Open browser at `http://localhost:3000` manually.
4. **Console Inspection**: Check browser console for JavaScript errors.
5. **UI Validation**: Verify rendering across different viewports and browsers.
6. **Workflow Testing**: Complete end-to-end user workflows manually.
7. **Accessibility Check**: Test with screen readers and keyboard navigation.
8. **Cross-Browser Validation**: Repeat tests across multiple browsers.

**VALIDATION CHECKLIST**:
- [ ] External browser used (not Simple Browser)
- [ ] Server running and accessible
- [ ] Console errors logged and addressed
- [ ] UI renders correctly across browsers
- [ ] All user workflows complete successfully
- [ ] Accessibility features functional
- [ ] Responsive design validated

**ERROR HANDLING**:
- Simple Browser used: Re-test in external browser
- Console errors: Debug and fix JavaScript issues
- UI rendering issues: Fix CSS/styling problems
- Workflow failures: Identify and resolve logic errors

### 1.5 Git Workflow (Process-Supervised)

**OUTCOME REQUIREMENT**: All changes must use conventional commits and atomic changes.

**PROCESS STEPS**:
1. **Change Assessment**: Analyze the scope and impact of planned changes before starting.
2. **Branch Creation**: Create feature branch with descriptive name (e.g., `feature/amazon-integration`).
3. **Atomic Commits**: Break work into small, logical commits addressing single concerns.
4. **Commit Message Formatting**: Use format `<type>[scope]: <description>` with imperative language.
5. **Testing Validation**: Run `npm run test:all` before committing to ensure no regressions.
6. **Staging Process**: Use `git add -p` for selective staging of related changes.
7. **Commit Execution**: Commit with conventional message referencing issues/PRs if applicable.
8. **Push and PR**: Push branch and create PR with testing evidence and description.

**VALIDATION CHECKLIST**:
- [ ] Changes broken into atomic commits
- [ ] Commit messages follow conventional format
- [ ] All tests pass before commit
- [ ] PR includes testing evidence
- [ ] Branch naming follows conventions
- [ ] No sensitive data or large binaries committed

**ERROR HANDLING**:
- Large commit detected: Break into smaller atomic commits
- Test failures: Fix issues before committing
- Non-conventional message: Rewrite with proper format
- Sensitive data: Remove and use .gitignore properly

### 1.7 Documentation and Commenting (Process-Supervised)

**OUTCOME REQUIREMENT**: All code must be well-documented with clear, descriptive comments.

**PROCESS STEPS**:
1. **Documentation Planning**: Identify documentation needs during design phase.
2. **JSDoc Standards**: Add JSDoc comments for all public functions with @param, @returns, @throws.
3. **Inline Comments**: Add comments for complex logic, business rules, and non-obvious code.
4. **README Updates**: Update README.md and API docs for any new features or changes.
5. **Architecture Documentation**: Update CODEBASE_ARCHITECTURE.md after structural changes.
6. **Knowledge Transfer**: Document lessons learned in KnowledgeTransferTest/ after changes.
7. **Code Review**: Review comments for clarity and accuracy during self-review.
8. **Validation**: Ensure documentation builds and links work correctly.

**VALIDATION CHECKLIST**:
- [ ] JSDoc comments on all public functions
- [ ] Complex logic explained with inline comments
- [ ] README.md updated for new features
- [ ] Architecture documentation current
- [ ] Knowledge transfer documented
- [ ] Comments clear and accurate
- [ ] Documentation accessible and correct

**ERROR HANDLING**:
- Missing documentation: Add appropriate comments before proceeding
- Unclear comments: Rewrite for better clarity
- Outdated docs: Update to reflect current implementation
- Broken links: Fix documentation references