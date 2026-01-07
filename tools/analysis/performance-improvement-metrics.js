#!/usr/bin/env node

/**
 * Performance Improvement Metrics
 * Measures and analyzes AI agent performance improvements over time
 */

const fs = require('fs');
const path = require('path');

class PerformanceImprovementMetrics {
    constructor() {
        this.metricsPath = path.join(process.cwd(), 'data', 'performance-metrics.json');
        this.baselinePath = path.join(process.cwd(), 'data', 'performance-baseline.json');
        this.improvementPath = path.join(process.cwd(), 'data', 'performance-improvements.json');

        this.metrics = {
            responseTime: [],
            accuracy: [],
            errorRate: [],
            throughput: [],
            resourceUsage: [],
            lastUpdated: null
        };

        this.baseline = {
            responseTime: { target: 1000, current: null }, // ms
            accuracy: { target: 95, current: null }, // %
            errorRate: { target: 2, current: null }, // %
            throughput: { target: 100, current: null }, // requests/min
            resourceUsage: { target: 80, current: null }, // % CPU/Memory
            established: false
        };

        this.improvements = {
            timeline: [],
            categories: {
                response_time: { improvements: 0, regressions: 0, net_gain: 0 },
                accuracy: { improvements: 0, regressions: 0, net_gain: 0 },
                error_rate: { improvements: 0, regressions: 0, net_gain: 0 },
                throughput: { improvements: 0, regressions: 0, net_gain: 0 },
                resource_usage: { improvements: 0, regressions: 0, net_gain: 0 }
            },
            overall: {
                totalImprovements: 0,
                totalRegressions: 0,
                netImprovement: 0,
                improvementRate: 0
            }
        };

        this.initialize();
    }

    /**
     * Initialize the metrics system
     */
    initialize() {
        this.loadMetrics();
        this.loadBaseline();
        this.loadImprovements();
        console.log('📊 Performance Improvement Metrics initialized');
    }

    /**
     * Load metrics data from file
     */
    loadMetrics() {
        try {
            if (fs.existsSync(this.metricsPath)) {
                const data = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
                this.metrics = { ...this.metrics, ...data };
                console.log('📊 Loaded performance metrics');
            }
        } catch (error) {
            console.error('❌ Failed to load performance metrics:', error.message);
        }
    }

    /**
     * Load baseline data from file
     */
    loadBaseline() {
        try {
            if (fs.existsSync(this.baselinePath)) {
                const data = JSON.parse(fs.readFileSync(this.baselinePath, 'utf8'));
                this.baseline = { ...this.baseline, ...data };
                console.log('📊 Loaded performance baseline');
            }
        } catch (error) {
            console.error('❌ Failed to load performance baseline:', error.message);
        }
    }

    /**
     * Load improvements data from file
     */
    loadImprovements() {
        try {
            if (fs.existsSync(this.improvementPath)) {
                const data = JSON.parse(fs.readFileSync(this.improvementPath, 'utf8'));
                this.improvements = { ...this.improvements, ...data };
                console.log('📊 Loaded performance improvements');
            }
        } catch (error) {
            console.error('❌ Failed to load performance improvements:', error.message);
        }
    }

    /**
     * Save metrics data to file
     */
    saveMetrics() {
        try {
            fs.writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
            console.log('💾 Performance metrics saved');
        } catch (error) {
            console.error('❌ Failed to save performance metrics:', error.message);
        }
    }

    /**
     * Save baseline data to file
     */
    saveBaseline() {
        try {
            fs.writeFileSync(this.baselinePath, JSON.stringify(this.baseline, null, 2));
            console.log('💾 Performance baseline saved');
        } catch (error) {
            console.error('❌ Failed to save performance baseline:', error.message);
        }
    }

    /**
     * Save improvements data to file
     */
    saveImprovements() {
        try {
            fs.writeFileSync(this.improvementPath, JSON.stringify(this.improvements, null, 2));
            console.log('💾 Performance improvements saved');
        } catch (error) {
            console.error('❌ Failed to save performance improvements:', error.message);
        }
    }

