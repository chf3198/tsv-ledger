#!/usr/bin/env node

/**
 * Automated Commit Message Suggestion System
 * Analyzes code changes and suggests conventional commit messages
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ConventionalCommitValidator = require('./conventional-commit-validator');

class AutomatedCommitMessageSuggester {
    constructor() {
        this.validator = new ConventionalCommitValidator();
        this.changePatterns = {
            // File additions
            added: {
                test: /\.(test|spec)\.js$/,
                type: 'test',
                scope: 'test',
                description: 'add test file'
            },
            component: {
                test: /component.*\.js$/,
                type: 'feat',
                scope: 'ui',
                description: 'add component'
            },
            config: {
                test: /(config|webpack|babel|eslint)\..*$/,
                type: 'chore',
                scope: 'config',
                description: 'add configuration'
            },

            // File modifications
            bugfix: {
                test: /(fix|bug|error|issue)/i,
                type: 'fix',
                description: 'fix bug'
            },
            feature: {
                test: /(add|implement|create|new)/i,
                type: 'feat',
                description: 'add feature'
            },
            refactor: {
                test: /(refactor|restructure|optimize|improve)/i,
                type: 'refactor',
                description: 'refactor code'
            },
            docs: {
                test: /(readme|doc|comment|javadoc)/i,
                type: 'docs',
                description: 'update documentation'
            },
            style: {
                test: /(format|style|indent|whitespace)/i,
                type: 'style',
                description: 'update code style'
            },
            perf: {
                test: /(performance|speed|optimize|cache)/i,
                type: 'perf',
                description: 'improve performance'
            },
            test: {
                test: /(test|spec|assert|expect)/i,
                type: 'test',
                description: 'add tests'
            },
            chore: {
                test: /(build|ci|deploy|package|dependency)/i,
                type: 'chore',
                description: 'update build process'
            }
        };

        this.fileTypeMappings = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.json': 'config',
            '.md': 'docs',
            '.html': 'ui',
            '.css': 'style',
            '.scss': 'style',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust'
        };
    }

    /**
     * Analyze git status and suggest commit messages
     */
    async analyzeChangesAndSuggest(options = {}) {
        console.log('🔍 Analyzing code changes for commit message suggestions...');

        const changes = this.getGitStatus();
        if (changes.length === 0) {
            return {
                suggestions: [],
                message: 'No changes detected in working directory'
            };
        }

        const analysis = this.analyzeChanges(changes);
        const suggestions = this.generateSuggestions(analysis, options);

        return {
            changes: changes,
            analysis: analysis,
            suggestions: suggestions,
            recommended: suggestions[0] // Best suggestion first
        };
    }

    /**
     * Get git status
     */
    getGitStatus() {
        try {
            const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
            const lines = statusOutput.trim().split('\n').filter(line => line.trim());

            return lines.map(line => {
                const status = line.substring(0, 2);
                const filePath = line.substring(3);

                return {
                    status: status,
                    file: filePath,
                    staged: status[0] !== ' ',
                    type: this.getChangeType(status),
                    extension: path.extname(filePath)
                };
            });
        } catch (error) {
            console.error('Failed to get git status:', error.message);
            return [];
        }
    }

    /**
     * Get change type from git status
     */
    getChangeType(status) {
        const statusCode = status.trim();
        if (statusCode === 'A') return 'added';
        if (statusCode === 'M') return 'modified';
        if (statusCode === 'D') return 'deleted';
        if (statusCode === 'R') return 'renamed';
        if (statusCode === 'C') return 'copied';
        if (statusCode === 'U') return 'updated';
        if (statusCode === '??') return 'untracked';
        return 'modified'; // default
    }

    /**
     * Analyze changes to understand the scope and type
     */
    analyzeChanges(changes) {
        const analysis = {
            totalFiles: changes.length,
            added: 0,
            modified: 0,
            deleted: 0,
            renamed: 0,
            fileTypes: new Map(),
            directories: new Set(),
            patterns: new Map(),
            scopes: new Set(),
            risk: 'low'
        };

        changes.forEach(change => {
            // Count change types
            analysis[change.type]++;

            // Track file types
            const fileType = this.fileTypeMappings[change.extension] || 'unknown';
            analysis.fileTypes.set(fileType, (analysis.fileTypes.get(fileType) || 0) + 1);

            // Track directories
            const dir = path.dirname(change.file);
            if (dir !== '.') {
                analysis.directories.add(dir);
            }

            // Analyze file content for patterns
            if (change.type === 'modified' || change.type === 'added') {
                const contentPatterns = this.analyzeFileContent(change.file);
                contentPatterns.forEach(pattern => {
                    analysis.patterns.set(pattern, (analysis.patterns.get(pattern) || 0) + 1);
                });
            }

            // Determine scope
            const scope = this.determineScope(change.file);
            if (scope) {
                analysis.scopes.add(scope);
            }
        });

        // Determine risk level
        analysis.risk = this.calculateRisk(analysis);

        return analysis;
    }

    /**
     * Analyze file content for change patterns
     */
    analyzeFileContent(filePath) {
        const patterns = [];

        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');

                // Check for common change indicators
                const contentStr = content.toLowerCase();

                if (contentStr.includes('function') && contentStr.includes('return')) {
                    patterns.push('functionality');
                }
                if (contentStr.includes('class') || contentStr.includes('constructor')) {
                    patterns.push('class');
                }
                if (contentStr.includes('import') || contentStr.includes('require')) {
                    patterns.push('dependency');
                }
                if (contentStr.includes('test') || contentStr.includes('describe') || contentStr.includes('it(')) {
                    patterns.push('testing');
                }
                if (contentStr.includes('error') || contentStr.includes('catch') || contentStr.includes('throw')) {
                    patterns.push('error-handling');
                }
                if (contentStr.includes('async') || contentStr.includes('await') || contentStr.includes('promise')) {
                    patterns.push('async');
                }
                if (contentStr.includes('config') || contentStr.includes('setting')) {
                    patterns.push('configuration');
                }
            }
        } catch (error) {
            // Skip files that can't be read
        }

        return patterns;
    }

    /**
     * Determine scope from file path
     */
    determineScope(filePath) {
        const parts = filePath.split(path.sep);

        // Check for common scope patterns
        if (parts.includes('src')) {
            const srcIndex = parts.indexOf('src');
            if (parts.length > srcIndex + 1) {
                return parts[srcIndex + 1];
            }
        }

        if (parts.includes('components')) return 'ui';
        if (parts.includes('utils') || parts.includes('helpers')) return 'utils';
        if (parts.includes('tests') || parts.includes('test')) return 'test';
        if (parts.includes('docs')) return 'docs';
        if (parts.includes('config')) return 'config';

        // Use first directory as scope
        if (parts.length > 1 && parts[0] !== '.') {
            return parts[0];
        }

        return null;
    }

    /**
     * Calculate risk level of changes
     */
    calculateRisk(analysis) {
        let riskScore = 0;

        // High risk factors
        if (analysis.deleted > 0) riskScore += 2;
        if (analysis.renamed > 0) riskScore += 1;
        if (analysis.directories.size > 3) riskScore += 1;
        if (analysis.totalFiles > 10) riskScore += 1;

        // Medium risk factors
        if (analysis.modified > 5) riskScore += 1;
        if (analysis.scopes.size > 2) riskScore += 1;

        if (riskScore >= 4) return 'high';
        if (riskScore >= 2) return 'medium';
        return 'low';
    }

    /**
     * Generate commit message suggestions
     */
    generateSuggestions(analysis, options = {}) {
        const suggestions = [];
        const maxSuggestions = options.maxSuggestions || 5;

        // Primary suggestion based on change analysis
        const primarySuggestion = this.createPrimarySuggestion(analysis);
        if (primarySuggestion) {
            suggestions.push(primarySuggestion);
        }

        // Alternative suggestions with different types
        const alternativeTypes = this.getAlternativeTypes(analysis);
        alternativeTypes.forEach(typeInfo => {
            const suggestion = this.createSuggestion(analysis, typeInfo);
            if (suggestion && !this.isDuplicate(suggestions, suggestion)) {
                suggestions.push(suggestion);
            }
        });

        // Add scope variations
        if (analysis.scopes.size > 0) {
            const scope = Array.from(analysis.scopes)[0];
            const scopedSuggestion = this.createScopedSuggestion(analysis, scope);
            if (scopedSuggestion && !this.isDuplicate(suggestions, scopedSuggestion)) {
                suggestions.push(scopedSuggestion);
            }
        }

        return suggestions.slice(0, maxSuggestions);
    }

    /**
     * Create primary suggestion
     */
    createPrimarySuggestion(analysis) {
        const type = this.determinePrimaryType(analysis);
        const scope = analysis.scopes.size === 1 ? Array.from(analysis.scopes)[0] : null;
        const description = this.generateDescription(analysis, type);

        return this.createSuggestion(analysis, { type, scope, description });
    }

    /**
     * Determine primary commit type
     */
    determinePrimaryType(analysis) {
        // Priority order for determining type
        if (analysis.added > 0 && analysis.modified === 0) {
            return 'feat'; // Pure additions are features
        }

        if (analysis.deleted > analysis.added) {
            return 'refactor'; // Major deletions are likely refactoring
        }

        // Check patterns for type hints
        const patternCounts = {};
        analysis.patterns.forEach((count, pattern) => {
            const type = this.getTypeFromPattern(pattern);
            if (type) {
                patternCounts[type] = (patternCounts[type] || 0) + count;
            }
        });

        // Return most common type from patterns
        const sortedTypes = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]);
        if (sortedTypes.length > 0) {
            return sortedTypes[0][0];
        }

        // Default based on change distribution
        if (analysis.modified > analysis.added * 2) {
            return 'refactor';
        } else if (analysis.added > 0) {
            return 'feat';
        } else {
            return 'fix';
        }
    }

    /**
     * Get commit type from content pattern
     */
    getTypeFromPattern(pattern) {
        const patternMap = {
            'testing': 'test',
            'error-handling': 'fix',
            'configuration': 'chore',
            'documentation': 'docs',
            'functionality': 'feat',
            'class': 'refactor',
            'dependency': 'chore',
            'async': 'feat'
        };
        return patternMap[pattern];
    }

    /**
     * Generate description based on analysis
     */
    generateDescription(analysis, type) {
        const descriptions = {
            'feat': [
                'add new functionality',
                'implement new feature',
                'add feature'
            ],
            'fix': [
                'fix bug',
                'resolve issue',
                'correct error'
            ],
            'refactor': [
                'refactor code',
                'restructure implementation',
                'improve code organization'
            ],
            'test': [
                'add tests',
                'update test coverage',
                'fix test'
            ],
            'docs': [
                'update documentation',
                'add documentation',
                'improve docs'
            ],
            'chore': [
                'update configuration',
                'modify build process',
                'update dependencies'
            ],
            'style': [
                'format code',
                'update code style',
                'fix formatting'
            ],
            'perf': [
                'improve performance',
                'optimize code',
                'enhance speed'
            ]
        };

        const typeDescriptions = descriptions[type] || ['update code'];
        return typeDescriptions[0]; // Use first description as default
    }

    /**
     * Get alternative commit types
     */
    getAlternativeTypes(analysis) {
        const alternatives = [];

        // Add common alternatives based on change patterns
        if (analysis.patterns.has('testing')) {
            alternatives.push({ type: 'test', description: 'add tests' });
        }
        if (analysis.patterns.has('documentation')) {
            alternatives.push({ type: 'docs', description: 'update documentation' });
        }
        if (analysis.patterns.has('configuration')) {
            alternatives.push({ type: 'chore', description: 'update configuration' });
        }

        // Add type variations
        const primaryType = this.determinePrimaryType(analysis);
        if (primaryType === 'feat') {
            alternatives.push({ type: 'refactor', description: 'refactor implementation' });
        } else if (primaryType === 'fix') {
            alternatives.push({ type: 'feat', description: 'add fix with new functionality' });
        }

        return alternatives;
    }

    /**
     * Create a commit message suggestion
     */
    createSuggestion(analysis, typeInfo) {
        const { type, scope, description } = typeInfo;

        let subject = `${type}`;
        if (scope) {
            subject += `(${scope})`;
        }
        subject += `: ${description}`;

        // Add risk indicator
        const riskEmoji = analysis.risk === 'high' ? '⚠️' : analysis.risk === 'medium' ? '🟡' : '🟢';

        return {
            message: subject,
            type: type,
            scope: scope,
            description: description,
            risk: analysis.risk,
            riskEmoji: riskEmoji,
            confidence: this.calculateConfidence(analysis, typeInfo),
            details: {
                filesChanged: analysis.totalFiles,
                directories: Array.from(analysis.directories),
                patterns: Array.from(analysis.patterns.keys())
            }
        };
    }

    /**
     * Create scoped suggestion
     */
    createScopedSuggestion(analysis, scope) {
        const type = this.determinePrimaryType(analysis);
        const description = this.generateDescription(analysis, type);

        return this.createSuggestion(analysis, { type, scope, description });
    }

    /**
     * Calculate confidence score for suggestion
     */
    calculateConfidence(analysis, typeInfo) {
        let confidence = 50; // Base confidence

        // Increase confidence based on pattern matches
        if (analysis.patterns.has(typeInfo.type)) {
            confidence += 20;
        }

        // Increase confidence for single scope
        if (analysis.scopes.size === 1) {
            confidence += 15;
        }

        // Increase confidence for focused changes
        if (analysis.totalFiles <= 3) {
            confidence += 10;
        }

        // Decrease confidence for mixed changes
        if (analysis.scopes.size > 2) {
            confidence -= 10;
        }

        return Math.min(100, Math.max(0, confidence));
    }

    /**
     * Check if suggestion is duplicate
     */
    isDuplicate(existingSuggestions, newSuggestion) {
        return existingSuggestions.some(s =>
            s.message === newSuggestion.message ||
            (s.type === newSuggestion.type && s.scope === newSuggestion.scope)
        );
    }

    /**
     * Validate suggestion using conventional commit validator
     */
    validateSuggestion(suggestion) {
        return this.validator.validateCommitMessage(suggestion.message);
    }

    /**
     * Get suggestions with validation
     */
    async getValidatedSuggestions(options = {}) {
        const result = await this.analyzeChangesAndSuggest(options);

        // Validate all suggestions
        result.suggestions.forEach(suggestion => {
            suggestion.validation = this.validateSuggestion(suggestion);
        });

        return result;
    }

    /**
     * Save suggestions report
     */
    saveSuggestionsReport(result, filePath = 'commit-message-suggestions-report.json') {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: result.analysis,
            suggestions: result.suggestions,
            recommended: result.recommended,
            summary: {
                totalSuggestions: result.suggestions.length,
                riskLevel: result.analysis.risk,
                confidenceRange: result.suggestions.length > 0 ?
                    `${Math.min(...result.suggestions.map(s => s.confidence))}-${Math.max(...result.suggestions.map(s => s.confidence))}` :
                    'N/A'
            }
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`Commit message suggestions report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }
}

// CLI interface
if (require.main === module) {
    const suggester = new AutomatedCommitMessageSuggester();

    const command = process.argv[2];

    switch (command) {
        case 'suggest':
            suggester.getValidatedSuggestions().then(result => {
                console.log('\n💡 Commit Message Suggestions:');
                console.log(`Changes detected: ${result.analysis.totalFiles} files`);
                console.log(`Risk level: ${result.analysis.risk}`);

                result.suggestions.forEach((suggestion, index) => {
                    const primary = index === 0 ? ' (RECOMMENDED)' : '';
                    console.log(`\n${index + 1}. ${suggestion.riskEmoji} ${suggestion.message}${primary}`);
                    console.log(`   Confidence: ${suggestion.confidence}%`);
                    console.log(`   Files: ${suggestion.details.filesChanged}`);
                    if (suggestion.details.directories.length > 0) {
                        console.log(`   Areas: ${suggestion.details.directories.join(', ')}`);
                    }
                });

                suggester.saveSuggestionsReport(result);
            }).catch(error => {
                console.error('Failed to generate suggestions:', error);
                process.exit(1);
            });
            break;

        case 'analyze':
            suggester.analyzeChangesAndSuggest().then(result => {
                console.log('\n🔍 Change Analysis:');
                console.log(`Total files: ${result.analysis.totalFiles}`);
                console.log(`Added: ${result.analysis.added}`);
                console.log(`Modified: ${result.analysis.modified}`);
                console.log(`Deleted: ${result.analysis.deleted}`);
                console.log(`Risk level: ${result.analysis.risk}`);
                console.log(`Scopes: ${Array.from(result.analysis.scopes).join(', ') || 'none'}`);
                console.log(`File types: ${Array.from(result.analysis.fileTypes.entries()).map(([type, count]) => `${type}(${count})`).join(', ')}`);
            }).catch(error => {
                console.error('Failed to analyze changes:', error);
                process.exit(1);
            });
            break;

        default:
            console.log('Usage: node automated-commit-message-suggester.js <command>');
            console.log('Commands:');
            console.log('  suggest    - Generate commit message suggestions');
            console.log('  analyze    - Analyze current changes');
            process.exit(1);
    }
}

module.exports = AutomatedCommitMessageSuggester;