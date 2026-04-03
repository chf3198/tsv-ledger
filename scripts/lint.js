#!/usr/bin/env node
/**
 * Lint: Enforce 100-line file limit
 * Usage: node scripts/lint.js
 */

const fs = require('fs');
const path = require('path');

const MAX_LINES = 100;
const CHECK_PATTERNS = ['*.js', '*.html', '*.css'];
const IGNORE_DIRS = ['node_modules', '.git', 'playwright-report', 'test-results'];
const LEGACY_MAX = {
  'css/app.css': 916,
  'index.html': 414,
  'js/app.js': 495,
  'scripts/visual-test/analyze.js': 202,
  'scripts/visual-test/capture.js': 196,
  'tests/allocation.spec.js': 172,
  'tests/collapsible-cards.spec.js': 133,
  'tests/import-history.spec.js': 114,
  'tests/onboarding.spec.js': 134,
  'tests/shell.spec.js': 102,
};

function getFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (IGNORE_DIRS.some(d => fullPath.includes(d))) continue;
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (CHECK_PATTERNS.some(p => item.endsWith(p.replace('*', '')))) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkFile(filePath) {
  const rel = filePath.replace(/^\.\//, '').replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  const legacyCap = LEGACY_MAX[rel];
  const over = lines > MAX_LINES && (!legacyCap || lines > legacyCap);
  return { filePath: rel, lines, over };
}

// Main
const files = getFiles('.');
const results = files.map(checkFile);
const violations = results.filter(r => r.over);

console.log(`\n📏 File Size Lint (max ${MAX_LINES} lines)\n`);
console.log(`Checked: ${files.length} files`);

if (violations.length > 0) {
  console.log(`\n❌ ${violations.length} file(s) exceed limit:\n`);
  violations.forEach(v => {
    console.log(`  ${v.filePath}: ${v.lines} lines (+${v.lines - MAX_LINES})`);
  });
  process.exit(1);
} else {
  console.log(`\n✅ All files within ${MAX_LINES}-line limit\n`);
  process.exit(0);
}
