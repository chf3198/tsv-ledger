#!/usr/bin/env node

/**
 * Comment Style Consistency Validator
 * Ensures consistent commenting styles across the codebase
 */

const fs = require('fs');
const path = require('path');

class CommentStyleConsistencyValidator {
    constructor() {
        this.styleRules = {
            javascript: { prefix: '//', spacing: 'after' },
            python: { prefix: '#', spacing: 'after' }
        };
    }

    /**
     * Validate comment style consistency across the codebase
     */
    validateConsistency(projectRoot = process.cwd()) {
        const analysis = {
            project: projectRoot,
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: 0,
                filesWithComments: 0,
                totalComments: 0,
                consistencyScore: 0,
                issues: [],
                suggestions: []
            },
            consistency: {},
            score: 0
        };

        // Find all code files
        const codeFiles = this.findCodeFiles(projectRoot);
        analysis.summary.totalFiles = codeFiles.length;

        console.log(`Found ${codeFiles.length} code files to analyze...`);

        // Analyze each file
        codeFiles.forEach((filePath, index) => {
            if (index % 50 === 0) {
                console.log(`Analyzing file ${index + 1}/${codeFiles.length}: ${path.basename(filePath)}`);
            }

            const fileAnalysis = this.analyzeFileComments(filePath);
            if (fileAnalysis.metrics.totalComments > 0) {
                analysis.summary.filesWithComments++;
                analysis.summary.totalComments += fileAnalysis.metrics.totalComments;
                analysis.summary.issues.push(...fileAnalysis.issues);
            }
        });

        // Calculate overall metrics
        analysis.consistency = this.calculateConsistencyMetrics(analysis.summary);
        analysis.summary.suggestions = this.generateSuggestions(analysis);
        analysis.summary.consistencyScore = this.calculateConsistencyScore(analysis);
        analysis.score = analysis.summary.consistencyScore;

