# Texas Sunset Venues - Business Domain Knowledge

> **Business Intelligence Platform for Texas Sunset Venues Property Management**  
> **Domain:** Hospitality & Property Management  
> **Focus:** Expense Tracking & Business Intelligence

## Business Context

### Company Overview
**Texas Sunset Venues** (texassunsetvenues.com) is a property management company specializing in vacation rental properties across Texas. The company manages multiple properties with different characteristics and business requirements.

### Business Model
- **Property Types**: Beach properties (Freeport) and Lake properties (Smithville)
- **Revenue Streams**: Vacation rental bookings, property management services
- **Cost Centers**: Property maintenance, supplies, utilities, marketing, staff
- **Seasonality**: Peak season during summer months, holiday periods

### Key Business Challenges
1. **Expense Categorization**: Tracking expenses across multiple properties and categories
2. **Business vs Personal**: Separating business expenses from personal transactions
3. **Tax Compliance**: Proper categorization for tax reporting and deductions
4. **Vendor Management**: Tracking recurring expenses and subscription services
5. **Property-Specific Costs**: Allocating expenses to specific properties

## Property Portfolio

### Freeport Properties (Beach/Coastal)
**Characteristics:**
- Gulf Coast location with saltwater exposure
- Higher maintenance due to coastal environment
- Seasonal usage patterns (summer peak)
- Specific supply needs (marine equipment, saltwater-resistant materials)

**Common Expense Categories:**
- Marine/boat equipment and maintenance
- Saltwater-resistant materials and supplies
- Beach/coastal cleaning supplies
- Weather protection and hurricane preparation
- Fishing and water sports equipment

**Keywords for Classification:**
- freeport, beach, coastal, surfside, gulf, ocean, salt water
- marine, pier, dock, boat, fishing, seaweed, saltwater

### Smithville Properties (Lake/Inland)
**Characteristics:**
- Lake location with freshwater environment
- State park proximity with outdoor recreation focus
- Different seasonal patterns
- Hiking and nature-focused amenities

**Common Expense Categories:**
- Freshwater recreational equipment
- Hiking and trail maintenance supplies
- Forest/woodland maintenance materials
- Lake-specific equipment and supplies
- Nature/wildlife-related amenities

**Keywords for Classification:**
- smithville, bastrop, lake, river, pine, cedar, state park
- hiking, trail, woods, forest, freshwater, creek

## Amazon Integration Business Logic

### Business Requirements
The TSV Ledger system specifically focuses on Amazon purchases because:
1. **Volume**: Amazon represents 60%+ of business purchases
2. **Categorization**: Complex items requiring intelligent categorization
3. **Subscribe & Save**: Recurring business supplies optimization
4. **Business Card Integration**: Separating business from personal purchases

### Subscribe & Save Business Value
**Why Subscribe & Save Detection Matters:**
- **Cost Optimization**: 5-15% savings on recurring business supplies
- **Cash Flow Management**: Predictable monthly expenses
- **Tax Planning**: Recurring business expense categorization
- **Vendor Consolidation**: Reduced vendor management overhead

**Target Categories for Subscribe & Save:**
- Cleaning supplies (paper towels, toilet paper, sanitizers)
- Office supplies (printer ink, paper, supplies)
- Coffee and beverage supplies for guests
- Personal care items for rental properties
- Maintenance supplies (batteries, basic tools)

### Business Card Transaction Logic
**Business vs Personal Classification:**
- **Business Card**: Purchases made with company credit card
- **Personal**: Personal purchases that may include business items
- **Reimbursable**: Personal card purchases for business purposes
- **Mixed**: Orders containing both business and personal items

## Expense Categorization Business Rules

### Primary Categories

#### 1. Property Maintenance
- Repairs and maintenance supplies
- Tools and equipment
- Cleaning and janitorial supplies
- Landscaping and grounds keeping
- HVAC and electrical supplies

#### 2. Guest Amenities
- Welcome supplies and refreshments
- Entertainment and recreation items
- Kitchen and dining supplies
- Bedding and linens
- Bathroom amenities

