#!/usr/bin/env node

/**
 * Multi-Modal Reinforcement Learning System for AI Agent Instructions
 * Implements outcome supervision, process supervision, and consistency mechanisms
 */

const fs = require('fs');
const path = require('path');

class MultiModalReinforcementLearner {
    constructor() {
        this.rewardSystems = {
            outcomeSupervision: new OutcomeSupervisionRewards(),
            processSupervision: new ProcessSupervisionRewards(),
            consistencySupervision: new ConsistencySupervisionRewards(),
            noveltyPenalty: new NoveltyPenaltySystem()
        };

        this.learningMetrics = {
            totalEpisodes: 0,
            averageReward: 0,
            policyUpdates: 0,
            convergenceRate: 0
        };

        this.trainingHistory = [];
        this.currentPolicy = this.initializePolicy();
    }

    /**
     * Initialize the base policy for instruction following
     */
    initializePolicy() {
        return {
            // Outcome-based actions (what to achieve)
            outcomeActions: {
                'file_size_compliance': { weight: 1.0, successRate: 0 },
                'test_pass_rate': { weight: 1.0, successRate: 0 },
                'code_quality': { weight: 0.8, successRate: 0 },
                'commit_conventions': { weight: 0.6, successRate: 0 }
            },

            // Process-based actions (how to achieve)
            processActions: {
                'validate_before_action': { weight: 1.2, successRate: 0 },
                'checklist_completion': { weight: 1.1, successRate: 0 },
                'error_handling': { weight: 1.0, successRate: 0 },
                'iterative_improvement': { weight: 0.9, successRate: 0 }
            },

            // Consistency patterns
            consistencyPatterns: {
                'similar_context_same_action': { weight: 1.0, violations: 0 },
                'process_step_completion': { weight: 1.0, violations: 0 },
                'validation_consistency': { weight: 0.8, violations: 0 }
            }
        };
    }

    /**
     * Process an episode of instruction following
     */
    async processEpisode(context, actions, outcomes) {
        this.learningMetrics.totalEpisodes++;

        const episode = {
            episodeId: this.learningMetrics.totalEpisodes,
            context: context,
            actions: actions,
            outcomes: outcomes,
            timestamp: new Date().toISOString()
        };

        // Calculate rewards from all modalities
        const rewards = {
            outcomeReward: this.rewardSystems.outcomeSupervision.calculateReward(outcomes),
            processReward: this.rewardSystems.processSupervision.calculateReward(actions, context),
            consistencyReward: this.rewardSystems.consistencySupervision.calculateReward(context, actions),
            noveltyPenalty: this.rewardSystems.noveltyPenalty.calculatePenalty(context, actions)
        };

        episode.rewards = rewards;
        episode.totalReward = rewards.outcomeReward + rewards.processReward + rewards.consistencyReward - rewards.noveltyPenalty;

        // Update policy based on rewards
        this.updatePolicy(episode);

        // Store episode for analysis
        this.trainingHistory.push(episode);

        // Update learning metrics
        this.updateLearningMetrics(episode);

        return episode;
    }

    /**
     * Update policy weights based on episode rewards
     */
    updatePolicy(episode) {
        const learningRate = 0.01;
        const discountFactor = 0.95;

        // Update outcome action weights
        episode.actions.outcomeActions?.forEach(action => {
            if (this.currentPolicy.outcomeActions[action]) {
                const reward = episode.rewards.outcomeReward;
                const currentWeight = this.currentPolicy.outcomeActions[action].weight;
                const newWeight = currentWeight + learningRate * reward * discountFactor;

                this.currentPolicy.outcomeActions[action].weight = Math.max(0.1, Math.min(2.0, newWeight));
                this.currentPolicy.outcomeActions[action].successRate =
                    (this.currentPolicy.outcomeActions[action].successRate + (reward > 0 ? 1 : 0)) / 2;
            }
        });

        // Update process action weights
        episode.actions.processActions?.forEach(action => {
            if (this.currentPolicy.processActions[action]) {
                const reward = episode.rewards.processReward;
                const currentWeight = this.currentPolicy.processActions[action].weight;
                const newWeight = currentWeight + learningRate * reward * discountFactor;

                this.currentPolicy.processActions[action].weight = Math.max(0.1, Math.min(2.0, newWeight));
                this.currentPolicy.processActions[action].successRate =
                    (this.currentPolicy.processActions[action].successRate + (reward > 0 ? 1 : 0)) / 2;
            }
        });

        this.learningMetrics.policyUpdates++;
    }

