#!/usr/bin/env node

/**
 * Human Feedback Integration System
 * Enables AI agents to learn from human feedback and improve decision-making
 */

const fs = require('fs');
const path = require('path');

class HumanFeedbackIntegration {
    constructor() {
        this.feedbackStore = path.join(process.cwd(), 'data', 'human-feedback.json');
        this.feedbackStats = {
            totalFeedback: 0,
            positiveFeedback: 0,
            negativeFeedback: 0,
            neutralFeedback: 0,
            categories: {},
            patterns: {},
            learningOutcomes: {}
        };
        this.feedbackQueue = [];
        this.learningThreshold = 5; // Minimum feedback items before triggering learning
    }

    /**
     * Initialize the human feedback system
     */
    initialize() {
        this.ensureFeedbackStore();
        this.loadExistingFeedback();
        console.log('🤖 Human Feedback Integration System initialized');
        return this;
    }

    /**
     * Ensure feedback storage exists
     */
    ensureFeedbackStore() {
        const dataDir = path.dirname(this.feedbackStore);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(this.feedbackStore)) {
            this.saveFeedbackData({
                feedback: [],
                stats: this.feedbackStats,
                lastUpdated: new Date().toISOString()
            });
        }
    }

    /**
     * Load existing feedback data
     */
    loadExistingFeedback() {
        try {
            const data = JSON.parse(fs.readFileSync(this.feedbackStore, 'utf8'));
            this.feedbackStats = data.stats || this.feedbackStats;
            this.feedbackQueue = data.feedback || [];
        } catch (error) {
            console.warn('Warning: Could not load existing feedback data:', error.message);
        }
    }

    /**
     * Submit human feedback on an AI decision
     */
    submitFeedback(feedbackData) {
        const feedback = {
            id: this.generateFeedbackId(),
            timestamp: new Date().toISOString(),
            type: feedbackData.type || 'decision',
            category: feedbackData.category || 'general',
            rating: feedbackData.rating || 0, // -1 (negative), 0 (neutral), 1 (positive)
            context: feedbackData.context || {},
            decision: feedbackData.decision || '',
            expectedOutcome: feedbackData.expectedOutcome || '',
            actualOutcome: feedbackData.actualOutcome || '',
            userId: feedbackData.userId || 'anonymous',
            comments: feedbackData.comments || '',
            metadata: feedbackData.metadata || {}
        };

        this.feedbackQueue.push(feedback);
        this.updateStats(feedback);

        // Save immediately after submission
        this.saveFeedbackData();

        console.log(`📝 Feedback submitted: ${feedback.type} (${feedback.rating})`);
        return feedback.id;
    }

    /**
     * Generate unique feedback ID
     */
    generateFeedbackId() {
        return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Update feedback statistics
     */
    updateStats(feedback) {
        this.feedbackStats.totalFeedback++;

        if (feedback.rating === 1) {
            this.feedbackStats.positiveFeedback++;
        } else if (feedback.rating === -1) {
            this.feedbackStats.negativeFeedback++;
        } else {
            this.feedbackStats.neutralFeedback++;
        }

        // Update category stats
        if (!this.feedbackStats.categories[feedback.category]) {
            this.feedbackStats.categories[feedback.category] = {
                total: 0,
                positive: 0,
                negative: 0,
                neutral: 0
            };
        }
        this.feedbackStats.categories[feedback.category].total++;
        if (feedback.rating === 1) {
            this.feedbackStats.categories[feedback.category].positive++;
        } else if (feedback.rating === -1) {
            this.feedbackStats.categories[feedback.category].negative++;
        } else {
            this.feedbackStats.categories[feedback.category].neutral++;
        }

        // Update patterns
        this.updatePatterns(feedback);
    }

    /**
     * Update feedback patterns for learning
     */
    updatePatterns(feedback) {
        const contextKey = this.generateContextKey(feedback.context);

        if (!this.feedbackStats.patterns[contextKey]) {
            this.feedbackStats.patterns[contextKey] = {
                feedback: [],
                averageRating: 0,
                commonOutcomes: {},
                recommendations: []
            };
        }

        const pattern = this.feedbackStats.patterns[contextKey];
        pattern.feedback.push(feedback);

        // Update average rating
        const ratings = pattern.feedback.map(f => f.rating);
        pattern.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

        // Update common outcomes
        if (feedback.expectedOutcome) {
            pattern.commonOutcomes[feedback.expectedOutcome] =
                (pattern.commonOutcomes[feedback.expectedOutcome] || 0) + 1;
        }

        // Generate recommendations based on patterns
        this.generateRecommendations(pattern, contextKey);
    }

    /**
     * Generate context key for pattern matching
     */
    generateContextKey(context) {
        const keyParts = [];
        if (context.action) keyParts.push(`action:${context.action}`);
        if (context.fileType) keyParts.push(`type:${context.fileType}`);
        if (context.complexity) keyParts.push(`complexity:${context.complexity}`);
        if (context.domain) keyParts.push(`domain:${context.domain}`);

        return keyParts.join('|') || 'general';
    }

    /**
     * Generate recommendations based on feedback patterns
     */
    generateRecommendations(pattern, contextKey) {
        const recommendations = [];

        if (pattern.averageRating < -0.3) {
            recommendations.push('Consider alternative approaches for this context');
        } else if (pattern.averageRating > 0.3) {
            recommendations.push('Continue using this approach - positive feedback received');
        }

        // Check for common improvement suggestions
        const negativeFeedback = pattern.feedback.filter(f => f.rating === -1);
        if (negativeFeedback.length > pattern.feedback.length * 0.4) {
            const commonIssues = this.extractCommonIssues(negativeFeedback);
            if (commonIssues.length > 0) {
                recommendations.push(`Address common issues: ${commonIssues.join(', ')}`);
            }
        }

        pattern.recommendations = recommendations;
    }

    /**
     * Extract common issues from negative feedback
     */
    extractCommonIssues(negativeFeedback) {
        const issues = [];
        const comments = negativeFeedback.map(f => f.comments).filter(c => c);

        // Simple keyword analysis
        const keywords = ['slow', 'incorrect', 'confusing', 'incomplete', 'wrong', 'bad'];
        keywords.forEach(keyword => {
            const count = comments.filter(c => c.toLowerCase().includes(keyword)).length;
            if (count > negativeFeedback.length * 0.3) {
                issues.push(keyword);
            }
        });

        return issues;
    }

    /**
     * Get feedback-based recommendations for a context
     */
    getRecommendations(context) {
        const contextKey = this.generateContextKey(context);
        const pattern = this.feedbackStats.patterns[contextKey];

        if (!pattern || pattern.feedback.length < this.learningThreshold) {
            return {
                confidence: 0,
                recommendations: ['Insufficient feedback data for this context'],
                averageRating: 0
            };
        }

        return {
            confidence: Math.min(pattern.feedback.length / 10, 1), // Scale confidence with feedback volume
            recommendations: pattern.recommendations,
            averageRating: pattern.averageRating,
            sampleSize: pattern.feedback.length
        };
    }

    /**
     * Get feedback analytics
     */
    getAnalytics() {
        const analytics = {
            ...this.feedbackStats,
            recentTrends: this.calculateRecentTrends(),
            topIssues: this.identifyTopIssues(),
            learningProgress: this.assessLearningProgress()
        };

        return analytics;
    }

    /**
     * Calculate recent feedback trends
     */
    calculateRecentTrends() {
        const recent = this.feedbackQueue.slice(-50); // Last 50 feedback items
        if (recent.length < 10) return { trend: 'insufficient_data' };

        const recentAvg = recent.reduce((sum, f) => sum + f.rating, 0) / recent.length;
        const older = this.feedbackQueue.slice(-100, -50);
        const olderAvg = older.length > 0 ? older.reduce((sum, f) => sum + f.rating, 0) / older.length : 0;

        const trend = recentAvg - olderAvg;

        return {
            trend: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable',
            recentAverage: recentAvg,
            change: trend,
            sampleSize: recent.length
        };
    }

    /**
     * Identify top issues from feedback
     */
    identifyTopIssues() {
        const issues = {};

        this.feedbackQueue.filter(f => f.rating === -1).forEach(feedback => {
            const category = feedback.category;
            if (!issues[category]) {
                issues[category] = { count: 0, examples: [] };
            }
            issues[category].count++;
            if (issues[category].examples.length < 3) {
                issues[category].examples.push(feedback.comments || 'No details provided');
            }
        });

        return Object.entries(issues)
            .sort(([,a], [,b]) => b.count - a.count)
            .slice(0, 5)
            .map(([category, data]) => ({ category, ...data }));
    }

    /**
     * Assess learning progress
     */
    assessLearningProgress() {
        const totalPatterns = Object.keys(this.feedbackStats.patterns).length;
        const learnedPatterns = Object.values(this.feedbackStats.patterns)
            .filter(p => p.feedback.length >= this.learningThreshold && Math.abs(p.averageRating) > 0.2).length;

        const learningRate = totalPatterns > 0 ? learnedPatterns / totalPatterns : 0;

        return {
            totalPatterns,
            learnedPatterns,
            learningRate,
            assessment: learningRate > 0.7 ? 'excellent' :
                       learningRate > 0.4 ? 'good' :
                       learningRate > 0.2 ? 'developing' : 'early_stage'
        };
    }

    /**
     * Save feedback data to disk
     */
    saveFeedbackData(data = null) {
        const saveData = data || {
            feedback: this.feedbackQueue,
            stats: this.feedbackStats,
            lastUpdated: new Date().toISOString()
        };

        try {
            fs.writeFileSync(this.feedbackStore, JSON.stringify(saveData, null, 2));
        } catch (error) {
            console.error('Error saving feedback data:', error.message);
        }
    }

    /**
     * Export feedback data for analysis
     */
    exportFeedbackData(format = 'json') {
        const exportPath = path.join(process.cwd(), 'reports', `human-feedback-export-${Date.now()}.${format}`);

        if (!fs.existsSync(path.dirname(exportPath))) {
            fs.mkdirSync(path.dirname(exportPath), { recursive: true });
        }

        if (format === 'json') {
            fs.writeFileSync(exportPath, JSON.stringify({
                feedback: this.feedbackQueue,
                analytics: this.getAnalytics(),
                exportedAt: new Date().toISOString()
            }, null, 2));
        } else if (format === 'csv') {
            const csvData = this.convertToCSV();
            fs.writeFileSync(exportPath, csvData);
        }

        console.log(`📊 Feedback data exported to ${exportPath}`);
        return exportPath;
    }

    /**
     * Convert feedback data to CSV format
     */
    convertToCSV() {
        const headers = ['id', 'timestamp', 'type', 'category', 'rating', 'userId', 'comments'];
        const rows = [headers.join(',')];

        this.feedbackQueue.forEach(feedback => {
            const row = [
                feedback.id,
                feedback.timestamp,
                feedback.type,
                feedback.category,
                feedback.rating,
                feedback.userId,
                `"${(feedback.comments || '').replace(/"/g, '""')}"` // Escape quotes
            ];
            rows.push(row.join(','));
        });

        return rows.join('\n');
    }

    /**
     * Reset feedback data (for testing)
     */
    reset() {
        this.feedbackQueue = [];
        this.feedbackStats = {
            totalFeedback: 0,
            positiveFeedback: 0,
            negativeFeedback: 0,
            neutralFeedback: 0,
            categories: {},
            patterns: {},
            learningOutcomes: {}
        };
        this.saveFeedbackData();
        console.log('🔄 Feedback data reset');
    }
}

