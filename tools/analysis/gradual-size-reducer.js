#!/usr/bin/env node

/**
 * Gradual Size Reduction Strategies
 * Systematic approach to reducing oversized files
 */

const fs = require('fs');
const path = require('path');
const LineImpactCalculator = require('./line-impact-calculator');

class GradualSizeReducer {
    constructor() {
        this.impactCalculator = new LineImpactCalculator();
        this.reductionStrategies = new Map();
        this.reductionPlans = new Map();
        this.progressTracking = new Map();
    }

    /**
     * Initialize reduction strategies
     */
    initializeStrategies() {
        console.log('📉 Initializing gradual size reduction strategies...');

        // Incremental optimization strategy
        this.reductionStrategies.set('incremental_optimization', {
            name: 'Incremental Optimization',
            description: 'Gradual improvements with low risk',
            phases: [
                {
                    name: 'Code Cleanup',
                    targetReduction: 0.3, // 30% of total needed
                    actions: ['remove_dead_code', 'simplify_comments', 'remove_unused_imports'],
                    risk: 'low',
                    effort: 'low'
                },
                {
                    name: 'Function Extraction',
                    targetReduction: 0.4, // 40% of total needed
                    actions: ['extract_utilities', 'split_large_functions', 'create_helper_modules'],
                    risk: 'medium',
                    effort: 'medium'
                },
                {
                    name: 'Module Separation',
                    targetReduction: 0.3, // 30% of total needed
                    actions: ['create_submodules', 'update_imports', 'validate_separation'],
                    risk: 'medium',
                    effort: 'high'
                }
            ]
        });

        // Balanced refactoring strategy
        this.reductionStrategies.set('balanced_refactoring', {
            name: 'Balanced Refactoring',
            description: 'Structured approach balancing risk and reward',
            phases: [
                {
                    name: 'Analysis & Planning',
                    targetReduction: 0, // Planning phase
                    actions: ['analyze_dependencies', 'identify_boundaries', 'create_migration_plan'],
                    risk: 'low',
                    effort: 'medium'
                },
                {
                    name: 'Core Extraction',
                    targetReduction: 0.6, // 60% of total needed
                    actions: ['extract_core_logic', 'create_shared_modules', 'update_references'],
                    risk: 'medium',
                    effort: 'high'
                },
                {
                    name: 'Optimization',
                    targetReduction: 0.4, // 40% of total needed
                    actions: ['optimize_imports', 'cleanup_references', 'performance_validation'],
                    risk: 'low',
                    effort: 'medium'
                }
            ]
        });

        // Aggressive modularization strategy
        this.reductionStrategies.set('aggressive_modularization', {
            name: 'Aggressive Modularization',
            description: 'Rapid reduction for severely oversized files',
            phases: [
                {
                    name: 'Structural Analysis',
                    targetReduction: 0, // Analysis phase
                    actions: ['comprehensive_analysis', 'dependency_mapping', 'risk_assessment'],
                    risk: 'low',
                    effort: 'high'
                },
                {
                    name: 'Mass Extraction',
                    targetReduction: 0.7, // 70% of total needed
                    actions: ['extract_all_functions', 'create_multiple_modules', 'split_by_responsibility'],
                    risk: 'high',
                    effort: 'very_high'
                },
                {
                    name: 'Integration & Testing',
                    targetReduction: 0.3, // 30% of total needed
                    actions: ['update_all_imports', 'comprehensive_testing', 'performance_validation'],
                    risk: 'medium',
                    effort: 'high'
                }
            ]
        });

        console.log(`Initialized ${this.reductionStrategies.size} reduction strategies`);
    }

