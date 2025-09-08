const fs = require('fs');
const csv = require('csv-parser');

/**
 * Premium Analytics Engine
 * Advanced analysis features using premium Amazon extension data
 */
class PremiumAnalytics {
  constructor() {
    this.subscriptionPatterns = new Map();
    this.paymentAnalysis = {
      methods: new Map(),
      frequencies: new Map(),
      amounts: []
    };
    this.deliveryAnalysis = {
      statuses: new Map(),
      patterns: new Map(),
      timing: []
    };
  }

  /**
   * Analyze subscription delivery patterns
   */
  analyzeSubscriptionPatterns(orders) {
    const patterns = {
      monthly: [],
      biweekly: [],
      weekly: [],
      irregular: []
    };

    // Group orders by product
    const productGroups = {};
    orders.forEach(order => {
      const productName = order.items.split(/[,;]/)[0].trim().toLowerCase();
      if (!productGroups[productName]) {
        productGroups[productName] = [];
      }
      productGroups[productName].push({
        date: new Date(order.date),
        orderId: order['order id'],
        amount: parseFloat(order.total || 0),
        shipping: parseFloat(order.shipping || 0)
      });
    });

    // Analyze delivery intervals
    Object.entries(productGroups).forEach(([product, productOrders]) => {
      if (productOrders.length >= 3) {
        productOrders.sort((a, b) => a.date - b.date);
        const intervals = [];
        
        for (let i = 1; i < productOrders.length; i++) {
          const daysDiff = Math.round((productOrders[i].date - productOrders[i-1].date) / (1000 * 60 * 60 * 24));
          intervals.push(daysDiff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const consistency = intervals.every(interval => Math.abs(interval - avgInterval) <= 7);

        const pattern = {
          product,
          orderCount: productOrders.length,
          avgInterval,
          consistency,
          totalSpent: productOrders.reduce((sum, order) => sum + order.amount, 0),
          lastOrder: productOrders[productOrders.length - 1].date
        };

        if (avgInterval <= 10) patterns.weekly.push(pattern);
        else if (avgInterval <= 18) patterns.biweekly.push(pattern);
        else if (avgInterval <= 35) patterns.monthly.push(pattern);
        else patterns.irregular.push(pattern);
      }
    });

    return patterns;
  }

  /**
   * Analyze payment method usage and patterns
   */
  analyzePaymentPatterns(orders) {
    const paymentMethods = new Map();
    const monthlySpending = new Map();
    const categorySpending = new Map();

    orders.forEach(order => {
      if (order.payments) {
        // Extract payment method
        const paymentMatch = order.payments.match(/(.*?) ending in (\d+)/);
        if (paymentMatch) {
          const method = `${paymentMatch[1]} ***${paymentMatch[2]}`;
          const current = paymentMethods.get(method) || { count: 0, total: 0 };
          current.count++;
          current.total += parseFloat(order.total || 0);
          paymentMethods.set(method, current);
        }

        // Monthly spending analysis
        const orderDate = new Date(order.date);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        const monthSpending = monthlySpending.get(monthKey) || 0;
        monthlySpending.set(monthKey, monthSpending + parseFloat(order.total || 0));
      }
    });

    return {
      paymentMethods: Array.from(paymentMethods.entries()).map(([method, data]) => ({
        method,
        usage: data.count,
        totalSpent: data.total,
        avgPerOrder: data.total / data.count
      })),
      monthlyTrends: Array.from(monthlySpending.entries()).map(([month, total]) => ({
        month,
        total,
        orderCount: orders.filter(o => o.date.startsWith(month)).length
      })).sort((a, b) => a.month.localeCompare(b.month))
    };
  }

  /**
   * Analyze delivery performance and patterns
   */
  analyzeDeliveryPatterns(orders) {
    const deliveryStats = {
      delivered: 0,
      pending: 0,
      issues: 0,
      freeShipping: 0,
      paidShipping: 0,
      avgShippingCost: 0,
      deliveryMethods: new Map()
    };

    let totalShippingCost = 0;
    let shippingOrders = 0;

    orders.forEach(order => {
      if (order.shipments) {
        const shipmentLower = order.shipments.toLowerCase();
        
        if (shipmentLower.includes('delivered: yes')) {
          deliveryStats.delivered++;
        } else if (shipmentLower.includes('delivered: no')) {
          deliveryStats.pending++;
        }

        // Analyze shipping costs
        const shipping = parseFloat(order.shipping || 0);
        if (shipping === 0) {
          deliveryStats.freeShipping++;
        } else {
          deliveryStats.paidShipping++;
          totalShippingCost += shipping;
          shippingOrders++;
        }
      }
    });

    deliveryStats.avgShippingCost = shippingOrders > 0 ? totalShippingCost / shippingOrders : 0;

    return deliveryStats;
  }

  /**
   * Generate premium business insights
   */
  generatePremiumInsights(orders) {
    const subscriptionPatterns = this.analyzeSubscriptionPatterns(orders);
    const paymentAnalysis = this.analyzePaymentPatterns(orders);
    const deliveryAnalysis = this.analyzeDeliveryPatterns(orders);

    // Calculate subscription efficiency
    const totalSubscriptionOrders = Object.values(subscriptionPatterns).flat().length;
    const subscriptionValue = Object.values(subscriptionPatterns).flat()
      .reduce((sum, pattern) => sum + pattern.totalSpent, 0);

    // Identify optimization opportunities
    const optimizations = [];
    
    if (deliveryAnalysis.paidShipping > deliveryAnalysis.freeShipping * 0.1) {
      optimizations.push({
        type: 'shipping',
        message: `Consider Subscribe & Save for ${deliveryAnalysis.paidShipping} orders with paid shipping`,
        potentialSavings: deliveryAnalysis.avgShippingCost * deliveryAnalysis.paidShipping
      });
    }

    if (subscriptionPatterns.irregular.length > 0) {
      optimizations.push({
        type: 'subscription',
        message: `${subscriptionPatterns.irregular.length} products have irregular ordering patterns`,
        recommendation: 'Consider adjusting delivery frequency for better savings'
      });
    }

    return {
      subscriptionPatterns,
      paymentAnalysis,
      deliveryAnalysis,
      insights: {
        totalSubscriptionValue: subscriptionValue,
        subscriptionEfficiency: (deliveryAnalysis.freeShipping / orders.length * 100).toFixed(1),
        monthlySubscriptionSavings: (deliveryAnalysis.avgShippingCost * deliveryAnalysis.freeShipping).toFixed(2),
        optimizations
      }
    };
  }

  /**
   * Run comprehensive premium analysis
   */
  async runPremiumAnalysis() {
    return new Promise((resolve, reject) => {
      const orders = [];
      
      fs.createReadStream('amazon_order_history.csv')
        .pipe(csv())
        .on('data', (row) => {
          orders.push(row);
        })
        .on('end', () => {
          try {
            const analysis = this.generatePremiumInsights(orders);
            resolve({
              timestamp: new Date().toISOString(),
              orderCount: orders.length,
              premiumFeatures: analysis,
              summary: {
                subscriptionOrders: Object.values(analysis.subscriptionPatterns).flat().length,
                totalSubscriptionValue: analysis.insights.totalSubscriptionValue,
                avgMonthlySubscriptionSavings: analysis.insights.monthlySubscriptionSavings,
                deliverySuccessRate: (analysis.deliveryAnalysis.delivered / orders.length * 100).toFixed(1),
                optimizationOpportunities: analysis.insights.optimizations.length
              }
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }
}

module.exports = PremiumAnalytics;