    /**
     * Record a performance metric
     */
    recordMetric(metricType, value, context = {}) {
        if (!this.metrics[metricType]) {
            console.warn(`⚠️ Unknown metric type: ${metricType}`);
            return false;
        }

        const metric = {
            timestamp: new Date().toISOString(),
            value: parseFloat(value),
            context
        };

        this.metrics[metricType].push(metric);
        this.metrics.lastUpdated = metric.timestamp;

        // Keep only last 1000 entries per metric type
        if (this.metrics[metricType].length > 1000) {
            this.metrics[metricType] = this.metrics[metricType].slice(-1000);
        }

        // Update baseline if not established
        if (!this.baseline.established) {
            this.updateBaseline(metricType, value);
        }

        // Analyze improvement
        this.analyzeImprovement(metricType, value);

        this.saveMetrics();
        console.log(`📊 Recorded ${metricType}: ${value} ${this.getMetricUnit(metricType)}`);
        return true;
    }

    /**
     * Update baseline values
     */
    updateBaseline(metricType, value) {
        if (this.baseline[metricType]) {
            this.baseline[metricType].current = value;

            // Check if all baselines are established
            const allEstablished = Object.values(this.baseline).every(val =>
                typeof val === 'object' && val.current !== null
            );

            if (allEstablished && !this.baseline.established) {
                this.baseline.established = true;
                this.saveBaseline();
                console.log('🎯 Performance baseline established');
            }
        }
    }

    /**
     * Analyze performance improvement
     */
    analyzeImprovement(metricType, currentValue) {
        if (!this.baseline.established || !this.baseline[metricType].current) {
            return;
        }

        const baselineValue = this.baseline[metricType].current;
        const improvement = this.calculateImprovement(metricType, baselineValue, currentValue);

        if (Math.abs(improvement) < 1) return; // Ignore minor changes

        // Map metric type to category key
        const categoryKey = this.mapMetricToCategory(metricType);
        const category = this.improvements.categories[categoryKey];

        if (!category) {
            console.warn(`⚠️ No category found for metric: ${metricType}`);
            return;
        }

        const improvementEvent = {
            timestamp: new Date().toISOString(),
            metricType,
            baselineValue,
            currentValue,
            improvement,
            type: improvement > 0 ? 'improvement' : 'regression'
        };

        this.improvements.timeline.push(improvementEvent);

        if (improvement > 0) {
            category.improvements++;
            this.improvements.overall.totalImprovements++;
        } else {
            category.regressions++;
            this.improvements.overall.totalRegressions++;
        }

        category.net_gain += improvement;
        this.improvements.overall.netImprovement += improvement;

        // Calculate improvement rate
        const totalEvents = this.improvements.overall.totalImprovements + this.improvements.overall.totalRegressions;
        if (totalEvents > 0) {
            this.improvements.overall.improvementRate = (this.improvements.overall.totalImprovements / totalEvents) * 100;
        }

        this.saveImprovements();

        const direction = improvement > 0 ? '📈' : '📉';
        console.log(`${direction} ${metricType.replace(/_/g, ' ')} ${improvement > 0 ? 'improved' : 'regressed'} by ${Math.abs(improvement).toFixed(2)}${this.getMetricUnit(metricType)}`);
    }

    /**
     * Map metric type to category key
     */
    mapMetricToCategory(metricType) {
        const mapping = {
            responseTime: 'response_time',
            accuracy: 'accuracy',
            errorRate: 'error_rate',
            throughput: 'throughput',
            resourceUsage: 'resource_usage'
        };
        return mapping[metricType] || metricType;
    }

    /**
     * Calculate improvement percentage
     */
    calculateImprovement(metricType, baseline, current) {
        switch (metricType) {
            case 'responseTime':
            case 'errorRate':
                // Lower is better - negative improvement means getting worse
                return ((baseline - current) / baseline) * 100;

            case 'accuracy':
            case 'throughput':
                // Higher is better
                return ((current - baseline) / baseline) * 100;

            case 'resourceUsage':
                // Lower is better, but small increases might be acceptable
                return ((baseline - current) / baseline) * 100;

            default:
                return 0;
        }
    }

    /**
     * Get metric unit for display
     */
    getMetricUnit(metricType) {
        const units = {
            responseTime: 'ms',
            accuracy: '%',
            errorRate: '%',
            throughput: 'req/min',
            resourceUsage: '%'
        };
        return units[metricType] || '';
    }

