#!/usr/bin/env node

/**
 * Adherence Rate Tracking System
 * Tracks and analyzes AI agent adherence to best practices and instructions
 */

const fs = require('fs');
const path = require('path');

class AdherenceRateTracking {
    constructor() {
        this.dataPath = path.join(process.cwd(), 'data', 'adherence-tracking.json');
        this.metricsPath = path.join(process.cwd(), 'data', 'adherence-metrics.json');
        this.reportsPath = path.join(process.cwd(), 'data', 'adherence-reports.json');

        this.adherenceData = {
            categories: {
                file_size_limits: { total: 0, violations: 0, corrections: 0 },
                organizational_compliance: { total: 0, violations: 0, corrections: 0 },
                git_practices: { total: 0, violations: 0, corrections: 0 },
                commenting_standards: { total: 0, violations: 0, corrections: 0 },
                functional_programming: { total: 0, violations: 0, corrections: 0 },
                error_handling: { total: 0, violations: 0, corrections: 0 },
                testing_requirements: { total: 0, violations: 0, corrections: 0 },
                documentation_standards: { total: 0, violations: 0, corrections: 0 }
            },
            timeline: [],
            lastUpdated: null
        };

        this.metrics = {
            overallAdherenceRate: 0,
            categoryPerformance: {},
            trends: {
                weekly: [],
                monthly: []
            },
            alerts: [],
            recommendations: []
        };

        this.initialize();
    }

    /**
     * Initialize the tracking system
     */
    initialize() {
        this.loadData();
        this.loadMetrics();
        console.log('📊 Adherence Rate Tracking System initialized');
    }

