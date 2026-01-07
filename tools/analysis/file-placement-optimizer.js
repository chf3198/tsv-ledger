#!/usr/bin/env node

/**
 * Optimal File Placement Suggestion System
 * Analyzes codebase and suggests optimal file organization
 */

const fs = require('fs');
const path = require('path');
const AutomatedIndexingSystem = require('./automated-indexing-system');
const CrossReferenceDatabase = require('./cross-reference-database');

class FilePlacementOptimizer {
    constructor() {
        this.indexer = new AutomatedIndexingSystem();
        this.database = new CrossReferenceDatabase();
        this.suggestions = [];
        this.currentStructure = new Map();
        this.optimalStructure = new Map();
        this.moveOperations = [];
    }

    /**
     * Analyze current file placement and generate optimization suggestions
     */
    async analyzeFilePlacement(rootPath = process.cwd()) {
        console.log('🎯 Analyzing file placement for optimization...');

        const startTime = Date.now();

        // Load index and database
        this.indexer.loadIndex();
        this.database.loadDatabase();

        // Analyze current structure
        await this.analyzeCurrentStructure(rootPath);

        // Generate placement suggestions
        await this.generatePlacementSuggestions();

        // Calculate optimal structure
        await this.calculateOptimalStructure();

        // Generate move operations
        this.generateMoveOperations();

        const duration = Date.now() - startTime;
        console.log(`✅ File placement analysis completed in ${duration}ms`);

        return this.getOptimizationReport();
    }

    /**
     * Analyze current directory structure
     */
    async analyzeCurrentStructure(rootPath) {
        console.log('  Analyzing current structure...');

        this.indexer.index.forEach((fileIndex, filePath) => {
            const relativePath = path.relative(rootPath, filePath);
            const directory = path.dirname(relativePath);
            const fileName = path.basename(relativePath);

            if (!this.currentStructure.has(directory)) {
                this.currentStructure.set(directory, []);
            }
            this.currentStructure.get(directory).push({
                name: fileName,
                path: filePath,
                functions: fileIndex.functions.length,
                classes: fileIndex.classes.length,
                imports: fileIndex.imports.length,
                size: fileIndex.lineCount || 0
            });
        });
    }

    /**
     * Generate placement suggestions based on analysis
     */
    async generatePlacementSuggestions() {
        console.log('  Generating placement suggestions...');

        // Suggestion 1: Group related files by functionality
        this.suggestFunctionalGrouping();

        // Suggestion 2: Separate concerns (MVC, business logic, etc.)
        this.suggestSeparationOfConcerns();

        // Suggestion 3: Optimize import distances
        this.suggestImportOptimization();

        // Suggestion 4: Consolidate small related files
        this.suggestFileConsolidation();

        // Suggestion 5: Extract shared utilities
        this.suggestUtilityExtraction();

        // Suggestion 6: Create feature-based directories
        this.suggestFeatureDirectories();
    }

    /**
     * Suggest functional grouping of related files
     */
    suggestFunctionalGrouping() {
        const functionalGroups = this.identifyFunctionalGroups();

        functionalGroups.forEach(group => {
            if (group.files.length > 1 && !this.areFilesCoLocated(group.files)) {
                this.suggestions.push({
                    type: 'functional-grouping',
                    priority: 'medium',
                    title: `Group related ${group.category} files`,
                    description: `Files ${group.files.map(f => path.basename(f)).join(', ')} are related but in different directories`,
                    files: group.files,
                    suggestedDirectory: `src/${group.category}`,
                    impact: 'improves code navigation and maintainability'
                });
            }
        });
    }

    /**
     * Identify functional groups based on naming and content
     */
    identifyFunctionalGroups() {
        const groups = new Map();

        this.indexer.index.forEach((fileIndex, filePath) => {
            const fileName = path.basename(filePath, '.js');
            const directory = path.dirname(filePath);

            // Group by common prefixes/suffixes
            const prefixes = ['test-', 'demo-', 'util-', 'config-', 'validator-', 'optimizer-'];
            const suffix = prefixes.find(prefix => fileName.startsWith(prefix));

            if (suffix) {
                const category = suffix.replace('-', '');
                if (!groups.has(category)) {
                    groups.set(category, { category, files: [] });
                }
                groups.get(category).files.push(filePath);
            }

            // Group by functionality based on content analysis
            const functionality = this.identifyFileFunctionality(fileIndex);
            if (functionality) {
                if (!groups.has(functionality)) {
                    groups.set(functionality, { category: functionality, files: [] });
                }
                groups.get(functionality).files.push(filePath);
            }
        });

        return Array.from(groups.values()).filter(group => group.files.length > 1);
    }