    /**
     * Get current performance status
     */
    getPerformanceStatus() {
        const status = {
            baselineEstablished: this.baseline.established,
            currentMetrics: {},
            targets: {},
            performance: {}
        };

        Object.keys(this.baseline).forEach(key => {
            if (typeof this.baseline[key] === 'object') {
                status.targets[key] = this.baseline[key].target;
                status.currentMetrics[key] = this.baseline[key].current;

                if (this.baseline[key].current !== null) {
                    const target = this.baseline[key].target;
                    const current = this.baseline[key].current;
                    status.performance[key] = this.calculatePerformanceStatus(key, target, current);
                }
            }
        });

        return status;
    }

    /**
     * Calculate performance status vs target
     */
    calculatePerformanceStatus(metricType, target, current) {
        let percentage;
        let status;

        switch (metricType) {
            case 'responseTime':
            case 'errorRate':
            case 'resourceUsage':
                // Lower is better
                percentage = ((target - current) / target) * 100;
                status = percentage >= 0 ? 'meeting_target' : 'below_target';
                break;

            case 'accuracy':
            case 'throughput':
                // Higher is better
                percentage = ((current - target) / target) * 100;
                status = percentage >= 0 ? 'meeting_target' : 'below_target';
                break;

            default:
                percentage = 0;
                status = 'unknown';
        }

        return {
            percentage: Math.max(-100, Math.min(100, percentage)),
            status,
            target,
            current
        };
    }

    /**
     * Get improvement summary
     */
    getImprovementSummary() {
        return {
            overall: this.improvements.overall,
            categories: this.improvements.categories,
            recent: this.improvements.timeline.slice(-10), // Last 10 improvements
            trends: this.calculateTrends()
        };
    }

    /**
     * Calculate improvement trends
     */
    calculateTrends() {
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentEvents = this.improvements.timeline.filter(event =>
            new Date(event.timestamp) >= lastWeek
        );

        const monthlyEvents = this.improvements.timeline.filter(event =>
            new Date(event.timestamp) >= lastMonth
        );

        return {
            weekly: {
                improvements: recentEvents.filter(e => e.type === 'improvement').length,
                regressions: recentEvents.filter(e => e.type === 'regression').length,
                netGain: recentEvents.reduce((sum, e) => sum + e.improvement, 0)
            },
            monthly: {
                improvements: monthlyEvents.filter(e => e.type === 'improvement').length,
                regressions: monthlyEvents.filter(e => e.type === 'regression').length,
                netGain: monthlyEvents.reduce((sum, e) => sum + e.improvement, 0)
            }
        };
    }

    /**
     * Generate comprehensive performance report
     */
    generatePerformanceReport() {
        const status = this.getPerformanceStatus();
        const improvements = this.getImprovementSummary();

        const output = `
🚀 AI Agent Performance Improvement Metrics Report
==================================================

🎯 BASELINE STATUS
${status.baselineEstablished ? '✅ Baseline Established' : '⏳ Establishing Baseline'}

📊 CURRENT PERFORMANCE VS TARGETS
${Object.entries(status.performance).map(([metric, data]) => {
    const name = metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const statusIcon = data.status === 'meeting_target' ? '✅' : '❌';
    const unit = this.getMetricUnit(metric);
    return `${statusIcon} ${name}: ${data.current}${unit} (Target: ${data.target}${unit}) - ${data.percentage.toFixed(1)}%`;
}).join('\n')}

📈 IMPROVEMENT SUMMARY
Overall Improvement Rate: ${improvements.overall.improvementRate.toFixed(1)}%
Total Improvements: ${improvements.overall.totalImprovements}
Total Regressions: ${improvements.overall.totalRegressions}
Net Improvement: ${improvements.overall.netImprovement.toFixed(2)}%

🏆 CATEGORY PERFORMANCE
${Object.entries(improvements.categories).map(([category, data]) => {
    const name = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${name}: ${data.improvements}↑ ${data.regressions}↓ Net: ${data.net_gain.toFixed(2)}`;
}).join('\n')}

📅 RECENT TRENDS
Weekly: ${improvements.trends.weekly.improvements}↑ ${improvements.trends.weekly.regressions}↓ (Net: ${improvements.trends.weekly.netGain.toFixed(2)})
Monthly: ${improvements.trends.monthly.improvements}↑ ${improvements.trends.monthly.regressions}↓ (Net: ${improvements.trends.monthly.netGain.toFixed(2)})

