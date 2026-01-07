#!/usr/bin/env node

/**
 * NEFTune-Style Noise Injection System for AI Agent Instructions
 * Implements noise injection techniques to improve robustness and edge case handling
 */

const fs = require('fs');
const path = require('path');

class NEFTuneNoiseInjector {
    constructor() {
        this.noiseConfig = {
            embeddingNoise: {
                mean: 0.0,
                std: 0.01,
                probability: 0.1
            },
            instructionNoise: {
                swapProbability: 0.05,
                dropProbability: 0.02,
                addProbability: 0.03
            },
            contextNoise: {
                shuffleProbability: 0.1,
                maskProbability: 0.05
            }
        };

        this.performanceMetrics = {
            baselineAccuracy: 0,
            noiseAccuracy: 0,
            robustnessScore: 0,
            edgeCaseImprovement: 0
        };

        this.experiments = [];
    }

    /**
     * Apply Gaussian noise to instruction embeddings
     * NEFTune-style noise injection for improved robustness
     */
    applyEmbeddingNoise(embedding, config = this.noiseConfig.embeddingNoise) {
        if (Math.random() > config.probability) {
            return embedding; // No noise applied
        }

        const noisyEmbedding = [...embedding];

        for (let i = 0; i < noisyEmbedding.length; i++) {
            // Add Gaussian noise: N(mean, std^2)
            const noise = this.generateGaussianNoise(config.mean, config.std);
            noisyEmbedding[i] += noise;

            // Clamp to reasonable range (assuming embeddings are normalized)
            noisyEmbedding[i] = Math.max(-1, Math.min(1, noisyEmbedding[i]));
        }

        return noisyEmbedding;
    }

    /**
     * Apply instruction-level noise (swap, drop, add operations)
     */
    applyInstructionNoise(instruction, config = this.noiseConfig.instructionNoise) {
        let noisyInstruction = { ...instruction };

        // Swap operation: randomly swap two steps
        if (Math.random() < config.swapProbability && instruction.steps && instruction.steps.length > 1) {
            const steps = [...instruction.steps];
            const idx1 = Math.floor(Math.random() * steps.length);
            let idx2 = Math.floor(Math.random() * steps.length);
            while (idx2 === idx1) idx2 = Math.floor(Math.random() * steps.length);

            [steps[idx1], steps[idx2]] = [steps[idx2], steps[idx1]];
            noisyInstruction.steps = steps;
        }

        // Drop operation: randomly remove a step
        if (Math.random() < config.dropProbability && instruction.steps && instruction.steps.length > 1) {
            const steps = [...instruction.steps];
            const dropIndex = Math.floor(Math.random() * steps.length);
            steps.splice(dropIndex, 1);
            noisyInstruction.steps = steps;
        }

        // Add operation: randomly duplicate a step
        if (Math.random() < config.addProbability && instruction.steps && instruction.steps.length > 0) {
            const steps = [...instruction.steps];
            const addIndex = Math.floor(Math.random() * steps.length);
            steps.splice(addIndex, 0, steps[addIndex]); // Duplicate
            noisyInstruction.steps = steps;
        }

        return noisyInstruction;
    }

    /**
     * Apply context noise (shuffle, mask operations)
     */
    applyContextNoise(context, config = this.noiseConfig.contextNoise) {
        let noisyContext = { ...context };

        // Shuffle context keys
        if (Math.random() < config.shuffleProbability && context.violations) {
            const violations = [...context.violations];
            this.shuffleArray(violations);
            noisyContext.violations = violations;
        }

        // Mask random context elements
        if (Math.random() < config.maskProbability) {
            const keys = Object.keys(noisyContext);
            if (keys.length > 0) {
                const maskKey = keys[Math.floor(Math.random() * keys.length)];
                delete noisyContext[maskKey];
            }
        }

        return noisyContext;
    }

    /**
     * Generate Gaussian noise using Box-Muller transform
     */
    generateGaussianNoise(mean = 0, std = 1) {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();

        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        return z0 * std + mean;
    }