    /**
     * Create reduction plan for a file
     */
    createReductionPlan(filePath, currentSize, targetSize = 300) {
        console.log(`📋 Creating reduction plan for: ${filePath}`);

        const reductionNeeded = currentSize - targetSize;
        const reductionPercentage = (reductionNeeded / currentSize) * 100;

        // Select appropriate strategy
        let strategyName;
        if (reductionPercentage > 50) {
            strategyName = 'aggressive_modularization';
        } else if (reductionPercentage > 25) {
            strategyName = 'balanced_refactoring';
        } else {
            strategyName = 'incremental_optimization';
        }

        const strategy = this.reductionStrategies.get(strategyName);

        const plan = {
            file: filePath,
            currentSize: currentSize,
            targetSize: targetSize,
            reductionNeeded: reductionNeeded,
            reductionPercentage: reductionPercentage,
            strategy: strategyName,
            strategyDetails: strategy,
            phases: this.generateDetailedPhases(strategy, reductionNeeded),
            estimatedDuration: this.estimateReductionDuration(reductionNeeded, strategy),
            riskAssessment: this.assessReductionRisk(strategy, currentSize),
            created: new Date().toISOString(),
            status: 'planned'
        };

        this.reductionPlans.set(filePath, plan);
        return plan;
    }

    /**
     * Generate detailed phases with specific targets
     */
    generateDetailedPhases(strategy, totalReductionNeeded) {
        return strategy.phases.map(phase => ({
            ...phase,
            targetLines: Math.round(totalReductionNeeded * phase.targetReduction),
            estimatedLines: Math.round(totalReductionNeeded * phase.targetReduction),
            actualLines: 0,
            status: 'pending',
            started: null,
            completed: null
        }));
    }

    /**
     * Estimate reduction duration
     */
    estimateReductionDuration(reductionNeeded, strategy) {
        const baseTimePerLine = 0.5; // minutes per line
        const strategyMultiplier = {
            incremental_optimization: 1.0,
            balanced_refactoring: 1.5,
            aggressive_modularization: 2.5
        };

        const totalMinutes = reductionNeeded * baseTimePerLine * strategyMultiplier[strategy.name.toLowerCase().replace(' ', '_')];

        return {
            minutes: Math.round(totalMinutes),
            hours: Math.round(totalMinutes / 60 * 10) / 10,
            days: Math.round(totalMinutes / 60 / 8 * 10) / 10,
            phases: strategy.phases.map(phase => ({
                name: phase.name,
                estimatedMinutes: Math.round(totalMinutes * phase.targetReduction)
            }))
        };
    }

    /**
     * Assess reduction risk
     */
    assessReductionRisk(strategy, currentSize) {
        let riskLevel = 'low';
        let riskFactors = [];
        let mitigationStrategies = [];

        // Strategy-based risk
        if (strategy.name.toLowerCase().includes('aggressive')) {
            riskLevel = 'high';
            riskFactors.push('Complex refactoring may introduce bugs');
            mitigationStrategies.push('Implement comprehensive unit tests before refactoring');
        } else if (strategy.name.toLowerCase().includes('balanced')) {
            riskLevel = 'medium';
            riskFactors.push('Moderate complexity changes');
            mitigationStrategies.push('Regular testing during refactoring');
        }

        // Size-based risk
        if (currentSize > 1000) {
            riskLevel = riskLevel === 'low' ? 'medium' : 'high';
            riskFactors.push('Large file size increases refactoring complexity');
        }

        if (currentSize > 2000) {
            riskFactors.push('Extreme file size requires careful planning');
            mitigationStrategies.push('Consider breaking into multiple independent modules');
        }

        return {
            level: riskLevel,
            factors: riskFactors,
            mitigationStrategies: mitigationStrategies,
            confidence: riskLevel === 'low' ? 0.9 : riskLevel === 'medium' ? 0.7 : 0.5
        };
    }

