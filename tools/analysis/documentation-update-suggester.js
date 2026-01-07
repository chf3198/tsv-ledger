#!/usr/bin/env node

/**
 * Documentation Update Suggestions Generator
 * Analyzes codebase and suggests documentation improvements
 */

const fs = require('fs');
const path = require('path');

class DocumentationUpdateSuggester {
    constructor() {
        this.suggestionTypes = {
            missingReadme: 'Missing README.md file',
            outdatedReadme: 'README.md may be outdated',
            missingApiDocs: 'Missing API documentation',
            incompleteFunctionDocs: 'Functions without proper documentation',
            missingModuleDocs: 'Modules without overview documentation',
            inconsistentDocStyle: 'Inconsistent documentation style',
            missingExamples: 'Missing usage examples',
            outdatedDependencies: 'Dependencies documentation may be outdated'
        };
    }

    /**
     * Generate documentation update suggestions for the project
     */
    generateSuggestions(projectRoot = process.cwd()) {
        const suggestions = {
            project: projectRoot,
            timestamp: new Date().toISOString(),
            priority: {
                critical: [],
                high: [],
                medium: [],
                low: []
            },
            summary: {
                totalSuggestions: 0,
                criticalCount: 0,
                highCount: 0,
                mediumCount: 0,
                lowCount: 0
            },
            analysis: {}
        };

        console.log(`🔍 Analyzing documentation needs for: ${projectRoot}`);

        // Analyze different aspects of documentation
        this.analyzeReadmeFiles(projectRoot, suggestions);
        this.analyzeApiDocumentation(projectRoot, suggestions);
        this.analyzeCodeDocumentation(projectRoot, suggestions);
        this.analyzeModuleStructure(projectRoot, suggestions);
        this.analyzeDependencies(projectRoot, suggestions);

        // Calculate summary statistics
        this.calculateSummary(suggestions);

        return suggestions;
    }

    /**
     * Analyze README files
     */
    analyzeReadmeFiles(projectRoot, suggestions) {
        const readmeFiles = this.findFilesByPattern(projectRoot, ['README.md', 'readme.md', 'README.txt']);

        if (readmeFiles.length === 0) {
            this.addSuggestion(suggestions, 'critical', 'missingReadme',
                'No README.md file found in project root',
                'Create a comprehensive README.md with project overview, installation, and usage instructions',
                ['README.md']);
        } else {
            // Check if README is comprehensive
            const readmePath = readmeFiles[0];
            try {
                const content = fs.readFileSync(readmePath, 'utf8');
                const lines = content.split('\n').length;

                if (lines < 50) {
                    this.addSuggestion(suggestions, 'high', 'outdatedReadme',
                        'README.md appears to be minimal or incomplete',
                        'Expand README.md with detailed project description, features, installation, and usage examples',
                        [readmePath]);
                }

                // Check for essential sections
                const hasInstallation = /install|setup|get.start/i.test(content);
                const hasUsage = /usage|example|how.to/i.test(content);
                const hasContributing = /contribut|develop/i.test(content);

                if (!hasInstallation) {
                    this.addSuggestion(suggestions, 'medium', 'outdatedReadme',
                        'README.md missing installation instructions',
                        'Add clear installation and setup instructions to README.md',
                        [readmePath]);
                }

                if (!hasUsage) {
                    this.addSuggestion(suggestions, 'medium', 'outdatedReadme',
                        'README.md missing usage examples',
                        'Add usage examples and API documentation links to README.md',
                        [readmePath]);
                }

                if (!hasContributing) {
                    this.addSuggestion(suggestions, 'low', 'outdatedReadme',
                        'README.md missing contributing guidelines',
                        'Add contributing guidelines and development setup to README.md',
                        [readmePath]);
                }

            } catch (error) {
                this.addSuggestion(suggestions, 'high', 'outdatedReadme',
                    `Could not read README.md: ${error.message}`,
                    'Ensure README.md is accessible and properly formatted',
                    [readmePath]);
            }
        }
    }

