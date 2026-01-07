/**
 * Employee Benefits Routes Module
 *
 * Handles employee benefits filtering and analysis endpoints.
 *
 * @module routes/employee-benefits
 * @version 1.0.0
 */

const express = require('express');
const { getAllExpenditures } = require('../database');

const router = express.Router();

/**
 * POST /api/employee-benefits-filter
 * Filter expenditures for employee benefits analysis
 */
router.post('/employee-benefits-filter', (req, res) => {
  try {
    const { filters, analysisType } = req.body;

    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for benefits analysis:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      let filteredExpenditures = expenditures;

      // Apply filters
      if (filters) {
        if (filters.startDate) {
          filteredExpenditures = filteredExpenditures.filter(exp =>
            new Date(exp.date) >= new Date(filters.startDate)
          );
        }
        if (filters.endDate) {
          filteredExpenditures = filteredExpenditures.filter(exp =>
            new Date(exp.date) <= new Date(filters.endDate)
          );
        }
        if (filters.minAmount) {
          filteredExpenditures = filteredExpenditures.filter(exp =>
            exp.amount >= parseFloat(filters.minAmount)
          );
        }
        if (filters.maxAmount) {
          filteredExpenditures = filteredExpenditures.filter(exp =>
            exp.amount <= parseFloat(filters.maxAmount)
          );
        }
        if (filters.categories && filters.categories.length > 0) {
          filteredExpenditures = filteredExpenditures.filter(exp =>
            filters.categories.includes(exp.category)
          );
        }
        if (filters.sources && filters.sources.length > 0) {
          filteredExpenditures = filteredExpenditures.filter(exp =>
            filters.sources.includes(exp.source)
          );
        }
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredExpenditures = filteredExpenditures.filter(exp =>
            exp.description.toLowerCase().includes(searchLower) ||
            exp.category.toLowerCase().includes(searchLower)
          );
        }
      }

      // Perform analysis based on type
      let analysis = {};

      switch (analysisType) {
      case 'summary':
        analysis = generateBenefitsSummary(filteredExpenditures);
        break;
      case 'category-breakdown':
        analysis = generateCategoryBreakdown(filteredExpenditures);
        break;
      case 'temporal-analysis':
        analysis = generateTemporalAnalysis(filteredExpenditures);
        break;
      case 'anomaly-detection':
        analysis = generateAnomalyDetection(filteredExpenditures);
        break;
      default:
        analysis = generateBenefitsSummary(filteredExpenditures);
      }

      res.json({
        success: true,
        data: {
          totalRecords: filteredExpenditures.length,
          dateRange: getDateRange(filteredExpenditures),
          analysis
        },
        expenditures: filteredExpenditures.slice(0, 100) // Limit response size
      });
    });
  } catch (error) {
    console.error('Employee benefits filter error:', error);
    res.status(500).json({
      error: 'Failed to filter employee benefits data',
      message: error.message
    });
  }
});

/**
 * Generate benefits summary analysis
 */
function generateBenefitsSummary(expenditures) {
  const totalSpent = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
  const avgTransaction = expenditures.length > 0 ? totalSpent / expenditures.length : 0;

  // Category breakdown
  const categoryBreakdown = {};
  expenditures.forEach(exp => {
    categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
  });

  // Source breakdown
  const sourceBreakdown = {};
  expenditures.forEach(exp => {
    sourceBreakdown[exp.source] = (sourceBreakdown[exp.source] || 0) + exp.amount;
  });

  return {
    type: 'summary',
    totalSpent,
    averageTransaction: avgTransaction,
    transactionCount: expenditures.length,
    categoryBreakdown,
    sourceBreakdown,
    topCategory: Object.entries(categoryBreakdown).sort(([,a], [,b]) => b - a)[0]
  };
}

/**
 * Generate category breakdown analysis
 */
function generateCategoryBreakdown(expenditures) {
  const categories = {};

  expenditures.forEach(exp => {
    if (!categories[exp.category]) {
      categories[exp.category] = {
        totalSpent: 0,
        transactionCount: 0,
        averageAmount: 0,
        items: []
      };
    }

    categories[exp.category].totalSpent += exp.amount;
    categories[exp.category].transactionCount += 1;
    categories[exp.category].items.push({
      date: exp.date,
      amount: exp.amount,
      description: exp.description
    });
  });

  // Calculate averages
  Object.keys(categories).forEach(cat => {
    categories[cat].averageAmount = categories[cat].totalSpent / categories[cat].transactionCount;
    // Sort items by date
    categories[cat].items.sort((a, b) => new Date(b.date) - new Date(a.date));
    // Keep only recent items
    categories[cat].items = categories[cat].items.slice(0, 10);
  });

  return {
    type: 'category-breakdown',
    categories,
    categoryCount: Object.keys(categories).length
  };
}

/**
 * Generate temporal analysis
 */
function generateTemporalAnalysis(expenditures) {
  const monthlySpending = {};
  const weeklySpending = {};
  const dailySpending = {};

  expenditures.forEach(exp => {
    const date = new Date(exp.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const weekKey = getWeekKey(date);
    const dayKey = date.toISOString().split('T')[0];

    monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + exp.amount;
    weeklySpending[weekKey] = (weeklySpending[weekKey] || 0) + exp.amount;
    dailySpending[dayKey] = (dailySpending[dayKey] || 0) + exp.amount;
  });

  return {
    type: 'temporal-analysis',
    monthlySpending,
    weeklySpending,
    dailySpending,
    trends: {
      increasingMonths: getIncreasingPeriods(Object.entries(monthlySpending).sort()),
      peakSpendingDay: Object.entries(dailySpending).sort(([,a], [,b]) => b - a)[0]
    }
  };
}

/**
 * Generate anomaly detection analysis
 */
function generateAnomalyDetection(expenditures) {
  if (expenditures.length < 10) {
    return {
      type: 'anomaly-detection',
      anomalies: [],
      note: 'Insufficient data for anomaly detection (need at least 10 transactions)'
    };
  }

  // Calculate basic statistics
  const amounts = expenditures.map(exp => exp.amount);
  const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  // Detect anomalies (values more than 2 standard deviations from mean)
  const anomalies = expenditures.filter(exp => Math.abs(exp.amount - mean) > 2 * stdDev);

  return {
    type: 'anomaly-detection',
    statistics: {
      mean,
      standardDeviation: stdDev,
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts)
    },
    anomalies: anomalies.map(exp => ({
      date: exp.date,
      amount: exp.amount,
      description: exp.description,
      deviation: Math.abs(exp.amount - mean) / stdDev
    })),
    anomalyCount: anomalies.length
  };
}

/**
 * Get date range from expenditures
 */
function getDateRange(expenditures) {
  if (expenditures.length === 0) {
    return null;
  }

  const dates = expenditures.map(exp => new Date(exp.date)).sort((a, b) => a - b);
  return {
    start: dates[0].toISOString().split('T')[0],
    end: dates[dates.length - 1].toISOString().split('T')[0]
  };
}

/**
 * Get week key for temporal analysis
 */
function getWeekKey(date) {
  const year = date.getFullYear();
  const weekNum = Math.ceil((date - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Get increasing spending periods
 */
function getIncreasingPeriods(monthlyData) {
  const increasing = [];
  for (let i = 1; i < monthlyData.length; i++) {
    if (monthlyData[i][1] > monthlyData[i - 1][1]) {
      increasing.push({
        period: monthlyData[i][0],
        increase: monthlyData[i][1] - monthlyData[i - 1][1]
      });
    }
  }
  return increasing.slice(-3); // Return last 3 increasing periods
}

module.exports = router;
