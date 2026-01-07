# Anomaly Detection System

## Statistical Anomaly Detection

Uses statistical methods to identify unusual transactions that may indicate errors, fraud, or unusual spending patterns.

### Core Detection Methods

#### Amount-Based Anomalies
Identifies transactions that deviate significantly from normal spending patterns.

```javascript
// src/ai-analysis-engine.js - Anomaly Detection
class AnomalyDetector {
  detectAnomalies(expenses, sensitivity = 2.0) {
    const anomalies = [];
    const amounts = expenses.map(e => e.amount);

    if (amounts.length < 10) return anomalies; // Need minimum data

    const stats = this.calculateStatistics(amounts);
    const threshold = stats.mean + (sensitivity * stats.stdDev);

    expenses.forEach(expense => {
      if (expense.amount > threshold) {
        anomalies.push({
          type: 'high_amount',
          expense,
          deviation: (expense.amount - stats.mean) / stats.stdDev,
          confidence: this.calculateAnomalyConfidence(expense, stats)
        });
      }
    });

    // Detect unusual timing patterns
    const timingAnomalies = this.detectTimingAnomalies(expenses);
    anomalies.push(...timingAnomalies);

    // Detect category inconsistencies
    const categoryAnomalies = this.detectCategoryAnomalies(expenses);
    anomalies.push(...categoryAnomalies);

    return anomalies.sort((a, b) => b.confidence - a.confidence);
  }

  calculateStatistics(amounts) {
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    return { mean, variance, stdDev };
  }
}
```

#### Timing-Based Anomalies
Detects transactions that occur at unusual times, which may indicate fraudulent activity.

```javascript
detectTimingAnomalies(expenses) {
  const anomalies = [];
  const expensesByHour = this.groupExpensesByHour(expenses);

  // Flag expenses at unusual hours (e.g., 2-5 AM)
  Object.entries(expensesByHour).forEach(([hour, hourExpenses]) => {
    const hourNum = parseInt(hour);
    if (hourNum >= 2 && hourNum <= 5 && hourExpenses.length > 0) {
      hourExpenses.forEach(expense => {
        anomalies.push({
          type: 'unusual_timing',
          expense,
          reason: `Transaction at ${hour}:00`,
          confidence: 0.8
        });
      }
    });
  });

  return anomalies;
}
```

#### Category-Based Anomalies
Identifies expenses that don't match expected patterns for their assigned category.

```javascript
detectCategoryAnomalies(expenses) {
  const anomalies = [];
  const categoryPatterns = this.buildCategoryPatterns(expenses);

  expenses.forEach(expense => {
    const expectedAmount = categoryPatterns[expense.category]?.averageAmount;
    if (expectedAmount && Math.abs(expense.amount - expectedAmount) / expectedAmount > 2) {
      anomalies.push({
        type: 'category_inconsistency',
        expense,
        expectedAmount,
        deviation: Math.abs(expense.amount - expectedAmount) / expectedAmount,
        confidence: 0.7
      });
    }
  });

  return anomalies;
}

buildCategoryPatterns(expenses) {
  const patterns = {};

  expenses.forEach(expense => {
    if (!patterns[expense.category]) {
      patterns[expense.category] = {
        amounts: [],
        count: 0
      };
    }
    patterns[expense.category].amounts.push(expense.amount);
    patterns[expense.category].count++;
  });

  Object.keys(patterns).forEach(category => {
    const amounts = patterns[category].amounts;
    patterns[category].averageAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    patterns[category].stdDev = this.calculateStdDev(amounts);
  });

  return patterns;
}
```

## Machine Learning Categorization

Uses pattern matching and historical data to automatically categorize expenses with high accuracy.

### Rule-Based Categorization
Applies predefined rules based on keywords and merchant information.