    /**
     * Shuffle array in place using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Test noise injection parameters for optimal robustness
     */
    async testNoiseParameters(testCases = 100) {
        console.log('🧪 Testing NEFTune noise injection parameters...');

        const parameterSets = [
            { embeddingNoise: { mean: 0.0, std: 0.005, probability: 0.05 } },
            { embeddingNoise: { mean: 0.0, std: 0.01, probability: 0.1 } },
            { embeddingNoise: { mean: 0.0, std: 0.02, probability: 0.15 } },
            { embeddingNoise: { mean: 0.0, std: 0.01, probability: 0.2 } }
        ];

        const results = [];

        for (const params of parameterSets) {
            console.log(`Testing parameters: ${JSON.stringify(params)}`);

            const experiment = {
                parameters: params,
                testCases: testCases,
                robustnessScore: 0,
                edgeCasePerformance: 0,
                results: []
            };

            // Test on various scenarios
            const scenarios = this.generateTestScenarios();

            for (const scenario of scenarios) {
                const baselineResult = this.processScenario(scenario, false);
                const noisyResult = this.processScenario(scenario, true, params);

                const robustness = this.calculateRobustness(baselineResult, noisyResult);
                experiment.results.push({ scenario, baselineResult, noisyResult, robustness });
            }

            experiment.robustnessScore = experiment.results.reduce((sum, r) => sum + r.robustness, 0) / experiment.results.length;
            experiment.edgeCasePerformance = this.evaluateEdgeCases(experiment.results);

            results.push(experiment);
            console.log(`  Robustness Score: ${(experiment.robustnessScore * 100).toFixed(1)}%`);
            console.log(`  Edge Case Performance: ${(experiment.edgeCasePerformance * 100).toFixed(1)}%`);
        }

        // Find optimal parameters
        const optimal = results.reduce((best, current) =>
            current.robustnessScore > best.robustnessScore ? current : best
        );

        console.log('\n🎯 Optimal Parameters Found:');
        console.log(`  ${JSON.stringify(optimal.parameters, null, 2)}`);
        console.log(`  Robustness Score: ${(optimal.robustnessScore * 100).toFixed(1)}%`);
        console.log(`  Edge Case Performance: ${(optimal.edgeCasePerformance * 100).toFixed(1)}%`);

        this.experiments.push(...results);
        this.saveExperimentResults(results);

        return optimal.parameters;
    }

    /**
     * Generate test scenarios for noise injection testing
     */
    generateTestScenarios() {
        return [
            {
                name: 'file_size_violation',
                context: { violations: [{ type: 'file_size', file: 'large.js', lines: 500 }] },
                instruction: { steps: ['check file size', 'componentize if needed', 'validate result'] }
            },
            {
                name: 'test_failure',
                context: { violations: [{ type: 'test_failure', error: 'server crash' }] },
                instruction: { steps: ['run tests', 'fix errors', 'validate fixes'] }
            },
            {
                name: 'mixed_violations',
                context: {
                    violations: [
                        { type: 'file_size', file: 'big.html', lines: 400 },
                        { type: 'lint_errors', count: 3 },
                        { type: 'commit_convention', commit: 'bad commit' }
                    ]
                },
                instruction: { steps: ['analyze violations', 'prioritize fixes', 'implement solutions'] }
            },
            {
                name: 'edge_case_empty',
                context: { violations: [] },
                instruction: { steps: ['check compliance', 'report status'] }
            },
            {
                name: 'edge_case_corrupted',
                context: { violations: null, invalidField: 'corrupted' },
                instruction: { steps: ['handle errors', 'recover gracefully'] }
            }
        ];
    }