    /**
     * Update learning metrics
     */
    updateLearningMetrics(episode) {
        const alpha = 0.1; // Smoothing factor
        this.learningMetrics.averageReward =
            (1 - alpha) * this.learningMetrics.averageReward + alpha * episode.totalReward;

        // Calculate convergence rate (stability of policy updates)
        if (this.trainingHistory.length > 10) {
            const recentEpisodes = this.trainingHistory.slice(-10);
            const recentRewards = recentEpisodes.map(e => e.totalReward);
            const variance = this.calculateVariance(recentRewards);
            this.learningMetrics.convergenceRate = Math.max(0, 1 - variance / 10); // Lower variance = higher convergence
        }
    }

    /**
     * Calculate variance of an array
     */
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }

    /**
     * Get recommended actions for a given context
     */
    getRecommendedActions(context) {
        const recommendations = {
            outcomeActions: this.rankActions(this.currentPolicy.outcomeActions, context),
            processActions: this.rankActions(this.currentPolicy.processActions, context),
            confidence: this.calculateConfidence(context)
        };

        return recommendations;
    }

    /**
     * Rank actions by their policy weights and context relevance
     */
    rankActions(actionSet, context) {
        const scoredActions = Object.entries(actionSet).map(([action, data]) => {
            let score = data.weight;

            // Context-specific adjustments
            if (context.violations) {
                const violationTypes = context.violations.map(v => v.type);
                if (violationTypes.includes('file_size') && action.includes('file_size')) score *= 1.5;
                if (violationTypes.includes('test_failure') && action.includes('test')) score *= 1.5;
                if (violationTypes.includes('lint_errors') && action.includes('quality')) score *= 1.5;
            }

            return { action, score, weight: data.weight, successRate: data.successRate };
        });

        return scoredActions.sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate confidence in recommendations
     */
    calculateConfidence(context) {
        const policyStability = this.learningMetrics.convergenceRate;
        const trainingData = this.trainingHistory.length;
        const contextFamiliarity = this.calculateContextFamiliarity(context);

        // Confidence based on multiple factors
        const confidence = (policyStability * 0.4) +
                          (Math.min(trainingData / 100, 1) * 0.3) +
                          (contextFamiliarity * 0.3);

        return Math.min(1.0, confidence);
    }

    /**
     * Calculate how familiar the system is with this context
     */
    calculateContextFamiliarity(context) {
        if (this.trainingHistory.length === 0) return 0;

        let familiarity = 0;
        const recentEpisodes = this.trainingHistory.slice(-20); // Last 20 episodes

        for (const episode of recentEpisodes) {
            const contextSimilarity = this.calculateContextSimilarity(context, episode.context);
            familiarity = Math.max(familiarity, contextSimilarity);
        }

        return familiarity;
    }

    /**
     * Calculate similarity between two contexts
     */
    calculateContextSimilarity(context1, context2) {
        if (!context1.violations || !context2.violations) return 0;

        const types1 = new Set(context1.violations.map(v => v.type));
        const types2 = new Set(context2.violations.map(v => v.type));

        const intersection = new Set([...types1].filter(x => types2.has(x)));
        const union = new Set([...types1, ...types2]);

        return intersection.size / union.size; // Jaccard similarity
    }

    /**
     * Run training episodes to improve the policy
     */
    async runTrainingEpisodes(numEpisodes = 50) {
        console.log(`🎓 Starting multi-modal reinforcement learning training (${numEpisodes} episodes)...`);

        const trainingScenarios = this.generateTrainingScenarios();

        for (let i = 0; i < numEpisodes; i++) {
            const scenario = trainingScenarios[i % trainingScenarios.length];

            // Simulate actions and outcomes
            const actions = this.generateActionsForScenario(scenario);
            const outcomes = this.simulateOutcomes(scenario, actions);

            const episode = await this.processEpisode(scenario.context, actions, outcomes);

            if ((i + 1) % 10 === 0) {
                console.log(`Episode ${i + 1}/${numEpisodes}: Reward = ${episode.totalReward.toFixed(3)}, Avg Reward = ${this.learningMetrics.averageReward.toFixed(3)}`);
            }
        }

        console.log('\n📊 Training Complete!');
        console.log(`Total Episodes: ${this.learningMetrics.totalEpisodes}`);
        console.log(`Average Reward: ${this.learningMetrics.averageReward.toFixed(3)}`);
        console.log(`Policy Updates: ${this.learningMetrics.policyUpdates}`);
        console.log(`Convergence Rate: ${(this.learningMetrics.convergenceRate * 100).toFixed(1)}%`);

        this.saveTrainingResults();
    }

    /**
     * Generate diverse training scenarios
     */
    generateTrainingScenarios() {
        return [
            {
                context: { violations: [{ type: 'file_size', lines: 350 }] },
                expectedOutcome: 'componentize_file'
            },
            {
                context: { violations: [{ type: 'test_failure', error: 'api_error' }] },
                expectedOutcome: 'fix_server_error'
            },
            {
                context: { violations: [{ type: 'lint_errors', count: 5 }] },
                expectedOutcome: 'fix_code_quality'
            },
            {
                context: { violations: [{ type: 'file_size', lines: 320 }, { type: 'lint_errors', count: 2 }] },
                expectedOutcome: 'multi_fix_approach'
            },
            {
                context: { violations: [] },
                expectedOutcome: 'maintain_compliance'
            }
        ];
    }

    /**
     * Generate actions for a training scenario
     */
    generateActionsForScenario(scenario) {
        const actions = {
            outcomeActions: [],
            processActions: []
        };

        // Select actions based on current policy
        const recommendations = this.getRecommendedActions(scenario.context);

        // Sample from top recommendations with some exploration
        const explorationRate = 0.1;

        if (Math.random() > explorationRate) {
            // Exploit: use top recommendations
            actions.outcomeActions = recommendations.outcomeActions.slice(0, 2).map(a => a.action);
            actions.processActions = recommendations.processActions.slice(0, 2).map(a => a.action);
        } else {
            // Explore: random actions
            const allOutcomeActions = Object.keys(this.currentPolicy.outcomeActions);
            const allProcessActions = Object.keys(this.currentPolicy.processActions);

            actions.outcomeActions = this.sampleRandom(allOutcomeActions, 2);
            actions.processActions = this.sampleRandom(allProcessActions, 2);
        }

        return actions;
    }

    /**
     * Sample random items from array
     */
    sampleRandom(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Simulate outcomes for training
     */
    simulateOutcomes(scenario, actions) {
        const outcomes = {
            success: false,
            quality: 0,
            efficiency: 0,
            adherence: 0
        };

        // Simulate success based on action quality and scenario difficulty
        const actionQuality = this.evaluateActionQuality(actions, scenario);
        const scenarioDifficulty = this.evaluateScenarioDifficulty(scenario);

        const successProbability = Math.max(0.1, actionQuality / scenarioDifficulty);
        outcomes.success = Math.random() < successProbability;

        outcomes.quality = outcomes.success ? Math.random() * 0.5 + 0.5 : Math.random() * 0.5;
        outcomes.efficiency = outcomes.success ? Math.random() * 0.5 + 0.5 : Math.random() * 0.5;
        outcomes.adherence = actionQuality;

        return outcomes;
    }

    /**
     * Evaluate quality of selected actions
     */
    evaluateActionQuality(actions, scenario) {
        let quality = 0;

        // Check if actions are relevant to the scenario
        const relevantOutcomeActions = this.getRelevantActions(scenario, 'outcome');
        const relevantProcessActions = this.getRelevantActions(scenario, 'process');

        actions.outcomeActions.forEach(action => {
            if (relevantOutcomeActions.includes(action)) quality += 0.3;
        });

        actions.processActions.forEach(action => {
            if (relevantProcessActions.includes(action)) quality += 0.2;
        });

        return Math.min(1.0, quality);
    }

    /**
     * Get actions relevant to a scenario
     */
    getRelevantActions(scenario, actionType) {
        const violationTypes = scenario.context.violations?.map(v => v.type) || [];

        if (actionType === 'outcome') {
            const relevant = [];
            if (violationTypes.includes('file_size')) relevant.push('file_size_compliance');
            if (violationTypes.includes('test_failure')) relevant.push('test_pass_rate');
            if (violationTypes.includes('lint_errors')) relevant.push('code_quality');
            if (violationTypes.includes('commit_convention')) relevant.push('commit_conventions');
            return relevant;
        } else {
            // Process actions are generally applicable
            return ['validate_before_action', 'checklist_completion', 'error_handling', 'iterative_improvement'];
        }
    }

    /**
     * Evaluate scenario difficulty
     */
    evaluateScenarioDifficulty(scenario) {
        const violationCount = scenario.context.violations?.length || 0;
        const hasMultipleTypes = new Set(scenario.context.violations?.map(v => v.type) || []).size > 1;

        let difficulty = 1.0;
        difficulty += violationCount * 0.2; // More violations = harder
        if (hasMultipleTypes) difficulty += 0.3; // Multiple types = harder

        return difficulty;
    }

    /**
     * Save training results
     */
    saveTrainingResults() {
        const resultsPath = path.join(__dirname, 'reinforcement-training-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            metrics: this.learningMetrics,
            finalPolicy: this.currentPolicy,
            trainingHistory: this.trainingHistory.slice(-50) // Last 50 episodes
        }, null, 2));
    }

    /**
     * Integrate human feedback into the learning process
     */
    async incorporateHumanFeedback(feedback) {
        console.log('👥 Incorporating human feedback into reinforcement learning...');

        const feedbackEpisode = {
            episodeId: `feedback_${Date.now()}`,
            context: feedback.context,
            actions: feedback.actions,
            outcomes: feedback.outcomes,
            humanRating: feedback.rating, // 1-5 scale
            humanComments: feedback.comments,
            timestamp: new Date().toISOString()
        };

        // Adjust rewards based on human feedback
        const humanReward = (feedback.rating - 3) * 0.5; // Convert 1-5 scale to reward

        feedbackEpisode.rewards = {
            outcomeReward: humanReward,
            processReward: humanReward * 0.8,
            consistencyReward: humanReward * 0.6,
            noveltyPenalty: 0
        };

        feedbackEpisode.totalReward = humanReward;

        // Update policy with human feedback
        this.updatePolicy(feedbackEpisode);
        this.trainingHistory.push(feedbackEpisode);

        console.log(`Human feedback incorporated: Rating ${feedback.rating}/5, Reward ${humanReward.toFixed(3)}`);

        return feedbackEpisode;
    }
}

