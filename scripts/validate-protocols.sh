#!/bin/bash
# validate-protocols.sh - TSV Ledger Protocol Validation
# Validates that knowledge transfer protocols are properly implemented

set -e

echo "🔍 TSV Ledger Protocol Validation"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to report success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to report warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# Function to report error
error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

# Check required directories
echo "📁 Checking directory structure..."
REQUIRED_DIRS=("src" "tests" "docs" "BestPractices" "BestPractices/Generic" "BestPractices/ProjectSpecific")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        success "Directory $dir exists"
    else
        error "Missing required directory: $dir"
    fi
done

# Check for protocol version tracking
echo ""
echo "🏷️  Checking protocol version tracking..."
if [ -f "BestPractices/.protocol-version" ]; then
    VERSION=$(cat BestPractices/.protocol-version)
    success "Protocol version: $VERSION"
else
    error "Protocol version file missing"
fi

# Check for clean root directory
echo ""
echo "🧹 Checking root directory cleanliness..."
ROOT_FILES=$(find . -maxdepth 1 -type f | wc -l)
if [ $ROOT_FILES -le 8 ]; then
    success "Clean root directory ($ROOT_FILES files)"
else
    warning "Root directory has $ROOT_FILES files (recommended: ≤8)"
fi

# Check required documentation
echo ""
echo "📚 Checking documentation completeness..."
REQUIRED_DOCS=(
    "README.md"
    "BestPractices/ProjectSpecific/HANDOFF_GUIDE.md"
    "BestPractices/ProjectSpecific/BusinessDomainKnowledge.md"
    "BestPractices/ProjectSpecific/TechnicalArchitecture.md"
    "BestPractices/ProjectSpecific/API_DOCUMENTATION.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        # Check if file has substantial content
        LINES=$(wc -l < "$doc")
        if [ $LINES -ge 10 ]; then
            success "$doc (${LINES} lines)"
        else
            warning "$doc exists but may be incomplete (${LINES} lines)"
        fi
    else
        error "Missing documentation: $doc"
    fi
done

# Check Generic protocols
echo ""
echo "🔧 Checking Generic protocols..."
GENERIC_PROTOCOLS=(
    "BestPractices/Generic/CodeOrganizationFramework.md"
    "BestPractices/Generic/DocumentationFramework.md"
    "BestPractices/Generic/GitWorkflowPatterns.md"
)

for protocol in "${GENERIC_PROTOCOLS[@]}"; do
    if [ -f "$protocol" ]; then
        success "$(basename "$protocol")"
    else
        error "Missing protocol: $protocol"
    fi
done

# Check TSV Ledger specific implementations
echo ""
echo "🏢 Checking TSV Ledger specific implementations..."

# Check for AI system documentation
if grep -q "AI" BestPractices/ProjectSpecific/TechnicalArchitecture.md 2>/dev/null; then
    success "AI system documentation present"
else
    warning "AI system documentation not found in TechnicalArchitecture.md"
fi

# Check for business domain coverage
if grep -q "Texas Sunset Venues\|property management\|Subscribe & Save" BestPractices/ProjectSpecific/BusinessDomainKnowledge.md 2>/dev/null; then
    success "Business domain knowledge captured"
else
    warning "Business domain specifics not found in BusinessDomainKnowledge.md"
fi

# Check source code organization
echo ""
echo "💾 Checking source code organization..."
SRC_MODULES=("database.js" "tsv-categorizer.js" "ai-analysis-engine.js")

for module in "${SRC_MODULES[@]}"; do
    if [ -f "src/$module" ]; then
        success "Core module: $module"
    else
        error "Missing core module: src/$module"
    fi
done

# Check testing framework
echo ""
echo "🧪 Checking testing framework..."
if [ -d "tests" ]; then
    # Count actual test files (excluding hidden/temp files)
    TEST_FILES=$(find tests -name "*.js" -not -name ".*" -not -name ".fuse_hidden*" | wc -l)
    if [ $TEST_FILES -gt 0 ]; then
        success "Testing framework with $TEST_FILES test files"
    else
        warning "Tests directory exists but no test files found"
    fi
else
    error "Tests directory missing"
fi

# Check package.json
echo ""
echo "📦 Checking package configuration..."
if [ -f "package.json" ]; then
    if grep -q "test" package.json; then
        success "Test scripts configured in package.json"
    else
        warning "No test scripts found in package.json"
    fi
    
    if grep -q "version" package.json; then
        VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
        success "Project version: $VERSION"
    else
        warning "No version found in package.json"
    fi
else
    error "package.json missing"
fi

# Check Git workflow
echo ""
echo "🔀 Checking Git workflow..."
if [ -d ".git" ]; then
    success "Git repository initialized"
    
    # Check for meaningful commit history
    COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    if [ $COMMITS -gt 5 ]; then
        success "Active development history ($COMMITS commits)"
    else
        warning "Limited commit history ($COMMITS commits)"
    fi
    
    # Check for feature branches
    BRANCHES=$(git branch -a | wc -l)
    if [ $BRANCHES -gt 1 ]; then
        success "Multiple branches for feature development"
    else
        warning "Only one branch found (consider using feature branches)"
    fi
else
    error "Not a Git repository"
fi

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed! TSV Ledger protocols are perfectly implemented.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}✅ Validation passed with $WARNINGS warnings.${NC}"
    echo "Consider addressing warnings for optimal implementation."
    exit 0
else
    echo -e "${RED}❌ Validation failed with $ERRORS errors and $WARNINGS warnings.${NC}"
    echo "Please address the errors before proceeding."
    exit 1
fi