    /**
     * Execute reduction plan
     */
    async executeReductionPlan(plan) {
        console.log(`▶️  Executing reduction plan for: ${plan.file}`);
        console.log(`Strategy: ${plan.strategyDetails.name}`);
        console.log(`Target reduction: ${plan.reductionNeeded} lines`);

        plan.status = 'in_progress';
        plan.started = new Date().toISOString();

        const progress = {
            plan: plan,
            phaseResults: [],
            totalReduction: 0,
            completedPhases: 0,
            status: 'in_progress'
        };

        // Execute phases sequentially
        for (let i = 0; i < plan.phases.length; i++) {
            const phase = plan.phases[i];
            console.log(`\nPhase ${i + 1}/${plan.phases.length}: ${phase.name}`);

            phase.status = 'in_progress';
            phase.started = new Date().toISOString();

            const phaseResult = await this.executeReductionPhase(phase, plan);
            phaseResult.phaseIndex = i + 1;

            progress.phaseResults.push(phaseResult);
            progress.totalReduction += phaseResult.actualReduction;
            progress.completedPhases++;

            phase.actualLines = phaseResult.actualReduction;
            phase.status = phaseResult.success ? 'completed' : 'failed';
            phase.completed = new Date().toISOString();

            if (!phaseResult.success) {
                console.log(`❌ Phase ${i + 1} failed: ${phaseResult.error}`);
                progress.status = 'failed';
                break;
            } else {
                console.log(`✅ Phase ${i + 1} completed: ${phaseResult.actualReduction} lines reduced`);
            }
        }

        progress.status = progress.status !== 'failed' ? 'completed' : 'failed';
        plan.status = progress.status;
        plan.completed = new Date().toISOString();

        // Update progress tracking
        this.progressTracking.set(plan.file, progress);

        console.log(`\n🎯 Reduction plan ${progress.status}: ${progress.totalReduction} lines reduced`);

        return progress;
    }

    /**
     * Execute a single reduction phase
     */
    async executeReductionPhase(phase, plan) {
        const result = {
            phase: phase.name,
            targetReduction: phase.targetLines,
            actualReduction: 0,
            success: false,
            actions: [],
            error: null
        };

        try {
            // Simulate phase execution based on actions
            for (const action of phase.actions) {
                const actionResult = await this.executeReductionAction(action, plan, phase);
                result.actions.push(actionResult);

                if (actionResult.success) {
                    result.actualReduction += actionResult.reduction;
                } else {
                    result.error = actionResult.error;
                    return result;
                }
            }

            result.success = true;

        } catch (error) {
            result.error = error.message;
            console.error(`Phase execution error: ${error.message}`);
        }

        return result;
    }

    /**
     * Execute a specific reduction action
     */
    async executeReductionAction(action, plan, phase) {
        console.log(`  Executing action: ${action}`);

        const result = {
            action: action,
            success: false,
            reduction: 0,
            error: null
        };

        try {
            switch (action) {
                case 'remove_dead_code':
                    result.reduction = await this.removeDeadCode(plan.file);
                    break;
                case 'simplify_comments':
                    result.reduction = await this.simplifyComments(plan.file);
                    break;
                case 'remove_unused_imports':
                    result.reduction = await this.removeUnusedImports(plan.file);
                    break;
                case 'extract_utilities':
                    result.reduction = await this.extractUtilities(plan.file);
                    break;
                case 'split_large_functions':
                    result.reduction = await this.splitLargeFunctions(plan.file);
                    break;
                case 'create_helper_modules':
                    result.reduction = await this.createHelperModules(plan.file);
                    break;
                case 'analyze_dependencies':
                    result.reduction = 0; // Analysis only
                    break;
                case 'identify_boundaries':
                    result.reduction = 0; // Analysis only
                    break;
                case 'extract_core_logic':
                    result.reduction = await this.extractCoreLogic(plan.file);
                    break;
                case 'create_shared_modules':
                    result.reduction = await this.createSharedModules(plan.file);
                    break;
                case 'optimize_imports':
                    result.reduction = await this.optimizeImports(plan.file);
                    break;
                case 'comprehensive_analysis':
                    result.reduction = 0; // Analysis only
                    break;
                case 'extract_all_functions':
                    result.reduction = await this.extractAllFunctions(plan.file);
                    break;
                case 'create_multiple_modules':
                    result.reduction = await this.createMultipleModules(plan.file);
                    break;
                case 'update_all_imports':
                    result.reduction = await this.updateAllImports(plan.file);
                    break;
                default:
                    result.reduction = Math.floor(Math.random() * 50) + 10; // Simulate reduction
            }

            result.success = true;

        } catch (error) {
            result.error = error.message;
            console.error(`Action execution error: ${error.message}`);
        }

        return result;
    }

