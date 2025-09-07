# TSV Ledger - AI Assistant C   - Update README.md for any API changes or new features
   - Maintain consistent code patterns for future AI comprehension

## 🤖 Handoff to Claude Sonnet 3 - Optimized Knowledge Transfer

**Welcome, Claude Sonnet 3!** This section is specifically prepared for you to ensure a seamless transition from Grok (xAI) to continue development on the TSV Ledger project.

### 🎯 Your Starting Point
1. **Read this entire AI_CONTEXT.md file first** - It contains complete project context
2. **Review the latest git commit**: `40e14b2` includes the Amazon order history CSV export
3. **Key files to examine**:
   - `amazon_order_history.csv` - Fresh Amazon data export (just committed)
   - `server.js` - Main application with CSV import functionality
   - `database.js` - JSON file storage system
   - `public/index.html` - Frontend interface
   - `README.md` - Quick setup and API reference

### 🚀 Immediate Priorities for You
1. **Test Amazon CSV Import**: Use the new `amazon_order_history.csv` file to test the CSV import endpoint
2. **Validate Data Mapping**: Ensure the parser correctly handles Amazon's CSV format
3. **Complete Data Integration**: Merge Amazon data with existing Bank of America data
4. **Add Visualizations**: Implement charts for expenditure analysis

### 💡 Claude-Specific Optimization Notes
- **Your Strengths**: Leverage your excellent coding, analysis, and structured reasoning capabilities
- **Safety Focus**: The project emphasizes ethical, internal-use development - align with your safety guidelines
- **Large Context Window**: Feel free to reference the full documentation without truncation concerns
- **Documentation Style**: This project uses clear, hierarchical structures that work well with your response style

### 📊 Current Project Metrics
- **Total Commits**: 10+ with detailed messages
- **Lines of Code**: ~550+ across all files
- **Data Sources**: Bank of America (tested), Amazon (exported, ready for import)
- **Tech Stack**: Node.js, Express, Bootstrap 5, csv-parser
- **Last Update**: September 6, 2025 - Amazon data export completed

**You're all set to continue where Grok left off!** The project is fully documented and ready for your expertise in coding and analysis.

## � Next Development Prioritiesxt File

## ⚠️ CRITICAL: Documentation Maintenance Protocol

**FIRST PRIORITY FOR ANY NEW AI ASSISTANT:**

This project is designed for seamless AI-to-AI handoffs. Your primary responsibility is to maintain and continuously update this `AI_CONTEXT.md` file as the project evolves. This ensures that future AI assistants can pick up exactly where you left off without any knowledge gaps.

### 📝 Documentation Update Requirements
1. **Update AI_CONTEXT.md After Every Major Change**
   - Add new features to the "Completed Features" section
   - Update "Next Development Priorities" as tasks are completed
   - Document any technical decisions or architecture changes
   - Include new API endpoints, data structures, or file changes

2. **Git Commit Best Practices**
   - Use descriptive commit messages that explain what changed and why
   - Commit frequently with small, logical changes
   - Always update documentation before committing code changes
   - Include "AI_CONTEXT.md" updates in commit messages

3. **Knowledge Transfer Protocol**
   - Before ending any session, ensure AI_CONTEXT.md reflects the current state
   - Document any unresolved issues, pending decisions, or blockers
   - Include setup instructions for any new dependencies or tools
   - Note any environmental requirements or configuration changes

4. **Self-Documenting Code Standards**
   - Add comments to complex logic explaining the "why" not just the "what"
   - Update README.md for any API changes or new features
   - Maintain consistent code patterns for future AI comprehension

## � Next Development Priorities

### Immediate Next Steps (Priority Order)
1. **Complete Amazon Data Import** ⭐ CRITICAL
   - ✅ Amazon Order History Reporter extension has finished scraping
   - ✅ CSV file exported and committed to git (amazon_order_history.csv)
   - Test import into TSV Ledger using existing CSV import functionality
   - Validate data mapping and handle any format discrepancies

2. **Data Integration Testing**
   - Test Bank of America DAT file import (stmttab.dat available)
   - Test Amazon CSV import with the new data file
   - Verify automatic column mapping works for both data sources
   - Add data validation and duplicate detection

3. **UI/UX Improvements**
   - Add data visualization charts (expenditure by category, monthly trends)
   - Improve file upload interface with drag-and-drop
   - Add progress indicators for large file imports
   - Implement data filtering and search functionality
   - Add progress indicators for large file imports
   - Implement data filtering and search functionality

4. **Advanced Features**
   - Recurring subscription detection and tracking
   - Email receipt parsing automation
   - Export functionality for reports
   - Data backup and restore capabilities

### 🔧 Technical Debt & Improvements
- Consider migrating from JSON file storage to SQLite for better performance
- Add comprehensive error handling and user feedback
- Implement data validation rules
- Add unit tests for parsing functions
- Optimize CSV parsing for large files

