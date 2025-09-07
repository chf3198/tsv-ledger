# TSV Ledger - AI Assistant Context File

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

### 🔄 Continuous Improvement Cycle
- **Read AI_CONTEXT.md first** when starting any new session
- **Update AI_CONTEXT.md immediately** after implementing features
- **Commit changes** with documentation updates included
- **Verify completeness** before session end

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
4. **Code Simplicity**: Write clear, simple code that requires minimal context to understand
5. **AI Integration**: Design code to be AI-friendly with comprehensive comments
6. **Automation**: Look for opportunities to automate development and operational tasks

### Implementation Principles
- **Modular Design**: Keep components simple and loosely coupled
- **Clear Documentation**: Every function, class, and complex logic must be well-commented
- **Consistent Patterns**: Use consistent coding patterns for predictability
- **Minimal Dependencies**: Only add dependencies when absolutely necessary
- **Testability**: Write code that can be easily tested and maintained

### Research and Learning
- **Online Research**: Regularly check for new tools, libraries, and best practices
- **Open Source Utilization**: Leverage existing open-source solutions
- **Community Resources**: Use free documentation, tutorials, and community support
- **Technology Evaluation**: Continuously evaluate new free tools and services

---

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

3. **CSV Import Functionality** ⭐ NEW
   - File upload interface for CSV files
   - CSV parsing with csv-parser library
   - Automatic mapping of common CSV column names
   - Error handling for malformed data
   - Bulk import with progress feedback
   - API endpoint: POST /api/import-csv

4. **Project Infrastructure**
   - Git repository initialized with proper commits
   - Comprehensive .gitignore
   - Detailed README.md with API docs
   - Package.json with dependencies
   - Self-documenting code with comments

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
