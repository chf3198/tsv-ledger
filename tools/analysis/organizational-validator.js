#!/usr/bin/env node

/**
 * Organizational Structure Validation System
 * Validates codebase organization against best practices and standards
 */

const fs = require('fs');
const path = require('path');
const AutomatedIndexingSystem = require('./automated-indexing-system');
const CrossReferenceDatabase = require('./cross-reference-database');

class OrganizationalValidator {
    constructor() {
        this.indexer = new AutomatedIndexingSystem();
        this.database = new CrossReferenceDatabase();
        this.validationRules = new Map();
        this.violations = [];
        this.compliance = {
            overall: 0,
            categories: new Map()
        };
        this.loadValidationRules();
    }

    /**
     * Load validation rules
     */
    loadValidationRules() {
        this.validationRules.set('file-size', {
            name: 'File Size Limits',
            description: 'All files must be under 300 lines',
            severity: 'high',
            validator: this.validateFileSizes.bind(this)
        });

        this.validationRules.set('naming-conventions', {
            name: 'Naming Conventions',
            description: 'Files, functions, and classes must follow consistent naming',
            severity: 'medium',
            validator: this.validateNamingConventions.bind(this)
        });

        this.validationRules.set('directory-structure', {
            name: 'Directory Structure',
            description: 'Code must be organized in logical directory structure',
            severity: 'high',
            validator: this.validateDirectoryStructure.bind(this)
        });

        this.validationRules.set('import-organization', {
            name: 'Import Organization',
            description: 'Imports must be properly organized and not circular',
            severity: 'medium',
            validator: this.validateImportOrganization.bind(this)
        });

        this.validationRules.set('modular-architecture', {
            name: 'Modular Architecture',
            description: 'Code must follow modular architecture principles',
            severity: 'high',
            validator: this.validateModularArchitecture.bind(this)
        });

        this.validationRules.set('documentation-coverage', {
            name: 'Documentation Coverage',
            description: 'Code must have adequate documentation',
            severity: 'low',
            validator: this.validateDocumentationCoverage.bind(this)
        });
    }

    /**
     * Run comprehensive organizational validation
     */
    async runOrganizationalValidation(rootPath = process.cwd()) {
        console.log('🔍 Running organizational structure validation...');

        const startTime = Date.now();

        // Load index and database
        this.indexer.loadIndex();
        this.database.loadDatabase();

        this.violations = [];

        // Run all validation rules
        for (const [ruleId, rule] of this.validationRules) {
            console.log(`  Validating: ${rule.name}`);
            try {
                const result = await rule.validator(rootPath);
                this.processValidationResult(ruleId, rule, result);
            } catch (error) {
                console.error(`  ❌ ${rule.name} validation failed: ${error.message}`);
                this.addViolation(ruleId, 'error', `Validation failed: ${error.message}`, null, rule.severity);
            }
        }

        // Calculate compliance scores
        this.calculateCompliance();

        const duration = Date.now() - startTime;
        console.log(`✅ Validation completed in ${duration}ms`);

        return this.getValidationReport();
    }

    /**
     * Process validation result
     */
    processValidationResult(ruleId, rule, result) {
        if (result.violations && result.violations.length > 0) {
            result.violations.forEach(violation => {
                this.addViolation(ruleId, violation.type, violation.message, violation.file, rule.severity);
            });
        }

        if (result.warnings && result.warnings.length > 0) {
            result.warnings.forEach(warning => {
                this.addViolation(ruleId, 'warning', warning.message, warning.file, 'low');
            });
        }
    }

