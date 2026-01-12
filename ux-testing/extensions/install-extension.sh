#!/bin/bash

# Chrome Extension Installation Script for TSV Ledger UX Testing
# This script helps install the extension in ChromeOS

echo "TSV Ledger UX Testing Extension Installer"
echo "=========================================="
echo ""

# Create extension directory in ChromeOS mount if accessible
if [ -d "/mnt/chromeos/MyFiles" ]; then
    echo "ChromeOS mount detected. Copying extension to Downloads..."
    cp -r chrome-extension "/mnt/chromeos/MyFiles/Downloads/"
    echo "Extension copied to: /mnt/chromeos/MyFiles/Downloads/chrome-extension"
    echo ""
    echo "INSTALLATION INSTRUCTIONS:"
    echo "1. Open Chrome browser"
    echo "2. Go to chrome://extensions/"
    echo "3. Enable 'Developer mode' (toggle in top-right)"
    echo "4. Click 'Load unpacked'"
    echo "5. Navigate to: Downloads > chrome-extension"
    echo "6. Select the chrome-extension folder"
    echo "7. The extension should now be installed"
    echo ""
    echo "NOTE: You will need to replace 'EXTENSION_ID' in the native host manifest"
    echo "with the actual extension ID shown in chrome://extensions/"
else
    echo "ChromeOS mount not accessible. Manual installation required."
    echo ""
    echo "MANUAL INSTALLATION:"
    echo "1. Copy the chrome-extension folder to your ChromeOS Downloads"
    echo "2. Open Chrome and go to chrome://extensions/"
    echo "3. Enable Developer mode"
    echo "4. Load unpacked extension from Downloads/chrome-extension"
    echo "5. Note the extension ID and update the native host manifest"
fi

echo ""
echo "After installation, start the native host:"
echo "node native-host.js"

echo ""
echo "Then use the extension popup to control UX testing!"