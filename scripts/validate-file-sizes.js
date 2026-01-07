#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * File size validation script for TSV Ledger
 * Ensures all files comply with the 300-line limit requirement
 */

const MAX_LINES = 300;
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'coverage',
  'playwright-report',
  'test-results',
  'tmp',
  'logs',
  'data/temp-',
  'package-lock.json',
  '*.log',
  '*.lock',
  '*.min.js',
  '*.min.css'
];

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return 0;
  }
}

function validateFileSizes(dirPath) {
  const oversizedFiles = [];
  let totalFiles = 0;

  function walkDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const relativePath = path.relative(process.cwd(), fullPath);

      if (shouldIgnoreFile(relativePath)) {
        continue;
      }

      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDirectory(fullPath);
      } else if (stat.isFile()) {
        totalFiles++;

        // Only check text files
        const ext = path.extname(fullPath).toLowerCase();
        const textExtensions = ['.js', '.ts', '.json', '.md', '.html', '.css', '.txt', '.yml', '.yaml'];

        if (textExtensions.includes(ext) || !ext) {
          const lineCount = countLines(fullPath);

          if (lineCount > MAX_LINES) {
            oversizedFiles.push({
              path: relativePath,
              lines: lineCount
            });
          }
        }
      }
    }
  }

  walkDirectory(dirPath);

  return { oversizedFiles, totalFiles };
}

function main() {
  console.log('🔍 Validating file sizes...');

  const { oversizedFiles, totalFiles } = validateFileSizes(process.cwd());

  console.log(`📊 Checked ${totalFiles} files`);

  if (oversizedFiles.length > 0) {
    console.error('❌ Found oversized files (over 300 lines):');
    console.error('');

    oversizedFiles.forEach(file => {
      console.error(`  📄 ${file.path}: ${file.lines} lines`);
    });

    console.error('');
    console.error('💡 Solution: Componentize large files into smaller, focused modules');
    console.error('   Each file should contain a single responsibility and stay under 300 lines');
    console.error('');
    console.error('📖 See docs/backend-development.md for componentization examples');

    process.exit(1);
  } else {
    console.log('✅ All files are within size limits!');
    console.log(`📏 Maximum allowed: ${MAX_LINES} lines per file`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateFileSizes, MAX_LINES };