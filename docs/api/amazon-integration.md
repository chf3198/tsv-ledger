# Amazon Integration API

API endpoints for importing and managing Amazon purchase data from official ZIP exports and CSV files.

## Supported Data Types

- **Order History**: Complete purchase transaction data
- **Subscriptions**: Subscribe & Save recurring purchases
- **Cart Items**: Saved items and wishlist data
- **Returns**: Return and refund transaction history

## POST /api/amazon-zip-import

Import Amazon data from official ZIP file exports.

**Request:**
- Content-Type: `multipart/form-data`
- File field: `amazonZip`

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": 245,
    "subscriptions": 12,
    "cartItems": 89,
    "returns": 5,
    "totalFiles": 4,
    "processingTime": "2.3s"
  },
  "stats": {
    "totalFiles": 4,
    "processedFiles": 4,
    "orders": 245,
    "subscriptions": 12,
    "cartItems": 89,
    "returns": 5,
    "errors": []
  },
  "message": "Amazon ZIP data imported successfully"
}
```

## POST /api/validate-amazon-zip

Validate Amazon ZIP file before import.

**Request:**
- Content-Type: `multipart/form-data`
- File field: `amazonZip`

**Response:**
```json
{
  "isValid": true,
  "message": "File appears to be a valid Amazon ZIP export"
}
```

## POST /api/amazon-import

Import Amazon order history from CSV (legacy endpoint).

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

## GET /api/amazon-items

Retrieve Amazon order items with filtering.

**Query Parameters:**
- `orderId` (string): Filter by Amazon order ID
- `startDate` (string): Start date filter
- `endDate` (string): End date filter
- `category` (string): Filter by category
- `dataSource` (string): Filter by data source (orders, subscriptions, cart, returns)

## POST /api/amazon-items/:id/edit

Edit Amazon order item details.