#!/usr/bin/env node

/**
 * User Satisfaction Measurement
 * Measures and analyzes user satisfaction with AI agent interactions
 */

const fs = require('fs');
const path = require('path');

class UserSatisfactionMeasurement {
    constructor() {
        this.satisfactionPath = path.join(process.cwd(), 'data', 'user-satisfaction.json');
        this.feedbackPath = path.join(process.cwd(), 'data', 'user-feedback.json');
        this.analyticsPath = path.join(process.cwd(), 'data', 'satisfaction-analytics.json');

        this.satisfaction = {
            ratings: [], // Individual satisfaction ratings (1-5 scale)
            feedback: [], // Detailed feedback comments
            categories: {
                response_quality: { total: 0, sum: 0, average: 0 },
                response_speed: { total: 0, sum: 0, average: 0 },
                accuracy: { total: 0, sum: 0, average: 0 },
                helpfulness: { total: 0, sum: 0, average: 0 },
                ease_of_use: { total: 0, sum: 0, average: 0 }
            },
            trends: {
                daily: [],
                weekly: [],
                monthly: []
            },
            lastUpdated: null
        };

        this.feedback = {
            positive: [],
            negative: [],
            suggestions: [],
            themes: {},
            sentiment: {
                positive: 0,
                neutral: 0,
                negative: 0
            }
        };

        this.analytics = {
            overallSatisfaction: 0,
            satisfactionTrend: 'stable',
            topIssues: [],
            topStrengths: [],
            nps: 0, // Net Promoter Score
            recommendations: [],
            benchmarks: {
                targetSatisfaction: 4.2,
                targetNPS: 30
            }
        };

        this.initialize();
    }

    /**
     * Initialize the satisfaction measurement system
     */
    initialize() {
        this.loadSatisfaction();
        this.loadFeedback();
        this.loadAnalytics();
        console.log('😊 User Satisfaction Measurement initialized');
    }

    /**
     * Load satisfaction data from file
     */
    loadSatisfaction() {
        try {
            if (fs.existsSync(this.satisfactionPath)) {
                const data = JSON.parse(fs.readFileSync(this.satisfactionPath, 'utf8'));
                this.satisfaction = { ...this.satisfaction, ...data };
                console.log('😊 Loaded satisfaction data');
            }
        } catch (error) {
            console.error('❌ Failed to load satisfaction data:', error.message);
        }
    }

    /**
     * Load feedback data from file
     */
    loadFeedback() {
        try {
            if (fs.existsSync(this.feedbackPath)) {
                const data = JSON.parse(fs.readFileSync(this.feedbackPath, 'utf8'));
                this.feedback = { ...this.feedback, ...data };
                console.log('😊 Loaded feedback data');
            }
        } catch (error) {
            console.error('❌ Failed to load feedback data:', error.message);
        }
    }

    /**
     * Load analytics data from file
     */
    loadAnalytics() {
        try {
            if (fs.existsSync(this.analyticsPath)) {
                const data = JSON.parse(fs.readFileSync(this.analyticsPath, 'utf8'));
                this.analytics = { ...this.analytics, ...data };
                console.log('😊 Loaded satisfaction analytics');
            }
        } catch (error) {
            console.error('❌ Failed to load satisfaction analytics:', error.message);
        }
    }

    /**
     * Save satisfaction data to file
     */
    saveSatisfaction() {
        try {
            fs.writeFileSync(this.satisfactionPath, JSON.stringify(this.satisfaction, null, 2));
            console.log('💾 Satisfaction data saved');
        } catch (error) {
            console.error('❌ Failed to save satisfaction data:', error.message);
        }
    }

    /**
     * Save feedback data to file
     */
    saveFeedback() {
        try {
            fs.writeFileSync(this.feedbackPath, JSON.stringify(this.feedback, null, 2));
            console.log('💾 Feedback data saved');
        } catch (error) {
            console.error('❌ Failed to save feedback data:', error.message);
        }
    }

    /**
     * Save analytics data to file
     */
    saveAnalytics() {
        try {
            fs.writeFileSync(this.analyticsPath, JSON.stringify(this.analytics, null, 2));
            console.log('💾 Satisfaction analytics saved');
        } catch (error) {
            console.error('❌ Failed to save satisfaction analytics:', error.message);
        }
    }

