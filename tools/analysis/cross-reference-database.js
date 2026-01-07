#!/usr/bin/env node

/**
 * Cross-Reference Database System
 * Advanced database for symbol cross-referencing and dependency analysis
 */

const fs = require('fs');
const path = require('path');
const AutomatedIndexingSystem = require('./automated-indexing-system');

class CrossReferenceDatabase {
    constructor() {
        this.database = new Map();
        this.symbolTable = new Map();
        this.callGraph = new Map();
        this.inheritanceGraph = new Map();
        this.importGraph = new Map();
        this.usagePatterns = new Map();
        this.metadata = {
            lastUpdated: null,
            totalSymbols: 0,
            totalReferences: 0,
            totalFiles: 0
        };
    }

    /**
     * Build comprehensive cross-reference database
     */
    async buildCrossReferenceDatabase(rootPath = process.cwd()) {
        console.log('🔗 Building cross-reference database...');

        const startTime = Date.now();

        // Initialize indexer and build index
        const indexer = new AutomatedIndexingSystem();
        await indexer.buildComprehensiveIndex(rootPath);

        // Build cross-reference structures
        await this.buildSymbolTable(indexer);
        await this.buildCallGraph(indexer);
        await this.buildInheritanceGraph(indexer);
        await this.buildImportGraph(indexer);
        await this.analyzeUsagePatterns(indexer);

        // Update metadata
        this.metadata.lastUpdated = new Date().toISOString();
        this.metadata.totalSymbols = this.symbolTable.size;
        this.metadata.totalReferences = this.calculateTotalReferences();
        this.metadata.totalFiles = indexer.index.size;

        const duration = Date.now() - startTime;
        console.log(`✅ Cross-reference database built in ${duration}ms`);
        console.log(`Symbols: ${this.metadata.totalSymbols}, References: ${this.metadata.totalReferences}`);

        return this.getDatabaseSummary();
    }

    /**
     * Build symbol table with comprehensive metadata
     */
    async buildSymbolTable(indexer) {
        console.log('  Building symbol table...');

        indexer.index.forEach((fileIndex, filePath) => {
            // Process functions
            fileIndex.functions.forEach(func => {
                const symbolKey = `${func.name}:${filePath}`;
                this.symbolTable.set(symbolKey, {
                    name: func.name,
                    type: 'function',
                    file: filePath,
                    line: func.line,
                    signature: func.signature,
                    visibility: this.determineVisibility(func),
                    complexity: this.estimateFunctionComplexity(func),
                    references: [],
                    calledBy: [],
                    calls: []
                });
            });

            // Process classes
            fileIndex.classes.forEach(cls => {
                const symbolKey = `${cls.name}:${filePath}`;
                this.symbolTable.set(symbolKey, {
                    name: cls.name,
                    type: 'class',
                    file: filePath,
                    line: cls.line,
                    extends: cls.extends,
                    methods: cls.methods,
                    visibility: 'public',
                    references: [],
                    inheritedBy: [],
                    inheritsFrom: cls.extends ? [cls.extends] : []
                });
            });
        });

        // Cross-reference symbols
        this.buildSymbolReferences(indexer);
    }

    /**
     * Build symbol references
     */
    buildSymbolReferences(indexer) {
        this.symbolTable.forEach((symbol, symbolKey) => {
            const [symbolName] = symbolKey.split(':');

            // Find all references to this symbol
            indexer.index.forEach((fileIndex, filePath) => {
                const content = fs.readFileSync(fileIndex.absolutePath, 'utf8');
                const lines = content.split('\n');

                lines.forEach((line, lineIndex) => {
                    if (line.includes(symbolName) &&
                        !this.isDefinitionLine(line, symbolName, symbol.type)) {
                        symbol.references.push({
                            file: filePath,
                            line: lineIndex + 1,
                            context: line.trim(),
                            type: this.determineReferenceType(line, symbolName)
                        });
                    }
                });
            });
        });
    }