🔥 RECENT IMPROVEMENTS
${improvements.recent.length > 0 ? improvements.recent.map(imp => {
    const direction = imp.improvement > 0 ? '📈' : '📉';
    const name = imp.metricType.replace(/_/g, ' ');
    return `${direction} ${name}: ${Math.abs(imp.improvement).toFixed(2)}${this.getMetricUnit(imp.metricType)} (${imp.type})`;
}).join('\n') : 'No recent improvements tracked'}

Last Updated: ${this.metrics.lastUpdated || 'Never'}
`;

        return output;
    }

    /**
     * CLI interface
     */
    static runCLI() {
        const args = process.argv.slice(2);
        const command = args[0];

        if (!command) {
            console.log('Usage: node performance-improvement-metrics.js <command> [options]');
            console.log('Commands:');
            console.log('  record <metric> <value> [context] - Record a performance metric');
            console.log('  baseline <metric> <target>       - Set baseline target for metric');
            console.log('  report                            - Generate comprehensive report');
            console.log('  status                            - Show current performance status');
            console.log('  metrics                           - List available metrics');
            console.log('  test                              - Run self-test');
            process.exit(1);
        }

        const metrics = new PerformanceImprovementMetrics();

        switch (command) {
            case 'record':
                const metric = args[1];
                const value = parseFloat(args[2]);
                const context = args[3] ? JSON.parse(args[3]) : {};

                if (!metric || isNaN(value)) {
                    console.error('❌ Metric type and numeric value required');
                    process.exit(1);
                }

                metrics.recordMetric(metric, value, context);
                break;

            case 'baseline':
                const baselineMetric = args[1];
                const target = parseFloat(args[2]);

                if (!baselineMetric || isNaN(target)) {
                    console.error('❌ Metric type and numeric target required');
                    process.exit(1);
                }

                metrics.baseline[baselineMetric].target = target;
                metrics.saveBaseline();
                console.log(`🎯 Set ${baselineMetric} target to ${target}${metrics.getMetricUnit(baselineMetric)}`);
                break;

            case 'report':
                console.log(metrics.generatePerformanceReport());
                break;

            case 'status':
                const status = metrics.getPerformanceStatus();
                console.log('🚀 Current Performance Status:');
                console.log(`Baseline Established: ${status.baselineEstablished ? '✅' : '⏳'}`);
                Object.entries(status.performance).forEach(([metric, data]) => {
                    const icon = data.status === 'meeting_target' ? '✅' : '❌';
                    console.log(`${icon} ${metric}: ${data.current}${metrics.getMetricUnit(metric)} (${data.percentage.toFixed(1)}%)`);
                });
                break;

            case 'metrics':
                console.log('📊 Available Metrics:');
                Object.keys(metrics.baseline).forEach(metric => {
                    if (typeof metrics.baseline[metric] === 'object') {
                        const unit = metrics.getMetricUnit(metric);
                        const target = metrics.baseline[metric].target;
                        console.log(`  ${metric}: Target ${target}${unit}`);
                    }
                });
                break;

            case 'test':
                metrics.runSelfTest();
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
        console.log('🧪 Running Performance Improvement Metrics Self-Test...');

        // Test recording metrics
        console.log('Testing metric recording...');
        this.recordMetric('responseTime', 850, { operation: 'test' });
        this.recordMetric('accuracy', 96.5, { task: 'classification' });
        this.recordMetric('errorRate', 1.2, { component: 'api' });

        // Test baseline establishment
        console.log('Testing baseline establishment...');
        this.baseline.established = true;
        this.saveBaseline();

        // Test improvement analysis
        console.log('Testing improvement analysis...');
        this.recordMetric('responseTime', 780, { operation: 'improved' }); // Should show improvement
        this.recordMetric('accuracy', 98.1, { task: 'classification' }); // Should show improvement

        // Test report generation
        console.log('Testing report generation...');
        const report = this.generatePerformanceReport();
        console.log('✅ Report generated successfully');

        console.log('🎉 Self-test completed successfully!');
    }
}

// CLI execution
if (require.main === module) {
    PerformanceImprovementMetrics.runCLI();
}

module.exports = PerformanceImprovementMetrics;