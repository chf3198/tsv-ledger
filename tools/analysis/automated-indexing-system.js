#!/usr/bin/env node

/**
 * Automated File/Function Indexing System
 * Advanced indexing for AI optimization and code navigation
 */

const fs = require('fs');
const path = require('path');

class AutomatedIndexingSystem {
    constructor() {
        this.index = new Map();
        this.reverseIndex = new Map();
        this.functionIndex = new Map();
        this.classIndex = new Map();
        this.importIndex = new Map();
        this.dependencyGraph = new Map();
        this.indexMetadata = {
            lastUpdated: null,
            totalFiles: 0,
            totalFunctions: 0,
            totalClasses: 0,
            totalImports: 0
        };
    }

    /**
     * Build comprehensive file and function index
     */
    async buildComprehensiveIndex(rootPath = process.cwd()) {
        console.log('🔍 Building comprehensive file/function index...');

        const startTime = Date.now();
        this.index.clear();
        this.reverseIndex.clear();
        this.functionIndex.clear();
        this.classIndex.clear();
        this.importIndex.clear();
        this.dependencyGraph.clear();

        // Get all JavaScript files
        const files = this.getJavaScriptFiles(rootPath);
        console.log(`Found ${files.length} JavaScript files to index`);

        // Process each file
        for (const filePath of files) {
            await this.indexFile(filePath);
        }

        // Build dependency graph
        this.buildDependencyGraph();

        // Update metadata
        this.indexMetadata.lastUpdated = new Date().toISOString();
        this.indexMetadata.totalFiles = files.length;
        this.indexMetadata.totalFunctions = this.functionIndex.size;
        this.indexMetadata.totalClasses = this.classIndex.size;
        this.indexMetadata.totalImports = Array.from(this.importIndex.values())
            .reduce((sum, imports) => sum + imports.length, 0);

        const duration = Date.now() - startTime;
        console.log(`✅ Index built in ${duration}ms`);
        console.log(`Indexed ${this.indexMetadata.totalFiles} files, ${this.indexMetadata.totalFunctions} functions, ${this.indexMetadata.totalClasses} classes`);

        return this.getIndexSummary();
    }

    /**
     * Index a single file
     */
    async indexFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(process.cwd(), filePath);

            const fileIndex = {
                path: relativePath,
                absolutePath: filePath,
                size: content.length,
                lines: content.split('\n').length,
                lastModified: fs.statSync(filePath).mtime.toISOString(),
                functions: [],
                classes: [],
                imports: [],
                exports: [],
                dependencies: [],
                complexity: this.calculateComplexity(content)
            };

            // Extract functions
            fileIndex.functions = this.extractFunctions(content, relativePath);

            // Extract classes
            fileIndex.classes = this.extractClasses(content, relativePath);

            // Extract imports
            fileIndex.imports = this.extractImports(content, relativePath);

            // Extract exports
            fileIndex.exports = this.extractExports(content, relativePath);

            // Store in main index
            this.index.set(relativePath, fileIndex);

