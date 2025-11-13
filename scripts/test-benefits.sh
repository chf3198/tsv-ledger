#!/bin/bash

# Benefits Management Testing CLI
# Version: 2.0
# Purpose: Comprehensive testing framework for Benefits Management functionality
# Tests percentage allocation controls, API endpoints, and UX functionality

set -e

# Configuration
SERVER_URL="http://localhost:3000"
TEST_DATA_DIR="test-data"
TEST_RESULTS_DIR="test-results"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to log test results
log_test() {
    local test_name="$1"
    local result="$2"
    local message="$3"

    ((TESTS_RUN++))
    if [ "$result" = "PASS" ]; then
        ((TESTS_PASSED++))
        echo -e "${GREEN}✅ $test_name: $message${NC}"
    else
        ((TESTS_FAILED++))
        echo -e "${RED}❌ $test_name: $message${NC}"
    fi
}

# Function to check if server is running
check_server() {
    if curl -s --max-time 5 "$SERVER_URL" > /dev/null 2>&1; then
        log_test "Server Check" "PASS" "Server is running at $SERVER_URL"
        return 0
    else
        log_test "Server Check" "FAIL" "Server not running at $SERVER_URL"
        return 1
    fi
}

# Function to test API health
test_api_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL/api/amazon-items" 2>/dev/null)

    if [ "$response" = "200" ]; then
        log_test "API Health Check" "PASS" "Amazon items API accessible"
        return 0
    else
        log_test "API Health Check" "FAIL" "Amazon items API returned $response"
        return 1
    fi
}

# Function to test benefits filter API
test_benefits_filter_api() {
    # Test empty request
    local response=$(curl -s -X POST "$SERVER_URL/api/employee-benefits-filter" \
        -H "Content-Type: application/json" \
        -d '{"itemIds": []}' 2>/dev/null)

    if echo "$response" | grep -q "error"; then
        log_test "Benefits Filter API - Empty" "FAIL" "API should handle empty requests gracefully"
        return 1
    else
        log_test "Benefits Filter API - Empty" "PASS" "API handles empty requests"
    fi

    # Test with percentage allocation
    local test_data='{
        "itemIds": ["test_item_1"],
        "itemAllocations": {"test_item_1": 75}
    }'

    response=$(curl -s -X POST "$SERVER_URL/api/employee-benefits-filter" \
        -H "Content-Type: application/json" \
        -d "$test_data" 2>/dev/null)

    if [ $? -eq 0 ] && echo "$response" | grep -q "allocationPercentage"; then
        log_test "Benefits Filter API - Allocation" "PASS" "API accepts percentage allocations"
        return 0
    else
        log_test "Benefits Filter API - Allocation" "FAIL" "API failed to process percentage allocations"
        return 1
    fi
}

