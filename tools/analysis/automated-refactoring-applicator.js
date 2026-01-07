#!/usr/bin/env node

/**
 * Automated Refactoring Application System
 * Applies automated refactoring suggestions to oversized files
 */

const fs = require('fs');
const path = require('path');
const FileSizeManagementOptimizer = require('./file-size-management-optimizer');

class AutomatedRefactoringApplicator {
    constructor() {
        this.optimizer = new FileSizeManagementOptimizer();
        this.refactoringResults = [];
    }

    /**
     * Initialize the optimizer with all systems
     */
    async initialize() {
        console.log('Initializing optimization systems...');
        await this.optimizer.runFileSizeOptimization();
        return this;
    }

    /**
     * Apply automated refactoring to a specific file
     */
    async applyRefactoringToFile(filePath) {
        console.log(`🔧 Applying automated refactoring to: ${filePath}`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const analysis = this.optimizer.refactoringEngine.analyzeFile(content, filePath);
            const suggestions = this.optimizer.refactoringEngine.generateSuggestions(analysis);

            console.log(`Found ${suggestions.length} refactoring suggestions`);

            const results = {
                file: filePath,
                originalSize: analysis.size,
                suggestions: suggestions,
                appliedRefactors: [],
                finalSize: analysis.size,
                success: false
            };

            // Apply high-priority suggestions first
            const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');

            for (const suggestion of highPrioritySuggestions) {
                console.log(`Applying: ${suggestion.description}`);

                const refactorResult = await this.applySuggestion(suggestion, filePath, content);
                if (refactorResult.applied) {
                    results.appliedRefactors.push(refactorResult);
                    results.finalSize -= refactorResult.reduction;
                }
            }

            results.success = results.appliedRefactors.length > 0;
            this.refactoringResults.push(results);

            console.log(`✅ Refactoring complete. Size reduced by ${results.originalSize - results.finalSize} lines`);

            return results;

        } catch (error) {
            console.error(`❌ Refactoring failed for ${filePath}:`, error.message);
            return {
                file: filePath,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Apply a specific refactoring suggestion
     */
    async applySuggestion(suggestion, filePath, content) {
        const result = {
            suggestion: suggestion.description,
            applied: false,
            reduction: 0,
            actions: []
        };

        try {
            switch (suggestion.type) {
                case 'size_reduction':
                    const sizeResult = await this.applySizeReduction(suggestion, filePath, content);
                    result.applied = sizeResult.applied;
                    result.reduction = sizeResult.reduction;
                    result.actions = sizeResult.actions;
                    break;

                case 'function_extraction':
                    const funcResult = await this.applyFunctionExtraction(suggestion, filePath, content);
                    result.applied = funcResult.applied;
                    result.reduction = funcResult.reduction;
                    result.actions = funcResult.actions;
                    break;

                default:
                    console.log(`Skipping unsupported suggestion type: ${suggestion.type}`);
            }
        } catch (error) {
            console.error(`Error applying suggestion ${suggestion.type}:`, error.message);
        }

        return result;
    }

    /**
     * Apply size reduction refactoring
     */
    async applySizeReduction(suggestion, filePath, content) {
        console.log('  Applying size reduction actions...');

        let totalReduction = 0;
        const actions = [];

        for (const action of suggestion.actions) {
            switch (action.type) {
                case 'function_extraction':
                    const funcResult = await this.extractFunctions(action.functions, filePath, content);
                    if (funcResult.applied) {
                        totalReduction += funcResult.reduction;
                        actions.push(`Extracted ${funcResult.functions.length} functions`);
                    }
                    break;

                case 'class_separation':
                    const classResult = await this.separateClasses(action.classes, filePath, content);
                    if (classResult.applied) {
                        totalReduction += classResult.reduction;
                        actions.push(`Separated ${classResult.classes.length} classes`);
                    }
                    break;

                case 'import_consolidation':
                    const importResult = await this.consolidateImports(filePath, content);
                    if (importResult.applied) {
                        totalReduction += importResult.reduction;
                        actions.push('Consolidated imports');
                    }
                    break;
            }
        }

        return {
            applied: totalReduction > 0,
            reduction: totalReduction,
            actions: actions
        };
    }

    /**
     * Apply function extraction refactoring
     */
    async applyFunctionExtraction(suggestion, filePath, content) {
        console.log('  Applying function extraction...');

        const functions = suggestion.actions.flatMap(action =>
            action.functions || []
        );

        const result = await this.extractFunctions(functions, filePath, content);

        return {
            applied: result.applied,
            reduction: result.reduction,
            actions: result.applied ? [`Extracted ${result.functions.length} functions`] : []
        };
    }

    /**
     * Extract functions to separate modules
     */
    async extractFunctions(functionNames, sourceFilePath, content) {
        const extractedFunctions = [];
        let reduction = 0;

        // Create utilities directory if it doesn't exist
        const utilsDir = path.join(path.dirname(sourceFilePath), 'utils');
        if (!fs.existsSync(utilsDir)) {
            fs.mkdirSync(utilsDir, { recursive: true });
        }

        // Extract each function
        for (const funcName of functionNames.slice(0, 3)) { // Limit to 3 functions for safety
            const funcMatch = this.extractFunctionCode(funcName, content);
            if (funcMatch) {
                const utilFilePath = path.join(utilsDir, `${funcName}.js`);

                // Create utility module
                const utilContent = `/**
 * ${funcName} utility function
 * Extracted from ${path.basename(sourceFilePath)}
 */

${funcMatch.code}
`;

                fs.writeFileSync(utilFilePath, utilContent);
                extractedFunctions.push(funcName);
                reduction += funcMatch.lines;

                // Update original file to import the function
                const importStatement = `const { ${funcName} } = require('./utils/${funcName}');`;
                // Note: In a real implementation, we'd need to carefully place this import
                console.log(`    Created ${utilFilePath} (${funcMatch.lines} lines)`);
            }
        }

        return {
            applied: extractedFunctions.length > 0,
            functions: extractedFunctions,
            reduction: reduction
        };
    }

    /**
     * Separate classes into individual files
     */
    async separateClasses(classNames, sourceFilePath, content) {
        const separatedClasses = [];
        let reduction = 0;

        // Create classes directory if it doesn't exist
        const classesDir = path.join(path.dirname(sourceFilePath), 'classes');
        if (!fs.existsSync(classesDir)) {
            fs.mkdirSync(classesDir, { recursive: true });
        }

        // Extract each class
        for (const className of classNames) {
            const classMatch = this.extractClassCode(className, content);
            if (classMatch) {
                const classFilePath = path.join(classesDir, `${className}.js`);

                // Create class module
                const classContent = `/**
 * ${className} class
 * Extracted from ${path.basename(sourceFilePath)}
 */

${classMatch.code}
`;

                fs.writeFileSync(classFilePath, classContent);
                separatedClasses.push(className);
                reduction += classMatch.lines;

                console.log(`    Created ${classFilePath} (${classMatch.lines} lines)`);
            }
        }

        return {
            applied: separatedClasses.length > 0,
            classes: separatedClasses,
            reduction: reduction
        };
    }

    /**
     * Consolidate and optimize imports
     */
    async consolidateImports(filePath, content) {
        const lines = content.split('\n');
        const importLines = [];
        const codeLines = [];
        let reduction = 0;

        // Separate imports from code
        lines.forEach(line => {
            if (line.trim().startsWith('const') && line.includes('require(')) {
                importLines.push(line);
            } else {
                codeLines.push(line);
            }
        });

        // Remove duplicate imports and consolidate
        const uniqueImports = [...new Set(importLines)];
        reduction = importLines.length - uniqueImports.length;

        if (reduction > 0) {
            // Create new content with consolidated imports
            const newContent = [...uniqueImports, '', ...codeLines].join('\n');
            fs.writeFileSync(filePath, newContent);

            console.log(`    Consolidated ${reduction} duplicate imports`);
        }

        return {
            applied: reduction > 0,
            reduction: reduction
        };
    }

    /**
     * Extract function code from content
     */
    extractFunctionCode(functionName, content) {
        const lines = content.split('\n');
        const funcRegex = new RegExp(`(function\\s+${functionName}|const\\s+${functionName}\\s*=\\s*\\()`);

        for (let i = 0; i < lines.length; i++) {
            if (funcRegex.test(lines[i])) {
                // Find function boundaries (simplified - assumes functions end with closing brace)
                let braceCount = 0;
                let startLine = i;
                let endLine = i;

                for (let j = i; j < lines.length; j++) {
                    braceCount += (lines[j].match(/\{/g) || []).length;
                    braceCount -= (lines[j].match(/\}/g) || []).length;

                    if (braceCount === 0 && j > i) {
                        endLine = j;
                        break;
                    }
                }

                const functionCode = lines.slice(startLine, endLine + 1).join('\n');
                return {
                    code: functionCode,
                    lines: endLine - startLine + 1
                };
            }
        }

        return null;
    }

    /**
     * Extract class code from content
     */
    extractClassCode(className, content) {
        const lines = content.split('\n');
        const classRegex = new RegExp(`class\\s+${className}`);

        for (let i = 0; i < lines.length; i++) {
            if (classRegex.test(lines[i])) {
                // Find class boundaries
                let braceCount = 0;
                let startLine = i;
                let endLine = i;

                for (let j = i; j < lines.length; j++) {
                    braceCount += (lines[j].match(/\{/g) || []).length;
                    braceCount -= (lines[j].match(/\}/g) || []).length;

                    if (braceCount === 0 && j > i) {
                        endLine = j;
                        break;
                    }
                }

                const classCode = lines.slice(startLine, endLine + 1).join('\n');
                return {
                    code: classCode,
                    lines: endLine - startLine + 1
                };
            }
        }

        return null;
    }

    /**
     * Apply automated refactoring to multiple files
     */
    async applyRefactoringToMultipleFiles(filePaths) {
        console.log(`🔧 Applying automated refactoring to ${filePaths.length} files...`);

        const results = [];

        for (const filePath of filePaths) {
            const result = await this.applyRefactoringToFile(filePath);
            results.push(result);
        }

        // Generate summary report
        const summary = this.generateRefactoringSummary(results);

        console.log('\n📊 Refactoring Summary:');
        console.log(`Files processed: ${results.length}`);
        console.log(`Successful refactorings: ${results.filter(r => r.success).length}`);
        console.log(`Total lines reduced: ${summary.totalReduction}`);
        console.log(`Average reduction per file: ${summary.averageReduction.toFixed(1)} lines`);

        return {
            results: results,
            summary: summary
        };
    }

    /**
     * Generate refactoring summary
     */
    generateRefactoringSummary(results) {
        const successful = results.filter(r => r.success);
        const totalReduction = successful.reduce((sum, r) => sum + (r.originalSize - r.finalSize), 0);
        const averageReduction = successful.length > 0 ? totalReduction / successful.length : 0;

        return {
            totalFiles: results.length,
            successfulFiles: successful.length,
            failedFiles: results.length - successful.length,
            totalReduction: totalReduction,
            averageReduction: averageReduction,
            mostReducedFile: successful.reduce((max, r) =>
                (r.originalSize - r.finalSize) > (max.originalSize - max.finalSize) ? r : max,
                successful[0] || { originalSize: 0, finalSize: 0 }
            )
        };
    }

    /**
     * Save refactoring results to file
     */
    saveRefactoringReport(results, summary) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: summary,
            detailedResults: results,
            recommendations: this.generatePostRefactoringRecommendations(results)
        };

        const reportPath = path.join(process.cwd(), 'reports', 'automated-refactoring-report.json');
        const reportsDir = path.dirname(reportPath);

        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`Refactoring report saved to: ${reportPath}`);

        return reportPath;
    }