/**
 * Outcome Supervision Reward System
 */
class OutcomeSupervisionRewards {
    calculateReward(outcomes) {
        let reward = 0;

        if (outcomes.success) reward += 1.0;
        reward += outcomes.quality * 0.5;
        reward += outcomes.efficiency * 0.3;
        reward += outcomes.adherence * 0.4;

        return Math.max(-1.0, Math.min(2.0, reward));
    }
}

/**
 * Process Supervision Reward System
 */
class ProcessSupervisionRewards {
    calculateReward(actions, context) {
        let reward = 0;

        // Reward process-oriented actions
        if (actions.processActions?.includes('validate_before_action')) reward += 0.3;
        if (actions.processActions?.includes('checklist_completion')) reward += 0.3;
        if (actions.processActions?.includes('error_handling')) reward += 0.2;
        if (actions.processActions?.includes('iterative_improvement')) reward += 0.2;

        // Penalize missing process steps
        const expectedProcessSteps = ['validate_before_action', 'error_handling'];
        const missingSteps = expectedProcessSteps.filter(step => !actions.processActions?.includes(step));
        reward -= missingSteps.length * 0.1;

        return Math.max(-0.5, Math.min(1.0, reward));
    }
}

/**
 * Consistency Supervision Reward System
 */
class ConsistencySupervisionRewards {
    constructor() {
        this.pastDecisions = new Map();
    }

