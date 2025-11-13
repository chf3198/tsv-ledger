# TSV Ledger API Documentation

## Overview

The TSV Ledger API provides comprehensive REST endpoints for expense tracking, business intelligence, and data management. Built with Express.js, the API supports Amazon order import, AI-powered analysis, and premium business intelligence features.

## Base URL
```
http://localhost:3000
```

## Authentication
Currently, no authentication is required. All endpoints are publicly accessible.

## Response Format
All responses are in JSON format with consistent error handling.

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

## Core Endpoints

### Expenditures Management

#### GET /api/expenditures
Retrieve all expenditures with optional filtering.

**Query Parameters:**
- `category` (string): Filter by expense category
- `vendor` (string): Filter by vendor name
- `startDate` (string): Start date in YYYY-MM-DD format
- `endDate` (string): End date in YYYY-MM-DD format
- `limit` (number): Maximum number of results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exp-001",
      "date": "2024-01-15",
      "amount": 29.99,
      "description": "Office Supplies",
      "category": "Office Supplies",
      "vendor": "Amazon",
      "account": "Business Card",
      "taxCategory": "Business",
      "notes": "Monthly office supplies"
    }
  ],
  "count": 1
}
```

#### POST /api/expenditures
Add a new expenditure.

**Request Body:**
```json
{
  "date": "2024-01-15",
  "amount": 29.99,
  "description": "Office Supplies",
  "category": "Office Supplies",
  "vendor": "Amazon",
  "account": "Business Card",
  "taxCategory": "Business",
  "notes": "Monthly office supplies"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "exp-123",
    "date": "2024-01-15",
    "amount": 29.99,
    "description": "Office Supplies",
    "category": "Office Supplies",
    "vendor": "Amazon",
    "account": "Business Card",
    "taxCategory": "Business",
    "notes": "Monthly office supplies"
  },
  "message": "Expenditure added successfully"
}
```

#### PUT /api/expenditures/:id
Update an existing expenditure.

**Path Parameters:**
- `id` (string): Expenditure ID

**Request Body:** Same as POST, all fields optional

#### DELETE /api/expenditures/:id
Delete an expenditure.

**Path Parameters:**
- `id` (string): Expenditure ID

### Amazon Integration

#### POST /api/amazon-import
Import Amazon order history from CSV.

**Request Body:**
```json
{
  "csvData": "CSV content as string",
  "options": {
    "skipDuplicates": true,
    "updateExisting": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 25,
    "duplicates": 3,
    "errors": 0
  },
  "message": "Amazon orders imported successfully"
}
```

#### GET /api/amazon-items
Retrieve Amazon order items with filtering.

**Query Parameters:**
- `orderId` (string): Filter by Amazon order ID
- `startDate` (string): Start date filter
- `endDate` (string): End date filter
- `category` (string): Filter by category

#### POST /api/amazon-items/:id/edit
Edit Amazon order item details.

### Business Intelligence

#### GET /api/analysis
Get comprehensive business intelligence analysis.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSpent": 15432.67,
    "categories": {
      "Office Supplies": 3245.89,
      "Food & Dining": 2876.43,
      "Transportation": 1923.45
    },
    "monthlyTrends": [
      { "month": "2024-01", "amount": 1234.56 },
      { "month": "2024-02", "amount": 1456.78 }
    ],
    "topVendors": [
      { "vendor": "Amazon", "amount": 5432.10 },
      { "vendor": "Office Depot", "amount": 2341.56 }
    ],
    "averageTransaction": 87.43,
    "transactionCount": 176
  }
}
```

#### GET /api/analysis/category/:category
Get detailed analysis for specific category.

#### GET /api/analysis/vendor/:vendor
Get detailed analysis for specific vendor.

### AI Analysis (Premium Feature)

