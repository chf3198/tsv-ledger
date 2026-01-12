# UX Testing Directory

**Purpose:** Organized storage for all UX testing, browser automation, and visual testing artifacts.

## Directory Structure

```
ux-testing/
├── browser-tests/          # Browser automation scripts and test runners
│   ├── ux-testing-demo.js              # Main UX testing demonstration
│   ├── ux-web-controller.js            # Web-based UX testing controller
│   ├── comprehensive-browser-test.js   # Comprehensive browser testing suite
│   ├── comprehensive-testing-demo.js   # Testing demonstration scripts
│   ├── live-browser-testing.js         # Live browser testing utilities
│   ├── focused-nav-test.js             # Navigation-focused testing
│   ├── highly-visible-test.js          # High-visibility testing scripts
│   ├── manual-visibility-test.js       # Manual visibility testing
│   ├── test-external-browser.sh         # External browser testing script
│   ├── test-hamburger-selenium.js       # Hamburger menu selenium tests
│   └── visible-test-*.png               # Test result screenshots
├── screenshots/            # All UX testing screenshots
│   ├── *-screenshot.png                # General screenshots
│   ├── *-test-*.png                    # Test-specific screenshots
│   ├── ux-demo-*.png                   # UX demo screenshots
│   ├── dashboard-initial.png            # Dashboard initial state
│   ├── manual-entry-filled.png          # Manual entry screenshots
│   └── testing-complete.png             # Completion screenshots
├── videos/                 # UX testing video recordings
│   └── ux-demo-videos/                 # Demo video files
└── extensions/             # Browser extensions for testing
    ├── chrome-extension/               # Chrome extension files
    ├── native-host.js                  # Native messaging host
    ├── com.tsvledger.uxtesting.json     # Extension manifest
    └── install-extension.sh             # Extension installation script
```

## Usage

### Running UX Tests

```bash
# Web-based controller
node ux-testing/browser-tests/ux-web-controller.js

# Comprehensive testing
node ux-testing/browser-tests/comprehensive-browser-test.js

# External browser testing
./ux-testing/browser-tests/test-external-browser.sh
```

### Installing Chrome Extension

```bash
./ux-testing/extensions/install-extension.sh
```

## File Organization Best Practices

- **Browser Tests:** All automation scripts in `browser-tests/`
- **Visual Evidence:** Screenshots in `screenshots/`, videos in `videos/`
- **Extensions:** Browser extensions and native hosts in `extensions/`
- **No Root Clutter:** Never place testing files directly in repository root

## Maintenance

- Clean up old screenshots/videos regularly
- Update this README when adding new test categories
- Keep file sizes under 300 lines (modularize if larger)</content>
  <parameter name="filePath">/home/curtisfranks/tsv-ledger/ux-testing/README.md
