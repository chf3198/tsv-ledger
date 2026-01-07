#!/usr/bin/env node

/**
 * ROI Measurement for Optimizations
 * Measures return on investment for AI agent optimization initiatives
 */

const fs = require('fs');
const path = require('path');

class ROIMeasurementForOptimizations {
    constructor() {
        this.optimizationsPath = path.join(process.cwd(), 'data', 'optimization-roi.json');
        this.metricsPath = path.join(process.cwd(), 'data', 'roi-metrics.json');
        this.benefitsPath = path.join(process.cwd(), 'data', 'roi-benefits.json');

        this.optimizations = {
            initiatives: [], // Individual optimization initiatives
            categories: {
                instruction_optimization: { total: 0, successful: 0, totalROI: 0 },
                performance_improvement: { total: 0, successful: 0, totalROI: 0 },
                error_reduction: { total: 0, successful: 0, totalROI: 0 },
                user_satisfaction: { total: 0, successful: 0, totalROI: 0 },
                automation_enhancement: { total: 0, successful: 0, totalROI: 0 },
                infrastructure_improvement: { total: 0, successful: 0, totalROI: 0 }
            },
            trends: {
                quarterly: [],
                yearly: []
            },
            lastUpdated: null
        };

        this.metrics = {
            overallROI: 0,
            totalInvestment: 0,
            totalBenefits: 0,
            paybackPeriod: 0,
            benefitCostRatio: 0,
            successRate: 0,
            topPerformingCategories: [],
            roiDistribution: {
                excellent: 0, // ROI > 300%
                good: 0,      // ROI 100-300%
                moderate: 0,  // ROI 50-100%
                poor: 0,      // ROI 0-50%
                negative: 0   // ROI < 0%
            }
        };

        this.benefits = {
            quantitative: {
                time_saved: 0,
                cost_reduction: 0,
                error_prevention: 0,
                productivity_gain: 0,
                revenue_increase: 0
            },
            qualitative: {
                user_satisfaction: [],
                code_quality: [],
                maintainability: [],
                scalability: []
            },
            attribution: {} // Maps benefits to specific optimizations
        };

        this.initialize();
    }

    /**
     * Initialize the ROI measurement system
     */
    initialize() {
        this.loadOptimizations();
        this.loadMetrics();
        this.loadBenefits();
        console.log('💰 ROI Measurement for Optimizations initialized');
    }