        return analysis;
    }

    /**
     * Analyze comments in a specific file
     */
    analyzeFileComments(filePath) {
        const result = {
            file: filePath,
            language: this.detectLanguage(filePath),
            issues: [],
            metrics: {
                totalComments: 0,
                singleLineComments: 0,
                multiLineComments: 0,
                javadocComments: 0,
                functionComments: 0,
                consistencyScore: 100
            }
        };

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const language = result.language;

            if (!this.styleRules[language]) {
                return result;
            }

            const rules = this.styleRules[language];
            let inMultiLineComment = false;

            lines.forEach((line, index) => {
                const trimmed = line.trim();

                // Check for single-line comments
                if (language === 'javascript' && trimmed.startsWith('//')) {
                    result.metrics.singleLineComments++;
                    result.metrics.totalComments++;

                    // Check spacing
                    if (rules.spacing === 'after' && trimmed === '//') {
                        result.issues.push({
                            type: 'spacing-inconsistency',
                            severity: 'warning',
                            message: 'Missing space after //',
                            line: index + 1,
                            file: filePath
                        });
                        result.metrics.consistencyScore -= 5;
                    }
                } else if (language === 'python' && trimmed.startsWith('#')) {
                    result.metrics.singleLineComments++;
                    result.metrics.totalComments++;

                    // Check spacing
                    if (rules.spacing === 'after' && trimmed === '#') {
                        result.issues.push({
                            type: 'spacing-inconsistency',
                            severity: 'warning',
                            message: 'Missing space after #',
                            line: index + 1,
                            file: filePath
                        });
                        result.metrics.consistencyScore -= 5;
                    }
                }

                // Check for multi-line comments (basic detection)
                if (language === 'javascript') {
                    if (trimmed.includes('/*')) {
                        inMultiLineComment = true;
                        result.metrics.multiLineComments++;
                        result.metrics.totalComments++;
                    }
                    if (inMultiLineComment && trimmed.includes('*/')) {
                        inMultiLineComment = false;
                    }
                }

                // Check for functions without comments
                if (language === 'javascript' && (trimmed.startsWith('function ') || trimmed.includes('=>'))) {
                    // Check if previous lines have comments
                    let hasComment = false;
                    for (let i = Math.max(0, index - 3); i < index; i++) {
                        if (lines[i].trim().startsWith('//') || lines[i].trim().startsWith('/*')) {
                            hasComment = true;
                            break;
                        }
                    }

                    if (hasComment) {
                        result.metrics.functionComments++;
                    } else {
                        result.issues.push({
                            type: 'missing-function-comment',
                            severity: 'warning',
                            message: `Function at line ${index + 1} is missing documentation comment`,
                            line: index + 1,
                            file: filePath
                        });
                        result.metrics.consistencyScore -= 10;
                    }
                } else if (language === 'python' && trimmed.startsWith('def ')) {
                    // Check if previous lines have comments
                    let hasComment = false;
                    for (let i = Math.max(0, index - 3); i < index; i++) {
                        if (lines[i].trim().startsWith('#') || lines[i].trim().startsWith('"""')) {
                            hasComment = true;
                            break;
                        }
                    }

                    if (hasComment) {
                        result.metrics.functionComments++;
                    } else {
                        result.issues.push({
                            type: 'missing-function-comment',
                            severity: 'warning',
                            message: `Function at line ${index + 1} is missing documentation comment`,
                            line: index + 1,
                            file: filePath
                        });
                        result.metrics.consistencyScore -= 10;
                    }
                }
            });

        } catch (error) {
            result.issues.push({
                type: 'analysis-error',
                severity: 'error',
                message: `Could not analyze file: ${error.message}`,
                file: filePath
            });
        }

        return result;
    }

    /**
     * Detect programming language from file extension
     */
    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.js':
            case '.ts':
            case '.jsx':
            case '.tsx':
                return 'javascript';
            case '.py':
                return 'python';
            default:
                return 'unknown';
        }
    }

    /**
     * Find all code files in the project
     */
    findCodeFiles(projectRoot) {
        const codeFiles = [];
        const extensions = ['.js', '.ts', '.py', '.jsx', '.tsx'];

        function scanDir(dir) {
            try {
                const items = fs.readdirSync(dir);

                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        scanDir(fullPath);
                    } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
                        codeFiles.push(fullPath);
                    }
                });
            } catch (error) {
                // Skip directories we can't read
            }
        }

        scanDir(projectRoot);
        return codeFiles;
    }

    /**
     * Calculate consistency metrics
     */
    calculateConsistencyMetrics(summary) {
        const metrics = {
            commentCoverage: 0,
            averageCommentsPerFile: 0,
            functionCommentRatio: 0,
            issuesByType: {}
        };

        if (summary.filesWithComments > 0) {
            metrics.averageCommentsPerFile = summary.totalComments / summary.filesWithComments;
        }

        // Count issues by type
        summary.issues.forEach(issue => {
            metrics.issuesByType[issue.type] = (metrics.issuesByType[issue.type] || 0) + 1;
        });

        return metrics;
    }

    /**
     * Generate suggestions based on analysis
     */
    generateSuggestions(analysis) {
        const suggestions = [];
        const { consistency, summary } = analysis;

        if (summary.consistencyScore < 70) {
            suggestions.push('Implement automated comment style linting in CI/CD pipeline');
        }

        if (consistency.issuesByType['missing-function-comment'] > 0) {
            suggestions.push('Add documentation comments to all public functions');
        }

        if (consistency.issuesByType['spacing-inconsistency'] > 0) {
            suggestions.push('Standardize spacing after comment prefixes (// and #)');
        }

        if (summary.filesWithComments < summary.totalFiles * 0.5) {
            suggestions.push('Increase comment coverage across the codebase');
        }

        return suggestions;
    }

    /**
     * Calculate overall consistency score
     */
    calculateConsistencyScore(analysis) {
        let score = 100;
        const { summary } = analysis;

        // Penalize for issues
        const issuesPerFile = summary.issues.length / Math.max(1, summary.totalFiles);
        score -= issuesPerFile * 5;

        // Bonus for high comment coverage
        const coverageRatio = summary.filesWithComments / Math.max(1, summary.totalFiles);
        if (coverageRatio > 0.8) {
            score += 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Save consistency report
     */
    saveConsistencyReport(analysis, filePath = 'comment-style-consistency-report.json') {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: analysis
        };

        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(reportsDir, filePath), JSON.stringify(report, null, 2));
        console.log(`Comment style consistency report saved to reports/${filePath}`);

        return path.join(reportsDir, filePath);
    }
}

