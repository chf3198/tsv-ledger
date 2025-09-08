/**
 * TSV Ledger - Enhanced Categorization Engine
 * 
 * Provides intelligent categorization for Texas Sunset Venues expenditures.
 * Implements business logic for property-specific categorization, location detection,
 * and expense type classification.
 * 
 * @module TSVCategorizer
 * @author TSV Ledger Team
 * @version 2.2.1
 * @since 1.0.0
 */

/**
 * Main categorization engine for TSV Ledger application
 * 
 * @class TSVCategorizer
 * @description Handles all business intelligence categorization logic
 */
class TSVCategorizer {
  /**
   * Initialize the categorization engine with predefined rules and keywords
   * 
   * @constructor
   */
  constructor() {
    // Define property-specific keywords for location detection
    this.locationKeywords = {
      freeport: [
        'freeport', 'beach', 'coastal', 'surfside', 'gulf', 'ocean', 'salt water',
        'marine', 'pier', 'dock', 'boat', 'fishing', 'seaweed', 'saltwater'
      ],
      smithville: [
        'smithville', 'bastrop', 'lake', 'river', 'pine', 'cedar', 'state park',
        'hiking', 'trail', 'woods', 'forest', 'freshwater', 'creek'
      ]
    };

    // Enhanced Subscribe & Save detection patterns (premium extension data)
    this.subscribeAndSaveKeywords = [
      'subscribe & save', 'subscription', 'recurring', 'monthly delivery',
      'subscribe and save', 'automatic delivery', 'regular delivery'
    ];

    // Premium: High-confidence Subscribe & Save products based on frequency analysis
    this.confirmedSubscribeAndSaveProducts = [
      'bounty paper towels quick size',
      'pure life purified water bottles',
      'oxiclean white revive laundry whitener and stain remover liquid',
      'bulletproof original medium roast whole bean coffee',
      'glade plugins refills air freshener',
      'lysol power clean multi-surface cleaner',
      'audible premium plus',
      'downy free & gentle fabric softener',
      'off! family care insect & mosquito repellent',
      'honest kids organic juice drink',
      'scott rapid-dissolving toilet paper',
      'tide free & gentle liquid laundry detergent',
      'ortho orthene fire ant killer1',
      '4th & heart original grass-fed ghee',
      'downy fabric softener liquid',
      'mccafe premium roast coffee',
      'toughbag 42 gallon trash bags',
      'aveeno daily moisturizing body wash'
    ];

    // Board/owner benefits items
    this.employeeBenefitKeywords = [
      'coffee', 'snacks', 'drinks', 'juice', 'water bottles', 'tea', 'energy drinks',
      'office supplies', 'toilet paper', 'paper towels', 'cleaning supplies',
      'first aid', 'sunscreen', 'bug spray', 'hand sanitizer', 'soap'
    ];

    // Business categories with enhanced subcategories
    this.categories = {
      'Property Maintenance': {
        subcategories: ['Cleaning Supplies', 'Tools & Hardware', 'Pest Control', 'Lawn Care', 'HVAC'],
        keywords: [
          'cleaner', 'cleaning', 'detergent', 'bleach', 'disinfectant', 'paper towels',
          'toilet paper', 'trash bags', 'vacuum', 'mop', 'broom', 'tools', 'hardware',
          'paint', 'screws', 'nails', 'pest control', 'ant killer', 'bug spray',
          'insecticide', 'lawn', 'grass', 'fertilizer', 'weed killer', 'mulch',
          'air filter', 'hvac', 'furnace', 'ac', 'wd-40', 'lubricant'
        ]
      },
      'Guest Amenities': {
        subcategories: ['Bedding & Linens', 'Bathroom Supplies', 'Kitchen Supplies', 'Entertainment'],
        keywords: [
          'pillow', 'sheet', 'towel', 'blanket', 'bedding', 'linen', 'mattress',
          'shampoo', 'conditioner', 'soap', 'toilet paper', 'tissue',
          'coffee', 'tea', 'sugar', 'creamer', 'plates', 'cups', 'utensils',
          'entertainment', 'games', 'books', 'magazines', 'wifi', 'cable'
        ]
      },
      'Food & Beverages': {
        subcategories: ['Guest Refreshments', 'Board Benefits', 'Special Events'],
        keywords: [
          'coffee', 'tea', 'water', 'juice', 'soda', 'snacks', 'cookies',
          'crackers', 'nuts', 'fruit', 'beverages', 'drinks', 'food',
          'honey', 'sweetener', 'ghee', 'organic'
        ]
      },
      'Marketing & Photography': {
        subcategories: ['Photo Equipment', 'Backdrop & Props', 'Lighting', 'Marketing Materials'],
        keywords: [
          'camera', 'photography', 'photo', 'backdrop', 'lighting', 'ring light',
          'tripod', 'lens', 'flash', 'props', 'marketing', 'brochure',
          'business cards', 'signage', 'banner'
        ]
      },
      'Outdoor & Recreation': {
        subcategories: ['Wildlife Care', 'Outdoor Equipment', 'Safety & First Aid'],
        keywords: [
          'bird', 'hummingbird', 'wildlife', 'seed', 'feeder', 'nectar',
          'outdoor', 'patio', 'deck', 'grill', 'fire pit',
          'first aid', 'bandages', 'antiseptic', 'safety'
        ]
      },
      'Technology & Office': {
        subcategories: ['Office Supplies', 'Computer Equipment', 'Communication'],
        keywords: [
          'office', 'supplies', 'paper', 'pens', 'computer', 'laptop',
          'printer', 'ink', 'software', 'phone', 'tablet'
        ]
      },
      'Pet Care': {
        subcategories: ['Pet Supplies', 'Veterinary', 'Pet Food'],
        keywords: [
          'dog', 'cat', 'pet', 'veterinary', 'flea', 'tick', 'pet food',
          'pet supplies', 'collar', 'leash', 'toy', 'bed', 'carrier'
        ]
      }
    };
  }