    /**
     * Load adherence data from file
     */
    loadData() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
                this.adherenceData = { ...this.adherenceData, ...data };
                console.log('📊 Loaded adherence data');
            }
        } catch (error) {
            console.error('❌ Failed to load adherence data:', error.message);
        }
    }

    /**
     * Load metrics data from file
     */
    loadMetrics() {
        try {
            if (fs.existsSync(this.metricsPath)) {
                const data = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
                this.metrics = { ...this.metrics, ...data };
                console.log('📊 Loaded adherence metrics');
            }
        } catch (error) {
            console.error('❌ Failed to load adherence metrics:', error.message);
        }
    }

    /**
     * Save adherence data to file
     */
    saveData() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.adherenceData, null, 2));
            console.log('💾 Adherence data saved');
        } catch (error) {
            console.error('❌ Failed to save adherence data:', error.message);
        }
    }

    /**
     * Save metrics data to file
     */
    saveMetrics() {
        try {
            fs.writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
            console.log('💾 Adherence metrics saved');
        } catch (error) {
            console.error('❌ Failed to save adherence metrics:', error.message);
        }
    }

    /**
     * Record an adherence event
     */
    recordEvent(category, eventType, details = {}) {
        if (!this.adherenceData.categories[category]) {
            console.warn(`⚠️ Unknown category: ${category}`);
            return false;
        }

        const categoryData = this.adherenceData.categories[category];
        categoryData.total++;

        if (eventType === 'violation') {
            categoryData.violations++;
        } else if (eventType === 'correction') {
            categoryData.corrections++;
        }

        // Record timeline event
        const event = {
            timestamp: new Date().toISOString(),
            category,
            eventType,
            details,
            adherenceRate: this.calculateCategoryAdherence(category)
        };

        this.adherenceData.timeline.push(event);
        this.adherenceData.lastUpdated = event.timestamp;

        // Update metrics
        this.updateMetrics();

        // Save data
        this.saveData();

        console.log(`📊 Recorded ${eventType} for ${category}: ${JSON.stringify(details)}`);
        return true;
    }

    /**
     * Calculate adherence rate for a category
     */
    calculateCategoryAdherence(category) {
        const data = this.adherenceData.categories[category];
        if (data.total === 0) return 100;

        const violations = data.violations;
        const corrections = data.corrections;

        // Adherence rate = (total - violations + corrections) / total * 100
        const adherenceRate = ((data.total - violations + corrections) / data.total) * 100;
        return Math.max(0, Math.min(100, adherenceRate));
    }

    /**
     * Calculate overall adherence rate
     */
    calculateOverallAdherence() {
        const categories = Object.keys(this.adherenceData.categories);
        if (categories.length === 0) return 100;

        const totalAdherence = categories.reduce((sum, category) => {
            return sum + this.calculateCategoryAdherence(category);
        }, 0);

        return totalAdherence / categories.length;
    }

    /**
     * Update metrics based on current data
     */
    updateMetrics() {
        // Update overall adherence rate
        this.metrics.overallAdherenceRate = this.calculateOverallAdherence();

        // Update category performance
        this.metrics.categoryPerformance = {};
        Object.keys(this.adherenceData.categories).forEach(category => {
            this.metrics.categoryPerformance[category] = {
                adherenceRate: this.calculateCategoryAdherence(category),
                totalEvents: this.adherenceData.categories[category].total,
                violations: this.adherenceData.categories[category].violations,
                corrections: this.adherenceData.categories[category].corrections
            };
        });

        // Update trends
        this.updateTrends();

        // Generate alerts and recommendations
        this.generateAlerts();
        this.generateRecommendations();

        this.saveMetrics();
    }

    /**
     * Update trend data
     */
    updateTrends() {
        const now = new Date();
        const weekKey = this.getWeekKey(now);
        const monthKey = this.getMonthKey(now);

        // Update weekly trend
        let weekData = this.metrics.trends.weekly.find(w => w.week === weekKey);
        if (!weekData) {
            weekData = { week: weekKey, adherenceRate: this.metrics.overallAdherenceRate };
            this.metrics.trends.weekly.push(weekData);
        } else {
            weekData.adherenceRate = this.metrics.overallAdherenceRate;
        }

        // Update monthly trend
        let monthData = this.metrics.trends.monthly.find(m => m.month === monthKey);
        if (!monthData) {
            monthData = { month: monthKey, adherenceRate: this.metrics.overallAdherenceRate };
            this.metrics.trends.monthly.push(monthData);
        } else {
            monthData.adherenceRate = this.metrics.overallAdherenceRate;
        }

        // Keep only last 12 weeks and 12 months
        this.metrics.trends.weekly = this.metrics.trends.weekly.slice(-12);
        this.metrics.trends.monthly = this.metrics.trends.monthly.slice(-12);
    }

    /**
     * Generate alerts based on adherence data
     */
    generateAlerts() {
        this.metrics.alerts = [];

        Object.entries(this.metrics.categoryPerformance).forEach(([category, data]) => {
            if (data.adherenceRate < 80) {
                this.metrics.alerts.push({
                    type: 'low_adherence',
                    category,
                    message: `${category.replace(/_/g, ' ')} adherence rate is ${data.adherenceRate.toFixed(1)}%`,
                    severity: data.adherenceRate < 60 ? 'critical' : 'warning',
                    timestamp: new Date().toISOString()
                });
            }

            if (data.violations > data.corrections * 2) {
                this.metrics.alerts.push({
                    type: 'high_violation_rate',
                    category,
                    message: `${category.replace(/_/g, ' ')} has ${data.violations} violations vs ${data.corrections} corrections`,
                    severity: 'warning',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * Generate recommendations based on adherence data
     */
    generateRecommendations() {
        this.metrics.recommendations = [];

        // Find categories with low adherence
        const lowAdherenceCategories = Object.entries(this.metrics.categoryPerformance)
            .filter(([, data]) => data.adherenceRate < 85)
            .sort(([, a], [, b]) => a.adherenceRate - b.adherenceRate);

        lowAdherenceCategories.forEach(([category, data]) => {
            const categoryName = category.replace(/_/g, ' ');
            this.metrics.recommendations.push({
                category,
                priority: data.adherenceRate < 70 ? 'high' : 'medium',
                recommendation: `Focus on improving ${categoryName} adherence (${data.adherenceRate.toFixed(1)}%)`,
                actions: this.getCategoryRecommendations(category)
            });
        });
    }

    /**
     * Get specific recommendations for a category
     */
    getCategoryRecommendations(category) {
        const recommendations = {
            file_size_limits: [
                'Review and update file size validation rules',
                'Implement automated refactoring suggestions',
                'Add pre-commit file size checks'
            ],
            organizational_compliance: [
                'Update organizational structure validation',
                'Implement automated file placement suggestions',
                'Review cross-reference database completeness'
            ],
            git_practices: [
                'Strengthen conventional commit validation',
                'Implement branching strategy enforcement',
                'Add git workflow compliance tracking'
            ],
            commenting_standards: [
                'Update comment quality assessment algorithms',
                'Implement comment style consistency validation',
                'Add documentation update suggestions'
            ],
            functional_programming: [
                'Review functional programming patterns',
                'Implement immutability validation',
                'Add pure function detection'
            ],
            error_handling: [
                'Strengthen error handling validation',
                'Implement exception safety checks',
                'Add error recovery pattern validation'
            ],
            testing_requirements: [
                'Review test coverage requirements',
                'Implement automated test generation',
                'Add test quality assessment'
            ],
            documentation_standards: [
                'Update documentation completeness checking',
                'Implement API documentation automation',
                'Add documentation update tracking'
            ]
        };

        return recommendations[category] || ['Review and update category-specific best practices'];
    }

    /**
     * Get adherence report
     */
    getAdherenceReport() {
        return {
            overall: {
                adherenceRate: this.metrics.overallAdherenceRate,
                totalEvents: Object.values(this.adherenceData.categories).reduce((sum, cat) => sum + cat.total, 0),
                totalViolations: Object.values(this.adherenceData.categories).reduce((sum, cat) => sum + cat.violations, 0),
                totalCorrections: Object.values(this.adherenceData.categories).reduce((sum, cat) => sum + cat.corrections, 0)
            },
            categories: this.metrics.categoryPerformance,
            trends: this.metrics.trends,
            alerts: this.metrics.alerts,
            recommendations: this.metrics.recommendations,
            lastUpdated: this.adherenceData.lastUpdated
        };
    }

    /**
     * Generate comprehensive report
     */
    generateComprehensiveReport() {
        const report = this.getAdherenceReport();

        const output = `
📊 AI Agent Adherence Rate Tracking Report
==========================================

📈 OVERALL PERFORMANCE
Overall Adherence Rate: ${report.overall.adherenceRate.toFixed(1)}%
Total Events Tracked: ${report.overall.totalEvents}
Total Violations: ${report.overall.totalViolations}
Total Corrections: ${report.overall.totalCorrections}

🏆 CATEGORY PERFORMANCE
${Object.entries(report.categories).map(([category, data]) => {
    const name = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${name}: ${data.adherenceRate.toFixed(1)}% (${data.totalEvents} events, ${data.violations} violations, ${data.corrections} corrections)`;
}).join('\n')}

📉 ALERTS
${report.alerts.length > 0 ? report.alerts.map(alert => `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`).join('\n') : '✅ No active alerts'}

💡 RECOMMENDATIONS
${report.recommendations.length > 0 ? report.recommendations.map(rec => `🎯 ${rec.priority.toUpperCase()}: ${rec.recommendation}`).join('\n') : '✅ All categories performing well'}

📅 TRENDS
Weekly Trend: ${report.trends.weekly.map(w => `${w.week}: ${w.adherenceRate.toFixed(1)}%`).join(', ')}
Monthly Trend: ${report.trends.monthly.map(m => `${m.month}: ${m.adherenceRate.toFixed(1)}%`).join(', ')}

Last Updated: ${report.lastUpdated || 'Never'}
`;

        return output;
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
            console.log('Usage: node adherence-rate-tracking.js <command> [options]');
            console.log('Commands:');
            console.log('  record <category> <event-type> [details] - Record an adherence event');
            console.log('  report                                  - Generate comprehensive report');
            console.log('  status                                  - Show current status');
            console.log('  categories                              - List available categories');
            console.log('  test                                    - Run self-test');
            process.exit(1);
        }

        const tracker = new AdherenceRateTracking();

        switch (command) {
            case 'record':
                const category = args[1];
                const eventType = args[2];
                const details = args[3] ? JSON.parse(args[3]) : {};

                if (!category || !eventType) {
                    console.error('❌ Category and event type required');
                    process.exit(1);
                }

                if (!['violation', 'correction', 'compliance'].includes(eventType)) {
                    console.error('❌ Event type must be: violation, correction, or compliance');
                    process.exit(1);
                }

                tracker.recordEvent(category, eventType, details);
                break;

            case 'report':
                console.log(tracker.generateComprehensiveReport());
                break;

            case 'status':
                const status = tracker.getAdherenceReport();
                console.log('📊 Current Status:');
                console.log(`Overall Adherence: ${status.overall.adherenceRate.toFixed(1)}%`);
                console.log(`Total Events: ${status.overall.totalEvents}`);
                console.log(`Active Alerts: ${status.alerts.length}`);
                break;

            case 'categories':
                console.log('🏷️ Available Categories:');
                Object.keys(tracker.adherenceData.categories).forEach(cat => {
                    console.log(`  ${cat}`);
                });
                break;

            case 'test':
                tracker.runSelfTest();
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
        console.log('🧪 Running Adherence Rate Tracking Self-Test...');

        // Test recording events
        console.log('Testing event recording...');
        this.recordEvent('file_size_limits', 'violation', { file: 'large-file.js', size: 350 });
        this.recordEvent('file_size_limits', 'correction', { file: 'large-file.js', action: 'refactored' });
        this.recordEvent('git_practices', 'compliance', { commit: 'feat: add new feature' });

        // Test calculations
        console.log('Testing calculations...');
        const adherence = this.calculateOverallAdherence();
        console.log(`✅ Overall adherence calculated: ${adherence.toFixed(1)}%`);

        // Test report generation
        console.log('Testing report generation...');
        const report = this.generateComprehensiveReport();
        console.log('✅ Report generated successfully');

        console.log('🎉 Self-test completed successfully!');
    }
}

// CLI execution
if (require.main === module) {
    AdherenceRateTracking.runCLI();
}

module.exports = AdherenceRateTracking;