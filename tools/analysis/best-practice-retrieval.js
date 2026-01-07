#!/usr/bin/env node

/**
 * Context-Aware Best Practice Retrieval System
 * Retrieves relevant best practices based on current development context
 */

const fs = require('fs');
const path = require('path');

class BestPracticeRetrieval {
    constructor() {
        this.practiceDatabase = this.loadPracticeDatabase();
        this.contextCache = new Map();
    }

    /**
     * Load the best practice database from JSON file
     */
    loadPracticeDatabase() {
        const dbPath = path.join(__dirname, 'best-practices-db.json');

        if (fs.existsSync(dbPath)) {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }

        // Initialize with default best practices
        return {
            fileSize: {
                patterns: [
                    {
                        context: 'large_javascript_file',
                        triggers: ['file_size_violation', 'javascript', 'lines > 300'],
                        practices: [
                            'Break into smaller modules under 300 lines each',
                            'Extract pure functions into separate files',
                            'Use ES6 imports/exports for modular structure',
                            'Create index.js files for clean module exports'
                        ],
                        examples: ['src/database.js → src/database/index.js + modules'],
                        successRate: 0.95
                    },
                    {
                        context: 'large_html_file',
                        triggers: ['file_size_violation', 'html', 'component'],
                        practices: [
                            'Componentize into public/components/[feature]/[component].html',
                            'Ensure each component under 300 lines',
                            'Use server-side includes or JavaScript imports',
                            'Maintain single responsibility per component'
                        ],
                        examples: ['index.html → components/dashboard/, components/navigation/'],
                        successRate: 0.92
                    }
                ]
            },
            testing: {
                patterns: [
                    {
                        context: 'failing_tests',
                        triggers: ['test_failure', 'api_error', 'server_crash'],
                        practices: [
                            'Run tests before any code changes (baseline)',
                            'Fix server crashes before proceeding with tests',
                            'Implement missing API methods in analysis engines',
                            'Ensure proper error handling in routes'
                        ],
                        examples: ['Add analyzeSubscriptions method to engine', 'Fix route instantiation'],
                        successRate: 0.88
                    },
                    {
                        context: 'low_coverage',
                        triggers: ['test_coverage < 90', 'unit_tests'],
                        practices: [
                            'Write unit tests for all new functions',
                            'Test error conditions and edge cases',
                            'Use Jest for comprehensive coverage reporting',
                            'Run coverage analysis before commits'
                        ],
                        examples: ['Add tests for database operations', 'Test API error responses'],
                        successRate: 0.91
                    }
                ]
            },
            codeQuality: {
                patterns: [
                    {
                        context: 'lint_errors',
                        triggers: ['eslint_errors', 'code_quality'],
                        practices: [
                            'Run npm run lint to identify issues',
                            'Fix syntax errors and style violations',
                            'Use Prettier for consistent formatting',
                            'Address all linting errors before commit'
                        ],
                        examples: ['Fix missing semicolons', 'Correct variable naming'],
                        successRate: 0.96
                    }
                ]
            },
            gitWorkflow: {
                patterns: [
                    {
                        context: 'commit_convention',
                        triggers: ['non_conventional_commit', 'git'],
                        practices: [
                            'Use format: <type>[scope]: <description>',
                            'Types: feat, fix, docs, style, refactor, perf, test, chore',
                            'Write imperative mood descriptions',
                            'Reference issues/PRs when applicable'
                        ],
                        examples: ['feat: add Amazon ZIP import', 'fix: resolve server crash in subscription route'],
                        successRate: 0.89
                    }
                ]
            }
        };
    }

    /**
     * Analyze current context and retrieve relevant best practices
     */
    async retrieveBestPractices(context) {
        console.log('🔍 Analyzing context for best practice retrieval...');

        const relevantPractices = [];
        const contextKey = this.getContextKey(context);

        // Check cache first
        if (this.contextCache.has(contextKey)) {
            return this.contextCache.get(contextKey);
        }

        // Analyze violations and find matching patterns
        if (context.violations) {
            context.violations.forEach(violation => {
                const matches = this.findMatchingPatterns(violation);
                relevantPractices.push(...matches);
            });
        }

        // Analyze current task/file context
        if (context.currentFile) {
            const fileMatches = this.findFileContextPatterns(context.currentFile);
            relevantPractices.push(...fileMatches);
        }

        // Remove duplicates and sort by relevance
        const uniquePractices = this.deduplicatePractices(relevantPractices);
        const sortedPractices = this.sortByRelevance(uniquePractices, context);

        // Cache the results
        this.contextCache.set(contextKey, sortedPractices);

        return sortedPractices;
    }

    /**
     * Find patterns that match a specific violation
     */
    findMatchingPatterns(violation) {
        const matches = [];

        Object.values(this.practiceDatabase).forEach(category => {
            category.patterns.forEach(pattern => {
                const relevance = this.calculatePatternRelevance(pattern, violation);
                if (relevance > 0) {
                    matches.push({
                        ...pattern,
                        relevance: relevance,
                        category: Object.keys(this.practiceDatabase).find(key =>
                            this.practiceDatabase[key] === category
                        ),
                        violation: violation
                    });
                }
            });
        });

        return matches;
    }

