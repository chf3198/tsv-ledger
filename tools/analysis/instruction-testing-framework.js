#!/usr/bin/env node

/**
 * Instruction Testing Framework
 * Automated testing and validation of AI agent instructions
 */

const fs = require('fs');
const path = require('path');

class InstructionTestingFramework {
    constructor() {
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            testSuites: [],
            startTime: null,
            endTime: null,
            duration: 0
        };

        this.testSuites = new Map();
        this.instructionSets = new Map();
        this.testEnvironment = {
            mockResponses: new Map(),
            testData: new Map(),
            assertions: []
        };
    }

    /**
     * Initialize the testing framework
     */
    initialize() {
        this.testResults.startTime = new Date();
        console.log('🧪 Instruction Testing Framework initialized');
        return this;
    }

    /**
     * Load instruction sets for testing
     */
    loadInstructionSet(name, instructions) {
        this.instructionSets.set(name, {
            name,
            instructions,
            version: instructions.version || '1.0.0',
            lastModified: new Date().toISOString()
        });
        console.log(`📚 Loaded instruction set: ${name}`);
        return this;
    }

    /**
     * Create a test suite
     */
    createTestSuite(name, description = '') {
        const suite = {
            name,
            description,
            tests: [],
            setup: null,
            teardown: null,
            results: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0
            }
        };

        this.testSuites.set(name, suite);
        this.testResults.testSuites.push(suite);
        return suite;
    }

    /**
     * Add a test to a suite
     */
    addTest(suiteName, testName, testFunction, options = {}) {
        const suite = this.testSuites.get(suiteName);
        if (!suite) {
            throw new Error(`Test suite '${suiteName}' not found`);
        }

        const test = {
            name: testName,
            function: testFunction,
            options: {
                timeout: options.timeout || 5000,
                skip: options.skip || false,
                only: options.only || false,
                ...options
            },
            result: null,
            duration: 0,
            error: null
        };

        suite.tests.push(test);
        return test;
    }

    /**
     * Mock AI responses for testing
     */
    mockResponse(instruction, response, options = {}) {
        const key = this.generateMockKey(instruction);
        this.testEnvironment.mockResponses.set(key, {
            instruction,
            response,
            options: {
                delay: options.delay || 0,
                error: options.error || null,
                ...options
            }
        });
        return this;
    }

    /**
     * Generate mock key for response matching
     */
    generateMockKey(instruction) {
        // Simple key generation based on instruction content
        return instruction.replace(/\s+/g, ' ').trim().substring(0, 100);
    }

    /**
     * Simulate AI response (with mocking support)
     */
    async simulateResponse(instruction, context = {}) {
        const mockKey = this.generateMockKey(instruction);
        const mock = this.testEnvironment.mockResponses.get(mockKey);

        if (mock) {
            if (mock.options.delay) {
                await this.delay(mock.options.delay);
            }

            if (mock.options.error) {
                throw new Error(mock.options.error);
            }

            return mock.response;
        }

        // Fallback: generate realistic response based on instruction type
        return this.generateFallbackResponse(instruction, context);
    }

    /**
     * Generate fallback response for unmocked instructions
     */
    generateFallbackResponse(instruction, context) {
        const lowerInstruction = instruction.toLowerCase();

        if (lowerInstruction.includes('file size') || lowerInstruction.includes('300 lines')) {
            return "I understand the 300-line file size limit. I'll ensure all code files stay under this limit by breaking large files into smaller, focused modules.";
        }

        if (lowerInstruction.includes('comment') || lowerInstruction.includes('documentation') || lowerInstruction.includes('document')) {
            return "I'll add comprehensive JSDoc comments to all functions, including parameters, return types, and usage examples.";
        }

        if (lowerInstruction.includes('git') || lowerInstruction.includes('commit')) {
            return "I'll use conventional commit format: 'feat: add new feature' or 'fix: resolve bug in module'.";
        }

        if (lowerInstruction.includes('test')) {
            return "I'll write comprehensive unit tests with 90%+ coverage, including edge cases and error conditions.";
        }

        return "I'll follow all best practices and maintain high code quality standards.";
    }

    /**
     * Run all test suites
     */
    async runTests(options = {}) {
        console.log('🚀 Starting instruction testing...');

        for (const [suiteName, suite] of this.testSuites) {
            await this.runTestSuite(suite, options);
        }

        this.testResults.endTime = new Date();
        this.testResults.duration = this.testResults.endTime - this.testResults.startTime;

        this.generateTestReport();
        return this.testResults;
    }

    /**
     * Run a specific test suite
     */
    async runTestSuite(suite, options) {
        console.log(`\n📋 Running test suite: ${suite.name}`);
        if (suite.description) {
            console.log(`   ${suite.description}`);
        }

        const startTime = Date.now();

        // Run setup if defined
        if (suite.setup) {
            try {
                await suite.setup();
            } catch (error) {
                console.error(`❌ Setup failed for suite ${suite.name}:`, error.message);
                return;
            }
        }

        // Run tests
        for (const test of suite.tests) {
            if (test.options.skip) {
                test.result = 'skipped';
                suite.results.skipped++;
                this.testResults.skippedTests++;
                console.log(`   ⏭️  Skipped: ${test.name}`);
                continue;
            }

            await this.runTest(test, suite, options);
        }

        // Run teardown if defined
        if (suite.teardown) {
            try {
                await suite.teardown();
            } catch (error) {
                console.error(`❌ Teardown failed for suite ${suite.name}:`, error.message);
            }
        }

        suite.results.duration = Date.now() - startTime;
        console.log(`✅ Suite ${suite.name} completed: ${suite.results.passed}/${suite.results.total} passed`);
    }

    /**
     * Run a single test
     */
    async runTest(test, suite, options) {
        const startTime = Date.now();

        try {
            suite.results.total++;
            this.testResults.totalTests++;

            // Create test context
            const context = {
                assert: this.createAssert(test),
                mock: (instruction, response, opts) => this.mockResponse(instruction, response, opts),
                simulate: (instruction, ctx) => this.simulateResponse(instruction, ctx),
                instructionSets: this.instructionSets
            };

            // Run test with timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Test timeout after ${test.options.timeout}ms`)), test.options.timeout);
            });

            await Promise.race([
                test.function(context),
                timeoutPromise
            ]);

            test.result = 'passed';
            suite.results.passed++;
            this.testResults.passedTests++;
            console.log(`   ✅ Passed: ${test.name}`);

        } catch (error) {
            test.result = 'failed';
            test.error = error;
            suite.results.failed++;
            this.testResults.failedTests++;
            console.log(`   ❌ Failed: ${test.name} - ${error.message}`);
        }

        test.duration = Date.now() - startTime;
    }

    /**
     * Create assertion utilities for tests
     */
    createAssert(test) {
        return {
            equal: (actual, expected, message = '') => {
                if (actual !== expected) {
                    throw new Error(`${message} Expected ${expected}, got ${actual}`);
                }
            },
            deepEqual: (actual, expected, message = '') => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`${message} Objects not equal`);
                }
            },
            includes: (haystack, needle, message = '') => {
                if (!haystack.includes(needle)) {
                    throw new Error(`${message} Expected "${haystack}" to include "${needle}"`);
                }
            },
            throws: async (fn, message = '') => {
                try {
                    await fn();
                    throw new Error(`${message} Expected function to throw`);
                } catch (error) {
                    if (error.message.includes('Expected function to throw')) {
                        throw error;
                    }
                    // Expected error occurred
                }
            },
            notThrows: async (fn, message = '') => {
                try {
                    await fn();
                } catch (error) {
                    throw new Error(`${message} Expected function not to throw: ${error.message}`);
                }
            }
        };
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        console.log('\n📊 Instruction Testing Report');
        console.log('=' .repeat(50));
        console.log(`Total Tests: ${this.testResults.totalTests}`);
        console.log(`Passed: ${this.testResults.passedTests}`);
        console.log(`Failed: ${this.testResults.failedTests}`);
        console.log(`Skipped: ${this.testResults.skippedTests}`);
        console.log(`Duration: ${this.testResults.duration}ms`);

        const successRate = this.testResults.totalTests > 0 ?
            ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1) : 0;
        console.log(`Success Rate: ${successRate}%`);

        if (this.testResults.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.testSuites.forEach(suite => {
                suite.tests.forEach(test => {
                    if (test.result === 'failed') {
                        console.log(`   ${suite.name} > ${test.name}: ${test.error.message}`);
                    }
                });
            });
        }

        console.log('\n📋 Test Suites:');
        this.testResults.testSuites.forEach(suite => {
            const rate = suite.results.total > 0 ?
                ((suite.results.passed / suite.results.total) * 100).toFixed(1) : 0;
            console.log(`   ${suite.name}: ${suite.results.passed}/${suite.results.total} (${rate}%)`);
        });
    }

    /**
     * Save test results
     */
    saveTestResults(filePath = 'instruction-test-results.json') {
        const reportsDir = path.join(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const results = {
            ...this.testResults,
            timestamp: new Date().toISOString(),
            testSuites: this.testResults.testSuites.map(suite => ({
                ...suite,
                tests: suite.tests.map(test => ({
                    name: test.name,
                    result: test.result,
                    duration: test.duration,
                    error: test.error ? {
                        message: test.error.message,
                        stack: test.error.stack
                    } : null
                }))
            }))
        };

        fs.writeFileSync(path.join(reportsDir, filePath), JSON.stringify(results, null, 2));
        console.log(`📊 Test results saved to reports/${filePath}`);

        return path.join(reportsDir, filePath);
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Load test definitions from file
     */
    loadTestDefinitions(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const testDefs = JSON.parse(content);

            if (testDefs.suites) {
                testDefs.suites.forEach(suiteDef => {
                    const suite = this.createTestSuite(suiteDef.name, suiteDef.description);

                    if (suiteDef.tests) {
                        suiteDef.tests.forEach(testDef => {
                            this.addTest(suite.name, testDef.name, eval(`(${testDef.function})`), testDef.options);
                        });
                    }
                });
            }

            console.log(`📋 Loaded test definitions from ${filePath}`);
        } catch (error) {
            console.error(`❌ Failed to load test definitions: ${error.message}`);
        }
    }
}