#### GET /api/ai-analysis
Get AI-powered insights and recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "spending_trend",
        "description": "Office supplies spending increased by 15% this quarter",
        "confidence": 0.85,
        "data": { ... }
      }
    ],
    "anomalies": [
      {
        "type": "unusual_amount",
        "description": "Unusually high expense of $500 on Office Supplies",
        "severity": "medium",
        "date": "2024-01-15"
      }
    ],
    "recommendations": [
      {
        "type": "budget_optimization",
        "priority": "high",
        "title": "Review Office Supplies Budget",
        "description": "Consider bulk purchasing options to reduce costs",
        "action": "Review supplier contracts"
      }
    ],
    "confidence": 0.82
  }
}
```

### Employee Benefits

#### GET /api/employee-benefits
Get employee benefits analysis and filtering.

**Query Parameters:**
- `includePersonal` (boolean): Include personal expenses (default: false)
- `taxYear` (number): Tax year for analysis

#### POST /api/employee-benefits/filter
Apply employee benefits filtering to expenditures.

**Request Body:**
```json
{
  "expenditures": [...],
  "benefitsConfig": {
    "itemAllocations": {
      "item-001": { "benefits": 50, "business": 50 }
    },
    "categoryFilters": ["Office Supplies", "Kitchen Equipment"]
  }
}
```

### Geographic Analysis

#### GET /api/geographic-analysis
Get geographic spending analysis and insights.

**Response:**
```json
{
  "success": true,
  "data": {
    "regions": [
      {
        "region": "Texas",
        "amount": 8756.43,
        "percentage": 56.7,
        "transactions": 89
      }
    ],
    "cities": [...],
    "insights": [...]
  }
}
```

### Subscription Analysis

#### GET /api/subscription-analysis
Analyze subscription and recurring expenses.

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "vendor": "Adobe",
        "amount": 59.99,
        "frequency": "monthly",
        "category": "Software"
      }
    ],
    "monthlyRecurring": 456.78,
    "yearlyRecurring": 5481.36
  }
}
```

### Premium Features

#### GET /api/premium-status
Check premium feature availability.

**Response:**
```json
{
  "success": true,
  "data": {
    "premiumEnabled": true,
    "features": [
      "ai-analysis",
      "advanced-reporting",
      "export-functionality"
    ],
    "expiresAt": "2025-12-31"
  }
}
```

### Testing & Development

#### GET /api/health
Health check endpoint for monitoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": "2 days, 4 hours",
    "memory": "45MB",
    "version": "2.2.2"
  }
}
```

#### POST /api/test/reset
Reset test data (development only).

#### GET /api/test/data
Get test data summary (development only).

## Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ERROR`: Attempting to create duplicate resource
- `PERMISSION_DENIED`: Insufficient permissions
- `SERVER_ERROR`: Internal server error

## Rate Limiting

Currently no rate limiting is implemented. All endpoints can be called without restrictions.

## Data Formats

### Dates
All dates use ISO 8601 format: `YYYY-MM-DD`

### Currency
All monetary values are in USD with 2 decimal places.

### Categories
Standard categories include:
- Office Supplies
- Food & Dining
- Transportation
- Entertainment
- Utilities
- Healthcare
- Education
- Travel
- Other

## SDKs & Libraries

No official SDKs are currently available. Use standard HTTP clients:

### JavaScript (Node.js)
```javascript
const response = await fetch('http://localhost:3000/api/expenditures');
const data = await response.json();
```

### Python
```python
import requests
response = requests.get('http://localhost:3000/api/expenditures')
data = response.json()
```

### cURL
```bash
curl -X GET http://localhost:3000/api/expenditures
```

## Changelog

### v2.2.2
- Added AI analysis endpoints
- Enhanced Amazon integration
- Improved error handling

### v2.1.0
- Added employee benefits filtering
- Geographic analysis capabilities
- Subscription detection

### v2.0.0
- Complete API redesign
- RESTful architecture
- Comprehensive business intelligence

## Support

For API support, please refer to the project documentation or create an issue in the repository.