#!/usr/bin/env node

/**
 * Conventional Commit Validation System
 * Validates commit messages against conventional commit standards
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ConventionalCommitValidator {
    constructor() {
        this.conventionalTypes = [
            'feat',     // A new feature
            'fix',      // A bug fix
            'docs',     // Documentation only changes
            'style',    // Changes that do not affect the meaning of the code
            'refactor', // A code change that neither fixes a bug nor adds a feature
            'perf',     // A code change that improves performance
            'test',     // Adding missing tests or correcting existing tests
            'chore',    // Changes to the build process or auxiliary tools
            'ci',       // Changes to CI configuration files and scripts
            'build',    // Changes that affect the build system or external dependencies
            'revert'    // Reverts a previous commit
        ];

        this.validationRules = {
            type: {
                required: true,
                pattern: new RegExp(`^(${this.conventionalTypes.join('|')})`),
                description: 'Commit type must be one of: ' + this.conventionalTypes.join(', ')
            },
            scope: {
                required: false,
                pattern: /^\w+\([^)]+\):/,
                description: 'Scope should be in parentheses after type (optional)'
            },
            subject: {
                required: true,
                pattern: /:\s*\w+/,
                minLength: 10,
                maxLength: 72,
                description: 'Subject must be present and between 10-72 characters'
            },
            body: {
                required: false,
                pattern: /\n\n[\s\S]+/,
                description: 'Body should be separated by blank line (optional)'
            },
            footer: {
                required: false,
                pattern: /\n\n(BREAKING CHANGE|Closes|Fixes|Refs?):/m,
                description: 'Footer for breaking changes or issue references (optional)'
            }
        };

        this.violations = [];
        this.suggestions = [];
    }

    /**
     * Validate a commit message
     */
    validateCommitMessage(message, options = {}) {
        this.violations = [];
        this.suggestions = [];

        if (!message || message.trim().length === 0) {
            this.addViolation('empty', 'Commit message cannot be empty');
            return this.getValidationResult();
        }

        const lines = message.trim().split('\n');
        const subject = lines[0];

        // Validate subject line
        this.validateSubject(subject);

        // Validate body if present
        if (lines.length > 1) {
            this.validateBody(lines.slice(1));
        }

        // Check for common issues
        this.checkCommonIssues(message);

        // Generate suggestions
        this.generateSuggestions(message);

        return this.getValidationResult();
    }

    /**
     * Validate subject line
     */
    validateSubject(subject) {
        // Check type
        const typeMatch = subject.match(/^(\w+)/);
        if (!typeMatch) {
            this.addViolation('type', 'Commit message must start with a type');
            return;
        }

        const type = typeMatch[1];
        if (!this.conventionalTypes.includes(type)) {
            this.addViolation('type', `Invalid type '${type}'. Must be one of: ${this.conventionalTypes.join(', ')}`);
        }

        // Check for colon separator
        if (!subject.includes(':')) {
            this.addViolation('separator', 'Subject must contain a colon (:) separator');
        }

        // Check subject length
        const subjectAfterColon = subject.split(':')[1]?.trim() || '';
        if (subjectAfterColon.length < 10) {
            this.addViolation('length', 'Subject must be at least 10 characters long');
        }
        if (subjectAfterColon.length > 72) {
            this.addViolation('length', 'Subject must not exceed 72 characters');
        }

        // Check for imperative mood
        if (!this.isImperative(subjectAfterColon)) {
            this.suggestions.push('Use imperative mood in subject (e.g., "Add feature" not "Added feature")');
        }

        // Check for starting capital
        if (subjectAfterColon && subjectAfterColon[0] === subjectAfterColon[0].toUpperCase()) {
            this.suggestions.push('Subject should not start with a capital letter');
        }
    }

    /**
     * Validate body
     */
    validateBody(bodyLines) {
        const body = bodyLines.join('\n');

        // Check for blank line after subject
        if (bodyLines.length > 0 && bodyLines[0].trim().length > 0) {
            this.addViolation('body', 'Body must be separated from subject by a blank line');
        }

        // Check body length
        const bodyContent = bodyLines.filter(line => line.trim().length > 0);
        if (bodyContent.length > 0 && bodyContent.join('\n').length > 1000) {
            this.addViolation('body', 'Body should not exceed 1000 characters');
        }
    }

    /**
     * Check for common issues
     */
    checkCommonIssues(message) {
        const lowerMessage = message.toLowerCase();

        // Check for WIP commits
        if (lowerMessage.includes('wip') || lowerMessage.includes('work in progress')) {
            this.addViolation('wip', 'Avoid WIP commits - complete work before committing');
        }

        // Check for merge commits
        if (lowerMessage.includes('merge') && lowerMessage.includes('branch')) {
            this.addViolation('merge', 'Merge commits should have descriptive messages');
        }

        // Check for fixup commits
        if (lowerMessage.startsWith('fixup!') || lowerMessage.startsWith('squash!')) {
            this.addViolation('fixup', 'Fixup commits should be squashed before pushing');
        }

        // Check for trailing punctuation
        const subject = message.split('\n')[0];
        if (subject.endsWith('.') || subject.endsWith('!') || subject.endsWith('?')) {
            this.addViolation('punctuation', 'Subject should not end with punctuation');
        }
    }

    /**
     * Generate suggestions for improvement
     */
    generateSuggestions(message) {
        const subject = message.split('\n')[0];

        // Suggest scope if not present
        if (!subject.includes('(') && subject.includes(':')) {
            const type = subject.split(':')[0];
            this.suggestions.push(`Consider adding a scope: ${type}(scope): ${subject.split(':')[1].trim()}`);
        }

        // Suggest breaking change footer
        if (message.toLowerCase().includes('breaking') && !message.includes('BREAKING CHANGE:')) {
            this.suggestions.push('Add BREAKING CHANGE: footer for breaking changes');
        }

        // Suggest issue references
        if (!message.includes('Closes #') && !message.includes('Fixes #') && !message.includes('Refs #')) {
            this.suggestions.push('Consider referencing issues with Closes #123, Fixes #123, or Refs #123');
        }
    }

    /**
     * Check if text uses imperative mood
     */
    isImperative(text) {
        const imperativeWords = [
            'add', 'update', 'fix', 'remove', 'change', 'refactor', 'improve',
            'create', 'delete', 'move', 'rename', 'merge', 'revert', 'implement'
        ];

        const firstWord = text.toLowerCase().split(' ')[0];
        return imperativeWords.includes(firstWord);
    }

    /**
     * Add violation
     */
    addViolation(rule, message) {
        this.violations.push({
            rule: rule,
            message: message,
            severity: this.getSeverity(rule)
        });
    }

    /**
     * Get severity for rule
     */
    getSeverity(rule) {
        const severityMap = {
            'empty': 'error',
            'type': 'error',
            'separator': 'error',
            'length': 'warning',
            'body': 'warning',
            'wip': 'error',
            'merge': 'warning',
            'fixup': 'error',
            'punctuation': 'warning'
        };
        return severityMap[rule] || 'warning';
    }

    /**
     * Get validation result
     */
    getValidationResult() {
        const errors = this.violations.filter(v => v.severity === 'error');
        const warnings = this.violations.filter(v => v.severity === 'warning');

        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings,
            suggestions: this.suggestions,
            score: this.calculateScore(errors, warnings)
        };
    }

    /**
     * Calculate validation score
     */
    calculateScore(errors, warnings) {
        let score = 100;
        score -= errors.length * 20; // 20 points per error
        score -= warnings.length * 5;  // 5 points per warning
        return Math.max(0, score);
    }

    /**
     * Validate recent commits
     */
    validateRecentCommits(count = 10) {
        try {
            const gitLog = execSync(`git log --oneline -${count}`, { encoding: 'utf8' });
            const commits = gitLog.trim().split('\n');

            const results = [];
            for (const commit of commits) {
                const hash = commit.split(' ')[0];
                const message = commit.substring(hash.length + 1);

                const validation = this.validateCommitMessage(message);
                results.push({
                    hash: hash,
                    message: message,
                    validation: validation
                });
            }

            return results;
        } catch (error) {
            console.error('Failed to get git log:', error.message);
            return [];
        }
    }

    /**
     * Generate commit message template
     */
    generateCommitTemplate(type, scope = '', subject = '', body = '', footer = '') {
        let template = `${type}`;

        if (scope) {
            template += `(${scope})`;
        }

        template += `: ${subject}`;

        if (body) {
            template += `\n\n${body}`;
        }

        if (footer) {
            template += `\n\n${footer}`;
        }

        return template;
    }

    /**
     * Get available commit types
     */
    getAvailableTypes() {
        return this.conventionalTypes.map(type => ({
            type: type,
            description: this.getTypeDescription(type)
        }));
    }

    /**
     * Get description for commit type
     */
    getTypeDescription(type) {
        const descriptions = {
            'feat': 'A new feature',
            'fix': 'A bug fix',
            'docs': 'Documentation only changes',
            'style': 'Changes that do not affect the meaning of the code',
            'refactor': 'A code change that neither fixes a bug nor adds a feature',
            'perf': 'A code change that improves performance',
            'test': 'Adding missing tests or correcting existing tests',
            'chore': 'Changes to the build process or auxiliary tools',
            'ci': 'Changes to CI configuration files and scripts',
            'build': 'Changes that affect the build system or external dependencies',
            'revert': 'Reverts a previous commit'
        };
        return descriptions[type] || 'Unknown type';
    }

    /**
     * Save validation report
     */
    saveValidationReport(results, filePath = 'conventional-commit-validation-report.json') {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalCommits: results.length,
                validCommits: results.filter(r => r.validation.valid).length,
                invalidCommits: results.filter(r => !r.validation.valid).length,
                averageScore: results.reduce((sum, r) => sum + r.validation.score, 0) / results.length
            },
            results: results,
            recommendations: this.generateRecommendations(results)
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`Conventional commit validation report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(results) {
        const recommendations = [];
        const invalidCommits = results.filter(r => !r.validation.valid);

        if (invalidCommits.length > 0) {
            recommendations.push(`${invalidCommits.length} commits need conventional commit format`);
        }

        const commonErrors = this.getCommonErrors(results);
        commonErrors.forEach(error => {
            recommendations.push(`Common issue: ${error.message} (${error.count} occurrences)`);
        });

        if (recommendations.length === 0) {
            recommendations.push('All commits follow conventional commit standards');
        }

        return recommendations;
    }

    /**
     * Get common errors
     */
    getCommonErrors(results) {
        const errorCounts = {};

        results.forEach(result => {
            result.validation.errors.forEach(error => {
                const key = error.message;
                errorCounts[key] = (errorCounts[key] || 0) + 1;
            });
        });

        return Object.entries(errorCounts)
            .map(([message, count]) => ({ message, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }
}

// CLI interface
if (require.main === module) {
    const validator = new ConventionalCommitValidator();

    const command = process.argv[2];

    switch (command) {
        case 'validate':
            const message = process.argv[3];
            if (!message) {
                console.log('Usage: node conventional-commit-validator.js validate "commit message"');
                process.exit(1);
            }

            const result = validator.validateCommitMessage(message);
            console.log('\n🔍 Conventional Commit Validation:');
            console.log(`Valid: ${result.valid}`);
            console.log(`Score: ${result.score}/100`);

            if (result.errors.length > 0) {
                console.log('\n❌ Errors:');
                result.errors.forEach(error => console.log(`  • ${error.message}`));
            }

            if (result.warnings.length > 0) {
                console.log('\n⚠️  Warnings:');
                result.warnings.forEach(warning => console.log(`  • ${warning.message}`));
            }

            if (result.suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                result.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
            }
            break;

        case 'check-recent':
            const count = parseInt(process.argv[3]) || 10;
            const results = validator.validateRecentCommits(count);

            console.log(`\n🔍 Validating last ${count} commits:`);
            results.forEach(result => {
                const status = result.validation.valid ? '✅' : '❌';
                console.log(`${status} ${result.hash}: ${result.message.substring(0, 60)}${result.message.length > 60 ? '...' : ''}`);
                if (!result.validation.valid) {
                    result.validation.errors.forEach(error => {
                        console.log(`    • ${error.message}`);
                    });
                }
            });

            validator.saveValidationReport(results);
            break;

        case 'types':
            console.log('\n📋 Available Commit Types:');
            validator.getAvailableTypes().forEach(type => {
                console.log(`  ${type.type}: ${type.description}`);
            });
            break;

        case 'template':
            const type = process.argv[3];
            const scope = process.argv[4] || '';
            const subject = process.argv[5] || 'Brief description of changes';

            if (!type) {
                console.log('Usage: node conventional-commit-validator.js template <type> [scope] [subject]');
                process.exit(1);
            }

            const template = validator.generateCommitTemplate(type, scope, subject);
            console.log('\n📝 Commit Message Template:');
            console.log(template);
            break;

        default:
            console.log('Usage: node conventional-commit-validator.js <command> [args]');
            console.log('Commands:');
            console.log('  validate <message>    - Validate a commit message');
            console.log('  check-recent [count]  - Check recent commits (default: 10)');
            console.log('  types                 - List available commit types');
            console.log('  template <type> [scope] [subject] - Generate commit template');
            process.exit(1);
    }
}

module.exports = ConventionalCommitValidator;