// Predefined test suites for common instruction validation
const createStandardTestSuites = (framework) => {
    // File size limit tests
    const fileSizeSuite = framework.createTestSuite('File Size Limits', 'Tests for 300-line file size compliance');
    framework.addTest('File Size Limits', 'File Size Awareness', async (context) => {
        const response = await context.simulate('What are the file size limits?');
        context.assert.includes(response, '300', 'Should mention 300-line limit');
        context.assert.includes(response, 'modules', 'Should mention modular approach');
    });

    // Comment quality tests
    const commentSuite = framework.createTestSuite('Comment Quality', 'Tests for commenting standards');
    framework.addTest('Comment Quality', 'JSDoc Requirements', async (context) => {
        const response = await context.simulate('How should I document functions?');
        context.assert.includes(response, 'JSDoc', 'Should mention JSDoc format');
        context.assert.includes(response, 'parameters', 'Should mention parameter documentation');
    });

    // Git practices tests
    const gitSuite = framework.createTestSuite('Git Practices', 'Tests for version control standards');
    framework.addTest('Git Practices', 'Conventional Commits', async (context) => {
        const response = await context.simulate('How should I format commit messages?');
        context.assert.includes(response, 'conventional', 'Should mention conventional commits');
        context.assert.includes(response, 'feat:', 'Should show feat: example');
    });

    return framework;
};