// CLI interface
if (require.main === module) {
    const validator = new CommentStyleConsistencyValidator();

    const command = process.argv[2];

    switch (command) {
        case 'validate':
            const projectRoot = process.argv[3] || process.cwd();

            console.log(`🔍 Validating comment style consistency for: ${projectRoot}`);
            const analysis = validator.validateConsistency(projectRoot);

            console.log(`\n📊 Comment Style Consistency Report`);
            console.log(`Overall Score: ${analysis.score}/100`);

            console.log('\n📁 File Analysis:');
            console.log(`Total Files: ${analysis.summary.totalFiles}`);
            console.log(`Files with Comments: ${analysis.summary.filesWithComments}`);
            console.log(`Total Comments: ${analysis.summary.totalComments}`);

            if (analysis.summary.issues.length > 0) {
                console.log('\n⚠️  Top Issues:');
                const topIssues = analysis.summary.issues
                    .reduce((acc, issue) => {
                        acc[issue.type] = (acc[issue.type] || 0) + 1;
                        return acc;
                    }, {});

                Object.entries(topIssues)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .forEach(([type, count]) => {
                        console.log(`  ${type}: ${count} occurrences`);
                    });
            }

            if (analysis.summary.suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                analysis.summary.suggestions.forEach(suggestion => {
                    console.log(`  • ${suggestion}`);
                });
            }

            validator.saveConsistencyReport(analysis);
            break;

        case 'analyze':
            const filePath = process.argv[3];
            if (!filePath) {
                console.log('Usage: node comment-style-consistency-validator.js analyze <file>');
                process.exit(1);
            }

            const fileAnalysis = validator.analyzeFileComments(filePath);
            console.log(`\n📝 Comment Style Analysis: ${filePath}`);
            console.log(`Language: ${fileAnalysis.language}`);
            console.log(`Consistency Score: ${fileAnalysis.metrics.consistencyScore}/100`);
            console.log(`Total Comments: ${fileAnalysis.metrics.totalComments}`);
            console.log(`Functions with Comments: ${fileAnalysis.metrics.functionComments}`);

            if (fileAnalysis.issues.length > 0) {
                console.log('\n⚠️  Issues:');
                fileAnalysis.issues.slice(0, 10).forEach(issue => {
                    console.log(`  Line ${issue.line}: ${issue.message} (${issue.severity})`);
                });
                if (fileAnalysis.issues.length > 10) {
                    console.log(`  ... and ${fileAnalysis.issues.length - 10} more issues`);
                }
            }

            console.log('\n📊 Comment Breakdown:');
            console.log(`  Single-line: ${fileAnalysis.metrics.singleLineComments}`);
            console.log(`  Multi-line: ${fileAnalysis.metrics.multiLineComments}`);
            console.log(`  JSDoc: ${fileAnalysis.metrics.javadocComments}`);
            break;

        default:
            console.log('Usage: node comment-style-consistency-validator.js <command> [args]');
            console.log('Commands:');
            console.log('  validate [project-root] - Validate comment style consistency');
            console.log('  analyze <file>          - Analyze comment styles in specific file');
            process.exit(1);
    }
}

module.exports = CommentStyleConsistencyValidator;