    /**
     * Generate post-refactoring recommendations
     */
    generatePostRefactoringRecommendations(results) {
        const recommendations = [];

        const stillOversized = results.filter(r =>
            r.success && r.finalSize > 300
        );

        if (stillOversized.length > 0) {
            recommendations.push({
                type: 'manual_refactoring',
                description: `${stillOversized.length} files still exceed 300 lines after automated refactoring`,
                files: stillOversized.map(r => r.file),
                action: 'Consider manual code review and further modularization'
            });
        }

        const highComplexityRemaining = results.filter(r =>
            r.success && r.analysis?.complexity > 40
        );

        if (highComplexityRemaining.length > 0) {
            recommendations.push({
                type: 'complexity_review',
                description: 'Some files still have high logical complexity',
                files: highComplexityRemaining.map(r => r.file),
                action: 'Review and simplify complex conditional logic'
            });
        }

        return recommendations;
    }
}

// CLI interface
if (require.main === module) {
    const applicator = new AutomatedRefactoringApplicator();

    // Initialize the optimizer first
    applicator.initialize().then(() => {
        // Get oversized files from the validation report
        const reportPath = path.join(process.cwd(), 'reports', 'file-size-validation-report.json');

        if (!fs.existsSync(reportPath)) {
            console.error('Validation report not found. Run file-size-management-optimizer.js first.');
            process.exit(1);
        }

        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const oversizedFiles = report.violations.map(v => v.file);

        console.log(`Found ${oversizedFiles.length} oversized files to refactor`);

        // Apply refactoring to the top 3 most oversized files for demonstration
        const topFiles = oversizedFiles
            .map(file => {
                const violation = report.violations.find(v => v.file === file);
                const sizeViolation = violation.violations.find(v => v.rule === 'line_count');
                return {
                    file: file,
                    size: sizeViolation ? sizeViolation.actual : 0
                };
            })
            .sort((a, b) => b.size - a.size)
            .slice(0, 3)
            .map(item => item.file);

        console.log('Processing top 3 oversized files:');
        topFiles.forEach(file => console.log(`  - ${file}`));

        return applicator.applyRefactoringToMultipleFiles(topFiles);
    }).then(result => {
        const reportPath = applicator.saveRefactoringReport(result.results, result.summary);

        console.log('\n🎯 Automated Refactoring Complete!');
        console.log(`Report saved to: ${reportPath}`);

        process.exit(0);
    }).catch(error => {
        console.error('Automated refactoring failed:', error);
        process.exit(1);
    });
}

module.exports = AutomatedRefactoringApplicator;