    /**
     * Process a scenario with or without noise injection
     */
    processScenario(scenario, applyNoise = false, noiseParams = null) {
        let result = {
            contextProcessed: false,
            instructionProcessed: false,
            recommendationsGenerated: false,
            errors: []
        };

        try {
            // Apply noise if requested
            let processedContext = scenario.context;
            let processedInstruction = scenario.instruction;

            if (applyNoise && noiseParams) {
                processedContext = this.applyContextNoise(scenario.context, noiseParams.contextNoise);
                processedInstruction = this.applyInstructionNoise(scenario.instruction, noiseParams.instructionNoise);
            }

            // Simulate processing
            result.contextProcessed = Object.keys(processedContext).length > 0;
            result.instructionProcessed = processedInstruction.steps && processedInstruction.steps.length > 0;
            result.recommendationsGenerated = result.contextProcessed && result.instructionProcessed;

        } catch (error) {
            result.errors.push(error.message);
        }

        return result;
    }

    /**
     * Calculate robustness score between baseline and noisy results
     */
    calculateRobustness(baseline, noisy) {
        if (baseline.errors.length > 0 && noisy.errors.length === 0) return 1.0; // Noise helped
        if (baseline.errors.length === 0 && noisy.errors.length > 0) return 0.0; // Noise hurt

        // Compare processing success rates
        const baselineSuccess = (baseline.contextProcessed ? 1 : 0) +
                               (baseline.instructionProcessed ? 1 : 0) +
                               (baseline.recommendationsGenerated ? 1 : 0);

        const noisySuccess = (noisy.contextProcessed ? 1 : 0) +
                            (noisy.instructionProcessed ? 1 : 0) +
                            (noisy.recommendationsGenerated ? 1 : 0);

        return Math.max(0, Math.min(1, noisySuccess / Math.max(1, baselineSuccess)));
    }

    /**
     * Evaluate performance on edge cases
     */
    evaluateEdgeCases(results) {
        const edgeCases = results.filter(r => r.scenario.name.includes('edge_case'));
        if (edgeCases.length === 0) return 0;

        const edgeRobustness = edgeCases.reduce((sum, r) => sum + r.robustness, 0) / edgeCases.length;
        return edgeRobustness;
    }