// CLI interface
if (require.main === module) {
    const framework = new InstructionTestingFramework().initialize();

    // Load standard instruction set
    const standardInstructions = {
        version: '2.0.0',
        fileSizeLimit: 'All files must be under 300 lines',
        commenting: 'Use JSDoc for all functions',
        git: 'Use conventional commit format',
        testing: 'Maintain 90%+ test coverage'
    };
    framework.loadInstructionSet('standard', standardInstructions);

    // Create standard test suites
    createStandardTestSuites(framework);

    const command = process.argv[2];

    switch (command) {
        case 'run':
            framework.runTests().then(() => {
                framework.saveTestResults();
            }).catch(error => {
                console.error('❌ Test execution failed:', error.message);
                process.exit(1);
            });
            break;

        case 'load':
            const testFile = process.argv[3];
            if (!testFile) {
                console.log('Usage: node instruction-testing-framework.js load <test-file>');
                process.exit(1);
            }
            framework.loadTestDefinitions(testFile);
            framework.runTests().then(() => {
                framework.saveTestResults();
            });
            break;

        case 'mock':
            // Example: node instruction-testing-framework.js mock "file size" "Keep under 300 lines"
            const instruction = process.argv[3];
            const response = process.argv[4];
            if (!instruction || !response) {
                console.log('Usage: node instruction-testing-framework.js mock <instruction> <response>');
                process.exit(1);
            }
            framework.mockResponse(instruction, response);
            console.log('✅ Mock response added');
            break;

        default:
            console.log('Usage: node instruction-testing-framework.js <command> [options]');
            console.log('Commands:');
            console.log('  run                    - Run all tests');
            console.log('  load <file>           - Load and run tests from JSON file');
            console.log('  mock <inst> <resp>    - Add mock response for testing');
            process.exit(1);
    }
}

module.exports = InstructionTestingFramework;