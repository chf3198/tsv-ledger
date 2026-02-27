# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.4.0] - 2026-02-28

### Added

- **Guest Mode Warnings** (ADR-020): Clear warnings for unauthenticated users
  - Warning modal appears after first data import in guest mode
  - Persistent banner shows when not signed in with data present
  - Modal explains localStorage limitations (device-only, no backup)
  - Sign In and Continue as Guest options
  - Acknowledgement persists until logout

### Fixed

- **Data Persistence Bug**: Logout now properly clears all user data (OWASP compliance)
  - Clears `tsv-expenses` and `tsv-import-history` from localStorage
  - Resets app state (expenses array, totals, counts)
  - Prevents data leakage between users on shared devices

### Security

- **OWASP Compliance**: Clear all localStorage on session end
- **Guest Mode Transparency**: Users clearly informed about data storage limitations

## [3.3.0] - 2026-02-28

### Added

- **Legal Framework**: Comprehensive legal protection for tax-related features
  - Terms of Service with tax advice disclaimer
  - Privacy Policy with localStorage-only data handling
  - Product repositioned as "Amazon Expense Allocation for Tax Prep"
- **GitHub Releases**: Automated versioned releases via `gh release create`

## [3.2.0] - 2026-02-27

### Added

- **OAuth Authentication** (ADR-019, ADR-020): Google and GitHub sign-in
  - Cloudflare Workers API for OAuth flows and session management
  - JWT Bearer tokens for cross-origin authentication
  - Cloudflare Pages with branch preview deployments
- **Profile Avatar Display**: User avatar (24px) shown next to name when authenticated
- **Auth Button E2E Tests**: Comprehensive visibility and contrast tests

### Fixed

- **Auth Button Visibility** (ADR-021): Sign In button now reliably visible on blue header
  - Uses `<span>` instead of `<button>` to avoid Pico CSS conflicts
  - `display: inline-flex` ensures consistent rendering
  - Works correctly after sign-out flow
- OAuth cancellation handling (no error on user cancel)
- Session validation failure now resets auth state properly

### Changed

- Documentation restructured following industry best practices
  - DESIGN.md streamlined (82% smaller)
  - ADR directory with individual decision records
  - README.md updated with current features and structure
  - CHANGELOG.md follows Keep a Changelog 1.1.0

## [3.1.0] - 2026-02-24

### Added

- **Dual-Column Allocation Board** (ADR-016): "Business Supplies" | "Board Member Benefits" layout
  - Independent vertical scrolling per column with sticky headers
  - Split items (partial allocations) appear in both columns with orange border indicator
  - Unified search input filters both columns simultaneously (description + ID)
  - Visible expense IDs (last 8 characters) for easy reference
  - Column totals and item counts in headers
  - Responsive design: dual columns on desktop, single column stack on mobile
- Column-aware slider positioning and tooltips
  - Business column: slider position = businessPercent
  - Benefits column: slider position = 100 - businessPercent
- Comprehensive code documentation comments in js/app.js and css/app.css

### Changed

- Moved search filter from individual column headers to top of allocation view
- Consolidated separate search queries into single `allocationSearchQuery`
- Slider initialization now detects column context via `element.closest('.benefits')`
- Update handler converts slider position to businessPercent based on column

### Fixed

- Slider tooltips displaying incorrect percentages in Benefits column
- Slider visual positions showing identical values instead of inverse split
- Card borders being hidden under sticky column headers
- Search filter height taking unnecessary vertical space

## [3.0.0] - 2026-02-23

### Added

- **noUiSlider Integration** (ADR-015): Professional allocation slider with visual feedback
  - Colored track segments (green for business, blue for benefits)
  - Live tooltips showing percentage while dragging
  - Mobile-optimized touch handling
  - Accessible keyboard navigation
- **Percentage-Based Allocation Interface** (ADR-014): Replaced category dropdown
  - Real-time split display showing Business Supplies $ and Benefits $
  - Computed totals for each category
  - Preset allocation buttons (100%, 75%, 50%, 25%, 0%)

### Changed

- Transformed Expenses view from categorization to allocation interface
- Removed category dropdown, date filters (non-essential complexity)
- Updated all tests to work with allocation sliders

### Fixed

- Storage migration: Uncategorized now defaults to 100% business (was incorrectly mapping to 0%)

## [2.1.0] - 2026-02-13

### Added

- **Import History Timeline** (ADR-013): Complete import audit trail
  - Color-coded cards (green=success, orange=partial duplicates)
  - Empty state with clear action pathway
  - Newest-first ordering
- **Duplicate Detection**: Prevents redundant imports
  - Amazon: OrderID-based detection
  - BOA: date+amount+description hash
  - Duplicate count reporting on partial imports

### Changed

- Strengthened BOA expense IDs: `boa-{date}-{amount}-{desc}` (collision-resistant)
- All imports now default to "Uncategorized" status

### Fixed

- Alpine.js template functions now properly scoped to component
- Test isolation: localStorage.clear() followed by page.reload()

## [2.0.0] - 2026-02-13

### Changed

- **Breaking**: Removed auto-categorization, all imports default to "Uncategorized"
- **Breaking**: Updated terminology
  - "Office Supplies" → "Business Supplies"
  - "Employee Benefits" → "Board Member Benefits"

### Added

- Dashboard "Needs Review" warning card for uncategorized items
- Progressive disclosure UX pattern (defer categorization decision)

### Removed

- Keyword-based auto-categorization from categorizer.js

## [1.0.0] - 2026-02-12

### Added

- Initial release with core functionality
- CSV/DAT import support (Amazon, Bank of America)
- Three-category expense tracking (Business Supplies, Board Member Benefits, Uncategorized)
- localStorage-based persistence
- Alpine.js + Pico CSS frontend
- Playwright E2E test suite
- App shell architecture with responsive navigation
- GitHub Actions CI/CD pipeline
