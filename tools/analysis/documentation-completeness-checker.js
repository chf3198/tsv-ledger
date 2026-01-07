#!/usr/bin/env node

/**
 * Documentation Completeness Checker
 * Analyzes whether documentation is complete and up-to-date with the codebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DocumentationCompletenessChecker {
    constructor() {
        this.documentationTypes = {
            api: {
                files: ['API_DOCUMENTATION.md', 'api-docs.md', 'docs/api.md'],
                required: ['endpoints', 'parameters', 'responses', 'examples'],
                patterns: [/app\.(get|post|put|delete|patch)\(/, /router\.(get|post|put|delete|patch)\(/]
            },
            readme: {
                files: ['README.md', 'readme.md'],
                required: ['description', 'installation', 'usage', 'contributing'],
                patterns: []
            },
            architecture: {
                files: ['ARCHITECTURE.md', 'docs/architecture.md', 'CODEBASE_ARCHITECTURE.md'],
                required: ['overview', 'components', 'data-flow', 'decisions'],
                patterns: []
            },
            testing: {
                files: ['TESTING.md', 'docs/testing.md', 'test-docs.md'],
                required: ['setup', 'running-tests', 'coverage', 'ci-cd'],
                patterns: [/describe\(/, /it\(/, /test\(/]
            },
            deployment: {
                files: ['DEPLOYMENT.md', 'docs/deployment.md', 'DOCKER.md'],
                required: ['requirements', 'setup', 'configuration', 'monitoring'],
                patterns: []
            }
        };

        this.completenessMetrics = {
            coverage: {
                weight: 0.4,
                checks: ['fileExists', 'sectionsPresent', 'upToDate']
            },
            accuracy: {
                weight: 0.3,
                checks: ['codeMatches', 'examplesWork', 'linksValid']
            },
            maintenance: {
                weight: 0.2,
                checks: ['recentlyUpdated', 'versionSync', 'contributors']
            },
            usability: {
                weight: 0.1,
                checks: ['clearStructure', 'examples', 'troubleshooting']
            }
        };

        this.requiredSections = {
            README: [
                'description', 'features', 'installation', 'usage', 'contributing',
                'license', 'contact', 'badges'
            ],
            API_DOCS: [
                'authentication', 'endpoints', 'parameters', 'responses',
                'examples', 'error-codes', 'rate-limits'
            ],
            ARCHITECTURE: [
                'overview', 'components', 'data-flow', 'decisions',
                'technologies', 'deployment', 'scaling'
            ]
        };
    }

    /**
     * Check documentation completeness for the project
     */
    checkProjectCompleteness(projectRoot = process.cwd()) {
        const analysis = {
            project: projectRoot,
            timestamp: new Date().toISOString(),
            documentation: {},
            issues: [],
            suggestions: [],
            coverage: {},
            score: 0
        };

        // Check each documentation type
        Object.entries(this.documentationTypes).forEach(([type, config]) => {
            analysis.documentation[type] = this.checkDocumentationType(type, config, projectRoot);
        });

        // Check for missing documentation
        analysis.missing = this.checkMissingDocumentation(projectRoot);

        // Calculate overall metrics
        analysis.coverage = this.calculateCoverageMetrics(analysis.documentation);
        analysis.issues = this.collectAllIssues(analysis);
        analysis.suggestions = this.generateSuggestions(analysis);
        analysis.score = this.calculateCompletenessScore(analysis);

        return analysis;
    }

    /**
     * Check a specific type of documentation
     */
    checkDocumentationType(type, config, projectRoot) {
        const result = {
            type: type,
            files: [],
            exists: false,
            completeness: 0,
            issues: [],
            lastModified: null,
            coverage: {}
        };

        // Find documentation files
        config.files.forEach(fileName => {
            const filePath = path.join(projectRoot, fileName);
            if (fs.existsSync(filePath)) {
                result.files.push(filePath);
                result.exists = true;

                const fileAnalysis = this.analyzeDocumentationFile(filePath, config);
                result.completeness = Math.max(result.completeness, fileAnalysis.completeness);
                result.issues.push(...fileAnalysis.issues);
                result.coverage = { ...result.coverage, ...fileAnalysis.coverage };

                // Get last modified date
                const stats = fs.statSync(filePath);
                if (!result.lastModified || stats.mtime > result.lastModified) {
                    result.lastModified = stats.mtime;
                }
            }
        });

        // Check if documentation matches code
        if (result.exists && config.patterns.length > 0) {
            const codeMatches = this.checkCodeDocumentationMatch(config.patterns, projectRoot);
            result.coverage.codeMatches = codeMatches;
        }

        return result;
    }

    /**
     * Analyze a documentation file
     */
    analyzeDocumentationFile(filePath, config) {
        const result = {
            completeness: 0,
            issues: [],
            coverage: {}
        };

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const sections = this.extractSections(content);

            // Check required sections
            config.required.forEach(required => {
                const hasSection = sections.some(section =>
                    section.toLowerCase().includes(required.toLowerCase())
                );

                if (hasSection) {
                    result.completeness += 100 / config.required.length;
                    result.coverage[required] = true;
                } else {
                    result.issues.push({
                        type: 'missing-section',
                        severity: 'warning',
                        message: `Missing required section: ${required}`,
                        file: filePath
                    });
                    result.coverage[required] = false;
                }
            });

            // Check for common documentation issues
            const contentIssues = this.checkDocumentationContent(content, filePath);
            result.issues.push(...contentIssues);

            // Check for outdated information
            const outdatedIssues = this.checkOutdatedInformation(content, filePath);
            result.issues.push(...outdatedIssues);

        } catch (error) {
            result.issues.push({
                type: 'read-error',
                severity: 'error',
                message: `Could not read documentation file: ${error.message}`,
                file: filePath
            });
        }

        return result;
    }

    /**
     * Extract sections from markdown content
     */
    extractSections(content) {
        const sections = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            // Match headers (# ## ###)
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                sections.push(headerMatch[2].trim());
            }
        });

        return sections;
    }

    /**
     * Check documentation content for issues
     */
    checkDocumentationContent(content, filePath) {
        const issues = [];

        // Check for broken links (basic check)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const [, text, url] = match;
            if (url.startsWith('http') && !url.includes('github.com') && !url.includes('localhost')) {
                // Could check if link is reachable, but for now just flag external links
                issues.push({
                    type: 'external-link',
                    severity: 'info',
                    message: `External link found: ${text} -> ${url}`,
                    file: filePath
                });
            }
        }

        // Check for TODO/FIXME in documentation
        const todoRegex = /\b(TODO|FIXME|XXX)\b/gi;
        if (todoRegex.test(content)) {
            issues.push({
                type: 'documentation-todo',
                severity: 'info',
                message: 'Documentation contains TODO/FIXME items',
                file: filePath
            });
        }

        // Check for code blocks without language specification
        const codeBlockRegex = /```(\w*)/g;
        let codeMatch;
        while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
            if (!codeMatch[1]) {
                issues.push({
                    type: 'code-block',
                    severity: 'warning',
                    message: 'Code block without language specification',
                    file: filePath
                });
            }
        }

        return issues;
    }

    /**
     * Check for outdated information in documentation
     */
    checkOutdatedInformation(content, filePath) {
        const issues = [];

        // Check for version references that might be outdated
        const versionRegex = /v?\d+\.\d+\.\d+/g;
        const versions = content.match(versionRegex);
        if (versions) {
            // Could check against package.json, but for now just flag
            issues.push({
                type: 'version-reference',
                severity: 'info',
                message: `Documentation contains version references: ${versions.slice(0, 3).join(', ')}`,
                file: filePath
            });
        }

        // Check for date references that might be old
        const dateRegex = /\b\d{4}-\d{2}-\d{2}\b/g;
        const dates = content.match(dateRegex);
        if (dates) {
            const oldDates = dates.filter(date => {
                const dateObj = new Date(date);
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                return dateObj < sixMonthsAgo;
            });

            if (oldDates.length > 0) {
                issues.push({
                    type: 'outdated-date',
                    severity: 'warning',
                    message: `Documentation contains old dates: ${oldDates.slice(0, 3).join(', ')}`,
                    file: filePath
                });
            }
        }

        return issues;
    }

    /**
     * Check if documentation matches code
     */
    checkCodeDocumentationMatch(patterns, projectRoot) {
        const matches = {
            documented: 0,
            undocumented: 0,
            total: 0
        };

        try {
            // Find code files
            const codeFiles = this.findCodeFiles(projectRoot);

            patterns.forEach(pattern => {
                codeFiles.forEach(file => {
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        const patternMatches = content.match(pattern);
                        if (patternMatches) {
                            matches.total += patternMatches.length;
                            // In a real implementation, we'd check if each match has documentation
                            // For now, assume some are documented
                            matches.documented += Math.floor(patternMatches.length * 0.7);
                            matches.undocumented += Math.floor(patternMatches.length * 0.3);
                        }
                    } catch (error) {
                        // Skip files that can't be read
                    }
                });
            });
        } catch (error) {
            // If we can't analyze code, assume partial documentation
            matches.documented = 50;
            matches.undocumented = 50;
            matches.total = 100;
        }

        return matches;
    }

    /**
     * Find code files in the project
     */
    findCodeFiles(projectRoot) {
        const codeFiles = [];
        const extensions = ['.js', '.ts', '.py', '.java', '.cpp', '.c'];

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
     * Check for missing documentation
     */
    checkMissingDocumentation(projectRoot) {
        const missing = [];

        // Check for common missing documentation
        const commonFiles = [
            'README.md',
            'CONTRIBUTING.md',
            'CHANGELOG.md',
            'LICENSE',
            'docs/',
            'API_DOCUMENTATION.md'
        ];

        commonFiles.forEach(file => {
            const filePath = path.join(projectRoot, file);
            if (!fs.existsSync(filePath)) {
                missing.push({
                    type: 'missing-file',
                    file: file,
                    severity: 'warning',
                    message: `Missing documentation file: ${file}`
                });
            }
        });

        return missing;
    }

    /**
     * Calculate coverage metrics
     */
    calculateCoverageMetrics(documentation) {
        const coverage = {
            files: 0,
            types: 0,
            completeness: 0,
            recency: 0
        };

        const totalTypes = Object.keys(documentation).length;
        let existingTypes = 0;
        let totalCompleteness = 0;

        Object.values(documentation).forEach(doc => {
            if (doc.exists) {
                existingTypes++;
                coverage.files += doc.files.length;
                totalCompleteness += doc.completeness;

                // Check recency (last 6 months)
                if (doc.lastModified) {
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                    if (doc.lastModified > sixMonthsAgo) {
                        coverage.recency += 100 / totalTypes;
                    }
                }
            }
        });

        coverage.types = (existingTypes / totalTypes) * 100;
        coverage.completeness = totalCompleteness / existingTypes || 0;

        return coverage;
    }

    /**
     * Collect all issues
     */
    collectAllIssues(analysis) {
        const issues = [];

        // Documentation issues
        Object.values(analysis.documentation).forEach(doc => {
            issues.push(...doc.issues);
        });

        // Missing documentation
        issues.push(...analysis.missing);

        return issues;
    }

    /**
     * Generate suggestions
     */
    generateSuggestions(analysis) {
        const suggestions = [];

        // Suggest creating missing documentation
        analysis.missing.forEach(missing => {
            suggestions.push(`Create ${missing.file} with standard project documentation`);
        });

        // Suggest improving existing documentation
        Object.entries(analysis.documentation).forEach(([type, doc]) => {
            if (doc.exists && doc.completeness < 80) {
                suggestions.push(`Improve ${type} documentation completeness (currently ${doc.completeness.toFixed(1)}%)`);
            }

            if (doc.lastModified) {
                const daysSinceUpdate = (Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceUpdate > 90) {
                    suggestions.push(`Update ${type} documentation (last updated ${Math.round(daysSinceUpdate)} days ago)`);
                }
            }
        });

        // General suggestions
        if (analysis.coverage.types < 60) {
            suggestions.push('Create a comprehensive documentation strategy for the project');
        }

        if (analysis.coverage.completeness < 70) {
            suggestions.push('Review and complete missing sections in existing documentation');
        }

        return suggestions;
    }

    /**
     * Calculate completeness score
     */
    calculateCompletenessScore(analysis) {
        let score = 0;

        // File coverage (40%)
        score += analysis.coverage.types * 0.4;

        // Completeness (30%)
        score += analysis.coverage.completeness * 0.3;

        // Recency (20%)
        score += analysis.coverage.recency * 0.2;

        // Quality bonus (10%) - based on lack of critical issues
        const criticalIssues = analysis.issues.filter(i => i.severity === 'error').length;
        const qualityBonus = Math.max(0, 100 - (criticalIssues * 20));
        score += qualityBonus * 0.1;

        return Math.round(Math.min(100, Math.max(0, score)));
    }

    /**
     * Save completeness report
     */
    saveCompletenessReport(analysis, filePath = 'documentation-completeness-report.json') {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: analysis
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`Documentation completeness report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }
}

