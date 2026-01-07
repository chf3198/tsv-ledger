#!/usr/bin/env node

/**
 * Automated Validation Pipelines
 * Continuous validation system for AI agent instruction compliance
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AutomatedValidationPipelines {
    constructor() {
        this.pipelines = {
            instructionCompliance: {
                name: 'Instruction Compliance Pipeline',
                tests: ['file-size-limits', 'comment-quality', 'git-practices'],
                schedule: 'pre-commit',
                enabled: true
            },
            codeQuality: {
                name: 'Code Quality Pipeline',
                tests: ['eslint', 'prettier', 'jsdoc-validation'],
                schedule: 'continuous',
                enabled: true
            },
            performanceValidation: {
                name: 'Performance Validation Pipeline',
                tests: ['response-time-check', 'accuracy-threshold', 'compliance-scoring'],
                schedule: 'post-deployment',
                enabled: true
            },
            integrationTesting: {
                name: 'Integration Testing Pipeline',
                tests: ['api-endpoint-validation', 'data-flow-testing', 'ui-consistency'],
                schedule: 'daily',
                enabled: true
            }
        };

        this.validationResults = {
            lastRun: null,
            totalRuns: 0,
            successRate: 0,
            pipelineResults: {},
            failures: [],
            alerts: []
        };

        this.configPath = path.join(process.cwd(), 'data', 'validation-pipelines.json');
        this.resultsPath = path.join(process.cwd(), 'data', 'validation-results.json');
        this.logPath = path.join(process.cwd(), 'logs', 'validation-pipeline.log');
    }

    /**
     * Initialize validation pipelines
     */
    initialize() {
        this.ensureDirectories();
        this.loadConfiguration();
        this.loadResults();
        console.log('🔧 Automated Validation Pipelines initialized');
        return this;
    }

    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        const dirs = [
            path.dirname(this.configPath),
            path.dirname(this.resultsPath),
            path.dirname(this.logPath)
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Load pipeline configuration
     */
    loadConfiguration() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.pipelines = { ...this.pipelines, ...config.pipelines };
                console.log('📋 Loaded pipeline configuration');
            }
        } catch (error) {
            console.warn('Warning: Could not load pipeline configuration:', error.message);
        }
    }

    /**
     * Load validation results
     */
    loadResults() {
        try {
            if (fs.existsSync(this.resultsPath)) {
                const results = JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
                this.validationResults = { ...this.validationResults, ...results };
                console.log('📊 Loaded validation results');
            }
        } catch (error) {
            console.warn('Warning: Could not load validation results:', error.message);
        }
    }

    /**
     * Run all enabled pipelines
     */
    async runAllPipelines(options = {}) {
        const startTime = Date.now();
        const runId = `run_${Date.now()}`;
        const results = {
            runId,
            timestamp: new Date().toISOString(),
            pipelines: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0
            }
        };

        console.log(`🚀 Starting validation pipeline run: ${runId}`);

        for (const [pipelineId, pipeline] of Object.entries(this.pipelines)) {
            if (!pipeline.enabled && !options.force) {
                results.pipelines[pipelineId] = {
                    status: 'skipped',
                    reason: 'Pipeline disabled'
                };
                results.summary.skipped++;
                continue;
            }

            results.summary.total++;
            console.log(`📋 Running pipeline: ${pipeline.name}`);

            try {
                const pipelineResult = await this.runPipeline(pipelineId, options);
                results.pipelines[pipelineId] = pipelineResult;

                if (pipelineResult.status === 'passed') {
                    results.summary.passed++;
                } else {
                    results.summary.failed++;
                    this.recordFailure(pipelineId, pipelineResult);
                }
            } catch (error) {
                results.pipelines[pipelineId] = {
                    status: 'error',
                    error: error.message,
                    duration: 0
                };
                results.summary.failed++;
                this.recordFailure(pipelineId, { error: error.message });
            }
        }

        results.summary.duration = Date.now() - startTime;
        this.updateValidationResults(results);
        this.saveResults();

        console.log(`✅ Pipeline run ${runId} completed in ${results.summary.duration}ms`);
        console.log(`📊 Results: ${results.summary.passed}/${results.summary.total} pipelines passed`);

        return results;
    }

    /**
     * Run a specific pipeline
     */
    async runPipeline(pipelineId, options = {}) {
        const pipeline = this.pipelines[pipelineId];
        if (!pipeline) {
            throw new Error(`Pipeline ${pipelineId} not found`);
        }

        const startTime = Date.now();
        const result = {
            pipelineId,
            name: pipeline.name,
            status: 'running',
            tests: {},
            duration: 0,
            timestamp: new Date().toISOString()
        };

        // Run each test in the pipeline
        for (const testId of pipeline.tests) {
            try {
                const testResult = await this.runTest(testId, options);
                result.tests[testId] = testResult;

                if (testResult.status !== 'passed') {
                    result.status = 'failed';
                }
            } catch (error) {
                result.tests[testId] = {
                    status: 'error',
                    error: error.message
                };
                result.status = 'failed';
            }
        }

        // If all tests passed, mark pipeline as passed
        if (result.status === 'running') {
            result.status = 'passed';
        }

        result.duration = Date.now() - startTime;
        return result;
    }

    /**
     * Run a specific test
     */
    async runTest(testId, options = {}) {
        const testConfig = this.getTestConfiguration(testId);
        const result = {
            testId,
            name: testConfig.name,
            status: 'running',
            output: '',
            duration: 0
        };

        const startTime = Date.now();

        try {
            switch (testId) {
                case 'file-size-limits':
                    result.output = await this.testFileSizeLimits();
                    break;
                case 'comment-quality':
                    result.output = await this.testCommentQuality();
                    break;
                case 'git-practices':
                    result.output = await this.testGitPractices();
                    break;
                case 'eslint':
                    result.output = await this.runEslint();
                    break;
                case 'prettier':
                    result.output = await this.runPrettier();
                    break;
                case 'jsdoc-validation':
                    result.output = await this.testJSDocValidation();
                    break;
                case 'response-time-check':
                    result.output = await this.testResponseTimeCheck();
                    break;
                case 'accuracy-threshold':
                    result.output = await this.testAccuracyThreshold();
                    break;
                case 'compliance-scoring':
                    result.output = await this.testComplianceScoring();
                    break;
                case 'api-endpoint-validation':
                    result.output = await this.testApiEndpoints();
                    break;
                case 'data-flow-testing':
                    result.output = await this.testDataFlow();
                    break;
                case 'ui-consistency':
                    result.output = await this.testUIConsistency();
                    break;
                default:
                    throw new Error(`Unknown test: ${testId}`);
            }

            result.status = 'passed';
        } catch (error) {
            result.status = 'failed';
            result.error = error.message;
        }

        result.duration = Date.now() - startTime;
        return result;
    }

    /**
     * Get test configuration
     */
    getTestConfiguration(testId) {
        const configs = {
            'file-size-limits': { name: 'File Size Limits Test' },
            'comment-quality': { name: 'Comment Quality Test' },
            'git-practices': { name: 'Git Practices Test' },
            'eslint': { name: 'ESLint Code Quality' },
            'prettier': { name: 'Prettier Code Formatting' },
            'jsdoc-validation': { name: 'JSDoc Validation' },
            'response-time-check': { name: 'Response Time Validation' },
            'accuracy-threshold': { name: 'Accuracy Threshold Check' },
            'compliance-scoring': { name: 'Compliance Scoring Validation' },
            'api-endpoint-validation': { name: 'API Endpoint Validation' },
            'data-flow-testing': { name: 'Data Flow Testing' },
            'ui-consistency': { name: 'UI Consistency Check' }
        };

        return configs[testId] || { name: `Test ${testId}` };
    }

    /**
     * Test file size limits
     */
    async testFileSizeLimits() {
        const files = this.getSourceFiles();
        const violations = [];

        for (const file of files) {
            const stats = fs.statSync(file);
            const lines = fs.readFileSync(file, 'utf8').split('\n').length;

            if (lines > 300) {
                violations.push(`${file}: ${lines} lines (limit: 300)`);
            }
        }

        if (violations.length > 0) {
            throw new Error(`File size violations:\n${violations.join('\n')}`);
        }

        return `✅ All ${files.length} files within size limits`;
    }

    /**
     * Test comment quality
     */
    async testCommentQuality() {
        const files = this.getSourceFiles();
        const issues = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');

            // Check for JSDoc comments on functions
            const functionsWithoutJSDoc = (content.match(/function\s+\w+\s*\(/g) || []).length;
            const jsdocComments = (content.match(/\/\*\*\s*\n.*?\*\//gs) || []).length;

            if (functionsWithoutJSDoc > jsdocComments) {
                issues.push(`${file}: Missing JSDoc comments`);
            }
        }

        if (issues.length > 0) {
            throw new Error(`Comment quality issues:\n${issues.join('\n')}`);
        }

        return `✅ Comment quality standards met in ${files.length} files`;
    }

    /**
     * Test git practices
     */
    async testGitPractices() {
        return new Promise((resolve, reject) => {
            const git = spawn('git', ['log', '--oneline', '-10'], { cwd: process.cwd() });

            let output = '';
            git.stdout.on('data', (data) => {
                output += data.toString();
            });

            git.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error('Git log failed'));
                    return;
                }

                const commits = output.split('\n').filter(line => line.trim());
                const conventionalCommits = commits.filter(commit =>
                    /\b(feat|fix|docs|style|refactor|perf|test|chore|build|ci):/.test(commit)
                );

                if (conventionalCommits.length < commits.length * 0.8) {
                    reject(new Error(`Only ${conventionalCommits.length}/${commits.length} commits follow conventional format`));
                }

                resolve(`✅ ${conventionalCommits.length}/${commits.length} commits follow conventional format`);
            });
        });
    }

    /**
     * Run ESLint
     */
    async runEslint() {
        return new Promise((resolve, reject) => {
            const eslint = spawn('npx', ['eslint', 'src/', 'tests/', '--format', 'compact'], { cwd: process.cwd() });

            let output = '';
            eslint.stdout.on('data', (data) => {
                output += data.toString();
            });

            eslint.stderr.on('data', (data) => {
                output += data.toString();
            });

            eslint.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`ESLint failed:\n${output}`));
                }
                resolve('✅ ESLint passed with no errors');
            });
        });
    }

    /**
     * Run Prettier
     */
    async runPrettier() {
        return new Promise((resolve, reject) => {
            const prettier = spawn('npx', ['prettier', '--check', 'src/**/*.js', 'tests/**/*.js'], { cwd: process.cwd() });

            prettier.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error('Prettier formatting issues found'));
                }
                resolve('✅ Code formatting is correct');
            });
        });
    }

    /**
     * Test JSDoc validation
     */
    async testJSDocValidation() {
        const files = this.getSourceFiles();
        const issues = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');

            // Check for functions without proper JSDoc
            const functionMatches = content.match(/\/\*\*\s*\n\s*\*\s*@param[\s\S]*?\*\/\s*\n\s*function\s+\w+/g);
            const allFunctions = content.match(/function\s+\w+\s*\(/g) || [];

            if ((functionMatches || []).length < allFunctions.length) {
                issues.push(`${file}: Functions without complete JSDoc`);
            }
        }

        if (issues.length > 0) {
            throw new Error(`JSDoc validation issues:\n${issues.join('\n')}`);
        }

        return `✅ JSDoc validation passed for ${files.length} files`;
    }

    /**
     * Test response time validation
     */
    async testResponseTimeCheck() {
        // Load performance metrics
        const perfTools = require('./performance-monitoring-tools.js');
        const monitor = new perfTools();
        const analytics = monitor.getAnalytics();

        if (analytics.summary.averageResponseTime > 2000) {
            throw new Error(`Average response time ${analytics.summary.averageResponseTime}ms exceeds threshold`);
        }

        return `✅ Response time ${analytics.summary.averageResponseTime}ms within acceptable range`;
    }

    /**
     * Test accuracy threshold
     */
    async testAccuracyThreshold() {
        const perfTools = require('./performance-monitoring-tools.js');
        const monitor = new perfTools();
        const analytics = monitor.getAnalytics();

        if (analytics.summary.averageAccuracy < 0.8) {
            throw new Error(`Average accuracy ${(analytics.summary.averageAccuracy * 100).toFixed(1)}% below 80% threshold`);
        }

        return `✅ Accuracy ${(analytics.summary.averageAccuracy * 100).toFixed(1)}% meets threshold`;
    }

    /**
     * Test compliance scoring
     */
    async testComplianceScoring() {
        const perfTools = require('./performance-monitoring-tools.js');
        const monitor = new perfTools();
        const analytics = monitor.getAnalytics();

        if (analytics.summary.averageCompliance < 0.9) {
            throw new Error(`Average compliance ${(analytics.summary.averageCompliance * 100).toFixed(1)}% below 90% threshold`);
        }

        return `✅ Compliance ${(analytics.summary.averageCompliance * 100).toFixed(1)}% meets threshold`;
    }

    /**
     * Test API endpoints
     */
    async testApiEndpoints() {
        // Simple health check
        return new Promise((resolve, reject) => {
            const curl = spawn('curl', ['-s', 'http://localhost:3000/health'], { cwd: process.cwd() });

            curl.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error('API health check failed'));
                }
                resolve('✅ API endpoints responding correctly');
            });
        });
    }

    /**
     * Test data flow
     */
    async testDataFlow() {
        const dataFiles = [
            'data/expenditures.json',
            'data/test-expenditures.json'
        ];

        for (const file of dataFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Data file missing: ${file}`);
            }

            try {
                JSON.parse(fs.readFileSync(file, 'utf8'));
            } catch (error) {
                throw new Error(`Invalid JSON in ${file}: ${error.message}`);
            }
        }

        return `✅ Data flow validation passed for ${dataFiles.length} files`;
    }

    /**
     * Test UI consistency
     */
    async testUIConsistency() {
        const htmlFiles = this.getHtmlFiles();
        const issues = [];

        for (const file of htmlFiles) {
            const content = fs.readFileSync(file, 'utf8');

            // Check for required navigation elements
            if (!content.includes('navbar') && !content.includes('navigation')) {
                issues.push(`${file}: Missing navigation elements`);
            }

            // Check for proper Bootstrap classes
            if (!content.includes('container') && !content.includes('row')) {
                issues.push(`${file}: Missing Bootstrap layout classes`);
            }
        }

        if (issues.length > 0) {
            throw new Error(`UI consistency issues:\n${issues.join('\n')}`);
        }

        return `✅ UI consistency validated for ${htmlFiles.length} files`;
    }

    /**
     * Get source files for testing
     */
    getSourceFiles() {
        const extensions = ['.js'];
        const dirs = ['src', 'tests', '.', 'utils', 'scripts', 'servers'];

        const files = [];

        function scanDir(dirPath) {
            if (!fs.existsSync(dirPath)) return;

            const items = fs.readdirSync(dirPath);

            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanDir(fullPath);
                } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        }

        dirs.forEach(dir => scanDir(dir));
        return files;
    }

    /**
     * Get HTML files for testing
     */
    getHtmlFiles() {
        const files = [];

        function scanDir(dirPath) {
            if (!fs.existsSync(dirPath)) return;

            const items = fs.readdirSync(dirPath);

            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scanDir(fullPath);
                } else if (stat.isFile() && item.endsWith('.html')) {
                    files.push(fullPath);
                }
            }
        }

        scanDir('public');
        return files;
    }

    /**
     * Record pipeline failure
     */
    recordFailure(pipelineId, result) {
        const failure = {
            pipelineId,
            timestamp: new Date().toISOString(),
            result
        };

        this.validationResults.failures.push(failure);
        this.logToFile(`FAILURE: ${pipelineId} - ${result.error || 'Unknown error'}`);
    }

    /**
     * Update validation results
     */
    updateValidationResults(results) {
        this.validationResults.lastRun = results;
        this.validationResults.totalRuns++;
        this.validationResults.pipelineResults = results.pipelines;

        const recentRuns = Math.min(this.validationResults.totalRuns, 10);
        this.validationResults.successRate =
            ((this.validationResults.totalRuns - this.validationResults.failures.length) / recentRuns) * 100;
    }

    /**
     * Save validation results
     */
    saveResults() {
        const data = {
            validationResults: this.validationResults,
            pipelines: this.pipelines,
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync(this.resultsPath, JSON.stringify(data, null, 2));
    }

    /**
     * Log message to file
     */
    logToFile(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;

        fs.appendFileSync(this.logPath, logEntry);
    }

    /**
     * Get pipeline status
     */
    getStatus() {
        const status = {
            pipelines: Object.keys(this.pipelines).length,
            enabled: Object.values(this.pipelines).filter(p => p.enabled).length,
            lastRun: this.validationResults.lastRun,
            successRate: this.validationResults.successRate,
            totalRuns: this.validationResults.totalRuns,
            recentFailures: this.validationResults.failures.slice(-5)
        };

        return status;
    }

    /**
     * Enable/disable pipeline
     */
    setPipelineEnabled(pipelineId, enabled) {
        if (this.pipelines[pipelineId]) {
            this.pipelines[pipelineId].enabled = enabled;
            this.saveResults();
            console.log(`🔧 Pipeline ${pipelineId} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
}

// CLI interface
if (require.main === module) {
    const pipelines = new AutomatedValidationPipelines().initialize();

    const command = process.argv[2];

    switch (command) {
        case 'run':
            const pipelineId = process.argv[3];
            if (pipelineId) {
                pipelines.runPipeline(pipelineId).then(result => {
                    console.log('📋 Pipeline Result:', JSON.stringify(result, null, 2));
                }).catch(error => {
                    console.error('❌ Pipeline failed:', error.message);
                    process.exit(1);
                });
            } else {
                pipelines.runAllPipelines().then(results => {
                    console.log('📊 Validation Results:', JSON.stringify(results.summary, null, 2));
                    if (results.summary.failed > 0) {
                        console.log('❌ Some pipelines failed');
                        process.exit(1);
                    }
                }).catch(error => {
                    console.error('❌ Validation run failed:', error.message);
                    process.exit(1);
                });
            }
            break;

        case 'status':
            const status = pipelines.getStatus();
            console.log('🔍 Pipeline Status:');
            console.log(`  Total Pipelines: ${status.pipelines}`);
            console.log(`  Enabled: ${status.enabled}`);
            console.log(`  Success Rate: ${status.successRate.toFixed(1)}%`);
            console.log(`  Total Runs: ${status.totalRuns}`);
            if (status.lastRun) {
                console.log(`  Last Run: ${status.lastRun.timestamp}`);
                console.log(`  Last Result: ${status.lastRun.summary.passed}/${status.lastRun.summary.total} passed`);
            }
            break;

        case 'enable':
            const enableId = process.argv[3];
            if (!enableId) {
                console.log('Usage: node automated-validation-pipelines.js enable <pipeline-id>');
                process.exit(1);
            }
            pipelines.setPipelineEnabled(enableId, true);
            break;

        case 'disable':
            const disableId = process.argv[3];
            if (!disableId) {
                console.log('Usage: node automated-validation-pipelines.js disable <pipeline-id>');
                process.exit(1);
            }
            pipelines.setPipelineEnabled(disableId, false);
            break;

        case 'list':
            console.log('📋 Available Pipelines:');
            Object.entries(pipelines.pipelines).forEach(([id, pipeline]) => {
                console.log(`  ${id}: ${pipeline.name} (${pipeline.enabled ? 'enabled' : 'disabled'})`);
                console.log(`    Tests: ${pipeline.tests.join(', ')}`);
                console.log(`    Schedule: ${pipeline.schedule}`);
                console.log('');
            });
            break;

        default:
            console.log('Usage: node automated-validation-pipelines.js <command> [options]');
            console.log('Commands:');
            console.log('  run [pipeline-id]    - Run all pipelines or specific pipeline');
            console.log('  status               - Show pipeline status');
            console.log('  enable <pipeline-id> - Enable a pipeline');
            console.log('  disable <pipeline-id>- Disable a pipeline');
            console.log('  list                 - List all pipelines');
            process.exit(1);
    }
}

module.exports = AutomatedValidationPipelines;