    /**
     * Calculate how relevant a pattern is for a given violation
     */
    calculatePatternRelevance(pattern, violation) {
        let relevance = 0;

        pattern.triggers.forEach(trigger => {
            if (trigger.includes('file_size_violation') && violation.type === 'file_size') {
                relevance += 0.8;
            } else if (trigger.includes('test_failure') && violation.type === 'test_failure') {
                relevance += 0.9;
            } else if (trigger.includes('lint_errors') && violation.type === 'lint_errors') {
                relevance += 0.7;
            } else if (trigger.includes('commit_convention') && violation.type === 'commit_convention') {
                relevance += 0.6;
            } else if (trigger.includes('javascript') && violation.file?.endsWith('.js')) {
                relevance += 0.4;
            } else if (trigger.includes('html') && violation.file?.endsWith('.html')) {
                relevance += 0.4;
            } else if (trigger.includes('lines > 300') && violation.lines > 300) {
                relevance += 0.5;
            }
        });

        return relevance;
    }

    /**
     * Find patterns relevant to current file context
     */
    findFileContextPatterns(filePath) {
        const matches = [];
        const ext = path.extname(filePath);
        const size = this.getFileSize(filePath);

        // File size patterns
        if (size > 300) {
            if (ext === '.js') {
                matches.push({
                    context: 'large_javascript_file',
                    practices: [
                        'Consider breaking into smaller modules',
                        'Extract utility functions to separate files',
                        'Use ES6 modules for better organization'
                    ],
                    relevance: 0.8
                });
            } else if (ext === '.html') {
                matches.push({
                    context: 'large_html_file',
                    practices: [
                        'Componentize into smaller HTML files',
                        'Move to public/components/ directory',
                        'Ensure single responsibility per component'
                    ],
                    relevance: 0.8
                });
            }
        }

        return matches;
    }

    /**
     * Get file size in lines
     */
    getFileSize(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8').split('\n').length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Remove duplicate practices
     */
    deduplicatePractices(practices) {
        const seen = new Set();
        return practices.filter(practice => {
            const key = practice.context + JSON.stringify(practice.practices);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Sort practices by relevance score
     */
    sortByRelevance(practices, context) {
        return practices.sort((a, b) => {
            // Higher relevance first
            if (b.relevance !== a.relevance) {
                return b.relevance - a.relevance;
            }

            // Higher success rate for tie-breaking
            return (b.successRate || 0) - (a.successRate || 0);
        });
    }

    /**
     * Generate a context key for caching
     */
    getContextKey(context) {
        const violationTypes = context.violations?.map(v => v.type).sort().join(',') || '';
        const fileKey = context.currentFile || '';
        return `${violationTypes}:${fileKey}`;
    }

    /**
     * Add a new successful practice application to the database
     */
    recordSuccess(context, practice, outcome) {
        // Find the pattern and update success metrics
        const category = this.practiceDatabase[practice.category];
        if (category) {
            const pattern = category.patterns.find(p => p.context === practice.context);
            if (pattern) {
                // Update success rate based on outcome
                if (outcome === 'success') {
                    pattern.successRate = ((pattern.successRate || 0) * 0.9) + 0.1; // Weighted average
                }
                pattern.usageCount = (pattern.usageCount || 0) + 1;
            }
        }

        // Save updated database
        this.savePracticeDatabase();
    }

    /**
     * Save the practice database to disk
     */
    savePracticeDatabase() {
        const dbPath = path.join(__dirname, 'best-practices-db.json');
        fs.writeFileSync(dbPath, JSON.stringify(this.practiceDatabase, null, 2));
    }

    /**
     * Get practice recommendations for current development context
     */
    async getRecommendations(context = {}) {
        const practices = await this.retrieveBestPractices(context);

        return {
            recommendations: practices.slice(0, 5), // Top 5 most relevant
            totalAvailable: practices.length,
            contextAnalyzed: Object.keys(context).length > 0
        };
    }
}

// CLI interface
if (require.main === module) {
    const retriever = new BestPracticeRetrieval();

    // Example usage with current violations
    const sampleContext = {
        violations: [
            { type: 'file_size', file: 'src/database.js', lines: 392 },
            { type: 'lint_errors', count: 1 }
        ],
        currentFile: 'src/database.js'
    };

    retriever.getRecommendations(sampleContext).then(result => {
        console.log('🎯 Best Practice Recommendations:');
        console.log(`Found ${result.totalAvailable} relevant practices\n`);

        result.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.context} (relevance: ${(rec.relevance * 100).toFixed(0)}%)`);
            console.log(`   Category: ${rec.category}`);
            if (rec.successRate) {
                console.log(`   Success Rate: ${(rec.successRate * 100).toFixed(0)}%`);
            }
            console.log('   Practices:');
            rec.practices.forEach(practice => {
                console.log(`   • ${practice}`);
            });
            if (rec.examples && rec.examples.length > 0) {
                console.log('   Examples:');
                rec.examples.forEach(example => {
                    console.log(`   • ${example}`);
                });
            }
            console.log('');
        });
    }).catch(error => {
        console.error('Error retrieving recommendations:', error);
    });
}

module.exports = BestPracticeRetrieval;