    /**
     * Check if line is a definition
     */
    isDefinitionLine(line, symbolName, symbolType) {
        if (symbolType === 'function') {
            return line.includes(`function ${symbolName}`) ||
                   line.includes(`const ${symbolName} =`) ||
                   line.includes(` ${symbolName}(`) && line.includes('=>');
        } else if (symbolType === 'class') {
            return line.includes(`class ${symbolName}`);
        }
        return false;
    }

    /**
     * Determine reference type
     */
    determineReferenceType(line, symbolName) {
        if (line.includes(`${symbolName}(`)) {
            return 'call';
        } else if (line.includes(`new ${symbolName}`)) {
            return 'instantiation';
        } else if (line.includes(`extends ${symbolName}`)) {
            return 'inheritance';
        } else if (line.includes(`import.*${symbolName}`) || line.includes(`require.*${symbolName}`)) {
            return 'import';
        } else {
            return 'reference';
        }
    }

    /**
     * Determine symbol visibility
     */
    determineVisibility(symbol) {
        // Simplified visibility detection
        if (symbol.name.startsWith('_')) {
            return 'private';
        } else if (symbol.name.startsWith('#')) {
            return 'private';
        } else {
            return 'public';
        }
    }

    /**
     * Estimate function complexity
     */
    estimateFunctionComplexity(func) {
        // Simplified complexity estimation based on signature
        let complexity = 1; // Base complexity

        const signature = func.signature || '';
        complexity += (signature.match(/,/g) || []).length; // Parameters
        if (signature.includes('async')) complexity += 1;
        if (signature.includes('=>')) complexity += 1; // Arrow function

        return complexity;
    }

    /**
     * Build call graph
     */
    async buildCallGraph(indexer) {
        console.log('  Building call graph...');

        this.symbolTable.forEach((symbol, symbolKey) => {
            if (symbol.type === 'function') {
                const [symbolName] = symbolKey.split(':');

                // Find functions called by this function
                const fileIndex = indexer.index.get(symbol.file);
                if (fileIndex) {
                    const content = fs.readFileSync(fileIndex.absolutePath, 'utf8');
                    const functionBlock = this.extractFunctionBlock(content, symbol.line);

                    if (functionBlock) {
                        const calledFunctions = this.extractFunctionCalls(functionBlock, indexer);
                        symbol.calls = calledFunctions;

                        // Update reverse references
                        calledFunctions.forEach(calledFunc => {
                            const calledSymbolKey = `${calledFunc}:${symbol.file}`;
                            const calledSymbol = this.symbolTable.get(calledSymbolKey);
                            if (calledSymbol) {
                                calledSymbol.calledBy.push({
                                    function: symbol.name,
                                    file: symbol.file,
                                    line: symbol.line
                                });
                            }
                        });
                    }
                }
            }
        });
    }

    /**
     * Extract function block from content
     */
    extractFunctionBlock(content, startLine) {
        const lines = content.split('\n');
        let braceCount = 0;
        let inFunction = false;
        let functionLines = [];

        for (let i = startLine - 1; i < lines.length; i++) {
            const line = lines[i];

            if (!inFunction && (line.includes('function') || line.includes('=>') || line.includes('('))) {
                inFunction = true;
            }

            if (inFunction) {
                functionLines.push(line);
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;

                if (braceCount === 0 && functionLines.length > 1) {
                    break;
                }
            }
        }

        return functionLines.join('\n');
    }

    /**
     * Extract function calls from code block
     */
    extractFunctionCalls(codeBlock, indexer) {
        const calls = new Set();
        const functionNames = new Set();

        // Get all function names from index
        indexer.functionIndex.forEach((locations, funcName) => {
            functionNames.add(funcName);
        });

        // Find calls in the code block
        functionNames.forEach(funcName => {
            const regex = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
            if (regex.test(codeBlock)) {
                calls.add(funcName);
            }
        });

        return Array.from(calls);
    }

