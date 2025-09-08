# TSV Ledger - Technical Architecture & Implementation Context

> **Technical Implementation Guide for TSV Ledger Business Intelligence Platform**  
> **Technology Stack:** Node.js + Express + Vanilla JavaScript  
> **Architecture:** Modular Monolith with AI-Enhanced Analysis

## System Architecture Overview

### High-Level Architecture
```
Frontend (Vanilla JS)
├── User Interface (HTML/CSS/JS)
├── Real-time Analytics Dashboard
└── Interactive Data Visualization

Backend API (Express.js)
├── REST API Endpoints
├── Business Logic Modules
├── Data Processing Pipeline
└── AI Analysis Engine

Data Layer
├── JSON File Storage
├── CSV Import/Export
├── In-Memory Processing
└── Caching Layer

External Integrations
├── Amazon Order History Import
├── Business Intelligence APIs
└── Future: Accounting System Integration
```

### Core Components

#### 1. Data Processing Engine (`src/database.js`)
**Purpose**: Centralized data operations and persistence management

**Key Responsibilities:**
- JSON file-based data storage and retrieval
- Data validation and integrity checking
- Backup and recovery operations
- Performance optimization for large datasets

**Technical Implementation:**
- Synchronous file operations for data consistency
- Error handling with fallback to empty datasets
- Path management for organized file structure
- Memory-efficient data processing

#### 2. Business Intelligence Engine (`src/tsv-categorizer.js`)
**Purpose**: Advanced categorization and business rule implementation

**Key Capabilities:**
- Property-specific location detection (Freeport/Smithville)
- Subscribe & Save detection with confidence scoring
- Business card transaction identification
- Category classification with business rules
- Premium analytics and insights generation

**Algorithm Highlights:**
- Keyword-based classification with weighted scoring
- Machine learning-style confidence calculations
- Pattern recognition for recurring transactions
- Business rule validation and enforcement

#### 3. AI Analysis Engine (`src/ai-analysis-engine.js`)
**Purpose**: Machine learning-enhanced analysis and predictive capabilities

**Advanced Features:**
- Predictive spending analysis
- Anomaly detection for unusual transactions
- Pattern recognition for optimization opportunities
- Natural language insights generation
- Automated recommendations engine

**Technical Approach:**
- Statistical analysis of historical patterns
- Confidence scoring for predictions
- Multi-dimensional data analysis
- Performance optimization for real-time analysis

## Data Model and Structure

### Core Data Entities

#### Expenditure Object
```javascript
{
  id: "unique-identifier",
  date: "2025-09-08",
  amount: 29.99,
  description: "Office supplies for Freeport property",
  category: "Property Maintenance",
  vendor: "Amazon",
  location: "freeport",
  isBusinessCard: true,
  subscribeAndSave: false,
  confidence: 0.95,
  metadata: {
    originalSource: "amazon-import",
    processingDate: "2025-09-08T10:30:00Z",
    categoryReason: "keyword-match",
    manualReview: false
  }
}
```

#### Amazon Item Object
```javascript
{
  id: "amz-001",
  name: "Bounty Paper Towels Quick Size",
  price: "$24.99",
  orderDate: "2025-08-15",
  category: "Cleaning Supplies",
  vendor: "Amazon",
  isBusinessCard: true,
  subscribeAndSave: true,
  confidence: 0.88,
  location: "general",
  details: {
    shipping: "Free",
    delivery: "2-day",
    orderNumber: "123-4567890-1234567",
    paymentMethod: "Business Card"
  }
}
```

### File Organization Structure
```
data/
├── amazon_order_history.csv      # Raw Amazon import data
├── amazon_item_edits.json        # User modifications to Amazon items
├── expenditures.json             # Main expenditure database
├── stmttab.dat                   # Legacy statement data
└── amazon-test-sample.csv        # Testing data samples
```

## API Architecture

### RESTful Endpoint Design

#### Data Import/Export
- `POST /import` - Amazon CSV import with validation
- `GET /api/data` - Export all expenditure data
- `GET /api/backup` - Create data backup

#### Amazon Order Management
- `GET /api/amazon-items` - Retrieve with filtering
- `GET /api/amazon-items/:id` - Get specific item
- `PUT /api/amazon-items/:id` - Update item details
- `DELETE /api/amazon-items/:id` - Remove item

#### Business Intelligence
- `GET /api/analysis` - Comprehensive BI analysis
- `GET /api/premium-status` - Premium feature availability
- `GET /api/employee-benefits` - Employee expense filtering

#### AI-Enhanced Analysis
- `GET /api/ai-analysis` - AI-powered insights
- `POST /api/ai-categorize` - AI categorization service
- `GET /api/predictions` - Predictive analytics

### Response Format Standards
```javascript
// Success Response
{
  success: true,
  data: { /* response data */ },
  metadata: {
    timestamp: "2025-09-08T10:30:00Z",
    version: "2.2.1",
    requestId: "req-123"
  }
}

// Error Response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Detailed error description",
    details: { /* error specifics */ }
  },
  metadata: {
    timestamp: "2025-09-08T10:30:00Z",
    requestId: "req-123"
  }
}
```

## Frontend Architecture

### Vanilla JavaScript Design Patterns

#### Modular Component Structure
```javascript
// Component Pattern
class AmazonItemEditor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.loadData();
  }
  
  render() {
    // Render component UI
  }
}
```

