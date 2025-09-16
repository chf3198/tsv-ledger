/**
 * Subscription Analysis Engine
 *
 * @fileoverview Advanced subscription-to-order linking and analysis system
 *               for TSV Ledger. Provides comprehensive subscription intelligence
 *               by linking Amazon subscription data with order transactions.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 * @since 2025-09-16
 *
 * @features
 * - Subscription-to-order linking via OrderId matching
 * - Subscription performance analytics
 * - Billing pattern analysis
 * - Subscription profitability tracking
 * - Churn analysis and forecasting
 *
 * @requires fs File system operations
 * @requires csv-parser CSV parsing for subscription data
 * @requires path Path utilities for file operations
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Subscription Analysis Engine Class
 * Handles all subscription-related data processing and analysis
 */
class SubscriptionAnalysisEngine {

  constructor() {
    this.subscriptions = new Map();
    this.subscriptionPeriods = new Map();
    this.billingSchedules = new Map();
    this.dataLoaded = false;
    this.analysisCache = new Map();
  }

  /**
   * Load all subscription data from ZIP files
   * @param {string} subscriptionsZipPath - Path to Subscriptions.zip
   * @returns {Promise<boolean>} Success status
   */
  async loadSubscriptionData(subscriptionsZipPath = './data/Subscriptions.zip') {
    try {
      console.log('🔄 Loading subscription data...');

      // Load main subscriptions
      await this.loadSubscriptions(subscriptionsZipPath);
      console.log(`✅ Loaded ${this.subscriptions.size} subscriptions`);

      // Load subscription periods (contains OrderId links!)
      await this.loadSubscriptionPeriods(subscriptionsZipPath);
      console.log(`✅ Loaded ${this.subscriptionPeriods.size} subscription periods`);

      // Load billing schedules
      await this.loadBillingSchedules(subscriptionsZipPath);
      console.log(`✅ Loaded ${this.billingSchedules.size} billing schedules`);

      this.dataLoaded = true;
      console.log('🎯 Subscription data loading complete');
      return true;

    } catch (error) {
      console.error('❌ Error loading subscription data:', error);
      return false;
    }
  }

