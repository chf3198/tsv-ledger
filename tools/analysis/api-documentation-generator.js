#!/usr/bin/env node

/**
 * API Documentation Automation Generator
 * Automatically generates API documentation from Express.js routes
 */

const fs = require('fs');
const path = require('path');

class ApiDocumentationGenerator {
    constructor() {
        this.apiStructure = {
            endpoints: [],
            schemas: {},
            metadata: {
                title: 'TSV Ledger API',
                version: '2.2.3',
                description: 'Professional Business Intelligence Platform API',
                baseUrl: '/api'
            }
        };
    }

    /**
     * Generate API documentation from route files
     */
    generateApiDocs(projectRoot = process.cwd()) {
        const routesDir = path.join(projectRoot, 'src/routes');

        if (!fs.existsSync(routesDir)) {
            throw new Error('Routes directory not found: src/routes');
        }

        console.log(`🔍 Analyzing API routes in: ${routesDir}`);

        // Find all route files
        const routeFiles = this.findRouteFiles(routesDir);

        // Parse each route file
        routeFiles.forEach(filePath => {
            this.parseRouteFile(filePath);
        });

        // Generate documentation
        const documentation = this.buildDocumentation();

        return documentation;
    }

    /**
     * Find all route files in the routes directory
     */
    findRouteFiles(routesDir) {
        const files = [];

        try {
            const items = fs.readdirSync(routesDir);

            items.forEach(item => {
                const fullPath = path.join(routesDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts'))) {
                    files.push(fullPath);
                }
            });
        } catch (error) {
            throw new Error(`Could not read routes directory: ${error.message}`);
        }

        return files;
    }

    /**
     * Parse a route file to extract API endpoints
     */
    parseRouteFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const fileName = path.basename(filePath, path.extname(filePath));

            let currentJSDoc = null;
            let inJSDoc = false;

            lines.forEach((line, index) => {
                const trimmed = line.trim();

                // Start of JSDoc comment
                if (trimmed.startsWith('/**')) {
                    currentJSDoc = {
                        description: '',
                        params: [],
                        returns: '',
                        examples: []
                    };
                    inJSDoc = true;
                }

                // Inside JSDoc comment
                if (inJSDoc && trimmed.startsWith('*')) {
                    const jsdocLine = trimmed.substring(1).trim();

                    if (jsdocLine.startsWith('@param')) {
                        const paramMatch = jsdocLine.match(/@param\s+{([^}]+)}\s+(\w+)\s+(.+)/);
                        if (paramMatch) {
                            currentJSDoc.params.push({
                                type: paramMatch[1],
                                name: paramMatch[2],
                                description: paramMatch[3]
                            });
                        }
                    } else if (jsdocLine.startsWith('@returns')) {
                        const returnMatch = jsdocLine.match(/@returns?\s+{([^}]+)}\s+(.+)/);
                        if (returnMatch) {
                            currentJSDoc.returns = {
                                type: returnMatch[1],
                                description: returnMatch[2]
                            };
                        }
                    } else if (jsdocLine.startsWith('@example')) {
                        // Extract example (could be multi-line)
                        let example = jsdocLine.substring(8).trim();
                        currentJSDoc.examples.push(example);
                    } else if (!jsdocLine.startsWith('@') && jsdocLine.length > 0) {
                        // Description line
                        currentJSDoc.description += (currentJSDoc.description ? ' ' : '') + jsdocLine;
                    }
                }

                // End of JSDoc comment
                if (inJSDoc && trimmed === '*/') {
                    inJSDoc = false;
                }