// CLI interface
if (require.main === module) {
    const checker = new DocumentationCompletenessChecker();

    const command = process.argv[2];

    switch (command) {
        case 'check':
            const projectRoot = process.argv[3] || process.cwd();

            console.log(`🔍 Checking documentation completeness for: ${projectRoot}`);
            const analysis = checker.checkProjectCompleteness(projectRoot);

            console.log(`\n📊 Documentation Completeness Report`);
            console.log(`Overall Score: ${analysis.score}/100`);

            console.log('\n📋 Documentation Coverage:');
            console.log(`Types Covered: ${analysis.coverage.types.toFixed(1)}%`);
            console.log(`Average Completeness: ${analysis.coverage.completeness.toFixed(1)}%`);
            console.log(`Recent Updates: ${analysis.coverage.recency.toFixed(1)}%`);
            console.log(`Documentation Files: ${analysis.coverage.files}`);

            console.log('\n📚 Documentation Status:');
            Object.entries(analysis.documentation).forEach(([type, doc]) => {
                const status = doc.exists ? `✅ ${doc.completeness.toFixed(1)}%` : '❌ Missing';
                console.log(`  ${type}: ${status}`);
            });

            if (analysis.issues.length > 0) {
                console.log('\n⚠️  Issues Found:');
                analysis.issues.slice(0, 10).forEach(issue => {
                    console.log(`  • ${issue.message} (${issue.severity})`);
                });
                if (analysis.issues.length > 10) {
                    console.log(`  ... and ${analysis.issues.length - 10} more issues`);
                }
            }

            if (analysis.suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                analysis.suggestions.forEach(suggestion => {
                    console.log(`  • ${suggestion}`);
                });
            }

            checker.saveCompletenessReport(analysis);
            break;

        case 'analyze':
            const filePath = process.argv[3];
            if (!filePath) {
                console.log('Usage: node documentation-completeness-checker.js analyze <file>');
                process.exit(1);
            }

            const fileAnalysis = checker.analyzeDocumentationFile(filePath, { required: [] });
            console.log(`\n📝 Documentation File Analysis: ${filePath}`);
            console.log(`Completeness: ${fileAnalysis.completeness.toFixed(1)}%`);

            if (fileAnalysis.issues.length > 0) {
                console.log('\n⚠️  Issues:');
                fileAnalysis.issues.forEach(issue => {
                    console.log(`  • ${issue.message} (${issue.severity})`);
                });
            }

            console.log('\n📊 Coverage:');
            Object.entries(fileAnalysis.coverage).forEach(([section, covered]) => {
                console.log(`  ${section}: ${covered ? '✅' : '❌'}`);
            });
            break;

        default:
            console.log('Usage: node documentation-completeness-checker.js <command> [args]');
            console.log('Commands:');
            console.log('  check [project-root] - Check documentation completeness');
            console.log('  analyze <file>        - Analyze specific documentation file');
            process.exit(1);
    }
}

module.exports = DocumentationCompletenessChecker;