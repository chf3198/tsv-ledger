#!/usr/bin/env node

/**
 * Branching Strategy Enforcement System
 * Enforces proper branching strategies and naming conventions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BranchingStrategyEnforcer {
    constructor() {
        this.branchingStrategies = {
            'git-flow': {
                name: 'Git Flow',
                description: 'Feature branches, develop/main branches, release/hotfix branches',
                patterns: {
                    main: /^main$|^master$/,
                    develop: /^develop$/,
                    feature: /^feature\/.+/,
                    release: /^release\/.+/,
                    hotfix: /^hotfix\/.+/,
                    bugfix: /^bugfix\/.+/
                },
                rules: {
                    allowDirectPushToMain: false,
                    allowDirectPushToDevelop: false,
                    requirePullRequests: true,
                    requireBranchNaming: true
                }
            },
            'github-flow': {
                name: 'GitHub Flow',
                description: 'Main branch with feature branches and pull requests',
                patterns: {
                    main: /^main$|^master$/,
                    feature: /^.+/, // Any branch name is allowed for features
                    temporary: /^(temp|tmp|work|draft)\//
                },
                rules: {
                    allowDirectPushToMain: false,
                    requirePullRequests: true,
                    requireBranchNaming: false // More flexible naming
                }
            },
            'trunk-based': {
                name: 'Trunk-Based Development',
                description: 'All work happens on main branch with short-lived branches',
                patterns: {
                    main: /^main$|^master$|^trunk$/,
                    shortLived: /^.+/, // Any branch, but should be short-lived
                },
                rules: {
                    allowDirectPushToMain: true, // In controlled environments
                    requirePullRequests: false, // Can push directly but with reviews
                    maxBranchAge: 24 * 60 * 60 * 1000, // 24 hours
                    requireFrequentMerges: true
                }
            }
        };

        this.currentStrategy = 'github-flow'; // Default strategy
        this.branchValidationRules = {
            maxLength: 50,
            allowedChars: /^[a-zA-Z0-9\-_\/]+$/,
            noSpecialChars: /^[^!@#$%^&*()+=[\]{}|\\:;"'<>,.?~`]+$/,
            noSpaces: /^\S*$/,
            meaningfulNames: this.validateMeaningfulName.bind(this)
        };
    }

    /**
     * Set branching strategy
     */
    setStrategy(strategyName) {
        if (this.branchingStrategies[strategyName]) {
            this.currentStrategy = strategyName;
            console.log(`Branching strategy set to: ${this.branchingStrategies[strategyName].name}`);
            return true;
        } else {
            console.error(`Unknown strategy: ${strategyName}`);
            return false;
        }
    }

    /**
     * Validate branch name
     */
    validateBranchName(branchName, options = {}) {
        const strategy = this.branchingStrategies[this.currentStrategy];
        const violations = [];
        const suggestions = [];

        // Check if branch name matches strategy patterns
        const branchType = this.identifyBranchType(branchName, strategy);

        if (!branchType) {
            violations.push({
                rule: 'strategy-compliance',
                message: `Branch name '${branchName}' does not match ${strategy.name} strategy patterns`,
                severity: 'error'
            });

            suggestions.push(`Use ${strategy.name} naming pattern: ${this.getStrategyExamples(strategy)}`);
        }

        // Apply general validation rules
        const generalViolations = this.validateGeneralRules(branchName);
        violations.push(...generalViolations);

        // Generate suggestions for improvement
        if (violations.length > 0) {
            suggestions.push(...this.generateImprovementSuggestions(branchName, violations));
        }

        // Check branch age if applicable
        if (strategy.rules.maxBranchAge) {
            const ageCheck = this.checkBranchAge(branchName);
            if (ageCheck.violation) {
                violations.push(ageCheck.violation);
            }
        }

        return {
            valid: violations.filter(v => v.severity === 'error').length === 0,
            branchType: branchType,
            violations: violations,
            suggestions: suggestions,
            strategy: strategy.name,
            score: this.calculateValidationScore(violations)
        };
    }

    /**
     * Identify branch type based on strategy
     */
    identifyBranchType(branchName, strategy) {
        for (const [type, pattern] of Object.entries(strategy.patterns)) {
            if (pattern.test(branchName)) {
                return type;
            }
        }
        return null;
    }

    /**
     * Validate general branch naming rules
     */
    validateGeneralRules(branchName) {
        const violations = [];

        // Length check
        if (branchName.length > this.branchValidationRules.maxLength) {
            violations.push({
                rule: 'length',
                message: `Branch name too long (${branchName.length} chars, max ${this.branchValidationRules.maxLength})`,
                severity: 'warning'
            });
        }

        // Character validation
        if (!this.branchValidationRules.allowedChars.test(branchName)) {
            violations.push({
                rule: 'characters',
                message: 'Branch name contains invalid characters',
                severity: 'error'
            });
        }

        if (!this.branchValidationRules.noSpecialChars.test(branchName)) {
            violations.push({
                rule: 'special-chars',
                message: 'Branch name contains special characters',
                severity: 'error'
            });
        }

        if (!this.branchValidationRules.noSpaces.test(branchName)) {
            violations.push({
                rule: 'spaces',
                message: 'Branch name cannot contain spaces',
                severity: 'error'
            });
        }

        // Meaningful name check
        if (!this.branchValidationRules.meaningfulNames(branchName)) {
            violations.push({
                rule: 'meaningful',
                message: 'Branch name should be descriptive and meaningful',
                severity: 'warning'
            });
        }

        return violations;
    }

    /**
     * Validate meaningful branch name
     */
    validateMeaningfulName(branchName) {
        // Check for meaningful patterns
        const meaningfulPatterns = [
            /\w+-\w+/, // Contains hyphen (feature-name)
            /\w+\/\w+/, // Contains slash (feature/name)
            /\d+/, // Contains numbers (issue numbers)
            /[a-zA-Z]{3,}/ // At least 3 letters
        ];

        // Avoid meaningless names
        const meaninglessPatterns = [
            /^test$/, /^tmp$/, /^temp$/, /^work$/, /^branch$/,
            /^new$/, /^fix$/, /^update$/, /^change$/
        ];

        // Check if matches meaningless patterns
        if (meaninglessPatterns.some(pattern => pattern.test(branchName))) {
            return false;
        }

        // Check if matches meaningful patterns
        return meaningfulPatterns.some(pattern => pattern.test(branchName));
    }

    /**
     * Generate improvement suggestions
     */
    generateImprovementSuggestions(branchName, violations) {
        const suggestions = [];

        if (violations.some(v => v.rule === 'characters' || v.rule === 'special-chars')) {
            suggestions.push('Use only letters, numbers, hyphens, underscores, and forward slashes');
        }

        if (violations.some(v => v.rule === 'spaces')) {
            suggestions.push('Replace spaces with hyphens: ' + branchName.replace(/\s+/g, '-'));
        }

        if (violations.some(v => v.rule === 'length')) {
            suggestions.push('Shorten branch name to under 50 characters');
        }

        if (violations.some(v => v.rule === 'meaningful')) {
            suggestions.push('Use descriptive names like: feature/user-auth, bugfix/login-error, refactor/api-cleanup');
        }

        if (violations.some(v => v.rule === 'strategy-compliance')) {
            const strategy = this.branchingStrategies[this.currentStrategy];
            suggestions.push(`Follow ${strategy.name}: ${this.getStrategyExamples(strategy)}`);
        }

        return suggestions;
    }

    /**
     * Get strategy examples
     */
    getStrategyExamples(strategy) {
        const examples = [];

        if (strategy.patterns.feature) {
            examples.push('feature/user-login');
        }
        if (strategy.patterns.bugfix) {
            examples.push('bugfix/fix-crash');
        }
        if (strategy.patterns.hotfix) {
            examples.push('hotfix/security-patch');
        }

        return examples.join(', ');
    }

    /**
     * Check branch age
     */
    checkBranchAge(branchName) {
        try {
            // Get branch creation date
            const branchDate = execSync(`git log --oneline --format="%ci" ${branchName} | tail -1`, { encoding: 'utf8' }).trim();

            if (branchDate) {
                const creationDate = new Date(branchDate);
                const age = Date.now() - creationDate.getTime();
                const maxAge = this.branchingStrategies[this.currentStrategy].rules.maxBranchAge;

                if (maxAge && age > maxAge) {
                    return {
                        violation: {
                            rule: 'age',
                            message: `Branch is too old (${Math.round(age / (24 * 60 * 60 * 1000))} days). Consider merging or deleting.`,
                            severity: 'warning'
                        }
                    };
                }
            }
        } catch (error) {
            // Branch might not exist or have commits
        }

        return {};
    }

    /**
     * Calculate validation score
     */
    calculateValidationScore(violations) {
        let score = 100;

        violations.forEach(violation => {
            if (violation.severity === 'error') {
                score -= 20;
            } else if (violation.severity === 'warning') {
                score -= 5;
            }
        });

        return Math.max(0, score);
    }

    /**
     * Validate current branch
     */
    validateCurrentBranch() {
        try {
            const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
            return this.validateBranchName(currentBranch);
        } catch (error) {
            return {
                valid: false,
                violations: [{
                    rule: 'git-error',
                    message: 'Could not determine current branch',
                    severity: 'error'
                }],
                suggestions: ['Ensure you are in a git repository']
            };
        }
    }

    /**
     * Get all branches and validate them
     */
    validateAllBranches() {
        try {
            const branches = execSync('git branch --list', { encoding: 'utf8' })
                .split('\n')
                .map(branch => branch.trim().replace(/^\*\s*/, ''))
                .filter(branch => branch && !branch.startsWith('remotes/'));

            const results = branches.map(branchName => ({
                branch: branchName,
                validation: this.validateBranchName(branchName)
            }));

            return {
                total: results.length,
                valid: results.filter(r => r.validation.valid).length,
                invalid: results.filter(r => !r.validation.valid).length,
                results: results,
                summary: this.generateBranchSummary(results)
            };
        } catch (error) {
            return {
                error: 'Could not retrieve branches',
                message: error.message
            };
        }
    }

    /**
     * Generate branch summary
     */
    generateBranchSummary(results) {
        const summary = {
            byType: {},
            violations: {},
            suggestions: new Set()
        };

        results.forEach(result => {
            const type = result.validation.branchType || 'unknown';
            summary.byType[type] = (summary.byType[type] || 0) + 1;

            result.validation.violations.forEach(violation => {
                summary.violations[violation.rule] = (summary.violations[violation.rule] || 0) + 1;
            });

            result.validation.suggestions.forEach(suggestion => {
                summary.suggestions.add(suggestion);
            });
        });

        return {
            byType: summary.byType,
            violations: summary.violations,
            suggestions: Array.from(summary.suggestions)
        };
    }

    /**
     * Suggest branch name improvements
     */
    suggestBranchName(baseName, type = 'feature') {
        const suggestions = [];

        // Clean and format the base name
        const cleanName = baseName
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s\-_]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

        // Generate different formats
        if (type === 'feature') {
            suggestions.push(`feature/${cleanName}`);
            suggestions.push(`${cleanName}`);
        } else if (type === 'bugfix') {
            suggestions.push(`bugfix/${cleanName}`);
            suggestions.push(`fix/${cleanName}`);
        } else if (type === 'hotfix') {
            suggestions.push(`hotfix/${cleanName}`);
        }

        // Add issue number if detected
        const issueMatch = baseName.match(/#?(\d+)/);
        if (issueMatch) {
            const issueNum = issueMatch[1];
            suggestions.push(`${type}/issue-${issueNum}`);
        }

        return suggestions.filter(name => name.length <= this.branchValidationRules.maxLength);
    }

    /**
     * Check if push is allowed to branch
     */
    checkPushPermission(branchName, userRole = 'developer') {
        const strategy = this.branchingStrategies[this.currentStrategy];
        const branchType = this.identifyBranchType(branchName, strategy);

        const permissions = {
            allowPush: true,
            requiresReview: false,
            message: 'Push allowed'
        };

        // Check strategy rules
        if (branchType === 'main' && !strategy.rules.allowDirectPushToMain) {
            permissions.allowPush = false;
            permissions.requiresReview = true;
            permissions.message = 'Direct pushes to main branch are not allowed. Use pull requests.';
        }

        if (branchType === 'develop' && !strategy.rules.allowDirectPushToDevelop) {
            permissions.allowPush = false;
            permissions.requiresReview = true;
            permissions.message = 'Direct pushes to develop branch are not allowed. Use pull requests.';
        }

        // Role-based permissions
        if (userRole === 'contributor' && ['main', 'develop'].includes(branchType)) {
            permissions.allowPush = false;
            permissions.requiresReview = true;
            permissions.message = 'Contributors cannot push directly to main/develop branches.';
        }

        return permissions;
    }

    /**
     * Get strategy information
     */
    getStrategyInfo(strategyName = null) {
        const strategy = this.branchingStrategies[strategyName || this.currentStrategy];

        return {
            name: strategy.name,
            description: strategy.description,
            patterns: Object.keys(strategy.patterns),
            rules: strategy.rules,
            examples: this.getStrategyExamples(strategy)
        };
    }

    /**
     * Save branch validation report
     */
    saveBranchValidationReport(results, filePath = 'branch-validation-report.json') {
        const report = {
            timestamp: new Date().toISOString(),
            strategy: this.currentStrategy,
            results: results,
            summary: results.summary || this.generateBranchSummary(results.results || [])
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`Branch validation report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }
}

// CLI interface
if (require.main === module) {
    const enforcer = new BranchingStrategyEnforcer();

    const command = process.argv[2];

    switch (command) {
        case 'validate':
            const branchName = process.argv[3];
            if (!branchName) {
                console.log('Usage: node branching-strategy-enforcer.js validate <branch-name>');
                process.exit(1);
            }

            const result = enforcer.validateBranchName(branchName);
            console.log(`\n🔍 Branch Validation: ${branchName}`);
            console.log(`Strategy: ${result.strategy}`);
            console.log(`Valid: ${result.valid}`);
            console.log(`Score: ${result.score}/100`);
            console.log(`Type: ${result.branchType || 'unknown'}`);

            if (result.violations.length > 0) {
                console.log('\n❌ Violations:');
                result.violations.forEach(v => console.log(`  • ${v.message} (${v.severity})`));
            }

            if (result.suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                result.suggestions.forEach(s => console.log(`  • ${s}`));
            }
            break;

        case 'current':
            const currentResult = enforcer.validateCurrentBranch();
            console.log('\n🔍 Current Branch Validation:');
            console.log(`Valid: ${currentResult.valid}`);
            console.log(`Score: ${currentResult.score}/100`);

            if (currentResult.violations.length > 0) {
                console.log('\n❌ Issues:');
                currentResult.violations.forEach(v => console.log(`  • ${v.message}`));
            }
            break;

        case 'all':
            const allResults = enforcer.validateAllBranches();
            console.log('\n🔍 All Branches Validation:');
            console.log(`Total branches: ${allResults.total}`);
            console.log(`Valid: ${allResults.valid}`);
            console.log(`Invalid: ${allResults.invalid}`);

            console.log('\n📊 By Type:');
            Object.entries(allResults.summary.byType).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });

            if (Object.keys(allResults.summary.violations).length > 0) {
                console.log('\n⚠️  Common Violations:');
                Object.entries(allResults.summary.violations).forEach(([rule, count]) => {
                    console.log(`  ${rule}: ${count} branches`);
                });
            }

            enforcer.saveBranchValidationReport(allResults);
            break;

        case 'suggest':
            const baseName = process.argv[3];
            const type = process.argv[4] || 'feature';

            if (!baseName) {
                console.log('Usage: node branching-strategy-enforcer.js suggest <base-name> [type]');
                process.exit(1);
            }

            const suggestions = enforcer.suggestBranchName(baseName, type);
            console.log(`\n💡 Branch Name Suggestions for "${baseName}":`);
            suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
            break;

        case 'strategy':
            const strategyName = process.argv[3];
            if (strategyName) {
                enforcer.setStrategy(strategyName);
            }

            const info = enforcer.getStrategyInfo();
            console.log(`\n📋 Current Strategy: ${info.name}`);
            console.log(`Description: ${info.description}`);
            console.log(`Patterns: ${info.patterns.join(', ')}`);
            console.log(`Examples: ${info.examples}`);
            break;

        case 'check-push':
            const branch = process.argv[3] || execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
            const permission = enforcer.checkPushPermission(branch);

            console.log(`\n🔒 Push Permission Check for "${branch}":`);
            console.log(`Allowed: ${permission.allowPush}`);
            console.log(`Requires Review: ${permission.requiresReview}`);
            console.log(`Message: ${permission.message}`);
            break;

        default:
            console.log('Usage: node branching-strategy-enforcer.js <command> [args]');
            console.log('Commands:');
            console.log('  validate <branch>    - Validate branch name');
            console.log('  current              - Validate current branch');
            console.log('  all                  - Validate all branches');
            console.log('  suggest <name> [type]- Suggest branch names');
            console.log('  strategy [name]      - Show/set branching strategy');
            console.log('  check-push [branch]  - Check push permissions');
            process.exit(1);
    }
}

module.exports = BranchingStrategyEnforcer;