  // Enhanced Amazon order analysis using premium extension data
  analyzeAmazonOrder(order) {
    const analysis = {
      orderId: order.orderId || order['order id'], // Handle both formats
      orderUrl: order['order url'], // Premium: Direct link to order
      date: order.date,
      amount: order.total || order.amount, // Premium: Use 'total' field
      items: order.items,
      shipping: order.shipping, // Premium: Explicit shipping cost
      tax: order.tax, // Premium: Tax amount
      payments: order.payments, // Premium: Payment details
      shipments: order.shipments, // Premium: Delivery status
      invoice: order.invoice, // Premium: Invoice link
      category: 'General',
      subcategory: null,
      location: this.detectLocation(order.items),
      subscribeAndSave: this.detectSubscribeAndSave(order),
      isEmployeeBenefit: this.detectEmployeeBenefit(order.items),
      businessPurpose: this.determinBusinessPurpose(order.items),
      seasonality: this.detectSeasonality(order.date, order.items),
      insights: [],
      dataQuality: {
        hasOrderId: !!(order.orderId || order['order id']),
        hasItems: !!(order.items && order.items.length > 10),
        hasAmount: !!(order.total || order.amount),
        hasDate: !!(order.date && order.date !== 'Invalid Date'),
        hasShipping: !!(order.shipping !== undefined), // Premium field
        hasPayments: !!(order.payments), // Premium field
        hasShipments: !!(order.shipments), // Premium field
        completeness: 0
      }
    };

    // Calculate data completeness score
    const qualityChecks = Object.values(analysis.dataQuality).filter(v => typeof v === 'boolean');
    analysis.dataQuality.completeness = qualityChecks.filter(Boolean).length / qualityChecks.length;

    // Determine primary category
    const categoryResult = this.categorizeItems(order.items);
    analysis.category = categoryResult.category;
    analysis.subcategory = categoryResult.subcategory;

    // Add insights based on analysis
    this.addInsights(analysis);

    return analysis;
  }

  // Detect property location based on item description
  detectLocation(items) {
    const itemsLower = (items || '').toString().toLowerCase();
    
    let freeportScore = 0;
    let smithvilleScore = 0;

    // Check for location-specific keywords
    this.locationKeywords.freeport.forEach(keyword => {
      if (itemsLower.includes(keyword)) freeportScore++;
    });

    this.locationKeywords.smithville.forEach(keyword => {
      if (itemsLower.includes(keyword)) smithvilleScore++;
    });

    // Marine/coastal items likely for Freeport
    if (itemsLower.includes('salt') || itemsLower.includes('marine') || 
        itemsLower.includes('coastal') || itemsLower.includes('beach')) {
      freeportScore += 2;
    }

    // Lake/freshwater items likely for Smithville
    if (itemsLower.includes('lake') || itemsLower.includes('freshwater') || 
        itemsLower.includes('river') || itemsLower.includes('pine')) {
      smithvilleScore += 2;
    }

    if (freeportScore > smithvilleScore) return 'Freeport';
    if (smithvilleScore > freeportScore) return 'Smithville';
    return 'Both Properties'; // Default for general items
  }

