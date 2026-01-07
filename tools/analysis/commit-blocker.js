#!/usr/bin/env node

/**
 * Commit Blocking System for File Size Management
 * Prevents commits when files exceed size limits
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CommitBlocker {
    constructor() {
        this.sizeLimit = 300;
        this.blockingEnabled = true;
        this.strictMode = false;
        this.allowedOversize = 0;
        this.blockedCommits = [];
        this.warnings = [];
    }

    /**
     * Initialize the commit blocking system
     */
    async initialize() {
        console.log('🚫 Initializing commit blocking system...');

        // Ensure .husky directory exists
        const huskyDir = path.join(process.cwd(), '.husky');
        if (!fs.existsSync(huskyDir)) {
            fs.mkdirSync(huskyDir, { recursive: true });
        }

        // Install pre-commit hook
        await this.installPreCommitHook();

        // Install commit-msg hook for additional validation
        await this.installCommitMsgHook();

        console.log('Commit blocking system initialized');
    }

    /**
     * Install pre-commit hook
     */
    async installPreCommitHook() {
        const preCommitPath = path.join(process.cwd(), '.husky', 'pre-commit');
        const preCommitScript = `#!/usr/bin/env sh
# File Size Pre-commit Hook

echo "🔍 Running file size validation..."

# Run the validation script
node scripts/validate-file-sizes.js

if [ $? -ne 0 ]; then
    echo "❌ COMMIT BLOCKED: File size validation failed"
    echo "Please fix oversized files before committing."
    exit 1
fi

echo "✅ File size validation passed"
`;

        fs.writeFileSync(preCommitPath, preCommitScript);
        fs.chmodSync(preCommitPath, '755');

        console.log('Pre-commit hook installed');
    }

    /**
     * Install commit-msg hook
     */
    async installCommitMsgHook() {
        const commitMsgPath = path.join(process.cwd(), '.husky', 'commit-msg');
        const commitMsgScript = `#!/usr/bin/env sh
# File Size Commit Message Hook

commit_msg_file="$1"

# Check if commit message mentions file size issues
if grep -q "FIXME.*size\\|TODO.*size\\|file.*size" "$commit_msg_file"; then
    echo "⚠️  Commit message indicates file size issues"
    echo "Consider addressing these before committing"
fi
`;

        fs.writeFileSync(commitMsgPath, commitMsgScript);
        fs.chmodSync(commitMsgPath, '755');

        console.log('Commit-msg hook installed');
    }

    /**
     * Validate files before commit
     */
    async validatePreCommit() {
        console.log('🔍 Validating files before commit...');

        const stagedFiles = this.getStagedFiles();
        const oversizedFiles = [];
        const warningFiles = [];

        for (const file of stagedFiles) {
            if (this.isJavaScriptFile(file) && fs.existsSync(file)) {
                const result = await this.validateFile(file);

                if (!result.valid) {
                    if (result.critical) {
                        oversizedFiles.push(result);
                    } else {
                        warningFiles.push(result);
                    }
                }
            }
        }

        const shouldBlock = oversizedFiles.length > 0 && this.blockingEnabled;

        if (shouldBlock) {
            console.log(`❌ COMMIT BLOCKED: ${oversizedFiles.length} files exceed size limits`);
            oversizedFiles.forEach(file => {
                console.log(`   ${file.file}: ${file.size} lines (limit: ${this.sizeLimit})`);
            });

            this.recordBlockedCommit(oversizedFiles, warningFiles);
            return { blocked: true, oversizedFiles, warningFiles };
        }

        if (warningFiles.length > 0) {
            console.log(`⚠️  WARNING: ${warningFiles.length} files have size warnings`);
            warningFiles.forEach(file => {
                console.log(`   ${file.file}: ${file.size} lines`);
            });
        }

        console.log('✅ All files pass size validation');
        return { blocked: false, oversizedFiles: [], warningFiles };
    }

    /**
     * Validate a single file
     */
    async validateFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;

        const overLimit = lines > this.sizeLimit;
        const overAllowed = lines > (this.sizeLimit + this.allowedOversize);

        return {
            file: filePath,
            size: lines,
            valid: !overAllowed,
            critical: overLimit,
            overLimit: overLimit,
            overAllowed: overAllowed,
            limit: this.sizeLimit,
            allowed: this.sizeLimit + this.allowedOversize
        };
    }

    /**
     * Get staged files
     */
    getStagedFiles() {
        try {
            const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
            return output.trim().split('\n').filter(file => file.length > 0);
        } catch (error) {
            console.warn('Could not get staged files:', error.message);
            return [];
        }
    }

    /**
     * Check if file is a JavaScript file
     */
    isJavaScriptFile(filePath) {
        return filePath.endsWith('.js') && !filePath.includes('node_modules') && !filePath.includes('coverage');
    }

    /**
     * Record blocked commit
     */
    recordBlockedCommit(oversizedFiles, warningFiles) {
        const blockedCommit = {
            timestamp: new Date().toISOString(),
            oversizedFiles: oversizedFiles,
            warningFiles: warningFiles,
            totalViolations: oversizedFiles.length + warningFiles.length,
            commitAttempted: true
        };

        this.blockedCommits.push(blockedCommit);
        this.saveBlockedCommits();
    }

    /**
     * Save blocked commits to file
     */
    saveBlockedCommits() {
        const blockedCommitsPath = path.join(process.cwd(), 'reports', 'blocked-commits.json');

        const reportsDir = path.dirname(blockedCommitsPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(blockedCommitsPath, JSON.stringify({
            totalBlocked: this.blockedCommits.length,
            blockedCommits: this.blockedCommits
        }, null, 2));

        console.log(`Blocked commit recorded. Total blocked: ${this.blockedCommits.length}`);
    }

    /**
     * Generate commit blocking report
     */
    generateBlockingReport() {
        const report = {
            timestamp: new Date().toISOString(),
            configuration: {
                sizeLimit: this.sizeLimit,
                blockingEnabled: this.blockingEnabled,
                strictMode: this.strictMode,
                allowedOversize: this.allowedOversize
            },
            statistics: {
                totalBlockedCommits: this.blockedCommits.length,
                totalViolations: this.blockedCommits.reduce((sum, commit) => sum + commit.totalViolations, 0),
                mostCommonViolation: this.findMostCommonViolation(),
                recentActivity: this.getRecentActivity()
            },
            recommendations: this.generateBlockingRecommendations()
        };

        return report;
    }

    /**
     * Find most common violation
     */
    findMostCommonViolation() {
        const violations = {};

        this.blockedCommits.forEach(commit => {
            commit.oversizedFiles.forEach(file => {
                const size = file.size;
                violations[size] = (violations[size] || 0) + 1;
            });
        });

        const mostCommon = Object.entries(violations)
            .sort(([,a], [,b]) => b - a)[0];

        return mostCommon ? {
            size: parseInt(mostCommon[0]),
            frequency: mostCommon[1]
        } : null;
    }

    /**
     * Get recent activity
     */
    getRecentActivity() {
        const recent = this.blockedCommits.slice(-5); // Last 5 blocked commits

        return recent.map(commit => ({
            date: commit.timestamp,
            violations: commit.totalViolations,
            files: commit.oversizedFiles.length
        }));
    }

    /**
     * Generate blocking recommendations
     */
    generateBlockingRecommendations() {
        const recommendations = [];

        if (this.blockedCommits.length > 10) {
            recommendations.push({
                type: 'process_improvement',
                priority: 'high',
                message: 'High number of blocked commits indicates process issues',
                action: 'Consider team training on file size management'
            });
        }

        const mostCommon = this.findMostCommonViolation();
        if (mostCommon && mostCommon.frequency > 3) {
            recommendations.push({
                type: 'targeted_refactoring',
                priority: 'medium',
                message: `Files around ${mostCommon.size} lines are frequently blocked`,
                action: 'Focus refactoring efforts on this size range'
            });
        }

        if (this.allowedOversize > 50) {
            recommendations.push({
                type: 'policy_review',
                priority: 'low',
                message: 'Large allowed oversize may reduce effectiveness',
                action: 'Consider reducing allowed oversize limit'
            });
        }

        return recommendations;
    }

    /**
     * Configure blocking settings
     */
    configureBlocking(options) {
        if (options.sizeLimit !== undefined) {
            this.sizeLimit = options.sizeLimit;
        }

        if (options.blockingEnabled !== undefined) {
            this.blockingEnabled = options.blockingEnabled;
        }

        if (options.strictMode !== undefined) {
            this.strictMode = options.strictMode;
        }

        if (options.allowedOversize !== undefined) {
            this.allowedOversize = options.allowedOversize;
        }

        console.log('Commit blocking configuration updated:', {
            sizeLimit: this.sizeLimit,
            blockingEnabled: this.blockingEnabled,
            strictMode: this.strictMode,
            allowedOversize: this.allowedOversize
        });
    }

    /**
     * Temporarily disable blocking (for emergency commits)
     */
    temporarilyDisableBlocking(durationMinutes = 30) {
        const originalState = this.blockingEnabled;
        this.blockingEnabled = false;

        console.log(`🚫 Blocking temporarily disabled for ${durationMinutes} minutes`);

        setTimeout(() => {
            this.blockingEnabled = originalState;
            console.log('🚫 Blocking re-enabled');
        }, durationMinutes * 60 * 1000);

        return {
            disabled: true,
            duration: durationMinutes,
            reEnableTime: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
        };
    }

    /**
     * Check blocking status
     */
    getBlockingStatus() {
        return {
            enabled: this.blockingEnabled,
            sizeLimit: this.sizeLimit,
            strictMode: this.strictMode,
            allowedOversize: this.allowedOversize,
            totalBlocked: this.blockedCommits.length,
            lastBlocked: this.blockedCommits.length > 0 ?
                this.blockedCommits[this.blockedCommits.length - 1].timestamp : null
        };
    }

    /**
     * Save blocking report
     */
    saveBlockingReport() {
        const report = this.generateBlockingReport();
        const reportPath = path.join(process.cwd(), 'reports', 'commit-blocking-report.json');

        const reportsDir = path.dirname(reportPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`Blocking report saved to: ${reportPath}`);

        return reportPath;
    }

    /**
     * Test blocking system
     */
    async testBlockingSystem() {
        console.log('🧪 Testing commit blocking system...');

        const testResults = {
            preCommitHook: false,
            validationLogic: false,
            reporting: false,
            configuration: false
        };

        // Test 1: Pre-commit hook exists and is executable
        const preCommitPath = path.join(process.cwd(), '.husky', 'pre-commit');
        if (fs.existsSync(preCommitPath)) {
            try {
                fs.accessSync(preCommitPath, fs.constants.F_OK | fs.constants.X_OK);
                testResults.preCommitHook = true;
                console.log('✅ Pre-commit hook is properly installed');
            } catch (error) {
                console.log('❌ Pre-commit hook is not executable');
            }
        } else {
            console.log('❌ Pre-commit hook not found');
        }

        // Test 2: Validation logic
        const testFile = path.join(process.cwd(), 'test-file-size.js');
        const testContent = 'line\n'.repeat(350); // 350 lines
        fs.writeFileSync(testFile, testContent);

        try {
            const validation = await this.validateFile(testFile);
            if (validation.critical && !validation.valid) {
                testResults.validationLogic = true;
                console.log('✅ Validation logic working correctly');
            } else {
                console.log('❌ Validation logic not working');
            }
        } catch (error) {
            console.log('❌ Validation test failed:', error.message);
        } finally {
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
        }

        // Test 3: Reporting
        try {
            this.saveBlockingReport();
            testResults.reporting = true;
            console.log('✅ Reporting system working');
        } catch (error) {
            console.log('❌ Reporting system failed:', error.message);
        }

        // Test 4: Configuration
        const originalLimit = this.sizeLimit;
        this.configureBlocking({ sizeLimit: 250 });
        if (this.sizeLimit === 250) {
            this.configureBlocking({ sizeLimit: originalLimit }); // Restore
            testResults.configuration = true;
            console.log('✅ Configuration system working');
        } else {
            console.log('❌ Configuration system not working');
        }

        const passedTests = Object.values(testResults).filter(Boolean).length;
        const totalTests = Object.keys(testResults).length;

        console.log(`\nTest Results: ${passedTests}/${totalTests} tests passed`);

        return {
            passed: passedTests === totalTests,
            results: testResults,
            summary: `${passedTests}/${totalTests} tests passed`
        };
    }
}