# Function to test cost calculation accuracy
test_cost_calculation_accuracy() {
    echo -e "${BLUE}🧮 Testing Cost Calculation Accuracy...${NC}"

    # Test with known values: $12.99 item with 75% allocation
    # Expected: benefits = $9.74, operational = $3.25
    local test_data='{
        "itemIds": ["test_amazon_001_0"],
        "itemAllocations": {"test_amazon_001_0": 75}
    }'

    local response=$(curl -s -X POST "$SERVER_URL/api/employee-benefits-filter" \
        -H "Content-Type: application/json" \
        -d "$test_data" 2>/dev/null)

    if [ $? -ne 0 ]; then
        log_test "Cost Calculation - API Call" "FAIL" "Failed to call API"
        return 1
    fi

    # Extract calculated values from response
    local benefits_amount=$(echo "$response" | grep -o '"benefitsAmount":[^,]*' | cut -d':' -f2 | tr -d ' ')
    local operational_amount=$(echo "$response" | grep -o '"operationalAmount":[^,]*' | cut -d':' -f2 | tr -d ' ')
    local allocation_percentage=$(echo "$response" | grep -o '"allocationPercentage":[^,]*' | cut -d':' -f2 | tr -d ' ')

    # Expected calculations for $12.99 at 75%
    local expected_benefits="9.74"
    local expected_operational="3.25"
    local expected_total="12.99"

    # Validate allocation percentage
    if [ "$allocation_percentage" = "75" ]; then
        log_test "Cost Calculation - Allocation %" "PASS" "Allocation percentage correctly set to 75%"
    else
        log_test "Cost Calculation - Allocation %" "FAIL" "Expected 75%, got $allocation_percentage"
    fi

    # Validate benefits amount calculation
    if [ "$benefits_amount" = "$expected_benefits" ]; then
        log_test "Cost Calculation - Benefits Amount" "PASS" "Benefits amount correctly calculated as $benefits_amount"
    else
        log_test "Cost Calculation - Benefits Amount" "FAIL" "Expected $expected_benefits, got $benefits_amount"
    fi

    # Validate operational amount calculation
    if [ "$operational_amount" = "$expected_operational" ]; then
        log_test "Cost Calculation - Operational Amount" "PASS" "Operational amount correctly calculated as $operational_amount"
    else
        log_test "Cost Calculation - Operational Amount" "FAIL" "Expected $expected_operational, got $operational_amount"
    fi

    # Validate that benefits + operational = original price
    # Use bc for floating point arithmetic
    local calculated_total=$(echo "$benefits_amount + $operational_amount" | bc 2>/dev/null)
    if [ "$calculated_total" = "$expected_total" ]; then
        log_test "Cost Calculation - Total Split" "PASS" "Benefits + Operational = Original price ($calculated_total)"
    else
        log_test "Cost Calculation - Total Split" "FAIL" "Benefits + Operational should = $expected_total, got $calculated_total"
    fi
}

# Function to test multiple percentage scenarios
test_multiple_percentage_scenarios() {
    echo -e "${BLUE}📊 Testing Multiple Percentage Scenarios...${NC}"

    local scenarios=("0:0.00:12.99" "25:3.25:9.74" "50:6.50:6.49" "75:9.74:3.25" "100:12.99:0.00")
    local item_id="test_amazon_001_0"

    for scenario in "${scenarios[@]}"; do
        local percentage=$(echo "$scenario" | cut -d':' -f1)
        local expected_benefits=$(echo "$scenario" | cut -d':' -f2)
        local expected_operational=$(echo "$scenario" | cut -d':' -f3)

        local test_data="{
            \"itemIds\": [\"$item_id\"],
            \"itemAllocations\": {\"$item_id\": $percentage}
        }"

        local response=$(curl -s -X POST "$SERVER_URL/api/employee-benefits-filter" \
            -H "Content-Type: application/json" \
            -d "$test_data" 2>/dev/null)

        local actual_benefits=$(echo "$response" | grep -o '"benefitsAmount":[^,]*' | cut -d':' -f2 | tr -d ' ')
        local actual_operational=$(echo "$response" | grep -o '"operationalAmount":[^,]*' | cut -d':' -f2 | tr -d ' ')

        if [ "$actual_benefits" = "$expected_benefits" ] && [ "$actual_operational" = "$expected_operational" ]; then
            log_test "Percentage Scenario - ${percentage}%" "PASS" "${percentage}% split: Benefits=\$$actual_benefits, Ops=\$$actual_operational"
        else
            log_test "Percentage Scenario - ${percentage}%" "FAIL" "${percentage}% split failed: Expected Benefits=\$$expected_benefits, Got=\$$actual_benefits"
        fi
    done
}

