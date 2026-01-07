#!/usr/bin/env node

/**
 * Git Workflow Compliance Tracking System
 * Tracks compliance with git workflows and provides metrics and reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitWorkflowComplianceTracker {
    constructor() {
        this.metrics = {
            commits: {
                total: 0,
                conventional: 0,
                nonConventional: 0,
                byType: {},
                byScope: {},
                averageLength: 0
            },
            branches: {
                total: 0,
                compliant: 0,
                nonCompliant: 0,
                byStrategy: {},
                averageAge: 0
            },
            merges: {
                total: 0,
                clean: 0,
                conflicted: 0,
                autoResolved: 0,
                averageConflicts: 0
            },
            pullRequests: {
                total: 0,
                approved: 0,
                rejected: 0,
                averageReviewTime: 0
            }
        };

        this.complianceRules = {
            commitMessage: {
                conventionalFormat: true,
                maxLength: 72,
                imperativeMood: true,
                noPeriod: true,
                meaningfulScope: true
            },
            branching: {
                strategy: 'github-flow', // or 'git-flow', 'trunk-based'
                namingConvention: true,
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                requirePullRequests: true
            },
            merging: {
                requireCleanMerge: false, // Allow some conflicts
                maxConflicts: 10,
                requireReview: true
            }
        };

        this.trackingPeriod = {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            end: new Date()
        };
    }

    /**
     * Analyze overall git workflow compliance
     */
    analyzeCompliance(options = {}) {
        const period = options.period || this.trackingPeriod;
        const analysis = {
            period: period,
            metrics: this.collectMetrics(period),
            compliance: this.calculateComplianceScores(),
            violations: this.identifyViolations(),
            recommendations: this.generateRecommendations(),
            trends: this.analyzeTrends(),
            report: this.generateComplianceReport()
        };

        return analysis;
    }

    /**
     * Collect comprehensive git metrics
     */
    collectMetrics(period) {
        const metrics = {
            commits: this.analyzeCommits(period),
            branches: this.analyzeBranches(),
            merges: this.analyzeMerges(period),
            pullRequests: this.analyzePullRequests(period)
        };

        // Update instance metrics
        Object.assign(this.metrics, metrics);

        return metrics;
    }

    /**
     * Analyze commit compliance
     */
    analyzeCommits(period) {
        try {
            const since = period.start.toISOString();
            const until = period.end.toISOString();

            // Get all commits in the period
            const commitLog = execSync(
                `git log --oneline --since="${since}" --until="${until}" --pretty=format:"%H|%s|%an|%ae|%ad" --date=iso`,
                { encoding: 'utf8' }
            ).split('\n').filter(line => line.trim());

            const commits = {
                total: commitLog.length,
                conventional: 0,
                nonConventional: 0,
                byType: {},
                byScope: {},
                lengths: [],
                violations: []
            };

            commitLog.forEach(line => {
                const [hash, subject, author, email, date] = line.split('|');
                const analysis = this.analyzeCommitMessage(subject);

                if (analysis.conventional) {
                    commits.conventional++;
                    commits.byType[analysis.type] = (commits.byType[analysis.type] || 0) + 1;
                    if (analysis.scope) {
                        commits.byScope[analysis.scope] = (commits.byScope[analysis.scope] || 0) + 1;
                    }
                } else {
                    commits.nonConventional++;
                    commits.violations.push({
                        hash: hash.substring(0, 8),
                        subject: subject,
                        violations: analysis.violations
                    });
                }

                commits.lengths.push(subject.length);
            });

            commits.averageLength = commits.lengths.length > 0 ?
                commits.lengths.reduce((a, b) => a + b, 0) / commits.lengths.length : 0;

            return commits;
        } catch (error) {
            return {
                total: 0,
                conventional: 0,
                nonConventional: 0,
                byType: {},
                byScope: {},
                averageLength: 0,
                error: error.message
            };
        }
    }

    /**
     * Analyze commit message compliance
     */
    analyzeCommitMessage(subject) {
        const analysis = {
            conventional: false,
            type: null,
            scope: null,
            violations: []
        };

        // Check conventional commit format: type(scope): description
        const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?: (.+)$/;
        const match = subject.match(conventionalRegex);

        if (!match) {
            analysis.violations.push('Not in conventional commit format');
            return analysis;
        }

        const [, type, scope, description] = match;

        // Validate type
        const validTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build', 'revert'];
        if (!validTypes.includes(type)) {
            analysis.violations.push(`Invalid commit type: ${type}`);
        } else {
            analysis.type = type;
        }

        // Validate scope (optional but should be meaningful if present)
        if (scope) {
            if (scope.length < 2 || !/^[a-zA-Z0-9\-_]+$/.test(scope)) {
                analysis.violations.push(`Invalid scope format: ${scope}`);
            } else {
                analysis.scope = scope;
            }
        }

        // Check description rules
        if (description.length > this.complianceRules.commitMessage.maxLength) {
            analysis.violations.push(`Description too long (${description.length} chars, max ${this.complianceRules.commitMessage.maxLength})`);
        }

        if (description.endsWith('.')) {
            analysis.violations.push('Description should not end with a period');
        }

        // Check imperative mood (basic check)
        const imperativeWords = ['add', 'update', 'fix', 'remove', 'create', 'delete', 'refactor', 'improve', 'change'];
        const firstWord = description.toLowerCase().split(' ')[0];
        if (!imperativeWords.some(word => firstWord.startsWith(word))) {
            analysis.violations.push('Description should use imperative mood');
        }

        analysis.conventional = analysis.violations.length === 0;

        return analysis;
    }

    /**
     * Analyze branch compliance
     */
    analyzeBranches() {
        try {
            const branches = execSync('git branch --list --format="%(refname:short)"', { encoding: 'utf8' })
                .split('\n')
                .map(b => b.trim())
                .filter(b => b && !b.startsWith('remotes/'));

            const analysis = {
                total: branches.length,
                compliant: 0,
                nonCompliant: 0,
                byStrategy: {},
                ages: [],
                violations: []
            };

            branches.forEach(branch => {
                const branchAnalysis = this.analyzeBranch(branch);
                analysis.byStrategy[branchAnalysis.strategy] = (analysis.byStrategy[branchAnalysis.strategy] || 0) + 1;

                if (branchAnalysis.compliant) {
                    analysis.compliant++;
                } else {
                    analysis.nonCompliant++;
                    analysis.violations.push({
                        branch: branch,
                        violations: branchAnalysis.violations
                    });
                }

                if (branchAnalysis.age !== null) {
                    analysis.ages.push(branchAnalysis.age);
                }
            });

            analysis.averageAge = analysis.ages.length > 0 ?
                analysis.ages.reduce((a, b) => a + b, 0) / analysis.ages.length : 0;

            return analysis;
        } catch (error) {
            return {
                total: 0,
                compliant: 0,
                nonCompliant: 0,
                byStrategy: {},
                averageAge: 0,
                error: error.message
            };
        }
    }

    /**
     * Analyze individual branch
     */
    analyzeBranch(branchName) {
        const analysis = {
            compliant: true,
            strategy: 'unknown',
            age: null,
            violations: []
        };

        // Determine strategy based on naming
        if (branchName === 'main' || branchName === 'master') {
            analysis.strategy = 'main';
        } else if (branchName.startsWith('feature/')) {
            analysis.strategy = 'feature';
        } else if (branchName.startsWith('bugfix/') || branchName.startsWith('fix/')) {
            analysis.strategy = 'bugfix';
        } else if (branchName.startsWith('hotfix/')) {
            analysis.strategy = 'hotfix';
        } else if (branchName.startsWith('release/')) {
            analysis.strategy = 'release';
        } else {
            analysis.strategy = 'other';
        }

        // Check naming compliance
        if (this.complianceRules.branching.namingConvention) {
            const validPattern = /^[a-zA-Z0-9\-_\/]+$/;
            if (!validPattern.test(branchName)) {
                analysis.violations.push('Invalid branch name characters');
                analysis.compliant = false;
            }

            if (branchName.length > 50) {
                analysis.violations.push('Branch name too long');
                analysis.compliant = false;
            }
        }

        // Check branch age
        try {
            const ageOutput = execSync(`git log --oneline -1 --format="%ct" ${branchName}`, { encoding: 'utf8' }).trim();
            if (ageOutput) {
                const commitTime = parseInt(ageOutput) * 1000;
                analysis.age = Date.now() - commitTime;

                if (analysis.age > this.complianceRules.branching.maxAge) {
                    analysis.violations.push(`Branch is too old (${Math.round(analysis.age / (24 * 60 * 60 * 1000))} days)`);
                    analysis.compliant = false;
                }
            }
        } catch (error) {
            // Branch might not have commits
        }

        return analysis;
    }

    /**
     * Analyze merge compliance
     */
    analyzeMerges(period) {
        try {
            const since = period.start.toISOString();
            const until = period.end.toISOString();

            // Get merge commits
            const mergeLog = execSync(
                `git log --oneline --merges --since="${since}" --until="${until}" --pretty=format:"%H|%s|%an|%ae|%ad|%p" --date=iso`,
                { encoding: 'utf8' }
            ).split('\n').filter(line => line.trim());

            const merges = {
                total: mergeLog.length,
                clean: 0,
                conflicted: 0,
                autoResolved: 0,
                conflicts: [],
                averageConflicts: 0
            };

            mergeLog.forEach(line => {
                const [hash, subject, author, email, date, parents] = line.split('|');
                const parentCount = parents.split(' ').length;

                // Check if merge was clean (only 2 parents) or had conflicts
                if (parentCount === 2) {
                    merges.clean++;
                } else {
                    merges.conflicted++;
                    // Estimate conflicts based on parent count (rough approximation)
                    const estimatedConflicts = Math.max(0, parentCount - 2);
                    merges.conflicts.push(estimatedConflicts);
                }
            });

            if (merges.conflicts.length > 0) {
                merges.averageConflicts = merges.conflicts.reduce((a, b) => a + b, 0) / merges.conflicts.length;
            }

            return merges;
        } catch (error) {
            return {
                total: 0,
                clean: 0,
                conflicted: 0,
                autoResolved: 0,
                averageConflicts: 0,
                error: error.message
            };
        }
    }

    /**
     * Analyze pull request compliance (simplified - would need GitHub API in real implementation)
     */
    analyzePullRequests(period) {
        // This is a simplified version. In a real implementation, this would integrate with GitHub/GitLab API
        return {
            total: 0,
            approved: 0,
            rejected: 0,
            averageReviewTime: 0,
            note: 'Pull request analysis requires API integration with Git hosting service'
        };
    }

    /**
     * Calculate compliance scores
     */
    calculateComplianceScores() {
        const scores = {
            overall: 0,
            commits: 0,
            branches: 0,
            merges: 0,
            pullRequests: 0
        };

        // Commit compliance score
        if (this.metrics.commits.total > 0) {
            scores.commits = (this.metrics.commits.conventional / this.metrics.commits.total) * 100;
        }

        // Branch compliance score
        if (this.metrics.branches.total > 0) {
            scores.branches = (this.metrics.branches.compliant / this.metrics.branches.total) * 100;
        }

        // Merge compliance score (prefer clean merges)
        if (this.metrics.merges.total > 0) {
            const cleanRatio = this.metrics.merges.clean / this.metrics.merges.total;
            const conflictPenalty = Math.min(this.metrics.merges.averageConflicts / 10, 1) * 20; // Max 20 point penalty
            scores.merges = Math.max(0, (cleanRatio * 100) - conflictPenalty);
        }

        // Overall score (weighted average)
        const weights = { commits: 0.4, branches: 0.3, merges: 0.2, pullRequests: 0.1 };
        scores.overall = Math.round(
            (scores.commits * weights.commits) +
            (scores.branches * weights.branches) +
            (scores.merges * weights.merges) +
            (scores.pullRequests * weights.pullRequests)
        );

        return scores;
    }

    /**
     * Identify compliance violations
     */
    identifyViolations() {
        const violations = {
            critical: [],
            warning: [],
            info: []
        };

        // Commit violations
        if (this.metrics.commits.nonConventional > 0) {
            const percentage = (this.metrics.commits.nonConventional / this.metrics.commits.total) * 100;
            if (percentage > 20) {
                violations.critical.push(`${percentage.toFixed(1)}% of commits are non-conventional`);
            } else if (percentage > 10) {
                violations.warning.push(`${percentage.toFixed(1)}% of commits are non-conventional`);
            }
        }

        // Branch violations
        if (this.metrics.branches.nonCompliant > 0) {
            const percentage = (this.metrics.branches.nonCompliant / this.metrics.branches.total) * 100;
            if (percentage > 30) {
                violations.critical.push(`${percentage.toFixed(1)}% of branches are non-compliant`);
            } else if (percentage > 15) {
                violations.warning.push(`${percentage.toFixed(1)}% of branches are non-compliant`);
            }
        }

        // Old branches
        if (this.metrics.branches.averageAge > this.complianceRules.branching.maxAge * 0.8) {
            violations.warning.push('Average branch age is high - consider cleaning up old branches');
        }

        // Merge conflicts
        if (this.metrics.merges.averageConflicts > 5) {
            violations.warning.push('High average merge conflicts - consider improving conflict resolution');
        }

        return violations;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        const scores = this.calculateComplianceScores();

        if (scores.commits < 80) {
            recommendations.push({
                category: 'commits',
                priority: 'high',
                message: 'Improve commit message quality - use conventional commit format',
                actions: [
                    'Use commit message linter',
                    'Provide commit message templates',
                    'Train team on conventional commits'
                ]
            });
        }

        if (scores.branches < 80) {
            recommendations.push({
                category: 'branches',
                priority: 'medium',
                message: 'Standardize branch naming and lifecycle management',
                actions: [
                    'Define branch naming conventions',
                    'Set up branch cleanup policies',
                    'Implement branch protection rules'
                ]
            });
        }

        if (scores.merges < 80) {
            recommendations.push({
                category: 'merges',
                priority: 'medium',
                message: 'Reduce merge conflicts through better practices',
                actions: [
                    'Keep branches short-lived',
                    'Communicate changes early',
                    'Use feature flags for conflicting changes'
                ]
            });
        }

        if (this.metrics.branches.averageAge > 7 * 24 * 60 * 60 * 1000) { // 7 days
            recommendations.push({
                category: 'maintenance',
                priority: 'low',
                message: 'Clean up old branches regularly',
                actions: [
                    'Set up automated branch cleanup',
                    'Review branch purposes periodically',
                    'Archive completed feature branches'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Analyze trends over time
     */
    analyzeTrends() {
        // Simplified trend analysis - in real implementation would compare with historical data
        const trends = {
            commitQuality: 'stable',
            branchHealth: 'stable',
            mergeEfficiency: 'stable',
            overallCompliance: 'stable'
        };

        const scores = this.calculateComplianceScores();

        // Basic trend indicators based on current metrics
        if (scores.commits > 90) {
            trends.commitQuality = 'excellent';
        } else if (scores.commits > 75) {
            trends.commitQuality = 'good';
        } else if (scores.commits < 60) {
            trends.commitQuality = 'needs-improvement';
        }

        if (scores.branches > 90) {
            trends.branchHealth = 'excellent';
        } else if (scores.branches > 75) {
            trends.branchHealth = 'good';
        } else if (scores.branches < 60) {
            trends.branchHealth = 'needs-improvement';
        }

        return trends;
    }

    /**
     * Generate compliance report
     */
    generateComplianceReport() {
        const scores = this.calculateComplianceScores();
        const violations = this.identifyViolations();

        const report = {
            summary: {
                period: `${this.trackingPeriod.start.toISOString().split('T')[0]} to ${this.trackingPeriod.end.toISOString().split('T')[0]}`,
                overallScore: scores.overall,
                grade: this.getGrade(scores.overall)
            },
            metrics: this.metrics,
            compliance: scores,
            violations: violations,
            recommendations: this.generateRecommendations(),
            trends: this.analyzeTrends()
        };

        return report;
    }

    /**
     * Get grade based on score
     */
    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Save compliance report
     */
    saveComplianceReport(analysis, filePath = 'git-compliance-report.json') {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: analysis
        };

        const reportsDir = path.dirname(path.join(process.cwd(), 'reports', filePath));
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(path.join(process.cwd(), 'reports', filePath), JSON.stringify(report, null, 2));
        console.log(`Git workflow compliance report saved to reports/${filePath}`);

        return path.join(process.cwd(), 'reports', filePath);
    }

    /**
     * Set compliance rules
     */
    setComplianceRules(rules) {
        Object.assign(this.complianceRules, rules);
    }

    /**
     * Set tracking period
     */
    setTrackingPeriod(start, end) {
        this.trackingPeriod = {
            start: new Date(start),
            end: new Date(end)
        };
    }
}

// CLI interface
if (require.main === module) {
    const tracker = new GitWorkflowComplianceTracker();

    const command = process.argv[2];

    switch (command) {
        case 'analyze':
            console.log('🔍 Analyzing git workflow compliance...');
            const analysis = tracker.analyzeCompliance();

            console.log(`\n📊 Compliance Report (${analysis.report.summary.period})`);
            console.log(`Overall Score: ${analysis.report.summary.overallScore}/100 (${analysis.report.summary.grade})`);

            console.log('\n📈 Detailed Scores:');
            Object.entries(analysis.compliance).forEach(([category, score]) => {
                if (category !== 'overall') {
                    console.log(`  ${category}: ${score.toFixed(1)}/100`);
                }
            });

            console.log('\n📋 Key Metrics:');
            console.log(`  Commits: ${analysis.metrics.commits.total} total (${analysis.metrics.commits.conventional} conventional)`);
            console.log(`  Branches: ${analysis.metrics.branches.total} total (${analysis.metrics.branches.compliant} compliant)`);
            console.log(`  Merges: ${analysis.metrics.merges.total} total (${analysis.metrics.merges.clean} clean)`);

            if (analysis.violations.critical.length > 0) {
                console.log('\n🚨 Critical Violations:');
                analysis.violations.critical.forEach(v => console.log(`  • ${v}`));
            }

            if (analysis.violations.warning.length > 0) {
                console.log('\n⚠️  Warnings:');
                analysis.violations.warning.forEach(v => console.log(`  • ${v}`));
            }

            if (analysis.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                analysis.recommendations.forEach(rec => {
                    console.log(`  • ${rec.message}`);
                    rec.actions.forEach(action => console.log(`    - ${action}`));
                });
            }

            tracker.saveComplianceReport(analysis);
            break;

        case 'commits':
            const commitMetrics = tracker.analyzeCommits(tracker.trackingPeriod);
            console.log('\n📝 Commit Analysis:');
            console.log(`Total commits: ${commitMetrics.total}`);
            console.log(`Conventional: ${commitMetrics.conventional} (${((commitMetrics.conventional/commitMetrics.total)*100).toFixed(1)}%)`);
            console.log(`Average length: ${commitMetrics.averageLength.toFixed(1)} chars`);

            if (Object.keys(commitMetrics.byType).length > 0) {
                console.log('\n📊 By Type:');
                Object.entries(commitMetrics.byType).forEach(([type, count]) => {
                    console.log(`  ${type}: ${count}`);
                });
            }

            if (commitMetrics.violations.length > 0) {
                console.log('\n❌ Recent Violations:');
                commitMetrics.violations.slice(0, 5).forEach(v => {
                    console.log(`  ${v.hash}: ${v.subject}`);
                    v.violations.forEach(violation => console.log(`    - ${violation}`));
                });
            }
            break;

        case 'branches':
            const branchMetrics = tracker.analyzeBranches();
            console.log('\n🌿 Branch Analysis:');
            console.log(`Total branches: ${branchMetrics.total}`);
            console.log(`Compliant: ${branchMetrics.compliant} (${((branchMetrics.compliant/branchMetrics.total)*100).toFixed(1)}%)`);
            console.log(`Average age: ${Math.round(branchMetrics.averageAge / (24 * 60 * 60 * 1000))} days`);

            if (Object.keys(branchMetrics.byStrategy).length > 0) {
                console.log('\n📊 By Strategy:');
                Object.entries(branchMetrics.byStrategy).forEach(([strategy, count]) => {
                    console.log(`  ${strategy}: ${count}`);
                });
            }

            if (branchMetrics.violations.length > 0) {
                console.log('\n❌ Branch Violations:');
                branchMetrics.violations.slice(0, 5).forEach(v => {
                    console.log(`  ${v.branch}:`);
                    v.violations.forEach(violation => console.log(`    - ${violation}`));
                });
            }
            break;

        case 'merges':
            const mergeMetrics = tracker.analyzeMerges(tracker.trackingPeriod);
            console.log('\n🔀 Merge Analysis:');
            console.log(`Total merges: ${mergeMetrics.total}`);
            console.log(`Clean merges: ${mergeMetrics.clean} (${mergeMetrics.total > 0 ? ((mergeMetrics.clean/mergeMetrics.total)*100).toFixed(1) : 0}%)`);
            console.log(`Average conflicts: ${mergeMetrics.averageConflicts.toFixed(1)}`);
            break;

        case 'rules':
            console.log('\n📋 Current Compliance Rules:');
            console.log(JSON.stringify(tracker.complianceRules, null, 2));
            break;

        case 'set-period':
            const startDate = process.argv[3];
            const endDate = process.argv[4] || new Date().toISOString();

            if (!startDate) {
                console.log('Usage: node git-workflow-compliance.js set-period <start-date> [end-date]');
                console.log('Dates should be in ISO format (YYYY-MM-DDTHH:mm:ssZ)');
                process.exit(1);
            }

            tracker.setTrackingPeriod(startDate, endDate);
            console.log(`Tracking period set to: ${startDate} to ${endDate}`);
            break;

        default:
            console.log('Usage: node git-workflow-compliance.js <command> [args]');
            console.log('Commands:');
            console.log('  analyze          - Full compliance analysis');
            console.log('  commits          - Analyze commit compliance');
            console.log('  branches         - Analyze branch compliance');
            console.log('  merges           - Analyze merge compliance');
            console.log('  rules            - Show current compliance rules');
            console.log('  set-period <start> [end] - Set analysis period');
            process.exit(1);
    }
}

module.exports = GitWorkflowComplianceTracker;