    /**
     * Build inheritance graph
     */
    async buildInheritanceGraph(indexer) {
        console.log('  Building inheritance graph...');

        this.symbolTable.forEach((symbol, symbolKey) => {
            if (symbol.type === 'class' && symbol.inheritsFrom.length > 0) {
                symbol.inheritsFrom.forEach(parentClass => {
                    if (!this.inheritanceGraph.has(parentClass)) {
                        this.inheritanceGraph.set(parentClass, { children: [], parents: [] });
                    }

                    const parentNode = this.inheritanceGraph.get(parentClass);
                    parentNode.children.push({
                        class: symbol.name,
                        file: symbol.file
                    });

                    // Update child class
                    const childSymbolKey = `${symbol.name}:${symbol.file}`;
                    const childSymbol = this.symbolTable.get(childSymbolKey);
                    if (childSymbol) {
                        childSymbol.inheritedBy = parentNode.children;
                    }
                });
            }
        });
    }

    /**
     * Build import graph
     */
    async buildImportGraph(indexer) {
        console.log('  Building import graph...');

        indexer.index.forEach((fileIndex, filePath) => {
            const imports = [];

            fileIndex.imports.forEach(imp => {
                imports.push({
                    name: imp.name,
                    type: imp.type,
                    from: imp.from,
                    line: imp.line
                });
            });

            if (imports.length > 0) {
                this.importGraph.set(filePath, imports);
            }
        });
    }

    /**
     * Analyze usage patterns
     */
    async analyzeUsagePatterns(indexer) {
        console.log('  Analyzing usage patterns...');

        // Analyze function usage patterns
        this.symbolTable.forEach((symbol, symbolKey) => {
            if (symbol.type === 'function') {
                const pattern = {
                    totalReferences: symbol.references.length,
                    callFrequency: symbol.references.filter(ref => ref.type === 'call').length,
                    filesUsing: new Set(symbol.references.map(ref => ref.file)).size,
                    mostUsedIn: this.findMostUsedFile(symbol.references),
                    usageTrend: this.analyzeUsageTrend(symbol)
                };

                this.usagePatterns.set(symbolKey, pattern);
            }
        });
    }

    /**
     * Find most used file for a symbol
     */
    findMostUsedFile(references) {
        const fileCounts = {};
        references.forEach(ref => {
            fileCounts[ref.file] = (fileCounts[ref.file] || 0) + 1;
        });

        const sortedFiles = Object.entries(fileCounts)
            .sort(([,a], [,b]) => b - a);

        return sortedFiles[0] ? {
            file: sortedFiles[0][0],
            count: sortedFiles[0][1]
        } : null;
    }

    /**
     * Analyze usage trend (simplified)
     */
    analyzeUsageTrend(symbol) {
        // Simplified trend analysis
        const references = symbol.references.length;
        const calls = symbol.calls.length;

        if (references > calls * 2) {
            return 'high_usage';
        } else if (references > calls) {
            return 'moderate_usage';
        } else {
            return 'low_usage';
        }
    }

    /**
     * Calculate total references
     */
    calculateTotalReferences() {
        let total = 0;
        this.symbolTable.forEach(symbol => {
            total += symbol.references.length;
        });
        return total;
    }

    /**
     * Query symbol information
     */
    querySymbol(symbolName, filePath = null) {
        const results = [];

        this.symbolTable.forEach((symbol, symbolKey) => {
            const [name, file] = symbolKey.split(':');
            if (name === symbolName && (!filePath || file === filePath)) {
                const usagePattern = this.usagePatterns.get(symbolKey);
                results.push({
                    ...symbol,
                    usagePattern: usagePattern,
                    callGraph: this.getCallGraph(symbolKey),
                    inheritanceInfo: this.getInheritanceInfo(symbolKey)
                });
            }
        });

        return results;
    }

    /**
     * Get call graph for a symbol
     */
    getCallGraph(symbolKey) {
        const symbol = this.symbolTable.get(symbolKey);
        if (!symbol || symbol.type !== 'function') return null;

        return {
            calls: symbol.calls,
            calledBy: symbol.calledBy
        };
    }

    /**
     * Get inheritance information
     */
    getInheritanceInfo(symbolKey) {
        const symbol = this.symbolTable.get(symbolKey);
        if (!symbol || symbol.type !== 'class') return null;

        return {
            inheritsFrom: symbol.inheritsFrom,
            inheritedBy: symbol.inheritedBy
        };
    }

