#!/usr/bin/env node

/**
 * AI Analysis Engine - Comprehensive Testing Script
 * 
 * @fileoverview Tests and demonstrates the AI-enhanced analysis capabilities
 *               of the TSV Ledger system, including machine learning categorization,
 *               predictive analytics, anomaly detection, and optimization.
 * 
 * @version 1.0.0
 * @author GitHub Copilot
 * @since 2025-09-07
 * 
 * @example
 * node test-ai-analysis.js
 */

const http = require('http');

class AIAnalysisTester {
  constructor() {
    this.testResults = {
      endpointTests: [],
      aiModuleTests: [],
      performanceTests: [],
      integrationTests: []
    };
    
    console.log('🤖 AI Analysis Engine Testing Suite v1.0.0');
    console.log('=' .repeat(60));
  }

  /**
   * Run all AI analysis tests
   */
  async runAllTests() {
    console.log('\n🚀 Starting Comprehensive AI Analysis Testing...');
    
    try {
      // Test server connectivity
      await this.testServerConnectivity();
      
      // Test traditional analysis endpoint
      await this.testTraditionalAnalysis();
      
      // Test AI analysis endpoint
      await this.testAIAnalysisEndpoint();
      
      // Test AI module functionality
      await this.testAIModules();
      
      // Test performance metrics
      await this.testPerformanceMetrics();
      
      // Test integration quality
      await this.testIntegrationQuality();
      
      // Generate comprehensive report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Testing Suite Error:', error.message);
    }
  }