    calculateReward(context, actions) {
        let reward = 0;

        // Reward consistent decisions for similar contexts
        const contextKey = this.getContextKey(context);
        const pastDecision = this.pastDecisions.get(contextKey);

        if (pastDecision) {
            const consistency = this.calculateActionConsistency(actions, pastDecision);
            reward += consistency * 0.4;
        }

        // Store decision for future consistency checks
        this.pastDecisions.set(contextKey, actions);

        // Limit stored decisions to prevent memory bloat
        if (this.pastDecisions.size > 1000) {
            const oldestKey = this.pastDecisions.keys().next().value;
            this.pastDecisions.delete(oldestKey);
        }

        return Math.max(-0.3, Math.min(0.8, reward));
    }

    getContextKey(context) {
        const violationTypes = context.violations?.map(v => v.type).sort().join(',') || 'no_violations';
        return violationTypes;
    }

    calculateActionConsistency(actions1, actions2) {
        const actions1Set = new Set([...(actions1.outcomeActions || []), ...(actions1.processActions || [])]);
        const actions2Set = new Set([...(actions2.outcomeActions || []), ...(actions2.processActions || [])]);

        const intersection = new Set([...actions1Set].filter(x => actions2Set.has(x)));
        const union = new Set([...actions1Set, ...actions2Set]);

        return intersection.size / union.size; // Jaccard similarity
    }
}

