# TSV Ledger API Documentation

> **Version:** 2.2.3 - Modular Architecture
> **Base URL:** `http://localhost:3000`
> **Content-Type:** `application/json`
> **Architecture:** Modular Route System

## API Overview

The TSV Ledger API provides comprehensive endpoints for expense tracking, Amazon order management, business intelligence analysis, and premium analytics for Texas Sunset Venues.

### Modular Architecture

The API is organized into focused route modules for optimal maintainability and AI development efficiency:

- **`/api/import/*`** - Data import operations (CSV, ZIP files)
- **`/api/data/*`** - Basic CRUD operations and menu
- **`/api/analytics/*`** - Premium analytics and AI analysis
- **`/api/amazon/*`** - Amazon-specific operations
- **`/api/employee-benefits/*`** - Benefits filtering and analysis
- **`/api/subscription/*`** - Subscription tracking
- **`/api/geographic/*`** - Geographic analysis

## Authentication

Currently no authentication required for local development. Production deployment should implement appropriate security measures.

## Core Endpoints

### Data Import Operations (`routes/import.js`)

#### `GET /api/import-status`
Get current import status and progress.

**Response:**
```json
{
  "isImporting": false,
  "currentStep": "Import completed",
  "progress": 100,
  "totalRecords": 598,
  "processedRecords": 598,
  "errors": []
}
```

#### `GET /api/import-history`
Get import history with statistics.

**Response:**
```json
{
  "history": [
    {
      "timestamp": "2025-09-08T10:30:00.000Z",
      "type": "csv",
      "recordsProcessed": 150,
      "recordsAdded": 145,
      "errors": 5,
      "source": "csv-import"
    }
  ],
  "total": 1
}
```

#### `POST /api/import-csv`
Import expenditures from CSV/TSV/DAT file.

**Request:**
```http
POST /api/import-csv
Content-Type: application/json

{
  "csvData": "date,amount,description\n2025-09-08,29.99,Office supplies"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Import completed successfully",
  "stats": {
    "totalRows": 1,
    "validRecords": 1,
    "addedToDatabase": 1,
    "errors": 0
  }
}
```

#### `POST /api/validate-amazon-zip`
Validate Amazon ZIP file before import.

#### `POST /api/import-amazon-zip`
Import data from Amazon ZIP file.

### Basic Data Operations (`routes/data.js`)

#### `GET /api/menu.json`
Get navigation menu structure.

#### `GET /api/expenditures`
Get all expenditures with optional filtering.

**Query Parameters:**
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `category` - Filter by category
- `source` - Filter by source
- `limit` - Limit results

#### `POST /api/expenditures`
Add a new expenditure.

**Request:**
```json
{
  "date": "2025-09-08",
  "amount": 29.99,
  "description": "Office supplies",
  "category": "Office Supplies",
  "source": "manual"
}
```

### Analytics Operations (`routes/analytics.js`)

#### `GET /api/premium-status`
Get premium features availability.

#### `GET /api/premium-analytics`
Get premium analytics data.

#### `GET /api/analysis`
Get basic expenditure analysis.

#### `GET /api/ai-analysis`
Get AI-powered insights and recommendations.

### Amazon Operations (`routes/amazon.js`)

#### `GET /api/amazon-items`
Get all Amazon items with filtering.

#### `PUT /api/amazon-items/:id`
Update an Amazon item.

### Employee Benefits Operations (`routes/employee-benefits.js`)

#### `POST /api/employee-benefits-filter`
Filter expenditures for employee benefits analysis.

### Subscription Operations (`routes/subscription.js`)

#### `GET /api/subscription-dashboard`
Get subscription dashboard data.

#### `GET /api/subscription-analysis`
Get detailed subscription analysis.

#### `GET /api/subscription-for-order/:orderId`
Get subscription information for a specific order.

### Geographic Operations (`routes/geographic.js`)

#### `GET /api/geographic-dashboard`
Get geographic dashboard data.

