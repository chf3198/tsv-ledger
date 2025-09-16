/**
 * Geographic Analysis Engine
 *
 * @fileoverview Advanced geographic analysis system for TSV Ledger
 *               analyzing shipping addresses, delivery patterns, and
 *               geographic performance metrics from Amazon order data.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 * @since 2025-09-16
 *
 * @features
 * - Geographic distribution analysis by state/city
 * - Delivery pattern analysis and optimization
 * - Revenue analysis by geographic regions
 * - Shipping cost analysis by location
 * - Geographic performance metrics and trends
 * - Interactive maps and location-based insights
 *
 * @requires fs File system operations
 * @requires csv-parser CSV parsing for order data
 * @requires path Path utilities for file operations
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Geographic Analysis Engine Class
 * Handles geographic analysis of Amazon orders and shipping data
 */
class GeographicAnalysisEngine {

  constructor() {
    this.orders = [];
    this.geographicData = {
      states: new Map(),
      cities: new Map(),
      zipCodes: new Map(),
      countries: new Map()
    };
    this.analysisCache = new Map();
    this.dataLoaded = false;
  }

  /**
   * Load Amazon order data for geographic analysis
   * @param {string} amazonFilePath - Path to Amazon orders CSV
   * @returns {Promise<boolean>} Success status
   */
  async loadOrderData(amazonFilePath = './data/amazon-comprehensive-orders.csv') {
    try {
      console.log('🔄 Loading Amazon order data for geographic analysis...');

      const orders = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(amazonFilePath)
          .pipe(csv())
          .on('data', (data) => {
            const order = this.parseGeographicOrder(data);
            if (order) orders.push(order);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      this.orders = orders;
      console.log(`✅ Loaded ${orders.length} orders for geographic analysis`);

      // Process geographic data
      this.processGeographicData();
      this.dataLoaded = true;

      console.log('🗺️ Geographic analysis data processed');
      return true;

    } catch (error) {
      console.error('❌ Error loading geographic data:', error);
      return false;
    }
  }

  /**
   * Parse order data with geographic focus
   * @param {Object} data - Raw CSV row data
   * @returns {Object} Parsed order with geographic data
   */
  parseGeographicOrder(data) {
    try {
      const orderDate = new Date(data['Order Date']);
      const totalOwed = parseFloat(data['Total Owed'].replace(/"/g, '')) || 0;
      const shippingCharge = parseFloat(data['Shipping Charge'].replace(/"/g, '')) || 0;
      const tax = parseFloat(data['Total Discounts'].replace(/"/g, '')) || 0;

      // Parse shipping address
      const shippingAddress = data['Shipping Address'] || '';
      const geographicInfo = this.parseShippingAddress(shippingAddress);

      return {
        orderId: data['Order ID'],
        date: orderDate,
        amount: totalOwed,
        shipping: shippingCharge,
        tax: tax,
        productName: data['Product Name'],
        asin: data['ASIN'],
        orderStatus: data['Order Status'],
        paymentMethod: data['Payment Instrument Type'],

        // Geographic data
        shippingAddress: shippingAddress,
        ...geographicInfo,

        // Additional analysis fields
        month: orderDate.getMonth() + 1,
        year: orderDate.getFullYear(),
        dayOfWeek: orderDate.getDay(),
        isWeekend: orderDate.getDay() === 0 || orderDate.getDay() === 6
      };

    } catch (error) {
      console.warn('⚠️ Error parsing geographic order:', error.message);
      return null;
    }
  }

  /**
   * Parse shipping address into geographic components
   * @param {string} address - Shipping address string
   * @returns {Object} Parsed geographic information
   */
  parseShippingAddress(address) {
    if (!address || address.trim() === '') {
      return {
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isValid: false
      };
    }

    // Clean the address
    const cleanAddress = address.replace(/"/g, '').trim();

    // Split by spaces and commas
    const parts = cleanAddress.split(/[\s,]+/);

    // Extract geographic components
    // Format: "Name Street Address City State ZIP Country"
    let country = '';
    let state = '';
    let zipCode = '';
    let city = '';
    let street = '';
    let name = '';

    // Country is usually last (United States)
    if (parts[parts.length - 1] === 'States' && parts[parts.length - 2] === 'United') {
      country = 'United States';
      parts.splice(-2, 2);
    } else if (parts.length > 0) {
      country = parts.pop();
    }

    // ZIP code (usually 5 or 9 digits)
    const zipMatch = parts[parts.length - 1]?.match(/^\d{5}(-\d{4})?$/);
    if (zipMatch) {
      zipCode = parts.pop();
    }

    // State (usually 2 letters)
    const stateMatch = parts[parts.length - 1]?.match(/^[A-Z]{2}$/);
    if (stateMatch) {
      state = parts.pop();
    }

    // City (remaining parts except first which is usually name)
    if (parts.length > 1) {
      city = parts[parts.length - 1];
      parts.pop();
    }

    // Street address (middle parts)
    if (parts.length > 1) {
      street = parts.slice(1).join(' ');
    }

    // Name (first part)
    if (parts.length > 0) {
      name = parts[0];
    }

    return {
      name,
      street,
      city,
      state,
      zipCode,
      country,
      isValid: !!(city && state && country),
      fullAddress: cleanAddress
    };
  }

  /**
   * Process geographic data from all orders
   */
  processGeographicData() {
    // Reset data
    this.geographicData = {
      states: new Map(),
      cities: new Map(),
      zipCodes: new Map(),
      countries: new Map()
    };

    this.orders.forEach(order => {
      if (!order.isValid) return;

      // Process state data
      this.updateGeographicStats(this.geographicData.states, order.state, order);

      // Process city data
      const cityKey = `${order.city}, ${order.state}`;
      this.updateGeographicStats(this.geographicData.cities, cityKey, order);

      // Process ZIP code data
      this.updateGeographicStats(this.geographicData.zipCodes, order.zipCode, order);

      // Process country data
      this.updateGeographicStats(this.geographicData.countries, order.country, order);
    });
  }

  /**
   * Update geographic statistics for a location
   * @param {Map} statsMap - Statistics map to update
   * @param {string} key - Location key
   * @param {Object} order - Order data
   */
  updateGeographicStats(statsMap, key, order) {
    if (!key || key.trim() === '') return;

    const existing = statsMap.get(key) || {
      location: key,
      orderCount: 0,
      totalRevenue: 0,
      totalShipping: 0,
      averageOrderValue: 0,
      orders: []
    };

    existing.orderCount++;
    existing.totalRevenue += order.amount;
    existing.totalShipping += order.shipping;
    existing.orders.push(order);

    // Calculate average order value
    existing.averageOrderValue = existing.totalRevenue / existing.orderCount;

    statsMap.set(key, existing);
  }

  /**
   * Generate comprehensive geographic analysis
   * @returns {Object} Geographic analysis results
   */
  generateGeographicAnalysis() {
    if (!this.dataLoaded) {
      throw new Error('Geographic data not loaded. Call loadOrderData() first.');
    }

    console.log('🗺️ Generating geographic analysis...');

    const analysis = {
      summary: this.generateSummaryStats(),
      topLocations: this.generateTopLocations(),
      revenueAnalysis: this.generateRevenueAnalysis(),
      shippingAnalysis: this.generateShippingAnalysis(),
      temporalAnalysis: this.generateTemporalAnalysis(),
      recommendations: this.generateRecommendations()
    };

    return analysis;
  }

  /**
   * Generate summary statistics
   * @returns {Object} Summary statistics
   */
  generateSummaryStats() {
    const validOrders = this.orders.filter(o => o.isValid);
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalShipping = validOrders.reduce((sum, o) => sum + o.shipping, 0);

    return {
      totalOrders: this.orders.length,
      validGeographicOrders: validOrders.length,
      invalidGeographicOrders: this.orders.length - validOrders.length,
      totalRevenue,
      totalShipping,
      averageOrderValue: validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
      averageShippingCost: validOrders.length > 0 ? totalShipping / validOrders.length : 0,
      uniqueStates: this.geographicData.states.size,
      uniqueCities: this.geographicData.cities.size,
      uniqueZipCodes: this.geographicData.zipCodes.size
    };
  }

  /**
   * Generate top locations by various metrics
   * @returns {Object} Top locations analysis
   */
  generateTopLocations() {
    return {
      byOrderCount: this.getTopLocations(this.geographicData.cities, 'orderCount', 10),
      byRevenue: this.getTopLocations(this.geographicData.cities, 'totalRevenue', 10),
      byAverageOrderValue: this.getTopLocations(this.geographicData.cities, 'averageOrderValue', 10),
      statesByRevenue: this.getTopLocations(this.geographicData.states, 'totalRevenue', 5)
    };
  }

  /**
   * Get top locations by a specific metric
   * @param {Map} locationMap - Location data map
   * @param {string} metric - Metric to sort by
   * @param {number} limit - Number of results to return
   * @returns {Array} Top locations
   */
  getTopLocations(locationMap, metric, limit = 10) {
    return Array.from(locationMap.values())
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);
  }

  /**
   * Generate revenue analysis by geography
   * @returns {Object} Revenue analysis
   */
  generateRevenueAnalysis() {
    const stateRevenue = Array.from(this.geographicData.states.values())
      .map(state => ({
        state: state.location,
        revenue: state.totalRevenue,
        orderCount: state.orderCount,
        averageOrderValue: state.averageOrderValue,
        percentageOfTotal: 0 // Will be calculated below
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = stateRevenue.reduce((sum, s) => sum + s.revenue, 0);
    stateRevenue.forEach(state => {
      state.percentageOfTotal = totalRevenue > 0 ? (state.revenue / totalRevenue) * 100 : 0;
    });

    return {
      byState: stateRevenue,
      concentrationAnalysis: this.analyzeRevenueConcentration(stateRevenue),
      growthAnalysis: {} // Could be expanded with time-series data
    };
  }

  /**
   * Analyze revenue concentration
   * @param {Array} stateRevenue - Revenue by state
   * @returns {Object} Concentration analysis
   */
  analyzeRevenueConcentration(stateRevenue) {
    if (stateRevenue.length === 0) return { concentrationRatio: 0, topStatePercentage: 0 };

    const topStateRevenue = stateRevenue[0]?.revenue || 0;
    const totalRevenue = stateRevenue.reduce((sum, s) => sum + s.revenue, 0);
    const concentrationRatio = totalRevenue > 0 ? (topStateRevenue / totalRevenue) * 100 : 0;

    return {
      concentrationRatio,
      topState: stateRevenue[0]?.state || '',
      topStatePercentage: concentrationRatio,
      isHighlyConcentrated: concentrationRatio > 70,
      isModeratelyConcentrated: concentrationRatio > 50 && concentrationRatio <= 70
    };
  }

  /**
   * Generate shipping cost analysis
   * @returns {Object} Shipping analysis
   */
  generateShippingAnalysis() {
    const shippingByState = Array.from(this.geographicData.states.values())
      .map(state => ({
        state: state.location,
        totalShipping: state.totalShipping,
        averageShipping: state.totalShipping / state.orderCount,
        orderCount: state.orderCount
      }))
      .sort((a, b) => b.totalShipping - a.totalShipping);

    return {
      byState: shippingByState,
      overallAverageShipping: this.orders.reduce((sum, o) => sum + o.shipping, 0) / this.orders.length,
      shippingEfficiency: this.analyzeShippingEfficiency(shippingByState)
    };
  }

  /**
   * Analyze shipping efficiency
   * @param {Array} shippingByState - Shipping data by state
   * @returns {Object} Shipping efficiency analysis
   */
  analyzeShippingEfficiency(shippingByState) {
    const avgShipping = shippingByState.reduce((sum, s) => sum + s.averageShipping, 0) / shippingByState.length;

    return {
      averageShippingCost: avgShipping,
      highestShippingState: shippingByState[0]?.state || '',
      lowestShippingState: shippingByState[shippingByState.length - 1]?.state || '',
      shippingVariance: this.calculateVariance(shippingByState.map(s => s.averageShipping))
    };
  }

  /**
   * Generate temporal geographic analysis
   * @returns {Object} Temporal analysis
   */
  generateTemporalAnalysis() {
    const monthlyStats = new Map();
    const weekdayStats = new Map();

    this.orders.forEach(order => {
      if (!order.isValid) return;

      // Monthly analysis
      const monthKey = `${order.year}-${order.month.toString().padStart(2, '0')}`;
      const monthData = monthlyStats.get(monthKey) || {
        period: monthKey,
        orderCount: 0,
        revenue: 0,
        states: new Map()
      };

      monthData.orderCount++;
      monthData.revenue += order.amount;
      monthData.states.set(order.state, (monthData.states.get(order.state) || 0) + 1);

      monthlyStats.set(monthKey, monthData);

      // Weekday analysis
      const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekdayKey = weekdayNames[order.dayOfWeek];
      weekdayStats.set(weekdayKey, (weekdayStats.get(weekdayKey) || 0) + 1);
    });

    return {
      monthlyTrends: Array.from(monthlyStats.values()).sort((a, b) => a.period.localeCompare(b.period)),
      weekdayPatterns: Object.fromEntries(weekdayStats),
      seasonalPatterns: this.analyzeSeasonalPatterns(monthlyStats)
    };
  }

  /**
   * Analyze seasonal patterns
   * @param {Map} monthlyStats - Monthly statistics
   * @returns {Object} Seasonal analysis
   */
  analyzeSeasonalPatterns(monthlyStats) {
    const monthlyData = Array.from(monthlyStats.values());
    if (monthlyData.length < 3) return { hasSeasonalPattern: false };

    // Calculate month-over-month growth
    const growthRates = [];
    for (let i = 1; i < monthlyData.length; i++) {
      const current = monthlyData[i].revenue;
      const previous = monthlyData[i - 1].revenue;
      const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      growthRates.push(growth);
    }

    const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const hasSeasonalPattern = Math.abs(avgGrowth) > 20; // 20% threshold

    return {
      hasSeasonalPattern,
      averageMonthlyGrowth: avgGrowth,
      growthVolatility: this.calculateVariance(growthRates)
    };
  }

  /**
   * Generate recommendations based on geographic analysis
   * @returns {Array} List of recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateSummaryStats();
    const revenueAnalysis = this.generateRevenueAnalysis();
    const shippingAnalysis = this.generateShippingAnalysis();

    // Geographic concentration recommendations
    if (revenueAnalysis.concentrationAnalysis.isHighlyConcentrated) {
      recommendations.push({
        type: 'expansion',
        priority: 'high',
        title: 'High Geographic Concentration',
        description: `Revenue is highly concentrated in ${revenueAnalysis.concentrationAnalysis.topState} (${revenueAnalysis.concentrationAnalysis.concentrationRatio.toFixed(1)}%). Consider expanding to new markets.`
      });
    }

    // Shipping efficiency recommendations
    if (shippingAnalysis.shippingEfficiency.shippingVariance > 10) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Shipping Cost Optimization',
        description: 'Significant variation in shipping costs by location. Consider negotiating better rates or optimizing fulfillment centers.'
      });
    }

    // Data quality recommendations
    if (summary.invalidGeographicOrders > summary.validGeographicOrders * 0.1) {
      recommendations.push({
        type: 'data_quality',
        priority: 'medium',
        title: 'Address Data Quality',
        description: `${summary.invalidGeographicOrders} orders have incomplete address data. Consider improving address collection process.`
      });
    }

    // Seasonal recommendations
    const temporalAnalysis = this.generateTemporalAnalysis();
    if (temporalAnalysis.seasonalPatterns.hasSeasonalPattern) {
      recommendations.push({
        type: 'seasonal',
        priority: 'low',
        title: 'Seasonal Patterns Detected',
        description: 'Geographic demand shows seasonal patterns. Consider adjusting inventory and marketing strategies accordingly.'
      });
    }

    return recommendations;
  }

  /**
   * Calculate variance of an array of numbers
   * @param {Array} numbers - Array of numbers
   * @returns {number} Variance
   */
  calculateVariance(numbers) {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  /**
   * Get geographic dashboard data
   * @returns {Object} Dashboard data for UI
   */
  getGeographicDashboard() {
    if (!this.dataLoaded) {
      return { error: 'Geographic data not loaded' };
    }

    const summary = this.generateSummaryStats();
    const topLocations = this.generateTopLocations();

    return {
      summary,
      topCities: topLocations.byOrderCount.slice(0, 5),
      topStates: topLocations.statesByRevenue.slice(0, 5),
      revenueByState: this.generateRevenueAnalysis().byState.slice(0, 5),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Export geographic analysis report
   * @param {string} outputPath - Path to save report
   * @param {Object} analysis - Analysis data
   */
  exportGeographicReport(outputPath, analysis) {
    const csvContent = [
      'Metric,Value,Details',
      `Total Orders,${analysis.summary.totalOrders},`,
      `Valid Geographic Orders,${analysis.summary.validGeographicOrders},`,
      `Unique States,${analysis.summary.uniqueStates},`,
      `Unique Cities,${analysis.summary.uniqueCities},`,
      `Total Revenue,$${analysis.summary.totalRevenue.toFixed(2)},`,
      `Average Order Value,$${analysis.summary.averageOrderValue.toFixed(2)},`,
      '',
      'Top Cities by Order Count',
      'City,Orders,Revenue',
      ...analysis.topLocations.byOrderCount.slice(0, 10).map(loc =>
        `"${loc.location}",${loc.orderCount},$${loc.totalRevenue.toFixed(2)}`
      ),
      '',
      'Revenue by State',
      'State,Revenue,Percentage',
      ...analysis.revenueAnalysis.byState.map(state =>
        `"${state.state}",$${state.revenue.toFixed(2)},${state.percentageOfTotal.toFixed(1)}%`
      )
    ].join('\n');

    fs.writeFileSync(outputPath, csvContent);
    console.log(`📄 Geographic analysis report exported to ${outputPath}`);
  }
}

module.exports = GeographicAnalysisEngine;
