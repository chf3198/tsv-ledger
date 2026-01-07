#!/usr/bin/env node

/**
 * Real-Time Adherence Monitoring System for AI Agent Instructions
 * Tracks compliance with process-supervised best practices
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const BestPracticeRetrieval = require('./best-practice-retrieval');

class AdherenceMonitor {
    constructor() {
        this.violations = [];
        this.metrics = {
            fileSizes: {},
            testCoverage: 0,
            lintErrors: 0,
            commitConvention: true,
            lastCheck: new Date()
        };
        this.practiceRetriever = new BestPracticeRetrieval();
    }

    /**
     * Check file size compliance across the codebase
     */
  async checkFileSizes() {
    console.log('🔍 Checking file size compliance...');

    const directories = [
      'src/**/*.js',
      'public/js/**/*.js',
      'public/components/**/*.html',
      'tests/**/*.js',
      'docs/**/*.md'
    ];

    let violations = 0;

    directories.forEach(pattern => {
      try {
                const files = this.globSync(pattern);
                files.forEach(file => {
                    const lines = fs.readFileSync(file, 'utf8').split('\n').length;
                    this.metrics.fileSizes[file] = lines;

                    if (lines > 300) {
                        violations++;
                        this.violations.push({
                            type: 'file_size',
                            file: file,
                            lines: lines,
                            limit: 300,
                            severity: 'high',
                            message: `File exceeds 300-line limit: ${lines} lines`
                        });
                    }
                });
            } catch (error) {
                // Directory might not exist, skip
            }
        });

        console.log(`📊 File size check: ${violations} violations found`);
        return violations === 0;
    }

    /**
     * Check test coverage and test suite health
     */
    checkTestingCompliance() {
        console.log('🧪 Checking testing compliance...');

        try {
            // Run test coverage check
            const coverageOutput = execSync('npm run test:coverage', { encoding: 'utf8' });
            const coverageMatch = coverageOutput.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*(\d+\.\d+)%/);

            if (coverageMatch) {
                this.metrics.testCoverage = parseFloat(coverageMatch[1]);
                if (this.metrics.testCoverage < 90) {
                    this.violations.push({
                        type: 'test_coverage',
                        coverage: this.metrics.testCoverage,
                        required: 90,
                        severity: 'high',
                        message: `Test coverage below 90%: ${this.metrics.testCoverage}%`
                    });
                }
            }
        } catch (error) {
            this.violations.push({
                type: 'test_failure',
                severity: 'critical',
                message: 'Test suite execution failed',
                error: error.message
            });
        }

        return this.violations.filter(v => v.type === 'test_coverage' || v.type === 'test_failure').length === 0;
    }

    /**
     * Check code quality and linting compliance
     */
  async checkCodeQuality() {
    console.log('🔧 Checking code quality...');

    try {
      execSync('npm run lint', { stdio: 'pipe' });
      this.metrics.lintErrors = 0;
      console.log('✅ Linting passed');
      return true;
    } catch (error) {
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorCount = (errorOutput.match(/error/g) || []).length;

      this.metrics.lintErrors = errorCount;
      this.violations.push({
        type: 'lint_errors',
        count: errorCount,
        severity: 'medium',
        message: `${errorCount} linting errors found`,
        details: errorOutput
      });

      return false;
    }
  }

  /**
   * Check commit message conventions
   */
  async checkCommitConvention() {
    console.log('📝 Checking commit conventions...');

    try {
      const lastCommit = execSync('git log -1 --pretty=format:%s', { encoding: 'utf8' });
            const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .+/;

            if (!conventionalPattern.test(lastCommit)) {
                this.violations.push({
                    type: 'commit_convention',
                    commit: lastCommit,
                    severity: 'low',
                    message: `Commit message doesn't follow conventional format: ${lastCommit}`
                });
                this.metrics.commitConvention = false;
            } else {
                this.metrics.commitConvention = true;
            }
        } catch (error) {
            this.violations.push({
                type: 'git_error',
                severity: 'medium',
                message: 'Could not check commit conventions',
                error: error.message
            });
        }

        return this.metrics.commitConvention;
    }

    /**
     * Generate adherence report
     */
    async generateReport() {
        // Get best practice recommendations
        const recommendations = await this.practiceRetriever.getRecommendations({
            violations: this.violations,
            currentFile: null // Could be enhanced to track current file
        });

        const report = {
            timestamp: new Date().toISOString(),
            overallCompliance: this.violations.length === 0,
            metrics: this.metrics,
            violations: this.violations,
            recommendations: recommendations.recommendations,
            totalRecommendations: recommendations.totalAvailable,
            recommendationsAnalyzed: recommendations.contextAnalyzed
        };

        // Save report
        const reportPath = path.join(__dirname, 'adherence-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    /**
     * Generate recommendations based on violations
     */
    generateRecommendations() {
        const recommendations = [];

        this.violations.forEach(violation => {
            switch (violation.type) {
                case 'file_size':
                    recommendations.push(`Componentize ${violation.file} (${violation.lines} lines) into smaller files under 300 lines each`);
                    break;
                case 'test_coverage':
                    recommendations.push(`Improve test coverage from ${violation.coverage}% to 90%+ by adding unit tests for uncovered code`);
                    break;
                case 'lint_errors':
                    recommendations.push(`Fix ${violation.count} linting errors using 'npm run lint' and address code quality issues`);
                    break;
                case 'commit_convention':
                    recommendations.push(`Use conventional commit format: <type>[scope]: <description> (e.g., 'feat: add user authentication')`);
                    break;
            }
        });

        return recommendations;
    }

    /**
     * Run complete adherence check
     */
    async runFullCheck() {
        console.log('🚀 Starting comprehensive adherence monitoring...\n');

        this.violations = []; // Reset violations

        const checks = [
            this.checkFileSizes.bind(this),
            this.checkTestingCompliance.bind(this),
            this.checkCodeQuality.bind(this),
            this.checkCommitConvention.bind(this)
        ];

        for (const check of checks) {
            try {
                await check();
            } catch (error) {
                console.error(`❌ Check failed:`, error.message);
            }
        }

        const report = await this.generateReport();

        console.log('\n📋 Adherence Report Summary:');
        console.log(`Overall Compliance: ${report.overallCompliance ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Violations Found: ${report.violations.length}`);
        console.log(`Test Coverage: ${this.metrics.testCoverage}%`);
        console.log(`Lint Errors: ${this.metrics.lintErrors}`);

        if (report.recommendations && report.recommendations.length > 0) {
            console.log('\n💡 AI-Powered Best Practice Recommendations:');
            report.recommendations.slice(0, 3).forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.context} (${(rec.relevance * 100).toFixed(0)}% relevant)`);
                rec.practices.slice(0, 2).forEach(practice => {
                    console.log(`   • ${practice}`);
                });
            });
            if (report.totalRecommendations > 3) {
                console.log(`   ... and ${report.totalRecommendations - 3} more recommendations`);
            }
        }

        return report;
    }

    /**
     * Simple glob implementation for file matching
     */
    globSync(pattern) {
        const parts = pattern.split('/');
        let baseDir = '.';

        // Handle directory patterns
        if (parts[0] === 'src' || parts[0] === 'public' || parts[0] === 'tests' || parts[0] === 'docs') {
            baseDir = parts[0];
            parts.shift();
        }

        const extension = parts[parts.length - 1];

        function findFiles(dir, ext) {
            const files = [];
            try {
                const items = fs.readdirSync(dir);
                items.forEach(item => {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                        files.push(...findFiles(fullPath, ext));
                    } else if (stat.isFile() && item.endsWith(ext)) {
                        files.push(fullPath);
                    }
                });
            } catch (error) {
                // Directory doesn't exist, skip
            }
            return files;
        }

        const ext = extension.replace('*', '');
        return findFiles(baseDir, ext);
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new AdherenceMonitor();
    monitor.runFullCheck().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Monitoring failed:', error);
        process.exit(1);
    });
}

module.exports = AdherenceMonitor;