# Function to test frontend JavaScript functionality (basic smoke test)
test_frontend_js() {
    # Temporarily disable set -e for this function
    set +e
    
    local js_tests_passed=0
    local js_tests_total=0

    # Check if the employee-benefits.js file exists and has expected functions
    if [ -f "public/js/employee-benefits.js" ]; then
        ((js_tests_total++))
        if grep -q "updateAllocation" "public/js/employee-benefits.js" 2>/dev/null; then
            log_test "Frontend JS - updateAllocation" "PASS" "updateAllocation function exists"
            ((js_tests_passed++))
        else
            log_test "Frontend JS - updateAllocation" "FAIL" "updateAllocation function missing"
        fi

        ((js_tests_total++))
        if grep -q "removeItem" "public/js/employee-benefits.js" 2>/dev/null; then
            log_test "Frontend JS - removeItem" "PASS" "removeItem method exists"
            ((js_tests_passed++))
        else
            log_test "Frontend JS - removeItem" "FAIL" "removeItem method missing"
        fi

        ((js_tests_total++))
        if grep -q "updateAddButtonText" "public/js/employee-benefits.js" 2>/dev/null; then
            log_test "Frontend JS - updateAddButtonText" "PASS" "updateAddButtonText method exists"
            ((js_tests_passed++))
        else
            log_test "Frontend JS - updateAddButtonText" "FAIL" "updateAddButtonText method missing"
        fi

        ((js_tests_total++))
        if grep -q "add-to-benefits-btn" "public/js/employee-benefits.js" 2>/dev/null; then
            log_test "Frontend JS - Dynamic Button Classes" "PASS" "Dynamic button classes implemented"
            ((js_tests_passed++))
        else
            log_test "Frontend JS - Dynamic Button Classes" "FAIL" "Dynamic button classes missing"
        fi

        ((js_tests_total++))
        if grep -q "Percentage.*control" "public/js/employee-benefits.js" 2>/dev/null; then
            log_test "Frontend JS - Percentage Controls" "PASS" "Percentage controls implemented"
            ((js_tests_passed++))
        else
            log_test "Frontend JS - Percentage Controls" "FAIL" "Percentage controls not found"
        fi

        ((js_tests_total++))
        if grep -q "percentage-slider" "public/js/employee-benefits.js" 2>/dev/null; then
            log_test "Frontend JS - Slider Classes" "PASS" "Percentage slider classes implemented"
            ((js_tests_passed++))
        else
            log_test "Frontend JS - Slider Classes" "FAIL" "Percentage slider classes missing"
        fi
    else
        log_test "Frontend JS - File Exists" "FAIL" "employee-benefits.js file not found"
        set -e
        return 1
    fi

    # Check HTML file for percentage control styles
    if [ -f "public/employee-benefits.html" ]; then
        ((js_tests_total++))
        if grep -q "percentage-slider" "public/employee-benefits.html" 2>/dev/null; then
            log_test "HTML - Percentage Slider Styles" "PASS" "Percentage slider styles defined"
            ((js_tests_passed++))
        else
            log_test "HTML - Percentage Slider Styles" "FAIL" "Percentage slider styles missing"
        fi

        ((js_tests_total++))
        if grep -q "form-range" "public/employee-benefits.html" 2>/dev/null; then
            log_test "HTML - Range Input Styles" "PASS" "Range input styles defined"
            ((js_tests_passed++))
        else
            log_test "HTML - Range Input Styles" "FAIL" "Range input styles missing"
        fi
    else
        log_test "HTML - File Exists" "FAIL" "employee-benefits.html file not found"
        set -e
        return 1
    fi

    # Re-enable set -e
    set -e
    
    echo -e "${BLUE}Frontend Tests: ${js_tests_passed}/${js_tests_total} passed${NC}"
    return 0
}

# Function to test status loading functionality
test_status_loading() {
    echo -e "${BLUE}🔄 Testing status loading functionality...${NC}"

    # Test that API returns data quickly
    local start_time=$(date +%s)
    local response=$(curl -s --max-time 10 "$SERVER_URL/api/amazon-items?businessCard=true" 2>/dev/null)
    local end_time=$(date +%s)

    if [ $? -ne 0 ]; then
        log_test "Status Loading - API Response" "FAIL" "API call failed or timed out"
        return 1
    fi

    local duration=$((end_time - start_time))
    echo -e "${BLUE}API response time: ${duration}s${NC}"

    if [ $duration -gt 5 ]; then
        log_test "Status Loading - Response Time" "FAIL" "API response took longer than 5 seconds: ${duration}s"
        return 1
    else
        log_test "Status Loading - Response Time" "PASS" "API responded in ${duration}s"
    fi

    # Test that response contains valid data
    if [ -z "$response" ] || [ "$response" = "[]" ]; then
        log_test "Status Loading - Data Validation" "FAIL" "API returned no items"
        return 1
    fi

    # Count items by counting occurrences of "id": in the response
    local item_count=$(echo "$response" | grep -o '"id":' | wc -l)
    if [ "$item_count" -eq 0 ]; then
        log_test "Status Loading - Data Validation" "FAIL" "API returned no items"
        return 1
    fi

    log_test "Status Loading - Data Validation" "PASS" "API returned $item_count items"

    # Test that items have required fields for status calculation
    if ! echo "$response" | grep -q '"id":' || ! echo "$response" | grep -q '"price":' || ! echo "$response" | grep -q '"name":'; then
        log_test "Status Loading - Data Structure" "FAIL" "Items missing required fields (id, price, name)"
        return 1
    fi

    log_test "Status Loading - Data Structure" "PASS" "Items have required fields for status calculation"
}