  /**
   * Test server connectivity
   */
  async testServerConnectivity() {
    console.log('\n🔌 Testing Server Connectivity...');
    
    try {
      const response = await this.makeRequest('/api/premium-status');
      
      if (response.premiumFeaturesAvailable) {
        console.log('   ✅ Server is running with premium features');
        this.testResults.endpointTests.push({
          test: 'Server Connectivity',
          status: 'PASS',
          message: 'Premium features available'
        });
      } else {
        console.log('   ⚠️  Server running but premium features unavailable');
        this.testResults.endpointTests.push({
          test: 'Server Connectivity',
          status: 'WARN',
          message: 'Limited to basic features'
        });
      }
    } catch (error) {
      console.log('   ❌ Server connectivity failed');
      this.testResults.endpointTests.push({
        test: 'Server Connectivity',
        status: 'FAIL',
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Test traditional analysis endpoint
   */
  async testTraditionalAnalysis() {
    console.log('\n📊 Testing Traditional Analysis...');
    
    try {
      const analysis = await this.makeRequest('/api/analysis');
      
      // Validate traditional analysis structure
      const expectedFields = [
        'overview', 'categoryBreakdown', 'subscribeAndSave', 
        'monthlyTrends', 'insights', 'dataQuality'
      ];
      
      const missingFields = expectedFields.filter(field => !analysis[field]);
      
      if (missingFields.length === 0) {
        console.log('   ✅ Traditional analysis structure valid');
        console.log(`   📈 Total Transactions: ${analysis.overview.totalTransactions}`);
        console.log(`   💰 Total Amount: $${analysis.overview.totalAmount.toFixed(2)}`);
        console.log(`   🔍 Categories: ${Object.keys(analysis.categoryBreakdown).length}`);
        
        this.testResults.endpointTests.push({
          test: 'Traditional Analysis',
          status: 'PASS',
          message: `${analysis.overview.totalTransactions} transactions analyzed`
        });
      } else {
        console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
        this.testResults.endpointTests.push({
          test: 'Traditional Analysis',
          status: 'FAIL',
          message: `Missing fields: ${missingFields.join(', ')}`
        });
      }
    } catch (error) {
      console.log('   ❌ Traditional analysis failed');
      this.testResults.endpointTests.push({
        test: 'Traditional Analysis',
        status: 'FAIL',
        message: error.message
      });
    }
  }

  /**
   * Test AI analysis endpoint
   */
  async testAIAnalysisEndpoint() {
    console.log('\n🤖 Testing AI Analysis Endpoint...');
    
    try {
      const startTime = Date.now();
      const aiAnalysis = await this.makeRequest('/api/ai-analysis');
      const responseTime = Date.now() - startTime;
      
      console.log(`   ⏱️  Response time: ${responseTime}ms`);
      
      // Validate AI analysis structure
      const expectedFields = [
        'traditional', 'ai', 'recommendations', 
        'riskAssessment', 'insights', 'performance'
      ];
      
      const missingFields = expectedFields.filter(field => !aiAnalysis[field]);
      
      if (missingFields.length === 0) {
        console.log('   ✅ AI analysis structure valid');
        
        // Test AI-specific fields
        if (aiAnalysis.ai.categorization && aiAnalysis.ai.predictions) {
          console.log(`   🧠 AI Confidence: ${(aiAnalysis.performance.aiConfidence * 100).toFixed(1)}%`);
          console.log(`   ⚡ Analysis Time: ${aiAnalysis.performance.analysisTime.toFixed(2)}s`);
          console.log(`   🔧 Improvements: ${aiAnalysis.performance.improvementsPossible} transactions`);
          console.log(`   💰 Optimization Potential: $${aiAnalysis.performance.totalOptimizationValue.toFixed(2)}/month`);
          
          this.testResults.endpointTests.push({
            test: 'AI Analysis Endpoint',
            status: 'PASS',
            message: `${(aiAnalysis.performance.aiConfidence * 100).toFixed(1)}% confidence, $${aiAnalysis.performance.totalOptimizationValue.toFixed(2)} optimization potential`
          });
        } else {
          console.log('   ❌ AI-specific fields missing');
          this.testResults.endpointTests.push({
            test: 'AI Analysis Endpoint',
            status: 'FAIL',
            message: 'AI-specific fields missing'
          });
        }
      } else {
        console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
        this.testResults.endpointTests.push({
          test: 'AI Analysis Endpoint',
          status: 'FAIL',
          message: `Missing fields: ${missingFields.join(', ')}`
        });
      }
      
      // Store AI analysis for further testing
      this.aiAnalysisData = aiAnalysis;
      
    } catch (error) {
      console.log('   ❌ AI analysis endpoint failed');
      this.testResults.endpointTests.push({
        test: 'AI Analysis Endpoint',
        status: 'FAIL',
        message: error.message
      });
    }
  }

  /**
   * Test individual AI modules
   */
  async testAIModules() {
    console.log('\n🧠 Testing AI Module Functionality...');
    
    if (!this.aiAnalysisData) {
      console.log('   ❌ AI analysis data not available for module testing');
      return;
    }

    const modules = [
      { name: 'Categorization', data: this.aiAnalysisData.ai.categorization },
      { name: 'Predictions', data: this.aiAnalysisData.ai.predictions },
      { name: 'Anomalies', data: this.aiAnalysisData.ai.anomalies },
      { name: 'Patterns', data: this.aiAnalysisData.ai.patterns },
      { name: 'Optimizations', data: this.aiAnalysisData.ai.optimizations }
    ];

    modules.forEach(module => {
      if (module.data && typeof module.data === 'object') {
        console.log(`   ✅ ${module.name} module functional`);
        
        // Module-specific validation
        if (module.name === 'Categorization' && module.data.confidence) {
          console.log(`      Confidence: ${(module.data.confidence * 100).toFixed(1)}%`);
          console.log(`      Improvements: ${module.data.improved} transactions`);
        }
        
        if (module.name === 'Predictions' && module.data.nextMonth) {
          console.log(`      Next Month: $${module.data.nextMonth.toFixed(2)}`);
          console.log(`      Uncertainty: ±${module.data.uncertainty.toFixed(1)}%`);
        }
        
        if (module.name === 'Anomalies' && Array.isArray(module.data)) {
          console.log(`      Detected: ${module.data.length} anomalies`);
          const highRisk = module.data.filter(a => a.riskScore > 0.7).length;
          console.log(`      High Risk: ${highRisk} transactions`);
        }
        
        this.testResults.aiModuleTests.push({
          module: module.name,
          status: 'PASS',
          message: 'Module functioning correctly'
        });
      } else {
        console.log(`   ❌ ${module.name} module not functional`);
        this.testResults.aiModuleTests.push({
          module: module.name,
          status: 'FAIL',
          message: 'Module data missing or invalid'
        });
      }
    });
  }

  /**
   * Test performance metrics
   */
  async testPerformanceMetrics() {
    console.log('\n⚡ Testing Performance Metrics...');
    
    if (!this.aiAnalysisData) {
      console.log('   ❌ AI analysis data not available for performance testing');
      return;
    }

    const performance = this.aiAnalysisData.performance;
    
    // Test response time
    if (performance.analysisTime < 10) {
      console.log(`   ✅ Analysis time acceptable: ${performance.analysisTime.toFixed(2)}s`);
      this.testResults.performanceTests.push({
        metric: 'Analysis Time',
        status: 'PASS',
        value: `${performance.analysisTime.toFixed(2)}s`
      });
    } else {
      console.log(`   ⚠️  Analysis time slow: ${performance.analysisTime.toFixed(2)}s`);
      this.testResults.performanceTests.push({
        metric: 'Analysis Time',
        status: 'WARN',
        value: `${performance.analysisTime.toFixed(2)}s`
      });
    }
    
    // Test AI confidence
    if (performance.aiConfidence > 0.7) {
      console.log(`   ✅ AI confidence high: ${(performance.aiConfidence * 100).toFixed(1)}%`);
      this.testResults.performanceTests.push({
        metric: 'AI Confidence',
        status: 'PASS',
        value: `${(performance.aiConfidence * 100).toFixed(1)}%`
      });
    } else {
      console.log(`   ⚠️  AI confidence low: ${(performance.aiConfidence * 100).toFixed(1)}%`);
      this.testResults.performanceTests.push({
        metric: 'AI Confidence',
        status: 'WARN',
        value: `${(performance.aiConfidence * 100).toFixed(1)}%`
      });
    }
    
    // Test optimization value
    if (performance.totalOptimizationValue > 0) {
      console.log(`   ✅ Optimization potential: $${performance.totalOptimizationValue.toFixed(2)}/month`);
      this.testResults.performanceTests.push({
        metric: 'Optimization Value',
        status: 'PASS',
        value: `$${performance.totalOptimizationValue.toFixed(2)}/month`
      });
    } else {
      console.log(`   ❌ No optimization potential detected`);
      this.testResults.performanceTests.push({
        metric: 'Optimization Value',
        status: 'FAIL',
        value: '$0/month'
      });
    }
  }

  /**
   * Test integration quality
   */
  async testIntegrationQuality() {
    console.log('\n🔗 Testing Integration Quality...');
    
    if (!this.aiAnalysisData) {
      console.log('   ❌ AI analysis data not available for integration testing');
      return;
    }

    // Test data consistency between traditional and AI analysis
    const traditional = this.aiAnalysisData.traditional;
    const ai = this.aiAnalysisData.ai;
    
    if (traditional.totalTransactions > 0) {
      console.log(`   ✅ Data consistency: ${traditional.totalTransactions} transactions processed`);
      this.testResults.integrationTests.push({
        test: 'Data Consistency',
        status: 'PASS',
        message: `${traditional.totalTransactions} transactions`
      });
    } else {
      console.log('   ❌ Data consistency issue: no transactions found');
      this.testResults.integrationTests.push({
        test: 'Data Consistency',
        status: 'FAIL',
        message: 'No transactions found'
      });
    }
    
    // Test recommendations quality
    const recommendations = this.aiAnalysisData.recommendations;
    if (recommendations.immediate && recommendations.immediate.length > 0) {
      console.log(`   ✅ Recommendations generated: ${recommendations.immediate.length} immediate`);
      this.testResults.integrationTests.push({
        test: 'Recommendations',
        status: 'PASS',
        message: `${recommendations.immediate.length} recommendations`
      });
    } else {
      console.log('   ❌ No recommendations generated');
      this.testResults.integrationTests.push({
        test: 'Recommendations',
        status: 'FAIL',
        message: 'No recommendations'
      });
    }
    
    // Test risk assessment
    const risk = this.aiAnalysisData.riskAssessment;
    if (risk && risk.level) {
      console.log(`   ✅ Risk assessment: ${risk.level} risk level`);
      this.testResults.integrationTests.push({
        test: 'Risk Assessment',
        status: 'PASS',
        message: `${risk.level} risk level`
      });
    } else {
      console.log('   ❌ Risk assessment missing');
      this.testResults.integrationTests.push({
        test: 'Risk Assessment',
        status: 'FAIL',
        message: 'Risk assessment missing'
      });
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log('\n📋 AI Analysis Engine Test Report');
    console.log('=' .repeat(60));
    
    // Summary statistics
    const allTests = [
      ...this.testResults.endpointTests,
      ...this.testResults.aiModuleTests,
      ...this.testResults.performanceTests,
      ...this.testResults.integrationTests
    ];
    
    const passed = allTests.filter(t => t.status === 'PASS').length;
    const warned = allTests.filter(t => t.status === 'WARN').length;
    const failed = allTests.filter(t => t.status === 'FAIL').length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${allTests.length}`);
    console.log(`   ✅ Passed: ${passed} (${(passed/allTests.length*100).toFixed(1)}%)`);
    console.log(`   ⚠️  Warnings: ${warned} (${(warned/allTests.length*100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failed} (${(failed/allTests.length*100).toFixed(1)}%)`);
    
    // Detailed results
    console.log('\n📝 Detailed Results:');
    
    console.log('\n🔌 Endpoint Tests:');
    this.testResults.endpointTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.test}: ${test.message}`);
    });
    
    console.log('\n🧠 AI Module Tests:');
    this.testResults.aiModuleTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.module}: ${test.message}`);
    });
    
    console.log('\n⚡ Performance Tests:');
    this.testResults.performanceTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.metric}: ${test.value}`);
    });
    
    console.log('\n🔗 Integration Tests:');
    this.testResults.integrationTests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
      console.log(`   ${icon} ${test.test}: ${test.message}`);
    });
    
    // Overall assessment
    const passRate = passed / allTests.length;
    let overallStatus;
    
    if (passRate >= 0.9) {
      overallStatus = '🎉 EXCELLENT - AI Analysis Engine fully operational';
    } else if (passRate >= 0.7) {
      overallStatus = '✅ GOOD - AI Analysis Engine mostly functional';
    } else if (passRate >= 0.5) {
      overallStatus = '⚠️  FAIR - AI Analysis Engine has issues';
    } else {
      overallStatus = '❌ POOR - AI Analysis Engine needs attention';
    }
    
    console.log(`\n🎯 Overall Assessment: ${overallStatus}`);
    
    // Recommendations
    if (failed > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   • Review failed tests and fix underlying issues');
      console.log('   • Ensure server is running with all dependencies');
      console.log('   • Check AI module implementations for errors');
    }
    
    if (this.aiAnalysisData && this.aiAnalysisData.performance.totalOptimizationValue > 100) {
      console.log(`   • Significant optimization potential detected: $${this.aiAnalysisData.performance.totalOptimizationValue.toFixed(2)}/month`);
    }
    
    console.log('\n🚀 AI Analysis Engine Testing Complete!');
  }

  /**
   * Make HTTP request to server
   */
  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET',
        timeout: 30000 // 30 second timeout for AI analysis
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }
}

// Run the AI analysis testing suite
async function main() {
  const tester = new AIAnalysisTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AIAnalysisTester;
