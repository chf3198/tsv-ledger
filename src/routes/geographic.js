/**
 * Geographic Routes Module
 *
 * Handles geographic analysis and location-based insights.
 *
 * @module routes/geographic
 * @version 1.0.0
 */

const express = require('express');
const { getAllExpenditures } = require('../database');
const geographicAnalysisEngine = require('../geographic-analysis-engine');

const router = express.Router();

/**
 * GET /api/geographic-dashboard
 * Get geographic dashboard data
 */
router.get('/geographic-dashboard', (req, res) => {
  try {
    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for geographic dashboard:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      // Basic geographic analysis (simplified for now)
      const geographicData = analyzeGeographicData(expenditures);

      res.json({
        summary: geographicData.summary,
        topLocations: geographicData.topLocations,
        spendingByRegion: geographicData.spendingByRegion,
        trends: geographicData.trends
      });
    });
  } catch (error) {
    console.error('Geographic dashboard error:', error);
    res.status(500).json({
      error: 'Failed to generate geographic dashboard',
      message: error.message
    });
  }
});

/**
 * GET /api/geographic-analysis
 * Get detailed geographic analysis
 */
router.get('/geographic-analysis', async (req, res) => {
  try {
    getAllExpenditures(async (err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for geographic analysis:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      // Use geographic analysis engine
      const analysis = analyzeGeographicData(expenditures);

      res.json(analysis);
    });
  } catch (error) {
    console.error('Geographic analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate geographic analysis',
      message: error.message
    });
  }
});

/**
 * Analyze geographic data from expenditures
 */
function analyzeGeographicData(expenditures) {
  // For now, we'll do basic analysis based on available data
  // In a real implementation, this would use location data from orders

  const summary = {
    totalLocations: 0,
    totalSpent: expenditures.reduce((sum, exp) => sum + exp.amount, 0),
    averageSpendingPerLocation: 0
  };

  // Try to extract location information from descriptions or metadata
  const locationData = {};

  expenditures.forEach(exp => {
    let location = 'Unknown';

    // Try to extract location from description
    const locationPatterns = [
      /\b(New York|NY|NYC|Brooklyn|Manhattan|Queens|Bronx|Staten Island)\b/i,
      /\b(California|CA|Los Angeles|LA|San Francisco|SF|San Diego|SD|Sacramento)\b/i,
      /\b(Texas|TX|Austin|Dallas|Houston|San Antonio|Fort Worth)\b/i,
      /\b(Florida|FL|Miami|Orlando|Tampa|Jacksonville)\b/i,
      /\b(Illinois|IL|Chicago|Springfield|Naperville)\b/i
    ];

    for (const pattern of locationPatterns) {
      const match = exp.description.match(pattern);
      if (match) {
        location = match[1];
        break;
      }
    }

    // Also check metadata for location info
    if (exp.metadata && exp.metadata.location) {
      location = exp.metadata.location;
    }

    if (!locationData[location]) {
      locationData[location] = {
        totalSpent: 0,
        transactionCount: 0,
        categories: {}
      };
    }

    locationData[location].totalSpent += exp.amount;
    locationData[location].transactionCount += 1;
    locationData[location].categories[exp.category] = (locationData[location].categories[exp.category] || 0) + exp.amount;
  });

  // Convert to array and sort by spending
  const topLocations = Object.entries(locationData)
    .map(([location, data]) => ({
      location,
      totalSpent: data.totalSpent,
      transactionCount: data.transactionCount,
      averageTransaction: data.totalSpent / data.transactionCount,
      topCategory: Object.entries(data.categories).sort(([,a], [,b]) => b - a)[0]
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Group by region (simplified)
  const regionMapping = {
    'New York': 'Northeast',
    'NY': 'Northeast',
    'NYC': 'Northeast',
    'Brooklyn': 'Northeast',
    'Manhattan': 'Northeast',
    'California': 'West',
    'CA': 'West',
    'Los Angeles': 'West',
    'LA': 'West',
    'San Francisco': 'West',
    'SF': 'West',
    'Texas': 'South',
    'TX': 'South',
    'Austin': 'South',
    'Dallas': 'South',
    'Houston': 'South',
    'Florida': 'South',
    'FL': 'South',
    'Miami': 'South',
    'Illinois': 'Midwest',
    'IL': 'Midwest',
    'Chicago': 'Midwest'
  };

  const spendingByRegion = {};
  Object.entries(locationData).forEach(([location, data]) => {
    const region = regionMapping[location] || 'Other';
    spendingByRegion[region] = (spendingByRegion[region] || 0) + data.totalSpent;
  });

  summary.totalLocations = Object.keys(locationData).length;
  summary.averageSpendingPerLocation = summary.totalSpent / summary.totalLocations;

  // Calculate trends (simplified)
  const trends = {
    highestSpendingLocation: topLocations[0] || null,
    mostActiveRegion: Object.entries(spendingByRegion).sort(([,a], [,b]) => b - a)[0] || null,
    locationDiversity: Object.keys(locationData).length > 5 ? 'high' : 'low'
  };

  return {
    summary,
    topLocations,
    spendingByRegion,
    trends
  };
}

module.exports = router;
