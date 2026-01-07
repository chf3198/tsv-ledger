#!/usr/bin/env node

/**
 * Merge Conflict Resolution Automation System
 * Automates detection, analysis, and resolution of merge conflicts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MergeConflictResolver {
    constructor() {
        this.conflictPatterns = {
            // Package.json conflicts
            'package.json': {
                patterns: [
                    {
                        type: 'dependency-version',
                        regex: /"([^"]+)":\s*"([^"]+)"\s*,\s*$/gm,
                        resolver: this.resolveDependencyConflict.bind(this)
                    },
                    {
                        type: 'script-conflict',
                        regex: /"scripts":\s*\{[\s\S]*?\}/g,
                        resolver: this.resolveScriptConflict.bind(this)
                    }
                ]
            },

            // JavaScript/TypeScript conflicts
            'js': {
                patterns: [
                    {
                        type: 'import-conflict',
                        regex: /^import\s+.*from\s+['"][^'"]+['"];?$/gm,
                        resolver: this.resolveImportConflict.bind(this)
                    },
                    {
                        type: 'function-conflict',
                        regex: /^function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\n^\}/gm,
                        resolver: this.resolveFunctionConflict.bind(this)
                    },
                    {
                        type: 'variable-conflict',
                        regex: /^(?:const|let|var)\s+\w+\s*=\s*[^;]+;?$/gm,
                        resolver: this.resolveVariableConflict.bind(this)
                    }
                ]
            },

            // JSON conflicts
            'json': {
                patterns: [
                    {
                        type: 'json-property',
                        regex: /"([^"]+)":\s*("[^"]*"|[^,]+)(,?)/g,
                        resolver: this.resolveJsonPropertyConflict.bind(this)
                    }
                ]
            },

            // Text/Markdown conflicts
            'md': {
                patterns: [
                    {
                        type: 'list-item',
                        regex: /^[-*+]\s+.+$/gm,
                        resolver: this.resolveListConflict.bind(this)
                    },
                    {
                        type: 'heading',
                        regex: /^#{1,6}\s+.+$/gm,
                        resolver: this.resolveHeadingConflict.bind(this)
                    }
                ]
            }
        };

        this.conflictAnalysis = {
            severity: {
                low: ['whitespace', 'comment'],
                medium: ['import', 'variable', 'list-item'],
                high: ['function', 'dependency-version', 'script-conflict']
            },
            risk: {
                low: ['comment', 'whitespace'],
                medium: ['import', 'variable', 'list-item'],
                high: ['function', 'dependency', 'script']
            }
        };
    }

    /**
     * Detect merge conflicts in repository
     */
    detectConflicts() {
        try {
            // Check if we're in a merge state
            const mergeHead = this.getMergeHead();
            if (!mergeHead) {
                return { inMerge: false, conflicts: [] };
            }

            // Get conflicted files
            const conflictedFiles = this.getConflictedFiles();

            const conflicts = conflictedFiles.map(file => ({
                file: file,
                analysis: this.analyzeConflict(file),
                suggestions: this.generateResolutionSuggestions(file)
            }));

            return {
                inMerge: true,
                mergeHead: mergeHead,
                totalConflicts: conflicts.length,
                conflicts: conflicts,
                summary: this.generateConflictSummary(conflicts)
            };
        } catch (error) {
            return {
                error: 'Failed to detect conflicts',
                message: error.message
            };
        }
    }

    /**
     * Get merge head information
     */
    getMergeHead() {
        try {
            const mergeHead = execSync('git rev-parse MERGE_HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
            return mergeHead;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get list of conflicted files
     */
    getConflictedFiles() {
        try {
            const output = execSync('git diff --name-only --diff-filter=U', { encoding: 'utf8' });
            return output.split('\n').filter(file => file.trim());
        } catch (error) {
            return [];
        }
    }

    /**
     * Analyze a specific conflict
     */
    analyzeConflict(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileExt = path.extname(filePath).slice(1).toLowerCase();
            const fileType = this.getFileType(fileExt);

            const conflictBlocks = this.extractConflictBlocks(content);
            const analysis = {
                file: filePath,
                type: fileType,
                conflictBlocks: conflictBlocks.length,
                totalLines: content.split('\n').length,
                severity: 'low',
                risk: 'low',
                patterns: []
            };

            // Analyze each conflict block
            conflictBlocks.forEach(block => {
                const blockAnalysis = this.analyzeConflictBlock(block, fileType);
                analysis.patterns.push(blockAnalysis);

                // Update overall severity and risk
                if (this.conflictAnalysis.severity.high.includes(blockAnalysis.type)) {
                    analysis.severity = 'high';
                } else if (this.conflictAnalysis.severity.medium.includes(blockAnalysis.type) && analysis.severity !== 'high') {
                    analysis.severity = 'medium';
                }

                if (this.conflictAnalysis.risk.high.includes(blockAnalysis.type)) {
                    analysis.risk = 'high';
                } else if (this.conflictAnalysis.risk.medium.includes(blockAnalysis.type) && analysis.risk !== 'high') {
                    analysis.risk = 'medium';
                }
            });

            return analysis;
        } catch (error) {
            return {
                file: filePath,
                error: 'Failed to analyze conflict',
                message: error.message
            };
        }
    }

    /**
     * Extract conflict blocks from file content
     */
    extractConflictBlocks(content) {
        const conflictRegex = /<<<<<<< HEAD\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> [^\n]+/g;
        const blocks = [];
        let match;

        while ((match = conflictRegex.exec(content)) !== null) {
            blocks.push({
                fullMatch: match[0],
                headContent: match[1],
                incomingContent: match[2],
                startIndex: match.index,
                endIndex: match.index + match[0].length
            });
        }

        return blocks;
    }

    /**
     * Analyze a conflict block
     */
    analyzeConflictBlock(block, fileType) {
        const patterns = this.conflictPatterns[fileType] || this.conflictPatterns['js']; // Default to JS patterns

        for (const pattern of patterns.patterns) {
            const headMatches = block.headContent.match(pattern.regex) || [];
            const incomingMatches = block.incomingContent.match(pattern.regex) || [];

            if (headMatches.length > 0 || incomingMatches.length > 0) {
                return {
                    type: pattern.type,
                    headMatches: headMatches.length,
                    incomingMatches: incomingMatches.length,
                    canAutoResolve: this.canAutoResolve(pattern.type, headMatches, incomingMatches),
                    resolutionStrategy: this.getResolutionStrategy(pattern.type)
                };
            }
        }

        return {
            type: 'unknown',
            headMatches: 0,
            incomingMatches: 0,
            canAutoResolve: false,
            resolutionStrategy: 'manual'
        };
    }

    /**
     * Get file type from extension
     */
    getFileType(ext) {
        const typeMap = {
            'js': 'js',
            'ts': 'js',
            'jsx': 'js',
            'tsx': 'js',
            'json': 'json',
            'md': 'md',
            'txt': 'md',
            'yml': 'json',
            'yaml': 'json'
        };

        return typeMap[ext] || 'js';
    }

    /**
     * Check if conflict can be auto-resolved
     */
    canAutoResolve(conflictType, headMatches, incomingMatches) {
        const autoResolvableTypes = [
            'dependency-version',
            'import-conflict',
            'variable-conflict',
            'json-property',
            'list-item'
        ];

        return autoResolvableTypes.includes(conflictType) &&
               (headMatches.length === 1 || incomingMatches.length === 1);
    }

    /**
     * Get resolution strategy for conflict type
     */
    getResolutionStrategy(conflictType) {
        const strategies = {
            'dependency-version': 'prefer-highest-version',
            'import-conflict': 'merge-imports',
            'function-conflict': 'manual-review',
            'variable-conflict': 'prefer-incoming',
            'script-conflict': 'manual-review',
            'json-property': 'merge-properties',
            'list-item': 'combine-lists',
            'heading': 'manual-review'
        };

        return strategies[conflictType] || 'manual-review';
    }

    /**
     * Generate resolution suggestions
     */
    generateResolutionSuggestions(filePath) {
        const analysis = this.analyzeConflict(filePath);
        const suggestions = [];

        analysis.patterns.forEach(pattern => {
            if (pattern.canAutoResolve) {
                suggestions.push({
                    type: 'auto-resolve',
                    message: `Can automatically resolve ${pattern.type} conflict`,
                    action: 'run_auto_resolve'
                });
            } else {
                suggestions.push({
                    type: 'manual-review',
                    message: `${pattern.type} conflict requires manual review`,
                    action: 'review_manually',
                    tips: this.getManualReviewTips(pattern.type)
                });
            }
        });

        return suggestions;
    }

    /**
     * Get manual review tips
     */
    getManualReviewTips(conflictType) {
        const tips = {
            'function-conflict': [
                'Compare function implementations for differences',
                'Check if both versions are needed or if one supersedes the other',
                'Consider extracting common logic to avoid duplication'
            ],
            'script-conflict': [
                'Review both script versions for compatibility',
                'Check if scripts serve different purposes',
                'Consider combining or choosing the more comprehensive version'
            ],
            'heading': [
                'Determine which heading level is appropriate',
                'Check document structure consistency',
                'Ensure heading hierarchy makes sense'
            ]
        };

        return tips[conflictType] || ['Review both versions carefully', 'Choose the most appropriate resolution'];
    }

    /**
     * Auto-resolve conflicts
     */
    autoResolveConflicts(conflicts) {
        const results = [];

        conflicts.forEach(conflict => {
            if (conflict.analysis.patterns.some(p => p.canAutoResolve)) {
                try {
                    const resolved = this.resolveFileConflicts(conflict.file);
                    results.push({
                        file: conflict.file,
                        success: true,
                        resolved: resolved,
                        message: 'Auto-resolved successfully'
                    });
                } catch (error) {
                    results.push({
                        file: conflict.file,
                        success: false,
                        error: error.message,
                        message: 'Auto-resolution failed'
                    });
                }
            } else {
                results.push({
                    file: conflict.file,
                    success: false,
                    message: 'Manual resolution required'
                });
            }
        });

        return results;
    }

    /**
     * Resolve conflicts in a specific file
     */
    resolveFileConflicts(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileExt = path.extname(filePath).slice(1).toLowerCase();
        const fileType = this.getFileType(fileExt);

        let resolvedContent = content;
        const conflictBlocks = this.extractConflictBlocks(content);

        conflictBlocks.forEach(block => {
            const resolution = this.resolveConflictBlock(block, fileType);
            if (resolution) {
                resolvedContent = resolvedContent.replace(block.fullMatch, resolution);
            }
        });

        if (resolvedContent !== content) {
            fs.writeFileSync(filePath, resolvedContent);
            return true;
        }

        return false;
    }

    /**
     * Resolve a single conflict block
     */
    resolveConflictBlock(block, fileType) {
        const patterns = this.conflictPatterns[fileType] || this.conflictPatterns['js'];

        for (const pattern of patterns.patterns) {
            const headMatches = block.headContent.match(pattern.regex) || [];
            const incomingMatches = block.incomingContent.match(pattern.regex) || [];

            if (headMatches.length > 0 || incomingMatches.length > 0) {
                return pattern.resolver(headMatches, incomingMatches, block);
            }
        }

        return null;
    }

    /**
     * Resolve dependency version conflicts
     */
    resolveDependencyConflict(headMatches, incomingMatches, block) {
        // Prefer the higher version or keep both if different packages
        const headDeps = this.parseDependencies(block.headContent);
        const incomingDeps = this.parseDependencies(block.incomingContent);

        const merged = { ...headDeps, ...incomingDeps };

        // For same package, prefer higher version
        Object.keys(merged).forEach(pkg => {
            if (headDeps[pkg] && incomingDeps[pkg] && headDeps[pkg] !== incomingDeps[pkg]) {
                merged[pkg] = this.compareVersions(headDeps[pkg], incomingDeps[pkg]) > 0 ?
                    headDeps[pkg] : incomingDeps[pkg];
            }
        });

        return this.formatDependencies(merged);
    }

    /**
     * Resolve import conflicts
     */
    resolveImportConflict(headMatches, incomingMatches, block) {
        const headImports = new Set(block.headContent.split('\n').filter(line => line.trim().startsWith('import')));
        const incomingImports = new Set(block.incomingContent.split('\n').filter(line => line.trim().startsWith('import')));

        const mergedImports = new Set([...headImports, ...incomingImports]);
        return Array.from(mergedImports).join('\n');
    }

    /**
     * Resolve function conflicts (prefer manual for now)
     */
    resolveFunctionConflict(headMatches, incomingMatches, block) {
        // For now, prefer the incoming changes
        return block.incomingContent;
    }

    /**
     * Resolve variable conflicts
     */
    resolveVariableConflict(headMatches, incomingMatches, block) {
        // Prefer the incoming version
        return block.incomingContent;
    }

    /**
     * Resolve script conflicts
     */
    resolveScriptConflict(headMatches, incomingMatches, block) {
        // Manual resolution needed
        return null;
    }

    /**
     * Resolve JSON property conflicts
     */
    resolveJsonPropertyConflict(headMatches, incomingMatches, block) {
        try {
            const headJson = JSON.parse(block.headContent);
            const incomingJson = JSON.parse(block.incomingContent);

            const merged = this.mergeJsonObjects(headJson, incomingJson);
            return JSON.stringify(merged, null, 2);
        } catch (error) {
            return null;
        }
    }

    /**
     * Resolve list conflicts
     */
    resolveListConflict(headMatches, incomingMatches, block) {
        const headItems = block.headContent.split('\n').filter(line => line.trim().match(/^[-*+]/));
        const incomingItems = block.incomingContent.split('\n').filter(line => line.trim().match(/^[-*+]/));

        const merged = [...new Set([...headItems, ...incomingItems])];
        return merged.join('\n');
    }

    /**
     * Resolve heading conflicts
     */
    resolveHeadingConflict(headMatches, incomingMatches, block) {
        // Prefer the incoming version
        return block.incomingContent;
    }

    /**
     * Parse dependencies from package.json content
     */
    parseDependencies(content) {
        try {
            const json = JSON.parse(content);
            return {
                ...(json.dependencies || {}),
                ...(json.devDependencies || {})
            };
        } catch (error) {
            return {};
        }
    }

    /**
     * Format dependencies as JSON
     */
    formatDependencies(deps) {
        const dependencies = {};
        const devDependencies = {};

        Object.entries(deps).forEach(([pkg, version]) => {
            if (pkg.startsWith('@types/') || pkg.includes('test') || pkg.includes('eslint')) {
                devDependencies[pkg] = version;
            } else {
                dependencies[pkg] = version;
            }
        });

        const result = {};
        if (Object.keys(dependencies).length > 0) {
            result.dependencies = dependencies;
        }
        if (Object.keys(devDependencies).length > 0) {
            result.devDependencies = devDependencies;
        }

        return JSON.stringify(result, null, 2);
    }

    /**
     * Compare semantic versions
     */
    compareVersions(v1, v2) {
        const parts1 = v1.replace(/[^\d.]/g, '').split('.').map(Number);
        const parts2 = v2.replace(/[^\d.]/g, '').split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;

            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }

        return 0;
    }

    /**
     * Merge JSON objects
     */
    mergeJsonObjects(obj1, obj2) {
        const result = { ...obj1 };

        Object.entries(obj2).forEach(([key, value]) => {
            if (result[key] && typeof result[key] === 'object' && typeof value === 'object') {
                result[key] = this.mergeJsonObjects(result[key], value);
            } else {
                result[key] = value;
            }
        });

        return result;
    }

    /**
     * Generate conflict summary
     */
    generateConflictSummary(conflicts) {
        const summary = {
            totalFiles: conflicts.length,
            autoResolvable: conflicts.filter(c => c.analysis.patterns.some(p => p.canAutoResolve)).length,
            manualReview: conflicts.filter(c => c.analysis.patterns.some(p => !p.canAutoResolve)).length,
            bySeverity: { low: 0, medium: 0, high: 0 },
            byRisk: { low: 0, medium: 0, high: 0 },
            byType: {}
        };

        conflicts.forEach(conflict => {
            summary.bySeverity[conflict.analysis.severity]++;
            summary.byRisk[conflict.analysis.risk]++;

            conflict.analysis.patterns.forEach(pattern => {
                summary.byType[pattern.type] = (summary.byType[pattern.type] || 0) + 1;
            });
        });

        return summary;
    }

    /**
     * Save conflict analysis report
     */
    saveConflictReport(analysis, filePath = 'merge-conflict-report.json') {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: analysis,
            recommendations: this.generateRecommendations(analysis)
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`Merge conflict report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.summary.autoResolvable > 0) {
            recommendations.push({
                type: 'auto-resolve',
                message: `${analysis.summary.autoResolvable} conflicts can be auto-resolved`,
                action: 'run_auto_resolve'
            });
        }

        if (analysis.summary.manualReview > 0) {
            recommendations.push({
                type: 'manual-review',
                message: `${analysis.summary.manualReview} conflicts require manual review`,
                action: 'review_manually'
            });
        }

        if (analysis.summary.byRisk.high > 0) {
            recommendations.push({
                type: 'high-risk',
                message: `${analysis.summary.byRisk.high} high-risk conflicts detected`,
                action: 'prioritize_review'
            });
        }

        return recommendations;
    }
}

// CLI interface
if (require.main === module) {
    const resolver = new MergeConflictResolver();

    const command = process.argv[2];

    switch (command) {
        case 'detect':
            const analysis = resolver.detectConflicts();

            if (analysis.error) {
                console.log(`❌ Error: ${analysis.error}`);
                console.log(analysis.message);
                process.exit(1);
            }

            if (!analysis.inMerge) {
                console.log('ℹ️  No merge conflicts detected');
                process.exit(0);
            }

            console.log(`\n🔍 Merge Conflict Analysis:`);
            console.log(`Total conflicted files: ${analysis.totalConflicts}`);
            console.log(`Auto-resolvable: ${analysis.summary.autoResolvable}`);
            console.log(`Manual review needed: ${analysis.summary.manualReview}`);

            console.log('\n📊 By Severity:');
            Object.entries(analysis.summary.bySeverity).forEach(([level, count]) => {
                console.log(`  ${level}: ${count}`);
            });

            console.log('\n📊 By Risk:');
            Object.entries(analysis.summary.byRisk).forEach(([level, count]) => {
                console.log(`  ${level}: ${count}`);
            });

            if (Object.keys(analysis.summary.byType).length > 0) {
                console.log('\n📊 By Type:');
                Object.entries(analysis.summary.byType).forEach(([type, count]) => {
                    console.log(`  ${type}: ${count}`);
                });
            }

            console.log('\n📋 File Details:');
            analysis.conflicts.forEach(conflict => {
                console.log(`  • ${conflict.file} (${conflict.analysis.severity} risk, ${conflict.analysis.conflictBlocks} blocks)`);
            });

            resolver.saveConflictReport(analysis);
            break;

        case 'auto-resolve':
            const detectResult = resolver.detectConflicts();

            if (!detectResult.inMerge) {
                console.log('ℹ️  No merge in progress');
                process.exit(0);
            }

            console.log('🔧 Attempting auto-resolution...');
            const resolveResults = resolver.autoResolveConflicts(detectResult.conflicts);

            console.log('\n📋 Resolution Results:');
            resolveResults.forEach(result => {
                const icon = result.success ? '✅' : '❌';
                console.log(`${icon} ${result.file}: ${result.message}`);
            });

            const successful = resolveResults.filter(r => r.success).length;
            console.log(`\n📊 Summary: ${successful}/${resolveResults.length} files auto-resolved`);

            if (successful < resolveResults.length) {
                console.log('\n💡 Remaining conflicts require manual resolution');
            }
            break;

        case 'analyze':
            const filePath = process.argv[3];
            if (!filePath) {
                console.log('Usage: node merge-conflict-resolver.js analyze <file>');
                process.exit(1);
            }

            const fileAnalysis = resolver.analyzeConflict(filePath);
            console.log(`\n🔍 Conflict Analysis for ${filePath}:`);

            if (fileAnalysis.error) {
                console.log(`❌ Error: ${fileAnalysis.error}`);
                console.log(fileAnalysis.message);
                process.exit(1);
            }

            console.log(`Type: ${fileAnalysis.type}`);
            console.log(`Conflict blocks: ${fileAnalysis.conflictBlocks}`);
            console.log(`Severity: ${fileAnalysis.severity}`);
            console.log(`Risk: ${fileAnalysis.risk}`);

            if (fileAnalysis.patterns && fileAnalysis.patterns.length > 0) {
                console.log('\n🔧 Detected Patterns:');
                fileAnalysis.patterns.forEach(pattern => {
                    console.log(`  • ${pattern.type} (${pattern.canAutoResolve ? 'auto-resolvable' : 'manual'})`);
                });
            }

            const suggestions = resolver.generateResolutionSuggestions(filePath);
            if (suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                suggestions.forEach(suggestion => {
                    console.log(`  • ${suggestion.message}`);
                });
            }
            break;

        default:
            console.log('Usage: node merge-conflict-resolver.js <command> [args]');
            console.log('Commands:');
            console.log('  detect          - Detect and analyze merge conflicts');
            console.log('  auto-resolve    - Attempt automatic conflict resolution');
            console.log('  analyze <file>  - Analyze conflicts in specific file');
            process.exit(1);
    }
}

module.exports = MergeConflictResolver;