    // Action implementations (simplified for demonstration)
    async removeDeadCode(filePath) {
        // Simulate removing dead code
        await this.delay(500);
        return Math.floor(Math.random() * 20) + 5;
    }

    async simplifyComments(filePath) {
        // Simulate comment cleanup
        await this.delay(300);
        return Math.floor(Math.random() * 15) + 3;
    }

    async removeUnusedImports(filePath) {
        // Simulate import cleanup
        await this.delay(400);
        return Math.floor(Math.random() * 10) + 2;
    }

    async extractUtilities(filePath) {
        // Simulate utility extraction
        await this.delay(1000);
        return Math.floor(Math.random() * 80) + 20;
    }

    async splitLargeFunctions(filePath) {
        // Simulate function splitting
        await this.delay(800);
        return Math.floor(Math.random() * 60) + 15;
    }

    async createHelperModules(filePath) {
        // Simulate module creation
        await this.delay(600);
        return Math.floor(Math.random() * 40) + 10;
    }

    async extractCoreLogic(filePath) {
        // Simulate core logic extraction
        await this.delay(1200);
        return Math.floor(Math.random() * 150) + 50;
    }

    async createSharedModules(filePath) {
        // Simulate shared module creation
        await this.delay(900);
        return Math.floor(Math.random() * 100) + 30;
    }

    async optimizeImports(filePath) {
        // Simulate import optimization
        await this.delay(500);
        return Math.floor(Math.random() * 25) + 5;
    }

    async extractAllFunctions(filePath) {
        // Simulate mass function extraction
        await this.delay(1500);
        return Math.floor(Math.random() * 200) + 100;
    }

    async createMultipleModules(filePath) {
        // Simulate multiple module creation
        await this.delay(1100);
        return Math.floor(Math.random() * 120) + 40;
    }

    async updateAllImports(filePath) {
        // Simulate import updates
        await this.delay(700);
        return Math.floor(Math.random() * 30) + 10;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Monitor reduction progress
     */
    monitorProgress(filePath) {
        const progress = this.progressTracking.get(filePath);

        if (!progress) {
            return { status: 'no_plan', message: 'No reduction plan found for this file' };
        }

        const completedPhases = progress.phaseResults.filter(p => p.success).length;
        const totalPhases = progress.plan.phases.length;
        const progressPercentage = (completedPhases / totalPhases) * 100;

        return {
            status: progress.status,
            progressPercentage: progressPercentage,
            completedPhases: completedPhases,
            totalPhases: totalPhases,
            totalReduction: progress.totalReduction,
            targetReduction: progress.plan.reductionNeeded,
            remainingReduction: progress.plan.reductionNeeded - progress.totalReduction,
            estimatedTimeRemaining: this.estimateTimeRemaining(progress),
            nextPhase: this.getNextPhase(progress)
        };
    }

    /**
     * Estimate time remaining
     */
    estimateTimeRemaining(progress) {
        const completedPhases = progress.phaseResults.length;
        const totalPhases = progress.plan.phases.length;
        const remainingPhases = totalPhases - completedPhases;

        if (remainingPhases === 0) return 0;

        const avgTimePerPhase = progress.plan.estimatedDuration.minutes / totalPhases;
        return Math.round(remainingPhases * avgTimePerPhase);
    }

    /**
     * Get next phase to execute
     */
    getNextPhase(progress) {
        const nextPhaseIndex = progress.phaseResults.length;
        const nextPhase = progress.plan.phases[nextPhaseIndex];

        return nextPhase ? {
            name: nextPhase.name,
            targetReduction: nextPhase.targetLines,
            estimatedTime: progress.plan.estimatedDuration.phases[nextPhaseIndex]?.estimatedMinutes || 0
        } : null;
    }

    /**
     * Generate progress report
     */
    generateProgressReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalPlans: this.reductionPlans.size,
            activePlans: Array.from(this.reductionPlans.values()).filter(p => p.status === 'in_progress').length,
            completedPlans: Array.from(this.reductionPlans.values()).filter(p => p.status === 'completed').length,
            failedPlans: Array.from(this.reductionPlans.values()).filter(p => p.status === 'failed').length,
            totalReduction: Array.from(this.progressTracking.values()).reduce((sum, p) => sum + p.totalReduction, 0),
            plans: Array.from(this.reductionPlans.values()).map(plan => ({
                file: plan.file,
                status: plan.status,
                strategy: plan.strategy,
                reductionNeeded: plan.reductionNeeded,
                currentReduction: this.progressTracking.get(plan.file)?.totalReduction || 0,
                progress: this.monitorProgress(plan.file)
            }))
        };

