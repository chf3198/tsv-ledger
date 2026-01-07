#!/usr/bin/env node

/**
 * Automated Comment Quality Assessment System
 * Analyzes code comments for quality, completeness, and usefulness
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CommentQualityAssessor {
    constructor() {
        this.commentPatterns = {
            // Single-line comments
            singleLine: /^\s*\/\/(.*)$/gm,
            // Multi-line comments
            multiLine: /\/\*(.*?)\*\//gs,
            // JSDoc comments
            jsdoc: /\/\*\*\s*\n([\s\S]*?)\s*\*\//g,
            // Hash comments (for config files)
            hash: /^\s*#(.*)$/gm
        };

        this.qualityMetrics = {
            clarity: {
                weight: 0.3,
                checks: ['understandable', 'concise', 'actionable']
            },
            completeness: {
                weight: 0.25,
                checks: ['explainsWhy', 'coversEdgeCases', 'parametersDocumented']
            },
            relevance: {
                weight: 0.2,
                checks: ['codeMatches', 'upToDate', 'addsValue']
            },
            style: {
                weight: 0.15,
                checks: ['properGrammar', 'consistentFormat', 'appropriateLength']
            },
            placement: {
                weight: 0.1,
                checks: ['logicalPosition', 'notRedundant', 'scopedCorrectly']
            }
        };

        this.commentTypes = {
            function: {
                required: ['purpose', 'parameters', 'return', 'throws'],
                patterns: [/function\s+\w+\s*\(/, /const\s+\w+\s*=\s*\([^)]*\)\s*=>/, /class\s+\w+/]
            },
            class: {
                required: ['purpose', 'properties', 'methods'],
                patterns: [/class\s+\w+/]
            },
            complexLogic: {
                required: ['why', 'how'],
                patterns: [/if\s*\(.+\)\s*\{[\s\S]*?\}/, /for\s*\(.+\)\s*\{[\s\S]*?\}/, /while\s*\(.+\)\s*\{[\s\S]*?\}/]
            },
            api: {
                required: ['endpoint', 'method', 'parameters', 'response'],
                patterns: [/app\.(get|post|put|delete)\(/, /router\.(get|post|put|delete)\(/]
            },
            config: {
                required: ['purpose', 'values'],
                patterns: [/^\s*const\s+\w+\s*=\s*\{/, /^\s*module\.exports\s*=/]
            }
        };

        this.languageSpecificRules = {
            javascript: {
                preferredCommentStyle: 'jsdoc',
                maxCommentLength: 100,
                requireJSDoc: true
            },
            python: {
                preferredCommentStyle: 'hash',
                maxCommentLength: 72,
                requireDocstrings: true
            },
            markdown: {
                preferredCommentStyle: 'html',
                maxCommentLength: 120,
                requireHeaders: true
            }
        };
    }

    /**
     * Assess comment quality in a file
     */
    assessFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileExt = path.extname(filePath).slice(1).toLowerCase();
            const language = this.getLanguageFromExtension(fileExt);

            const comments = this.extractComments(content, language);
            const analysis = {
                file: filePath,
                language: language,
                totalComments: comments.length,
                totalLines: content.split('\n').length,
                commentRatio: comments.length / content.split('\n').length,
                quality: this.calculateOverallQuality(comments, content, language),
                issues: [],
                suggestions: [],
                breakdown: this.analyzeCommentBreakdown(comments, content)
            };

            // Analyze each comment
            comments.forEach((comment, index) => {
                const commentAnalysis = this.analyzeComment(comment, content, index, language);
                analysis.issues.push(...commentAnalysis.issues);
                analysis.suggestions.push(...commentAnalysis.suggestions);
            });

            // Check for missing comments
            const missingAnalysis = this.checkMissingComments(content, language);
            analysis.issues.push(...missingAnalysis.issues);
            analysis.suggestions.push(...missingAnalysis.suggestions);

            analysis.score = this.calculateQualityScore(analysis);

            return analysis;
        } catch (error) {
            return {
                file: filePath,
                error: 'Failed to assess comment quality',
                message: error.message
            };
        }
    }

    /**
     * Extract all comments from file content
     */
    extractComments(content, language) {
        const comments = [];
        const patterns = this.getCommentPatterns(language);

        patterns.forEach(pattern => {
            // Reset regex lastIndex to ensure proper matching
            pattern.regex.lastIndex = 0;
            let match;
            while ((match = pattern.regex.exec(content)) !== null) {
                comments.push({
                    text: match[1] || match[0],
                    type: pattern.type,
                    startIndex: match.index,
                    endIndex: match.index + match[0].length,
                    lineNumber: content.substring(0, match.index).split('\n').length
                });
            }
        });

        // Sort by position
        return comments.sort((a, b) => a.startIndex - b.startIndex);
    }

    /**
     * Get comment patterns for language
     */
    getCommentPatterns(language) {
        const basePatterns = [
            { type: 'singleLine', regex: this.commentPatterns.singleLine },
            { type: 'multiLine', regex: this.commentPatterns.multiLine },
            { type: 'jsdoc', regex: this.commentPatterns.jsdoc }
        ];

        if (language === 'python') {
            basePatterns.push({ type: 'hash', regex: this.commentPatterns.hash });
        }

        return basePatterns;
    }

    /**
     * Get language from file extension
     */
    getLanguageFromExtension(ext) {
        const langMap = {
            'js': 'javascript',
            'ts': 'javascript',
            'jsx': 'javascript',
            'tsx': 'javascript',
            'py': 'python',
            'md': 'markdown',
            'json': 'json',
            'yml': 'yaml',
            'yaml': 'yaml'
        };

        return langMap[ext] || 'unknown';
    }

    /**
     * Analyze individual comment
     */
    analyzeComment(comment, content, index, language) {
        const issues = [];
        const suggestions = [];

        // Check clarity
        const clarityIssues = this.checkClarity(comment);
        issues.push(...clarityIssues.issues);
        suggestions.push(...clarityIssues.suggestions);

        // Check completeness
        const completenessIssues = this.checkCompleteness(comment, content, index);
        issues.push(...completenessIssues.issues);
        suggestions.push(...completenessIssues.suggestions);

        // Check relevance
        const relevanceIssues = this.checkRelevance(comment, content, index);
        issues.push(...relevanceIssues.issues);
        suggestions.push(...relevanceIssues.suggestions);

        // Check style
        const styleIssues = this.checkStyle(comment, language);
        issues.push(...styleIssues.issues);
        suggestions.push(...styleIssues.suggestions);

        // Check placement
        const placementIssues = this.checkPlacement(comment, content, index);
        issues.push(...placementIssues.issues);
        suggestions.push(...placementIssues.suggestions);

        return { issues, suggestions };
    }

    /**
     * Check comment clarity
     */
    checkClarity(comment) {
        const issues = [];
        const suggestions = [];
        const text = comment.text.trim();

        // Check if understandable
        if (text.length < 3) {
            issues.push({
                type: 'clarity',
                severity: 'warning',
                message: 'Comment too short to be meaningful',
                line: comment.lineNumber
            });
            suggestions.push('Expand comment to explain the code purpose');
        }

        // Check for unclear language
        const unclearWords = ['stuff', 'thing', 'do', 'handle', 'process', 'fix'];
        const hasUnclearWords = unclearWords.some(word =>
            text.toLowerCase().includes(word) && text.length < 20
        );

        if (hasUnclearWords) {
            issues.push({
                type: 'clarity',
                severity: 'warning',
                message: 'Comment uses vague language',
                line: comment.lineNumber
            });
            suggestions.push('Use specific, descriptive language');
        }

        // Check if actionable
        const actionWords = ['add', 'remove', 'update', 'create', 'delete', 'fix', 'implement'];
        const hasActionWords = actionWords.some(word => text.toLowerCase().includes(word));

        if (!hasActionWords && text.length > 10) {
            suggestions.push('Consider adding action-oriented language');
        }

        return { issues, suggestions };
    }

    /**
     * Check comment completeness
     */
    checkCompleteness(comment, content, index) {
        const issues = [];
        const suggestions = [];
        const text = comment.text.trim();

        // Check if explains why (not just what)
        const whyWords = ['because', 'since', 'due to', 'to ensure', 'for', 'why'];
        const hasWhy = whyWords.some(word => text.toLowerCase().includes(word));

        if (!hasWhy && text.length > 15) {
            suggestions.push('Consider explaining why this code exists, not just what it does');
        }

        // Check for TODO/FIXME comments that lack detail
        if (text.toLowerCase().includes('todo') || text.toLowerCase().includes('fixme')) {
            if (text.length < 20) {
                issues.push({
                    type: 'completeness',
                    severity: 'info',
                    message: 'TODO/FIXME comment lacks sufficient detail',
                    line: comment.lineNumber
                });
                suggestions.push('Add more context to TODO/FIXME items');
            }
        }

        return { issues, suggestions };
    }

    /**
     * Check comment relevance
     */
    checkRelevance(comment, content, index) {
        const issues = [];
        const suggestions = [];
        const text = comment.text.trim();

        // Check for outdated comments (basic check)
        if (text.includes('TODO') && text.includes('2019')) {
            issues.push({
                type: 'relevance',
                severity: 'warning',
                message: 'Comment appears outdated',
                line: comment.lineNumber
            });
            suggestions.push('Review and update outdated comments');
        }

        // Check for redundant comments
        const nextLines = content.split('\n').slice(comment.lineNumber, comment.lineNumber + 3);
        const codeAfter = nextLines.join(' ').toLowerCase();
        const commentWords = text.toLowerCase().split(/\s+/);

        const redundantWords = commentWords.filter(word =>
            word.length > 3 && codeAfter.includes(word)
        );

        if (redundantWords.length > commentWords.length * 0.5) {
            issues.push({
                type: 'relevance',
                severity: 'info',
                message: 'Comment may be redundant with code',
                line: comment.lineNumber
            });
            suggestions.push('Remove redundant comments that just restate the code');
        }

        return { issues, suggestions };
    }

    /**
     * Check comment style
     */
    checkStyle(comment, language) {
        const issues = [];
        const suggestions = [];
        const text = comment.text.trim();
        const rules = this.languageSpecificRules[language] || this.languageSpecificRules.javascript;

        // Check length
        if (text.length > rules.maxCommentLength) {
            issues.push({
                type: 'style',
                severity: 'warning',
                message: `Comment exceeds recommended length (${text.length}/${rules.maxCommentLength})`,
                line: comment.lineNumber
            });
            suggestions.push('Break long comments into multiple lines or shorten');
        }

        // Check grammar (basic check)
        if (text.length > 0 && !text[0].match(/[A-Z]/) && text.length > 10) {
            suggestions.push('Start comments with capital letters for better readability');
        }

        // Check for proper punctuation
        if (text.length > 10 && !text.match(/[.!?]$/)) {
            suggestions.push('End comments with proper punctuation');
        }

        // Language-specific checks
        if (language === 'javascript' && comment.type !== 'jsdoc' && rules.requireJSDoc) {
            suggestions.push('Consider using JSDoc format for function comments');
        }

        return { issues, suggestions };
    }

    /**
     * Check comment placement
     */
    checkPlacement(comment, content, index) {
        const issues = [];
        const suggestions = [];

        // Check if comment is properly positioned before code
        const lines = content.split('\n');
        const commentLine = comment.lineNumber - 1; // Convert to 0-based
        const nextNonEmptyLine = lines.slice(commentLine + 1).find(line => line.trim().length > 0);

        if (nextNonEmptyLine && nextNonEmptyLine.trim().startsWith('//')) {
            suggestions.push('Avoid stacking single-line comments; use multi-line format');
        }

        return { issues, suggestions };
    }

    /**
     * Check for missing comments
     */
    checkMissingComments(content, language) {
        const issues = [];
        const suggestions = [];

        Object.entries(this.commentTypes).forEach(([type, config]) => {
            config.patterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        const matchIndex = content.indexOf(match);
                        const linesBefore = content.substring(0, matchIndex).split('\n');
                        const commentLines = linesBefore.slice(-5); // Check last 5 lines before match

                        const hasComment = commentLines.some(line =>
                            line.includes('//') || line.includes('/*') || line.includes('#')
                        );

                        if (!hasComment) {
                            issues.push({
                                type: 'missing',
                                severity: 'info',
                                message: `Missing comment for ${type}`,
                                line: linesBefore.length + 1
                            });

                            suggestions.push(`Add comment explaining the ${type} purpose`);
                        }
                    });
                }
            });
        });

        return { issues, suggestions };
    }

    /**
     * Calculate overall quality metrics
     */
    calculateOverallQuality(comments, content, language) {
        const quality = {
            clarity: 0,
            completeness: 0,
            relevance: 0,
            style: 0,
            placement: 0
        };

        // Basic scoring based on comment ratio and types
        const lines = content.split('\n').length;
        const commentRatio = comments.length / lines;

        // Ideal comment ratio varies by language
        const idealRatio = language === 'javascript' ? 0.15 : language === 'python' ? 0.2 : 0.1;

        if (Math.abs(commentRatio - idealRatio) < 0.05) {
            quality.clarity = 80;
            quality.completeness = 75;
        } else if (commentRatio < idealRatio * 0.5) {
            quality.clarity = 40;
            quality.completeness = 30;
        }

        // Check for JSDoc usage in JS
        if (language === 'javascript') {
            const jsdocComments = comments.filter(c => c.type === 'jsdoc').length;
            const jsdocRatio = jsdocComments / comments.length;

            if (jsdocRatio > 0.7) {
                quality.style = 90;
            } else if (jsdocRatio > 0.4) {
                quality.style = 70;
            } else {
                quality.style = 40;
            }
        }

        return quality;
    }

    /**
     * Analyze comment breakdown
     */
    analyzeCommentBreakdown(comments, content) {
        const breakdown = {
            byType: {},
            byLength: { short: 0, medium: 0, long: 0 },
            byQuality: { good: 0, fair: 0, poor: 0 }
        };

        comments.forEach(comment => {
            // Count by type
            breakdown.byType[comment.type] = (breakdown.byType[comment.type] || 0) + 1;

            // Count by length
            const length = comment.text.trim().length;
            if (length < 10) breakdown.byLength.short++;
            else if (length < 50) breakdown.byLength.medium++;
            else breakdown.byLength.long++;

            // Basic quality assessment
            const qualityScore = this.assessCommentQuality(comment);
            if (qualityScore > 7) breakdown.byQuality.good++;
            else if (qualityScore > 4) breakdown.byQuality.fair++;
            else breakdown.byQuality.poor++;
        });

        return breakdown;
    }

    /**
     * Assess individual comment quality (0-10 scale)
     */
    assessCommentQuality(comment) {
        let score = 5; // Base score

        const text = comment.text.trim();

        // Length scoring
        if (text.length < 3) score -= 2;
        else if (text.length > 10 && text.length < 100) score += 1;
        else if (text.length > 100) score -= 1;

        // Content scoring
        if (text.includes('TODO') || text.includes('FIXME')) score += 1;
        if (text.match(/[A-Z][^.!?]*[.!?]$/)) score += 1; // Proper sentence

        // Type scoring
        if (comment.type === 'jsdoc') score += 2;
        else if (comment.type === 'multiLine') score += 1;

        return Math.max(0, Math.min(10, score));
    }

    /**
     * Calculate overall quality score
     */
    calculateQualityScore(analysis) {
        if (analysis.error) return 0;

        let score = 50; // Base score

        // Comment ratio scoring
        const idealRatio = analysis.language === 'javascript' ? 0.15 : 0.1;
        const ratioDiff = Math.abs(analysis.commentRatio - idealRatio);
        score += Math.max(-20, 20 - (ratioDiff * 100));

        // Issues penalty
        const criticalIssues = analysis.issues.filter(i => i.severity === 'error').length;
        const warningIssues = analysis.issues.filter(i => i.severity === 'warning').length;
        score -= criticalIssues * 10;
        score -= warningIssues * 3;

        // Quality metrics bonus
        const avgQuality = Object.values(analysis.quality).reduce((a, b) => a + b, 0) / Object.values(analysis.quality).length;
        score += (avgQuality - 50) * 0.5;

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Generate improvement suggestions
     */
    generateImprovementSuggestions(analysis) {
        const suggestions = [];

        if (analysis.commentRatio < 0.05) {
            suggestions.push('Add more comments to explain complex logic and function purposes');
        } else if (analysis.commentRatio > 0.3) {
            suggestions.push('Review comments for redundancy and remove unnecessary ones');
        }

        if (analysis.language === 'javascript') {
            const jsdocCount = analysis.breakdown.byType.jsdoc || 0;
            const totalComments = analysis.totalComments;

            if (jsdocCount / totalComments < 0.5) {
                suggestions.push('Use JSDoc format for function and class documentation');
            }
        }

        if (analysis.breakdown.byLength.short > analysis.totalComments * 0.3) {
            suggestions.push('Expand short comments to provide more meaningful explanations');
        }

        return suggestions;
    }

    /**
     * Save comment quality report
     */
    saveQualityReport(analysis, filePath = 'comment-quality-report.json') {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: analysis,
            recommendations: this.generateImprovementSuggestions(analysis)
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`Comment quality report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }
}

// CLI interface
if (require.main === module) {
    const assessor = new CommentQualityAssessor();

    const command = process.argv[2];

    switch (command) {
        case 'assess':
            const filePath = process.argv[3];
            if (!filePath) {
                console.log('Usage: node comment-quality-assessor.js assess <file>');
                process.exit(1);
            }

            let analysis;
            try {
                analysis = assessor.assessFile(filePath);
            } catch (error) {
                console.log(`❌ Error assessing ${filePath}: ${error.message}`);
                process.exit(1);
            }

            if (analysis.error) {
                console.log(`❌ Error assessing ${filePath}: ${analysis.error}`);
                console.log(analysis.message);
                process.exit(1);
            }

            console.log(`\n📝 Comment Quality Assessment for ${filePath}:`);
            console.log(`Language: ${analysis.language}`);
            console.log(`Total Comments: ${analysis.totalComments}`);
            console.log(`Comment Ratio: ${(analysis.commentRatio * 100).toFixed(1)}%`);
            console.log(`Quality Score: ${analysis.score}/100`);

            console.log('\n📊 Quality Breakdown:');
            if (analysis.quality) {
                Object.entries(analysis.quality).forEach(([metric, score]) => {
                    console.log(`  ${metric}: ${score}/100`);
                });
            }

            console.log('\n📊 Comment Breakdown:');
            if (analysis.breakdown) {
                console.log(`  By Type: ${JSON.stringify(analysis.breakdown.byType)}`);
                console.log(`  By Length: ${JSON.stringify(analysis.breakdown.byLength)}`);
                console.log(`  By Quality: ${JSON.stringify(analysis.breakdown.byQuality)}`);
            }

            if (analysis.issues.length > 0) {
                console.log('\n⚠️  Issues Found:');
                analysis.issues.slice(0, 10).forEach(issue => {
                    console.log(`  • Line ${issue.line}: ${issue.message} (${issue.severity})`);
                });
                if (analysis.issues.length > 10) {
                    console.log(`  ... and ${analysis.issues.length - 10} more issues`);
                }
            }

            if (analysis.suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                analysis.suggestions.slice(0, 10).forEach(suggestion => {
                    console.log(`  • ${suggestion}`);
                });
            }

            assessor.saveQualityReport(analysis);
            break;

        case 'batch':
            const pattern = process.argv[3] || '**/*.{js,ts,py}';
            console.log(`🔍 Batch assessing files matching: ${pattern}`);

            // Simple glob implementation for demo
            const files = assessor.findFiles(process.cwd(), pattern);
            const results = files.map(file => assessor.assessFile(file));

            const summary = {
                totalFiles: results.length,
                averageScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length,
                totalIssues: results.reduce((sum, r) => sum + (r.issues?.length || 0), 0),
                filesByScore: {
                    excellent: results.filter(r => (r.score || 0) >= 80).length,
                    good: results.filter(r => (r.score || 0) >= 60 && (r.score || 0) < 80).length,
                    fair: results.filter(r => (r.score || 0) >= 40 && (r.score || 0) < 60).length,
                    poor: results.filter(r => (r.score || 0) < 40).length
                }
            };

            console.log('\n📊 Batch Assessment Summary:');
            console.log(`Files Analyzed: ${summary.totalFiles}`);
            console.log(`Average Score: ${summary.averageScore.toFixed(1)}/100`);
            console.log(`Total Issues: ${summary.totalIssues}`);
            console.log(`Excellent (80+): ${summary.filesByScore.excellent}`);
            console.log(`Good (60-79): ${summary.filesByScore.good}`);
            console.log(`Fair (40-59): ${summary.filesByScore.fair}`);
            console.log(`Poor (<40): ${summary.filesByScore.poor}`);

            assessor.saveQualityReport({ batch: results, summary }, 'batch-comment-quality-report.json');
            break;

        default:
            console.log('Usage: node comment-quality-assessor.js <command> [args]');
            console.log('Commands:');
            console.log('  assess <file>    - Assess comment quality in a file');
            console.log('  batch [pattern]  - Batch assess multiple files');
            process.exit(1);
    }
}

module.exports = CommentQualityAssessor;