    /**
     * Save experiment results to disk
     */
    saveExperimentResults(results) {
        const resultsPath = path.join(__dirname, 'neftune-experiments.json');
        fs.writeFileSync(resultsPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            experiments: results
        }, null, 2));
    }

    /**
     * Validate improved performance on edge cases
     */
    async validateEdgeCaseImprovement() {
        console.log('🔬 Validating edge case improvement with NEFTune noise injection...');

        const edgeCases = [
            'empty context handling',
            'corrupted data recovery',
            'extreme violation counts',
            'missing instruction steps',
            'inconsistent data types'
        ];

        const results = {};

        for (const edgeCase of edgeCases) {
            console.log(`Testing: ${edgeCase}`);

            const baselinePerformance = await this.testEdgeCase(edgeCase, false);
            const noisyPerformance = await this.testEdgeCase(edgeCase, true);

            const improvement = ((noisyPerformance - baselinePerformance) / Math.max(0.01, baselinePerformance)) * 100;

            results[edgeCase] = {
                baseline: baselinePerformance,
                noisy: noisyPerformance,
                improvement: improvement
            };

            console.log(`  Baseline: ${(baselinePerformance * 100).toFixed(1)}%`);
            console.log(`  With Noise: ${(noisyPerformance * 100).toFixed(1)}%`);
            console.log(`  Improvement: ${improvement > 0 ? '+' : ''}${(improvement).toFixed(1)}%`);
        }

        const avgImprovement = Object.values(results).reduce((sum, r) => sum + r.improvement, 0) / Object.values(results).length;

        console.log(`\n📊 Average Edge Case Improvement: ${avgImprovement > 0 ? '+' : ''}${(avgImprovement).toFixed(1)}%`);

        this.performanceMetrics.edgeCaseImprovement = avgImprovement;
        this.saveValidationResults(results);

        return avgImprovement > 0; // Return true if overall improvement
    }

    /**
     * Test a specific edge case scenario
     */
    async testEdgeCase(edgeCase, applyNoise = false) {
        const scenarios = {
            'empty context handling': { violations: [] },
            'corrupted data recovery': { violations: null, corrupted: true },
            'extreme violation counts': { violations: Array(100).fill({ type: 'test' }) },
            'missing instruction steps': { violations: [{ type: 'file_size' }] }, // No steps
            'inconsistent data types': { violations: [{ type: 'file_size', lines: 'invalid' }] }
        };

        const context = scenarios[edgeCase];
        const instruction = { steps: ['process', 'validate', 'complete'] };

        try {
            const result = this.processScenario({ name: edgeCase, context, instruction }, applyNoise);
            return this.calculateProcessingScore(result);
        } catch (error) {
            return 0; // Complete failure
        }
    }

    /**
     * Calculate processing score for validation
     */
    calculateProcessingScore(result) {
        let score = 0;
        if (result.contextProcessed) score += 0.4;
        if (result.instructionProcessed) score += 0.4;
        if (result.recommendationsGenerated) score += 0.2;
        if (result.errors.length === 0) score += 0.1;
        return Math.min(1.0, score);
    }

    /**
     * Save validation results
     */
    saveValidationResults(results) {
        const validationPath = path.join(__dirname, 'neftune-validation.json');
        fs.writeFileSync(validationPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            edgeCaseResults: results,
            overallMetrics: this.performanceMetrics
        }, null, 2));
    }

    /**
     * Run complete NEFTune optimization pipeline
     */
    async runOptimizationPipeline() {
        console.log('🚀 Starting NEFTune-Style Noise Injection Optimization...\n');

        // Step 1: Test noise parameters
        console.log('Step 1: Parameter Optimization');
        const optimalParams = await this.testNoiseParameters();

        // Step 2: Validate edge case improvement
        console.log('\nStep 2: Edge Case Validation');
        const edgeCaseSuccess = await this.validateEdgeCaseImprovement();

        // Step 3: Document configuration
        console.log('\nStep 3: Configuration Documentation');
        this.documentNoiseConfiguration(optimalParams, edgeCaseSuccess);

        console.log('\n✅ NEFTune Optimization Complete!');
        console.log(`Optimal Parameters: ${JSON.stringify(optimalParams, null, 2)}`);
        console.log(`Edge Case Improvement: ${edgeCaseSuccess ? 'SUCCESS' : 'FAILED'}`);

        return {
            optimalParameters: optimalParams,
            edgeCaseSuccess: edgeCaseSuccess,
            experiments: this.experiments.length
        };
    }

    /**
     * Document the optimal noise configuration
     */
    documentNoiseConfiguration(optimalParams, edgeCaseSuccess) {
        const config = {
            neftuneConfig: optimalParams,
            performanceMetrics: this.performanceMetrics,
            edgeCaseValidation: edgeCaseSuccess,
            recommendedSettings: {
                embeddingNoise: optimalParams.embeddingNoise,
                instructionNoise: optimalParams.instructionNoise || this.noiseConfig.instructionNoise,
                contextNoise: optimalParams.contextNoise || this.noiseConfig.contextNoise
            },
            implementationNotes: [
                'Apply noise during instruction processing, not during final output generation',
                'Use lower noise levels for production systems',
                'Monitor performance metrics and adjust parameters based on real-world usage',
                'Consider A/B testing with and without noise injection'
            ]
        };

        const configPath = path.join(__dirname, 'neftune-config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        console.log('📝 Configuration documented in neftune-config.json');
    }
}

// CLI interface
if (require.main === module) {
    const optimizer = new NEFTuneNoiseInjector();
    optimizer.runOptimizationPipeline().then(result => {
        console.log('\n🎯 Optimization Results:');
        console.log(`- Optimal parameters found: ${JSON.stringify(result.optimalParameters, null, 2)}`);
        console.log(`- Edge case validation: ${result.edgeCaseSuccess ? 'PASSED' : 'FAILED'}`);
        console.log(`- Experiments conducted: ${result.experiments}`);
        process.exit(0);
    }).catch(error => {
        console.error('Optimization failed:', error);
        process.exit(1);
    });
}

module.exports = NEFTuneNoiseInjector;