/**
 * Novelty Penalty System
 */
class NoveltyPenaltySystem {
    constructor() {
        this.actionFrequency = new Map();
        this.contextActionPairs = new Map();
    }

    calculatePenalty(context, actions) {
        let penalty = 0;

        // Penalize over-used actions
        const allActions = [...(actions.outcomeActions || []), ...(actions.processActions || [])];

        allActions.forEach(action => {
            const frequency = this.actionFrequency.get(action) || 0;
            this.actionFrequency.set(action, frequency + 1);

            // Penalty increases with frequency (diminishing returns)
            penalty += Math.min(0.2, frequency * 0.02);
        });

        // Penalize repetitive context-action pairs
        const contextKey = this.getContextKey(context);
        const actionKey = allActions.sort().join(',');
        const pairKey = `${contextKey}:${actionKey}`;

        const pairFrequency = this.contextActionPairs.get(pairKey) || 0;
        this.contextActionPairs.set(pairKey, pairFrequency + 1);

        penalty += Math.min(0.3, pairFrequency * 0.05);

        return Math.min(0.5, penalty); // Cap penalty
    }

    getContextKey(context) {
        return context.violations?.map(v => v.type).sort().join(',') || 'no_violations';
    }
}

// CLI interface
if (require.main === module) {
    const learner = new MultiModalReinforcementLearner();

    // Run training
    learner.runTrainingEpisodes(100).then(() => {
        console.log('\n🎯 Testing learned policy...');

        // Test on a sample context
        const testContext = { violations: [{ type: 'file_size', lines: 350 }] };
        const recommendations = learner.getRecommendedActions(testContext);

        console.log('Test Context:', JSON.stringify(testContext, null, 2));
        console.log('Recommended Outcome Actions:');
        recommendations.outcomeActions.slice(0, 3).forEach((action, i) => {
            console.log(`  ${i + 1}. ${action.action} (weight: ${action.weight.toFixed(3)}, success: ${(action.successRate * 100).toFixed(1)}%)`);
        });

        console.log('Recommended Process Actions:');
        recommendations.processActions.slice(0, 3).forEach((action, i) => {
            console.log(`  ${i + 1}. ${action.action} (weight: ${action.weight.toFixed(3)}, success: ${(action.successRate * 100).toFixed(1)}%)`);
        });

        console.log(`Confidence: ${(recommendations.confidence * 100).toFixed(1)}%`);

    }).catch(error => {
        console.error('Training failed:', error);
        process.exit(1);
    });
}

module.exports = MultiModalReinforcementLearner;