// CLI interface
if (require.main === module) {
    const feedbackSystem = new HumanFeedbackIntegration().initialize();

    const command = process.argv[2];

    switch (command) {
        case 'submit':
            // Example: node human-feedback-integration.js submit decision file-management 1 "Good decision on file organization"
            const type = process.argv[3] || 'decision';
            const category = process.argv[4] || 'general';
            const rating = parseInt(process.argv[5]) || 0;
            const comments = process.argv[6] || '';

            const feedbackId = feedbackSystem.submitFeedback({
                type,
                category,
                rating,
                comments,
                context: { cli: true },
                userId: process.env.USER || 'cli-user'
            });

            console.log(`✅ Feedback submitted with ID: ${feedbackId}`);
            break;

        case 'analytics':
            const analytics = feedbackSystem.getAnalytics();
            console.log('\n📊 Human Feedback Analytics');
            console.log(`Total Feedback: ${analytics.totalFeedback}`);
            console.log(`Positive: ${analytics.positiveFeedback} (${((analytics.positiveFeedback/analytics.totalFeedback)*100 || 0).toFixed(1)}%)`);
            console.log(`Negative: ${analytics.negativeFeedback} (${((analytics.negativeFeedback/analytics.totalFeedback)*100 || 0).toFixed(1)}%)`);
            console.log(`Neutral: ${analytics.neutralFeedback} (${((analytics.neutralFeedback/analytics.totalFeedback)*100 || 0).toFixed(1)}%)`);

            if (analytics.recentTrends.trend !== 'insufficient_data') {
                console.log(`\n📈 Recent Trends: ${analytics.recentTrends.trend.toUpperCase()}`);
                console.log(`Recent Average: ${analytics.recentTrends.recentAverage.toFixed(2)}`);
                console.log(`Change: ${analytics.recentTrends.change.toFixed(2)}`);
            }

            if (analytics.topIssues.length > 0) {
                console.log('\n⚠️  Top Issues:');
                analytics.topIssues.forEach((issue, index) => {
                    console.log(`  ${index + 1}. ${issue.category}: ${issue.count} occurrences`);
                });
            }

            console.log(`\n🧠 Learning Progress: ${analytics.learningProgress.assessment.toUpperCase()}`);
            console.log(`Learned Patterns: ${analytics.learningProgress.learnedPatterns}/${analytics.learningProgress.totalPatterns}`);
            break;

        case 'recommend':
            // Example: node human-feedback-integration.js recommend action:file-organization
            const contextStr = process.argv[3] || '';
            const context = {};

            // Parse context string (format: key1:value1,key2:value2)
            if (contextStr) {
                contextStr.split(',').forEach(pair => {
                    const [key, value] = pair.split(':');
                    if (key && value) {
                        context[key] = value;
                    }
                });
            }

            const recommendations = feedbackSystem.getRecommendations(context);
            console.log('\n💡 Recommendations for context:', context);
            console.log(`Confidence: ${(recommendations.confidence * 100).toFixed(1)}%`);
            console.log(`Average Rating: ${recommendations.averageRating.toFixed(2)}`);
            console.log(`Sample Size: ${recommendations.sampleSize}`);

            if (recommendations.recommendations.length > 0) {
                console.log('\n📋 Recommendations:');
                recommendations.recommendations.forEach((rec, index) => {
                    console.log(`  ${index + 1}. ${rec}`);
                });
            }
            break;

        case 'export':
            const format = process.argv[3] || 'json';
            const exportPath = feedbackSystem.exportFeedbackData(format);
            console.log(`📊 Feedback data exported to: ${exportPath}`);
            break;

        case 'reset':
            feedbackSystem.reset();
            break;

        default:
            console.log('Usage: node human-feedback-integration.js <command> [options]');
            console.log('Commands:');
            console.log('  submit <type> <category> <rating> [comments] - Submit feedback');
            console.log('  analytics                                    - Show feedback analytics');
            console.log('  recommend [context]                         - Get recommendations');
            console.log('  export [format]                             - Export feedback data (json/csv)');
            console.log('  reset                                       - Reset feedback data');
            console.log('\nRating: -1 (negative), 0 (neutral), 1 (positive)');
            process.exit(1);
    }
}

module.exports = HumanFeedbackIntegration;