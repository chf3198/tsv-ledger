# API Integration

## Analysis Endpoints

RESTful API endpoints providing access to AI analysis capabilities through standardized interfaces.

### Core Analytics Endpoints

#### Insights Endpoint
Retrieves comprehensive spending insights and analysis results.

```javascript
// src/routes/analytics.js
const express = require('express');
const router = express.Router();
const AIAnalysisEngine = require('../ai-analysis-engine');
const ExpenseCategorizer = require('../tsv-categorizer');

const analysisEngine = new AIAnalysisEngine();
const categorizer = new ExpenseCategorizer();

// GET /api/analytics/insights
router.get('/insights', async (req, res, next) => {
  try {
    const { timeframe = 'month' } = req.query;
    const insights = await analysisEngine.analyzeExpenses(timeframe);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
});
```

#### Categorization Endpoint
Automatically categorizes expense transactions using AI algorithms.

```javascript
// POST /api/analytics/categorize
router.post('/categorize', async (req, res, next) => {
  try {
    const { description, amount, merchant } = req.body;

    if (!description || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Description and amount are required'
      });
    }

    const result = categorizer.categorizeExpense({
      description,
      amount: parseFloat(amount),
      merchant
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});
```

#### Learning Endpoint
Updates categorization models based on user corrections and feedback.

```javascript
// POST /api/analytics/learn
router.post('/learn', async (req, res, next) => {
  try {
    const { originalCategory, correctedCategory, expense } = req.body;

    categorizer.learnFromCorrection(originalCategory, correctedCategory, expense);

    res.json({
      success: true,
      message: 'Categorization learning updated'
    });
  } catch (error) {
    next(error);
  }
});
```

### Advanced Analytics Endpoints

#### Recommendations Endpoint
Provides personalized financial recommendations based on spending patterns.

```javascript
// GET /api/analytics/recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const { userId } = req.query;

    // In a real implementation, get user expenses and profile
    // For now, return sample recommendations
    const recommendations = analysisEngine.generateRecommendations([]);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});
```

#### Anomalies Endpoint
Detects unusual transactions and potential financial anomalies.

```javascript
// GET /api/analytics/anomalies
router.get('/anomalies', async (req, res, next) => {
  try {
    const { sensitivity = 2.0 } = req.query;

    // Get recent expenses for anomaly detection
    const recentExpenses = await getRecentExpenses(); // Implementation needed

    const anomalies = analysisEngine.detectAnomalies(recentExpenses, parseFloat(sensitivity));

    res.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    next(error);
  }
});
```

## API Response Formats

### Standard Response Structure
```json
{
  "success": true,
  "data": {
    // Response data varies by endpoint
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Endpoint Specifications

### GET /api/analytics/insights
- **Purpose**: Retrieve comprehensive spending insights
- **Parameters**:
  - `timeframe` (optional): Analysis period ('week', 'month', 'quarter', 'year')
- **Response**: Analysis results with patterns, trends, and statistics

### POST /api/analytics/categorize
- **Purpose**: Categorize a single expense transaction
- **Body**:
  ```json
  {
    "description": "Starbucks Coffee",
    "amount": 5.50,
    "merchant": "Starbucks"
  }
  ```
- **Response**: Categorization result with confidence score

### POST /api/analytics/learn
- **Purpose**: Update categorization model with user feedback
- **Body**:
  ```json
  {
    "originalCategory": "Food & Dining",
    "correctedCategory": "Coffee Shops",
    "expense": {
      "description": "Starbucks Coffee",
      "amount": 5.50,
      "date": "2024-01-15"
    }
  }
  ```

### GET /api/analytics/recommendations
- **Purpose**: Get personalized financial recommendations
- **Parameters**:
  - `userId` (optional): User identifier for personalization
- **Response**: Array of prioritized recommendations

### GET /api/analytics/anomalies
- **Purpose**: Detect financial anomalies in recent transactions
- **Parameters**:
  - `sensitivity` (optional): Detection sensitivity (default: 2.0)
- **Response**: Array of detected anomalies with confidence scores

## Integration Patterns

### Frontend Integration
```javascript
// Example frontend integration
async function getSpendingInsights(timeframe = 'month') {
  const response = await fetch(`/api/analytics/insights?timeframe=${timeframe}`);
  const result = await response.json();

  if (result.success) {
    displayInsights(result.data);
  } else {
    handleError(result.error);
  }
}

async function categorizeExpense(expenseData) {
  const response = await fetch('/api/analytics/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData)
  });

  const result = await response.json();
  return result.success ? result.data : null;
}
```

### Error Handling
```javascript
// Centralized error handling
function handleApiError(error, endpoint) {
  console.error(`API Error in ${endpoint}:`, error);

  // Log to monitoring system
  logError({
    endpoint,
    error: error.message,
    timestamp: new Date().toISOString()
  });

  // Show user-friendly message
  showNotification('An error occurred. Please try again later.', 'error');
}
```

### Rate Limiting
- **Insights**: 100 requests per minute per user
- **Categorization**: 500 requests per minute per user
- **Learning**: 50 requests per minute per user
- **Recommendations**: 50 requests per minute per user
- **Anomalies**: 25 requests per minute per user

This API integration provides comprehensive access to AI analysis capabilities through well-defined, secure, and performant endpoints.