  /**
   * Load main subscriptions data
   * @param {string} zipPath - Path to ZIP file
   */
  async loadSubscriptions(zipPath) {
    return new Promise((resolve, reject) => {
      const results = [];

      // Use unzip to extract and parse CSV
      const { spawn } = require('child_process');
      const unzip = spawn('unzip', ['-p', zipPath, 'Digital.Subscriptions.1/Subscriptions.csv']);

      unzip.stdout
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          results.forEach(sub => {
            this.subscriptions.set(sub.SubscriptionId, {
              id: sub.SubscriptionId,
              planId: sub.SubscriptionPlanId,
              marketplace: sub.Marketplace,
              status: sub.SubscriptionStatus,
              startDate: sub.SubscriptionStartDate,
              serviceProvider: sub.ServiceProvider,
              nextBillDate: sub.NextBillDate,
              nextBillAmount: parseFloat(sub.NextBillAmount) || 0,
              currency: sub.BaseCurrencyCode,
              autorenew: sub.Autorenew === 'Yes'
            });
          });
          resolve();
        })
        .on('error', reject);

      unzip.on('error', reject);
    });
  }

  /**
   * Load subscription periods (contains OrderId links!)
   * @param {string} zipPath - Path to ZIP file
   */
  async loadSubscriptionPeriods(zipPath) {
    return new Promise((resolve, reject) => {
      const results = [];

      const { spawn } = require('child_process');
      const unzip = spawn('unzip', ['-p', zipPath, 'Digital.Subscriptions.1/Subscription Periods.csv']);

      unzip.stdout
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          results.forEach(period => {
            const subId = period.SubscriptionId;
            if (!this.subscriptionPeriods.has(subId)) {
              this.subscriptionPeriods.set(subId, []);
            }

            this.subscriptionPeriods.get(subId).push({
              billingScheduleItemId: period.BillingScheduleItemId,
              periodType: period.PeriodType,
              status: period.PeriodStatus,
              startDate: period.PeriodStartDate,
              endDate: period.PeriodEndDate,
              chargeCompleted: period.ChargeCompleted === 'Yes',
              orderId: period.OrderId,
              marketplace: period.Marketplace
            });
          });
          resolve();
        })
        .on('error', reject);

      unzip.on('error', reject);
    });
  }

  /**
   * Load billing schedules
   * @param {string} zipPath - Path to ZIP file
   */
  async loadBillingSchedules(zipPath) {
    return new Promise((resolve, reject) => {
      const results = [];

      const { spawn } = require('child_process');
      const unzip = spawn('unzip', ['-p', zipPath, 'Digital.Subscriptions.1/Billing Schedules.csv']);

      unzip.stdout
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          results.forEach(schedule => {
            this.billingSchedules.set(schedule.BillingScheduleId, {
              id: schedule.BillingScheduleId,
              subscriptionId: schedule.SubscriptionId,
              amount: parseFloat(schedule.Amount) || 0,
              currency: schedule.CurrencyCode,
              frequency: schedule.Frequency,
              status: schedule.Status
            });
          });
          resolve();
        })
        .on('error', reject);

      unzip.on('error', reject);
    });
  }

  /**
   * Link subscriptions to Amazon orders
   * @param {Array} amazonOrders - Array of Amazon order objects
   * @returns {Object} Linking results and analysis
   */
  linkSubscriptionsToOrders(amazonOrders) {
    if (!this.dataLoaded) {
      throw new Error('Subscription data not loaded. Call loadSubscriptionData() first.');
    }

    console.log('🔗 Linking subscriptions to orders...');

    const linkedOrders = new Map();
    const subscriptionStats = {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: 0,
      cancelledSubscriptions: 0,
      linkedOrders: 0,
      totalSubscriptionRevenue: 0,
      averageMonthlyRevenue: 0
    };

    // Count subscription statuses
    this.subscriptions.forEach(sub => {
      if (sub.status === 'Active') subscriptionStats.activeSubscriptions++;
      if (sub.status === 'Cancelled') subscriptionStats.cancelledSubscriptions++;
      if (sub.nextBillAmount) subscriptionStats.totalSubscriptionRevenue += sub.nextBillAmount;
    });

    // Link orders to subscriptions via OrderId
    amazonOrders.forEach(order => {
      const orderId = order['Order ID'];
      let linked = false;

      // Search through all subscription periods for this order
      for (const [subId, periods] of this.subscriptionPeriods) {
        const matchingPeriod = periods.find(period => period.orderId === orderId);

        if (matchingPeriod) {
          const subscription = this.subscriptions.get(subId);
          if (subscription) {
            linkedOrders.set(orderId, {
              order: order,
              subscription: subscription,
              period: matchingPeriod,
              linked: true
            });
            subscriptionStats.linkedOrders++;
            linked = true;
            break; // Found the link, no need to continue searching
          }
        }
      }

      // If not linked to subscription, mark as regular purchase
      if (!linked) {
        linkedOrders.set(orderId, {
          order: order,
          subscription: null,
          period: null,
          linked: false
        });
      }
    });

    // Calculate average monthly revenue
    subscriptionStats.averageMonthlyRevenue = subscriptionStats.totalSubscriptionRevenue / 12;

    console.log(`✅ Linked ${subscriptionStats.linkedOrders} orders to subscriptions`);
    console.log(`📊 Found ${subscriptionStats.activeSubscriptions} active subscriptions`);

    return {
      linkedOrders,
      stats: subscriptionStats,
      analysis: this.generateSubscriptionAnalysis(linkedOrders, subscriptionStats)
    };
  }

  /**
   * Generate comprehensive subscription analysis
   * @param {Map} linkedOrders - Orders linked to subscriptions
   * @param {Object} stats - Basic subscription statistics
   * @returns {Object} Detailed analysis results
   */
  generateSubscriptionAnalysis(linkedOrders, stats) {
    const analysis = {
      subscriptionPerformance: {},
      revenueAnalysis: {},
      churnAnalysis: {},
      categoryBreakdown: {},
      recommendations: []
    };

    // Subscription performance by service provider
    const providerStats = new Map();
    this.subscriptions.forEach(sub => {
      const provider = sub.serviceProvider;
      if (!providerStats.has(provider)) {
        providerStats.set(provider, { count: 0, revenue: 0, active: 0 });
      }
      const stats = providerStats.get(provider);
      stats.count++;
      stats.revenue += sub.nextBillAmount || 0;
      if (sub.status === 'Active') stats.active++;
    });

    analysis.subscriptionPerformance = Object.fromEntries(providerStats);

    // Revenue analysis
    analysis.revenueAnalysis = {
      totalMonthlyRevenue: stats.totalSubscriptionRevenue,
      averageMonthlyRevenue: stats.averageMonthlyRevenue,
      projectedAnnualRevenue: stats.totalSubscriptionRevenue * 12,
      activeSubscriptionValue: stats.activeSubscriptions > 0 ?
        stats.totalSubscriptionRevenue / stats.activeSubscriptions : 0
    };

    // Churn analysis (basic)
    const cancelledRate = stats.totalSubscriptions > 0 ?
      (stats.cancelledSubscriptions / stats.totalSubscriptions) * 100 : 0;

    analysis.churnAnalysis = {
      cancelledSubscriptions: stats.cancelledSubscriptions,
      cancellationRate: cancelledRate,
      activeSubscriptions: stats.activeSubscriptions,
      retentionRate: 100 - cancelledRate
    };

    // Generate recommendations
    if (cancelledRate > 20) {
      analysis.recommendations.push('High cancellation rate detected. Consider subscription value analysis.');
    }
    if (stats.activeSubscriptions < 5) {
      analysis.recommendations.push('Low active subscription count. Consider expansion strategies.');
    }
    if (stats.averageMonthlyRevenue < 50) {
      analysis.recommendations.push('Average subscription revenue is low. Consider premium offerings.');
    }

    return analysis;
  }

  /**
   * Get subscription details for a specific order
   * @param {string} orderId - Amazon order ID
   * @returns {Object|null} Subscription details or null if not found
   */
  getSubscriptionForOrder(orderId) {
    if (!this.dataLoaded) return null;

    for (const [subId, periods] of this.subscriptionPeriods) {
      const matchingPeriod = periods.find(period => period.orderId === orderId);
      if (matchingPeriod) {
        const subscription = this.subscriptions.get(subId);
        if (subscription) {
          return {
            subscription,
            period: matchingPeriod,
            billingHistory: periods
          };
        }
      }
    }
    return null;
  }

  /**
   * Get comprehensive subscription dashboard data
   * @returns {Object} Dashboard data for UI
   */
  getSubscriptionDashboard() {
    if (!this.dataLoaded) {
      return { error: 'Subscription data not loaded' };
    }

    const dashboard = {
      summary: {
        totalSubscriptions: this.subscriptions.size,
        activeSubscriptions: Array.from(this.subscriptions.values()).filter(s => s.status === 'Active').length,
        totalMonthlyRevenue: Array.from(this.subscriptions.values()).reduce((sum, s) => sum + (s.nextBillAmount || 0), 0),
        averageSubscriptionValue: 0
      },
      topServices: [],
      statusBreakdown: {},
      recentActivity: []
    };

    // Calculate average subscription value
    if (dashboard.summary.activeSubscriptions > 0) {
      dashboard.summary.averageSubscriptionValue =
        dashboard.summary.totalMonthlyRevenue / dashboard.summary.activeSubscriptions;
    }

    // Status breakdown
    this.subscriptions.forEach(sub => {
      dashboard.statusBreakdown[sub.status] = (dashboard.statusBreakdown[sub.status] || 0) + 1;
    });

    // Top services by revenue
    const serviceRevenue = new Map();
    this.subscriptions.forEach(sub => {
      const revenue = sub.nextBillAmount || 0;
      serviceRevenue.set(sub.serviceProvider,
        (serviceRevenue.get(sub.serviceProvider) || 0) + revenue);
    });

    dashboard.topServices = Array.from(serviceRevenue.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service, revenue]) => ({ service, revenue }));

    return dashboard;
  }
}

module.exports = SubscriptionAnalysisEngine;