  // Enhanced Subscribe & Save detection using premium extension data
  detectSubscribeAndSave(order) {
    // Defensive programming - handle malformed data
    const itemsLower = (order.items || '').toString().toLowerCase();
    const paymentsLower = (order.payments || '').toString().toLowerCase();
    const shipmentsLower = (order.shipments || '').toString().toLowerCase();

    // Enhanced detection patterns from premium data
    const subscribePatterns = [
      'subscribe & save', 'subscribe and save', 'subscription', 'recurring',
      'monthly delivery', 'automatic delivery', 'regular delivery', 'auto-delivery'
    ];

    // Check for explicit Subscribe & Save indicators in all fields
    const hasSubscribeKeywords = subscribePatterns.some(keyword => 
      itemsLower.includes(keyword) || paymentsLower.includes(keyword) || shipmentsLower.includes(keyword)
    );

    // Premium: Check against confirmed S&S products (from frequency analysis)
    const productName = itemsLower.split(/[,;]/)[0].trim();
    const isConfirmedSSProduct = this.confirmedSubscribeAndSaveProducts.some(confirmed => 
      productName.includes(confirmed.toLowerCase()) || confirmed.toLowerCase().includes(productName)
    );

    // Premium: Use shipping data more accurately
    const shipping = parseFloat(order.shipping || 0);
    const hasFreeShipping = shipping === 0;

    // Premium: Enhanced delivery status analysis
    const hasSubscriptionDeliveryPattern = shipmentsLower.includes('delivered: yes') && 
      (shipmentsLower.includes('arriving friday') || shipmentsLower.includes('regular delivery'));

    // Enhanced heuristic: Check for common S&S product patterns
    const commonSSProducts = [
      'detergent', 'paper towels', 'toilet paper', 'cleaning', 'soap',
      'water bottles', 'coffee', 'pet food', 'vitamins', 'supplements',
      'dishwasher', 'laundry', 'trash bags', 'tissues', 'shampoo', 'fabric softener',
      'air freshener', 'stain remover', 'ghee', 'olive oil', 'body wash'
    ];
    
    const isCommonSSProduct = commonSSProducts.some(product => 
      itemsLower.includes(product)
    );

    // Premium: Multiple indicators with enhanced confidence scoring
    let confidence = 0;
    if (hasSubscribeKeywords) confidence += 0.9; // Explicit mention
    if (isConfirmedSSProduct) confidence += 0.8; // High-frequency product from analysis
    if (hasFreeShipping && isCommonSSProduct) confidence += 0.7; // Free shipping + common product
    if (hasSubscriptionDeliveryPattern) confidence += 0.6; // Delivery pattern
    if (isCommonSSProduct) confidence += 0.3; // Common product type
    
    // Premium: Payment pattern analysis (monthly recurring charges)
    const hasRecurringPaymentPattern = paymentsLower.includes('mastercard') && 
      (isConfirmedSSProduct || isCommonSSProduct);
    if (hasRecurringPaymentPattern) confidence += 0.4;

    return {
      isSubscribeAndSave: confidence >= 0.6, // Raised threshold for higher accuracy
      confidence: Math.min(confidence, 1.0),
      indicators: {
        hasKeywords: hasSubscribeKeywords,
        confirmedProduct: isConfirmedSSProduct,
        freeShipping: hasFreeShipping,
        commonProduct: isCommonSSProduct,
        deliveryPattern: hasSubscriptionDeliveryPattern,
        paymentPattern: hasRecurringPaymentPattern
      }
    };
  }

  // Detect employee benefit items
  detectEmployeeBenefit(items) {
    const itemsLower = (items || '').toString().toLowerCase();
    return this.employeeBenefitKeywords.some(keyword => 
      itemsLower.includes(keyword)
    );
  }