    /**
     * Analyze API documentation
     */
    analyzeApiDocumentation(projectRoot, suggestions) {
        const apiDocFiles = this.findFilesByPattern(projectRoot, ['API.md', 'api.md', 'docs/API.md', 'docs/api.md']);
        const hasApiRoutes = fs.existsSync(path.join(projectRoot, 'src/routes'));

        if (hasApiRoutes && apiDocFiles.length === 0) {
            this.addSuggestion(suggestions, 'high', 'missingApiDocs',
                'API routes exist but no API documentation found',
                'Create comprehensive API documentation covering all endpoints, parameters, and responses',
                ['docs/API.md']);
        }

        // Check for JSDoc in route files
        if (hasApiRoutes) {
            const routeFiles = this.findFilesByPattern(path.join(projectRoot, 'src/routes'), ['*.js']);
            let documentedRoutes = 0;
            let totalRoutes = 0;

            routeFiles.forEach(filePath => {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const jsdocComments = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
                    const routeDefinitions = (content.match(/router\.(get|post|put|delete|patch)/g) || []).length;

                    totalRoutes += routeDefinitions;
                    if (jsdocComments >= routeDefinitions) {
                        documentedRoutes += routeDefinitions;
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            });

            if (totalRoutes > 0 && documentedRoutes / totalRoutes < 0.5) {
                this.addSuggestion(suggestions, 'medium', 'incompleteFunctionDocs',
                    `Only ${documentedRoutes}/${totalRoutes} API routes have JSDoc documentation`,
                    'Add JSDoc comments to all API route handlers with parameter and response descriptions',
                    routeFiles);
            }
        }
    }

    /**
     * Analyze code documentation quality
     */
    analyzeCodeDocumentation(projectRoot, suggestions) {
        const codeFiles = this.findCodeFiles(projectRoot);
        let totalFunctions = 0;
        let documentedFunctions = 0;
        let filesWithIssues = [];

        codeFiles.forEach(filePath => {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');

                // Count functions
                const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|class\s+\w+/g) || [];
                totalFunctions += functionMatches.length;

                // Count JSDoc comments
                const jsdocMatches = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
                documentedFunctions += jsdocMatches.length;

                // Check for functions without documentation
                let hasUndocumentedFunction = false;
                lines.forEach((line, index) => {
                    if (line.includes('function ') || line.includes('const ') && line.includes('=>') || line.includes('class ')) {
                        // Check previous lines for JSDoc
                        let hasJSDoc = false;
                        for (let i = Math.max(0, index - 5); i < index; i++) {
                            if (lines[i].trim().startsWith('/**')) {
                                hasJSDoc = true;
                                break;
                            }
                        }
                        if (!hasJSDoc) {
                            hasUndocumentedFunction = true;
                        }
                    }
                });

                if (hasUndocumentedFunction) {
                    filesWithIssues.push(filePath);
                }

            } catch (error) {
                // Skip files that can't be read
            }
        });