    /**
     * Find all usages of a symbol
     */
    findAllUsages(symbolName) {
        const usages = {
            definitions: [],
            calls: [],
            references: [],
            imports: []
        };

        this.symbolTable.forEach((symbol, symbolKey) => {
            const [name] = symbolKey.split(':');
            if (name === symbolName) {
                usages.definitions.push(symbol);

                symbol.references.forEach(ref => {
                    if (ref.type === 'call') {
                        usages.calls.push(ref);
                    } else if (ref.type === 'import') {
                        usages.imports.push(ref);
                    } else {
                        usages.references.push(ref);
                    }
                });
            }
        });

        return usages;
    }

    /**
     * Analyze dependencies between files
     */
    analyzeFileDependencies(filePath) {
        const dependencies = {
            imports: this.importGraph.get(filePath) || [],
            exports: [],
            dependsOn: new Set(),
            dependedBy: new Set()
        };

        // Find what this file exports
        this.symbolTable.forEach((symbol, symbolKey) => {
            const [, file] = symbolKey.split(':');
            if (file === filePath && symbol.type === 'function') {
                dependencies.exports.push(symbol.name);
            }
        });

        // Find what files depend on this file
        this.importGraph.forEach((imports, importingFile) => {
            imports.forEach(imp => {
                if (dependencies.exports.includes(imp.name)) {
                    dependencies.dependedBy.add(importingFile);
                }
            });
        });

        // Find what this file depends on
        dependencies.imports.forEach(imp => {
            this.symbolTable.forEach((symbol, symbolKey) => {
                const [name, file] = symbolKey.split(':');
                if (name === imp.name && file !== filePath) {
                    dependencies.dependsOn.add(file);
                }
            });
        });

        return {
            ...dependencies,
            dependsOn: Array.from(dependencies.dependsOn),
            dependedBy: Array.from(dependencies.dependedBy)
        };
    }

    /**
     * Get database summary
     */
    getDatabaseSummary() {
        const functionSymbols = Array.from(this.symbolTable.values()).filter(s => s.type === 'function');
        const classSymbols = Array.from(this.symbolTable.values()).filter(s => s.type === 'class');

        return {
            metadata: this.metadata,
            symbolStats: {
                totalFunctions: functionSymbols.length,
                totalClasses: classSymbols.length,
                averageReferencesPerSymbol: this.symbolTable.size > 0 ?
                    (this.metadata.totalReferences / this.symbolTable.size).toFixed(1) : 0,
                mostReferencedSymbol: this.findMostReferencedSymbol(),
                inheritanceChains: this.inheritanceGraph.size,
                callGraphNodes: this.callGraph.size
            },
            usagePatterns: {
                highUsageFunctions: functionSymbols.filter(s =>
                    (this.usagePatterns.get(`${s.name}:${s.file}`)?.usageTrend) === 'high_usage'
                ).length,
                moderateUsageFunctions: functionSymbols.filter(s =>
                    (this.usagePatterns.get(`${s.name}:${s.file}`)?.usageTrend) === 'moderate_usage'
                ).length,
                lowUsageFunctions: functionSymbols.filter(s =>
                    (this.usagePatterns.get(`${s.name}:${s.file}`)?.usageTrend) === 'low_usage'
                ).length
            }
        };
    }

    /**
     * Find most referenced symbol
     */
    findMostReferencedSymbol() {
        let mostReferenced = null;
        let maxReferences = 0;

        this.symbolTable.forEach((symbol, symbolKey) => {
            if (symbol.references.length > maxReferences) {
                maxReferences = symbol.references.length;
                mostReferenced = {
                    name: symbol.name,
                    type: symbol.type,
                    file: symbol.file,
                    references: maxReferences
                };
            }
        });

        return mostReferenced;
    }

