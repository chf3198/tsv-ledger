/**
 * Subscription Routes Module
 *
 * Handles subscription tracking and analysis endpoints.
 *
 * @module routes/subscription
 * @version 1.0.0
 */

const express = require('express');
const { getAllExpenditures } = require('../database');
const SubscriptionAnalysisEngine = require('../subscription-analysis-engine');

const router = express.Router();

/**
 * GET /api/subscription-dashboard
 * Get subscription dashboard data
 */
router.get('/subscription-dashboard', (req, res) => {
  try {
    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for subscription dashboard:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      // Filter for subscription-related expenditures
      const subscriptionItems = expenditures.filter(exp =>
        exp.category === 'Subscription' ||
        exp.description.toLowerCase().includes('subscribe') ||
        exp.description.toLowerCase().includes('subscription') ||
        (exp.metadata && exp.metadata.isSubscription)
      );

      // Calculate subscription metrics
      const totalSubscriptions = subscriptionItems.length;
      const totalSpent = subscriptionItems.reduce((sum, exp) => sum + exp.amount, 0);
      const avgSubscriptionCost = totalSubscriptions > 0 ? totalSpent / totalSubscriptions : 0;

      // Group by month
      const monthlySubscriptions = {};
      subscriptionItems.forEach(exp => {
        const month = new Date(exp.date).toISOString().substring(0, 7);
        monthlySubscriptions[month] = (monthlySubscriptions[month] || 0) + 1;
      });

      // Identify recurring subscriptions
      const recurringSubscriptions = identifyRecurringSubscriptions(subscriptionItems);

      res.json({
        summary: {
          totalSubscriptions,
          totalSpent,
          averageCost: avgSubscriptionCost,
          uniqueServices: recurringSubscriptions.length
        },
        monthlyBreakdown: monthlySubscriptions,
        recurringSubscriptions,
        recentSubscriptions: subscriptionItems
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
      });
    });
  } catch (error) {
    console.error('Subscription dashboard error:', error);
    res.status(500).json({
      error: 'Failed to generate subscription dashboard',
      message: error.message
    });
  }
});

/**
 * GET /api/subscription-analysis
 * Get detailed subscription analysis
 */