    /**
     * Add violation to report
     */
    addViolation(ruleId, type, message, file, severity) {
        this.violations.push({
            rule: ruleId,
            type: type,
            message: message,
            file: file,
            severity: severity,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Validate file sizes
     */
    async validateFileSizes(rootPath) {
        const violations = [];
        const warnings = [];

        this.indexer.index.forEach((fileIndex, filePath) => {
            const lineCount = fileIndex.lineCount || 0;

            if (lineCount > 300) {
                violations.push({
                    type: 'error',
                    message: `File exceeds 300-line limit (${lineCount} lines)`,
                    file: filePath
                });
            } else if (lineCount > 250) {
                warnings.push({
                    type: 'warning',
                    message: `File approaching 300-line limit (${lineCount} lines)`,
                    file: filePath
                });
            }
        });

        return { violations, warnings };
    }

    /**
     * Validate naming conventions
     */
    async validateNamingConventions(rootPath) {
        const violations = [];

        // Check file naming
        this.indexer.index.forEach((fileIndex, filePath) => {
            const fileName = path.basename(filePath, path.extname(filePath));

            // Check for kebab-case or camelCase consistency
            if (!this.isValidFileName(fileName)) {
                violations.push({
                    type: 'warning',
                    message: `File name should use kebab-case or camelCase: ${fileName}`,
                    file: filePath
                });
            }
        });

        // Check function naming
        this.indexer.functionIndex.forEach((locations, funcName) => {
            if (!this.isValidFunctionName(funcName)) {
                locations.forEach(location => {
                    violations.push({
                        type: 'warning',
                        message: `Function name should use camelCase: ${funcName}`,
                        file: location.file
                    });
                });
            }
        });

        // Check class naming
        this.indexer.classIndex.forEach((locations, className) => {
            if (!this.isValidClassName(className)) {
                locations.forEach(location => {
                    violations.push({
                        type: 'warning',
                        message: `Class name should use PascalCase: ${className}`,
                        file: location.file
                    });
                });
            }
        });

        return { violations, warnings: [] };
    }

    /**
     * Check if file name is valid
     */
    isValidFileName(fileName) {
        // Allow kebab-case, camelCase, or PascalCase for files
        return /^[a-z][a-zA-Z0-9-]*$/.test(fileName) ||
               /^[a-z][a-zA-Z0-9]*$/.test(fileName) ||
               /^[A-Z][a-zA-Z0-9]*$/.test(fileName);
    }

    /**
     * Check if function name is valid
     */
    isValidFunctionName(funcName) {
        // Functions should use camelCase
        return /^[a-z][a-zA-Z0-9]*$/.test(funcName);
    }

    /**
     * Check if class name is valid
     */
    isValidClassName(className) {
        // Classes should use PascalCase
        return /^[A-Z][a-zA-Z0-9]*$/.test(className);
    }

    /**
     * Validate directory structure
     */
    async validateDirectoryStructure(rootPath) {
        const violations = [];
        const requiredDirs = ['src', 'tests', 'docs', 'public'];
        const recommendedDirs = ['utils', 'scripts', 'demos'];

        // Check for required directories
        requiredDirs.forEach(dir => {
            const dirPath = path.join(rootPath, dir);
            if (!fs.existsSync(dirPath)) {
                violations.push({
                    type: 'error',
                    message: `Required directory missing: ${dir}`,
                    file: dirPath
                });
            }
        });

        // Check for logical file placement
        this.indexer.index.forEach((fileIndex, filePath) => {
            const relativePath = path.relative(rootPath, filePath);
            const issues = this.checkFilePlacement(relativePath);

            issues.forEach(issue => {
                violations.push({
                    type: issue.type,
                    message: issue.message,
                    file: filePath
                });
            });
        });

        return { violations, warnings: [] };
    }

    /**
     * Check file placement logic
     */
    checkFilePlacement(relativePath) {
        const issues = [];
        const parts = relativePath.split(path.sep);

        // Test files should be in tests/ directory
        if (relativePath.includes('test') && !parts.includes('tests') && !parts.includes('test-data')) {
            issues.push({
                type: 'warning',
                message: 'Test files should be in tests/ directory'
            });
        }

        // Source files should be in src/ directory
        if (relativePath.endsWith('.js') && !parts.includes('src') &&
            !parts.includes('public') && !parts.includes('scripts') &&
            !parts.includes('utils') && !parts.includes('demos') &&
            parts.length === 1) {
            issues.push({
                type: 'warning',
                message: 'Source files should be organized in appropriate directories'
            });
        }

        return issues;
    }

    /**
     * Validate import organization
     */
    async validateImportOrganization(rootPath) {
        const violations = [];

        // Check for circular dependencies
        const circularDeps = this.detectCircularDependencies();
        circularDeps.forEach(dep => {
            violations.push({
                type: 'error',
                message: `Circular dependency detected: ${dep.from} -> ${dep.to}`,
                file: dep.from
            });
        });

        // Check import organization within files
        this.indexer.index.forEach((fileIndex, filePath) => {
            const importIssues = this.checkImportOrganization(fileIndex);
            importIssues.forEach(issue => {
                violations.push({
                    type: issue.type,
                    message: issue.message,
                    file: filePath
                });
            });
        });

        return { violations, warnings: [] };
    }

    /**
     * Detect circular dependencies
     */
    detectCircularDependencies() {
        const circularDeps = [];
        const visited = new Set();
        const recursionStack = new Set();

        const visit = (filePath) => {
            if (recursionStack.has(filePath)) {
                circularDeps.push({
                    from: Array.from(recursionStack).pop(),
                    to: filePath
                });
                return;
            }

            if (visited.has(filePath)) return;

            visited.add(filePath);
            recursionStack.add(filePath);

            const deps = this.database.analyzeFileDependencies(filePath);
            deps.dependsOn.forEach(dep => {
                visit(dep);
            });

            recursionStack.delete(filePath);
        };

        this.indexer.index.forEach((_, filePath) => {
            if (!visited.has(filePath)) {
                visit(filePath);
            }
        });

        return circularDeps;
    }

    /**
     * Check import organization in a file
     */
    checkImportOrganization(fileIndex) {
        const issues = [];

        if (fileIndex.imports.length > 10) {
            issues.push({
                type: 'warning',
                message: `Too many imports (${fileIndex.imports.length}). Consider consolidating or splitting file.`
            });
        }

        // Check for unused imports (simplified check)
        const usedSymbols = new Set();
        const content = fs.readFileSync(fileIndex.absolutePath, 'utf8');

        fileIndex.imports.forEach(imp => {
            if (!content.includes(imp.name)) {
                issues.push({
                    type: 'warning',
                    message: `Potentially unused import: ${imp.name}`
                });
            }
        });

        return issues;
    }

    /**
     * Validate modular architecture
     */
    async validateModularArchitecture(rootPath) {
        const violations = [];

        // Check for god classes/objects (files with too many functions)
        this.indexer.index.forEach((fileIndex, filePath) => {
            if (fileIndex.functions.length > 15) {
                violations.push({
                    type: 'warning',
                    message: `File has too many functions (${fileIndex.functions.length}). Consider splitting into multiple modules.`,
                    file: filePath
                });
            }
        });

        // Check for tight coupling
        const couplingIssues = this.analyzeCoupling();
        couplingIssues.forEach(issue => {
            violations.push({
                type: issue.type,
                message: issue.message,
                file: issue.file
            });
        });

        return { violations, warnings: [] };
    }

    /**
     * Analyze code coupling
     */
    analyzeCoupling() {
        const issues = [];

        this.database.symbolTable.forEach((symbol, symbolKey) => {
            if (symbol.type === 'function' && symbol.references.length > 20) {
                issues.push({
                    type: 'warning',
                    message: `Function '${symbol.name}' is tightly coupled (${symbol.references.length} references)`,
                    file: symbol.file
                });
            }
        });

        return issues;
    }

    /**
     * Validate documentation coverage
     */
    async validateDocumentationCoverage(rootPath) {
        const violations = [];

        this.indexer.index.forEach((fileIndex, filePath) => {
            const content = fs.readFileSync(fileIndex.absolutePath, 'utf8');
            const lines = content.split('\n');

            // Check for file header documentation
            const hasHeaderDoc = lines.slice(0, 10).some(line =>
                line.includes('/**') || line.includes('/*') || line.includes('//')
            );

            if (!hasHeaderDoc) {
                violations.push({
                    type: 'warning',
                    message: 'File missing header documentation',
                    file: filePath
                });
            }

            // Check function documentation
            fileIndex.functions.forEach(func => {
                const funcLine = lines[func.line - 1];
                const prevLines = lines.slice(Math.max(0, func.line - 5), func.line - 1);
                const hasFuncDoc = prevLines.some(line => line.includes('/**') || line.includes('/*'));

                if (!hasFuncDoc) {
                    violations.push({
                        type: 'warning',
                        message: `Function '${func.name}' missing documentation`,
                        file: filePath
                    });
                }
            });
        });

        return { violations, warnings: [] };
    }

    /**
     * Calculate compliance scores
     */
    calculateCompliance() {
        const totalViolations = this.violations.length;
        const severityWeights = { high: 3, medium: 2, low: 1 };
        let weightedScore = 0;
        let totalWeight = 0;

        // Calculate per-category compliance
        this.validationRules.forEach((rule, ruleId) => {
            const ruleViolations = this.violations.filter(v => v.rule === ruleId);
            const weight = severityWeights[rule.severity];
            const score = Math.max(0, 100 - (ruleViolations.length * 10));

            this.compliance.categories.set(ruleId, {
                score: score,
                violations: ruleViolations.length,
                severity: rule.severity
            });

            weightedScore += score * weight;
            totalWeight += weight;
        });

        this.compliance.overall = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 100;
    }

    /**
     * Get validation report
     */
    getValidationReport() {
        const criticalViolations = this.violations.filter(v => v.severity === 'high');
        const warnings = this.violations.filter(v => v.type === 'warning');

        return {
            timestamp: new Date().toISOString(),
            compliance: {
                overall: this.compliance.overall,
                categories: Object.fromEntries(this.compliance.categories)
            },
            summary: {
                totalViolations: this.violations.length,
                criticalViolations: criticalViolations.length,
                warnings: warnings.length,
                filesValidated: this.indexer.index.size
            },
            violations: this.violations.slice(0, 50), // Limit for readability
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.compliance.overall < 70) {
            recommendations.push('Overall code organization needs significant improvement');
        }

        const fileSizeViolations = this.violations.filter(v => v.rule === 'file-size' && v.severity === 'high');
        if (fileSizeViolations.length > 0) {
            recommendations.push(`Address ${fileSizeViolations.length} file size violations by breaking large files into smaller modules`);
        }

        const circularDeps = this.violations.filter(v => v.message.includes('Circular dependency'));
        if (circularDeps.length > 0) {
            recommendations.push(`Resolve ${circularDeps.length} circular dependencies to improve maintainability`);
        }

        if (recommendations.length === 0) {
            recommendations.push('Code organization is well-structured. Continue following established patterns.');
        }

        return recommendations;
    }

    /**
     * Save validation report
     */
    saveValidationReport(filePath = 'organizational-validation-report.json') {
        const report = this.getValidationReport();

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`Organizational validation report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }
}

// CLI interface
if (require.main === module) {
    const validator = new OrganizationalValidator();

    const command = process.argv[2];

    switch (command) {
        case 'validate':
            validator.runOrganizationalValidation().then(report => {
                console.log('\n🔍 Organizational Validation Report:');
                console.log(`Overall Compliance: ${report.compliance.overall}%`);
                console.log(`Total Violations: ${report.summary.totalViolations}`);
                console.log(`Critical Issues: ${report.summary.criticalViolations}`);
                console.log(`Warnings: ${report.summary.warnings}`);
                console.log(`Files Validated: ${report.summary.filesValidated}`);

                console.log('\n📋 Recommendations:');
                report.recommendations.forEach(rec => console.log(`  • ${rec}`));

                validator.saveValidationReport();
                process.exit(0);
            }).catch(error => {
                console.error('Validation failed:', error);
                process.exit(1);
            });
            break;

        case 'rules':
            console.log('Available validation rules:');
            validator.validationRules.forEach((rule, ruleId) => {
                console.log(`  ${ruleId}: ${rule.name} (${rule.severity} priority)`);
                console.log(`    ${rule.description}`);
            });
            break;

        default:
            console.log('Usage: node organizational-validator.js <command>');
            console.log('Commands:');
            console.log('  validate    - Run organizational validation');
            console.log('  rules       - List available validation rules');
            process.exit(1);
    }
}

module.exports = OrganizationalValidator;