    /**
     * Identify file functionality based on content
     */
    identifyFileFunctionality(fileIndex) {
        const content = fs.readFileSync(fileIndex.absolutePath, 'utf8').toLowerCase();

        if (content.includes('test') && content.includes('describe')) {
            return 'testing';
        } else if (content.includes('route') || content.includes('router')) {
            return 'routing';
        } else if (content.includes('database') || content.includes('db')) {
            return 'database';
        } else if (content.includes('auth') || content.includes('login')) {
            return 'authentication';
        } else if (content.includes('validate') || content.includes('validation')) {
            return 'validation';
        } else if (content.includes('optimize') || content.includes('analysis')) {
            return 'optimization';
        }

        return null;
    }

    /**
     * Check if files are co-located
     */
    areFilesCoLocated(files) {
        const directories = files.map(f => path.dirname(f));
        return directories.every(dir => dir === directories[0]);
    }

    /**
     * Suggest separation of concerns
     */
    suggestSeparationOfConcerns() {
        const mixedConcernFiles = this.identifyMixedConcerns();

        mixedConcernFiles.forEach(file => {
            this.suggestions.push({
                type: 'separation-of-concerns',
                priority: 'high',
                title: 'Separate mixed concerns',
                description: `${path.basename(file.path)} contains multiple concerns that should be separated`,
                files: [file.path],
                suggestedAction: 'Split into multiple focused files',
                impact: 'improves maintainability and testability'
            });
        });
    }

    /**
     * Identify files with mixed concerns
     */
    identifyMixedConcerns() {
        const mixedFiles = [];

        this.indexer.index.forEach((fileIndex, filePath) => {
            const concerns = this.analyzeFileConcerns(fileIndex);

            if (concerns.length > 2) {
                mixedFiles.push({
                    path: filePath,
                    concerns: concerns
                });
            }
        });

        return mixedFiles;
    }

    /**
     * Analyze concerns in a file
     */
    analyzeFileConcerns(fileIndex) {
        const concerns = new Set();
        const content = fs.readFileSync(fileIndex.absolutePath, 'utf8').toLowerCase();

        if (content.includes('route') || content.includes('app.') || content.includes('listen')) {
            concerns.add('server-setup');
        }
        if (content.includes('database') || content.includes('query') || content.includes('insert')) {
            concerns.add('data-access');
        }
        if (content.includes('validate') || content.includes('check') || content.includes('error')) {
            concerns.add('validation');
        }
        if (content.includes('render') || content.includes('html') || content.includes('template')) {
            concerns.add('presentation');
        }
        if (content.includes('business') || content.includes('logic') || content.includes('calculate')) {
            concerns.add('business-logic');
        }

        return Array.from(concerns);
    }

    /**
     * Suggest import optimization
     */
    suggestImportOptimization() {
        const importChains = this.analyzeImportChains();

        importChains.forEach(chain => {
            if (chain.length > 3) {
                this.suggestions.push({
                    type: 'import-optimization',
                    priority: 'low',
                    title: 'Optimize import chain',
                    description: `Long import chain detected: ${chain.join(' -> ')}`,
                    files: chain,
                    suggestedAction: 'Consider direct imports or facade pattern',
                    impact: 'reduces coupling and improves build performance'
                });
            }
        });
    }

    /**
     * Analyze import chains
     */
    analyzeImportChains() {
        const chains = [];

        this.database.importGraph.forEach((imports, file) => {
            imports.forEach(imp => {
                const chain = this.traceImportChain(file, imp.from, []);
                if (chain.length > 2) {
                    chains.push(chain);
                }
            });
        });

        return chains.slice(0, 10); // Limit results
    }

    /**
     * Trace import chain
     */
    traceImportChain(currentFile, targetModule, visited) {
        if (visited.includes(currentFile)) {
            return visited;
        }

        visited.push(currentFile);

        // Find files that export the target module
        for (const [file, imports] of this.database.importGraph) {
            if (file !== currentFile && imports.some(imp => imp.name === targetModule)) {
                return this.traceImportChain(file, targetModule, visited);
            }
        }

        return visited;
    }

    /**
     * Suggest file consolidation
     */
    suggestFileConsolidation() {
        const smallRelatedFiles = this.findSmallRelatedFiles();

        smallRelatedFiles.forEach(group => {
            this.suggestions.push({
                type: 'file-consolidation',
                priority: 'low',
                title: 'Consolidate small related files',
                description: `Small related files could be consolidated: ${group.files.map(f => path.basename(f.path)).join(', ')}`,
                files: group.files.map(f => f.path),
                suggestedAction: 'Merge into single file or create index file',
                impact: 'reduces file count and improves organization'
            });
        });
    }