    /**
     * Save database to file
     */
    saveDatabase(filePath = 'cross-reference-database.json') {
        const databaseData = {
            metadata: this.metadata,
            symbolTable: Object.fromEntries(this.symbolTable),
            callGraph: Object.fromEntries(this.callGraph),
            inheritanceGraph: Object.fromEntries(this.inheritanceGraph),
            importGraph: Object.fromEntries(this.importGraph),
            usagePatterns: Object.fromEntries(this.usagePatterns)
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(databaseData, null, 2));
        console.log(`Cross-reference database saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }

    /**
     * Load database from file
     */
    loadDatabase(filePath = 'cross-reference-database.json') {
        try {
            const databaseData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'reports', filePath), 'utf8'));

            this.metadata = databaseData.metadata;
            this.symbolTable = new Map(Object.entries(databaseData.symbolTable));
            this.callGraph = new Map(Object.entries(databaseData.callGraph));
            this.inheritanceGraph = new Map(Object.entries(databaseData.inheritanceGraph));
            this.importGraph = new Map(Object.entries(databaseData.importGraph));
            this.usagePatterns = new Map(Object.entries(databaseData.usagePatterns));

            console.log(`Cross-reference database loaded from reports/${filePath}`);
            return true;
        } catch (error) {
            console.warn(`Could not load database: ${error.message}`);
            return false;
        }
    }
}

// CLI interface
if (require.main === module) {
    const database = new CrossReferenceDatabase();

    const command = process.argv[2];

    switch (command) {
        case 'build':
            database.buildCrossReferenceDatabase().then(summary => {
                console.log('\n🔗 Cross-Reference Database Summary:');
                console.log(`Symbols: ${summary.metadata.totalSymbols}`);
                console.log(`References: ${summary.metadata.totalReferences}`);
                console.log(`Functions: ${summary.symbolStats.totalFunctions}`);
                console.log(`Classes: ${summary.symbolStats.totalClasses}`);
                console.log(`Avg references/symbol: ${summary.symbolStats.averageReferencesPerSymbol}`);
                console.log(`Inheritance chains: ${summary.symbolStats.inheritanceChains}`);

                database.saveDatabase();
                process.exit(0);
            }).catch(error => {
                console.error('Database build failed:', error);
                process.exit(1);
            });
            break;

        case 'query':
            const symbolName = process.argv[3];

            if (!database.loadDatabase()) {
                console.error('No database found. Run "build" first.');
                process.exit(1);
            }

            const results = database.querySymbol(symbolName);
            console.log(`\n🔍 Query results for "${symbolName}":`);
            results.forEach(result => {
                console.log(`${result.type}: ${result.name} in ${result.file}:${result.line}`);
                if (result.usagePattern) {
                    console.log(`  References: ${result.usagePattern.totalReferences}, Files: ${result.usagePattern.filesUsing}`);
                }
            });
            break;

        case 'usages':
            const symbol = process.argv[3];

            if (!database.loadDatabase()) {
                console.error('No database found. Run "build" first.');
                process.exit(1);
            }

            const usages = database.findAllUsages(symbol);
            console.log(`\n📊 Usage analysis for "${symbol}":`);
            console.log(`Definitions: ${usages.definitions.length}`);
            console.log(`Calls: ${usages.calls.length}`);
            console.log(`References: ${usages.references.length}`);
            console.log(`Imports: ${usages.imports.length}`);
            break;

        case 'dependencies':
            const file = process.argv[3];

            if (!database.loadDatabase()) {
                console.error('No database found. Run "build" first.');
                process.exit(1);
            }

            const deps = database.analyzeFileDependencies(file);
            console.log(`\n🔗 Dependencies for ${file}:`);
            console.log(`Imports: ${deps.imports.length}`);
            console.log(`Exports: ${deps.exports.length}`);
            console.log(`Depends on: ${deps.dependsOn.length} files`);
            console.log(`Depended by: ${deps.dependedBy.length} files`);
            break;

        default:
            console.log('Usage: node cross-reference-database.js <command> [args]');
            console.log('Commands:');
            console.log('  build                    - Build cross-reference database');
            console.log('  query <symbol>           - Query symbol information');
            console.log('  usages <symbol>          - Find all usages of a symbol');
            console.log('  dependencies <file>      - Analyze file dependencies');
            process.exit(1);
    }
}

module.exports = CrossReferenceDatabase;