#!/usr/bin/env node

/**
 * Performance Monitoring Tools
 * Monitor and analyze AI agent performance metrics
 */

const fs = require('fs');
const path = require('path');

class PerformanceMonitoringTools {
    constructor() {
        this.metrics = {
            responseTimes: [],
            accuracyScores: [],
            instructionCompliance: [],
            errorRates: [],
            resourceUsage: [],
            timestamps: []
        };

        this.baselines = {
            averageResponseTime: 1000, // ms
            targetAccuracy: 0.95,
            maxErrorRate: 0.05,
            maxResponseTime: 5000 // ms
        };

        this.alerts = [];
        this.performanceLog = path.join(process.cwd(), 'data', 'performance-metrics.json');
        this.currentSession = {
            startTime: new Date(),
            operations: 0,
            totalResponseTime: 0,
            errors: 0,
            accuracyScore: 0
        };
    }

    /**
     * Initialize performance monitoring
     */
    initialize() {
        this.ensureDataDirectory();
        this.loadExistingMetrics();
        console.log('📊 Performance Monitoring Tools initialized');
        return this;
    }

    /**
     * Ensure data directory exists
     */
    ensureDataDirectory() {
        const dataDir = path.dirname(this.performanceLog);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    /**
     * Load existing performance metrics
     */
    loadExistingMetrics() {
        try {
            if (fs.existsSync(this.performanceLog)) {
                const data = JSON.parse(fs.readFileSync(this.performanceLog, 'utf8'));
                this.metrics = { ...this.metrics, ...data.metrics };
                this.baselines = { ...this.baselines, ...data.baselines };
                console.log('📈 Loaded existing performance metrics');
            }
        } catch (error) {
            console.warn('Warning: Could not load existing metrics:', error.message);
        }
    }

    /**
     * Record a performance measurement
     */
    recordMeasurement(type, value, metadata = {}) {
        const timestamp = new Date();
        const measurement = {
            type,
            value,
            timestamp: timestamp.toISOString(),
            metadata
        };

        switch (type) {
            case 'responseTime':
                this.metrics.responseTimes.push(measurement);
                this.currentSession.totalResponseTime += value;
                break;
            case 'accuracy':
                this.metrics.accuracyScores.push(measurement);
                this.currentSession.accuracyScore = (this.currentSession.accuracyScore + value) / 2;
                break;
            case 'instructionCompliance':
                this.metrics.instructionCompliance.push(measurement);
                break;
            case 'error':
                this.metrics.errorRates.push(measurement);
                this.currentSession.errors++;
                break;
            case 'resourceUsage':
                this.metrics.resourceUsage.push(measurement);
                break;
        }

        this.metrics.timestamps.push(timestamp);
        this.currentSession.operations++;

        // Check for performance alerts
        this.checkPerformanceAlerts(measurement);

        // Auto-save after each measurement
        this.saveMetrics();

        return measurement;
    }

    /**
     * Record AI response performance
     */
    recordResponse(response, instruction, expectedOutcome = null) {
        const startTime = Date.now();

        // Simulate response processing (in real usage, this would be the actual response time)
        const responseTime = Math.random() * 2000 + 500; // 500-2500ms

        const endTime = startTime + responseTime;

        // Record response time
        this.recordMeasurement('responseTime', responseTime, {
            instruction: instruction.substring(0, 100),
            responseLength: response.length
        });

        // Calculate accuracy if expected outcome provided
        if (expectedOutcome) {
            const accuracy = this.calculateAccuracy(response, expectedOutcome);
            this.recordMeasurement('accuracy', accuracy, {
                instruction: instruction.substring(0, 100),
                expected: expectedOutcome
            });
        }

        // Check instruction compliance
        const compliance = this.checkInstructionCompliance(response, instruction);
        this.recordMeasurement('instructionCompliance', compliance.score, {
            instruction: instruction.substring(0, 100),
            violations: compliance.violations
        });

        return {
            responseTime,
            accuracy: expectedOutcome ? this.calculateAccuracy(response, expectedOutcome) : null,
            compliance: compliance.score
        };
    }

    /**
     * Calculate response accuracy
     */
    calculateAccuracy(response, expected) {
        // Simple accuracy calculation based on keyword matching
        const expectedKeywords = expected.toLowerCase().split(' ');
        const responseWords = response.toLowerCase().split(' ');

        let matches = 0;
        expectedKeywords.forEach(keyword => {
            if (keyword.length > 3 && responseWords.some(word => word.includes(keyword))) {
                matches++;
            }
        });

        return expectedKeywords.length > 0 ? matches / expectedKeywords.length : 0;
    }

    /**
     * Check instruction compliance
     */
    checkInstructionCompliance(response, instruction) {
        const violations = [];
        let score = 1.0;

        const lowerResponse = response.toLowerCase();
        const lowerInstruction = instruction.toLowerCase();

        // Check for file size compliance
        if (lowerInstruction.includes('file size') || lowerInstruction.includes('300')) {
            if (!lowerResponse.includes('300') && !lowerResponse.includes('limit')) {
                violations.push('Missing file size limit reference');
                score -= 0.3;
            }
        }

        // Check for commenting requirements
        if (lowerInstruction.includes('comment') || lowerInstruction.includes('doc')) {
            if (!lowerResponse.includes('jsdoc') && !lowerResponse.includes('document')) {
                violations.push('Missing documentation reference');
                score -= 0.2;
            }
        }

        // Check for git practices
        if (lowerInstruction.includes('git') || lowerInstruction.includes('commit')) {
            if (!lowerResponse.includes('conventional') && !lowerResponse.includes('feat:')) {
                violations.push('Missing git practice reference');
                score -= 0.2;
            }
        }

        return { score: Math.max(0, score), violations };
    }

    /**
     * Check for performance alerts
     */
    checkPerformanceAlerts(measurement) {
        const alert = {
            type: 'performance',
            timestamp: new Date().toISOString(),
            measurement: measurement,
            severity: 'low'
        };

        switch (measurement.type) {
            case 'responseTime':
                if (measurement.value > this.baselines.maxResponseTime) {
                    alert.severity = 'high';
                    alert.message = `Response time ${measurement.value}ms exceeds baseline ${this.baselines.maxResponseTime}ms`;
                    this.alerts.push(alert);
                } else if (measurement.value > this.baselines.averageResponseTime * 2) {
                    alert.severity = 'medium';
                    alert.message = `Response time ${measurement.value}ms is 2x baseline average`;
                    this.alerts.push(alert);
                }
                break;

            case 'accuracy':
                if (measurement.value < this.baselines.targetAccuracy * 0.8) {
                    alert.severity = 'high';
                    alert.message = `Accuracy ${measurement.value.toFixed(2)} below 80% of target ${this.baselines.targetAccuracy}`;
                    this.alerts.push(alert);
                }
                break;

            case 'error':
                if (this.currentSession.errors / this.currentSession.operations > this.baselines.maxErrorRate) {
                    alert.severity = 'medium';
                    alert.message = `Error rate ${(this.currentSession.errors / this.currentSession.operations).toFixed(2)} exceeds baseline ${this.baselines.maxErrorRate}`;
                    this.alerts.push(alert);
                }
                break;
        }
    }

    /**
     * Get performance analytics
     */
    getAnalytics(timeRange = 'all') {
        const now = new Date();
        let filterStart = new Date(0);

        switch (timeRange) {
            case 'hour':
                filterStart = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case 'day':
                filterStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
        }

        const filterMeasurements = (measurements) => {
            return measurements.filter(m => new Date(m.timestamp) >= filterStart);
        };

        const filteredResponseTimes = filterMeasurements(this.metrics.responseTimes);
        const filteredAccuracyScores = filterMeasurements(this.metrics.accuracyScores);
        const filteredCompliance = filterMeasurements(this.metrics.instructionCompliance);
        const filteredErrors = filterMeasurements(this.metrics.errorRates);

        const totalOperations = Math.max(
            filteredResponseTimes.length,
            filteredAccuracyScores.length,
            filteredCompliance.length
        );

        const analytics = {
            timeRange,
            summary: {
                totalOperations: totalOperations,
                averageResponseTime: this.calculateAverage(filteredResponseTimes),
                averageAccuracy: this.calculateAverage(filteredAccuracyScores),
                averageCompliance: this.calculateAverage(filteredCompliance),
                errorRate: totalOperations > 0 ? filteredErrors.length / totalOperations : 0,
                sessionDuration: Date.now() - this.currentSession.startTime.getTime()
            },
            trends: {
                responseTimeTrend: this.calculateTrend(filteredResponseTimes),
                accuracyTrend: this.calculateTrend(filteredAccuracyScores),
                complianceTrend: this.calculateTrend(filteredCompliance)
            },
            alerts: this.alerts.slice(-10), // Last 10 alerts
            baselines: this.baselines
        };

        return analytics;
    }

    /**
     * Calculate average of measurements
     */
    calculateAverage(measurements) {
        if (measurements.length === 0) return 0;
        const sum = measurements.reduce((acc, m) => acc + m.value, 0);
        return sum / measurements.length;
    }

    /**
     * Calculate trend (improving/declining/stable)
     */
    calculateTrend(measurements) {
        if (measurements.length < 5) return 'insufficient_data';

        const recent = measurements.slice(-5);
        const older = measurements.slice(-10, -5);

        if (older.length === 0) return 'insufficient_data';

        const recentAvg = this.calculateAverage(recent);
        const olderAvg = this.calculateAverage(older);

        const change = recentAvg - olderAvg;
        const threshold = Math.abs(olderAvg * 0.1); // 10% change threshold

        if (change > threshold) return 'improving';
        if (change < -threshold) return 'declining';
        return 'stable';
    }

    /**
     * Generate performance report
     */
    generateReport(timeRange = 'all') {
        const analytics = this.getAnalytics(timeRange);

        let report = `📊 AI Agent Performance Report (${timeRange.toUpperCase()})\n`;
        report += '=' .repeat(50) + '\n\n';

        report += '📈 SUMMARY METRICS\n';
        report += `Total Operations: ${analytics.summary.totalOperations}\n`;
        report += `Average Response Time: ${analytics.summary.averageResponseTime.toFixed(0)}ms\n`;
        report += `Average Accuracy: ${(analytics.summary.averageAccuracy * 100).toFixed(1)}%\n`;
        report += `Average Compliance: ${(analytics.summary.averageCompliance * 100).toFixed(1)}%\n`;
        report += `Error Rate: ${(analytics.summary.errorRate * 100).toFixed(1)}%\n`;
        report += `Session Duration: ${(analytics.summary.sessionDuration / 1000).toFixed(0)}s\n\n`;

        report += '📊 PERFORMANCE TRENDS\n';
        report += `Response Time: ${analytics.trends.responseTimeTrend.toUpperCase()}\n`;
        report += `Accuracy: ${analytics.trends.accuracyTrend.toUpperCase()}\n`;
        report += `Compliance: ${analytics.trends.complianceTrend.toUpperCase()}\n\n`;

        if (analytics.alerts.length > 0) {
            report += '🚨 RECENT ALERTS\n';
            analytics.alerts.slice(-5).forEach((alert, index) => {
                report += `${index + 1}. [${alert.severity.toUpperCase()}] ${alert.message}\n`;
            });
            report += '\n';
        }

        report += '🎯 BASELINE TARGETS\n';
        report += `Target Response Time: <${analytics.baselines.averageResponseTime}ms\n`;
        report += `Target Accuracy: >${(analytics.baselines.targetAccuracy * 100).toFixed(0)}%\n`;
        report += `Max Error Rate: <${(analytics.baselines.maxErrorRate * 100).toFixed(0)}%\n`;

        return report;
    }

    /**
     * Save performance metrics
     */
    saveMetrics() {
        const data = {
            metrics: this.metrics,
            baselines: this.baselines,
            currentSession: this.currentSession,
            alerts: this.alerts,
            lastUpdated: new Date().toISOString()
        };

        try {
            fs.writeFileSync(this.performanceLog, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving performance metrics:', error.message);
        }
    }

    /**
     * Export performance data
     */
    exportData(format = 'json', timeRange = 'all') {
        const analytics = this.getAnalytics(timeRange);
        const exportPath = path.join(process.cwd(), 'reports', `performance-export-${timeRange}-${Date.now()}.${format}`);

        if (!fs.existsSync(path.dirname(exportPath))) {
            fs.mkdirSync(path.dirname(exportPath), { recursive: true });
        }

        if (format === 'json') {
            fs.writeFileSync(exportPath, JSON.stringify(analytics, null, 2));
        } else if (format === 'csv') {
            const csvData = this.convertToCSV(analytics);
            fs.writeFileSync(exportPath, csvData);
        }

        console.log(`📊 Performance data exported to ${exportPath}`);
        return exportPath;
    }

    /**
     * Convert analytics to CSV
     */
    convertToCSV(analytics) {
        const headers = ['metric', 'value', 'trend'];
        const rows = [headers.join(',')];

        rows.push(['total_operations', analytics.summary.totalOperations, '']);
        rows.push(['avg_response_time', analytics.summary.averageResponseTime.toFixed(2), analytics.trends.responseTimeTrend]);
        rows.push(['avg_accuracy', analytics.summary.averageAccuracy.toFixed(4), analytics.trends.accuracyTrend]);
        rows.push(['avg_compliance', analytics.summary.averageCompliance.toFixed(4), analytics.trends.complianceTrend]);
        rows.push(['error_rate', analytics.summary.errorRate.toFixed(4), '']);

        return rows.join('\n');
    }

    /**
     * Update performance baselines
     */
    updateBaselines(newBaselines) {
        this.baselines = { ...this.baselines, ...newBaselines };
        this.saveMetrics();
        console.log('🎯 Performance baselines updated');
    }

    /**
     * Reset performance data
     */
    reset() {
        this.metrics = {
            responseTimes: [],
            accuracyScores: [],
            instructionCompliance: [],
            errorRates: [],
            resourceUsage: [],
            timestamps: []
        };
        this.alerts = [];
        this.currentSession = {
            startTime: new Date(),
            operations: 0,
            totalResponseTime: 0,
            errors: 0,
            accuracyScore: 0
        };
        this.saveMetrics();
        console.log('🔄 Performance data reset');
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new PerformanceMonitoringTools().initialize();

    const command = process.argv[2];

    switch (command) {
        case 'record':
            // Example: node performance-monitoring-tools.js record responseTime 1500
            const type = process.argv[3];
            const value = parseFloat(process.argv[4]);
            if (!type || isNaN(value)) {
                console.log('Usage: node performance-monitoring-tools.js record <type> <value>');
                process.exit(1);
            }
            monitor.recordMeasurement(type, value);
            console.log(`✅ Recorded ${type}: ${value}`);
            break;

        case 'response':
            // Example: node performance-monitoring-tools.js response "test response" "file size instruction"
            const response = process.argv[3] || 'Test response';
            const instruction = process.argv[4] || 'Test instruction';
            const expected = process.argv[5];

            const metrics = monitor.recordResponse(response, instruction, expected);
            console.log('📊 Response Metrics:');
            console.log(`  Response Time: ${metrics.responseTime.toFixed(0)}ms`);
            if (metrics.accuracy !== null) {
                console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
            }
            console.log(`  Compliance: ${(metrics.compliance * 100).toFixed(1)}%`);
            break;

        case 'analytics':
            const timeRange = process.argv[3] || 'all';
            const analytics = monitor.getAnalytics(timeRange);
            console.log('\n📊 Performance Analytics');
            console.log(`Time Range: ${timeRange.toUpperCase()}`);
            console.log(`Operations: ${analytics.summary.totalOperations}`);
            console.log(`Avg Response Time: ${analytics.summary.averageResponseTime.toFixed(0)}ms`);
            console.log(`Avg Accuracy: ${(analytics.summary.averageAccuracy * 100).toFixed(1)}%`);
            console.log(`Avg Compliance: ${(analytics.summary.averageCompliance * 100).toFixed(1)}%`);
            console.log(`Error Rate: ${(analytics.summary.errorRate * 100).toFixed(1)}%`);

            console.log('\n📈 Trends:');
            console.log(`Response Time: ${analytics.trends.responseTimeTrend}`);
            console.log(`Accuracy: ${analytics.trends.accuracyTrend}`);
            console.log(`Compliance: ${analytics.trends.complianceTrend}`);
            break;

        case 'report':
            const reportRange = process.argv[3] || 'all';
            const report = monitor.generateReport(reportRange);
            console.log(report);
            break;

        case 'export':
            const exportFormat = process.argv[3] || 'json';
            const exportRange = process.argv[4] || 'all';
            monitor.exportData(exportFormat, exportRange);
            break;

        case 'baseline':
            // Example: node performance-monitoring-tools.js baseline averageResponseTime 800
            const baselineKey = process.argv[3];
            const baselineValue = parseFloat(process.argv[4]);
            if (!baselineKey || isNaN(baselineValue)) {
                console.log('Usage: node performance-monitoring-tools.js baseline <key> <value>');
                process.exit(1);
            }
            monitor.updateBaselines({ [baselineKey]: baselineValue });
            break;

        case 'reset':
            monitor.reset();
            break;

        default:
            console.log('Usage: node performance-monitoring-tools.js <command> [options]');
            console.log('Commands:');
            console.log('  record <type> <value>     - Record a performance measurement');
            console.log('  response <resp> <inst>    - Record AI response performance');
            console.log('  analytics [range]         - Show performance analytics');
            console.log('  report [range]            - Generate performance report');
            console.log('  export [format] [range]   - Export performance data');
            console.log('  baseline <key> <value>    - Update performance baseline');
            console.log('  reset                     - Reset performance data');
            process.exit(1);
    }
}

module.exports = PerformanceMonitoringTools;