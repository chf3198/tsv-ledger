#!/bin/bash

# Comprehensive Testing Workflow for TSV Ledger
# This script provides automated testing with proper server lifecycle management

set -e  # Exit on any error

echo "🧪 TSV Ledger - Comprehensive Automated Testing"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to start server
start_server() {
    print_status "Starting TSV Ledger server..."

    # Kill any existing server processes
    pkill -f "node server.js" || true
    sleep 2

    # Start server in background
    nohup node server.js > server.log 2>&1 &
    SERVER_PID=$!

    # Wait for server to be ready
    print_status "Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Server is ready (PID: $SERVER_PID)"
            return 0
        fi
        sleep 1
    done

    print_error "Server failed to start within 30 seconds"
    cat server.log
    return 1
}

# Function to stop server
stop_server() {
    print_status "Stopping server..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID || true
        wait $SERVER_PID 2>/dev/null || true
        print_success "Server stopped"
    fi
}

# Function to run tests
run_test_suite() {
    local test_name=$1
    local test_command=$2

    print_status "Running $test_name tests..."
    if eval "$test_command"; then
        print_success "$test_name tests passed"
        return 0
    else
        print_error "$test_name tests failed"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    local failures=0

    # Unit tests
    if ! run_test_suite "Unit" "npx jest tests/unit --coverage --coverageDirectory=coverage/unit --passWithNoTests"; then
        ((failures++))
    fi

    # Integration tests
    if ! run_test_suite "Integration" "npx jest tests/integration --coverage --coverageDirectory=coverage/integration --passWithNoTests"; then
        ((failures++))
    fi

    # E2E tests (if Playwright is available)
    if command -v npx &> /dev/null && npx playwright --version &> /dev/null; then
        if ! run_test_suite "E2E" "npx playwright test tests/e2e --headed=false"; then
            ((failures++))
        fi
    else
        print_warning "Playwright not available, skipping E2E tests"
    fi

    # API tests (if Newman is available)
    if command -v newman &> /dev/null; then
        if ! run_test_suite "API" "newman run tests/api/postman-collection.json --reporters cli,json --reporter-json-export api-results.json"; then
            ((failures++))
        fi
    else
        print_warning "Newman not available, skipping API tests"
    fi

    # Performance tests (if Artillery is available)
    if command -v artillery &> /dev/null; then
        if ! run_test_suite "Performance" "artillery run tests/performance/performance.yml --output performance-results.json"; then
            ((failures++))
        fi
    else
        print_warning "Artillery not available, skipping performance tests"
    fi

    return $failures
}

# Function to generate reports
generate_reports() {
    print_status "Generating test reports..."

    # Create reports directory
    mkdir -p tests/reports

    # Combine coverage reports
    if command -v npx &> /dev/null; then
        npx jest --coverage --coverageDirectory=coverage/combined \
            --collectCoverageFrom='src/**/*.js' \
            --collectCoverageFrom='public/js/**/*.js' \
            --collectCoverageFrom='!src/**/*.test.js' \
            --passWithNoTests || true
    fi

    # Generate summary
    echo "=== Test Results Summary ===" > tests/reports/summary.txt
    echo "Date: $(date)" >> tests/reports/summary.txt
    echo "Node Version: $(node --version)" >> tests/reports/summary.txt
    echo "NPM Version: $(npm --version)" >> tests/reports/summary.txt
    echo "" >> tests/reports/summary.txt

    if [ -f coverage/combined/coverage-summary.json ]; then
        echo "Coverage Summary:" >> tests/reports/summary.txt
        cat coverage/combined/coverage-summary.json | jq -r '
            .total | "Lines: \(.lines.pct)% | Functions: \(.functions.pct)% | Branches: \(.branches.pct)% | Statements: \(.statements.pct)%"
        ' >> tests/reports/summary.txt 2>/dev/null || echo "Coverage data available" >> tests/reports/summary.txt
    fi

    print_success "Reports generated in tests/reports/"
}

# Main execution
main() {
    local test_type=${1:-all}
    local failures=0

    print_status "Starting automated testing workflow (type: $test_type)"

    # Trap to ensure server is stopped on exit
    trap stop_server EXIT

    # Start server
    if ! start_server; then
        print_error "Failed to start server"
        exit 1
    fi

    # Wait for server to be fully ready
    sleep 3

    case $test_type in
        "unit")
            if ! run_test_suite "Unit" "npx jest tests/unit --coverage --coverageDirectory=coverage/unit"; then
                failures=1
            fi
            ;;
        "integration")
            if ! run_test_suite "Integration" "npx jest tests/integration --coverage --coverageDirectory=coverage/integration"; then
                failures=1
            fi
            ;;
        "e2e")
            if ! run_test_suite "E2E" "npx playwright test tests/e2e --headed=false"; then
                failures=1
            fi
            ;;
        "all"|*)
            if ! run_all_tests; then
                failures=$?
            fi
            ;;
    esac

    # Generate reports
    generate_reports

    # Summary
    echo ""
    if [ $failures -eq 0 ]; then
        print_success "All tests passed! 🎉"
        exit 0
    else
        print_error "$failures test suite(s) failed"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"