```javascript
// src/tsv-categorizer.js
class ExpenseCategorizer {
  constructor() {
    this.categoryRules = this.loadCategoryRules();
    this.historicalPatterns = this.loadHistoricalPatterns();
  }

  categorizeExpense(expense) {
    const { description, amount, merchant } = expense;

    // Rule-based categorization
    const ruleBasedCategory = this.applyCategoryRules(description, merchant);
    if (ruleBasedCategory) {
      return {
        category: ruleBasedCategory,
        confidence: 0.9,
        method: 'rules'
      };
    }

    // Pattern-based categorization
    const patternBasedCategory = this.matchHistoricalPatterns(description, amount);
    if (patternBasedCategory) {
      return {
        category: patternBasedCategory.category,
        confidence: patternBasedCategory.confidence,
        method: 'patterns'
      };
    }

    // Fallback to generic category
    return {
      category: 'Other',
      confidence: 0.1,
      method: 'fallback'
    };
  }

  applyCategoryRules(description, merchant) {
    const text = `${description} ${merchant || ''}`.toLowerCase();

    for (const [category, rules] of Object.entries(this.categoryRules)) {
      for (const rule of rules) {
        if (rule.keywords.some(keyword => text.includes(keyword))) {
          return category;
        }
      }
    }

    return null;
  }
}
```

### Pattern-Based Categorization
Learns from historical categorization patterns to improve accuracy over time.

```javascript
matchHistoricalPatterns(description, amount) {
  const matches = [];

  this.historicalPatterns.forEach(pattern => {
    const descriptionSimilarity = this.calculateSimilarity(description, pattern.description);
    const amountSimilarity = 1 - Math.abs(amount - pattern.averageAmount) / pattern.averageAmount;

    if (descriptionSimilarity > 0.8 && amountSimilarity > 0.8) {
      matches.push({
        category: pattern.category,
        confidence: (descriptionSimilarity + amountSimilarity) / 2,
        pattern
      });
    }
  });

  if (matches.length > 0) {
    return matches.sort((a, b) => b.confidence - a.confidence)[0];
  }

  return null;
}

calculateSimilarity(text1, text2) {
  // Simple Jaccard similarity for keywords
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
```

### Learning and Adaptation
Improves categorization accuracy through user feedback and corrections.

```javascript
learnFromCorrection(originalCategory, correctedCategory, expense) {
  // Update historical patterns based on user feedback
  const existingPattern = this.historicalPatterns.find(p =>
    p.description.toLowerCase() === expense.description.toLowerCase()
  );

  if (existingPattern) {
    // Update existing pattern
    existingPattern.category = correctedCategory;
    existingPattern.averageAmount = (existingPattern.averageAmount + expense.amount) / 2;
  } else {
    // Add new pattern
    this.historicalPatterns.push({
      description: expense.description,
      category: correctedCategory,
      averageAmount: expense.amount,
      frequency: 'unknown'
    });
  }

  // Save updated patterns (in real implementation)
  this.saveHistoricalPatterns();
}
```

## Category Rules Configuration

### Predefined Category Rules
```javascript
loadCategoryRules() {
  return {
    'Food & Dining': [
      { keywords: ['restaurant', 'cafe', 'diner', 'pizza', 'burger', 'taco'] },
      { keywords: ['grocery', 'market', 'supermarket', 'whole foods', 'trader joe'] }
    ],
    'Transportation': [
      { keywords: ['gas', 'fuel', 'station', 'bp', 'shell', 'exxon'] },
      { keywords: ['uber', 'lyft', 'taxi', 'transit', 'bus', 'train', 'subway'] }
    ],
    'Shopping': [
      { keywords: ['amazon', 'walmart', 'target', 'costco', 'macy', 'nordstrom'] },
      { keywords: ['clothing', 'shoes', 'accessories', 'jewelry'] }
    ],
    'Entertainment': [
      { keywords: ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'theater', 'cinema'] },
      { keywords: ['book', 'books', 'audible', 'kindle'] }
    ],
    'Bills & Utilities': [
      { keywords: ['electric', 'power', 'gas', 'utility', 'water', 'internet', 'cable'] },
      { keywords: ['phone', 'mobile', 'verizon', 'att', 'tmobile'] }
    ]
  };
}
```

This anomaly detection and categorization system provides robust financial monitoring and automated expense management capabilities.