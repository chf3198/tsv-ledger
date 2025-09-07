// TSV Ledger - Enhanced Categorization Engine
// Provides intelligent categorization for Texas Sunset Venues expenditures

class TSVCategorizer {
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

    // Subscribe & Save detection patterns
    this.subscribeAndSaveKeywords = [
      'subscribe & save', 'subscription', 'recurring', 'monthly delivery',
      'subscribe and save', 'automatic delivery', 'regular delivery'
    ];

    // Employee benefits/perks items
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
        subcategories: ['Guest Refreshments', 'Employee Benefits', 'Special Events'],
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

  // Analyze Amazon order for comprehensive categorization
  analyzeAmazonOrder(order) {
    const analysis = {
      orderId: order.orderId,
      date: order.date,
      amount: order.amount,
      items: order.items,
      category: 'General',
      subcategory: null,
      location: this.detectLocation(order.items),
      isSubscribeAndSave: this.detectSubscribeAndSave(order),
      isEmployeeBenefit: this.detectEmployeeBenefit(order.items),
      businessPurpose: this.determinBusinessPurpose(order.items),
      seasonality: this.detectSeasonality(order.date, order.items),
      insights: []
    };

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
    const itemsLower = items.toLowerCase();
    
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

  // Detect Subscribe & Save orders
  detectSubscribeAndSave(order) {
    const itemsLower = order.items.toLowerCase();
    const paymentsLower = (order.payments || '').toLowerCase();

    // Check for Subscribe & Save keywords in item description or payment info
    return this.subscribeAndSaveKeywords.some(keyword => 
      itemsLower.includes(keyword) || paymentsLower.includes(keyword)
    ) || order.shipping === '0'; // Free shipping often indicates S&S
  }

  // Detect employee benefit items
  detectEmployeeBenefit(items) {
    const itemsLower = items.toLowerCase();
    return this.employeeBenefitKeywords.some(keyword => 
      itemsLower.includes(keyword)
    );
  }

  // Categorize items into business categories
  categorizeItems(items) {
    const itemsLower = items.toLowerCase();
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
    const itemsLower = items.toLowerCase();

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
      return 'Employee Benefits';
    }

    return 'Operations';
  }

  // Detect seasonal patterns
  detectSeasonality(date, items) {
    const month = new Date(date).getMonth() + 1; // 1-12
    const itemsLower = items.toLowerCase();

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
    if (analysis.isSubscribeAndSave) {
      analysis.insights.push('Subscribe & Save order - predictable recurring expense');
    }

    if (analysis.isEmployeeBenefit) {
      analysis.insights.push('Employee benefit/perk item - consider budget allocation');
    }

    if (analysis.location !== 'Both Properties') {
      analysis.insights.push(`Property-specific purchase for ${analysis.location}`);
    }

    if (analysis.seasonality.seasonalItems.length > 0) {
      analysis.insights.push(`Seasonal item: ${analysis.seasonality.seasonalItems.join(', ')}`);
    }

    // Budget planning insights
    if (analysis.amount > 50) {
      analysis.insights.push('High-value purchase - review for budget planning');
    }

    if (analysis.category === 'Property Maintenance') {
      analysis.insights.push('Maintenance expense - track for property upkeep budgets');
    }

    if (analysis.category === 'Marketing & Photography') {
      analysis.insights.push('Marketing investment - measure ROI impact');
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

      // Employee benefits tracking
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

    // Employee benefits insights
    const benefitsPercentage = (report.employeeBenefitsTotal / totalSpent) * 100;
    if (benefitsPercentage > 15) {
      report.insights.push(`${benefitsPercentage.toFixed(1)}% of spending on employee benefits - consider dedicated budget category`);
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
}

module.exports = TSVCategorizer;
