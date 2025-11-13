# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.3] - 2025-11-12

### Added
- **AI-Optimized Modular Architecture**: Complete codebase refactoring for optimal AI development
  - Reduced `server.js` from 2,555 lines to 165 lines (93% reduction)
  - Created 7 focused route modules in `src/routes/` for better maintainability
  - Implemented 250-line file size limit for optimal AI processing
  - Added comprehensive `AGENTS.md` documentation for AI development guidance

### Added
- **Modular Route System**: Organized API endpoints into domain-specific modules
  - `routes/import.js` - Data import operations (CSV, ZIP)
  - `routes/data.js` - Basic CRUD operations and menu
  - `routes/analytics.js` - Premium analytics & AI analysis
  - `routes/amazon.js` - Amazon-specific operations
  - `routes/employee-benefits.js` - Benefits filtering & analysis
  - `routes/subscription.js` - Subscription tracking
  - `routes/geographic.js` - Geographic analysis

### Changed
- **Knowledge Transfer System**: Updated all documentation for new modular architecture
  - Updated `API_DOCUMENTATION.md` with new route endpoints
  - Enhanced `HANDOFF_GUIDE.md` with modular architecture details
  - Added AI development guidelines to `CodeOrganizationFramework.md`
  - Updated `TechnicalArchitecture.md` to reflect new structure

### Changed
- **Documentation Standards**: Implemented comprehensive AI-assisted development standards
  - File size optimization guidelines (< 250 lines per file)
  - Modular architecture patterns and best practices
  - Enhanced JSDoc documentation across all modules
  - Consistent error handling and response patterns

## [Unreleased]

### Fixed
- **Benefits Allocation UI Bug**: Fixed items with 0% allocation appearing in wrong columns
  - Root cause: `EmployeeBenefitsManager.updateModalDisplay()` was showing ALL items in business column regardless of allocation
  - Solution: Modified filtering logic to only display items in columns where they have >0% allocation
  - Removed redundant client-side cleanup script from server.js as manager now handles filtering correctly
  - Items now correctly appear only in Benefits column when allocated 100% to benefits (0% business)
  - Items now correctly appear only in Business Supplies column when allocated 100% to business (0% benefits)

### Changed
- **Navigation Positioning**: Fixed sidebar overlap with navbar using Shoelace drawer CSS positioning
  - Desktop sidebar now positioned below 60px navbar with `top: 60px` and `height: calc(100vh - 60px)`
  - Added 80px top padding to main content to prevent overlap with fixed navbar
  - Implemented click-outside collapse functionality for desktop sidebar
  - Ensured consistent behavior across all viewport sizes (375px to 1440px+)
  - Added comprehensive CSS documentation for Shadow DOM positioning overrides

### Changed
- **Navigation Architecture**: Migrated to Shoelace-based navigation with deterministic state management
- **Test Cleanup**: Removed temporary navigation test artifacts and consolidated test suite

### Technical
- Added `public/js/shoelace-navigation.js` for navigation rendering and state management
- Enhanced CSS with detailed comments explaining positioning logic for future maintenance
- Updated responsive design to handle Shadow DOM component positioning