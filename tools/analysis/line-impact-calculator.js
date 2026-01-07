#!/usr/bin/env node

/**
 * Line Impact Calculation System
 * Advanced impact analysis for refactoring decisions
 */

const fs = require('fs');
const path = require('path');

class LineImpactCalculator {
    constructor() {
        this.impactMetrics = new Map();
        this.refactoringScenarios = new Map();
        this.riskAssessments = new Map();
    }

    /**
     * Calculate comprehensive impact of a refactoring change
     */
    calculateRefactoringImpact(originalContent, proposedChanges, filePath) {
        console.log(`📊 Calculating refactoring impact for: ${filePath}`);

        const baseMetrics = this.analyzeContent(originalContent);
        const impactBreakdown = this.calculateImpactBreakdown(baseMetrics, proposedChanges);
        const riskAssessment = this.assessRefactoringRisks(proposedChanges, baseMetrics);

        const impactAnalysis = {
            file: filePath,
            originalMetrics: baseMetrics,
            proposedChanges: proposedChanges,
            impactBreakdown: impactBreakdown,
            riskAssessment: riskAssessment,
            confidence: this.calculateConfidenceScore(proposedChanges)
        };

        // Calculate final metrics after changes
        impactAnalysis.finalMetrics = this.projectFinalMetrics(baseMetrics, impactAnalysis.impactBreakdown);
        impactAnalysis.netImpact = this.calculateNetImpact(impactAnalysis);
        impactAnalysis.recommendations = this.generateImpactRecommendations(impactAnalysis);

        this.impactMetrics.set(filePath, impactAnalysis);

        return impactAnalysis;
    }

