# Expenditures Management API

Core API endpoints for managing expense data including retrieval, creation, updates, and deletion of expenditures.

## GET /api/expenditures

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

## POST /api/expenditures

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

## PUT /api/expenditures/:id

Update an existing expenditure.

**Path Parameters:**
- `id` (string): Expenditure ID

**Request Body:** Same as POST, all fields optional

## DELETE /api/expenditures/:id

Delete an expenditure.

**Path Parameters:**
- `id` (string): Expenditure ID