#### `GET /api/geographic-analysis`
Get detailed geographic analysis.
    "category": "Business Expenses",
    "vendor": "Amazon"
  }
]
```

### Amazon Order Management

#### `GET /api/amazon-items`
Retrieve all Amazon orders with optional filtering.

**Query Parameters:**
- `businessCard` (boolean): Filter for business card transactions
- `category` (string): Filter by category
- `minAmount` (number): Minimum amount filter
- `maxAmount` (number): Maximum amount filter

**Example:**
```http
GET /api/amazon-items?businessCard=true&category=Office Supplies
```

**Response:**
```json
[
  {
    "id": "amz-001",
    "name": "HP Printer Ink Cartridges",
    "price": "$45.99",
    "category": "Office Supplies",
    "orderDate": "2025-08-15",
    "isBusinessCard": true,
    "subscribeAndSave": false,
    "confidence": 0.95
  }
]
```

#### `GET /api/amazon-items/:id`
Get specific Amazon item by ID.

**Response:**
```json
{
  "id": "amz-001",
  "name": "HP Printer Ink Cartridges",
  "price": "$45.99",
  "category": "Office Supplies",
  "orderDate": "2025-08-15",
  "details": {
    "vendor": "Amazon",
    "shipping": "Free",
    "delivery": "2-day"
  }
}
```

#### `PUT /api/amazon-items/:id`
Update Amazon item details.

**Request:**
```json
{
  "name": "Updated Item Name",
  "category": "New Category",
  "isBusinessCard": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item updated successfully",
  "item": { /* updated item data */ }
}
```

#### `DELETE /api/amazon-items/:id`
Delete Amazon item.

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

### Business Intelligence

#### `GET /api/analysis`
Get comprehensive business intelligence analysis.

**Response:**
```json
{
  "summary": {
    "totalOrders": 598,
    "totalAmount": 15234.56,
    "averageOrderValue": 25.48,
    "topCategories": ["Office Supplies", "Technology", "Travel"]
  },
  "subscribeAndSave": {
    "totalItems": 156,
    "detectionRate": 0.26,
    "confidence": 0.80,
    "monthlySavings": 234.56
  },
  "businessMetrics": {
    "businessCardTransactions": 89,
    "personalTransactions": 509,
    "businessPercentage": 0.149
  }
}
```

#### `GET /api/premium-status`
Get premium features availability and configuration.

**Response:**
```json
{
  "premiumFeaturesAvailable": true,
  "premiumFields": [
    "businessCard",
    "subscribeAndSave",
    "confidence",
    "aiAnalysis"
  ],
  "subscriptionDetectionAccuracy": 0.80,
  "version": "2.2.1"
}
```

### AI-Powered Analysis

#### `GET /api/ai-analysis`
Get AI-powered insights and recommendations.

**Response:**
```json
{
  "insights": [
    "You could save $50/month by optimizing Subscribe & Save",
    "Consider consolidating office supply orders",
    "Travel expenses trending 15% higher this quarter"
  ],
  "recommendations": [
    {
      "type": "cost_optimization",
      "description": "Bundle similar purchases",
      "potential_savings": 125.50
    }
  ],
  "predictions": {
    "nextMonthSpending": 1250.75,
    "confidence": 0.85
  }
}
```

### Employee Benefits

#### `GET /api/employee-benefits`
Get employee benefits analysis and filtering.

**Query Parameters:**
- `month` (string): Filter by month (YYYY-MM)
- `category` (string): Filter by expense category

**Response:**
```json
{
  "totalBenefitTransactions": 89,
  "totalAmount": 2456.78,
  "categories": {
    "Office Supplies": 45.67,
    "Technology": 234.56,
    "Travel": 567.89
  },
  "monthlyBreakdown": {
    "2025-08": 856.34,
    "2025-09": 789.12
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion

### Error Codes
- `400 Bad Request` - Invalid request format
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": true,
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-09-08T10:30:00Z"
}
```

## Testing Endpoints

### `GET /api/test/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-08T10:30:00Z",
  "version": "2.2.1",
  "uptime": 3600
}
```

### `GET /api/test/data-integrity`
Validate data integrity and consistency.

**Response:**
```json
{
  "dataIntegrity": "valid",
  "totalRecords": 598,
  "duplicates": 0,
  "missingFields": 0,
  "lastCheck": "2025-09-08T10:30:00Z"
}
```

## Rate Limiting

Currently no rate limiting implemented. Production deployment should include appropriate rate limiting based on usage patterns.

## Caching

Responses are not cached by default. Consider implementing caching for frequently accessed endpoints in production.

---

**For more information, see:**
- [Development Guide](DEVELOPMENT.md)
- [Testing Documentation](TESTING_COMPLETE.md)
- [Handoff Guide](HANDOFF_GUIDE.md)
