# TSV Ledger API

Professional Business Intelligence Platform API

**Version:** 2.2.3  
**Base URL:** /api  
**Generated:** 1/6/2026, 6:53:45 PM

## Summary

- **Total Endpoints:** 18
- **API Modules:** 7
- **HTTP Methods:** GET: 14, PUT: 1, POST: 3

## API Endpoints

### Amazon Module

#### GET /api/amazon-items

GET /api/amazon-items Get all Amazon items with optional filtering /

**Handler:** Inline handler function
**File:** src/routes/amazon.js:19

---

#### PUT /api/amazon-items/:id

PUT /api/amazon-items/:id Update an Amazon item /

**Handler:** if
**File:** src/routes/amazon.js:96

---

### Analytics Module

#### GET /api/ai-analysis

GET /api/ai-analysis Get AI-powered analysis and insights /

**Handler:** Inline handler function
**File:** src/routes/analytics.js:156

---

#### GET /api/analysis

GET /api/analysis Get basic expenditure analysis /

**Handler:** Inline handler function
**File:** src/routes/analytics.js:109

---

#### GET /api/premium-analytics

GET /api/premium-analytics Get premium analytics data /

**Handler:** Inline handler function
**File:** src/routes/analytics.js:50

---

#### GET /api/premium-status

GET /api/premium-status Get premium feature status /

**Handler:** Handler function
**File:** src/routes/analytics.js:20

---

### Data Module

#### GET /api/expenditures

GET /api/expenditures Get all expenditures with optional filtering /

**Handler:** Inline handler function
**File:** src/routes/data.js:35

---

#### POST /api/expenditures

POST /api/expenditures Add a new expenditure /

**Handler:** if
**File:** src/routes/data.js:94

---

#### GET /api/menu.json

GET /api/menu.json Get navigation menu structure /

**Handler:** require
**File:** src/routes/data.js:20

---

### Employee-benefits Module

#### POST /api/employee-benefits-filter

POST /api/employee-benefits-filter Filter expenditures for employee benefits analysis /

**Handler:** Inline handler function
**File:** src/routes/employee-benefits.js:19

---

### Geographic Module

#### GET /api/geographic-analysis

GET /api/geographic-analysis Get detailed geographic analysis /

**Handler:** Inline handler function
**File:** src/routes/geographic.js:51

---

#### GET /api/geographic-dashboard

GET /api/geographic-dashboard Get geographic dashboard data /

**Handler:** Inline handler function
**File:** src/routes/geographic.js:20

---

### Import Module

#### POST /api/import-csv

POST /api/import-csv Import expenditures from CSV/TSV/DAT file /

**Handler:** if
**File:** src/routes/import.js:69

---

#### GET /api/import-history

GET /api/import-history Get import history /

**Handler:** getDataFilePath
**File:** src/routes/import.js:54

---

#### GET /api/import-status

GET /api/import-status Get current import status /

**Handler:** json
**File:** src/routes/import.js:46

---

### Subscription Module

#### GET /api/subscription-analysis

GET /api/subscription-analysis Get detailed subscription analysis /

**Handler:** Inline handler function
**File:** src/routes/subscription.js:78

---

#### GET /api/subscription-dashboard

GET /api/subscription-dashboard Get subscription dashboard data /

**Handler:** Inline handler function
**File:** src/routes/subscription.js:20

---

#### GET /api/subscription-for-order/:orderId

GET /api/subscription-for-order/:orderId Get subscription information for a specific order /

**Handler:** Inline handler function
**File:** src/routes/subscription.js:105

---

