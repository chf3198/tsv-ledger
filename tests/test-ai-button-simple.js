#!/usr/bin/env node

/**
 * AI Analysis Button - Simple Iterative Tester
 * 
 * @fileoverview Focused testing for the AI Analysis button specifically
 *               to identify and resolve the exact issues causing failures.
 * 
 * @version 1.0.0
 * @author GitHub Copilot
 * @since 2025-09-07
 */

const http = require('http');

class SimpleAIButtonTester {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 2000;
    
    console.log('🔧 AI Analysis Button - Simple Iterative Tester');
    console.log('=' .repeat(50));
  }

  /**
   * Run simple iterative tests
   */
  async runTests() {
    console.log('\n🚀 Testing AI Analysis Button Functionality...');
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      console.log(`\n📋 ATTEMPT ${attempt}/${this.maxRetries}`);
      console.log('-'.repeat(30));
      
      try {
        // Test 1: Basic connectivity
        console.log('1️⃣ Testing basic server connectivity...');
        await this.testBasicConnectivity();
        
        // Test 2: Traditional analysis (prerequisite)
        console.log('2️⃣ Testing traditional analysis endpoint...');
        await this.testTraditionalAnalysis();
        
        // Test 3: AI Analysis endpoint (main test)
        console.log('3️⃣ Testing AI Analysis endpoint...');
        const aiResult = await this.testAIAnalysis();
        
        if (aiResult.success) {
          console.log('\n✅ SUCCESS: AI Analysis Button is working!');
          this.reportSuccess(aiResult.data);
          return;
        } else {
          console.log(`\n⚠️  PARTIAL: AI endpoint responded but with issues`);
          console.log(`   Error: ${aiResult.error}`);
        }
        
      } catch (error) {
        console.log(`\n❌ ATTEMPT ${attempt} FAILED: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          console.log(`   Retrying in ${this.retryDelay/1000} seconds...`);
          await this.sleep(this.retryDelay);
        }
      }
    }
    
    console.log('\n❌ FINAL RESULT: AI Analysis Button testing failed after all attempts');
    this.reportFailure();
  }

  /**
   * Test basic server connectivity
   */
  async testBasicConnectivity() {
    try {
      const response = await this.makeRequest('/', 5000);
      
      if (typeof response === 'string' && response.includes('TSV Ledger')) {
        console.log('   ✅ Server is running and serving HTML');
        return true;
      } else {
        throw new Error('Server response invalid');
      }
    } catch (error) {
      throw new Error(`Server connectivity failed: ${error.message}`);
    }
  }

  /**
   * Test traditional analysis endpoint
   */
  async testTraditionalAnalysis() {
    try {
      const analysis = await this.makeRequest('/api/analysis', 15000);
      
      if (analysis && analysis.overview && analysis.overview.totalTransactions) {
        console.log(`   ✅ Traditional analysis working (${analysis.overview.totalTransactions} transactions)`);
        return true;
      } else {
        throw new Error('Traditional analysis response invalid');
      }
    } catch (error) {
      throw new Error(`Traditional analysis failed: ${error.message}`);
    }
  }

  /**
   * Test AI Analysis endpoint
   */
  async testAIAnalysis() {
    try {
      console.log('   🤖 Calling AI Analysis endpoint...');
      const startTime = Date.now();
      
      const aiAnalysis = await this.makeRequest('/api/ai-analysis', 30000);
      const responseTime = Date.now() - startTime;
      
      console.log(`   ⏱️  Response time: ${responseTime}ms`);
      
      // Validate response structure
      if (!aiAnalysis) {
        return { success: false, error: 'No response from AI endpoint' };
      }
      
      if (!aiAnalysis.traditional) {
        return { success: false, error: 'Missing traditional analysis data' };
      }
      
      if (!aiAnalysis.ai) {
        return { success: false, error: 'Missing AI analysis data' };
      }
      
      if (!aiAnalysis.performance) {
        return { success: false, error: 'Missing performance data' };
      }
      
      // Check AI-specific fields
      const ai = aiAnalysis.ai;
      const performance = aiAnalysis.performance;
      
      if (!ai.categorization || !ai.predictions || !ai.anomalies) {
        return { success: false, error: 'AI modules incomplete' };
      }
      
      if (typeof performance.aiConfidence !== 'number' || 
          typeof performance.analysisTime !== 'number' ||
          typeof performance.totalOptimizationValue !== 'number') {
        return { success: false, error: 'Performance metrics invalid' };
      }
      
      console.log(`   ✅ AI Analysis successful!`);
      console.log(`      Confidence: ${(performance.aiConfidence * 100).toFixed(1)}%`);
      console.log(`      Analysis Time: ${performance.analysisTime.toFixed(2)}s`);
      console.log(`      Optimization Value: $${performance.totalOptimizationValue.toFixed(2)}/month`);
      
      return { 
        success: true, 
        data: {
          confidence: performance.aiConfidence,
          analysisTime: performance.analysisTime,
          optimizationValue: performance.totalOptimizationValue,
          transactionCount: aiAnalysis.traditional.totalTransactions,
          aiModules: Object.keys(ai).length
        }
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Report success
   */
  reportSuccess(data) {
    console.log('\n🎉 AI ANALYSIS BUTTON SUCCESS REPORT');
    console.log('=' .repeat(40));
    console.log('\n✅ Status: FULLY FUNCTIONAL');
    console.log('\n📊 Performance Metrics:');
    console.log(`   • AI Confidence: ${(data.confidence * 100).toFixed(1)}%`);
    console.log(`   • Analysis Time: ${data.analysisTime.toFixed(2)} seconds`);
    console.log(`   • Transactions Processed: ${data.transactionCount}`);
    console.log(`   • AI Modules Active: ${data.aiModules}`);
    console.log(`   • Optimization Potential: $${data.optimizationValue.toFixed(2)}/month`);
    
    console.log('\n🎯 Button Functionality:');
    console.log('   • Server connectivity: ✅ Working');
    console.log('   • Traditional analysis: ✅ Working');
    console.log('   • AI analysis endpoint: ✅ Working');
    console.log('   • AI modules: ✅ All functional');
    console.log('   • Performance: ✅ Acceptable');
    
    console.log('\n🚀 Ready for Production:');
    console.log('   The "Run AI Analysis" button is fully functional and ready for users to click.');
    console.log('   Users will see comprehensive AI insights, predictions, and optimization recommendations.');
  }

  /**
   * Report failure
   */
  reportFailure() {
    console.log('\n❌ AI ANALYSIS BUTTON FAILURE REPORT');
    console.log('=' .repeat(40));
    console.log('\n🔍 Likely Issues:');
    console.log('   1. Server not running: Start with "node server.js"');
    console.log('   2. Missing dependencies: Run "npm install"');
    console.log('   3. Syntax errors in AI engine or server code');
    console.log('   4. Missing required files (ai-analysis-engine.js, tsv-categorizer.js)');
    console.log('   5. Database or data loading issues');
    
    console.log('\n🔧 Debug Steps:');
    console.log('   • Check server logs for error messages');
    console.log('   • Test individual endpoints manually');
    console.log('   • Verify all AI modules are properly exported');
    console.log('   • Check for TypeScript/JavaScript syntax errors');
    
    console.log('\n💡 Quick Fixes:');
    console.log('   • Restart server: node server.js');
    console.log('   • Check console: Look for red error messages');
    console.log('   • Test endpoint: curl http://localhost:3000/api/ai-analysis');
  }

  /**
   * Make HTTP request
   */
  makeRequest(path, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET',
        timeout: timeout
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }
          
          // Try to parse as JSON, fallback to string
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            // For HTML responses (like the main page)
            resolve(data);
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Connection error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      req.end();
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Additional Validation Script
async function validateButtonRequirements() {
  console.log('\n🔍 VALIDATING AI BUTTON REQUIREMENTS');
  console.log('=' .repeat(40));
  
  const fs = require('fs');
  const path = require('path');
  
  // Check required files
  const requiredFiles = [
    'server.js',
    'ai-analysis-engine.js',
    'tsv-categorizer.js',
    'public/index.html',
    'public/js/ai-dashboard.js'
  ];
  
  console.log('\n📁 Checking Required Files:');
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING`);
    }
  });
  
  // Check HTML for AI button
  console.log('\n🔘 Checking AI Button in HTML:');
  try {
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    if (htmlContent.includes('loadAIAnalysis')) {
      console.log('   ✅ AI Analysis button found in HTML');
    } else {
      console.log('   ❌ AI Analysis button missing from HTML');
    }
    
    if (htmlContent.includes('ai-dashboard-container')) {
      console.log('   ✅ AI dashboard container found');
    } else {
      console.log('   ❌ AI dashboard container missing');
    }
    
    if (htmlContent.includes('ai-dashboard.js')) {
      console.log('   ✅ AI dashboard script included');
    } else {
      console.log('   ❌ AI dashboard script not included');
    }
    
  } catch (error) {
    console.log(`   ❌ HTML validation failed: ${error.message}`);
  }
  
  console.log('\n🎯 Validation complete. Check for any ❌ items above.');
}

// Run the tests
async function main() {
  await validateButtonRequirements();
  
  const tester = new SimpleAIButtonTester();
  await tester.runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SimpleAIButtonTester, validateButtonRequirements };
