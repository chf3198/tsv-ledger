# TSV Ledger Project-Specific Knowledge

> **Complete Domain Knowledge and Implementation Context for Texas Sunset Venues Ledger**

This directory contains all project-specific knowledge, context, and implementation details for the TSV Ledger business intelligence platform. This information is essential for understanding the business domain, technical implementation, and operational context.

## Contents

### 🎯 HANDOFF_GUIDE.md
**Complete project handoff documentation**
- Comprehensive project overview and current status
- Architecture and design philosophy
- Development workflow and best practices
- Current feature status and next priorities
- Complete knowledge transfer checklist

**Critical for:**
- New team members joining the project
- Project handoffs to new development teams
- AI assistants taking over development
- Understanding complete project context

### 🏢 BusinessDomainKnowledge.md
**Texas Sunset Venues business context and domain rules**
- Company overview and business model
- Property portfolio details (Freeport/Smithville)
- Expense categorization business rules
- Subscribe & Save business logic
- Employee benefits and reimbursement context

**Essential for:**
- Understanding business requirements
- Making informed feature decisions
- Proper expense categorization logic
- Business intelligence algorithm design

### 🏗️ TechnicalArchitecture.md
**Complete technical implementation details**
- System architecture and component design
- Data models and API structure
- Frontend architecture patterns
- Performance optimization strategies
- Security considerations and deployment

**Required for:**
- Technical implementation decisions
- System maintenance and enhancement
- Performance optimization
- Architecture evolution planning

### 📡 API_DOCUMENTATION.md
**Complete REST API reference**
- All endpoint documentation with examples
- Request/response formats and schemas
- Error handling and status codes
- Authentication and authorization details
- Testing and integration guidelines

**Needed for:**
- Frontend development and integration
- Third-party integrations
- API testing and validation
- Client application development

### 🔄 GIT_WORKFLOW.md
**TSV Ledger specific git practices**
- Project-specific commit conventions
- Branch strategy and release process
- Version history and changelog practices
- Collaboration workflow
- Emergency procedures and rollback

**Important for:**
- Maintaining consistent development practices
- Release management and versioning
- Team collaboration and code review
- Version control best practices

## Knowledge Transfer Priority

### Phase 1: Business Understanding (First Priority)
1. **BusinessDomainKnowledge.md** - Understand the business context
2. **HANDOFF_GUIDE.md** - Get complete project overview
3. Review current features and business requirements

### Phase 2: Technical Implementation (Second Priority)
1. **TechnicalArchitecture.md** - Understand system design
2. **API_DOCUMENTATION.md** - Learn API structure and usage
3. Set up development environment and run tests

### Phase 3: Development Workflow (Third Priority)
1. **GIT_WORKFLOW.md** - Learn project-specific practices
2. Practice making changes following workflow
3. Understand release and deployment process

## Business Context Summary

### Company: Texas Sunset Venues
- **Industry**: Vacation rental property management
- **Properties**: Beach (Freeport) and Lake (Smithville) locations
- **Focus**: Business intelligence for expense tracking and optimization

### Key Business Challenges
1. **Multi-property expense allocation**
2. **Business vs personal transaction separation**
3. **Amazon purchase optimization (Subscribe & Save)**
4. **Employee expense management and reimbursement**
5. **Tax compliance and categorization**

## Technical Stack Summary

### Backend
- **Runtime**: Node.js 22.19.0
- **Framework**: Express.js
- **Data Storage**: JSON files with CSV import
- **Architecture**: Modular monolith with AI enhancements

### Frontend  
- **Technology**: Vanilla JavaScript (ES6+)
- **Architecture**: Component-based with state management
- **UI**: Responsive HTML/CSS with interactive features

### Key Features
- **Amazon Integration**: Full CRUD operations for Amazon orders
- **AI Analysis**: Machine learning-enhanced categorization
- **Business Intelligence**: Advanced analytics and reporting
- **Testing Framework**: Comprehensive test suite (20+ files)

## Current Project Status

### ✅ Completed Features
- Complete codebase organization (8 professional directories)
- Amazon order import and editing functionality
- AI-powered expense categorization
- Premium business intelligence features
- Employee benefits filtering
- Comprehensive testing framework
- Complete documentation suite

### 🎯 Next Priorities
1. Database migration from JSON to proper database
2. User authentication and authorization
3. Real-time analytics dashboard
4. Mobile-responsive interface
5. Advanced AI/ML capabilities

## Development Workflow

### Getting Started
```bash
# Clone and setup
git clone [repository]
cd tsv-ledger
npm install

# Start development
npm run dev

# Run tests
npm test
npm run test-amazon
```

### Making Changes
1. Follow conventional commit format
2. Update tests for new features
3. Update documentation for changes
4. Run full test suite before committing
5. Follow project-specific git workflow

## Knowledge Validation Checklist

### Business Understanding ✅
- [ ] Understand Texas Sunset Venues business model
- [ ] Know the difference between Freeport and Smithville properties
- [ ] Understand Subscribe & Save business value
- [ ] Know employee benefits and business card logic

### Technical Proficiency ✅
- [ ] Can set up development environment
- [ ] Understand modular architecture design
- [ ] Can run and interpret test results
- [ ] Know API endpoints and their purposes

### Operational Knowledge ✅
- [ ] Understand git workflow and commit conventions
- [ ] Can make changes following project standards
- [ ] Know how to update documentation
- [ ] Understand release and deployment process

## Maintenance and Updates

### When to Update This Documentation
- Business requirements change
- New features are added
- Architecture decisions are made
- Processes are refined
- Team practices evolve

### How to Keep Current
- Review documentation during code reviews
- Update during feature development
- Quarterly comprehensive review
- Gather feedback from documentation users

## Integration with Generic Patterns

This project-specific knowledge builds upon the generic patterns in the `../Generic/` directory:

- **CodeOrganizationFramework** → Applied to create TSV Ledger's 8-directory structure
- **GitWorkflowPatterns** → Customized for TSV Ledger's development workflow  
- **DocumentationFramework** → Implemented for comprehensive TSV Ledger documentation

---

**This project-specific knowledge ensures complete context transfer for effective TSV Ledger development and maintenance.**
