# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
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