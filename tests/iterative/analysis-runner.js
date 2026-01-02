/**
 * Analysis Runner Module
 * Runs comprehensive analysis on test data
 * @module tests/iterative/analysis-runner
 */

class AnalysisRunner {
  constructor(categorizer) {
    this.categorizer = categorizer;
    this.testData = [];
    this.analysis = null;
  }

  /**
   * Set test data for analysis
   * @param {Array} data - Test data array
   */
  setTestData(data) {
    this.testData = data;
  }

  /**
   * Run comprehensive analysis on test data
   * @returns {Object} Analysis results
   */
  runAnalysis() {
    console.log('\n🔬 Running comprehensive analysis...');

    this.analysis = {
      overview: {
        totalExpenditures: this.testData.length,
        amazonOrders: this.testData.length,
        totalAmount: this.testData.reduce((sum, order) => sum + Math.abs(order.amount), 0),
        dateRange: this.getDateRange(),
        averageOrderValue: 0
      },
      categories: {},
      locations: { Freeport: 0, Smithville: 0 },
      subscribeAndSave: {
        count: 0,
        total: 0,
        confidence: 0,
        averageConfidence: 0,
        detailedResults: []
      },
      employeeBenefits: { count: 0, total: 0 },
      monthlyTrends: {},
      seasonalTrends: { Spring: 0, Summer: 0, Fall: 0, Winter: 0 },
      dataQuality: {
        amazonDataCompleteness: 0,
        bankDataCompleteness: 0.85,
        overallCompleteness: 0,
        confidenceScores: {},
        missingFields: [],
        dataIntegrity: 0
      },
      paymentMethods: {},
      subscriptionPatterns: [],
      outliers: [],
      qualityMetrics: {}
    };

    // Process each order
    const detailedResults = [];
    let totalConfidence = 0;
    let ssCount = 0;

    this.testData.forEach(order => {
      const orderAnalysis = this.categorizer.analyzeAmazonOrder(order);
      const amount = Math.abs(order.amount);

      detailedResults.push({
        orderId: order.orderId,
        originalOrder: order,
        analysis: orderAnalysis,
        amount: amount
      });

      // Categories
      if (!this.analysis.categories[orderAnalysis.category]) {
        this.analysis.categories[orderAnalysis.category] = {
          total: 0,
          count: 0,
          subcategories: {},
          averageAmount: 0,
          confidence: 0
        };
      }
      this.analysis.categories[orderAnalysis.category].total += amount;
      this.analysis.categories[orderAnalysis.category].count++;

      // Locations
      this.analysis.locations[orderAnalysis.location] += amount;

      // Subscribe & Save
      if (orderAnalysis.subscribeAndSave.isSubscribeAndSave) {
        ssCount++;
        this.analysis.subscribeAndSave.count++;
        this.analysis.subscribeAndSave.total += amount;
        totalConfidence += orderAnalysis.subscribeAndSave.confidence;

        this.analysis.subscribeAndSave.detailedResults.push({
          orderId: order.orderId,
          confidence: orderAnalysis.subscribeAndSave.confidence,
          amount: amount,
          items: order.items,
          indicators: orderAnalysis.subscribeAndSave.indicators || []
        });
      }

      // Monthly trends
      const month = new Date(order.date).toLocaleString('default', { month: 'long' });
      this.analysis.monthlyTrends[month] = (this.analysis.monthlyTrends[month] || 0) + amount;

      // Payment methods
      if (order.payments) {
        this.analysis.paymentMethods[order.payments] =
          (this.analysis.paymentMethods[order.payments] || 0) + amount;
      }

      // Detect outliers (orders significantly above average)
      if (amount > 200) { // Threshold for outliers
        this.analysis.outliers.push({
          orderId: order.orderId,
          amount: amount,
          items: order.items,
          category: orderAnalysis.category
        });
      }
    });

    // Calculate derived metrics
    this.analysis.overview.averageOrderValue =
      this.analysis.overview.totalAmount / this.analysis.overview.amazonOrders;

    this.analysis.subscribeAndSave.averageConfidence =
      ssCount > 0 ? totalConfidence / ssCount : 0;

    // Calculate category averages
    Object.keys(this.analysis.categories).forEach(cat => {
      const category = this.analysis.categories[cat];
      category.averageAmount = category.total / category.count;
    });

    // Data quality assessment
    this.calculateDataQuality();

    console.log(`✅ Analysis complete - ${this.testData.length} orders processed`);
    return this.analysis;
  }

  /**
   * Calculate comprehensive data quality metrics
   */
  calculateDataQuality() {
    let completenessScore = 0;
    let integrityScore = 0;
    const missingFields = [];

    // Check data completeness
    const requiredFields = ['date', 'amount', 'items', 'orderId'];
    const optionalFields = ['payments', 'shipping', 'category'];

    this.testData.forEach(order => {
      let orderCompleteness = 0;

      requiredFields.forEach(field => {
        if (order[field] && order[field] !== '') orderCompleteness += 0.6;
      });

      optionalFields.forEach(field => {
        if (order[field] && order[field] !== '') orderCompleteness += 0.13;
      });

      completenessScore += Math.min(orderCompleteness, 1.0);
    });

    this.analysis.dataQuality.amazonDataCompleteness =
      completenessScore / this.testData.length;

    // Check data integrity (valid dates, amounts, etc.)
    let validRecords = 0;
    this.testData.forEach(order => {
      const hasValidDate = !isNaN(new Date(order.date).getTime());
      const hasValidAmount = !isNaN(order.amount) && order.amount > 0;
      const hasValidItems = order.items && order.items.length > 0;

      if (hasValidDate && hasValidAmount && hasValidItems) {
        validRecords++;
      }
    });

    this.analysis.dataQuality.dataIntegrity = validRecords / this.testData.length;
    this.analysis.dataQuality.overallCompleteness =
      (this.analysis.dataQuality.amazonDataCompleteness +
       this.analysis.dataQuality.dataIntegrity) / 2;
  }

  /**
   * Get date range from data
   * @returns {Object} Date range information
   */
  getDateRange() {
    const dates = this.testData.map(order => new Date(order.date))
      .filter(date => !isNaN(date.getTime()));

    if (dates.length === 0) return { start: 'Unknown', end: 'Unknown' };

    const sortedDates = dates.sort((a, b) => a - b);
    return {
      start: sortedDates[0].toISOString().split('T')[0],
      end: sortedDates[sortedDates.length - 1].toISOString().split('T')[0],
      span: Math.ceil((sortedDates[sortedDates.length - 1] - sortedDates[0]) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Get analysis results
   * @returns {Object} Analysis results
   */
  getAnalysis() {
    return this.analysis;
  }
}

module.exports = AnalysisRunner;