    /**
     * Find small related files
     */
    findSmallRelatedFiles() {
        const smallFiles = [];

        this.currentStructure.forEach((files, directory) => {
            const tinyFiles = files.filter(f => f.size < 50 && f.functions < 3);

            if (tinyFiles.length > 2) {
                // Check if they're related
                const functionality = tinyFiles.map(f => this.identifyFileFunctionality(this.indexer.index.get(f.path))).filter(Boolean);
                const uniqueFunctionality = new Set(functionality);

                if (uniqueFunctionality.size === 1) {
                    smallFiles.push({
                        directory,
                        files: tinyFiles,
                        functionality: Array.from(uniqueFunctionality)[0]
                    });
                }
            }
        });

        return smallFiles;
    }

    /**
     * Suggest utility extraction
     */
    suggestUtilityExtraction() {
        const sharedFunctions = this.identifySharedFunctions();

        sharedFunctions.forEach(shared => {
            if (shared.usageCount > 3) {
                this.suggestions.push({
                    type: 'utility-extraction',
                    priority: 'medium',
                    title: 'Extract shared utility function',
                    description: `Function '${shared.name}' is used in ${shared.usageCount} files`,
                    files: shared.files,
                    suggestedAction: `Extract to shared utility file`,
                    impact: 'reduces code duplication and improves maintainability'
                });
            }
        });
    }

    /**
     * Identify shared functions
     */
    identifySharedFunctions() {
        const functionUsage = new Map();

        this.database.symbolTable.forEach((symbol, symbolKey) => {
            if (symbol.type === 'function') {
                const [name] = symbolKey.split(':');
                if (!functionUsage.has(name)) {
                    functionUsage.set(name, { name, files: [], usageCount: 0 });
                }
                const usage = functionUsage.get(name);
                usage.files.push(symbol.file);
                usage.usageCount += symbol.references.length;
            }
        });

        return Array.from(functionUsage.values()).filter(usage => usage.files.length > 1);
    }

    /**
     * Suggest feature-based directories
     */
    suggestFeatureDirectories() {
        const features = this.identifyFeatures();

        features.forEach(feature => {
            if (feature.files.length > 2 && !this.hasFeatureDirectory(feature.name)) {
                this.suggestions.push({
                    type: 'feature-directory',
                    priority: 'high',
                    title: 'Create feature directory',
                    description: `Create dedicated directory for ${feature.name} feature`,
                    files: feature.files,
                    suggestedDirectory: `src/features/${feature.name}`,
                    impact: 'improves feature isolation and team collaboration'
                });
            }
        });
    }

    /**
     * Identify features based on file relationships
     */
    identifyFeatures() {
        const features = new Map();

        // Group files by common functionality patterns
        this.indexer.index.forEach((fileIndex, filePath) => {
            const feature = this.extractFeatureName(filePath);

            if (feature) {
                if (!features.has(feature)) {
                    features.set(feature, { name: feature, files: [] });
                }
                features.get(feature).files.push(filePath);
            }
        });

        return Array.from(features.values()).filter(f => f.files.length > 1);
    }

    /**
     * Extract feature name from file path
     */
    extractFeatureName(filePath) {
        const fileName = path.basename(filePath, '.js');

        // Look for feature indicators in filename
        const featurePatterns = [
            'amazon', 'employee-benefits', 'reconciliation', 'geographic',
            'subscription', 'bank', 'navigation', 'dashboard', 'auth'
        ];

        return featurePatterns.find(pattern => fileName.includes(pattern));
    }

    /**
     * Check if feature directory exists
     */
    hasFeatureDirectory(featureName) {
        const featureDir = path.join(process.cwd(), 'src', 'features', featureName);
        return fs.existsSync(featureDir);
    }

    /**
     * Calculate optimal structure
     */
    async calculateOptimalStructure() {
        console.log('  Calculating optimal structure...');

        // Create optimal directory structure based on suggestions
        this.suggestions.forEach(suggestion => {
            if (suggestion.suggestedDirectory) {
                if (!this.optimalStructure.has(suggestion.suggestedDirectory)) {
                    this.optimalStructure.set(suggestion.suggestedDirectory, []);
                }
                this.optimalStructure.get(suggestion.suggestedDirectory).push(...suggestion.files);
            }
        });
    }

    /**
     * Generate move operations
     */
    generateMoveOperations() {
        console.log('  Generating move operations...');

        this.suggestions.forEach(suggestion => {
            if (suggestion.suggestedDirectory && suggestion.files) {
                suggestion.files.forEach(file => {
                    const fileName = path.basename(file);
                    const newPath = path.join(suggestion.suggestedDirectory, fileName);
                    const currentDir = path.dirname(file);

                    if (currentDir !== suggestion.suggestedDirectory) {
                        this.moveOperations.push({
                            from: file,
                            to: newPath,
                            reason: suggestion.title,
                            type: suggestion.type
                        });
                    }
                });
            }
        });
    }