    /**
     * Analyze content to extract key metrics
     */
    analyzeContent(content) {
        const lines = content.split('\n');
        const metrics = {
            totalLines: lines.length,
            codeLines: 0,
            commentLines: 0,
            blankLines: 0,
            functions: 0,
            classes: 0,
            imports: 0,
            complexity: 0,
            dependencies: 0
        };

        lines.forEach(line => {
            const trimmed = line.trim();

            if (trimmed === '') {
                metrics.blankLines++;
            } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                metrics.commentLines++;
            } else {
                metrics.codeLines++;

                // Count functions
                if (/(function\s+\w+|const\s+\w+\s*=\s*\(|=>)/.test(trimmed)) {
                    metrics.functions++;
                }

                // Count classes
                if (trimmed.startsWith('class ')) {
                    metrics.classes++;
                }

                // Count imports
                if (/(import\s+|require\s*\()/.test(trimmed)) {
                    metrics.imports++;
                }

                // Calculate complexity
                metrics.complexity += this.calculateLineComplexity(trimmed);
            }
        });

        metrics.dependencies = this.analyzeDependencies(content);

        return metrics;
    }

    /**
     * Calculate complexity score for a single line
     */
    calculateLineComplexity(line) {
        let complexity = 0;

        // Control structures
        if (/\b(if|for|while|switch|try|catch)\b/.test(line)) complexity += 2;

        // Logical operators
        complexity += (line.match(/\|\||&&/g) || []).length;

        // Ternary operators
        complexity += (line.match(/\?/g) || []).length;

        // Method calls
        complexity += (line.match(/\./g) || []).length * 0.5;

        return complexity;
    }

    /**
     * Analyze dependencies in the code
     */
    analyzeDependencies(content) {
        const dependencies = new Set();

        // Extract require statements
        const requireMatches = content.match(/require\s*\(\s*['"]([^'"]+)['"]/g);
        if (requireMatches) {
            requireMatches.forEach(match => {
                const dep = match.match(/require\s*\(\s*['"]([^'"]+)['"]/)[1];
                dependencies.add(dep);
            });
        }

        // Extract import statements
        const importMatches = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
            importMatches.forEach(match => {
                const dep = match.match(/import\s+.*from\s+['"]([^'"]+)['"]/)[1];
                dependencies.add(dep);
            });
        }

        return dependencies.size;
    }

    /**
     * Calculate detailed impact breakdown
     */
    calculateImpactBreakdown(baseMetrics, changes) {
        const breakdown = {
            lineChanges: { added: 0, removed: 0, modified: 0 },
            structuralChanges: { functions: 0, classes: 0, imports: 0 },
            complexityChanges: { delta: 0, percentage: 0 },
            dependencyChanges: { added: 0, removed: 0 },
            maintainabilityImpact: 0
        };

        changes.forEach(change => {
            switch (change.type) {
                case 'function_extraction':
                    breakdown.lineChanges.removed += change.linesExtracted || 15;
                    breakdown.structuralChanges.functions += change.functions?.length || 1;
                    breakdown.complexityChanges.delta -= 5; // Functions reduce complexity
                    break;

                case 'class_separation':
                    breakdown.lineChanges.removed += change.linesExtracted || 50;
                    breakdown.structuralChanges.classes += change.classes?.length || 1;
                    breakdown.complexityChanges.delta -= 10; // Classes reduce complexity
                    break;

                case 'import_consolidation':
                    breakdown.lineChanges.modified += Math.floor(change.originalImports * 0.2);
                    breakdown.structuralChanges.imports -= Math.floor(change.duplicatesRemoved || 1);
                    break;

                case 'code_cleanup':
                    breakdown.lineChanges.removed += change.linesRemoved || 10;
                    breakdown.complexityChanges.delta -= 2;
                    break;

                case 'module_splitting':
                    breakdown.lineChanges.removed += change.linesMoved || 100;
                    breakdown.dependencyChanges.added += change.newModules || 1;
                    breakdown.complexityChanges.delta -= 15;
                    break;
            }
        });

        // Calculate percentages
        breakdown.complexityChanges.percentage =
            baseMetrics.complexity > 0 ?
            (breakdown.complexityChanges.delta / baseMetrics.complexity) * 100 : 0;

        // Calculate maintainability impact (simplified scoring)
        breakdown.maintainabilityImpact = this.calculateMaintainabilityImpact(breakdown, baseMetrics);

        return breakdown;
    }

    /**
     * Calculate maintainability impact score
     */
    calculateMaintainabilityImpact(breakdown, baseMetrics) {
        let impact = 0;

        // Positive impacts
        impact += breakdown.structuralChanges.functions * 10; // Function extraction improves maintainability
        impact += breakdown.structuralChanges.classes * 15; // Class separation improves maintainability
        impact += breakdown.complexityChanges.delta * 2; // Complexity reduction improves maintainability

        // Negative impacts
        impact -= breakdown.dependencyChanges.added * 5; // New dependencies slightly reduce maintainability
        impact -= Math.abs(breakdown.lineChanges.modified) * 0.5; // Modifications can reduce maintainability

        // Normalize to -100 to +100 scale
        const maxPossibleImpact = Math.max(baseMetrics.totalLines, 100);
        return Math.max(-100, Math.min(100, (impact / maxPossibleImpact) * 100));
    }

    /**
     * Assess refactoring risks
     */
    assessRefactoringRisks(changes, baseMetrics) {
        const risks = {
            overall: 'low',
            factors: [],
            mitigationStrategies: [],
            confidence: 0.9
        };

        changes.forEach(change => {
            switch (change.type) {
                case 'function_extraction':
                    if (change.functions?.length > 5) {
                        risks.factors.push('Extracting many functions increases integration risk');
                        risks.overall = 'medium';
                    }
                    break;

                case 'class_separation':
                    risks.factors.push('Class separation may affect inheritance and dependencies');
                    risks.overall = 'medium';
                    risks.mitigationStrategies.push('Ensure proper import/export of separated classes');
                    break;

                case 'module_splitting':
                    if (change.newModules > 3) {
                        risks.factors.push('Creating many new modules increases complexity');
                        risks.overall = 'high';
                        risks.confidence = 0.7;
                    }
                    break;
            }
        });

        // Size-based risk assessment
        if (baseMetrics.totalLines > 1000) {
            risks.factors.push('Large file size increases refactoring risk');
            risks.overall = risks.overall === 'low' ? 'medium' : 'high';
        }

        // Complexity-based risk assessment
        if (baseMetrics.complexity > 100) {
            risks.factors.push('High complexity increases testing requirements');
            risks.mitigationStrategies.push('Implement comprehensive unit tests before refactoring');
        }

        return risks;
    }

    /**
     * Project final metrics after changes
     */
    projectFinalMetrics(baseMetrics, impactBreakdown) {
        return {
            totalLines: Math.max(0, baseMetrics.totalLines + impactBreakdown.lineChanges.added - impactBreakdown.lineChanges.removed),
            codeLines: Math.max(0, baseMetrics.codeLines + impactBreakdown.lineChanges.added - impactBreakdown.lineChanges.removed),
            commentLines: baseMetrics.commentLines, // Assume comments unchanged
            blankLines: baseMetrics.blankLines, // Assume blank lines unchanged
            functions: Math.max(0, baseMetrics.functions + impactBreakdown.structuralChanges.functions),
            classes: Math.max(0, baseMetrics.classes + impactBreakdown.structuralChanges.classes),
            imports: Math.max(0, baseMetrics.imports + impactBreakdown.structuralChanges.imports),
            complexity: Math.max(0, baseMetrics.complexity + impactBreakdown.complexityChanges.delta),
            dependencies: Math.max(0, baseMetrics.dependencies + impactBreakdown.dependencyChanges.added - impactBreakdown.dependencyChanges.removed)
        };
    }

    /**
     * Calculate net impact summary
     */
    calculateNetImpact(analysis) {
        const netImpact = {
            sizeReduction: analysis.originalMetrics.totalLines - analysis.finalMetrics.totalLines,
            sizeReductionPercentage: 0,
            complexityReduction: analysis.originalMetrics.complexity - analysis.finalMetrics.complexity,
            complexityReductionPercentage: 0,
            maintainabilityImprovement: analysis.impactBreakdown.maintainabilityImpact,
            riskAdjustedBenefit: 0
        };

        netImpact.sizeReductionPercentage =
            analysis.originalMetrics.totalLines > 0 ?
            (netImpact.sizeReduction / analysis.originalMetrics.totalLines) * 100 : 0;

        netImpact.complexityReductionPercentage =
            analysis.originalMetrics.complexity > 0 ?
            (netImpact.complexityReduction / analysis.originalMetrics.complexity) * 100 : 0;

        // Calculate risk-adjusted benefit
        const riskMultiplier = { low: 1.0, medium: 0.8, high: 0.6 };
        const riskFactor = riskMultiplier[analysis.riskAssessment.overall] || 0.8;
        netImpact.riskAdjustedBenefit = analysis.impactBreakdown.maintainabilityImpact * riskFactor;

        return netImpact;
    }

    /**
     * Generate impact-based recommendations
     */
    generateImpactRecommendations(analysis) {
        const recommendations = [];

        // Size-based recommendations
        if (analysis.netImpact.sizeReductionPercentage > 50) {
            recommendations.push({
                type: 'size_optimization',
                priority: 'high',
                message: `Significant size reduction (${analysis.netImpact.sizeReductionPercentage.toFixed(1)}%) achieved`,
                action: 'Consider further modularization if file remains complex'
            });
        }

        // Complexity recommendations
        if (analysis.netImpact.complexityReduction > 20) {
            recommendations.push({
                type: 'complexity_improvement',
                priority: 'high',
                message: `Complexity reduced by ${analysis.netImpact.complexityReduction} points`,
                action: 'Monitor for continued complexity management'
            });
        }

        // Risk-based recommendations
        if (analysis.riskAssessment.overall === 'high') {
            recommendations.push({
                type: 'risk_mitigation',
                priority: 'critical',
                message: 'High-risk refactoring detected',
                action: analysis.riskAssessment.mitigationStrategies.join('; ')
            });
        }

        // Maintainability recommendations
        if (analysis.netImpact.maintainabilityImprovement > 20) {
            recommendations.push({
                type: 'maintainability_gain',
                priority: 'medium',
                message: `Maintainability improved by ${analysis.netImpact.maintainabilityImprovement.toFixed(1)} points`,
                action: 'Document the refactoring benefits for the team'
            });
        }

        return recommendations;
    }

    /**
     * Calculate confidence score for the impact analysis
     */
    calculateConfidenceScore(changes) {
        let confidence = 0.9; // Base confidence

        changes.forEach(change => {
            switch (change.type) {
                case 'function_extraction':
                    confidence *= 0.95; // High confidence for function extraction
                    break;
                case 'class_separation':
                    confidence *= 0.90; // Good confidence for class separation
                    break;
                case 'import_consolidation':
                    confidence *= 0.98; // Very high confidence for import consolidation
                    break;
                case 'module_splitting':
                    confidence *= 0.85; // Lower confidence for complex module splitting
                    break;
            }
        });

        return Math.max(0.1, confidence); // Minimum confidence of 10%
    }

    /**
     * Generate comprehensive impact report
     */
    generateImpactReport(impactAnalysis) {
        const executiveSummary = this.generateExecutiveSummary(impactAnalysis);
        const report = {
            timestamp: new Date().toISOString(),
            file: impactAnalysis.file,
            executiveSummary: executiveSummary,
            detailedAnalysis: impactAnalysis,
            visualizations: this.generateVisualizations(impactAnalysis),
            recommendations: impactAnalysis.recommendations,
            nextSteps: this.generateNextSteps(impactAnalysis, executiveSummary)
        };

        return report;
    }

    /**
     * Generate executive summary
     */
    generateExecutiveSummary(analysis) {
        const compliance = analysis.finalMetrics.totalLines <= 300;
        const sizeChange = analysis.netImpact.sizeReduction > 0 ? 'reduction' : 'increase';

        return {
            compliance: compliance,
            sizeChange: {
                absolute: Math.abs(analysis.netImpact.sizeReduction),
                percentage: Math.abs(analysis.netImpact.sizeReductionPercentage),
                direction: sizeChange
            },
            complexityChange: {
                absolute: analysis.netImpact.complexityReduction,
                percentage: analysis.netImpact.complexityReductionPercentage
            },
            maintainabilityChange: analysis.netImpact.maintainabilityImprovement,
            riskLevel: analysis.riskAssessment.overall,
            confidence: analysis.confidence
        };
    }

    /**
     * Generate visualizations data
     */
    generateVisualizations(analysis) {
        return {
            sizeComparison: {
                before: analysis.originalMetrics.totalLines,
                after: analysis.finalMetrics.totalLines,
                target: 300
            },
            complexityTrend: {
                before: analysis.originalMetrics.complexity,
                after: analysis.finalMetrics.complexity
            },
            maintainabilityGauge: {
                value: analysis.netImpact.maintainabilityImprovement,
                min: -100,
                max: 100
            },
            riskMeter: {
                level: analysis.riskAssessment.overall,
                factors: analysis.riskAssessment.factors.length
            }
        };
    }

    /**
     * Generate next steps recommendations
     */
    generateNextSteps(analysis, executiveSummary) {
        const nextSteps = [];

        if (!executiveSummary.compliance) {
            nextSteps.push({
                action: 'Continue refactoring',
                description: `File still exceeds 300-line limit by ${analysis.finalMetrics.totalLines - 300} lines`,
                priority: 'high'
            });
        }

        if (analysis.riskAssessment.overall !== 'low') {
            nextSteps.push({
                action: 'Implement risk mitigations',
                description: analysis.riskAssessment.mitigationStrategies.join('; '),
                priority: 'high'
            });
        }

        if (analysis.netImpact.complexityReduction < 10) {
            nextSteps.push({
                action: 'Review complexity',
                description: 'Consider additional complexity reduction techniques',
                priority: 'medium'
            });
        }

        nextSteps.push({
            action: 'Run tests',
            description: 'Execute full test suite to validate refactoring',
            priority: 'critical'
        });

        return nextSteps;
    }

    /**
     * Save impact report to file
     */
    saveImpactReport(analysis, filename = null) {
        const report = this.generateImpactReport(analysis);
        const reportName = filename || `impact-report-${path.basename(analysis.file, '.js')}.json`;
        const reportPath = path.join(process.cwd(), 'reports', reportName);

        const reportsDir = path.dirname(reportPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`Impact report saved to: ${reportPath}`);

        return reportPath;
    }

    /**
     * Analyze multiple files and generate comparative report
     */
    analyzeMultipleFiles(filePaths) {
        const analyses = [];

        filePaths.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Generate sample changes for demonstration
                const sampleChanges = this.generateSampleChanges(content);

                const analysis = this.calculateRefactoringImpact(content, sampleChanges, filePath);
                analyses.push(analysis);
            }
        });

