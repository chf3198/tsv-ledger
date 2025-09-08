# Amazon Order History Research & Analysis Guide

## 📊 Expected Amazon CSV Format

Based on community research and common Amazon export patterns, here's what to expect:

### Typical Column Structure
Amazon Order History CSV files typically include these columns:

**Order Information:**
- `Order Date` - Date the order was placed (MM/DD/YYYY format)
- `Order ID` - Unique Amazon order identifier
- `Title` - Product name/description
- `Category` - Product category (Books, Electronics, etc.)
- `ASIN/ISBN` - Amazon product identifier
- `UNSPSC Code` - United Nations product classification
- `Website` - Usually "Amazon.com"
- `Purchase Order Number` - Internal PO reference
- `Ordering Customer Email` - Customer email
- `Shipment Date` - When order was shipped
- `Shipping Address Name` - Recipient name
- `Shipping Address Street 1` - Shipping address
- `Shipping Address Street 2` - Additional address line
- `Shipping Address City` - City
- `Shipping Address State` - State
- `Shipping Address Zip` - ZIP code
- `Order Status` - Order status (Shipped, Delivered, etc.)
- `Carrier Name & Tracking Number` - Shipping carrier info
- `Item Subtotal` - Pre-tax item cost
- `Item Subtotal Tax` - Tax amount
- `Item Total` - Total cost including tax
- `Tax Exemption Applied` - Tax exemption status
- `Tax Exemption Type` - Type of tax exemption
- `Exemption Opt-Out` - Tax exemption preference
- `Buyer Name` - Name of purchaser
- `Currency` - Currency code (USD)
- `Group Name` - For business accounts

**Subscription History Columns:**
- `Subscription Start Date`
- `Subscription End Date`
- `Subscription Status`
- `Billing Frequency`
- `Payment Method`
- `Subscription Amount`

### Common Data Challenges
1. **Date Formats**: Amazon uses MM/DD/YYYY format
2. **Multi-line Descriptions**: Product titles may span multiple lines
3. **Special Characters**: Product names may contain commas, quotes
4. **Missing Data**: Some fields may be empty for certain order types
5. **Currency Handling**: All amounts include currency symbols
6. **Tax Calculations**: Separate tax columns that need to be combined

## 🔍 Community Analysis Approaches

### Popular Analysis Patterns
1. **Spending Trends**
   - Monthly/yearly spending analysis
   - Category-wise expenditure breakdown
   - Seasonal purchasing patterns
   - Average order value calculations

2. **Product Insights**
   - Most frequently purchased categories
   - Favorite brands/products
   - Return/refund analysis
   - Prime vs non-Prime purchasing

3. **Subscription Analysis**
   - Monthly recurring costs
   - Subscription value assessment
   - Cost-benefit analysis of subscriptions

4. **Shipping & Logistics**
   - Shipping cost analysis
   - Delivery time patterns
   - Carrier performance analysis

### AI-Driven Insights Examples

#### 1. **Expense Categorization**
```javascript
// AI-powered categorization of Amazon purchases
const categories = {
  'Office Supplies': ['paper', 'pens', 'printer', 'ink'],
  'Software': ['adobe', 'microsoft', 'subscription'],
  'Hardware': ['computer', 'monitor', 'keyboard', 'mouse'],
  'Marketing': ['business cards', 'signage', 'advertising']
};
```

#### 2. **Anomaly Detection**
- Flag unusually large orders
- Detect potential duplicate purchases
- Identify subscription price changes
- Spot irregular spending patterns

#### 3. **Predictive Analytics**
- Forecast monthly spending
- Predict subscription renewal costs
- Estimate tax liabilities
- Project future category spending

#### 4. **Recommendation Engine**
- Suggest cost-saving alternatives
- Recommend bulk purchase opportunities
- Identify underutilized subscriptions
- Suggest budget optimization strategies

## 📈 Visualization Ideas

### Dashboard Components
1. **Spending Overview**
   - Monthly spending trend chart
   - Category pie chart
   - Top vendors bar chart

2. **Subscription Tracker**
   - Monthly recurring revenue chart
   - Subscription cost breakdown
   - Renewal calendar

3. **Product Analytics**
   - Purchase frequency heatmap
   - Product category trends
   - Return rate analysis

4. **Financial Insights**
   - Tax liability projections
   - Savings opportunity identification
   - Budget vs actual spending

### Recommended Libraries
- **Chart.js** - Lightweight charting library
- **D3.js** - Advanced data visualizations
- **Plotly.js** - Interactive charts
- **TensorFlow.js** - Machine learning insights

## 🛠️ Implementation Strategy

### Phase 1: Data Import
1. Create Amazon CSV parser similar to Bank of America parser
2. Handle Amazon-specific date formats and column names
3. Implement data validation and cleaning
4. Add support for subscription vs order differentiation

### Phase 2: Basic Analysis
1. Implement category mapping for Amazon products
2. Add spending trend calculations
3. Create basic reporting functionality
4. Build simple dashboard visualizations

### Phase 3: AI Integration
1. Add machine learning for automatic categorization
2. Implement anomaly detection
3. Create predictive spending models
4. Build recommendation system

### Phase 4: Advanced Features
1. Subscription optimization suggestions
2. Tax planning insights
3. Budget forecasting
4. Integration with other financial data

## 📋 Next Steps

1. **Download Amazon Data**: Once available, download Order History and Subscription History
2. **Create Test Parser**: Build `amazon-test-parser.js` similar to `test-parser.js`
3. **Analyze Format**: Examine actual column structure and data types
4. **Implement Parser**: Add Amazon parsing to server.js
5. **Build Visualizations**: Create charts and dashboards
6. **Add AI Features**: Implement ML-based insights

## 🔗 Useful Resources

- Amazon Order History export (via Account → Orders → Download order reports)
- Community forums discussing Amazon data analysis
- Open-source expense tracking projects
- Financial data visualization libraries

---

*This research is based on common Amazon export patterns and community analysis approaches. Actual format may vary based on account type and Amazon's current export structure.*</content>
<parameter name="filePath">/mnt/chromeos/removable/Drive/repos/tsv-ledger/AMAZON_RESEARCH.md