            // Update reverse indexes
            this.updateReverseIndexes(fileIndex);

        } catch (error) {
            console.warn(`Warning: Could not index ${filePath}: ${error.message}`);
        }
    }

    /**
     * Extract functions from file content
     */
    extractFunctions(content, filePath) {
        const functions = [];
        const lines = content.split('\n');

        // Regular function declarations
        const funcRegex = /^(\s*)(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|function\s*\())/gm;
        let match;

        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[2] || match[3];
            const lineNumber = content.substring(0, match.index).split('\n').length;
            const indentLevel = match[1].length;

            functions.push({
                name: funcName,
                type: match[2] ? 'function' : 'arrow',
                line: lineNumber,
                indent: indentLevel,
                file: filePath,
                signature: this.extractFunctionSignature(lines[lineNumber - 1])
            });
        }

        // Class methods
        const methodRegex = /^(\s*)(async\s+)?(\w+)\s*\([^)]*\)\s*{/gm;

        while ((match = methodRegex.exec(content)) !== null) {
            const methodName = match[3];
            const lineNumber = content.substring(0, match.index).split('\n').length;
            const indentLevel = match[1].length;
            const isAsync = !!match[2];

            // Skip if it's a regular function (already captured above)
            if (!functions.some(f => f.line === lineNumber)) {
                functions.push({
                    name: methodName,
                    type: isAsync ? 'async_method' : 'method',
                    line: lineNumber,
                    indent: indentLevel,
                    file: filePath,
                    signature: this.extractFunctionSignature(lines[lineNumber - 1])
                });
            }
        }

        return functions;
    }

    /**
     * Extract classes from file content
     */
    extractClasses(content, filePath) {
        const classes = [];
        const classRegex = /^(\s*)class\s+(\w+)(?:\s+extends\s+(\w+))?/gm;
        let match;

        while ((match = classRegex.exec(content)) !== null) {
            const className = match[2];
            const extendsClass = match[3];
            const lineNumber = content.substring(0, match.index).split('\n').length;
            const indentLevel = match[1].length;

            classes.push({
                name: className,
                extends: extendsClass,
                line: lineNumber,
                indent: indentLevel,
                file: filePath,
                methods: this.extractClassMethods(content, className)
            });
        }

        return classes;
    }

    /**
     * Extract class methods
     */
    extractClassMethods(content, className) {
        const methods = [];
        const classBlock = this.extractClassBlock(content, className);

        if (classBlock) {
            const methodRegex = /(?:^|\n)\s*(?:async\s+)?(?:static\s+)?(\w+)\s*\([^)]*\)\s*{/g;
            let match;

            while ((match = methodRegex.exec(classBlock)) !== null) {
                const methodName = match[1];
                methods.push(methodName);
            }
        }

        return methods;
    }

    /**
     * Extract class block from content
     */
    extractClassBlock(content, className) {
        const classRegex = new RegExp(`class\\s+${className}[^{]*{`, 'g');
        const match = classRegex.exec(content);

        if (match) {
            let braceCount = 0;
            let startIndex = match.index + match[0].length - 1; // Start after opening brace
            let endIndex = startIndex;

            for (let i = startIndex; i < content.length; i++) {
                if (content[i] === '{') braceCount++;
                if (content[i] === '}') braceCount--;

                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }

            return content.substring(startIndex, endIndex + 1);
        }

        return null;
    }

    /**
     * Extract imports from file content
     */
    extractImports(content, filePath) {
        const imports = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // ES6 imports
            if (trimmed.startsWith('import ')) {
                const importMatch = trimmed.match(/import\s+{([^}]*)}\s+from\s+['"]([^'"]+)['"]/);
                if (importMatch) {
                    const importsList = importMatch[1].split(',').map(i => i.trim());
                    const fromModule = importMatch[2];

                    importsList.forEach(imp => {
                        imports.push({
                            name: imp,
                            type: 'named',
                            from: fromModule,
                            line: index + 1,
                            file: filePath
                        });
                    });
                } else {
                    // Default import
                    const defaultMatch = trimmed.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
                    if (defaultMatch) {
                        imports.push({
                            name: defaultMatch[1],
                            type: 'default',
                            from: defaultMatch[2],
                            line: index + 1,
                            file: filePath
                        });
                    }
                }
            }

            // CommonJS requires
            if (trimmed.includes('require(')) {
                const requireMatch = trimmed.match(/const\s+{([^}]*)}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
                if (requireMatch) {
                    const requiresList = requireMatch[1].split(',').map(r => r.trim());
                    const fromModule = requireMatch[2];

                    requiresList.forEach(req => {
                        imports.push({
                            name: req,
                            type: 'named',
                            from: fromModule,
                            line: index + 1,
                            file: filePath
                        });
                    });
                } else {
                    const simpleRequire = trimmed.match(/const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
                    if (simpleRequire) {
                        imports.push({
                            name: simpleRequire[1],
                            type: 'default',
                            from: simpleRequire[2],
                            line: index + 1,
                            file: filePath
                        });
                    }
                }
            }
        });

        return imports;
    }

    /**
     * Extract exports from file content
     */
    extractExports(content, filePath) {
        const exports = [];
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // ES6 exports
            if (trimmed.startsWith('export ')) {
                if (trimmed.includes('export default')) {
                    const defaultMatch = trimmed.match(/export\s+default\s+(\w+)/);
                    if (defaultMatch) {
                        exports.push({
                            name: defaultMatch[1],
                            type: 'default',
                            line: index + 1,
                            file: filePath
                        });
                    }
                } else {
                    const namedMatch = trimmed.match(/export\s+(?:const|function|class)\s+(\w+)/);
                    if (namedMatch) {
                        exports.push({
                            name: namedMatch[1],
                            type: 'named',
                            line: index + 1,
                            file: filePath
                        });
                    }
                }
            }

            // CommonJS module.exports
            if (trimmed.includes('module.exports') || trimmed.includes('exports.')) {
                const exportMatch = trimmed.match(/(?:module\.)?exports\.(\w+)\s*=\s*(\w+)/);
                if (exportMatch) {
                    exports.push({
                        name: exportMatch[1],
                        value: exportMatch[2],
                        type: 'commonjs',
                        line: index + 1,
                        file: filePath
                    });
                }
            }
        });

        return exports;
    }

    /**
     * Extract function signature
     */
    extractFunctionSignature(line) {
        const signature = line.trim();
        // Remove the opening brace and anything after it
        return signature.replace(/\s*{.*$/, '').trim();
    }

    /**
     * Calculate file complexity
     */
    calculateComplexity(content) {
        const lines = content.split('\n');
        let complexity = 0;

        lines.forEach(line => {
            // Control structures
            if (/\b(if|for|while|switch|try|catch)\b/.test(line)) complexity += 2;
            // Logical operators
            complexity += (line.match(/\|\||&&/g) || []).length;
            // Ternary operators
            complexity += (line.match(/\?/g) || []).length;
        });

        return complexity;
    }

    /**
     * Update reverse indexes
     */
    updateReverseIndexes(fileIndex) {
        // Function reverse index
        fileIndex.functions.forEach(func => {
            if (!this.functionIndex.has(func.name)) {
                this.functionIndex.set(func.name, []);
            }
            this.functionIndex.get(func.name).push({
                file: fileIndex.path,
                line: func.line,
                type: func.type,
                signature: func.signature
            });
        });

        // Class reverse index
        fileIndex.classes.forEach(cls => {
            if (!this.classIndex.has(cls.name)) {
                this.classIndex.set(cls.name, []);
            }
            this.classIndex.get(cls.name).push({
                file: fileIndex.path,
                line: cls.line,
                extends: cls.extends,
                methods: cls.methods
            });
        });

        // Import reverse index
        fileIndex.imports.forEach(imp => {
            if (!this.importIndex.has(imp.from)) {
                this.importIndex.set(imp.from, []);
            }
            this.importIndex.get(imp.from).push({
                name: imp.name,
                type: imp.type,
                file: fileIndex.path,
                line: imp.line
            });
        });
    }

    /**
     * Build dependency graph
     */
    buildDependencyGraph() {
        this.index.forEach((fileIndex, filePath) => {
            const dependencies = new Set();

            fileIndex.imports.forEach(imp => {
                // Find files that export what we're importing
                this.index.forEach((otherFile, otherPath) => {
                    if (otherPath !== filePath) {
                        const hasExport = otherFile.exports.some(exp =>
                            exp.name === imp.name || exp.value === imp.name
                        );
                        if (hasExport) {
                            dependencies.add(otherPath);
                        }
                    }
                });
            });

            this.dependencyGraph.set(filePath, Array.from(dependencies));
        });
    }

    /**
     * Get JavaScript files recursively
     */
    getJavaScriptFiles(rootPath) {
        const files = [];

        function scanDir(dirPath) {
            try {
                const items = fs.readdirSync(dirPath);

                items.forEach(item => {
                    const fullPath = path.join(dirPath, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'coverage') {
                        scanDir(fullPath);
                    } else if (stat.isFile() && item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
                        files.push(fullPath);
                    }
                });
            } catch (error) {
                // Skip directories we can't read
            }
        }

        scanDir(rootPath);
        return files;
    }

    /**
     * Search functions by name
     */
    searchFunctions(query, options = {}) {
        const results = [];
        const regex = new RegExp(query, options.exact ? '^' : 'i');

        this.functionIndex.forEach((locations, funcName) => {
            if (regex.test(funcName)) {
                results.push({
                    name: funcName,
                    locations: locations,
                    totalOccurrences: locations.length
                });
            }
        });

        return results.sort((a, b) => b.totalOccurrences - a.totalOccurrences);
    }

    /**
     * Search classes by name
     */
    searchClasses(query, options = {}) {
        const results = [];
        const regex = new RegExp(query, options.exact ? '^' : 'i');

        this.classIndex.forEach((locations, className) => {
            if (regex.test(className)) {
                results.push({
                    name: className,
                    locations: locations,
                    totalOccurrences: locations.length
                });
            }
        });

        return results.sort((a, b) => b.totalOccurrences - a.totalOccurrences);
    }

    /**
     * Find references to a symbol
     */
    findReferences(symbolName) {
        const references = {
            functions: [],
            classes: [],
            imports: [],
            usages: []
        };

        // Find function references
        if (this.functionIndex.has(symbolName)) {
            references.functions = this.functionIndex.get(symbolName);
        }

        // Find class references
        if (this.classIndex.has(symbolName)) {
            references.classes = this.classIndex.get(symbolName);
        }

        // Find import references
        this.importIndex.forEach((imports, module) => {
            const matchingImports = imports.filter(imp => imp.name === symbolName);
            if (matchingImports.length > 0) {
                references.imports.push({
                    module: module,
                    imports: matchingImports
                });
            }
        });

        // Find usage references (simplified - would need AST parsing for full accuracy)
        this.index.forEach((fileIndex, filePath) => {
            const content = fs.readFileSync(fileIndex.absolutePath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, lineIndex) => {
                if (line.includes(symbolName) && !line.includes(`function ${symbolName}`) && !line.includes(`class ${symbolName}`)) {
                    references.usages.push({
                        file: filePath,
                        line: lineIndex + 1,
                        context: line.trim()
                    });
                }
            });
        });

        return references;
    }

    /**
     * Get file dependencies
     */
    getFileDependencies(filePath) {
        const relativePath = path.relative(process.cwd(), filePath);
        return this.dependencyGraph.get(relativePath) || [];
    }

    /**
     * Get files that depend on a given file
     */
    getDependentFiles(filePath) {
        const relativePath = path.relative(process.cwd(), filePath);
        const dependents = [];

        this.dependencyGraph.forEach((deps, file) => {
            if (deps.includes(relativePath)) {
                dependents.push(file);
            }
        });

        return dependents;
    }

    /**
     * Get index summary
     */
    getIndexSummary() {
        return {
            metadata: this.indexMetadata,
            indexStats: {
                totalFiles: this.index.size,
                totalFunctions: this.functionIndex.size,
                totalClasses: this.classIndex.size,
                totalImports: Array.from(this.importIndex.values()).reduce((sum, imports) => sum + imports.length, 0),
                averageFunctionsPerFile: this.index.size > 0 ? (this.functionIndex.size / this.index.size).toFixed(1) : 0,
                averageClassesPerFile: this.index.size > 0 ? (this.classIndex.size / this.index.size).toFixed(1) : 0
            },
            topFunctions: this.getTopFunctions(10),
            topClasses: this.getTopClasses(10)
        };
    }

    /**
     * Get top functions by occurrence
     */
    getTopFunctions(limit = 10) {
        const functionCounts = Array.from(this.functionIndex.entries())
            .map(([name, locations]) => ({ name, count: locations.length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return functionCounts;
    }

    /**
     * Get top classes by occurrence
     */
    getTopClasses(limit = 10) {
        const classCounts = Array.from(this.classIndex.entries())
            .map(([name, locations]) => ({ name, count: locations.length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return classCounts;
    }

    /**
     * Save index to file
     */
    saveIndex(filePath = 'index.json') {
        const indexData = {
            metadata: this.indexMetadata,
            index: Object.fromEntries(this.index),
            functionIndex: Object.fromEntries(this.functionIndex),
            classIndex: Object.fromEntries(this.classIndex),
            importIndex: Object.fromEntries(this.importIndex),
            dependencyGraph: Object.fromEntries(this.dependencyGraph)
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(indexData, null, 2));
        console.log(`Index saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }

    /**
     * Load index from file
     */
    loadIndex(filePath = 'index.json') {
        try {
            const indexData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'reports', filePath), 'utf8'));

            this.indexMetadata = indexData.metadata;
            this.index = new Map(Object.entries(indexData.index));
            this.functionIndex = new Map(Object.entries(indexData.functionIndex));
            this.classIndex = new Map(Object.entries(indexData.classIndex));
            this.importIndex = new Map(Object.entries(indexData.importIndex));
            this.dependencyGraph = new Map(Object.entries(indexData.dependencyGraph));

            console.log(`Index loaded from reports/${filePath}`);
            return true;
        } catch (error) {
            console.warn(`Could not load index: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if index is stale
     */
    isIndexStale() {
        if (!this.indexMetadata.lastUpdated) return true;

        const lastUpdate = new Date(this.indexMetadata.lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

        return hoursSinceUpdate > 24; // Consider stale if older than 24 hours
    }
}

module.exports = AutomatedIndexingSystem;

// CLI interface
if (require.main === module) {
    const indexer = new AutomatedIndexingSystem();

    const command = process.argv[2];

    switch (command) {
        case 'build':
            indexer.buildComprehensiveIndex().then(summary => {
                console.log('\n📊 Index Summary:');
                console.log(`Files: ${summary.metadata.totalFiles}`);
                console.log(`Functions: ${summary.metadata.totalFunctions}`);
                console.log(`Classes: ${summary.metadata.totalClasses}`);
                console.log(`Imports: ${summary.metadata.totalImports}`);
                console.log(`Avg functions/file: ${summary.indexStats.averageFunctionsPerFile}`);
                console.log(`Avg classes/file: ${summary.indexStats.averageClassesPerFile}`);

                indexer.saveIndex();
                process.exit(0);
            }).catch(error => {
                console.error('Indexing failed:', error);
                process.exit(1);
            });
            break;

        case 'search':
            const query = process.argv[3];
            const type = process.argv[4] || 'functions';

            if (!indexer.loadIndex()) {
                console.error('No index found. Run "build" first.');
                process.exit(1);
            }

            let results;
            if (type === 'functions') {
                results = indexer.searchFunctions(query);
            } else if (type === 'classes') {
                results = indexer.searchClasses(query);
            } else {
                console.error('Invalid search type. Use "functions" or "classes".');
                process.exit(1);
            }

            console.log(`\n🔍 Search results for "${query}" (${type}):`);
            results.slice(0, 5).forEach(result => {
                console.log(`${result.name} (${result.totalOccurrences} occurrences)`);
                result.locations.slice(0, 3).forEach(loc => {
                    console.log(`  ${loc.file}:${loc.line}`);
                });
            });
            break;

        case 'references':
            const symbol = process.argv[3];

            if (!indexer.loadIndex()) {
                console.error('No index found. Run "build" first.');
                process.exit(1);
            }

            const references = indexer.findReferences(symbol);
            console.log(`\n🔗 References for "${symbol}":`);
            console.log(`Functions: ${references.functions.length}`);
            console.log(`Classes: ${references.classes.length}`);
            console.log(`Imports: ${references.imports.length}`);
            console.log(`Usages: ${references.usages.length}`);
            break;

        case 'dependencies':
            const file = process.argv[3];

            if (!indexer.loadIndex()) {
                console.error('No index found. Run "build" first.');
                process.exit(1);
            }

            const deps = indexer.getFileDependencies(file);
            const dependents = indexer.getDependentFiles(file);

            console.log(`\n🔗 Dependencies for ${file}:`);
            console.log(`Depends on: ${deps.length} files`);
            deps.forEach(dep => console.log(`  ${dep}`));
            console.log(`Depended on by: ${dependents.length} files`);
            dependents.forEach(dep => console.log(`  ${dep}`));
            break;

        default:
            console.log('Usage: node automated-indexing-system.js <command> [args]');
            console.log('Commands:');
            console.log('  build                    - Build comprehensive index');
            console.log('  search <query> [type]    - Search functions or classes');
            console.log('  references <symbol>      - Find all references to a symbol');
            console.log('  dependencies <file>      - Show file dependencies');
            process.exit(1);
    }
}