router.get('/subscription-analysis', async (req, res) => {
  try {
    getAllExpenditures(async (err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for subscription analysis:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      // Use subscription analysis engine
      const engine = new SubscriptionAnalysisEngine();
      const analysis = await engine.analyzeSubscriptions(expenditures);

      res.json(analysis);
    });
  } catch (error) {
    console.error('Subscription analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate subscription analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/subscription-for-order/:orderId
 * Get subscription information for a specific order
 */
router.get('/subscription-for-order/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;

    getAllExpenditures((err, expenditures) => {
      if (err) {
        console.error('Failed to retrieve expenditures for order lookup:', err);
        return res.status(500).json({ error: 'Failed to retrieve expenditures' });
      }

      // Find the specific order
      const order = expenditures.find(exp => exp.orderId === orderId);

      if (!order) {
        return res.status(404).json({
          error: 'Order not found',
          message: `No order found with ID: ${orderId}`
        });
      }

      // Check if it's a subscription
      const isSubscription = order.category === 'Subscription' ||
                            order.description.toLowerCase().includes('subscribe') ||
                            order.description.toLowerCase().includes('subscription') ||
                            (order.metadata && order.metadata.isSubscription);

      // Find related subscription orders (same description pattern)
      const relatedOrders = expenditures.filter(exp => {
        if (exp.orderId === orderId) {
          return false;
        } // Exclude the current order

        // Check for similar descriptions (basic pattern matching)
        const currentDesc = order.description.toLowerCase();
        const expDesc = exp.description.toLowerCase();

        return expDesc.includes('subscribe') ||
               expDesc.includes('subscription') ||
               currentDesc.split(' ').some(word =>
                 word.length > 3 && expDesc.includes(word)
               );
      });

      res.json({
        order,
        isSubscription,
        relatedOrders: relatedOrders.slice(0, 5), // Limit to 5 related orders
        subscriptionInfo: isSubscription ? {
          estimatedFrequency: estimateSubscriptionFrequency([order, ...relatedOrders]),
          nextExpectedDate: estimateNextSubscriptionDate([order, ...relatedOrders]),
          totalRelatedOrders: relatedOrders.length + 1
        } : null
      });
    });
  } catch (error) {
    console.error('Subscription order lookup error:', error);
    res.status(500).json({
      error: 'Failed to lookup subscription order',
      message: error.message
    });
  }
});

/**
 * Identify recurring subscriptions from expenditure data
 */
function identifyRecurringSubscriptions(subscriptionItems) {
  const subscriptions = {};

  subscriptionItems.forEach(item => {
    // Create a key based on description (simplified)
    const key = item.description.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!subscriptions[key]) {
      subscriptions[key] = {
        description: item.description,
        service: extractServiceName(item.description),
        orders: [],
        totalSpent: 0,
        frequency: 'unknown',
        averageAmount: 0
      };
    }

    subscriptions[key].orders.push({
      date: item.date,
      amount: item.amount,
      orderId: item.orderId
    });
    subscriptions[key].totalSpent += item.amount;
  });

  // Calculate frequency and averages
  Object.values(subscriptions).forEach(sub => {
    sub.averageAmount = sub.totalSpent / sub.orders.length;
    sub.frequency = estimateSubscriptionFrequency(sub.orders);
  });

  return Object.values(subscriptions)
    .filter(sub => sub.orders.length > 1) // Only recurring ones
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Extract service name from subscription description
 */
function extractServiceName(description) {
  // Common patterns for service names
  const patterns = [
    /(?:subscription to|subscribe to)\s+(.+?)(?:\s|$)/i,
    /(.+?)\s+(?:subscription|subscribe)/i,
    /(.+?)\s+(?:monthly|yearly|annual)/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: take first few words
  return description.split(' ').slice(0, 3).join(' ');
}

/**
 * Estimate subscription frequency from order dates
 */
function estimateSubscriptionFrequency(orders) {
  if (orders.length < 2) {
    return 'unknown';
  }

  // Sort orders by date
  const sortedOrders = orders.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate intervals between orders
  const intervals = [];
  for (let i = 1; i < sortedOrders.length; i++) {
    const days = Math.round((new Date(sortedOrders[i].date) - new Date(sortedOrders[i-1].date)) / (1000 * 60 * 60 * 24));
    intervals.push(days);
  }

  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

  // Determine frequency
  if (avgInterval <= 7) {
    return 'weekly';
  }
  if (avgInterval <= 31) {
    return 'monthly';
  }
  if (avgInterval <= 95) {
    return 'quarterly';
  }
  if (avgInterval <= 370) {
    return 'yearly';
  }

  return 'irregular';
}

/**
 * Estimate next subscription date
 */
function estimateNextSubscriptionDate(orders) {
  if (orders.length < 2) {
    return null;
  }

  const sortedOrders = orders.sort((a, b) => new Date(a.date) - new Date(b.date));
  const lastOrder = sortedOrders[sortedOrders.length - 1];
  const frequency = estimateSubscriptionFrequency(orders);

  const lastDate = new Date(lastOrder.date);
  let nextDate;

  switch (frequency) {
  case 'weekly':
    nextDate = new Date(lastDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    break;
  case 'monthly':
    nextDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, lastDate.getDate());
    break;
  case 'quarterly':
    nextDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + 3, lastDate.getDate());
    break;
  case 'yearly':
    nextDate = new Date(lastDate.getFullYear() + 1, lastDate.getMonth(), lastDate.getDate());
    break;
  default:
    return null;
  }

  return nextDate.toISOString().split('T')[0];
}

module.exports = router;
