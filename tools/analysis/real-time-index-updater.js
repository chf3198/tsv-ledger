#!/usr/bin/env node

/**
 * Real-Time Index Update System
 * Automatically maintains index freshness through file watching
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const AutomatedIndexingSystem = require('./automated-indexing-system');
const CrossReferenceDatabase = require('./cross-reference-database');

class RealTimeIndexUpdater {
    constructor() {
        this.indexer = new AutomatedIndexingSystem();
        this.database = new CrossReferenceDatabase();
        this.watchers = new Map();
        this.updateQueue = new Set();
        this.isProcessing = false;
        this.updateInterval = 5000; // 5 seconds batching
        this.lastUpdate = Date.now();
        this.stats = {
            filesWatched: 0,
            updatesProcessed: 0,
            lastFullRebuild: null,
            averageUpdateTime: 0
        };
    }

    /**
     * Start real-time index monitoring
     */
    async startRealTimeUpdates(rootPath = process.cwd()) {
        console.log('🔄 Starting real-time index update system...');

        // Load existing index and database
        const indexLoaded = this.indexer.loadIndex();
        const dbLoaded = this.database.loadDatabase();

        if (!indexLoaded || !dbLoaded) {
            console.log('No existing index/database found. Building initial index...');
            await this.performFullRebuild(rootPath);
        }

        // Start file watching
        await this.setupFileWatchers(rootPath);

        // Start periodic batch updates
        this.startBatchUpdateTimer();

        console.log(`✅ Real-time updates active. Watching ${this.stats.filesWatched} files`);
        console.log('   - File changes will trigger automatic index updates');
        console.log('   - Updates are batched every 5 seconds for efficiency');

        return this.getStatus();
    }

    /**
     * Setup file watchers for all indexed files
     */
    async setupFileWatchers(rootPath) {
        console.log('Setting up file watchers...');

        const files = this.getJavaScriptFiles(rootPath);
        this.stats.filesWatched = files.length;

        for (const filePath of files) {
            await this.watchFile(filePath);
        }

        // Also watch for new files in key directories
        await this.watchDirectories(rootPath);
    }

    /**
     * Watch a specific file for changes
     */
    async watchFile(filePath) {
        if (this.watchers.has(filePath)) {
            this.watchers.get(filePath).close();
        }

        try {
            const watcher = fs.watch(filePath, { persistent: true }, (eventType, filename) => {
                if (eventType === 'change') {
                    this.queueFileUpdate(filePath);
                }
            });

            this.watchers.set(filePath, watcher);
        } catch (error) {
            console.warn(`Could not watch file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Watch directories for new file creation
     */
    async watchDirectories(rootPath) {
        const dirsToWatch = [
            'src',
            'tests',
            'public/js',
            'utils',
            'scripts',
            'demos'
        ];

        for (const dir of dirsToWatch) {
            const fullPath = path.join(rootPath, dir);
            if (fs.existsSync(fullPath)) {
                try {
                    const watcher = fs.watch(fullPath, { persistent: true }, (eventType, filename) => {
                        if (eventType === 'rename' && filename) {
                            const filePath = path.join(fullPath, filename);
                            if (this.isJavaScriptFile(filePath)) {
                                setTimeout(() => this.handleNewFile(filePath), 100);
                            }
                        }
                    });

                    this.watchers.set(`dir:${fullPath}`, watcher);
                } catch (error) {
                    // Directory might not exist, skip silently
                }
            }
        }
    }

    /**
     * Handle newly created files
     */
    async handleNewFile(filePath) {
        if (fs.existsSync(filePath)) {
            console.log(`📁 New file detected: ${path.relative(process.cwd(), filePath)}`);
            await this.watchFile(filePath);
            this.queueFileUpdate(filePath);
            this.stats.filesWatched++;
        }
    }

    /**
     * Queue file for update
     */
    queueFileUpdate(filePath) {
        this.updateQueue.add(filePath);
        this.lastUpdate = Date.now();
    }

    /**
     * Start batch update timer
     */
    startBatchUpdateTimer() {
        setInterval(() => {
            if (this.updateQueue.size > 0 && !this.isProcessing) {
                this.processBatchUpdates();
            }
        }, this.updateInterval);
    }

    /**
     * Process batched file updates
     */
    async processBatchUpdates() {
        if (this.isProcessing || this.updateQueue.size === 0) return;

        this.isProcessing = true;
        const filesToUpdate = Array.from(this.updateQueue);
        this.updateQueue.clear();

        console.log(`🔄 Processing ${filesToUpdate.length} file update(s)...`);

        const startTime = Date.now();

        try {
            // Update index for changed files
            for (const filePath of filesToUpdate) {
                if (fs.existsSync(filePath)) {
                    await this.indexer.indexFile(filePath);
                    console.log(`  Updated: ${path.relative(process.cwd(), filePath)}`);
                } else {
                    // File was deleted
                    this.indexer.removeFileFromIndex(filePath);
                    console.log(`  Removed: ${path.relative(process.cwd(), filePath)}`);
                }
            }

            // Rebuild cross-reference database
            await this.rebuildCrossReferences();

            // Save updated index and database
            this.indexer.saveIndex();
            this.database.saveDatabase();

            const duration = Date.now() - startTime;
            this.stats.updatesProcessed++;
            this.stats.averageUpdateTime = (this.stats.averageUpdateTime + duration) / 2;

            console.log(`✅ Batch update completed in ${duration}ms`);

        } catch (error) {
            console.error('Batch update failed:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Rebuild cross-reference database after index updates
     */
    async rebuildCrossReferences() {
        console.log('  Rebuilding cross-references...');

        // Clear existing database
        this.database.database.clear();
        this.database.symbolTable.clear();
        this.database.callGraph.clear();
        this.database.inheritanceGraph.clear();
        this.database.importGraph.clear();
        this.database.usagePatterns.clear();

        // Rebuild from updated index
        await this.database.buildSymbolTable(this.indexer);
        await this.database.buildCallGraph(this.indexer);
        await this.database.buildInheritanceGraph(this.indexer);
        await this.database.buildImportGraph(this.indexer);
        await this.database.analyzeUsagePatterns(this.indexer);

        // Update metadata
        this.database.metadata.lastUpdated = new Date().toISOString();
        this.database.metadata.totalSymbols = this.database.symbolTable.size;
        this.database.metadata.totalReferences = this.database.calculateTotalReferences();
        this.database.metadata.totalFiles = this.indexer.index.size;
    }

    /**
     * Perform full index rebuild
     */
    async performFullRebuild(rootPath) {
        console.log('🔄 Performing full index rebuild...');

        const startTime = Date.now();

        await this.indexer.buildComprehensiveIndex(rootPath);
        await this.database.buildCrossReferenceDatabase(rootPath);

        this.stats.lastFullRebuild = new Date().toISOString();

        const duration = Date.now() - startTime;
        console.log(`✅ Full rebuild completed in ${duration}ms`);
    }

    /**
     * Get JavaScript files in directory
     */
    getJavaScriptFiles(rootPath) {
        const files = [];

        function scanDir(dir) {
            try {
                const items = fs.readdirSync(dir);

                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
                        scanDir(fullPath);
                    } else if (stat.isFile() && this.isJavaScriptFile(fullPath)) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
            }
        }

        scanDir.call(this, rootPath);
        return files;
    }

    /**
     * Check if file is a JavaScript file
     */
    isJavaScriptFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ['.js', '.mjs', '.cjs'].includes(ext);
    }

    /**
     * Check if directory should be skipped
     */
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules',
            'coverage',
            'reports',
            'tmp',
            'temp',
            '.git',
            'dist',
            'build',
            'playwright-report',
            'test-results'
        ];
        return skipDirs.includes(dirName);
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            isActive: true,
            filesWatched: this.stats.filesWatched,
            updatesProcessed: this.stats.updatesProcessed,
            queuedUpdates: this.updateQueue.size,
            isProcessing: this.isProcessing,
            lastUpdate: new Date(this.lastUpdate).toISOString(),
            lastFullRebuild: this.stats.lastFullRebuild,
            averageUpdateTime: Math.round(this.stats.averageUpdateTime),
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Stop real-time updates
     */
    stop() {
        console.log('🛑 Stopping real-time index updates...');

        // Close all watchers
        for (const [path, watcher] of this.watchers) {
            watcher.close();
        }
        this.watchers.clear();

        // Save final state
        this.indexer.saveIndex();
        this.database.saveDatabase();

        console.log('✅ Real-time updates stopped');
    }

    /**
     * Force immediate update
     */
    async forceUpdate() {
        if (this.updateQueue.size > 0) {
            await this.processBatchUpdates();
        }
    }

    /**
     * Get update statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            currentQueueSize: this.updateQueue.size,
            activeWatchers: this.watchers.size,
            uptime: Date.now() - this.lastUpdate
        };
    }
}

// CLI interface
if (require.main === module) {
    const updater = new RealTimeIndexUpdater();

    const command = process.argv[2];

    switch (command) {
        case 'start':
            updater.startRealTimeUpdates().then(status => {
                console.log('\n📊 Real-Time Index Update Status:');
                console.log(`Watching: ${status.filesWatched} files`);
                console.log(`Updates processed: ${status.updatesProcessed}`);
                console.log('System will run continuously. Press Ctrl+C to stop.');

                // Keep process alive
                process.on('SIGINT', () => {
                    updater.stop();
                    process.exit(0);
                });

                process.on('SIGTERM', () => {
                    updater.stop();
                    process.exit(0);
                });

            }).catch(error => {
                console.error('Failed to start real-time updates:', error);
                process.exit(1);
            });
            break;

        case 'status':
            const status = updater.getStatus();
            console.log('\n📊 System Status:');
            console.log(`Active: ${status.isActive}`);
            console.log(`Files watched: ${status.filesWatched}`);
            console.log(`Updates processed: ${status.updatesProcessed}`);
            console.log(`Queued updates: ${status.queuedUpdates}`);
            console.log(`Processing: ${status.isProcessing}`);
            console.log(`Last update: ${status.lastUpdate}`);
            console.log(`Avg update time: ${status.averageUpdateTime}ms`);
            break;

        case 'rebuild':
            updater.performFullRebuild().then(() => {
                console.log('✅ Full rebuild completed');
                process.exit(0);
            }).catch(error => {
                console.error('Rebuild failed:', error);
                process.exit(1);
            });
            break;

        case 'force-update':
            updater.forceUpdate().then(() => {
                console.log('✅ Forced update completed');
            }).catch(error => {
                console.error('Force update failed:', error);
                process.exit(1);
            });
            break;

        default:
            console.log('Usage: node real-time-index-updater.js <command>');
            console.log('Commands:');
            console.log('  start         - Start real-time index monitoring');
            console.log('  status        - Show system status');
            console.log('  rebuild       - Force full index rebuild');
            console.log('  force-update  - Force immediate batch update');
            process.exit(1);
    }
}

module.exports = RealTimeIndexUpdater;