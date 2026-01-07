#!/usr/bin/env node
/**
 * UX Visual Audit Script
 * Captures screenshots and extracts styling information for manual review
 * 
 * Run: node tests/ux-visual-audit.js
 * Output: tests/screenshots/ux-audit/
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'screenshots', 'ux-audit');

const PAGES = [
  { name: 'dashboard', url: '/', section: null },
  { name: 'employee-benefits', url: '/employee-benefits.html', section: null },
  { name: 'reconciliation', url: '/reconciliation.html', section: null },
  { name: 'subscription-analysis', url: '/subscription-analysis.html', section: null },
  { name: 'geographic-analysis', url: '/geographic-analysis.html', section: null },
  { name: 'amazon-zip-import', url: '/amazon-zip-import.html', section: null },
  { name: 'about', url: '/about.html', section: null }
];

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 }
];

async function extractStyles(page) {
  return await page.evaluate(() => {
    const results = {
      bodyFont: getComputedStyle(document.body).fontFamily,
      bodyColor: getComputedStyle(document.body).color,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      headings: [],
      buttons: [],
      cards: [],
      icons: [],
      errors: []
    };
    
    // Headings
    document.querySelectorAll('h1, h2, h3').forEach((h, i) => {
      if (i < 5) {
        const style = getComputedStyle(h);
        results.headings.push({
          tag: h.tagName,
          text: h.textContent?.slice(0, 40),
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color
        });
      }
    });
    
    // Buttons
    document.querySelectorAll('.btn, button').forEach((btn, i) => {
      if (i < 5) {
        const style = getComputedStyle(btn);
        results.buttons.push({
          text: btn.textContent?.slice(0, 20),
          bg: style.backgroundColor,
          color: style.color,
          borderRadius: style.borderRadius,
          padding: style.padding
        });
      }
    });
    
    // Cards
    document.querySelectorAll('.card').forEach((card, i) => {
      if (i < 3) {
        const style = getComputedStyle(card);
        results.cards.push({
          bg: style.backgroundColor,
          boxShadow: style.boxShadow,
          borderRadius: style.borderRadius,
          border: style.border
        });
      }
    });
    
    // Icons
    document.querySelectorAll('.fas, .fa, .fab, i[class*="fa-"]').forEach((icon, i) => {
      if (i < 5) {
        const style = getComputedStyle(icon);
        results.icons.push({
          class: icon.className,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          color: style.color
        });
      }
    });
    
    return results;
  });
}

async function captureConsoleErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`CONSOLE: ${msg.text()}`);
    }
  });
  return errors;
}

async function runAudit() {
  console.log('🔍 Starting UX Visual Audit...\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const report = {
    timestamp: new Date().toISOString(),
    pages: {}
  };
  
  for (const pageInfo of PAGES) {
    console.log(`\n📄 Testing: ${pageInfo.name}`);
    const page = await context.newPage();
    const errors = [];
    
    // Capture console errors
    page.on('pageerror', err => errors.push(`PAGE: ${err.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
    });
    
    try {
      // Desktop screenshot
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      
      const desktopPath = path.join(OUTPUT_DIR, `${pageInfo.name}-desktop.png`);
      await page.screenshot({ path: desktopPath, fullPage: true });
      console.log(`  ✅ Desktop screenshot: ${desktopPath}`);
      
      // Mobile screenshot
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      const mobilePath = path.join(OUTPUT_DIR, `${pageInfo.name}-mobile.png`);
      await page.screenshot({ path: mobilePath, fullPage: true });
      console.log(`  ✅ Mobile screenshot: ${mobilePath}`);
      
      // Extract styles
      const styles = await extractStyles(page);
      
      report.pages[pageInfo.name] = {
        url: pageInfo.url,
        styles,
        errors: errors.filter(e => !e.includes('lit') && !e.includes('module specifier')),
        screenshots: {
          desktop: `${pageInfo.name}-desktop.png`,
          mobile: `${pageInfo.name}-mobile.png`
        }
      };
      
      if (errors.length > 0) {
        console.log(`  ⚠️  Console errors: ${errors.length}`);
        errors.slice(0, 3).forEach(e => console.log(`     - ${e.slice(0, 80)}`));
      }
      
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      report.pages[pageInfo.name] = { error: err.message };
    }
    
    await page.close();
  }
  
  // Write JSON report
  const reportPath = path.join(OUTPUT_DIR, 'ux-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Report saved: ${reportPath}`);
  
  // Write human-readable summary
  const summaryPath = path.join(OUTPUT_DIR, 'AUDIT_SUMMARY.md');
  let summary = `# UX Visual Audit Summary\n\n`;
  summary += `**Generated:** ${report.timestamp}\n\n`;
  summary += `## Screenshots Captured\n\n`;
  
  for (const [name, data] of Object.entries(report.pages)) {
    summary += `### ${name}\n`;
    if (data.error) {
      summary += `❌ Error: ${data.error}\n\n`;
    } else {
      summary += `- Desktop: \`${data.screenshots.desktop}\`\n`;
      summary += `- Mobile: \`${data.screenshots.mobile}\`\n`;
      summary += `- Errors: ${data.errors.length}\n`;
      if (data.styles.bodyFont) {
        summary += `- Font: ${data.styles.bodyFont.slice(0, 50)}\n`;
      }
      summary += `\n`;
    }
  }
  
  summary += `## Style Analysis\n\n`;
  for (const [name, data] of Object.entries(report.pages)) {
    if (data.styles) {
      summary += `### ${name}\n\n`;
      summary += `**Body:** bg=${data.styles.bodyBg}, color=${data.styles.bodyColor}\n\n`;
      
      if (data.styles.buttons.length > 0) {
        summary += `**Buttons:**\n`;
        data.styles.buttons.forEach(b => {
          summary += `- "${b.text}": bg=${b.bg}, radius=${b.borderRadius}\n`;
        });
        summary += `\n`;
      }
      
      if (data.styles.cards.length > 0) {
        summary += `**Cards:**\n`;
        data.styles.cards.forEach(c => {
          summary += `- shadow=${c.boxShadow?.slice(0, 40)}, radius=${c.borderRadius}\n`;
        });
        summary += `\n`;
      }
    }
  }
  
  fs.writeFileSync(summaryPath, summary);
  console.log(`📝 Summary saved: ${summaryPath}`);
  
  await browser.close();
  
  console.log('\n✅ Audit complete! Review screenshots in tests/screenshots/ux-audit/\n');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