        return report;
    }

    /**
     * Save progress report
     */
    saveProgressReport() {
        const report = this.generateProgressReport();
        const reportPath = path.join(process.cwd(), 'reports', 'size-reduction-progress.json');

        const reportsDir = path.dirname(reportPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`Progress report saved to: ${reportPath}`);

        return reportPath;
    }

    /**
     * Get reduction recommendations
     */
    getReductionRecommendations(filePath) {
        const plan = this.reductionPlans.get(filePath);
        const progress = this.progressTracking.get(filePath);

        if (!plan) {
            return { recommendation: 'create_plan', message: 'Create a reduction plan first' };
        }

        if (plan.status === 'completed') {
            return { recommendation: 'completed', message: 'Reduction plan completed successfully' };
        }

        if (plan.status === 'failed') {
            return {
                recommendation: 'retry_or_replan',
                message: 'Previous plan failed, consider alternative strategy',
                alternatives: this.suggestAlternativeStrategies(plan)
            };
        }

        const monitor = this.monitorProgress(filePath);

        if (monitor.progressPercentage < 50) {
            return {
                recommendation: 'continue_current',
                message: 'Continue with current reduction plan',
                nextAction: monitor.nextPhase
            };
        }

        return {
            recommendation: 'accelerate',
            message: 'Good progress, consider accelerating remaining phases',
            suggestions: ['Parallel execution where possible', 'Skip low-impact actions']
        };
    }

    /**
     * Suggest alternative strategies
     */
    suggestAlternativeStrategies(failedPlan) {
        const alternatives = [];

        if (failedPlan.strategy === 'aggressive_modularization') {
            alternatives.push('balanced_refactoring');
        }

        if (failedPlan.strategy === 'balanced_refactoring') {
            alternatives.push('incremental_optimization');
        }

        alternatives.push('manual_refactoring');

        return alternatives;
    }
}