        if (totalFunctions > 0) {
            const documentationRatio = documentedFunctions / totalFunctions;
            if (documentationRatio < 0.3) {
                this.addSuggestion(suggestions, 'high', 'incompleteFunctionDocs',
                    `Only ${Math.round(documentationRatio * 100)}% of functions have documentation (${documentedFunctions}/${totalFunctions})`,
                    'Add JSDoc comments to all public functions with descriptions, parameters, and return types',
                    filesWithIssues.slice(0, 10)); // Limit to first 10 files
            } else if (documentationRatio < 0.7) {
                this.addSuggestion(suggestions, 'medium', 'incompleteFunctionDocs',
                    `${Math.round(documentationRatio * 100)}% of functions documented - room for improvement`,
                    'Review and add JSDoc comments to remaining undocumented functions',
                    filesWithIssues.slice(0, 5));
            }
        }
    }

    /**
     * Analyze module structure documentation
     */
    analyzeModuleStructure(projectRoot, suggestions) {
        const srcDir = path.join(projectRoot, 'src');
        if (!fs.existsSync(srcDir)) {
            return;
        }

        // Check for module overview files
        const subdirs = fs.readdirSync(srcDir).filter(item => {
            const itemPath = path.join(srcDir, item);
            return fs.statSync(itemPath).isDirectory();
        });

        subdirs.forEach(subdir => {
            const subdirPath = path.join(srcDir, subdir);
            const readmePath = path.join(subdirPath, 'README.md');
            const indexPath = path.join(subdirPath, 'index.js');

            if (!fs.existsSync(readmePath) && fs.existsSync(indexPath)) {
                this.addSuggestion(suggestions, 'medium', 'missingModuleDocs',
                    `Module '${subdir}' missing README.md documentation`,
                    `Create README.md in src/${subdir}/ with module overview, purpose, and usage`,
                    [readmePath]);
            }
        });
    }

    /**
     * Analyze dependencies documentation
     */
    analyzeDependencies(projectRoot, suggestions) {
        const packageJsonPath = path.join(projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            const depCount = Object.keys(dependencies).length;

            // Check if there's documentation about dependencies
            const readmeFiles = this.findFilesByPattern(projectRoot, ['README.md', 'DEPENDENCIES.md', 'docs/DEPENDENCIES.md']);
            const hasDependencyDocs = readmeFiles.some(filePath => {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    return /dependenc|package|npm|yarn/i.test(content);
                } catch {
                    return false;
                }
            });

            if (depCount > 10 && !hasDependencyDocs) {
                this.addSuggestion(suggestions, 'low', 'outdatedDependencies',
                    `Project has ${depCount} dependencies but no dependency documentation`,
                    'Document key dependencies, their purposes, and any setup requirements',
                    ['DEPENDENCIES.md']);
            }

        } catch (error) {
            // Skip if package.json can't be read
        }
    }

    /**
     * Find files by glob patterns
     */
    findFilesByPattern(rootDir, patterns) {
        const files = [];

        function scanDir(dir) {
            try {
                const items = fs.readdirSync(dir);

                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        scanDir(fullPath);
                    } else if (stat.isFile()) {
                        if (patterns.some(pattern => {
                            const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
                            return regex.test(item);
                        })) {
                            files.push(fullPath);
                        }
                    }
                });
            } catch (error) {
                // Skip directories we can't read
            }
        }

        scanDir(rootDir);
        return files;
    }

    /**
     * Find code files in the project
     */
    findCodeFiles(projectRoot) {
        const extensions = ['.js', '.ts', '.py', '.jsx', '.tsx'];
        return this.findFilesByPattern(projectRoot, extensions.map(ext => `*${ext}`));
    }

    /**
     * Add a suggestion to the results
     */
    addSuggestion(suggestions, priority, type, title, description, files = []) {
        const suggestion = {
            type: type,
            title: title,
            description: description,
            files: files,
            timestamp: new Date().toISOString()
        };

        suggestions.priority[priority].push(suggestion);
    }

    /**
     * Calculate summary statistics
     */
    calculateSummary(suggestions) {
        suggestions.summary.criticalCount = suggestions.priority.critical.length;
        suggestions.summary.highCount = suggestions.priority.high.length;
        suggestions.summary.mediumCount = suggestions.priority.medium.length;
        suggestions.summary.lowCount = suggestions.priority.low.length;
        suggestions.summary.totalSuggestions =
            suggestions.summary.criticalCount +
            suggestions.summary.highCount +
            suggestions.summary.mediumCount +
            suggestions.summary.lowCount;
    }

    /**
     * Save documentation suggestions report
     */
    saveSuggestionsReport(suggestions, filePath = 'documentation-suggestions-report.json') {
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            suggestions: suggestions
        };

        fs.writeFileSync(path.join(reportsDir, filePath), JSON.stringify(report, null, 2));
        console.log(`Documentation suggestions report saved to reports/${filePath}`);

        return path.join(reportsDir, filePath);
    }
}

// CLI interface
if (require.main === module) {
    const suggester = new DocumentationUpdateSuggester();

    const command = process.argv[2];

    switch (command) {
        case 'suggest':
            const projectRoot = process.argv[3] || process.cwd();

            console.log(`📚 Generating documentation update suggestions for: ${projectRoot}`);
            const suggestions = suggester.generateSuggestions(projectRoot);

            console.log(`\n📊 Documentation Suggestions Report`);
            console.log(`Total Suggestions: ${suggestions.summary.totalSuggestions}`);

            ['critical', 'high', 'medium', 'low'].forEach(priority => {
                const count = suggestions.priority[priority].length;
                if (count > 0) {
                    console.log(`\n${priority.toUpperCase()} PRIORITY (${count}):`);
                    suggestions.priority[priority].forEach((suggestion, index) => {
                        console.log(`  ${index + 1}. ${suggestion.title}`);
                        console.log(`     ${suggestion.description}`);
                        if (suggestion.files.length > 0) {
                            console.log(`     Files: ${suggestion.files.slice(0, 3).join(', ')}${suggestion.files.length > 3 ? '...' : ''}`);
                        }
                    });
                }
            });

            suggester.saveSuggestionsReport(suggestions);
            break;

        default:
            console.log('Usage: node documentation-update-suggester.js suggest [project-root]');
            console.log('Generates documentation improvement suggestions for the project');
            process.exit(1);
    }
}

module.exports = DocumentationUpdateSuggester;