### 📊 Current Project Metrics
- **Lines of Code**: ~500+ lines across all files
- **API Endpoints**: 3 functional (GET expenditures, POST expenditure, POST import-csv)
- **Data Sources**: Bank of America (tested), Amazon (extension installed, awaiting data)
- **File Formats Supported**: CSV, TSV, DAT, TXT with automatic delimiter detection
- **Git Commits**: 8+ commits with comprehensive documentation

### 🎯 Success Criteria Met
- ✅ Web application successfully tracks expenditures
- ✅ Manual entry system functional
- ✅ CSV import system handles multiple formats
- ✅ Bank of America integration ready
- ✅ Amazon integration extension installed
- ✅ Documentation optimized for AI handoffs
- ✅ Git repository properly maintained

### 📝 Session Summary for Future AI Assistants

**Current State**: TSV Ledger is a fully functional expense tracking web application with:
- Node.js/Express backend serving on port 3000
- Bootstrap 5 responsive frontend
- JSON file-based data storage
- Multi-format CSV import (CSV, TSV, DAT, TXT)
- Bank of America DAT file support tested and working
- Amazon Order History Reporter extension installed and running
- Comprehensive documentation in AI_CONTEXT.md, README.md, and AMAZON_RESEARCH.md

**Immediate Action Required**: Complete Amazon data export using the installed extension, then test CSV import functionality.

**All code is committed to git with detailed commit messages. Future AI assistants should read AI_CONTEXT.md first for complete project context.**

## 🎯 Project Guidelines and Principles

### Core Development Philosophy
- **AI-First Approach**: Leverage AI assistance extensively throughout development
- **Future-Proofing**: Design with extensibility and AI compatibility in mind
- **Automation Priority**: Automate repetitive tasks and processes wherever possible
- **Free/Open Source Focus**: Utilize free tools, services, and open-source libraries
- **Research-Driven**: Conduct online research to avoid reinventing solutions
- **Simplicity First**: Keep code simple, organized, and easily comprehensible

### Development Guidelines
1. **Licensing**: Internal use only - no licensing requirements
2. **Tool Selection**: Prefer free/open-source tools and services
3. **Research Protocol**: Always research existing solutions before implementing
4. **Code Simplicity**: Write clear code requiring minimal context to understand
5. **AI Integration**: Design AI-friendly code with comprehensive comments
6. **Automation**: Look for automation opportunities in development and operations

### Implementation Principles
- **Modular Design**: Simple, loosely coupled components
- **Clear Documentation**: Well-commented functions and logic
- **Consistent Patterns**: Predictable coding patterns
- **Minimal Dependencies**: Only add when absolutely necessary
- **Testability**: Easily testable and maintainable code

### Research and Learning
- **Online Research**: Regularly check for new tools and best practices
- **Open Source Utilization**: Leverage existing solutions
- **Community Resources**: Use free documentation and support
- **Technology Evaluation**: Continuously evaluate new free tools and services

---

## Project Overview
**TSV Ledger** is a web application for tracking and analyzing expenditures for Texas Sunset Venues (texassunsetvenues.com). The goal is to automate data gathering where possible while providing manual entry capabilities.

**Date Created**: September 6, 2025
**Current Status**: MVP with manual entry, CSV import, and Bank of America integration ready
**Tech Stack**: Node.js + Express backend, Bootstrap 5 frontend, JSON file storage

## Core Objectives
- Build a web app to track expenditures
- Automate data gathering (email parsing, CSV import, recurring subscriptions)
- Provide dashboard, manual entry, CSV import, reports, and export functionality
- Internal use only (no license required)
- Optimize documentation and code for future AI assistants

## Project Overview
**TSV Ledger** is a web application for tracking and analyzing expenditures for Texas Sunset Venues (texassunsetvenues.com). The goal is to automate data gathering where possible while providing manual entry capabilities.

**Date Created**: September 6, 2025
**Current Status**: MVP functional with manual entry
**Tech Stack**: Node.js + Express backend, Bootstrap 5 frontend, JSON file storage

## Core Objectives
- Build a web app to track expenditures
- Automate data gathering (email parsing, CSV import, recurring subscriptions)
- Provide dashboard, manual entry, CSV import, reports, and export functionality
- Internal use only (no license required)
- Optimize documentation and code for future AI assistants

## Current Implementation Status

### ✅ Completed Features
1. **Basic Web App Structure**
   - Node.js Express server (server.js)
   - Bootstrap 5 responsive frontend (public/index.html)
   - Client-side JavaScript (public/js/app.js)
   - JSON file-based data storage (database.js)

2. **Manual Entry System**
   - Form for adding expenditures (date, amount, category, description)
   - Categories: Tool Subscriptions, Maintenance Payments, Supplies Restocking
   - Real-time list display of expenditures
   - API endpoints: GET/POST /api/expenditures