    /**
     * Load optimizations data from file
     */
    loadOptimizations() {
        try {
            if (fs.existsSync(this.optimizationsPath)) {
                const data = JSON.parse(fs.readFileSync(this.optimizationsPath, 'utf8'));
                this.optimizations = { ...this.optimizations, ...data };
                console.log('💰 Loaded optimization ROI data');
            }
        } catch (error) {
            console.error('❌ Failed to load optimization ROI data:', error.message);
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
                console.log('💰 Loaded ROI metrics');
            }
        } catch (error) {
            console.error('❌ Failed to load ROI metrics:', error.message);
        }
    }

    /**
     * Load benefits data from file
     */
    loadBenefits() {
        try {
            if (fs.existsSync(this.benefitsPath)) {
                const data = JSON.parse(fs.readFileSync(this.benefitsPath, 'utf8'));
                this.benefits = { ...this.benefits, ...data };
                console.log('💰 Loaded ROI benefits data');
            }
        } catch (error) {
            console.error('❌ Failed to load ROI benefits data:', error.message);
        }
    }

    /**
     * Save optimizations data to file
     */
    saveOptimizations() {
        try {
            fs.writeFileSync(this.optimizationsPath, JSON.stringify(this.optimizations, null, 2));
            console.log('💾 Optimization ROI data saved');
        } catch (error) {
            console.error('❌ Failed to save optimization ROI data:', error.message);
        }
    }

    /**
     * Save metrics data to file
     */
    saveMetrics() {
        try {
            fs.writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
            console.log('💾 ROI metrics saved');
        } catch (error) {
            console.error('❌ Failed to save ROI metrics:', error.message);
        }
    }

    /**
     * Save benefits data to file
     */
    saveBenefits() {
        try {
            fs.writeFileSync(this.benefitsPath, JSON.stringify(this.benefits, null, 2));
            console.log('💾 ROI benefits data saved');
        } catch (error) {
            console.error('❌ Failed to save ROI benefits data:', error.message);
        }
    }

    /**
     * Record an optimization initiative
     */
    recordOptimization(category, name, description, investment, expectedBenefits, timeline = {}, context = {}) {
        if (!this.optimizations.categories[category]) {
            console.warn(`⚠️ Unknown optimization category: ${category}`);
            return false;
        }

        const optimization = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            category,
            name: name.trim(),
            description: description.trim(),
            investment: parseFloat(investment),
            expectedBenefits: parseFloat(expectedBenefits),
            actualBenefits: 0,
            roi: 0,
            status: 'planned', // planned, in_progress, completed, failed
            timeline,
            context,
            completedDate: null,
            measuredBenefits: []
        };

        this.optimizations.initiatives.push(optimization);
        this.optimizations.categories[category].total++;
        this.optimizations.lastUpdated = optimization.timestamp;

        // Update metrics
        this.updateMetrics();

        this.saveOptimizations();
        console.log(`💰 Recorded optimization: "${name}" (${category}) - Investment: $${investment}`);
        return optimization.id;
    }

    /**
     * Update optimization status and results
     */
    updateOptimization(optimizationId, status, actualBenefits = null, measuredBenefits = []) {
        const optimization = this.optimizations.initiatives.find(opt => opt.id === optimizationId);
        if (!optimization) {
            console.warn(`⚠️ Optimization not found: ${optimizationId}`);
            return false;
        }

        optimization.status = status;

        if (status === 'completed' && actualBenefits !== null) {
            optimization.actualBenefits = parseFloat(actualBenefits);
            optimization.roi = this.calculateROI(optimization.investment, optimization.actualBenefits);
            optimization.completedDate = new Date().toISOString();
            optimization.measuredBenefits = measuredBenefits;

            // Update category success metrics
            const category = this.optimizations.categories[optimization.category];
            category.successful++;
            category.totalROI += optimization.roi;

            // Update benefits attribution
            this.updateBenefitsAttribution(optimizationId, measuredBenefits);
        }

        // Update trends
        this.updateTrends(optimization);

        // Update metrics
        this.updateMetrics();

        this.saveOptimizations();
        console.log(`📊 Updated optimization ${optimizationId}: ${status}${actualBenefits !== null ? ` - ROI: ${optimization.roi.toFixed(1)}%` : ''}`);
        return true;
    }

    /**
     * Record quantitative benefits
     */
    recordQuantitativeBenefits(benefitType, value, attribution = [], context = {}) {
        if (!(benefitType in this.benefits.quantitative)) {
            console.warn(`⚠️ Unknown benefit type: ${benefitType}`);
            return false;
        }

        this.benefits.quantitative[benefitType] += parseFloat(value);

        // Update attribution
        attribution.forEach(optimizationId => {
            if (!this.benefits.attribution[optimizationId]) {
                this.benefits.attribution[optimizationId] = {
                    time_saved: 0,
                    cost_reduction: 0,
                    error_prevention: 0,
                    productivity_gain: 0,
                    revenue_increase: 0
                };
            }
            this.benefits.attribution[optimizationId][benefitType] += parseFloat(value);
        });

        // Update metrics
        this.updateMetrics();

        this.saveBenefits();
        console.log(`💰 Recorded ${benefitType}: +${value} (attributed to ${attribution.length} optimizations)`);
        return true;
    }

    /**
     * Record qualitative benefits
     */
    recordQualitativeBenefits(benefitType, description, rating, attribution = [], context = {}) {
        if (!this.benefits.qualitative[benefitType]) {
            console.warn(`⚠️ Unknown qualitative benefit type: ${benefitType}`);
            return false;
        }

        const benefit = {
            timestamp: new Date().toISOString(),
            description: description.trim(),
            rating: parseInt(rating), // 1-5 scale
            attribution,
            context
        };

        this.benefits.qualitative[benefitType].push(benefit);

        // Update metrics
        this.updateMetrics();

        this.saveBenefits();
        console.log(`💬 Recorded qualitative benefit: "${description}" (${benefitType}, rating: ${rating})`);
        return true;
    }

    /**
     * Calculate ROI percentage
     */
    calculateROI(investment, benefits) {
        if (investment <= 0) return 0;
        return ((benefits - investment) / investment) * 100;
    }

    /**
     * Update benefits attribution
     */
    updateBenefitsAttribution(optimizationId, measuredBenefits) {
        measuredBenefits.forEach(benefit => {
            if (!this.benefits.attribution[optimizationId]) {
                this.benefits.attribution[optimizationId] = {
                    time_saved: 0,
                    cost_reduction: 0,
                    error_prevention: 0,
                    productivity_gain: 0,
                    revenue_increase: 0
                };
            }

            if (benefit.type && benefit.value) {
                this.benefits.attribution[optimizationId][benefit.type] =
                    (this.benefits.attribution[optimizationId][benefit.type] || 0) + parseFloat(benefit.value);
            }
        });
    }

    /**
     * Update ROI trends
     */
    updateTrends(optimization) {
        const now = new Date();
        const quarterKey = this.getQuarterKey(now);
        const yearKey = now.getFullYear().toString();

        // Update quarterly trend
        let quarterData = this.optimizations.trends.quarterly.find(q => q.quarter === quarterKey);
        if (!quarterData) {
            quarterData = {
                quarter: quarterKey,
                investments: 0,
                benefits: 0,
                completedOptimizations: 0
            };
            this.optimizations.trends.quarterly.push(quarterData);
        }

        if (optimization.status === 'completed') {
            quarterData.investments += optimization.investment;
            quarterData.benefits += optimization.actualBenefits;
            quarterData.completedOptimizations++;
        }

        // Update yearly trend
        let yearData = this.optimizations.trends.yearly.find(y => y.year === yearKey);
        if (!yearData) {
            yearData = {
                year: yearKey,
                investments: 0,
                benefits: 0,
                completedOptimizations: 0
            };
            this.optimizations.trends.yearly.push(yearData);
        }

        if (optimization.status === 'completed') {
            yearData.investments += optimization.investment;
            yearData.benefits += optimization.actualBenefits;
            yearData.completedOptimizations++;
        }

        // Keep only last 8 quarters and 5 years
        this.optimizations.trends.quarterly = this.optimizations.trends.quarterly.slice(-8);
        this.optimizations.trends.yearly = this.optimizations.trends.yearly.slice(-5);
    }

    /**
     * Update overall metrics
     */
    updateMetrics() {
        const completedOptimizations = this.optimizations.initiatives.filter(opt => opt.status === 'completed');

        // Calculate overall metrics
        this.metrics.totalInvestment = completedOptimizations.reduce((sum, opt) => sum + opt.investment, 0);
        this.metrics.totalBenefits = completedOptimizations.reduce((sum, opt) => sum + opt.actualBenefits, 0);
        this.metrics.overallROI = this.calculateROI(this.metrics.totalInvestment, this.metrics.totalBenefits);

        // Calculate payback period (simple average)
        const avgInvestment = completedOptimizations.length > 0 ?
            this.metrics.totalInvestment / completedOptimizations.length : 0;
        const avgBenefit = completedOptimizations.length > 0 ?
            this.metrics.totalBenefits / completedOptimizations.length : 0;
        this.metrics.paybackPeriod = avgInvestment > 0 ? avgInvestment / (avgBenefit / 12) : 0; // months

        // Calculate benefit-cost ratio
        this.metrics.benefitCostRatio = this.metrics.totalInvestment > 0 ?
            this.metrics.totalBenefits / this.metrics.totalInvestment : 0;

        // Calculate success rate
        const totalOptimizations = this.optimizations.initiatives.length;
        this.metrics.successRate = totalOptimizations > 0 ?
            (completedOptimizations.length / totalOptimizations) * 100 : 0;

        // Update ROI distribution
        this.updateROIDistribution(completedOptimizations);

        // Identify top performing categories
        this.updateTopPerformingCategories();

        this.saveMetrics();
    }

    /**
     * Update ROI distribution
     */
    updateROIDistribution(completedOptimizations) {
        this.metrics.roiDistribution = {
            excellent: 0,
            good: 0,
            moderate: 0,
            poor: 0,
            negative: 0
        };

        completedOptimizations.forEach(opt => {
            if (opt.roi > 300) this.metrics.roiDistribution.excellent++;
            else if (opt.roi > 100) this.metrics.roiDistribution.good++;
            else if (opt.roi > 50) this.metrics.roiDistribution.moderate++;
            else if (opt.roi > 0) this.metrics.roiDistribution.poor++;
            else this.metrics.roiDistribution.negative++;
        });
    }

    /**
     * Update top performing categories
     */
    updateTopPerformingCategories() {
        this.metrics.topPerformingCategories = Object.entries(this.optimizations.categories)
            .filter(([, data]) => data.total > 0)
            .map(([category, data]) => ({
                category: category.replace(/_/g, ' '),
                successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
                averageROI: data.successful > 0 ? data.totalROI / data.successful : 0,
                totalOptimizations: data.total
            }))
            .sort((a, b) => b.averageROI - a.averageROI)
            .slice(0, 3);
    }

    /**
     * Get ROI summary
     */
    getROISummary() {
        return {
            overall: {
                roi: this.metrics.overallROI,
                totalInvestment: this.metrics.totalInvestment,
                totalBenefits: this.metrics.totalBenefits,
                paybackPeriod: this.metrics.paybackPeriod,
                benefitCostRatio: this.metrics.benefitCostRatio,
                successRate: this.metrics.successRate
            },
            distribution: this.metrics.roiDistribution,
            topCategories: this.metrics.topPerformingCategories,
            quantitativeBenefits: this.benefits.quantitative,
            qualitativeBenefits: {
                user_satisfaction: this.benefits.qualitative.user_satisfaction.length,
                code_quality: this.benefits.qualitative.code_quality.length,
                maintainability: this.benefits.qualitative.maintainability.length,
                scalability: this.benefits.qualitative.scalability.length
            },
            recentOptimizations: this.optimizations.initiatives.slice(-5)
        };
    }

    /**
     * Generate comprehensive ROI report
     */
    generateROIReport() {
        const summary = this.getROISummary();

        const output = `
💰 AI Agent Optimization ROI Measurement Report
==============================================

📊 OVERALL ROI METRICS
Overall ROI: ${summary.overall.roi.toFixed(1)}%
Total Investment: $${summary.overall.totalInvestment.toFixed(2)}
Total Benefits: $${summary.overall.totalBenefits.toFixed(2)}
Payback Period: ${summary.overall.paybackPeriod.toFixed(1)} months
Benefit-Cost Ratio: ${summary.overall.benefitCostRatio.toFixed(2)}:1
Success Rate: ${summary.overall.successRate.toFixed(1)}%

📈 ROI DISTRIBUTION
Excellent (>300%): ${summary.distribution.excellent}
Good (100-300%): ${summary.distribution.good}
Moderate (50-100%): ${summary.distribution.moderate}
Poor (0-50%): ${summary.distribution.poor}
Negative (<0%): ${summary.distribution.negative}

🏆 TOP PERFORMING CATEGORIES
${summary.topCategories.length > 0 ? summary.topCategories.map(cat => {
    return `🥇 ${cat.category}: ${cat.averageROI.toFixed(1)}% avg ROI, ${cat.successRate.toFixed(1)}% success (${cat.totalOptimizations} optimizations)`;
}).join('\n') : 'No completed optimizations yet'}

💰 QUANTITATIVE BENEFITS
Time Saved: ${summary.quantitativeBenefits.time_saved.toFixed(2)} hours
Cost Reduction: $${summary.quantitativeBenefits.cost_reduction.toFixed(2)}
Error Prevention: ${summary.quantitativeBenefits.error_prevention.toFixed(2)} errors prevented
Productivity Gain: ${summary.quantitativeBenefits.productivity_gain.toFixed(2)}%
Revenue Increase: $${summary.quantitativeBenefits.revenue_increase.toFixed(2)}

💬 QUALITATIVE BENEFITS
User Satisfaction Improvements: ${summary.qualitativeBenefits.user_satisfaction}
Code Quality Improvements: ${summary.qualitativeBenefits.code_quality}
Maintainability Improvements: ${summary.qualitativeBenefits.maintainability}
Scalability Improvements: ${summary.qualitativeBenefits.scalability}

🔄 RECENT OPTIMIZATIONS
${summary.recentOptimizations.length > 0 ? summary.recentOptimizations.map(opt => {
    const statusIcon = opt.status === 'completed' ? '✅' : opt.status === 'in_progress' ? '🔄' : '⏳';
    return `${statusIcon} ${opt.name}: ${opt.status} - Investment: $${opt.investment} - ${opt.status === 'completed' ? `ROI: ${opt.roi.toFixed(1)}%` : 'ROI: Pending'}`;
}).join('\n') : 'No optimizations recorded yet'}

📅 TRENDS
Quarterly Investment/Benefits (Last 4 quarters):
${this.optimizations.trends.quarterly.slice(-4).map(q => `${q.quarter}: $${q.investments.toFixed(0)}/$${q.benefits.toFixed(0)}`).join(', ')}

Yearly Investment/Benefits (Last 3 years):
${this.optimizations.trends.yearly.slice(-3).map(y => `${y.year}: $${y.investments.toFixed(0)}/$${y.benefits.toFixed(0)}`).join(', ')}

Last Updated: ${this.optimizations.lastUpdated || 'Never'}
`;

        return output;
    }

    /**
     * Generate unique ID for optimizations
     */
    generateId() {
        return 'opt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get quarter key for trend tracking
     */
    getQuarterKey(date) {
        const year = date.getFullYear();
        const quarter = Math.floor((date.getMonth() + 3) / 3);
        return `${year}-Q${quarter}`;
    }

    /**
     * CLI interface
     */
    static runCLI() {
        const args = process.argv.slice(2);
        const command = args[0];

        if (!command) {
            console.log('Usage: node roi-measurement-optimizations.js <command> [options]');
            console.log('Commands:');
            console.log('  record <category> <name> <desc> <investment> <expected> - Record optimization');
            console.log('  update <id> <status> [benefits] [measured]            - Update optimization status');
            console.log('  benefit <type> <value> [attribution]                   - Record quantitative benefit');
            console.log('  qualitative <type> <desc> <rating> [attribution]       - Record qualitative benefit');
            console.log('  report                                                 - Generate comprehensive report');
            console.log('  summary                                                - Show ROI summary');
            console.log('  categories                                             - List optimization categories');
            console.log('  test                                                   - Run self-test');
            process.exit(1);
        }

        const roi = new ROIMeasurementForOptimizations();

        switch (command) {
            case 'record':
                const category = args[1];
                const name = args[2];
                const desc = args[3];
                const investment = parseFloat(args[4]);
                const expected = parseFloat(args[5]);

                if (!category || !name || !desc || isNaN(investment) || isNaN(expected)) {
                    console.error('❌ Category, name, description, investment, and expected benefits required');
                    process.exit(1);
                }

                roi.recordOptimization(category, name, desc, investment, expected);
                break;

            case 'update':
                const id = args[1];
                const status = args[2];
                const benefits = args[3] ? parseFloat(args[3]) : null;
                const measured = args[4] ? JSON.parse(args[4]) : [];

                if (!id || !status) {
                    console.error('❌ Optimization ID and status required');
                    process.exit(1);
                }

                roi.updateOptimization(id, status, benefits, measured);
                break;

            case 'benefit':
                const benefitType = args[1];
                const value = parseFloat(args[2]);
                const attribution = args[3] ? JSON.parse(args[3]) : [];

                if (!benefitType || isNaN(value)) {
                    console.error('❌ Benefit type and value required');
                    process.exit(1);
                }

                roi.recordQuantitativeBenefits(benefitType, value, attribution);
                break;

            case 'qualitative':
                const qualType = args[1];
                const qualDesc = args[2];
                const rating = parseInt(args[3]);
                const qualAttribution = args[4] ? JSON.parse(args[4]) : [];

                if (!qualType || !qualDesc || isNaN(rating)) {
                    console.error('❌ Type, description, and rating (1-5) required');
                    process.exit(1);
                }

                roi.recordQualitativeBenefits(qualType, qualDesc, rating, qualAttribution);
                break;

            case 'report':
                console.log(roi.generateROIReport());
                break;

            case 'summary':
                const summary = roi.getROISummary();
                console.log('💰 ROI Summary:');
                console.log(`Overall ROI: ${summary.overall.roi.toFixed(1)}%`);
                console.log(`Total Investment: $${summary.overall.totalInvestment.toFixed(2)}`);
                console.log(`Total Benefits: $${summary.overall.totalBenefits.toFixed(2)}`);
                console.log(`Success Rate: ${summary.overall.successRate.toFixed(1)}%`);
                break;

            case 'categories':
                console.log('🏷️ Optimization Categories:');
                Object.keys(roi.optimizations.categories).forEach(cat => {
                    console.log(`  ${cat}`);
                });
                break;

            case 'test':
                roi.runSelfTest();
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
        console.log('🧪 Running ROI Measurement for Optimizations Self-Test...');

        // Test recording optimizations
        console.log('Testing optimization recording...');
        const optId1 = this.recordOptimization('instruction_optimization', 'NEFTune Implementation', 'Implement noise injection for better robustness', 500, 2000);
        const optId2 = this.recordOptimization('performance_improvement', 'Response Time Optimization', 'Reduce average response time by 20%', 300, 1200);

        // Test updating optimizations
        console.log('Testing optimization updates...');
        this.updateOptimization(optId1, 'completed', 2500, [
            { type: 'time_saved', value: 50 },
            { type: 'productivity_gain', value: 15 }
        ]);
        this.updateOptimization(optId2, 'in_progress');

        // Test recording benefits
        console.log('Testing benefit recording...');
        this.recordQuantitativeBenefits('time_saved', 25, [optId1]);
        this.recordQuantitativeBenefits('cost_reduction', 150, [optId1, optId2]);
        this.recordQualitativeBenefits('user_satisfaction', 'Users report much better experience', 5, [optId1]);

        // Test analytics
        console.log('Testing analytics calculation...');
        const analytics = this.getROISummary();
        console.log(`✅ Analytics calculated: ${analytics.overall.roi.toFixed(1)}% overall ROI`);

        // Test report generation
        console.log('Testing report generation...');
        const report = this.generateROIReport();
        console.log('✅ Report generated successfully');

        console.log('🎉 Self-test completed successfully!');
    }
}

// CLI execution
if (require.main === module) {
    ROIMeasurementForOptimizations.runCLI();
}

module.exports = ROIMeasurementForOptimizations;