        const comparativeReport = {
            timestamp: new Date().toISOString(),
            filesAnalyzed: analyses.length,
            aggregateMetrics: this.calculateAggregateMetrics(analyses),
            comparativeAnalysis: this.generateComparativeAnalysis(analyses),
            recommendations: this.generateComparativeRecommendations(analyses)
        };

        return comparativeReport;
    }

    /**
     * Generate sample changes for demonstration
     */
    generateSampleChanges(content) {
        const changes = [];
        const lines = content.split('\n');

        if (lines.length > 300) {
            changes.push({
                type: 'function_extraction',
                linesExtracted: Math.min(50, Math.floor(lines.length * 0.1)),
                functions: ['extractedFunction1', 'extractedFunction2']
            });
        }

        if (lines.length > 500) {
            changes.push({
                type: 'class_separation',
                linesExtracted: Math.min(100, Math.floor(lines.length * 0.15)),
                classes: ['SeparatedClass']
            });
        }

        return changes;
    }

    /**
     * Calculate aggregate metrics across multiple files
     */
    calculateAggregateMetrics(analyses) {
        return {
            totalFiles: analyses.length,
            averageSizeReduction: analyses.reduce((sum, a) => sum + a.netImpact.sizeReduction, 0) / analyses.length,
            averageComplexityReduction: analyses.reduce((sum, a) => sum + a.netImpact.complexityReduction, 0) / analyses.length,
            averageMaintainabilityImprovement: analyses.reduce((sum, a) => sum + a.netImpact.maintainabilityImprovement, 0) / analyses.length,
            complianceRate: (analyses.filter(a => a.finalMetrics.totalLines <= 300).length / analyses.length) * 100,
            highRiskFiles: analyses.filter(a => a.riskAssessment.overall === 'high').length
        };
    }

    /**
     * Generate comparative analysis
     */
    generateComparativeAnalysis(analyses) {
        const sortedBySizeReduction = analyses.sort((a, b) => b.netImpact.sizeReduction - a.netImpact.sizeReduction);
        const sortedByRisk = analyses.sort((a, b) => {
            const riskOrder = { low: 1, medium: 2, high: 3 };
            return riskOrder[b.riskAssessment.overall] - riskOrder[a.riskAssessment.overall];
        });

        return {
            mostReduced: sortedBySizeReduction[0],
            leastReduced: sortedBySizeReduction[sortedBySizeReduction.length - 1],
            highestRisk: sortedByRisk[0],
            lowestRisk: sortedByRisk[sortedByRisk.length - 1],
            sizeReductionDistribution: this.calculateDistribution(analyses.map(a => a.netImpact.sizeReduction)),
            riskDistribution: this.calculateDistribution(analyses.map(a => a.riskAssessment.overall))
        };
    }

    /**
     * Calculate distribution of values
     */
    calculateDistribution(values) {
        if (typeof values[0] === 'number') {
            const sorted = values.sort((a, b) => a - b);
            return {
                min: sorted[0],
                max: sorted[sorted.length - 1],
                median: sorted[Math.floor(sorted.length / 2)],
                average: values.reduce((sum, val) => sum + val, 0) / values.length
            };
        } else {
            // For categorical values
            const counts = {};
            values.forEach(val => {
                counts[val] = (counts[val] || 0) + 1;
            });
            return counts;
        }
    }

    /**
     * Generate comparative recommendations
     */
    generateComparativeRecommendations(analyses) {
        const recommendations = [];

        const highRiskFiles = analyses.filter(a => a.riskAssessment.overall === 'high');
        if (highRiskFiles.length > 0) {
            recommendations.push({
                type: 'risk_focus',
                priority: 'high',
                message: `${highRiskFiles.length} files have high refactoring risk`,
                action: 'Prioritize these files for careful review and testing'
            });
        }

        const nonCompliantFiles = analyses.filter(a => a.finalMetrics.totalLines > 300);
        if (nonCompliantFiles.length > 0) {
            recommendations.push({
                type: 'compliance_focus',
                priority: 'high',
                message: `${nonCompliantFiles.length} files still exceed size limit`,
                action: 'Continue refactoring these files with additional techniques'
            });
        }

        const lowImpactFiles = analyses.filter(a => a.netImpact.sizeReduction < 10);
        if (lowImpactFiles.length > analyses.length * 0.5) {
            recommendations.push({
                type: 'strategy_review',
                priority: 'medium',
                message: 'Many files show low refactoring impact',
                action: 'Review refactoring strategy and consider alternative approaches'
            });
        }

        return recommendations;
    }
}