// CLI interface
if (require.main === module) {
    const blocker = new CommitBlocker();

    const command = process.argv[2];

    switch (command) {
        case 'init':
            blocker.initialize().then(() => {
                console.log('✅ Commit blocking system initialized');
                process.exit(0);
            }).catch(error => {
                console.error('❌ Initialization failed:', error);
                process.exit(1);
            });
            break;

        case 'validate':
            blocker.validatePreCommit().then(result => {
                if (result.blocked) {
                    console.log('❌ Commit blocked due to file size violations');
                    process.exit(1);
                } else {
                    console.log('✅ Commit validation passed');
                    process.exit(0);
                }
            });
            break;

        case 'status':
            const status = blocker.getBlockingStatus();
            console.log('🚫 Commit Blocking Status:');
            console.log(`Enabled: ${status.enabled}`);
            console.log(`Size Limit: ${status.sizeLimit} lines`);
            console.log(`Strict Mode: ${status.strictMode}`);
            console.log(`Allowed Oversize: ${status.allowedOversize} lines`);
            console.log(`Total Blocked Commits: ${status.totalBlocked}`);
            if (status.lastBlocked) {
                console.log(`Last Blocked: ${status.lastBlocked}`);
            }
            break;

        case 'report':
            blocker.saveBlockingReport();
            break;

        case 'test':
            blocker.testBlockingSystem().then(result => {
                console.log(`\n${result.passed ? '✅' : '❌'} System test ${result.passed ? 'passed' : 'failed'}`);
                process.exit(result.passed ? 0 : 1);
            });
            break;

        case 'disable':
            const duration = parseInt(process.argv[3]) || 30;
            blocker.temporarilyDisableBlocking(duration);
            break;

        default:
            console.log('Usage: node commit-blocker.js <command>');
            console.log('Commands:');
            console.log('  init     - Initialize the commit blocking system');
            console.log('  validate - Run validation (used by pre-commit hook)');
            console.log('  status   - Show blocking system status');
            console.log('  report   - Generate blocking report');
            console.log('  test     - Test the blocking system');
            console.log('  disable [minutes] - Temporarily disable blocking');
            process.exit(1);
    }
}

module.exports = CommitBlocker;