  // Categorize items into business categories
  categorizeItems(items) {
    const itemsLower = (items || '').toString().toLowerCase();
    let bestMatch = { category: 'General', subcategory: null, score: 0 };

    Object.entries(this.categories).forEach(([category, data]) => {
      let score = 0;
      let matchedSubcategory = null;

      // Check keywords for this category
      data.keywords.forEach(keyword => {
        if (itemsLower.includes(keyword)) {
          score++;
        }
      });

      // Check subcategories for more specific matching
      data.subcategories.forEach(subcategory => {
        const subcategoryLower = subcategory.toLowerCase();
        if (itemsLower.includes(subcategoryLower.replace(/[& ]/g, '')) ||
            itemsLower.includes(subcategoryLower)) {
          score += 2;
          matchedSubcategory = subcategory;
        }
      });

      if (score > bestMatch.score) {
        bestMatch = { category, subcategory: matchedSubcategory, score };
      }
    });

    return bestMatch;
  }

  // Determine business purpose
  determinBusinessPurpose(items) {
    const itemsLower = (items || '').toString().toLowerCase();

    if (itemsLower.includes('guest') || itemsLower.includes('client')) {
      return 'Guest Experience';
    }
    if (itemsLower.includes('maintenance') || itemsLower.includes('repair')) {
      return 'Property Maintenance';
    }
    if (itemsLower.includes('marketing') || itemsLower.includes('photo')) {
      return 'Marketing & Promotion';
    }
    if (this.detectEmployeeBenefit(items)) {
      return 'Board Benefits';
    }

    return 'Operations';
  }