#### State Management
```javascript
// Simple State Management
const AppState = {
  amazonItems: [],
  currentFilter: null,
  isLoading: false,
  
  updateItems(items) {
    this.amazonItems = items;
    this.notifyComponents();
  },
  
  notifyComponents() {
    // Notify all components of state changes
  }
};
```

### User Interface Components

#### 1. Data Import Interface
- File upload with validation
- Progress indicators for processing
- Error handling and user feedback
- Import summary and statistics

#### 2. Amazon Item Management
- Searchable and filterable item list
- Inline editing capabilities
- Bulk operations for multiple items
- Real-time validation and feedback

#### 3. Analytics Dashboard
- Interactive charts and visualizations
- Real-time data updates
- Drill-down capabilities
- Export functionality

#### 4. Employee Benefits Interface
- Filtering by business card transactions
- Category-based analysis
- Date range selection
- Export capabilities for reimbursement

## Performance Optimization

### Backend Performance
1. **Data Processing Efficiency**
   - Stream processing for large CSV files
   - Memory-efficient data structures
   - Caching for frequently accessed data
   - Lazy loading for expensive operations

2. **API Response Optimization**
   - Response compression
   - Pagination for large datasets
   - Selective field loading
   - Efficient filtering algorithms

### Frontend Performance
1. **Loading Optimization**
   - Progressive loading for large datasets
   - Virtual scrolling for large lists
   - Debounced search and filtering
   - Cached API responses

2. **User Experience**
   - Loading indicators and progress bars
   - Optimistic updates for fast feedback
   - Error boundaries for graceful failures
   - Keyboard shortcuts for power users

## Testing Strategy

### Backend Testing
```javascript
// Unit Test Example
describe('TSVCategorizer', () => {
  it('should categorize Freeport marine supplies correctly', () => {
    const categorizer = new TSVCategorizer();
    const result = categorizer.categorize({
      name: "Marine boat dock supplies",
      vendor: "Amazon"
    });
    
    expect(result.location).toBe('freeport');
    expect(result.category).toBe('Property Maintenance');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

### Frontend Testing
```javascript
// Component Test Example
describe('AmazonItemEditor', () => {
  it('should save edited item successfully', async () => {
    const editor = new AmazonItemEditor('test-container');
    const mockItem = { id: 'test', name: 'Test Item' };
    
    editor.loadItem(mockItem);
    editor.updateField('name', 'Updated Name');
    
    const result = await editor.save();
    expect(result.success).toBe(true);
  });
});
```

### Integration Testing
- End-to-end workflow testing
- API endpoint validation
- Data import/export verification
- Cross-browser compatibility testing

## Security Considerations

### Data Protection
1. **Input Validation**
   - CSV import validation and sanitization
   - API parameter validation
   - File type and size restrictions
   - SQL injection prevention (though using JSON storage)

2. **Access Control**
   - Currently local development only
   - Future: authentication and authorization
   - Rate limiting for API endpoints
   - Audit logging for sensitive operations

### Production Deployment Considerations
1. **Environment Security**
   - Environment variable management
   - Secure configuration handling
   - HTTPS enforcement
   - CORS configuration

2. **Data Security**
   - Encryption at rest for sensitive data
   - Secure backup procedures
   - Data retention policies
   - Privacy compliance (GDPR, CCPA)

## Deployment Architecture

### Current Development Setup
```bash
# Local Development
npm run dev          # Start with nodemon
npm test            # Run test suite
npm run test-amazon # Test Amazon features
```

### Production Deployment (Future)
```bash
# Production Build
npm run build       # Build optimized version
npm start          # Start production server
npm run monitor    # Health monitoring
```

### Infrastructure Requirements
- **Server**: Node.js 22.19.0+ runtime
- **Storage**: File system for JSON/CSV data
- **Memory**: 512MB minimum, 2GB recommended
- **Network**: HTTPS with SSL certificate
- **Monitoring**: Application and server monitoring

## Monitoring and Observability

### Application Metrics
- API response times and error rates
- Data processing performance
- User interaction patterns
- System resource utilization

### Business Metrics
- Import success rates
- Categorization accuracy
- User engagement with features
- Data quality metrics

### Logging Strategy
```javascript
// Structured Logging Example
logger.info('Amazon import started', {
  userId: 'user-123',
  fileName: 'orders.csv',
  fileSize: 1024576,
  timestamp: new Date().toISOString()
});
```

## Future Technical Roadmap

### Short-term Enhancements (3-6 months)
1. **Database Migration**: Move from JSON to proper database
2. **Authentication**: Implement user authentication system
3. **API Versioning**: Version API endpoints for backward compatibility
4. **Enhanced Testing**: Increase test coverage to 95%+

### Medium-term Features (6-12 months)
1. **Real-time Analytics**: WebSocket-based real-time updates
2. **Mobile Interface**: Responsive design for mobile devices
3. **Integration APIs**: Connect with QuickBooks/accounting systems
4. **Advanced AI**: Machine learning model deployment

### Long-term Vision (1-2 years)
1. **Multi-tenant**: Support multiple property management companies
2. **Advanced Analytics**: Predictive analytics and forecasting
3. **Workflow Automation**: Automated expense processing
4. **Enterprise Features**: Advanced reporting and compliance tools

---

**This technical architecture documentation ensures any developer can understand, maintain, and extend the TSV Ledger system effectively.**