# Function to setup test environment
setup_test_environment() {
    echo -e "${BLUE}🔧 Setting up test environment...${NC}"

    mkdir -p "$TEST_DATA_DIR"
    mkdir -p "$TEST_RESULTS_DIR"

    # Create test data
    cat > "$TEST_DATA_DIR/sample-amazon-items.json" << 'EOF'
[
  {
    "id": "test_amazon_001_0",
    "name": "Paper Plates - 50 Count",
    "price": 12.99,
    "date": "2025-09-15",
    "orderId": "test_amazon_001",
    "category": "kitchen_equipment"
  },
  {
    "id": "test_amazon_002_0",
    "name": "Coffee Filters - 100 Count",
    "price": 8.50,
    "date": "2025-09-14",
    "orderId": "test_amazon_002",
    "category": "kitchen_equipment"
  }
]
EOF

    echo -e "${GREEN}✅ Test environment setup complete${NC}"
}

# Function to run all tests
run_all_tests() {
    # Disable set -e for this function to allow tests to continue
    set +e
    
    echo -e "${BLUE}🧪 Running Benefits Management Tests...${NC}"
    echo "========================================"

    # Setup
    setup_test_environment

    # Basic connectivity tests
    check_server
    local server_running=$?

    if [ $server_running -eq 0 ]; then
        # API functionality tests
        test_api_health
        test_benefits_filter_api
        test_percentage_allocation_edge_cases
        test_cost_calculation_accuracy
        test_multiple_percentage_scenarios
        test_status_loading
    else
        echo -e "${YELLOW}⚠️  Server not running - skipping API tests${NC}"
        echo -e "${YELLOW}💡 Start server with: npm start${NC}"
    fi

    # Frontend tests (always run)
    test_frontend_js

    # Re-enable set -e
    set -e
    
    # Summary
    echo ""
    echo -e "${BLUE}📊 Test Summary:${NC}"
    echo "Tests Run: $TESTS_RUN"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}⚠️  Some tests failed. Check the output above.${NC}"
        return 1
    fi
}

# Function to clean test artifacts
clean_test_artifacts() {
    rm -rf "$TEST_DATA_DIR" "$TEST_RESULTS_DIR"
    echo -e "${GREEN}✅ Test artifacts cleaned${NC}"
}

# Main execution logic
main() {
    local command="$1"

    case $command in
        setup)
            setup_test_environment
            ;;
        server)
            check_server
            ;;
        api)
            check_server && test_api_health && test_benefits_filter_api
            ;;
        allocation)
            check_server && test_percentage_allocation_edge_cases && test_cost_calculation_accuracy && test_multiple_percentage_scenarios
            ;;
        frontend)
            test_frontend_js
            ;;
        status)
            test_status_loading
            ;;
        all)
            run_all_tests
            ;;
        clean)
            clean_test_artifacts
            ;;
        *)
            echo "Benefits Management Testing CLI v2.0"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  setup      - Setup test environment"
            echo "  server     - Test server connectivity"
            echo "  api        - Test API endpoints"
            echo "  allocation - Test percentage allocation & cost calculations"
            echo "  frontend   - Test frontend JavaScript"
            echo "  all        - Run all tests"
            echo "  clean      - Clean test artifacts"
            echo ""
            echo "Examples:"
            echo "  $0 setup"
            echo "  $0 all"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