                // Route definition
                const routeMatch = trimmed.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/);
                if (routeMatch && !inJSDoc) {
                    const method = routeMatch[1].toUpperCase();
                    const routePath = routeMatch[2];

                    // Extract handler function name or inline function
                    let handlerInfo = this.extractHandlerInfo(lines, index);

                    const endpoint = {
                        method: method,
                        path: routePath,
                        fullPath: `/api${routePath}`,
                        module: fileName,
                        description: currentJSDoc ? currentJSDoc.description : `Handle ${method} ${routePath}`,
                        parameters: currentJSDoc ? currentJSDoc.params : [],
                        responses: currentJSDoc && currentJSDoc.returns ? [currentJSDoc.returns] : [],
                        examples: currentJSDoc ? currentJSDoc.examples : [],
                        handler: handlerInfo,
                        file: filePath,
                        line: index + 1
                    };

                    this.apiStructure.endpoints.push(endpoint);

                    // Reset JSDoc for next route
                    currentJSDoc = null;
                }
            });

        } catch (error) {
            console.warn(`Warning: Could not parse route file ${filePath}: ${error.message}`);
        }
    }

    /**
     * Extract handler function information
     */
    extractHandlerInfo(lines, routeIndex) {
        // Look for the handler function after the route definition
        for (let i = routeIndex + 1; i < Math.min(lines.length, routeIndex + 10); i++) {
            const line = lines[i].trim();

            // Check for function call or arrow function
            if (line.includes('(') && line.includes(')')) {
                // Extract function name or description
                if (line.includes('function') || line.includes('=>') || line.includes('async')) {
                    return 'Inline handler function';
                } else {
                    // Named function reference
                    const funcMatch = line.match(/(\w+)\s*\(/);
                    if (funcMatch) {
                        return funcMatch[1];
                    }
                }
            }
        }

        return 'Handler function';
    }

    /**
     * Build the complete API documentation
     */
    buildDocumentation() {
        // Group endpoints by module
        const modules = {};
        this.apiStructure.endpoints.forEach(endpoint => {
            if (!modules[endpoint.module]) {
                modules[endpoint.module] = [];
            }
            modules[endpoint.module].push(endpoint);
        });

        // Sort endpoints within each module
        Object.keys(modules).forEach(module => {
            modules[module].sort((a, b) => {
                if (a.path < b.path) return -1;
                if (a.path > b.path) return 1;
                return a.method.localeCompare(b.method);
            });
        });

        return {
            ...this.apiStructure,
            modules: modules,
            generatedAt: new Date().toISOString(),
            summary: {
                totalEndpoints: this.apiStructure.endpoints.length,
                modules: Object.keys(modules).length,
                methods: this.getMethodCounts()
            }
        };
    }

    /**
     * Get counts of different HTTP methods
     */
    getMethodCounts() {
        const counts = {};
        this.apiStructure.endpoints.forEach(endpoint => {
            counts[endpoint.method] = (counts[endpoint.method] || 0) + 1;
        });
        return counts;
    }

    /**
     * Generate Markdown documentation
     */
    generateMarkdownDocs(documentation) {
        let markdown = `# ${documentation.metadata.title}

${documentation.metadata.description}

**Version:** ${documentation.metadata.version}  
**Base URL:** ${documentation.metadata.baseUrl}  
**Generated:** ${new Date(documentation.generatedAt).toLocaleString()}

## Summary

- **Total Endpoints:** ${documentation.summary.totalEndpoints}
- **API Modules:** ${documentation.summary.modules}
- **HTTP Methods:** ${Object.entries(documentation.summary.methods).map(([method, count]) => `${method}: ${count}`).join(', ')}

## API Endpoints

`;

        // Generate documentation for each module
        Object.entries(documentation.modules).forEach(([moduleName, endpoints]) => {
            markdown += `### ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module\n\n`;

            endpoints.forEach(endpoint => {
                markdown += `#### ${endpoint.method} ${endpoint.fullPath}\n\n`;
                markdown += `${endpoint.description}\n\n`;

                if (endpoint.parameters.length > 0) {
                    markdown += `**Parameters:**\n\n`;
                    endpoint.parameters.forEach(param => {
                        markdown += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
                    });
                    markdown += '\n';
                }

                if (endpoint.responses.length > 0) {
                    markdown += `**Response:**\n\n`;
                    endpoint.responses.forEach(response => {
                        markdown += `- ${response.type}: ${response.description}\n`;
                    });
                    markdown += '\n';
                }

                if (endpoint.examples.length > 0) {
                    markdown += `**Example:**\n\n`;
                    markdown += `\`\`\`\n`;
                    endpoint.examples.forEach(example => {
                        markdown += `${example}\n`;
                    });
                    markdown += `\`\`\`\n\n`;
                }

                markdown += `**Handler:** ${endpoint.handler}\n`;
                markdown += `**File:** ${path.relative(process.cwd(), endpoint.file)}:${endpoint.line}\n\n`;
                markdown += '---\n\n';
            });
        });

        return markdown;
    }

    /**
     * Save API documentation
     */
    saveApiDocumentation(documentation, format = 'markdown', filePath = null) {
        const docsDir = path.join(process.cwd(), 'docs');
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        let outputPath;
        let content;

        if (format === 'markdown') {
            outputPath = filePath || path.join(docsDir, 'API.md');
            content = this.generateMarkdownDocs(documentation);
        } else if (format === 'json') {
            outputPath = filePath || path.join(docsDir, 'api-documentation.json');
            content = JSON.stringify(documentation, null, 2);
        } else {
            throw new Error(`Unsupported format: ${format}`);
        }

        fs.writeFileSync(outputPath, content);
        console.log(`API documentation saved to ${outputPath}`);

        return outputPath;
    }
}

// CLI interface
if (require.main === module) {
    const generator = new ApiDocumentationGenerator();

    const command = process.argv[2];

    switch (command) {
        case 'generate':
            const projectRoot = process.argv[3] || process.cwd();
            const format = process.argv[4] || 'markdown';

            try {
                console.log(`🚀 Generating API documentation for: ${projectRoot}`);
                const documentation = generator.generateApiDocs(projectRoot);

                console.log(`\n📊 API Documentation Summary`);
                console.log(`Total Endpoints: ${documentation.summary.totalEndpoints}`);
                console.log(`API Modules: ${documentation.summary.modules}`);
                console.log(`HTTP Methods: ${Object.entries(documentation.summary.methods).map(([method, count]) => `${method}: ${count}`).join(', ')}`);

                if (documentation.summary.totalEndpoints > 0) {
                    console.log(`\n📋 Endpoints by Module:`);
                    Object.entries(documentation.modules).forEach(([module, endpoints]) => {
                        console.log(`  ${module}: ${endpoints.length} endpoints`);
                    });
                }

                generator.saveApiDocumentation(documentation, format);

            } catch (error) {
                console.error(`❌ Error generating API documentation: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'preview':
            const previewRoot = process.argv[3] || process.cwd();

            try {
                const documentation = generator.generateApiDocs(previewRoot);

                console.log(`\n🔍 API Endpoints Preview:`);
                documentation.endpoints.slice(0, 10).forEach(endpoint => {
                    console.log(`  ${endpoint.method} ${endpoint.fullPath} - ${endpoint.description}`);
                });

                if (documentation.endpoints.length > 10) {
                    console.log(`  ... and ${documentation.endpoints.length - 10} more endpoints`);
                }

            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
                process.exit(1);
            }
            break;

        default:
            console.log('Usage: node api-documentation-generator.js <command> [options]');
            console.log('Commands:');
            console.log('  generate [project-root] [format] - Generate API documentation (markdown/json)');
            console.log('  preview [project-root]          - Preview API endpoints without generating files');
            process.exit(1);
    }
}

module.exports = ApiDocumentationGenerator;