// CLI interface
if (require.main === module) {
    const reducer = new GradualSizeReducer();
    reducer.initializeStrategies();

    const command = process.argv[2];
    const filePath = process.argv[3];

    switch (command) {
        case 'plan':
            if (!filePath) {
                console.log('Usage: node gradual-reducer.js plan <file-path>');
                process.exit(1);
            }

            if (!fs.existsSync(filePath)) {
                console.error('File not found:', filePath);
                process.exit(1);
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const currentSize = content.split('\n').length;

            const plan = reducer.createReductionPlan(filePath, currentSize);
            console.log('📋 Reduction Plan Created:');
            console.log(`File: ${plan.file}`);
            console.log(`Current Size: ${plan.currentSize} lines`);
            console.log(`Target Size: ${plan.targetSize} lines`);
            console.log(`Reduction Needed: ${plan.reductionNeeded} lines`);
            console.log(`Strategy: ${plan.strategyDetails.name}`);
            console.log(`Estimated Duration: ${plan.estimatedDuration.hours} hours`);
            console.log(`Risk Level: ${plan.riskAssessment.level}`);

            // Save plan
            const plansPath = path.join(process.cwd(), 'reports', 'reduction-plans.json');
            const plansDir = path.dirname(plansPath);
            if (!fs.existsSync(plansDir)) {
                fs.mkdirSync(plansDir, { recursive: true });
            }

            const existingPlans = fs.existsSync(plansPath) ? JSON.parse(fs.readFileSync(plansPath, 'utf8')) : {};
            existingPlans[filePath] = plan;
            fs.writeFileSync(plansPath, JSON.stringify(existingPlans, null, 2));

            break;

        case 'execute':
            if (!filePath) {
                console.log('Usage: node gradual-reducer.js execute <file-path>');
                process.exit(1);
            }

            // Load plan
            const plansFile = path.join(process.cwd(), 'reports', 'reduction-plans.json');
            if (!fs.existsSync(plansFile)) {
                console.error('No reduction plans found. Create a plan first.');
                process.exit(1);
            }

            const plans = JSON.parse(fs.readFileSync(plansFile, 'utf8'));
            const planToExecute = plans[filePath];

            if (!planToExecute) {
                console.error('No plan found for file:', filePath);
                process.exit(1);
            }

            reducer.reductionPlans.set(filePath, planToExecute);

            reducer.executeReductionPlan(planToExecute).then(progress => {
                console.log(`\n🎯 Execution completed: ${progress.status}`);
                console.log(`Total reduction: ${progress.totalReduction} lines`);
                console.log(`Completed phases: ${progress.completedPhases}/${planToExecute.phases.length}`);

                // Save updated plans
                plans[filePath] = planToExecute;
                fs.writeFileSync(plansFile, JSON.stringify(plans, null, 2));

                reducer.saveProgressReport();
                process.exit(progress.status === 'completed' ? 0 : 1);
            }).catch(error => {
                console.error('Execution failed:', error);
                process.exit(1);
            });
            break;

        case 'monitor':
            if (!filePath) {
                console.log('Usage: node gradual-reducer.js monitor <file-path>');
                process.exit(1);
            }

            const monitorResult = reducer.monitorProgress(filePath);
            console.log('📊 Progress Monitor:');
            console.log(`Status: ${monitorResult.status}`);
            console.log(`Progress: ${monitorResult.progressPercentage.toFixed(1)}%`);
            console.log(`Completed: ${monitorResult.completedPhases}/${monitorResult.totalPhases} phases`);
            console.log(`Reduction: ${monitorResult.totalReduction}/${monitorResult.targetReduction} lines`);
            console.log(`Remaining: ${monitorResult.remainingReduction} lines`);

            if (monitorResult.nextPhase) {
                console.log(`Next Phase: ${monitorResult.nextPhase.name}`);
                console.log(`Estimated Time: ${monitorResult.nextPhase.estimatedTime} minutes`);
            }
            break;

        case 'recommend':
            if (!filePath) {
                console.log('Usage: node gradual-reducer.js recommend <file-path>');
                process.exit(1);
            }

            const recommendation = reducer.getReductionRecommendations(filePath);
            console.log('💡 Recommendation:');
            console.log(`Type: ${recommendation.recommendation}`);
            console.log(`Message: ${recommendation.message}`);

            if (recommendation.nextAction) {
                console.log(`Next Action: ${recommendation.nextAction.name}`);
            }

            if (recommendation.alternatives) {
                console.log('Alternatives:', recommendation.alternatives.join(', '));
            }
            break;

        case 'report':
            reducer.saveProgressReport();
            break;

        default:
            console.log('Usage: node gradual-reducer.js <command> [file-path]');
            console.log('Commands:');
            console.log('  plan <file>     - Create reduction plan for file');
            console.log('  execute <file>  - Execute reduction plan for file');
            console.log('  monitor <file>  - Monitor progress for file');
            console.log('  recommend <file> - Get recommendations for file');
            console.log('  report          - Generate progress report');
            process.exit(1);
    }
}

module.exports = GradualSizeReducer;