    /**
     * Record user satisfaction rating
     */
    recordSatisfaction(rating, categories = {}, context = {}) {
        if (rating < 1 || rating > 5) {
            console.warn('⚠️ Rating must be between 1 and 5');
            return false;
        }

        const satisfactionEntry = {
            timestamp: new Date().toISOString(),
            rating: parseFloat(rating),
            categories,
            context
        };

        this.satisfaction.ratings.push(satisfactionEntry);
        this.satisfaction.lastUpdated = satisfactionEntry.timestamp;

        // Update category averages
        Object.entries(categories).forEach(([category, score]) => {
            if (this.satisfaction.categories[category]) {
                this.satisfaction.categories[category].total++;
                this.satisfaction.categories[category].sum += parseFloat(score);
                this.satisfaction.categories[category].average =
                    this.satisfaction.categories[category].sum / this.satisfaction.categories[category].total;
            }
        });

        // Update trends
        this.updateTrends(satisfactionEntry);

        // Update analytics
        this.updateAnalytics();

        this.saveSatisfaction();
        console.log(`😊 Recorded satisfaction rating: ${rating}/5`);
        return true;
    }

    /**
     * Record user feedback
     */
    recordFeedback(type, content, sentiment = 'neutral', context = {}) {
        if (!['positive', 'negative', 'suggestion'].includes(type)) {
            console.warn('⚠️ Feedback type must be: positive, negative, or suggestion');
            return false;
        }

        const feedbackEntry = {
            timestamp: new Date().toISOString(),
            type,
            content: content.trim(),
            sentiment,
            context
        };

        // Add to appropriate array
        switch (type) {
            case 'positive':
                this.feedback.positive.push(feedbackEntry);
                break;
            case 'negative':
                this.feedback.negative.push(feedbackEntry);
                break;
            case 'suggestion':
                this.feedback.suggestions.push(feedbackEntry);
                break;
        }

        // Update sentiment analysis
        this.feedback.sentiment[sentiment] = (this.feedback.sentiment[sentiment] || 0) + 1;

        // Analyze themes
        this.analyzeFeedbackThemes(content, type);

        // Update analytics
        this.updateAnalytics();

        this.saveFeedback();
        console.log(`💬 Recorded ${type} feedback: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
        return true;
    }

    /**
     * Analyze feedback themes
     */
    analyzeFeedbackThemes(content, type) {
        const themes = this.extractThemes(content.toLowerCase());

        themes.forEach(theme => {
            if (!this.feedback.themes[theme]) {
                this.feedback.themes[theme] = { positive: 0, negative: 0, suggestions: 0 };
            }
            this.feedback.themes[theme][type === 'suggestion' ? 'suggestions' : type]++;
        });
    }

    /**
     * Extract themes from feedback content
     */
    extractThemes(content) {
        const themeKeywords = {
            speed: ['slow', 'fast', 'quick', 'speed', 'performance', 'delay'],
            accuracy: ['accurate', 'correct', 'wrong', 'error', 'mistake', 'precise'],
            usability: ['easy', 'hard', 'difficult', 'simple', 'complex', 'intuitive'],
            helpfulness: ['helpful', 'useful', 'useless', 'assist', 'support'],
            quality: ['quality', 'good', 'bad', 'excellent', 'poor', 'better']
        };

        const foundThemes = [];
        Object.entries(themeKeywords).forEach(([theme, keywords]) => {
            if (keywords.some(keyword => content.includes(keyword))) {
                foundThemes.push(theme);
            }
        });

        return foundThemes.length > 0 ? foundThemes : ['general'];
    }

    /**
     * Update satisfaction trends
     */
    updateTrends(satisfactionEntry) {
        const now = new Date();
        const dayKey = this.getDayKey(now);
        const weekKey = this.getWeekKey(now);
        const monthKey = this.getMonthKey(now);

        // Update daily trend
        let dayData = this.satisfaction.trends.daily.find(d => d.day === dayKey);
        if (!dayData) {
            dayData = { day: dayKey, ratings: [], average: 0 };
            this.satisfaction.trends.daily.push(dayData);
        }
        dayData.ratings.push(satisfactionEntry.rating);
        dayData.average = dayData.ratings.reduce((sum, r) => sum + r, 0) / dayData.ratings.length;

        // Update weekly trend
        let weekData = this.satisfaction.trends.weekly.find(w => w.week === weekKey);
        if (!weekData) {
            weekData = { week: weekKey, ratings: [], average: 0 };
            this.satisfaction.trends.weekly.push(weekData);
        }
        weekData.ratings.push(satisfactionEntry.rating);
        weekData.average = weekData.ratings.reduce((sum, r) => sum + r, 0) / weekData.ratings.length;

        // Update monthly trend
        let monthData = this.satisfaction.trends.monthly.find(m => m.month === monthKey);
        if (!monthData) {
            monthData = { month: monthKey, ratings: [], average: 0 };
            this.satisfaction.trends.monthly.push(monthData);
        }
        monthData.ratings.push(satisfactionEntry.rating);
        monthData.average = monthData.ratings.reduce((sum, r) => sum + r, 0) / monthData.ratings.length;

        // Keep only last 30 days, 12 weeks, 12 months
        this.satisfaction.trends.daily = this.satisfaction.trends.daily.slice(-30);
        this.satisfaction.trends.weekly = this.satisfaction.trends.weekly.slice(-12);
        this.satisfaction.trends.monthly = this.satisfaction.trends.monthly.slice(-12);
    }

    /**
     * Update analytics based on current data
     */
    updateAnalytics() {
        // Calculate overall satisfaction
        if (this.satisfaction.ratings.length > 0) {
            this.analytics.overallSatisfaction =
                this.satisfaction.ratings.reduce((sum, r) => sum + r.rating, 0) / this.satisfaction.ratings.length;
        }

        // Calculate NPS (Net Promoter Score)
        this.analytics.nps = this.calculateNPS();

        // Determine satisfaction trend
        this.analytics.satisfactionTrend = this.calculateTrend();

        // Identify top issues and strengths
        this.identifyTopIssuesAndStrengths();

        // Generate recommendations
        this.generateRecommendations();

        this.saveAnalytics();
    }

    /**
     * Calculate Net Promoter Score
     */
    calculateNPS() {
        if (this.satisfaction.ratings.length === 0) return 0;

        const promoters = this.satisfaction.ratings.filter(r => r.rating >= 4).length;
        const detractors = this.satisfaction.ratings.filter(r => r.rating <= 2).length;
        const total = this.satisfaction.ratings.length;

        return ((promoters - detractors) / total) * 100;
    }

    /**
     * Calculate satisfaction trend
     */
    calculateTrend() {
        const recent = this.satisfaction.trends.daily.slice(-7);
        if (recent.length < 2) return 'stable';

        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));

        const firstAvg = firstHalf.reduce((sum, d) => sum + d.average, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.average, 0) / secondHalf.length;

        const diff = secondAvg - firstAvg;

        if (diff > 0.2) return 'improving';
        if (diff < -0.2) return 'declining';
        return 'stable';
    }

    /**
     * Identify top issues and strengths
     */
    identifyTopIssuesAndStrengths() {
        // Top issues from negative feedback themes
        this.analytics.topIssues = Object.entries(this.feedback.themes)
            .filter(([, counts]) => counts.negative > 0)
            .sort(([, a], [, b]) => b.negative - a.negative)
            .slice(0, 3)
            .map(([theme, counts]) => ({
                theme: theme.replace(/_/g, ' '),
                mentions: counts.negative
            }));

        // Top strengths from positive feedback themes
        this.analytics.topStrengths = Object.entries(this.feedback.themes)
            .filter(([, counts]) => counts.positive > 0)
            .sort(([, a], [, b]) => b.positive - a.positive)
            .slice(0, 3)
            .map(([theme, counts]) => ({
                theme: theme.replace(/_/g, ' '),
                mentions: counts.positive
            }));
    }

    /**
     * Generate recommendations based on data
     */
    generateRecommendations() {
        this.analytics.recommendations = [];

        // Satisfaction-based recommendations
        if (this.analytics.overallSatisfaction < 4.0) {
            this.analytics.recommendations.push({
                type: 'satisfaction',
                priority: 'high',
                recommendation: 'Overall satisfaction is below target. Focus on improving core user experience.',
                action: 'Review recent feedback and prioritize top issues'
            });
        }

        // NPS-based recommendations
        if (this.analytics.nps < 20) {
            this.analytics.recommendations.push({
                type: 'nps',
                priority: 'high',
                recommendation: 'NPS is low. Users are not likely to recommend the service.',
                action: 'Implement user referral program and address detractor feedback'
            });
        }

        // Trend-based recommendations
        if (this.analytics.satisfactionTrend === 'declining') {
            this.analytics.recommendations.push({
                type: 'trend',
                priority: 'medium',
                recommendation: 'Satisfaction is declining. Immediate action needed.',
                action: 'Analyze recent changes and user feedback for root causes'
            });
        }

        // Category-based recommendations
        Object.entries(this.satisfaction.categories).forEach(([category, data]) => {
            if (data.average < 3.5 && data.total > 0) {
                const categoryName = category.replace(/_/g, ' ');
                this.analytics.recommendations.push({
                    type: 'category',
                    priority: 'medium',
                    recommendation: `${categoryName} satisfaction is low (${data.average.toFixed(1)}/5)`,
                    action: `Focus on improving ${categoryName} based on user feedback`
                });
            }
        });
    }

    /**
     * Get satisfaction summary
     */
    getSatisfactionSummary() {
        return {
            overall: {
                averageRating: this.analytics.overallSatisfaction,
                totalRatings: this.satisfaction.ratings.length,
                nps: this.analytics.nps,
                trend: this.analytics.satisfactionTrend
            },
            categories: this.satisfaction.categories,
            feedback: {
                positive: this.feedback.positive.length,
                negative: this.feedback.negative.length,
                suggestions: this.feedback.suggestions.length,
                sentiment: this.feedback.sentiment
            },
            topIssues: this.analytics.topIssues,
            topStrengths: this.analytics.topStrengths,
            recommendations: this.analytics.recommendations
        };
    }

    /**
     * Generate comprehensive satisfaction report
     */
    generateSatisfactionReport() {
        const summary = this.getSatisfactionSummary();

        const output = `
😊 AI Agent User Satisfaction Measurement Report
==============================================

📊 OVERALL SATISFACTION
Average Rating: ${summary.overall.averageRating.toFixed(1)}/5
Total Ratings: ${summary.overall.totalRatings}
Net Promoter Score: ${summary.overall.nps.toFixed(1)}
Trend: ${summary.overall.trend.replace(/\b\w/g, l => l.toUpperCase())}

🏆 CATEGORY PERFORMANCE
${Object.entries(summary.categories).map(([category, data]) => {
    const name = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${name}: ${data.average.toFixed(1)}/5 (${data.total} ratings)`;
}).join('\n')}

💬 FEEDBACK SUMMARY
Positive Feedback: ${summary.feedback.positive}
Negative Feedback: ${summary.feedback.negative}
Suggestions: ${summary.feedback.suggestions}

Sentiment Distribution:
  😊 Positive: ${summary.feedback.sentiment.positive}
  😐 Neutral: ${summary.feedback.sentiment.neutral}
  😞 Negative: ${summary.feedback.sentiment.negative}

🏆 TOP STRENGTHS
${summary.topStrengths.length > 0 ? summary.topStrengths.map(s => `✅ ${s.theme} (${s.mentions} mentions)`).join('\n') : 'No strengths identified yet'}

⚠️ TOP ISSUES
${summary.topIssues.length > 0 ? summary.topIssues.map(i => `❌ ${i.theme} (${i.mentions} mentions)`).join('\n') : 'No issues identified'}

💡 RECOMMENDATIONS
${summary.recommendations.length > 0 ? summary.recommendations.map(r => {
    const priorityIcon = r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : '🟢';
    return `${priorityIcon} ${r.recommendation}\n   → ${r.action}`;
}).join('\n\n') : '✅ All metrics meeting targets'}

📅 RECENT TRENDS
Daily Average (Last 7 days): ${this.satisfaction.trends.daily.slice(-7).map(d => d.average.toFixed(1)).join(', ')}
Weekly Average (Last 4 weeks): ${this.satisfaction.trends.weekly.slice(-4).map(w => w.average.toFixed(1)).join(', ')}
Monthly Average (Last 3 months): ${this.satisfaction.trends.monthly.slice(-3).map(m => m.average.toFixed(1)).join(', ')}

Last Updated: ${this.satisfaction.lastUpdated || 'Never'}
`;

        return output;
    }

    /**
     * Get day key for trend tracking
     */
    getDayKey(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Get week key for trend tracking
     */
    getWeekKey(date) {
        const year = date.getFullYear();
        const weekNum = Math.ceil((date - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
        return `${year}-W${weekNum.toString().padStart(2, '0')}`;
    }

    /**
     * Get month key for trend tracking
     */
    getMonthKey(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * CLI interface
     */
    static runCLI() {
        const args = process.argv.slice(2);
        const command = args[0];

        if (!command) {
            console.log('Usage: node user-satisfaction-measurement.js <command> [options]');
            console.log('Commands:');
            console.log('  rate <rating> [categories] [context] - Record satisfaction rating (1-5)');
            console.log('  feedback <type> <content> [sentiment] - Record user feedback');
            console.log('  report                               - Generate comprehensive report');
            console.log('  summary                              - Show satisfaction summary');
            console.log('  categories                           - List rating categories');
            console.log('  test                                 - Run self-test');
            process.exit(1);
        }

        const satisfaction = new UserSatisfactionMeasurement();

        switch (command) {
            case 'rate':
                const rating = parseFloat(args[1]);
                const categories = args[2] ? JSON.parse(args[2]) : {};
                const context = args[3] ? JSON.parse(args[3]) : {};

                if (isNaN(rating)) {
                    console.error('❌ Numeric rating required (1-5)');
                    process.exit(1);
                }

                satisfaction.recordSatisfaction(rating, categories, context);
                break;

            case 'feedback':
                const type = args[1];
                const content = args[2];
                const sentiment = args[3] || 'neutral';

                if (!type || !content) {
                    console.error('❌ Feedback type and content required');
                    process.exit(1);
                }

                satisfaction.recordFeedback(type, content, sentiment);
                break;

            case 'report':
                console.log(satisfaction.generateSatisfactionReport());
                break;

            case 'summary':
                const summary = satisfaction.getSatisfactionSummary();
                console.log('😊 Satisfaction Summary:');
                console.log(`Average Rating: ${summary.overall.averageRating.toFixed(1)}/5`);
                console.log(`NPS: ${summary.overall.nps.toFixed(1)}`);
                console.log(`Total Ratings: ${summary.overall.totalRatings}`);
                console.log(`Feedback: ${summary.feedback.positive} positive, ${summary.feedback.negative} negative, ${summary.feedback.suggestions} suggestions`);
                break;

            case 'categories':
                console.log('🏷️ Rating Categories:');
                Object.keys(satisfaction.satisfaction.categories).forEach(cat => {
                    console.log(`  ${cat}`);
                });
                break;

            case 'test':
                satisfaction.runSelfTest();
                break;

            default:
                console.error(`❌ Unknown command: ${command}`);
                process.exit(1);
        }
    }

    /**
     * Run self-test
     */
    runSelfTest() {
        console.log('🧪 Running User Satisfaction Measurement Self-Test...');

        // Test recording ratings
        console.log('Testing satisfaction rating recording...');
        this.recordSatisfaction(4.5, {
            response_quality: 4,
            response_speed: 5,
            accuracy: 4,
            helpfulness: 5,
            ease_of_use: 4
        }, { user: 'test_user', task: 'code_review' });

        this.recordSatisfaction(3.0, {
            response_quality: 3,
            response_speed: 2,
            accuracy: 4,
            helpfulness: 3,
            ease_of_use: 3
        }, { user: 'test_user', task: 'debugging' });

        // Test recording feedback
        console.log('Testing feedback recording...');
        this.recordFeedback('positive', 'The AI was very helpful with the code review', 'positive');
        this.recordFeedback('negative', 'Response was too slow for urgent debugging', 'negative');
        this.recordFeedback('suggestion', 'Add more detailed explanations for complex topics', 'neutral');

        // Test analytics
        console.log('Testing analytics calculation...');
        const analytics = this.getSatisfactionSummary();
        console.log(`✅ Analytics calculated: ${analytics.overall.averageRating.toFixed(1)}/5 average`);

        // Test report generation
        console.log('Testing report generation...');
        const report = this.generateSatisfactionReport();
        console.log('✅ Report generated successfully');

        console.log('🎉 Self-test completed successfully!');
    }
}

// CLI execution
if (require.main === module) {
    UserSatisfactionMeasurement.runCLI();
}

module.exports = UserSatisfactionMeasurement;