#### 3. Office and Administrative
- Office supplies and equipment
- Computer and technology items
- Printing and communication supplies
- Software and subscriptions
- Business cards and marketing materials

#### 4. Utilities and Services
- Internet and cable services
- Utility management and supplies
- Professional services
- Insurance and licensing
- Financial and banking services

#### 5. Marketing and Promotion
- Photography and listing improvements
- Advertising and promotion materials
- Website and online presence
- Social media and content creation
- Guest experience enhancements

### Secondary Classifications

#### Location-Specific
- **Freeport**: Marine, coastal, saltwater-related
- **Smithville**: Lake, hiking, freshwater-related
- **General**: Applicable to multiple properties

#### Seasonality
- **Peak Season**: Summer preparation and high-usage items
- **Off-Season**: Maintenance and preparation items
- **Year-Round**: Consistent operational expenses

#### Tax Categories
- **Fully Deductible**: 100% business expenses
- **Partially Deductible**: Mixed business/personal use
- **Capital Expenses**: Equipment and improvements
- **Operating Expenses**: Day-to-day operational costs

## AI Analysis Business Intelligence

### Key Performance Indicators (KPIs)
1. **Expense Efficiency**: Cost per property per month
2. **Category Distribution**: Percentage breakdown by expense type
3. **Seasonal Patterns**: Month-over-month expense variations
4. **Vendor Concentration**: Top vendors and spending patterns
5. **Subscribe & Save Optimization**: Potential savings opportunities

### Business Intelligence Insights
1. **Cost Optimization**: Identify areas for expense reduction
2. **Budget Planning**: Historical patterns for future budgeting
3. **Property Comparison**: Expense efficiency across properties
4. **Vendor Management**: Consolidation and negotiation opportunities
5. **Tax Optimization**: Maximize deductible expenses

### Predictive Analytics Applications
1. **Seasonal Demand**: Predict peak season supply needs
2. **Maintenance Scheduling**: Anticipate maintenance cycles
3. **Budget Forecasting**: Project future expenses
4. **Inventory Management**: Optimize supply ordering
5. **Cash Flow Planning**: Predict expense timing

## Employee Benefits Context

### Business Card Employee Program
**Purpose**: Provide employees with business credit cards for work-related purchases

**Use Cases:**
- Property maintenance supplies
- Emergency repairs and supplies
- Guest amenity restocking
- Office and administrative supplies
- Travel and transportation for property management

**Filtering Requirements:**
- Identify all business card transactions
- Separate from owner/management purchases
- Track employee-specific spending patterns
- Ensure proper categorization and approval

### Reimbursement Management
**Employee Reimbursement Categories:**
- Mileage and transportation
- Meals during property work
- Tools and equipment purchases
- Emergency supply purchases
- Training and certification costs

## Data Quality and Compliance

### Data Accuracy Requirements
- **Financial Accuracy**: All transactions properly categorized
- **Tax Compliance**: Proper documentation for tax reporting
- **Audit Trail**: Complete record of categorization decisions
- **Property Allocation**: Accurate assignment to specific properties

### Compliance Considerations
- **Tax Documentation**: IRS-compliant expense categorization
- **Business Entity**: Proper separation of business and personal
- **Property Management**: Individual property expense tracking
- **Employee Expenses**: Proper documentation and approval

## Growth and Scalability

### Business Expansion Plans
1. **Additional Properties**: System must scale to new properties
2. **Service Expansion**: May add property management for other owners
3. **Geographic Expansion**: Potential expansion beyond Texas
4. **Service Diversification**: Additional hospitality services

### System Scalability Requirements
1. **Multi-Property Support**: Handle growing property portfolio
2. **Enhanced Categorization**: More sophisticated business rules
3. **Integration Capabilities**: Connect with accounting and booking systems
4. **Reporting Enhancement**: Advanced business intelligence and reporting

---

**This domain knowledge ensures the TSV Ledger system continues to serve the specific business needs of Texas Sunset Venues while maintaining scalability for future growth.**
