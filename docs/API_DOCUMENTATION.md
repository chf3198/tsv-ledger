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
**[View Expenditures API](api/expenditures.md)**: Complete CRUD operations for expense data including filtering, creation, updates, and deletion.

### Amazon Integration
**[View Amazon Integration API](api/amazon-integration.md)**: Import and manage Amazon purchase data from ZIP exports and CSV files.

### Business Intelligence
Analytics and reporting endpoints for expense analysis and insights.

### AI Analysis (Premium Feature)
AI-powered expense categorization, anomaly detection, and predictive analytics.

### Employee Benefits
Tax-advantaged expense tracking and reporting for employee benefits.

### Geographic Analysis
Location-based expense analysis and mapping capabilities.

### Subscription Analysis
Recurring payment detection and subscription expense management.

### Premium Features
Advanced business intelligence and reporting features.

### Testing & Development
Development utilities and testing endpoints.

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