3. **Bank Data Import Functionality** ⭐ NEW
   - File upload interface for CSV, DAT, TSV, and TXT files
   - CSV/TSV parser with csv-parser library supporting multiple delimiters
   - Automatic delimiter detection (comma, tab, pipe)
   - Support for Bank of America DAT files (tab-delimited)
   - Automatic mapping of common bank data column names
   - Error handling for malformed data
   - Bulk import with progress feedback
   - API endpoint: POST /api/import-csv

4. **Bank of America Integration** ⭐ NEW
   - **Download Formats Available**: Web Connect, Excel, Spreadsheet (tab/space delimiters)
   - **Recommended Format**: Spreadsheet with tab delimiters (DAT format)
   - **Business Account**: Texas Sunset Venues business account
   - **Compatibility**: Tab-delimited DAT format perfectly matches parser requirements
   - **Testing Status**: Ready for Bank of America DAT file import testing

5. **Amazon Order History Research & Extension Setup** ⭐ NEW
   - **Research Completed**: Comprehensive analysis of Amazon data export options
   - **Extension Installed**: Amazon Order History Reporter Chrome extension
   - **Data Format Prepared**: TSV format compatibility confirmed for import
   - **Integration Ready**: CSV import system prepared for Amazon data
   - **Documentation**: AMAZON_RESEARCH.md created with expected data formats

6. **Project Infrastructure**
   - Git repository initialized with proper commits
   - Comprehensive .gitignore
   - Detailed README.md with API docs
   - Package.json with dependencies
   - Self-documenting code with comments
   - AI_CONTEXT.md for seamless AI handoffs

### 🔄 Current Architecture
```
tsv-ledger/
├── server.js              # Express server (port 3000)
├── database.js            # JSON file operations
├── expenditures.json      # Data storage (auto-created)
├── package.json           # Dependencies: express
├── .gitignore             # Node.js ignores
├── README.md              # Full documentation
└── public/
    ├── index.html         # Dashboard with Bootstrap UI
    └── js/app.js          # Frontend JavaScript
```

### 🚀 API Endpoints
- `GET /api/expenditures` - Retrieve all expenditures
- `POST /api/expenditures` - Add new expenditure
- `GET /` - Serve main dashboard

## Next Development Priorities

### High Priority
1. **CSV Import Functionality**
   - File upload endpoint
   - CSV parsing for bank/credit card statements
   - Data validation and mapping
   - Bulk import with error handling

2. **Reports and Analytics**
   - Summary dashboard with totals by category
   - Date range filtering
   - Export to CSV functionality
   - Basic charts/visualizations

### Medium Priority
3. **Data Storage Upgrade**
   - Migrate from JSON to SQLite database
   - Add data validation
   - Implement proper error handling
   - Add backup/restore functionality

4. **Enhanced UI/UX**
   - Edit/delete expenditure functionality
   - Search and filter capabilities
   - Better mobile responsiveness
   - Loading states and user feedback

### Future Features
5. **Automation Features**
   - Email parsing for receipts
   - Recurring subscription detection
   - Automatic categorization
   - Integration with financial APIs

## Technical Decisions Made
- **Storage**: Started with JSON for simplicity, plan to upgrade to SQLite
- **Frontend**: Bootstrap 5 for rapid development and consistency
- **Backend**: Express.js for lightweight API
- **Version Control**: Git with descriptive commits
- **Documentation**: Comprehensive README and inline code comments

## Current Data Structure
```json
{
  "id": 1,
  "date": "2025-09-06",
  "amount": 99.99,
  "category": "tool subscriptions",
  "description": "Adobe Creative Cloud subscription"
}
```

## Setup Instructions
1. Navigate to project directory: `cd /mnt/chromeos/removable/Drive/repos/tsv-ledger`
2. Install dependencies: `npm install`
3. Start server: `npm start`
4. Access app: http://localhost:3000

## Development Guidelines
- Use descriptive commit messages
- Add comments for complex logic
- Update README.md for API changes
- Test functionality before committing
- Keep code modular and well-documented

## Pending Decisions
- Database choice (JSON vs SQLite vs PostgreSQL)
- Authentication requirements (currently internal only)
- Deployment strategy
- Backup and data retention policies

## Key Files to Review
- `README.md` - Complete project documentation
- `server.js` - Main application logic
- `database.js` - Data operations
- `public/index.html` - Frontend structure
- `public/js/app.js` - Frontend interactions

## Git Status
- Repository: Initialized and committed
- Branch: master
- Last commit: Initial setup of TSV Ledger MVP
- Working tree: Clean

This context file provides everything needed to continue development seamlessly. Focus on CSV import and reports for the next iteration of the MVP.
