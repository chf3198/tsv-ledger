#!/bin/bash
# sync-protocols.sh - Protocol Synchronization Script
# Automatically checks for and applies protocol updates

set -e

PROTOCOLS_REPO="../KnowledgeTransferProtocols"
CURRENT_VERSION_FILE="BestPractices/.protocol-version"
BACKUP_DIR="BestPractices.backup"

echo "🔄 TSV Ledger Protocol Synchronization"
echo "======================================"

# Check if protocol repository exists
if [ ! -d "$PROTOCOLS_REPO" ]; then
    echo "❌ Protocol repository not found at $PROTOCOLS_REPO"
    echo "Please ensure KnowledgeTransferProtocols repository is available"
    exit 1
fi

# Get current and latest versions
CURRENT_VERSION=""
if [ -f "$CURRENT_VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$CURRENT_VERSION_FILE")
    echo "📍 Current protocol version: $CURRENT_VERSION"
else
    echo "⚠️  No protocol version file found, assuming initial setup"
    CURRENT_VERSION="0.0"
fi

# Get latest version from protocol repository
cd "$PROTOCOLS_REPO"
LATEST_VERSION=$(git describe --tags --abbrev=0 | sed 's/v//')
cd - > /dev/null

echo "🆕 Latest protocol version: $LATEST_VERSION"

# Check if update is needed
if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ]; then
    echo "✅ Protocols are up to date"
    exit 0
fi

echo "📥 Protocol update available: $CURRENT_VERSION → $LATEST_VERSION"

# Create backup
if [ -d "BestPractices" ]; then
    echo "💾 Creating backup..."
    cp -r BestPractices "$BACKUP_DIR"
    echo "✅ Backup created at $BACKUP_DIR"
fi

# Update Generic protocols (framework-agnostic)
echo "🔄 Updating Generic protocols..."
cp -r "$PROTOCOLS_REPO/Core/v$LATEST_VERSION/Generic"/* BestPractices/Generic/ 2>/dev/null || {
    echo "⚠️  Generic protocols directory not found, copying from latest available"
    LATEST_GENERIC=$(find "$PROTOCOLS_REPO/Core" -name "Generic" -type d | sort -V | tail -1)
    if [ -n "$LATEST_GENERIC" ]; then
        cp -r "$LATEST_GENERIC"/* BestPractices/Generic/
    fi
}

# Preserve project-specific customizations
echo "🔒 Preserving project-specific customizations..."
# ProjectSpecific directory should remain unchanged as it contains TSV Ledger customizations

# Update protocol version
echo "$LATEST_VERSION" > "$CURRENT_VERSION_FILE"

# Validate the update
echo "🔍 Validating protocol update..."
if [ -f "scripts/validate-protocols.sh" ]; then
    if ./scripts/validate-protocols.sh; then
        echo "✅ Protocol validation successful"
        
        # Clean up backup on success
        rm -rf "$BACKUP_DIR"
        
        # Commit the update
        git add BestPractices/
        git commit -m "chore: update knowledge transfer protocols to v$LATEST_VERSION

- Updated Generic protocols to latest version
- Preserved TSV Ledger specific customizations
- Validated protocol implementation

Previous version: v$CURRENT_VERSION
New version: v$LATEST_VERSION"
        
        echo "🎉 Protocol update completed successfully!"
        echo "📋 Summary:"
        echo "   • Updated from v$CURRENT_VERSION to v$LATEST_VERSION"
        echo "   • Generic protocols updated"
        echo "   • Project customizations preserved"
        echo "   • Changes committed to git"
        
    else
        echo "❌ Protocol validation failed, rolling back..."
        rm -rf BestPractices
        mv "$BACKUP_DIR" BestPractices
        echo "🔄 Rollback completed, previous version restored"
        exit 1
    fi
else
    echo "⚠️  No validation script found, skipping validation"
    echo "✅ Protocol update completed (validation skipped)"
fi

echo ""
echo "📚 Next Steps:"
echo "   • Review updated protocols in BestPractices/Generic/"
echo "   • Check for new templates or patterns"
echo "   • Consider contributing improvements back to the protocol repository"
echo "   • Update team documentation if needed"