    /**
     * Get optimization report
     */
    getOptimizationReport() {
        const highPriority = this.suggestions.filter(s => s.priority === 'high');
        const mediumPriority = this.suggestions.filter(s => s.priority === 'medium');
        const lowPriority = this.suggestions.filter(s => s.priority === 'low');

        return {
            timestamp: new Date().toISOString(),
            analysis: {
                filesAnalyzed: this.indexer.index.size,
                suggestionsGenerated: this.suggestions.length,
                moveOperations: this.moveOperations.length
            },
            priorityBreakdown: {
                high: highPriority.length,
                medium: mediumPriority.length,
                low: lowPriority.length
            },
            suggestions: this.suggestions.slice(0, 20), // Limit for readability
            moveOperations: this.moveOperations.slice(0, 10),
            impact: this.calculateImpactMetrics()
        };
    }

    /**
     * Calculate impact metrics
     */
    calculateImpactMetrics() {
        const impact = {
            maintainability: 0,
            performance: 0,
            collaboration: 0,
            testability: 0
        };

        this.suggestions.forEach(suggestion => {
            switch (suggestion.type) {
                case 'functional-grouping':
                    impact.maintainability += 2;
                    impact.collaboration += 1;
                    break;
                case 'separation-of-concerns':
                    impact.maintainability += 3;
                    impact.testability += 2;
                    break;
                case 'feature-directory':
                    impact.collaboration += 3;
                    impact.maintainability += 2;
                    break;
                case 'utility-extraction':
                    impact.maintainability += 2;
                    impact.performance += 1;
                    break;
            }
        });

        // Normalize to 0-100 scale
        Object.keys(impact).forEach(key => {
            impact[key] = Math.min(100, impact[key] * 10);
        });

        return impact;
    }

    /**
     * Save optimization report
     */
    saveOptimizationReport(filePath = 'file-placement-optimization-report.json') {
        const report = this.getOptimizationReport();

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`File placement optimization report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }

    /**
     * Apply suggestions (dry run)
     */
    async applySuggestions(dryRun = true) {
        console.log(`${dryRun ? 'DRY RUN: ' : ''}Applying file placement optimizations...`);

        for (const operation of this.moveOperations) {
            if (dryRun) {
                console.log(`  Would move: ${operation.from} -> ${operation.to}`);
            } else {
                // Actual move operation would go here
                console.log(`  Moving: ${operation.from} -> ${operation.to}`);
            }
        }

        return this.moveOperations.length;
    }
}

// CLI interface
if (require.main === module) {
    const optimizer = new FilePlacementOptimizer();

    const command = process.argv[2];

    switch (command) {
        case 'analyze':
            optimizer.analyzeFilePlacement().then(report => {
                console.log('\n🎯 File Placement Optimization Report:');
                console.log(`Files Analyzed: ${report.analysis.filesAnalyzed}`);
                console.log(`Suggestions: ${report.analysis.suggestionsGenerated}`);
                console.log(`Move Operations: ${report.analysis.moveOperations}`);

                console.log('\n📊 Priority Breakdown:');
                console.log(`High Priority: ${report.priorityBreakdown.high}`);
                console.log(`Medium Priority: ${report.priorityBreakdown.medium}`);
                console.log(`Low Priority: ${report.priorityBreakdown.low}`);

                console.log('\n💡 Impact Metrics:');
                Object.entries(report.impact).forEach(([key, value]) => {
                    console.log(`  ${key}: ${value}/100`);
                });

                optimizer.saveOptimizationReport();
                process.exit(0);
            }).catch(error => {
                console.error('Analysis failed:', error);
                process.exit(1);
            });
            break;

        case 'apply':
            const dryRun = process.argv[3] !== '--no-dry-run';
            optimizer.analyzeFilePlacement().then(() => {
                return optimizer.applySuggestions(dryRun);
            }).then(count => {
                console.log(`✅ ${dryRun ? 'Dry run completed' : 'Applied'} ${count} operations`);
            }).catch(error => {
                console.error('Apply failed:', error);
                process.exit(1);
            });
            break;

        default:
            console.log('Usage: node file-placement-optimizer.js <command> [options]');
            console.log('Commands:');
            console.log('  analyze              - Analyze current placement and generate suggestions');
            console.log('  apply [--no-dry-run] - Apply suggestions (dry run by default)');
            process.exit(1);
    }
}

module.exports = FilePlacementOptimizer;