  // Detect seasonal patterns
  detectSeasonality(date, items) {
    // Handle potential invalid dates
    let month;
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        // Fallback to current month if date is invalid
        month = new Date().getMonth() + 1;
      } else {
        month = parsedDate.getMonth() + 1; // 1-12
      }
    } catch (error) {
      month = new Date().getMonth() + 1; // Fallback
    }
    
    const itemsLower = (items || '').toString().toLowerCase();

    const seasons = {
      'Winter': [12, 1, 2],
      'Spring': [3, 4, 5],
      'Summer': [6, 7, 8],
      'Fall': [9, 10, 11]
    };

    const currentSeason = Object.entries(seasons).find(([season, months]) => 
      months.includes(month)
    )?.[0];

    // Seasonal item detection
    const seasonalItems = [];
    if (itemsLower.includes('ant') || itemsLower.includes('bug') || 
        itemsLower.includes('mosquito')) {
      seasonalItems.push('Pest Control (Summer/Spring)');
    }
    if (itemsLower.includes('bird') || itemsLower.includes('hummingbird')) {
      seasonalItems.push('Wildlife Care (Spring/Summer)');
    }
    if (itemsLower.includes('heating') || itemsLower.includes('winter')) {
      seasonalItems.push('Winter Preparation');
    }

    return {
      season: currentSeason,
      seasonalItems: seasonalItems
    };
  }

  // Add contextual insights
  addInsights(analysis) {
    if (analysis.subscribeAndSave.isSubscribeAndSave) {
      const confidence = (analysis.subscribeAndSave.confidence * 100).toFixed(0);
      analysis.insights.push({
        type: 'subscribe_save',
        message: `Subscribe & Save order detected (${confidence}% confidence)`,
        explanation: `Based on: ${Object.entries(analysis.subscribeAndSave.indicators)
          .filter(([k,v]) => v).map(([k,v]) => k).join(', ')}`,
        recommendation: 'Predictable recurring expense for budget planning'
      });
    }

    if (analysis.isEmployeeBenefit) {
      analysis.insights.push({
        type: 'employee_benefit',
        message: 'Employee benefit/perk item identified',
        explanation: 'Item matches corporate perk categories: coffee, snacks, office supplies, cleaning supplies, etc.',
        recommendation: 'Consider dedicated board benefits budget allocation'
      });
    }

    if (analysis.location !== 'Both Properties') {
      analysis.insights.push({
        type: 'location_specific',
        message: `Property-specific purchase for ${analysis.location}`,
        explanation: `Item keywords suggest specific use at ${analysis.location} property`,
        recommendation: 'Track property-specific expenses for cost allocation'
      });
    }

    if (analysis.seasonality.seasonalItems.length > 0) {
      analysis.insights.push({
        type: 'seasonal',
        message: `Seasonal item: ${analysis.seasonality.seasonalItems.join(', ')}`,
        explanation: 'Item has seasonal usage patterns that can help with budget planning',
        recommendation: 'Plan seasonal inventory and budget allocation'
      });
    }

    // Budget planning insights
    if (Math.abs(analysis.amount) > 50) {
      analysis.insights.push({
        type: 'high_value',
        message: 'High-value purchase identified',
        explanation: `Purchase amount $${Math.abs(analysis.amount)} exceeds $50 threshold`,
        recommendation: 'Review for budget planning and approval processes'
      });
    }

    if (analysis.category === 'Property Maintenance') {
      analysis.insights.push({
        type: 'maintenance',
        message: 'Property maintenance expense',
        explanation: 'Categorized as maintenance based on item keywords and patterns',
        recommendation: 'Track for property upkeep budgets and maintenance schedules'
      });
    }

    if (analysis.category === 'Marketing & Photography') {
      analysis.insights.push({
        type: 'marketing',
        message: 'Marketing investment identified',
        explanation: 'Photography, marketing materials, or promotional items detected',
        recommendation: 'Measure ROI impact on bookings and brand visibility'
      });
    }
  }

  // Generate spending analysis report
  generateSpendingReport(orders) {
    const report = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + Math.abs(order.amount), 0),
      categoryBreakdown: {},
      locationBreakdown: { 'Freeport': 0, 'Smithville': 0, 'Both Properties': 0 },
      subscribeAndSaveTotal: 0,
      employeeBenefitsTotal: 0,
      seasonalTrends: {},
      monthlySpending: {},
      insights: []
    };

    orders.forEach(order => {
      const analysis = this.analyzeAmazonOrder(order);
      const amount = Math.abs(order.amount);

      // Category breakdown
      if (!report.categoryBreakdown[analysis.category]) {
        report.categoryBreakdown[analysis.category] = 0;
      }
      report.categoryBreakdown[analysis.category] += amount;

      // Location breakdown
      report.locationBreakdown[analysis.location] += amount;

      // Subscribe & Save tracking
      if (analysis.isSubscribeAndSave) {
        report.subscribeAndSaveTotal += amount;
      }

      // Board benefits tracking
      if (analysis.isEmployeeBenefit) {
        report.employeeBenefitsTotal += amount;
      }

      // Monthly spending
      const month = new Date(order.date).toISOString().substring(0, 7); // YYYY-MM
      if (!report.monthlySpending[month]) {
        report.monthlySpending[month] = 0;
      }
      report.monthlySpending[month] += amount;

      // Seasonal trends
      const season = analysis.seasonality.season;
      if (!report.seasonalTrends[season]) {
        report.seasonalTrends[season] = 0;
      }
      report.seasonalTrends[season] += amount;
    });

    // Generate insights
    this.generateReportInsights(report);

    return report;
  }

  // Generate actionable insights from spending data
  generateReportInsights(report) {
    const totalSpent = report.totalSpent;

    // Subscribe & Save insights
    const subscribePercentage = (report.subscribeAndSaveTotal / totalSpent) * 100;
    if (subscribePercentage > 50) {
      report.insights.push(`${subscribePercentage.toFixed(1)}% of spending is through Subscribe & Save - excellent for budget predictability`);
    }

    // Board benefits insights
    const benefitsPercentage = (report.employeeBenefitsTotal / totalSpent) * 100;
    if (benefitsPercentage > 15) {
      report.insights.push(`${benefitsPercentage.toFixed(1)}% of spending on board benefits - consider dedicated budget category`);
    }

    // Location insights
    const freeportPercentage = (report.locationBreakdown.Freeport / totalSpent) * 100;
    const smithvillePercentage = (report.locationBreakdown.Smithville / totalSpent) * 100;
    
    if (freeportPercentage > smithvillePercentage + 20) {
      report.insights.push(`Freeport property requires ${(freeportPercentage - smithvillePercentage).toFixed(1)}% more spending than Smithville`);
    } else if (smithvillePercentage > freeportPercentage + 20) {
      report.insights.push(`Smithville properties require ${(smithvillePercentage - freeportPercentage).toFixed(1)}% more spending than Freeport`);
    }

    // Category insights
    const topCategory = Object.entries(report.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      const categoryPercentage = (topCategory[1] / totalSpent) * 100;
      report.insights.push(`${topCategory[0]} is the largest expense category at ${categoryPercentage.toFixed(1)}% of total spending`);
    }

    // Monthly spending variance
    const monthlyAmounts = Object.values(report.monthlySpending);
    if (monthlyAmounts.length > 1) {
      const avgMonthly = monthlyAmounts.reduce((a, b) => a + b, 0) / monthlyAmounts.length;
      const variance = Math.max(...monthlyAmounts) - Math.min(...monthlyAmounts);
      const variancePercentage = (variance / avgMonthly) * 100;
      
      if (variancePercentage > 50) {
        report.insights.push(`High monthly spending variance (${variancePercentage.toFixed(1)}%) - consider smoothing expenses`);
      }
    }
  }

  /**
   * FIXED: Categorize BoA transaction based on correct TSV business rules
   * 
   * @param {Object} transaction - BoA transaction object
   * @returns {Object} Categorization result with enhanced analysis
   */
  categorizeBoATransaction(transaction) {
    const description = (transaction.description || '').toLowerCase();
    const amount = Math.abs(transaction.amount);
    
    // FIXED: Implement correct business categorization rules
    
    // 1. Zelle payments to Rich Southerland = Client Payouts
    if (description.includes('zelle') && description.includes('rich southerland')) {
      return {
        category: 'Client Payouts',
        subcategory: 'Rich Southerland Payments',
        confidence: 0.95,
        reasoning: 'Zelle payment to Rich Southerland identified as client payout',
        location: 'Business'
      };
    }
    
    // 2. Other Zelle payments = Maintenance (contractor payments)
    if (description.includes('zelle')) {
      return {
        category: 'Property Maintenance',
        subcategory: 'Contractor Payments',
        confidence: 0.90,
        reasoning: 'Zelle payment identified as contractor payment',
        location: 'Property'
      };
    }
    
    // 3. Amazon transactions - rarely maintenance, mostly supplies
    if (description.includes('amazon')) {
      return {
        category: 'Supplies & Inventory',
        subcategory: 'Amazon Purchases',
        confidence: 0.85,
        reasoning: 'Amazon purchase - supplies and inventory',
        location: 'Business'
      };
    }
    
    // 4. Bank fees and charges
    if (description.includes('fee') || description.includes('charge') || description.includes('service')) {
      return {
        category: 'Banking & Fees',
        subcategory: 'Bank Fees',
        confidence: 0.90,
        reasoning: 'Bank fee or service charge',
        location: 'Business'
      };
    }
    
    // 5. Payment processing (PayPal, Venmo, etc.)
    if (description.includes('paypal') || description.includes('venmo') || description.includes('square')) {
      return {
        category: 'Business Services',
        subcategory: 'Payment Processing',
        confidence: 0.85,
        reasoning: 'Payment processing service',
        location: 'Business'
      };
    }
    
    // 6. Utilities and recurring services
    if (description.includes('electric') || description.includes('gas') || description.includes('water') || 
        description.includes('internet') || description.includes('phone')) {
      return {
        category: 'Utilities & Services',
        subcategory: 'Recurring Services',
        confidence: 0.85,
        reasoning: 'Utility or recurring service payment',
        location: 'Property'
      };
    }
    
    // 7. Deposits and revenue
    if (transaction.amount > 0 || description.includes('deposit') || description.includes('transfer in')) {
      return {
        category: 'Revenue',
        subcategory: 'Deposits',
        confidence: 0.85,
        reasoning: 'Revenue deposit or positive transaction',
        location: 'Business'
      };
    }
    
    // 8. Insurance and professional services
    if (description.includes('insurance') || description.includes('legal') || description.includes('accounting')) {
      return {
        category: 'Professional Services',
        subcategory: 'Insurance & Legal',
        confidence: 0.85,
        reasoning: 'Professional service payment',
        location: 'Business'
      };
    }
    
    // Default categorization for unknown transactions
    return {
      category: 'Uncategorized',
      subcategory: 'Unknown',
      confidence: 0.30,
      reasoning: 'Unable to categorize transaction',
      location: 'Unknown'
    };
  }

  /**
   * Generate category breakdown for BoA transactions
   * @param {Array} transactions - Array of BoA transactions
   * @returns {Object} Category breakdown with amounts
   */
  getCategoryBreakdown(transactions) {
    const breakdown = {};
    
    transactions.forEach(transaction => {
      // Categorize the transaction
      const analysis = this.categorizeBoATransaction(transaction);
      const category = analysis.category || 'Uncategorized';
      const amount = Math.abs(transaction.amount || 0);
      
      // Add to breakdown
      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category] += amount;
    });
    
    return breakdown;
  }
}

module.exports = TSVCategorizer;
