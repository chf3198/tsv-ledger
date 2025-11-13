/**
 * Analytics Routes Module
 *
 * Handles premium analytics and AI analysis endpoints for TSV Ledger.
 *
 * @module routes/analytics
 * @version 1.0.0
 */

const express = require('express');
const { getAllExpenditures } = require('../database');
const AIAnalysisEngine = require('../ai-analysis-engine');

const router = express.Router();

/**
 * GET /api/premium-status
 * Get premium feature status
 */
router.get('/premium-status', (req, res) => {
  try {
    // Check if premium features are available
    const premiumFeatures = {
      aiAnalysis: true,
      advancedReporting: true,
      subscriptionTracking: true,
      geographicAnalysis: true,
      amazonIntegration: true,
      businessIntelligence: true
    };

    res.json({
      premium: true,
      features: premiumFeatures,
      version: '2.2.3'
    });
  } catch (error) {
    console.error('Premium status error:', error);
    res.status(500).json({
      error: 'Failed to get premium status',
      message: error.message
    });
  }
});

/**
 * GET /api/premium-analytics
 * Get premium analytics data
 */
router.get('/premium-analytics', async (req, res) => {
  try {
    getAllExpenditures(async (err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for analytics:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      // Calculate premium metrics
      const totalSpent = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
      const avgTransaction = totalSpent / expenditures.length;

      // Category breakdown
      const categoryBreakdown = {};
      expenditures.forEach(exp => {
        categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
      });

      // Monthly spending trend
      const monthlySpending = {};
      expenditures.forEach(exp => {
        const month = new Date(exp.date).toISOString().substring(0, 7); // YYYY-MM
        monthlySpending[month] = (monthlySpending[month] || 0) + exp.amount;
      });

      // Top spending categories
      const topCategories = Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      res.json({
        summary: {
          totalExpenditures: expenditures.length,
          totalSpent: totalSpent,
          averageTransaction: avgTransaction
        },
        categoryBreakdown: categoryBreakdown,
        monthlySpending: monthlySpending,
        topCategories: topCategories,
        insights: [
          `Highest spending category: ${topCategories[0]?.[0] || 'N/A'} ($${topCategories[0]?.[1]?.toFixed(2) || '0.00'})`,
          `Average transaction: $${avgTransaction.toFixed(2)}`,
          `Total transactions: ${expenditures.length}`
        ]
      });
    });
  } catch (error) {
    console.error('Premium analytics error:', error);
    res.status(500).json({
      error: 'Failed to generate analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis
 * Get basic expenditure analysis
 */
router.get('/analysis', (req, res) => {
  try {
    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for analysis:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      // Basic analysis
      const totalSpent = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
      const avgAmount = totalSpent / expenditures.length;

      // Category analysis
      const categories = {};
      expenditures.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
      });

      // Date range analysis
      const dates = expenditures.map(exp => new Date(exp.date)).sort((a, b) => a - b);
      const dateRange = dates.length > 0 ? {
        start: dates[0].toISOString().split('T')[0],
        end: dates[dates.length - 1].toISOString().split('T')[0]
      } : null;

      res.json({
        totalExpenditures: expenditures.length,
        totalSpent: totalSpent,
        averageAmount: avgAmount,
        categories: categories,
        dateRange: dateRange,
        topCategory: Object.entries(categories).sort(([,a], [,b]) => b - a)[0]
      });
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/ai-analysis
 * Get AI-powered analysis and insights
 */
router.get('/ai-analysis', async (req, res) => {
  try {
    getAllExpenditures(async (err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for AI analysis:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      if (expenditures.length === 0) {
        return res.json({
          insights: ['No expenditure data available for analysis'],
          recommendations: ['Import some expenditure data to get AI-powered insights'],
          patterns: []
        });
      }

      // Use AI Analysis Engine
      const aiEngine = new AIAnalysisEngine();
      const analysis = await aiEngine.analyzeExpenditures(expenditures);

      res.json(analysis);
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate AI analysis',
      message: error.message
    });
  }
});

module.exports = router;