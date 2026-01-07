#!/usr/bin/env node

/**
 * Development Sandbox Environment
 * Isolated environment for safe AI agent instruction development and testing
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class DevelopmentSandboxEnvironment {
    constructor() {
        this.sandboxRoot = path.join(process.cwd(), 'sandbox');
        this.environments = {
            instruction_testing: {
                name: 'Instruction Testing Sandbox',
                description: 'Safe environment for testing AI instruction modifications',
                baseConfig: 'instruction-testing-framework.js',
                testData: 'sandbox/test-data/instruction-tests/',
                backups: 'sandbox/backups/instruction-testing/',
                isolationLevel: 'high'
            },
            performance_monitoring: {
                name: 'Performance Monitoring Sandbox',
                description: 'Isolated performance testing and monitoring development',
                baseConfig: 'performance-monitoring-tools.js',
                testData: 'sandbox/test-data/performance-tests/',
                backups: 'sandbox/backups/performance-monitoring/',
                isolationLevel: 'medium'
            },
            validation_pipeline: {
                name: 'Validation Pipeline Sandbox',
                description: 'Safe testing of validation pipeline modifications',
                baseConfig: 'automated-validation-pipelines.js',
                testData: 'sandbox/test-data/validation-tests/',
                backups: 'sandbox/backups/validation-pipeline/',
                isolationLevel: 'high'
            },
            ci_integration: {
                name: 'CI Integration Sandbox',
                description: 'Isolated CI pipeline testing and development',
                baseConfig: 'continuous-integration-instructions.js',
                testData: 'sandbox/test-data/ci-tests/',
                backups: 'sandbox/backups/ci-integration/',
                isolationLevel: 'medium'
            },
            full_system: {
                name: 'Full System Sandbox',
                description: 'Complete isolated environment for comprehensive testing',
                baseConfig: 'server.js',
                testData: 'sandbox/test-data/full-system/',
                backups: 'sandbox/backups/full-system/',
                isolationLevel: 'low'
            }
        };

        this.activeSandboxes = new Map();
        this.sandboxStatus = {
            totalSandboxes: 0,
            activeSandboxes: 0,
            resourcesUsed: 0,
            lastCleanup: null
        };

        this.configPath = path.join(this.sandboxRoot, 'config.json');
        this.statusPath = path.join(this.sandboxRoot, 'status.json');
        this.logPath = path.join(this.sandboxRoot, 'sandbox.log');
    }

    /**
     * Initialize sandbox environment
     */
    initialize() {
        this.ensureSandboxStructure();
        this.loadConfiguration();
        this.loadStatus();
        this.setupResourceLimits();
        console.log('🏖️ Development Sandbox Environment initialized');
        return this;
    }

    /**
     * Ensure sandbox directory structure exists
     */
    ensureSandboxStructure() {
        const dirs = [
            this.sandboxRoot,
            path.join(this.sandboxRoot, 'logs'),
            path.join(this.sandboxRoot, 'backups'),
            path.join(this.sandboxRoot, 'test-data'),
            path.join(this.sandboxRoot, 'temp'),
            path.join(this.sandboxRoot, 'isolated-configs'),
            path.join(this.sandboxRoot, 'snapshots'),
            path.join(this.sandboxRoot, 'instances')
        ];

        // Create environment-specific directories
        Object.values(this.environments).forEach(env => {
            dirs.push(path.dirname(env.testData));
            dirs.push(path.dirname(env.backups));
        });

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        console.log('📁 Sandbox directory structure created');
    }

    /**
     * Load sandbox configuration
     */
    loadConfiguration() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.environments = { ...this.environments, ...config.environments };
                console.log('📋 Loaded sandbox configuration');
            }
        } catch (error) {
            console.warn('Warning: Could not load sandbox configuration:', error.message);
        }
    }

    /**
     * Load sandbox status
     */
    loadStatus() {
        try {
            if (fs.existsSync(this.statusPath)) {
                const status = JSON.parse(fs.readFileSync(this.statusPath, 'utf8'));
                this.sandboxStatus = { ...this.sandboxStatus, ...status.sandboxStatus };
                // Restore active sandboxes Map
                if (status.activeSandboxesData) {
                    this.activeSandboxes = new Map(status.activeSandboxesData);
                }
                console.log('📊 Loaded sandbox status');
            }
        } catch (error) {
            console.warn('Warning: Could not load sandbox status:', error.message);
        }
    }

    /**
     * Setup resource limits for sandbox isolation
     */
    setupResourceLimits() {
        // Create resource limit configurations
        const resourceLimits = {
            high: {
                maxMemory: '512m',
                maxCpu: '50%',
                maxFiles: 100,
                timeout: 300000 // 5 minutes
            },
            medium: {
                maxMemory: '1g',
                maxCpu: '75%',
                maxFiles: 500,
                timeout: 600000 // 10 minutes
            },
            low: {
                maxMemory: '2g',
                maxCpu: '100%',
                maxFiles: 1000,
                timeout: 1800000 // 30 minutes
            }
        };

        const limitsPath = path.join(this.sandboxRoot, 'resource-limits.json');
        fs.writeFileSync(limitsPath, JSON.stringify(resourceLimits, null, 2));
        console.log('⚙️ Resource limits configured');
    }

    /**
     * Create a new sandbox environment
     */
    async createSandbox(environmentType, options = {}) {
        const envConfig = this.environments[environmentType];
        if (!envConfig) {
            throw new Error(`Environment type ${environmentType} not found`);
        }

        const sandboxId = `sandbox_${environmentType}_${Date.now()}`;
        const sandboxPath = path.join(this.sandboxRoot, 'instances', sandboxId);

        // Create sandbox instance directory
        fs.mkdirSync(sandboxPath, { recursive: true });

        // Create isolated configuration
        const isolatedConfig = await this.createIsolatedConfig(environmentType, sandboxPath, options);

        // Setup test data
        await this.setupTestData(environmentType, sandboxPath);

        // Create backup of current state
        await this.createBackup(environmentType, sandboxId);

        const sandbox = {
            id: sandboxId,
            environmentType,
            path: sandboxPath,
            config: isolatedConfig,
            created: new Date().toISOString(),
            status: 'created',
            resources: {
                memory: 0,
                cpu: 0,
                files: 0
            },
            options
        };

        this.activeSandboxes.set(sandboxId, sandbox);
        this.sandboxStatus.totalSandboxes++;
        this.sandboxStatus.activeSandboxes++;

        this.saveStatus();
        this.logToFile(`Created sandbox: ${sandboxId} (${environmentType})`);

        console.log(`✅ Sandbox created: ${sandboxId}`);
        return sandbox;
    }

    /**
     * Create isolated configuration for sandbox
     */
    async createIsolatedConfig(environmentType, sandboxPath, options) {
        const envConfig = this.environments[environmentType];
        const baseConfigPath = path.join(process.cwd(), envConfig.baseConfig);

        if (!fs.existsSync(baseConfigPath)) {
            throw new Error(`Base configuration file not found: ${baseConfigPath}`);
        }

        // Copy base configuration
        const configFileName = path.basename(envConfig.baseConfig);
        const isolatedConfigPath = path.join(sandboxPath, configFileName);
        fs.copyFileSync(baseConfigPath, isolatedConfigPath);

        // Create sandbox-specific configuration
        const sandboxConfig = {
            sandboxId: path.basename(sandboxPath),
            environmentType,
            isolationLevel: envConfig.isolationLevel,
            resourceLimits: await this.getResourceLimits(envConfig.isolationLevel),
            testDataPath: path.join(sandboxPath, 'test-data'),
            logPath: path.join(sandboxPath, 'logs'),
            tempPath: path.join(sandboxPath, 'temp'),
            created: new Date().toISOString(),
            options
        };

        const configPath = path.join(sandboxPath, 'sandbox-config.json');
        fs.writeFileSync(configPath, JSON.stringify(sandboxConfig, null, 2));

        return sandboxConfig;
    }

    /**
     * Setup test data for sandbox
     */
    async setupTestData(environmentType, sandboxPath) {
        const envConfig = this.environments[environmentType];
        const testDataPath = path.join(sandboxPath, 'test-data');

        fs.mkdirSync(testDataPath, { recursive: true });

        // Copy relevant test data based on environment type
        const testDataMappings = {
            instruction_testing: [
                'data/test-expenditures.json',
                'tests/unit/',
                'tests/instruction-tests/'
            ],
            performance_monitoring: [
                'data/performance-metrics.json',
                'tests/performance/',
                'tests/benchmark-data/'
            ],
            validation_pipeline: [
                'data/validation-results.json',
                'tests/integration/',
                'tests/validation-tests/'
            ],
            ci_integration: [
                'data/ci-status.json',
                '.github/workflows/',
                'tests/ci-tests/'
            ],
            full_system: [
                'data/',
                'tests/',
                'public/',
                'src/'
            ]
        };

        const mappings = testDataMappings[environmentType] || [];
        for (const mapping of mappings) {
            const sourcePath = path.join(process.cwd(), mapping);
            const destPath = path.join(testDataPath, mapping);

            if (fs.existsSync(sourcePath)) {
                await this.copyRecursive(sourcePath, destPath);
            }
        }

        console.log(`📋 Test data setup for ${environmentType}`);
    }

    /**
     * Create backup of current state
     */
    async createBackup(environmentType, sandboxId) {
        const envConfig = this.environments[environmentType];
        const backupPath = path.join(envConfig.backups, `${sandboxId}_${Date.now()}`);

        fs.mkdirSync(backupPath, { recursive: true });

        // Backup relevant files based on environment
        const backupFiles = {
            instruction_testing: ['instruction-testing-framework.js', 'data/test-expenditures.json'],
            performance_monitoring: ['performance-monitoring-tools.js', 'data/performance-metrics.json'],
            validation_pipeline: ['automated-validation-pipelines.js', 'data/validation-results.json'],
            ci_integration: ['continuous-integration-instructions.js', 'data/ci-status.json'],
            full_system: ['server.js', 'package.json', 'data/']
        };

        const files = backupFiles[environmentType] || [];
        for (const file of files) {
            const sourcePath = path.join(process.cwd(), file);
            if (fs.existsSync(sourcePath)) {
                const destPath = path.join(backupPath, file);
                await this.copyRecursive(sourcePath, destPath);
            }
        }

        console.log(`💾 Backup created for ${environmentType}: ${backupPath}`);
        return backupPath;
    }

    /**
     * Start a sandbox environment
     */
    async startSandbox(sandboxId) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        if (!sandbox) {
            throw new Error(`Sandbox ${sandboxId} not found`);
        }

        if (sandbox.status === 'running') {
            throw new Error(`Sandbox ${sandboxId} is already running`);
        }

        // Start isolated process
        const envConfig = this.environments[sandbox.environmentType];
        const configPath = path.join(sandbox.path, 'sandbox-config.json');
        const resourceLimits = await this.getResourceLimits(envConfig.isolationLevel);

        const child = spawn('node', [
            path.join(sandbox.path, path.basename(envConfig.baseConfig)),
            'status'
        ], {
            cwd: sandbox.path,
            env: {
                ...process.env,
                SANDBOX_MODE: 'true',
                SANDBOX_ID: sandboxId,
                SANDBOX_CONFIG: configPath,
                NODE_OPTIONS: `--max-old-space-size=${this.parseMemoryLimit(resourceLimits.maxMemory)}`
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        sandbox.process = child;
        sandbox.status = 'running';
        sandbox.started = new Date().toISOString();

        // Monitor process
        this.monitorSandboxProcess(sandbox);

        this.saveStatus();
        this.logToFile(`Started sandbox: ${sandboxId}`);

        console.log(`🚀 Sandbox started: ${sandboxId}`);
        return sandbox;
    }

    /**
     * Stop a sandbox environment
     */
    async stopSandbox(sandboxId) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        if (!sandbox) {
            throw new Error(`Sandbox ${sandboxId} not found`);
        }

        if (sandbox.status !== 'running' || !sandbox.process) {
            throw new Error(`Sandbox ${sandboxId} is not running`);
        }

        // Stop the process
        sandbox.process.kill();
        sandbox.status = 'stopped';
        sandbox.stopped = new Date().toISOString();

        this.sandboxStatus.activeSandboxes--;
        this.saveStatus();
        this.logToFile(`Stopped sandbox: ${sandboxId}`);

        console.log(`🛑 Sandbox stopped: ${sandboxId}`);
        return sandbox;
    }

    /**
     * Monitor sandbox process
     */
    monitorSandboxProcess(sandbox) {
        const child = sandbox.process;

        child.on('exit', (code) => {
            sandbox.status = code === 0 ? 'completed' : 'failed';
            sandbox.exitCode = code;
            sandbox.completed = new Date().toISOString();
            this.saveStatus();
            this.logToFile(`Sandbox ${sandbox.id} exited with code ${code}`);
        });

        child.on('error', (error) => {
            sandbox.status = 'error';
            sandbox.error = error.message;
            this.saveStatus();
            this.logToFile(`Sandbox ${sandbox.id} error: ${error.message}`);
        });

        // Monitor resource usage (simplified)
        setInterval(() => {
            if (sandbox.status === 'running') {
                // In a real implementation, you'd use system monitoring APIs
                sandbox.resources.memory = Math.random() * 100; // Mock data
                sandbox.resources.cpu = Math.random() * 50;     // Mock data
            }
        }, 5000);
    }

    /**
     * Run tests in sandbox
     */
    async runSandboxTests(sandboxId, testCommand) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        if (!sandbox) {
            throw new Error(`Sandbox ${sandboxId} not found`);
        }

        if (sandbox.status !== 'running') {
            throw new Error(`Sandbox ${sandboxId} is not running`);
        }

        return new Promise((resolve, reject) => {
            const [cmd, ...args] = testCommand.split(' ');
            const child = spawn(cmd, args, {
                cwd: sandbox.path,
                env: {
                    ...process.env,
                    SANDBOX_MODE: 'true',
                    SANDBOX_ID: sandboxId
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    command: testCommand,
                    exitCode: code,
                    stdout,
                    stderr,
                    success: code === 0
                };

                if (code === 0) {
                    resolve(result);
                } else {
                    reject(new Error(`Test failed: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Create snapshot of sandbox state
     */
    async createSnapshot(sandboxId, snapshotName) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        if (!sandbox) {
            throw new Error(`Sandbox ${sandboxId} not found`);
        }

        const snapshotPath = path.join(this.sandboxRoot, 'snapshots', `${snapshotName}_${Date.now()}`);
        fs.mkdirSync(snapshotPath, { recursive: true });

        // Copy sandbox state
        await this.copyRecursive(sandbox.path, path.join(snapshotPath, 'sandbox'));
        await this.copyRecursive(sandbox.config.testDataPath, path.join(snapshotPath, 'test-data'));

        const snapshot = {
            id: `${snapshotName}_${Date.now()}`,
            sandboxId,
            path: snapshotPath,
            created: new Date().toISOString(),
            sandboxState: { ...sandbox }
        };

        console.log(`📸 Snapshot created: ${snapshot.id}`);
        return snapshot;
    }

    /**
     * Restore sandbox from snapshot
     */
    async restoreFromSnapshot(snapshotId, targetSandboxId) {
        const snapshotPath = path.join(this.sandboxRoot, 'snapshots', snapshotId);
        if (!fs.existsSync(snapshotPath)) {
            throw new Error(`Snapshot ${snapshotId} not found`);
        }

        const sandbox = this.activeSandboxes.get(targetSandboxId);
        if (!sandbox) {
            throw new Error(`Sandbox ${targetSandboxId} not found`);
        }

        // Stop sandbox if running
        if (sandbox.status === 'running') {
            await this.stopSandbox(targetSandboxId);
        }

        // Restore from snapshot
        const sandboxSource = path.join(snapshotPath, 'sandbox');
        const testDataSource = path.join(snapshotPath, 'test-data');

        if (fs.existsSync(sandboxSource)) {
            await this.copyRecursive(sandboxSource, sandbox.path);
        }
        if (fs.existsSync(testDataSource)) {
            await this.copyRecursive(testDataSource, sandbox.config.testDataPath);
        }

        console.log(`🔄 Restored sandbox ${targetSandboxId} from snapshot ${snapshotId}`);
        return sandbox;
    }

    /**
     * Cleanup sandbox environment
     */
    async cleanupSandbox(sandboxId) {
        const sandbox = this.activeSandboxes.get(sandboxId);
        if (!sandbox) {
            throw new Error(`Sandbox ${sandboxId} not found`);
        }

        // Stop if running
        if (sandbox.status === 'running') {
            await this.stopSandbox(sandboxId);
        }

        // Remove sandbox directory
        await this.removeRecursive(sandbox.path);

        this.activeSandboxes.delete(sandboxId);
        this.sandboxStatus.activeSandboxes--;

        this.saveStatus();
        this.logToFile(`Cleaned up sandbox: ${sandboxId}`);

        console.log(`🧹 Sandbox cleaned up: ${sandboxId}`);
    }

    /**
     * Get resource limits for isolation level
     */
    async getResourceLimits(isolationLevel) {
        const limitsPath = path.join(this.sandboxRoot, 'resource-limits.json');
        const limits = JSON.parse(fs.readFileSync(limitsPath, 'utf8'));
        return limits[isolationLevel] || limits.medium;
    }

    /**
     * Parse memory limit string
     */
    parseMemoryLimit(limit) {
        const match = limit.match(/^(\d+)([gm])$/i);
        if (!match) return 512; // Default 512MB

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        return unit === 'g' ? value * 1024 : value;
    }

    /**
     * Copy directory recursively
     */
    async copyRecursive(source, destination) {
        if (!fs.existsSync(source)) return;

        const stats = fs.statSync(source);

        if (stats.isDirectory()) {
            fs.mkdirSync(destination, { recursive: true });
            const items = fs.readdirSync(source);
            for (const item of items) {
                await this.copyRecursive(
                    path.join(source, item),
                    path.join(destination, item)
                );
            }
        } else {
            fs.copyFileSync(source, destination);
        }
    }

    /**
     * Remove directory recursively
     */
    async removeRecursive(dirPath) {
        if (!fs.existsSync(dirPath)) return;

        const stats = fs.statSync(dirPath);

        if (stats.isDirectory()) {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                await this.removeRecursive(path.join(dirPath, item));
            }
            fs.rmdirSync(dirPath);
        } else {
            fs.unlinkSync(dirPath);
        }
    }

    /**
     * Save sandbox status
     */
    saveStatus() {
        const data = {
            sandboxStatus: this.sandboxStatus,
            activeSandboxesData: Array.from(this.activeSandboxes.entries()),
            lastUpdated: new Date().toISOString()
        };

        fs.writeFileSync(this.statusPath, JSON.stringify(data, null, 2));
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
     * Get sandbox status
     */
    getSandboxStatus() {
        return {
            totalSandboxes: this.sandboxStatus.totalSandboxes,
            activeSandboxes: this.sandboxStatus.activeSandboxes,
            resourcesUsed: this.sandboxStatus.resourcesUsed,
            lastCleanup: this.sandboxStatus.lastCleanup,
            sandboxes: Array.from(this.activeSandboxes.values()).map(s => ({
                id: s.id,
                environmentType: s.environmentType,
                status: s.status,
                created: s.created,
                resources: s.resources
            }))
        };
    }

    /**
     * Generate sandbox report
     */
    generateSandboxReport() {
        const status = this.getSandboxStatus();

        let report = `🏖️ Development Sandbox Environment Report\n`;
        report += '=' .repeat(50) + '\n\n';

        report += '📊 SANDBOX STATUS\n';
        report += `Total Sandboxes: ${status.totalSandboxes}\n`;
        report += `Active Sandboxes: ${status.activeSandboxes}\n`;
        report += `Resources Used: ${status.resourcesUsed}%\n`;
        report += `Last Cleanup: ${status.lastCleanup || 'Never'}\n\n`;

        if (status.sandboxes.length > 0) {
            report += '🏠 ACTIVE SANDBOXES\n';
            status.sandboxes.forEach((sandbox, index) => {
                report += `${index + 1}. ${sandbox.id} (${sandbox.environmentType})\n`;
                report += `   Status: ${sandbox.status.toUpperCase()}\n`;
                report += `   Created: ${new Date(sandbox.created).toLocaleString()}\n`;
                report += `   Memory: ${sandbox.resources.memory.toFixed(1)}MB\n`;
                report += `   CPU: ${sandbox.resources.cpu.toFixed(1)}%\n\n`;
            });
        }

        report += '🏗️ AVAILABLE ENVIRONMENTS\n';
        Object.entries(this.environments).forEach(([key, env]) => {
            report += `${key}: ${env.name}\n`;
            report += `  ${env.description}\n`;
            report += `  Isolation: ${env.isolationLevel.toUpperCase()}\n\n`;
        });

        return report;
    }

    /**
     * Perform cleanup of old sandboxes
     */
    async performCleanup(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        const now = Date.now();
        const toCleanup = [];

        for (const [id, sandbox] of this.activeSandboxes) {
            const age = now - new Date(sandbox.created).getTime();
            if (age > maxAge && sandbox.status !== 'running') {
                toCleanup.push(id);
            }
        }

        for (const id of toCleanup) {
            await this.cleanupSandbox(id);
        }

        this.sandboxStatus.lastCleanup = new Date().toISOString();
        this.saveStatus();

        console.log(`🧹 Cleaned up ${toCleanup.length} old sandboxes`);
        return toCleanup.length;
    }
}

// CLI interface
if (require.main === module) {
    const sandbox = new DevelopmentSandboxEnvironment().initialize();

    const command = process.argv[2];

    switch (command) {
        case 'create':
            const envType = process.argv[3];
            if (!envType) {
                console.log('Usage: node development-sandbox-environment.js create <environment-type>');
                process.exit(1);
            }
            sandbox.createSandbox(envType).then(sb => {
                console.log('✅ Sandbox created:', sb.id);
            }).catch(error => {
                console.error('❌ Failed to create sandbox:', error.message);
                process.exit(1);
            });
            break;

        case 'start':
            const startId = process.argv[3];
            if (!startId) {
                console.log('Usage: node development-sandbox-environment.js start <sandbox-id>');
                process.exit(1);
            }
            sandbox.startSandbox(startId).then(sb => {
                console.log('✅ Sandbox started:', sb.id);
            }).catch(error => {
                console.error('❌ Failed to start sandbox:', error.message);
                process.exit(1);
            });
            break;

        case 'stop':
            const stopId = process.argv[3];
            if (!stopId) {
                console.log('Usage: node development-sandbox-environment.js stop <sandbox-id>');
                process.exit(1);
            }
            sandbox.stopSandbox(stopId).then(sb => {
                console.log('✅ Sandbox stopped:', sb.id);
            }).catch(error => {
                console.error('❌ Failed to stop sandbox:', error.message);
                process.exit(1);
            });
            break;

        case 'test':
            const testId = process.argv[3];
            const testCmd = process.argv[4] || 'node status';
            if (!testId) {
                console.log('Usage: node development-sandbox-environment.js test <sandbox-id> [command]');
                process.exit(1);
            }
            sandbox.runSandboxTests(testId, testCmd).then(result => {
                console.log('✅ Test completed successfully');
                console.log('Output:', result.stdout);
            }).catch(error => {
                console.error('❌ Test failed:', error.message);
                process.exit(1);
            });
            break;

        case 'snapshot':
            const snapId = process.argv[3];
            const snapName = process.argv[4] || 'manual';
            if (!snapId) {
                console.log('Usage: node development-sandbox-environment.js snapshot <sandbox-id> [name]');
                process.exit(1);
            }
            sandbox.createSnapshot(snapId, snapName).then(snapshot => {
                console.log('✅ Snapshot created:', snapshot.id);
            }).catch(error => {
                console.error('❌ Failed to create snapshot:', error.message);
                process.exit(1);
            });
            break;

        case 'cleanup':
            const cleanupId = process.argv[3];
            if (!cleanupId) {
                console.log('Usage: node development-sandbox-environment.js cleanup <sandbox-id>');
                process.exit(1);
            }
            sandbox.cleanupSandbox(cleanupId).then(() => {
                console.log('✅ Sandbox cleaned up:', cleanupId);
            }).catch(error => {
                console.error('❌ Failed to cleanup sandbox:', error.message);
                process.exit(1);
            });
            break;

        case 'status':
            const status = sandbox.getSandboxStatus();
            console.log('🏖️ Sandbox Status:');
            console.log(`  Total: ${status.totalSandboxes}`);
            console.log(`  Active: ${status.activeSandboxes}`);
            console.log(`  Sandboxes: ${status.sandboxes.map(s => s.id).join(', ') || 'None'}`);
            break;

        case 'report':
            const report = sandbox.generateSandboxReport();
            console.log(report);
            break;

        case 'list':
            console.log('🏗️ Available Environments:');
            Object.entries(sandbox.environments).forEach(([key, env]) => {
                console.log(`  ${key}: ${env.name}`);
                console.log(`    ${env.description}`);
                console.log(`    Isolation: ${env.isolationLevel}`);
                console.log('');
            });
            break;

        case 'auto-cleanup':
            sandbox.performCleanup().then(count => {
                console.log(`🧹 Cleaned up ${count} old sandboxes`);
            }).catch(error => {
                console.error('❌ Auto-cleanup failed:', error.message);
                process.exit(1);
            });
            break;

        default:
            console.log('Usage: node development-sandbox-environment.js <command> [options]');
            console.log('Commands:');
            console.log('  create <env-type>    - Create a new sandbox environment');
            console.log('  start <sandbox-id>   - Start a sandbox environment');
            console.log('  stop <sandbox-id>    - Stop a sandbox environment');
            console.log('  test <sandbox-id> [cmd] - Run tests in sandbox');
            console.log('  snapshot <id> [name] - Create sandbox snapshot');
            console.log('  cleanup <sandbox-id> - Clean up sandbox environment');
            console.log('  status               - Show sandbox status');
            console.log('  report               - Generate sandbox report');
            console.log('  list                 - List available environments');
            console.log('  auto-cleanup         - Clean up old sandboxes');
            process.exit(1);
    }
}

module.exports = DevelopmentSandboxEnvironment;