// CLI interface
if (require.main === module) {
    const calculator = new LineImpactCalculator();

    // Analyze the recently refactored files
    const filesToAnalyze = [
        '/mnt/chromeos/removable/Drive/repos/tsv-ledger/file-size-management-optimizer.js',
        '/mnt/chromeos/removable/Drive/repos/tsv-ledger/human-ai-collaboration-system.js',
        '/mnt/chromeos/removable/Drive/repos/tsv-ledger/self-evolving-instruction-system.js'
    ];

    console.log('🔍 Analyzing refactoring impact for multiple files...');

    const comparativeReport = calculator.analyzeMultipleFiles(filesToAnalyze);

    console.log('\n📊 Comparative Impact Analysis:');
    console.log(`Files analyzed: ${comparativeReport.filesAnalyzed}`);
    console.log(`Average size reduction: ${comparativeReport.aggregateMetrics.averageSizeReduction.toFixed(1)} lines`);
    console.log(`Average complexity reduction: ${comparativeReport.aggregateMetrics.averageComplexityReduction.toFixed(1)} points`);
    console.log(`Compliance rate: ${comparativeReport.aggregateMetrics.complianceRate.toFixed(1)}%`);
    console.log(`High-risk files: ${comparativeReport.aggregateMetrics.highRiskFiles}`);

    // Save detailed reports for each file
    filesToAnalyze.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const sampleChanges = calculator.generateSampleChanges(content);
            const analysis = calculator.calculateRefactoringImpact(content, sampleChanges, filePath);
            calculator.saveImpactReport(analysis);
        }
    });

    // Save comparative report
    const comparativeReportPath = path.join(process.cwd(), 'reports', 'comparative-impact-report.json');
    fs.writeFileSync(comparativeReportPath, JSON.stringify(comparativeReport, null, 2));
    console.log(`Comparative report saved to: ${comparativeReportPath}`);

    console.log('\n✅ Line impact analysis complete!');
}

module.exports = LineImpactCalculator;